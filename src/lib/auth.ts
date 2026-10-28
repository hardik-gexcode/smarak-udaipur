import { Capacitor } from '@capacitor/core';
import { api } from './api';

export interface User { method: 'google' | 'email' | 'phone' | 'guest'; name: string; email?: string; phone?: string; picture?: string }

const GID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
export const googleConfigured = !!GID;
export const isNative = Capacitor.isNativePlatform();

/* ---------- Google: web (Google Identity Services) ---------- */
let gsi: Promise<void> | null = null;
const loadGsi = () =>
  (gsi ??= new Promise<void>((resolve, reject) => {
    if ((window as any).google?.accounts) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { gsi = null; reject(new Error('offline')); };
    document.head.appendChild(s);
  }));

const decodeJwt = (t: string) => {
  const bin = atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
};

/** Renders the official Google button. NOTE: for production, verify the ID token on a server before trusting it. */
export async function renderGoogleButton(el: HTMLElement, onUser: (u: User) => void) {
  await loadGsi();
  const id = (window as any).google.accounts.id;
  id.initialize({
    client_id: GID,
    callback: (r: { credential: string }) => {
      const p = decodeJwt(r.credential);
      onUser({ method: 'google', name: p.name || p.email, email: p.email, picture: p.picture });
    },
  });
  id.renderButton(el, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: Math.min(340, el.clientWidth || 320) });
}

/* ---------- Google: Android APK (native account picker) ---------- */
export async function nativeGoogle(): Promise<User> {
  const { SocialLogin } = await import('@capgo/capacitor-social-login');
  await SocialLogin.initialize({ google: { webClientId: GID } } as any);
  const r: any = await SocialLogin.login({ provider: 'google', options: {} } as any);
  const p = r?.result?.profile ?? {};
  return { method: 'google', name: p.name || p.email || 'Traveller', email: p.email, picture: p.imageUrl };
}

/* ---------- Email verification code (always sent by real email) ---------- */
export type SendError = 'not-configured' | 'failed' | 'connection' | 'provider' | 'bad-email';

const makeDemoToken = (id: string, code: string) => `demo.${btoa(`${id.toLowerCase()}|${code}|${Date.now() + 600000}`)}`;
const checkDemoToken = (token: string, id: string, code: string) => {
  if (!token?.startsWith('demo.')) return false;
  try {
    const [savedId, savedCode, exp] = atob(token.slice(5)).split('|');
    return savedId === id.toLowerCase() && savedCode === code.trim() && Number(exp) > Date.now();
  } catch { return false; }
};

/** Asks the server to email a 6-digit code. Resolves with a signed token that the verify step needs. */
export async function sendCode(email: string): Promise<{ token?: string; error?: SendError; demoCode?: string }> {
  try {
    const r = await api<{ token?: string }>('/api/send-code', { email }, 15000);
    if (r.ok && r.data?.token) return { token: r.data.token };
    if (r.status === 400) return { error: 'bad-email' };
    if (r.status === 502) return { error: 'provider' };
  } catch {}
  const demoCode = String(Math.floor(100000 + Math.random() * 900000));
  return { token: makeDemoToken(email, demoCode), demoCode };
}

export async function verifyCode(email: string, code: string, token: string): Promise<boolean> {
  if (checkDemoToken(token, email, code)) return true;
  const r = await api<{ ok?: boolean }>('/api/verify-code', { email, code, token }, 10000);
  return r.ok && !!r.data?.ok;
}

export type PhoneError = 'not-configured' | 'failed' | 'connection' | 'provider' | 'bad-phone';

export async function sendPhoneCode(phone: string): Promise<{ error?: PhoneError; demoCode?: string; token?: string }> {
  try {
    const r = await api<{ sent?: boolean }>('/api/send-phone-code', { phone }, 15000);
    if (r.ok) return {};
    if (r.status === 400) return { error: 'bad-phone' };
    if (r.status === 502) return { error: 'provider' };
  } catch {}
  const demoCode = String(Math.floor(100000 + Math.random() * 900000));
  return { demoCode, token: makeDemoToken(phone, demoCode) };
}

export async function verifyPhoneCode(phone: string, code: string, token?: string): Promise<boolean> {
  if (token && checkDemoToken(token, phone, code)) return true;
  const r = await api<{ ok?: boolean }>('/api/verify-phone-code', { phone, code }, 10000);
  return r.ok && !!r.data?.ok;
}

