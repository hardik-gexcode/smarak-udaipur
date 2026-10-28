import type { Lang } from '../data/sites';
import { Key, tr } from './i18n';

/** Sites are in Udaipur, so crowd maths and "open now" use Udaipur time; greetings use the visitor's own zone. */
export const UDAIPUR_TZ = 'Asia/Kolkata';
export const userTz = () => Intl.DateTimeFormat().resolvedOptions().timeZone || UDAIPUR_TZ;

const DAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function zoneParts(date = new Date(), tz = UDAIPUR_TZ) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: 'numeric', hour12: false, weekday: 'short' }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  return { hour: Number(get('hour')) % 24, minute: Number(get('minute')), day: DAYS[get('weekday')] ?? 0 };
}

export type Part = 'morning' | 'afternoon' | 'evening' | 'night';
export const partOf = (h: number): Part => (h >= 5 && h < 12 ? 'morning' : h < 17 && h >= 12 ? 'afternoon' : h >= 17 && h < 21 ? 'evening' : 'night');

const HELLO: Record<Part, Key> = { morning: 'greetMorning', afternoon: 'greetAfternoon', evening: 'greetEvening', night: 'greetNight' };
const TIPS: Record<Part, Key> = { morning: 'tipMorning', afternoon: 'tipAfternoon', evening: 'tipEvening', night: 'tipNight' };

/** Greeting in the visitor's own local time zone. */
export function greeting(lang: Lang, date = new Date()) {
  const part = partOf(zoneParts(date, userTz()).hour);
  return { part, text: tr(HELLO[part], lang) };
}

/** Advice for the current time in Udaipur. */
export const timeTip = (lang: Lang, date = new Date()) => tr(TIPS[partOf(zoneParts(date).hour)], lang);

export const clock = (tz: string, date = new Date()) =>
  new Intl.DateTimeFormat('en-IN', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(date).toUpperCase();

/** True when the visitor's clock differs from Udaipur's (e.g. a foreign tourist planning from abroad). */
export const differsFromUdaipur = (date = new Date()) => {
  const a = zoneParts(date, userTz()), b = zoneParts(date);
  return a.hour * 60 + a.minute !== b.hour * 60 + b.minute;
};
