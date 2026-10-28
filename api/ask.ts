// Optional online escalation (Vercel serverless function). The Gemini key stays on the server.
// Deploy: `vercel` then set GEMINI_API_KEY in the project settings. The app falls back to its offline guide if this is unreachable.
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: 'GEMINI_API_KEY not set' });

  const { q, lang, langName, site, context } = req.body ?? {};
  if (!q || typeof q !== 'string' || q.length > 300) return res.status(400).json({ error: 'bad question' });

  const prompt =
    `You are SMARAK, a warm, accurate heritage guide for Udaipur, Rajasthan. ` +
    `Answer in ${lang === 'hi' ? 'Hindi (Devanagari script)' : String(langName || 'English').slice(0, 40)}, in at most 3 short spoken-style sentences. ` +
    `Use the facts given and well-established history only. If you are not sure, say so instead of guessing.\n` +
    `Site: ${String(site).slice(0, 80)}\nFacts: ${String(context).slice(0, 1500)}\nVisitor question: ${q}`;

  try {
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 300, temperature: 0.4 } }),
    });
    const j: any = await r.json();
    const text = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('').trim();
    return text ? res.status(200).json({ text }) : res.status(502).json({ error: 'empty response' });
  } catch {
    return res.status(502).json({ error: 'upstream failure' });
  }
}
