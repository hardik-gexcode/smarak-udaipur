/** Issues a one-use Gemini Live token. The permanent Gemini key remains server-side. */
export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured in Vercel' });
  const { place, lang, context } = req.body ?? {};
  if (typeof place !== 'string' || place.length > 100 || typeof lang !== 'string' || lang.length > 50 || typeof context !== 'string' || context.length > 4000) {
    return res.status(400).json({ error: 'Invalid voice session context' });
  }
  const instructions = [
    'You are SMARAK, a warm, concise Mewar heritage guide in a live spoken conversation.',
    `Speak naturally in ${lang}. In English, use clear Indian English phrasing and pronunciation without caricature.`,
    `The current place is ${place}. Use these supplied facts as your primary source: ${context}`,
    'Answer the visitor’s actual question in two or three short spoken sentences. Do not repeat a canned greeting each turn. If uncertain, say so. Never invent opening hours, ticket prices, safety conditions, or historical facts. Let the visitor interrupt you.',
  ].join('\n');
  const model = process.env.GEMINI_LIVE_MODEL || 'gemini-3.8-live';
  try {
    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/auth_tokens', {
      method: 'POST',
      headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uses: 1,
        expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(Date.now() + 60 * 1000).toISOString(),
        liveConnectConstraints: {
          model: `models/${model}`,
          config: {
            responseModalities: ['AUDIO'],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: { parts: [{ text: instructions }] },
          },
        },
      }),
    });
    const body = await upstream.json();
    if (!upstream.ok || typeof body?.name !== 'string') return res.status(upstream.status === 401 || upstream.status === 403 ? 503 : 502).json({ error: 'Gemini could not issue a Live API token. Check API key and Live model access.' });
    return res.status(200).json({ token: body.name, model });
  } catch {
    return res.status(502).json({ error: 'Gemini Live API is unreachable' });
  }
}
