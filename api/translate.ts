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
  // Google's consumer endpoint uses ISO-639 aliases for these two entries.
  const googleLang = ({ nb: 'no', kok: 'gom' } as Record<string, string>)[lang] ?? lang;
  let cursor = 0;
  const workers = Array.from({ length: Math.min(5, entries.length) }, async () => {
    while (cursor < entries.length) {
      const index = cursor++;
      const [key, value] = entries[index] as [string, string];
      const url = new URL('https://translate.googleapis.com/translate_a/single');
      url.searchParams.set('client', 'gtx');
      url.searchParams.set('sl', 'en');
      url.searchParams.set('tl', googleLang);
      url.searchParams.set('dt', 't');
      url.searchParams.set('q', value);

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(3000) });
          if (response.ok) {
            const data: any = await response.json();
            const output = data?.[0]?.map((part: any) => part?.[0] ?? '').join('').trim();
            if (output) { translated[key] = output; break; }
          }
          if (response.status !== 429 && response.status < 500) break;
        } catch { /* retry transient network failures */ }
        if (attempt < 1) await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
  });
  await Promise.all(workers);

  const usable = Object.keys(translated).length;
  if (!usable) return res.status(502).json({ error: 'translation provider unavailable', translated: 0, expected: entries.length });
  return res.status(200).json({ strings: translated });
}
