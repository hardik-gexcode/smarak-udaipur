import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type { Lang } from '../data/sites';
import { SITES, siteById } from '../data/sites';
import { Key, tr } from './i18n';
import { stopSpeech } from './voice';
import { LANGS } from './langs';
import { downloadPack, isBuiltIn, loadCachedPack } from './translate';
import type { User } from './auth';
import type { Traveller } from './plan';

export type Screen =
  | { name: 'home' | 'explore' | 'trail' | 'passport' }
  | { name: 'site' | 'ar'; id: string };

interface Passport { name: string; stamps: Record<string, number>; demo: boolean }

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  busyLang: { code: string; pct: number } | null;
  langError: boolean;
  t: (k: Key) => string;
  screen: Screen;
  go: (s: Screen) => void;
  back: () => void;
  isRoot: boolean;
  passport: Passport;
  setPassport: (p: Passport) => void;
  user: User | null;
  signIn: (u: User) => void;
  signOut: () => void;
  traveller: Traveller | null;
  setTraveller: (t: Traveller | null) => void;
  xp: number;
  levelKey: Key;
  online: boolean;
  tick: number; // bumps every minute so crowd numbers refresh
  bump: () => void;
}

const AppCtx = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(AppCtx);

const load = <T,>(key: string, fallback: T): T => {
  try { return { ...fallback, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch { return fallback; }
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('smarak.lang') || 'en';
    return loadCachedPack(saved) ? saved : 'en';
  });
  const [busyLang, setBusyLang] = useState<{ code: string; pct: number } | null>(null);
  const [langError, setLangError] = useState(false);
  const [stack, setStack] = useState<Screen[]>([{ name: 'home' }]);
  const [passport, setPassportState] = useState<Passport>(() => load('smarak.passport', { name: '', stamps: {}, demo: true }));
  const [user, setUserState] = useState<User | null>(() => { try { return JSON.parse(localStorage.getItem('smarak.user') || 'null'); } catch { return null; } });
  const [traveller, setTravellerState] = useState<Traveller | null>(() => { try { return JSON.parse(localStorage.getItem('smarak.traveller') || 'null'); } catch { return null; } });
  const [online, setOnline] = useState(navigator.onLine);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    const id = setInterval(() => setTick((x) => x + 1), 60000);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); clearInterval(id); };
  }, []);

  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = LANGS[lang]?.rtl ? 'rtl' : 'ltr'; }, [lang]);
  const setLang = async (l: Lang) => {
    stopSpeech();
    setLangError(false);
    if (!isBuiltIn(l) && !loadCachedPack(l)) {
      setBusyLang({ code: l, pct: 0 });
      const ok = await downloadPack(l, (d, n) => setBusyLang({ code: l, pct: Math.round((d / n) * 100) }));
      setBusyLang(null);
      if (!ok) { setLangError(true); return; }
    }
    localStorage.setItem('smarak.lang', l);
    setLangState(l);
  };
  const setPassport = (p: Passport) => { localStorage.setItem('smarak.passport', JSON.stringify(p)); setPassportState(p); };

  const signIn = (u: User) => {
    localStorage.setItem('smarak.user', JSON.stringify(u));
    setUserState(u);
    if (!passport.name && u.method !== 'guest') setPassport({ ...passport, name: u.name });
  };
  const signOut = () => {
    stopSpeech();
    localStorage.removeItem('smarak.user'); localStorage.removeItem('smarak.traveller');
    setUserState(null); setTravellerState(null); setStack([{ name: 'home' }]);
  };
  const setTraveller = (t: Traveller | null) => {
    if (t) localStorage.setItem('smarak.traveller', JSON.stringify(t)); else localStorage.removeItem('smarak.traveller');
    setTravellerState(t);
  };

  const go = useCallback((s: Screen) => {
    stopSpeech();
    const root = ['home', 'explore', 'trail', 'passport'].includes(s.name);
    setStack((st) => (root ? [s] : [...st, s]));
  }, []);
  const back = useCallback(() => { stopSpeech(); setStack((st) => (st.length > 1 ? st.slice(0, -1) : st)); }, []);

  const xp = useMemo(
    () => Object.keys(passport.stamps).reduce((s, id) => s + (SITES.find((x) => x.id === id)?.hotspot ? 10 : 25), 0),
    [passport.stamps],
  );
  const levelKey: Key = xp >= 75 ? 'guardian' : xp >= 25 ? 'explorer' : 'traveller';

  const value: Ctx = {
    lang, setLang, busyLang, langError, t: (k) => tr(k, lang), screen: stack[stack.length - 1], go, back, isRoot: stack.length === 1,
    passport, setPassport, user, signIn, signOut, traveller, setTraveller, xp, levelKey, online, tick, bump: () => setTick((x) => x + 1),
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export { siteById };
