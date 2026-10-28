// Keyless regional text translation. The client sends small batches through this
// same-origin Vercel function so browsers and installed PWAs share the same path.
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { lang, strings } = req.body ?? {};
  if (typeof lang !== 'string' || !/^[a-z]{2,3}$/i.test(lang) || typeof strings !== 'object' || !strings || Array.isArray(strings)) {
    return res.status(400).json({ error: 'bad request' });
  }
  const entries = Object.entries(strings as Record<string, unknown>);
  if (!entries.length || entries.length > 30 || entries.some(([, v]) => typeof v !== 'string') || entries.reduce((n, [, v]) => n + String(v).length, 0) > 4000) {
    return res.status(413).json({ error: 'translation batch too large' });
  }

  const translated: Record<string, string> = {};
  // Provider aliases for entries whose app codes differ from service codes.
  const googleLang = ({ nb: 'no', kok: 'gom' } as Record<string, string>)[lang] ?? lang;
  const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
  const google = async (text: string) => {
    const url = new URL('https://translate.googleapis.com/translate_a/single');
    url.searchParams.set('client', 'gtx');
    url.searchParams.set('sl', 'en');
    url.searchParams.set('tl', googleLang);
    url.searchParams.set('dt', 't');
    url.searchParams.set('q', text);
    const response = await fetch(url, { headers: { 'User-Agent': chromeUA, 'Accept-Language': 'en-US,en;q=0.9' }, signal: AbortSignal.timeout(2500) });
    if (!response.ok) return '';
    const data: any = await response.json();
    return data?.[0]?.map((part: any) => part?.[0] ?? '').join('').trim() || '';
  };
  const lingva = async (text: string) => {
    const target = googleLang;
    const hosts = ['lingva.ml', 'translate.igna.wtf', 'lingva.lunar.icu'];
    for (const host of hosts) {
      try {
        const url = `https://${host}/api/v1/en/${encodeURIComponent(target)}/${encodeURIComponent(text)}`;
        const response = await fetch(url, { headers: { 'User-Agent': chromeUA }, signal: AbortSignal.timeout(2000) });
        if (!response.ok) continue;
        const data: any = await response.json();
        if (typeof data?.translation === 'string' && data.translation.trim()) return data.translation.trim();
      } catch { /* try the next public instance */ }
    }
    return '';
  };
  const libre = async (text: string) => {
    const hosts = ['translate.argosopentech.com', 'translate.mentality.rip'];
    for (const host of hosts) {
      try {
        const response = await fetch(`https://${host}/translate`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': chromeUA },
          body: JSON.stringify({ q: text, source: 'en', target: googleLang }), signal: AbortSignal.timeout(2000),
        });
        if (!response.ok) continue;
        const data: any = await response.json();
        if (typeof data?.translatedText === 'string' && data.translatedText.trim()) return data.translatedText.trim();
      } catch { /* try the next public instance */ }
    }
    return '';
  };
  let cursor = 0;
  const workers = Array.from({ length: Math.min(10, entries.length) }, async () => {
    while (cursor < entries.length) {
      const index = cursor++;
      const [key, value] = entries[index] as [string, string];
      let output = '';
      try { output = await google(value); } catch { /* try alternate translators */ }
      if (!output) output = await lingva(value);
      if (!output) output = await libre(value);
      if (output) translated[key] = output;
    }
  });
  await Promise.all(workers);

  const usable = Object.keys(translated).length;
  if (!usable) return res.status(502).json({ error: 'translation provider unavailable', translated: 0, expected: entries.length });
  return res.status(200).json({ strings: translated });
}
