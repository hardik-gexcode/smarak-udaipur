import { ReactNode, useState } from 'react';
import type { Kind, Site } from './data/sites';
import { levelOf } from './lib/crowd';
import { useApp } from './lib/app';
import { nativeName, regionalLangs } from './lib/langs';

const P: Record<string, string> = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  compass: 'M12 21a9 9 0 100-18 9 9 0 000 18zM15.5 8.5l-2 5-5 2 2-5z',
  bag: 'M6 8h12l1 12H5L6 8zM9 8V6a3 3 0 016 0v2',
  award: 'M12 15a6 6 0 100-12 6 6 0 000 12zM8.5 14l-1.5 7 5-3 5 3-1.5-7',
  back: 'M15 5l-7 7 7 7',
  arrow: 'M9 5l7 7-7 7',
  cube: 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12L4 7.5',
  list: 'M4 7h16M4 12h16M4 17h10',
  card: 'M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z',
  pin: 'M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  speaker: 'M4 10v4h4l5 4V6L8 10H4zM16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11',
  mic: 'M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3zM6 11a6 6 0 0012 0M12 17v4',
  dots: 'M5 12h.01M12 12h.01M19 12h.01',
  nav: 'M5 19L19 5M9 5h10v10',
  leaf: 'M5 19c0-9 5-14 14-14 0 9-5 14-14 14zM5 19l8-8',
  stop: 'M7 7h10v10H7z',
  vr: 'M3 8h18v8a2 2 0 01-2 2h-4l-1.5-2h-3L9 18H5a2 2 0 01-2-2V8z',
  check: 'M5 12l5 5 9-10',
  send: 'M5 12l14-7-5 14-2-6-7-1z',
  globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18',
  play: 'M8 5l11 7-11 7z',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  phone: 'M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zM8 7h8M8 11h8M10 17h4',
  logout: 'M9 4H5v16h4M16 8l4 4-4 4M20 12H9',
  target: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 16a4 4 0 100-8 4 4 0 000 8z',
};

export const Icon = ({ n, size = 24, sw = 1.8 }: { n: string; size?: number; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={n === 'dots' ? 3 : sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={P[n]} />
  </svg>
);

const ART: Record<Kind, ReactNode> = {
  palace: <><rect x="14" y="74" width="172" height="46" /><rect x="26" y="50" width="16" height="26" /><path d="M24 50a10 10 0 0120 0z" /><rect x="158" y="50" width="16" height="26" /><path d="M156 50a10 10 0 0120 0z" /><path d="M80 74a20 20 0 0140 0z" /><rect x="96" y="40" width="8" height="12" /></>,
  temple: <><rect x="40" y="100" width="120" height="20" /><rect x="52" y="86" width="96" height="16" /><path d="M70 86L100 14l30 72z" /><circle cx="100" cy="11" r="4" /></>,
  island: <><rect x="0" y="98" width="200" height="22" opacity=".45" /><rect x="50" y="68" width="100" height="32" /><path d="M66 68a14 14 0 0128 0zM106 68a14 14 0 0128 0z" /></>,
  garden: <><circle cx="100" cy="104" r="24" opacity=".6" /><path d="M100 104V46M92 104l-6-48M108 104l6-48" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" /><rect x="20" y="86" width="22" height="34" /><path d="M16 86a15 15 0 0130 0z" /><rect x="158" y="86" width="22" height="34" /><path d="M154 86a15 15 0 0130 0z" /></>,
  haveli: <><rect x="46" y="44" width="108" height="76" /><path d="M46 44a54 16 0 01108 0z" /><rect x="30" y="76" width="16" height="44" /><rect x="154" y="76" width="16" height="44" /></>,
  hill: <><path d="M0 120L66 52l32 32 42-48 60 84z" /><rect x="86" y="32" width="28" height="18" /><path d="M86 32a14 12 0 0128 0z" /></>,
  statue: <><circle cx="100" cy="34" r="12" /><rect x="86" y="47" width="28" height="36" rx="9" /><path d="M56 112q12-34 44-30 32-4 44 30z" /><path d="M132 14v78" stroke="#fff" strokeWidth="4" fill="none" /><rect x="60" y="108" width="80" height="12" /></>,
  fort: <><path d="M0 120L40 70l40 16 40-30 50 24 30-14v54z" /><rect x="20" y="56" width="160" height="10" /><rect x="84" y="34" width="30" height="26" /><path d="M80 34a19 14 0 0138 0z" /></>,
  tower: <><rect x="84" y="100" width="32" height="20" /><rect x="88" y="20" width="24" height="82" /><rect x="84" y="46" width="32" height="5" /><rect x="84" y="68" width="32" height="5" /><rect x="84" y="88" width="32" height="5" /><path d="M86 20a14 12 0 0128 0z" /></>,
  lake: <><rect x="0" y="84" width="200" height="36" opacity=".5" /><path d="M0 84L50 46l34 28 30-40 40 34 46-26v38z" /></>,
  cenotaph: <>{[26, 86, 146].map((x, i) => <g key={x}><rect x={x} y={78 - i * 6} width="30" height={42 + i * 6} /><path d={`M${x - 4} ${78 - i * 6}a19 17 0 0138 0z`} /></g>)}</>,
};

export const Cover = ({ site, className = '' }: { site: Site; className?: string }) => (
  <div className={`cover ${className}`} style={{ background: `linear-gradient(160deg, ${site.hue[0]}, ${site.hue[1]})` }}>
    <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMax meet" fill="rgba(255,255,255,.55)">{ART[site.kind]}</svg>
    {site.img && <img src={site.img} alt={site.name.en} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
  </div>
);

export const Photo = ({ src, alt, className = '' }: { src: string; alt: string; className?: string }) => (
  <div className={`photo ${className}`}><img src={src} alt={alt} loading="lazy" /></div>
);

export const Chip = ({ children, tone = 'peach' }: { children: ReactNode; tone?: 'peach' | 'pink' | 'gray' | 'green' }) => (
  <span className={`chip ${tone}`}>{children}</span>
);

export const Meter = ({ d }: { d: number }) => {
  const { t } = useApp();
  const lv = levelOf(d);
  return (
    <div className="meterwrap">
      <div className="meter"><i className={lv} style={{ width: `${Math.max(6, d)}%` }} /></div>
      <span className={`lvl ${lv}`}>{t(lv)} · {d}%</span>
    </div>
  );
};

export const Header = ({ title, right, onBack }: { title: string; right?: ReactNode; onBack?: () => void }) => (
  <div className="header">
    {onBack ? <button className="btn-round" onClick={onBack} aria-label="Back"><Icon n="back" /></button> : <span style={{ width: 52 }} />}
    <h2>{title}</h2>
    <div className="hright">{right}</div>
  </div>
);

export const LangToggle = () => {
  const { lang, setLang, traveller } = useApp();
  const [open, setOpen] = useState(false);
  const codes = ['en', 'hi', ...regionalLangs(traveller)].filter((c, i, a) => a.indexOf(c) === i);
  const short = (c: string) => (c === 'en' ? 'EN' : c === 'hi' ? 'हि' : nativeName(c));
  return (
    <div style={{ position: 'relative' }}>
      <button className="langbtn" aria-label="Language" onClick={() => setOpen(!open)}><Icon n="globe" size={20} />{short(lang)}</button>
      {open && (
        <div className="langmenu" role="menu">
          {codes.map((c) => (
            <button key={c} className={c === lang ? 'on' : ''} onClick={() => { setOpen(false); setLang(c); }}>
              <span>{nativeName(c)}</span>{c === lang && <Icon n="check" size={18} sw={2.6} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const GoogleG = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);
