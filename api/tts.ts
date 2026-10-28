// Speech for en-IN / hi-IN and supported selected-language voices from Google Cloud Text-to-Speech; key stays on the server.
// Enable the "Cloud Text-to-Speech API" in Google Cloud, create an API key, set GOOGLE_TTS_API_KEY in Vercel.
const VOICES: Record<string, Record<string, string>> = {
  en: { f: 'en-IN-Neural2-A', m: 'en-IN-Neural2-B' },
  hi: { f: 'hi-IN-Neural2-A', m: 'hi-IN-Neural2-B' },
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.GOOGLE_TTS_API_KEY;

  const { text, lang, gender } = req.body ?? {};
  if (typeof text !== 'string' || !text || text.length > 600) return res.status(400).json({ error: 'bad text' });
  const l = lang === 'hi' ? 'hi' : lang === 'en' ? 'en' : 'other';
  const locale = typeof req.body?.locale === 'string' && /^[a-z]{2,3}-[A-Z]{2}$/.test(req.body.locale) ? req.body.locale : 'en-IN';
  const voice = l === 'other' ? { languageCode: locale, ssmlGender: gender === 'm' ? 'MALE' : 'FEMALE' } : { languageCode: locale, name: VOICES[l][gender === 'm' ? 'm' : 'f'] };

  if (key) {
    try {
      const r = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          input: { text },
          voice,
          audioConfig: { audioEncoding: 'MP3', speakingRate: 0.96 },
        }),
      });
      const j: any = await r.json();
      if (j.audioContent) return res.status(200).json({ audio: j.audioContent });
    } catch {}
  }

  // Free TTS fallback audio stream
  try {
    const ttsLang = lang === 'hi' ? 'hi' : lang === 'en' ? 'en' : (lang || 'en');
    const freeUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(ttsLang)}&client=tw-ob&q=${encodeURIComponent(text.slice(0, 200))}`;
    const freeRes = await fetch(freeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (freeRes.ok) {
      const buf = Buffer.from(await freeRes.arrayBuffer());
      return res.status(200).json({ audio: buf.toString('base64') });
    }
  } catch {}

  return res.status(502).json({ error: 'tts unavailable' });
}
