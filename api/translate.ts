// Translates app strings with Gemini so any traveller can use the app in their own language.
// Env: GEMINI_API_KEY (and optionally GEMINI_MODEL). The client caches the result on the device.
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: 'GEMINI_API_KEY not set' });

  const { lang, langName, strings } = req.body ?? {};
  if (!langName || typeof strings !== 'object' || !strings) return res.status(400).json({ error: 'bad request' });
  const entries = Object.entries(strings as Record<string, string>);
  if (entries.length > 60 || entries.reduce((n, [, v]) => n + String(v).length, 0) > 9000) return res.status(413).json({ error: 'too large' });

  const prompt =
    `Translate the values of this JSON object from English into ${String(langName).slice(0, 40)} (${String(lang).slice(0, 8)}). ` +
    `Keep every key exactly as is. Keep placeholders like {name}, {d}, {h}, {p}, {c} unchanged. Keep brand and place names ` +
    `(SMARAK, Udaipur, Chittorgarh, Eklingji, Shrinathji, etc.) in their usual form for that language. Use natural, friendly tourist-guide wording. ` +
    `Return ONLY the JSON object.\n${JSON.stringify(strings)}`;

  try {
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, responseMimeType: 'application/json', maxOutputTokens: 8192 } }),
    });
    const j: any = await r.json();
    const text = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '';
    const out = JSON.parse(text);
    const clean: Record<string, string> = {};
    for (const [k] of entries) if (typeof out[k] === 'string') clean[k] = out[k];
    return Object.keys(clean).length ? res.status(200).json({ strings: clean }) : res.status(502).json({ error: 'empty' });
  } catch {
    return res.status(502).json({ error: 'upstream failure' });
  }
}
