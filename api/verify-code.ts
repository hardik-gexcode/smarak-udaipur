import { checkToken, cors } from './_sign';

export default async function handler(req: any, res: any) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { email, code, token } = req.body ?? {};
  const ok = typeof email === 'string' && /^\d{6}$/.test(String(code)) && checkToken(token, email.trim().toLowerCase(), String(code));
  return res.status(ok ? 200 : 401).json({ ok });
}
