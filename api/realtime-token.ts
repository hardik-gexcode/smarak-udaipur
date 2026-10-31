/** Creates a short-lived browser credential for the live voice guide. The API key stays on Vercel. */
export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(503).json({ error: 'OPENAI_API_KEY is not configured' });

  const { place, lang, context } = req.body ?? {};
  if (typeof place !== 'string' || place.length > 100 || typeof lang !== 'string' || lang.length > 50 || typeof context !== 'string' || context.length > 4000) {
    return res.status(400).json({ error: 'Invalid voice session context' });
  }
  const instructions = [
    'You are SMARAK, a warm, concise Mewar heritage guide in a live spoken conversation.',
    `The visitor selected ${lang}. Speak in that language. For English, use natural Indian English pronunciation and phrasing; do not caricature an accent.`,
    `The current place is ${place}. Use these supplied facts as your primary source: ${context}`,
    'Answer the visitor’s actual question in two or three short spoken sentences. Do not repeat a canned greeting each turn. If uncertain, say so. Never invent opening hours, ticket prices, safety conditions, or historical facts. Let the visitor interrupt you.',
  ].join('\n');
  try {
    const upstream = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: { type: 'realtime', model: 'gpt-realtime-2.1', instructions, audio: { output: { voice: 'marin' } } } }),
    });
    const body = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status === 401 ? 503 : 502).json({ error: 'Could not start the live voice service' });
    return res.status(200).json({ value: body?.value, expires_at: body?.expires_at });
  } catch {
    return res.status(502).json({ error: 'Live voice service is unreachable' });
  }
}
