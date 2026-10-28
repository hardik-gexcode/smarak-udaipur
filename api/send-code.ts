// Sends a 6-digit verification code by real email.
// Option A (easiest, any recipient): Gmail SMTP  -> env SMTP_USER (your gmail) + SMTP_PASS (a Google "App password").
// Option B: Resend                               -> env RESEND_API_KEY (+ a verified domain in MAIL_FROM to reach everyone).
// Both need AUTH_SECRET (any long random string).
import { randomInt } from 'node:crypto';
import nodemailer from 'nodemailer';
import { cors, makeToken } from './_sign';

export default async function handler(req: any, res: any) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const smtp = process.env.SMTP_USER && process.env.SMTP_PASS;
  if ((!smtp && !process.env.RESEND_API_KEY) || !process.env.AUTH_SECRET) return res.status(503).json({ error: 'email not configured' });

  const email = String(req.body?.email ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120) return res.status(400).json({ error: 'bad email' });

  const code = String(randomInt(100000, 1000000));
  const subject = `Your SMARAK verification code: ${code}`;
  const html = `<p>Namaste! Your SMARAK verification code is</p><h2 style="letter-spacing:6px">${code}</h2><p>It expires in 10 minutes. If you did not request it, ignore this email.</p>`;
  try {
    if (smtp) {
      const tx = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
      await tx.sendMail({ from: process.env.MAIL_FROM || `SMARAK <${process.env.SMTP_USER}>`, to: email, subject, html });
    } else {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({ from: process.env.MAIL_FROM || 'SMARAK <onboarding@resend.dev>', to: [email], subject, html }),
      });
      if (!r.ok) return res.status(502).json({ error: 'mail provider rejected the request' });
    }
    return res.status(200).json({ token: makeToken(email, code) });
  } catch {
    return res.status(502).json({ error: 'mail failure' });
  }
}
