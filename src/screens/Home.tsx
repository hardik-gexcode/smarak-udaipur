import { useEffect, useState } from 'react';
import { SITES, siteById } from '../data/sites';
import { density, fmtHour, levelOf } from '../lib/crowd';
import { useApp } from '../lib/app';
import { essentials, yatraTips } from '../lib/copy';
import { pref } from '../lib/maps';
import { buildPlan } from '../lib/plan';
import { UDAIPUR_TZ, clock, differsFromUdaipur, greeting, timeTip, zoneParts } from '../lib/time';
import { splitSentences } from '../lib/voice';
import { Chip, Icon, LangToggle, Photo } from '../ui';
import { latestTravelBadge } from '../lib/badges';

const mascotIntroKey = 'smarak.mascotIntroPlayed';
const shouldPlayMascotIntro = () => {
  try { return !sessionStorage.getItem(mascotIntroKey); } catch { return true; }
};

export const passId = (name: string) => {
  let h = 7;
  for (const c of name || 'guest') h = (h * 31 + c.charCodeAt(0)) % 100000;
  return `UDR${String(h).padStart(5, '0')}-SMK`;
};

export default function Home() {
  const { t, lang, go, passport, traveller, xp, levelKey, tick } = useApp();
  void tick; // refresh the time-of-day crowd estimate every minute
  const [showMascotIntro, setShowMascotIntro] = useState(shouldPlayMascotIntro);
  useEffect(() => {
    if (!showMascotIntro) return;
    try { sessionStorage.setItem(mascotIntroKey, '1'); } catch { /* animate for this visit */ }
    const timer = window.setTimeout(() => setShowMascotIntro(false), 2100);
    return () => window.clearTimeout(timer);
  }, [showMascotIntro]);
  const hot = SITES.filter((s) => s.area === 'udaipur' && s.hotspot);
  const avg = Math.round(hot.reduce((a, s) => a + density(s), 0) / hot.length);
  const quietCount = SITES.filter((s) => levelOf(density(s)) === 'quiet').length;
  const calm = SITES.filter((s) => !s.hotspot);
  const pick = calm[new Date().getDate() % calm.length];
  let bh = 9;
  for (let h = 9; h <= 19; h++) if (hot.reduce((a, s) => a + s.profile[h], 0) < hot.reduce((a, s) => a + s.profile[bh], 0)) bh = h;

  const uh = zoneParts().hour;
  const resting = uh < 6 || uh >= 21; // Udaipur sites are mostly closed overnight
  const g = greeting(lang);
  const first = (traveller?.name || passport.name || t('traveller')).split(' ')[0];
  const plan = traveller ? buildPlan(traveller) : [];
  const foreign = traveller?.type === 'foreign';
  const flexBadge = latestTravelBadge(xp);

  const openExplore = (filter: string) => { pref.set('filter', filter); go({ name: 'explore' }); };
  const openTrail = (tab: string) => { pref.set('trail', tab); go({ name: 'trail' }); };
  const openAr = (ask: boolean) => { pref.set('arask', ask ? '1' : ''); go({ name: 'ar', id: pick.id }); };
  const services: [string, string, () => void][] = [
    ['explore', 'compass', () => openExplore('all')],
    ['ar', 'cube', () => openAr(false)],
    ['ask', 'mic', () => openAr(true)],
    ['artisans', 'bag', () => openTrail('artisan')],
    ['stays', 'leaf', () => openTrail('stay')],
    ['passport', 'award', () => go({ name: 'passport' })],
  ];

  return (
    <div className="scroll">
      <div className="hero home-hero">
        <img className="home-mascot" src="/namaste-mascot.png" alt="Namaste from Mewar" />
        <div className="top"><LangToggle /></div>
        <small>{g.text}, {first}</small>
        <h1 style={{ fontSize: 36 }}>{t('welcomeMewar')}</h1>
        <small style={{ fontSize: 14.5, opacity: .92, marginTop: 8 }}>{t('regionTag')}</small>
        <small style={{ fontSize: 14, opacity: .85, marginTop: 4 }}>
          {differsFromUdaipur() ? `${t('udaipurTime')} ${clock(UDAIPUR_TZ)} IST` : `${clock(UDAIPUR_TZ)} IST`}
        </small>
        <button className="status" onClick={() => openExplore('quiet')}>
          <b>{quietCount}</b>
          <span>{t(resting ? 'quietPillNight' : 'quietPill')}</span>
          <Icon n="arrow" size={20} />
        </button>
      </div>

      <div className="card premium">
        <div className="body">
          <h3>{t('now')}</h3>
          <div className="sub"><Icon n="check" size={18} /> {t('best')} {fmtHour(bh, lang)}</div>
          <p style={{ marginTop: 10, color: '#4a4a4d', fontSize: 15.5, lineHeight: 1.4 }}>{timeTip(lang)}</p>
        </div>
        <div className="foot">
          <span>{avg}%<small style={{ fontSize: 14, color: '#8e8e93', fontWeight: 500 }}> {t('busyAvg')}</small></span>
          <button className="btn-dark sm" onClick={() => openExplore('quiet')}>{t('seeQuiet')}</button>
        </div>
      </div>

      <section className="home-crowd-map" aria-label="Estimated crowd heat map">
        <div className="crowd-map-heading"><div><h2>Crowd heat map</h2><small>Time-based estimate · {clock(UDAIPUR_TZ)} IST</small></div><button className="pill" onClick={() => go({ name: 'explore' })}>All places</button></div>
        <div className="crowd-map-legend"><span><i className="low" />Low</span><span><i className="mid" />Moderate</span><span><i className="high" />High</span></div>
        <div className="crowd-map-grid">
          {SITES.map((site) => {
            const crowd = density(site);
            const level = levelOf(crowd);
            const band = level === 'quiet' ? 'low' : level === 'busy' ? 'mid' : 'high';
            return <button key={site.id} className={`crowd-tile ${band}`} onClick={() => go({ name: 'site', id: site.id })}>
              <i className="crowd-dot" /><span>{site.name[lang]}</span><b>{crowd}%</b>
            </button>;
          })}
        </div>
        <div className="src">Modelled from each place’s typical hourly pattern; live sensor counts are not available.</div>
      </section>

      <h2 className="sect">{t('services')}</h2>
      <div className="pills">
        {services.map(([k, icon, fn]) => (
          <button key={k} className="pill" onClick={fn}><Icon n={icon} size={22} />{t(k as any)}</button>
        ))}
      </div>

      {plan.length > 0 && (
        <>
          <h2 className="sect">{t('yourPlan')}</h2>
          <div className="card panel" style={{ margin: '0 18px' }}>
            {plan.map((day, i) => (
              <div key={i} style={{ display: 'grid', gap: 8 }}>
                <b>{t('day')} {i + 1}</b>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {day.map((id) => (
                    <button key={id} className="pill" style={{ height: 40, padding: '0 16px', fontSize: 15 }} onClick={() => go({ name: 'site', id })}>{siteById(id).name[lang]}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="sect">{foreign ? t('essentials') : t('yatra')}</h2>
      <div className="card panel" style={{ margin: '0 18px' }}>
        {(foreign ? essentials(lang) : yatraTips(lang)).map((x, i) => (
          <p key={i} style={{ display: 'flex', gap: 10, fontSize: 16 }}><span style={{ color: 'var(--orange)', flex: 'none' }}><Icon n="check" size={20} /></span>{x}</p>
        ))}
      </div>

      <h2 className="sect">{t('stories')}</h2>
      <div className="rail">
        {SITES.map((s) => (
          <button key={s.id} className="story" onClick={() => go({ name: 'site', id: s.id })}>
            <div className="cover" style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${s.hue[0]}, ${s.hue[1]})` }}>{s.img && <img src={s.img} alt={s.name.en} loading="lazy" />}</div>
            <Chip>{s.tag[lang]}</Chip>
            <span className="tx">{s.name[lang]}</span>
          </button>
        ))}
      </div>

      <h2 className="sect">{t('ecard')}</h2>
      <button className="ecard" style={{ display: 'block', width: 'calc(100% - 44px)', textAlign: 'left' }} onClick={() => go({ name: 'passport' })}>
        <div className="id">{passId(passport.name)}</div>
        {flexBadge && <div className="ecard-badge"><span>{flexBadge.icon}</span>{lang === 'hi' ? flexBadge.hindi : flexBadge.title}</div>}
        <div className="who">
          <div className="av">{(first || 'S')[0].toUpperCase()}</div>
          <div><div className="nm">{passport.name || first}</div><div className="lv">{t(levelKey)}</div></div>
          <div className="xpb">{xp}<small>{t('xp')}</small></div>
        </div>
      </button>

      <h2 className="sect">{t('today')}</h2>
      <div className="card panel" style={{ margin: '0 18px' }}>
        {pick.img && <Photo src={pick.img} alt={pick.name.en} />}
        <Chip tone="green">{pick.tag[lang]}</Chip>
        <h3>{pick.name[lang]}</h3>
        <p>{splitSentences(pick.story[lang])[0]}</p>
        <div className="actions">
          <button className="btn-dark sm" onClick={() => go({ name: 'site', id: pick.id })}>{t('story')}</button>
          <button className="btn-round" aria-label="AR" onClick={() => openAr(false)}><Icon n="cube" /></button>
        </div>
      </div>
      {showMascotIntro && (
        <div className="mascot-intro" aria-label="Khamma Ghani. Namaste, welcome to Mewar.">
          <img src="/namaste-mascot.png" alt="" />
          <div className="mascot-intro-copy"><b>खम्मा घणी</b><span>नमस्ते · मेवाड़ में आपका स्वागत है</span><small>WELCOME TO MEWAR</small></div>
        </div>
      )}
    </div>
  );
}
