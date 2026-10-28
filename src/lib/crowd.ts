import { SITES, Site } from '../data/sites';
import { zoneParts } from './time';
import { localeOf } from './langs';

const KEY = 'smarak.checkins';
interface CheckIn { id: string; t: number }
const HOUR = 3600e3;

const read = (): CheckIn[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};

/** Anonymous check-in. In production this is a Firestore write that feeds the crowd engine. */
export function addCheckin(id: string) {
  const now = Date.now();
  const recent = read().filter((c) => now - c.t < HOUR);
  recent.push({ id, t: now });
  localStorage.setItem(KEY, JSON.stringify(recent));
}

export type Level = 'quiet' | 'busy' | 'crowded';
export const levelOf = (d: number): Level => (d < 40 ? 'quiet' : d < 70 ? 'busy' : 'crowded');

const weekendFactor = (d: Date) => ([0, 6].includes(zoneParts(d).day) ? 1.2 : 1);

/** Estimated crowd density 0-100: typical hourly curve x weekend factor + live check-ins. */
export function density(site: Site, date = new Date()): number {
  const z = zoneParts(date); // Udaipur local time, wherever the visitor is
  const h = z.hour + z.minute / 60;
  const i = Math.floor(h) % 24;
  const f = h - Math.floor(h);
  const base = site.profile[i] * (1 - f) + site.profile[(i + 1) % 24] * f;
  const live = read().filter((c) => c.id === site.id && Date.now() - c.t < HOUR).length * 0.06;
  return Math.round(Math.min(1, base * weekendFactor(date) + live) * 100);
}

export const hourly = (site: Site, date = new Date()) =>
  site.profile.map((v) => Math.round(Math.min(1, v * weekendFactor(date)) * 100));

/** Quietest hour between 9 AM and 7 PM. */
export function bestHour(site: Site): number {
  let best = 9;
  for (let h = 9; h <= 19; h++) if (site.profile[h] < site.profile[best]) best = h;
  return best;
}

export function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const r = (x: number) => (x * Math.PI) / 180;
  const dLat = r(b.lat - a.lat);
  const dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Nearest equally-rich site that is quiet right now: the SMARAK nudge. */
export function nudge(site: Site): { site: Site; km: number } | null {
  const options = SITES.filter((s) => s.id !== site.id && !s.hotspot && density(s) < 45)
    .map((s) => ({ site: s, km: km(site, s) }))
    .sort((a, b) => a.km - b.km);
  return options[0] ?? null;
}

export const fmtHour = (h: number, lang: string = 'en') => {
  if (lang === 'hi') {
    const part = h < 12 ? 'सुबह' : h < 16 ? 'दोपहर' : h < 19 ? 'शाम' : 'रात';
    return `${part} ${h % 12 || 12} बजे`;
  }
  return new Intl.DateTimeFormat(localeOf(lang), { hour: 'numeric', hour12: lang === 'en' ? true : undefined, timeZone: 'UTC' }).format(new Date(Date.UTC(2000, 0, 1, h)));
};
