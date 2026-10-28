// Verifies the one-time code with Twilio Verify; codes are never stored by SMARAK.
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: secret, TWILIO_VERIFY_SERVICE_SID: service } = process.env;
  if (!sid || !secret || !service) return res.status(503).json({ error: 'SMS provider not configured' });
  const phone = String(req.body?.phone ?? '').trim();
  const code = String(req.body?.code ?? '').trim();
  if (!/^\+[1-9]\d{7,14}$/.test(phone) || !/^\d{4,10}$/.test(code)) return res.status(400).json({ ok: false });

  try {
    const auth = Buffer.from(`${sid}:${secret}`).toString('base64');
    const response = await fetch(`https://verify.twilio.com/v2/Services/${service}/VerificationCheck`, {
      method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: phone, Code: code }),
    });
    if (!response.ok) return res.status(502).json({ ok: false });
    const result: any = await response.json();
    return res.status(result.status === 'approved' ? 200 : 401).json({ ok: result.status === 'approved' });
  } catch { return res.status(502).json({ ok: false }); }
}
