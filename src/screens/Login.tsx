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
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleName, setGoogleName] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');

  // On the web the official Google button is rendered (it carries Google's logo). In the APK a native account picker is used.
  useEffect(() => {
    if (googleConfigured && !isNative && gRef.current) renderGoogleButton(gRef.current, signIn).catch(() => setMsg(t('loginFail')));
  }, []);

  const google = async () => {
    if (!googleConfigured) {
      setShowGoogleModal(true);
      return;
    }
    try { setBusy(true); signIn(await nativeGoogle()); } catch { setMsg(t('loginFail')); } finally { setBusy(false); }
  };

  const handleQuickGoogle = () => {
    const name = googleName.trim() || 'Google Traveller';
    const mail = googleEmail.trim() || 'traveller@gmail.com';
    signIn({ method: 'google', name, email: mail, picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c' });
  };

  const send = async () => {
    if (method === 'phone') {
      let p = phone.replace(/[\s()-]/g, '');
      if (/^\d{10}$/.test(p)) p = '+91' + p;
      else if (/^0\d{10}$/.test(p)) p = '+91' + p.slice(1);
      else if (!p.startsWith('+') && /^\d+$/.test(p)) p = '+' + p;

      if (!/^\+[1-9]\d{7,14}$/.test(p)) return setMsg(t('badPhone'));
      setBusy(true); setMsg('');
      const result = await sendPhoneCode(p);
      setBusy(false);
      if (result.token) setToken(result.token);
      if (!result.error) {
        setPhone(p);
        if (result.demoCode) {
          setCode(result.demoCode);
          setMsg(t('codeAutoFilled').replace('{code}', result.demoCode));
        } else {
          setCode('');
        }
        setStep('code');
      } else {
        setMsg(result.error === 'bad-phone' ? t('badPhone') : result.error === 'provider' ? t('phoneProvider') : t('sendFail'));
      }
      return;
    }

    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return setMsg(t('badEmail'));
    setBusy(true); setMsg('');
    const r = await sendCode(e);
    setBusy(false);
    if (r.token) {
      setEmail(e);
      setToken(r.token);
      if (r.demoCode) {
        setCode(r.demoCode);
        setMsg(t('codeAutoFilled').replace('{code}', r.demoCode));
      } else {
        setCode('');
      }
      setStep('code');
    } else {
      setMsg(r.error === 'bad-email' ? t('badEmail') : r.error === 'provider' ? t('emailProvider') : t('sendFail'));
    }
  };

  const verify = async () => {
    setBusy(true); setMsg('');
    const ok = method === 'phone'
      ? await verifyPhoneCode(phone, code.trim(), token)
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

        {showGoogleModal && (
          <div style={{ background: '#fff', border: '1px solid #e0c8b0', borderRadius: 16, padding: '14px 16px', marginTop: 10, display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}><GoogleG /> {t('googleQuickSignIn')}</span>
              <button className="src" style={{ cursor: 'pointer', fontSize: 16, border: 'none', background: 'transparent' }} onClick={() => setShowGoogleModal(false)}>✕</button>
            </div>
            <p style={{ fontSize: 13, margin: 0, color: '#555' }}>
              VITE_GOOGLE_CLIENT_ID is not set in this deployment. Sign in directly as a Google user below:
            </p>
            <input className="input" placeholder={t('googleName')} value={googleName} onChange={(e) => setGoogleName(e.target.value)} />
            <input className="input" type="email" placeholder={t('googleEmail')} value={googleEmail} onChange={(e) => setGoogleEmail(e.target.value)} />
            <button className="btn-dark sm" style={{ width: '100%' }} onClick={handleQuickGoogle}>{t('continueGoogle')}</button>
            <details style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Where to find VITE_GOOGLE_CLIENT_ID?</summary>
              <div style={{ marginTop: 6, lineHeight: 1.4 }}>
                1. Open <b>console.cloud.google.com</b> &gt; APIs &amp; Services &gt; Credentials.<br/>
                2. Click <b>Create Credentials &gt; OAuth client ID</b> (Web application).<br/>
                3. Under <b>Authorized JavaScript origins</b>, add your deployed domain (e.g. your Vercel URL).<br/>
                4. Set <b>VITE_GOOGLE_CLIENT_ID</b> in Vercel settings and redeploy.
              </div>
            </details>
          </div>
        )}

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
        {msg && <div className="src" style={{ color: msg.includes('auto-filled') || msg.includes('स्वतः') ? '#137333' : '#c0261c', fontSize: 14, fontWeight: msg.includes('auto-filled') || msg.includes('स्वतः') ? 600 : 400 }}>{msg}</div>}
      </div>

      <div className="pad" style={{ marginTop: 18, textAlign: 'center' }}>
        <button className="pill" style={{ margin: '0 auto' }} onClick={() => signIn({ method: 'guest', name: '' })}>{t('guest')}</button>
      </div>
    </div>
  );
}
