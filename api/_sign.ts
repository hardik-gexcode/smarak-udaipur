import { createHmac, timingSafeEqual } from 'node:crypto';

// Stateless email codes: the server never stores the code, only signs (email, expiry, code) with AUTH_SECRET.
const mac = (s: string) => createHmac('sha256', process.env.AUTH_SECRET || '').update(s).digest('base64url');

export const makeToken = (email: string, code: string, ttlSeconds = 600) => {
  const body = `${email}|${Math.floor(Date.now() / 1000) + ttlSeconds}`;
  return `${Buffer.from(body).toString('base64url')}.${mac(`${body}|${code}`)}`;
};

export const checkToken = (token: string, email: string, code: string) => {
  const [b, sig] = String(token).split('.');
  if (!b || !sig) return false;
  const body = Buffer.from(b, 'base64url').toString();
  const [e, exp] = body.split('|');
  if (e !== email || Number(exp) < Date.now() / 1000) return false;
  const a = Buffer.from(sig), c = Buffer.from(mac(`${body}|${code}`));
  return a.length === c.length && timingSafeEqual(a, c);
};

export const cors = (res: any) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
};
