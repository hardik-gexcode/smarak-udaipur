// Optional: consistent Indian-accent voices (en-IN / hi-IN) from Google Cloud Text-to-Speech, key kept on the server.
// Enable the "Cloud Text-to-Speech API" in Google Cloud, create an API key, set GOOGLE_TTS_API_KEY in Vercel.
const VOICES: Record<string, Record<string, string>> = {
  en: { f: 'en-IN-Neural2-A', m: 'en-IN-Neural2-B' },
  hi: { f: 'hi-IN-Neural2-A', m: 'hi-IN-Neural2-B' },
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.GOOGLE_TTS_API_KEY;
  if (!key) return res.status(503).json({ error: 'GOOGLE_TTS_API_KEY not set' });

  const { text, lang, gender } = req.body ?? {};
  if (typeof text !== 'string' || !text || text.length > 600) return res.status(400).json({ error: 'bad text' });
  const l = lang === 'hi' ? 'hi' : lang === 'en' ? 'en' : 'other';
  const locale = typeof req.body?.locale === 'string' && /^[a-z]{2,3}-[A-Z]{2}$/.test(req.body.locale) ? req.body.locale : 'en-IN';
  // en-IN and hi-IN use named Neural2 voices; other languages use Google's default voice for the locale and gender.
  const voice = l === 'other' ? { languageCode: locale, ssmlGender: gender === 'm' ? 'MALE' : 'FEMALE' } : { languageCode: locale, name: VOICES[l][gender === 'm' ? 'm' : 'f'] };

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
    return j.audioContent ? res.status(200).json({ audio: j.audioContent }) : res.status(502).json({ error: 'no audio' });
  } catch {
    return res.status(502).json({ error: 'upstream failure' });
  }
}
