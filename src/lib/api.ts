import { Capacitor } from '@capacitor/core';

/**
 * Where the serverless functions live.
 * - Web / PWA: same origin (Vercel deploy, or `npm run dev` which serves /api locally).
 * - Android APK: there is no origin, so VITE_API_URL must point to your deployed site.
 */
const env = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');
export const apiBase: string | null = env ?? (Capacitor.isNativePlatform() ? null : '');

export interface ApiResult<T = any> { ok: boolean; status: number; data: T | null }

export async function api<T = any>(path: string, body: unknown, ms = 8000): Promise<ApiResult<T>> {
  if (apiBase === null) return { ok: false, status: 0, data: null };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(`${apiBase}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
    let data: T | null = null;
    try { data = await r.json(); } catch { /* non-JSON (e.g. 404 page) */ }
    return { ok: r.ok, status: r.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  } finally {
    clearTimeout(timer);
  }
}
