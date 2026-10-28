import { useEffect, useRef, useState } from 'react';
import { googleConfigured, isNative, nativeGoogle, renderGoogleButton, sendCode, sendPhoneCode, verifyCode, verifyPhoneCode } from '../lib/auth';
import { useApp } from '../lib/app';
import { GoogleG, Icon, LangToggle } from '../ui';

export default function Login() {
  const { t, signIn } = useApp();
  const gRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [step, setStep] = useState<'start' | 'code'>('start');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  // On the web the official Google button is rendered (it carries Google's logo). In the APK a native account picker is used.
  useEffect(() => {
    if (googleConfigured && !isNative && gRef.current) renderGoogleButton(gRef.current, signIn).catch(() => setMsg(t('loginFail')));
  }, []);

  const google = async () => {
    if (!googleConfigured) return setMsg(t('googleOff'));
    try { setBusy(true); signIn(await nativeGoogle()); } catch { setMsg(t('loginFail')); } finally { setBusy(false); }
  };

  const send = async () => {
    if (method === 'phone') {
      const p = phone.replace(/[\s()-]/g, '');
      if (!/^\+[1-9]\d{7,14}$/.test(p)) return setMsg(t('badPhone'));
      setBusy(true); setMsg('');
      const result = await sendPhoneCode(p);
      setBusy(false);
      if (!result.error) { setPhone(p); setCode(''); setStep('code'); }
      else setMsg(result.error === 'not-configured' ? t('phoneOff') : result.error === 'bad-phone' ? t('badPhone') : t('sendFail'));
      return;
    }
    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return setMsg(t('badEmail'));
    setBusy(true); setMsg('');
    const r = await sendCode(e);
    setBusy(false);
    if (r.token) { setEmail(e); setToken(r.token); setCode(''); setStep('code'); }
    else setMsg(r.error === 'not-configured' ? t('emailOff') : r.error === 'bad-email' ? t('badEmail') : t('sendFail'));
  };

  const verify = async () => {
    setBusy(true); setMsg('');
    const ok = method === 'phone'
      ? await verifyPhoneCode(phone, code.trim())
      : await verifyCode(email, code.trim(), token);
    setBusy(false);
    if (ok) signIn(method === 'phone'
      ? { method: 'phone', name: 'Traveller', phone }
      : { method: 'email', name: email.split('@')[0], email });
    else setMsg(t('badCode'));
  };

  return (
    <div className="scroll" style={{ paddingBottom: 30 }}>
      <div className="hero" style={{ padding: '40px 20px 120px' }}>
        <div className="top"><LangToggle /></div>
        <img src="/logo.png" alt="SMARAK" width={112} height={112} style={{ borderRadius: 28, boxShadow: '0 14px 30px rgba(0,0,0,.28)' }} />
        <h1 style={{ fontSize: 34, marginTop: 14 }}>{t('welcomeMewar')}</h1>
        <small style={{ fontSize: 15, opacity: .95, marginTop: 8 }}>{t('regionTag')}</small>
        <small style={{ fontSize: 14, opacity: .85, marginTop: 4 }}>{t('welcomeSub')}</small>
      </div>

      <div className="card panel" style={{ margin: '-70px 16px 0', position: 'relative' }}>
        <h3 style={{ textAlign: 'center' }}>{t('signIn')}</h3>
        {googleConfigured && !isNative
          ? <div ref={gRef} style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }} />
          : <button className="gbtn" disabled={busy} onClick={google}><GoogleG />{t('continueGoogle')}</button>}

        <div className="src" style={{ textAlign: 'center' }}>{t('orEmail')}</div>

        <div className="seg" style={{ margin: '0 auto 12px', width: '100%' }}>
          <button className={method === 'email' ? 'on' : ''} disabled={step === 'code' || busy} onClick={() => { setMethod('email'); setMsg(''); }}>{t('emailMethod')}</button>
          <button className={method === 'phone' ? 'on' : ''} disabled={step === 'code' || busy} onClick={() => { setMethod('phone'); setMsg(''); }}>{t('phoneMethod')}</button>
        </div>

        {step === 'start' ? (
          <>
            {method === 'email'
              ? <input className="input" type="email" inputMode="email" autoComplete="email" placeholder={t('emailPh')} value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
              : <input className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder={t('phonePh')} value={phone} onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />}
            <button className="btn-dark" disabled={busy} onClick={send}><Icon n={method === 'email' ? 'mail' : 'phone'} size={22} />{t('sendCode')}</button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 15 }}>{method === 'email' ? t('codeSentTo') : t('codeSentPhone')} <b>{method === 'email' ? email : phone}</b>. {method === 'email' && t('checkSpam')}</p>
            <input className="input" inputMode="numeric" maxLength={6} autoComplete="one-time-code" placeholder={t('codePh')} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && verify()} style={{ letterSpacing: 6, textAlign: 'center', fontSize: 22 }} />
            <button className="btn-dark" disabled={busy || code.length !== 6} onClick={verify}><Icon n="check" size={22} />{t('verify')}</button>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="src" onClick={send}>{t('resend')}</button>
              <button className="src" onClick={() => { setStep('start'); setMsg(''); }}>{method === 'email' ? t('changeEmail') : t('changePhone')}</button>
            </div>
          </>
        )}
        {msg && <div className="src" style={{ color: '#c0261c', fontSize: 14 }}>{msg}</div>}
      </div>

      <div className="pad" style={{ marginTop: 18, textAlign: 'center' }}>
        <button className="pill" style={{ margin: '0 auto' }} onClick={() => signIn({ method: 'guest', name: '' })}>{t('guest')}</button>
      </div>
    </div>
  );
}
