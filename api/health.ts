// Safe deployment diagnostics: reports configured features without exposing credentials.
export default function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const email = !!process.env.AUTH_SECRET && !!(
    (process.env.SMTP_USER && process.env.SMTP_PASS) || process.env.RESEND_API_KEY
  );
  const phone = !!(
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID
  );

  return res.status(200).json({
    google: !!process.env.VITE_GOOGLE_CLIENT_ID,
    email,
    phone,
    translationAndAiGuide: !!process.env.GEMINI_API_KEY,
    cloudSpeech: !!process.env.GOOGLE_TTS_API_KEY,
  });
}
