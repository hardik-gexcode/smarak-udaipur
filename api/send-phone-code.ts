// Sends an SMS verification code through Twilio Verify. Phone numbers must be E.164.
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: secret, TWILIO_VERIFY_SERVICE_SID: service } = process.env;
  if (!sid || !secret || !service) return res.status(503).json({ error: 'SMS provider not configured' });
  const phone = String(req.body?.phone ?? '').trim();
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) return res.status(400).json({ error: 'phone must be E.164' });

  try {
    const auth = Buffer.from(`${sid}:${secret}`).toString('base64');
    const response = await fetch(`https://verify.twilio.com/v2/Services/${service}/Verifications`, {
      method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: phone, Channel: 'sms' }),
    });
    if (!response.ok) return res.status(502).json({ error: 'SMS provider rejected request' });
    return res.status(200).json({ sent: true });
  } catch { return res.status(502).json({ error: 'SMS provider unavailable' }); }
}
