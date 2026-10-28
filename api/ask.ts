// Ask Guide is intentionally offline-only. GEMINI_API_KEY is reserved for translation.
export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(410).json({ error: 'Ask Guide uses the offline heritage pack.' });
}
