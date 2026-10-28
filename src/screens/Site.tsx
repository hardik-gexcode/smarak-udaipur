import { useEffect, useState } from 'react';
import { PARTNERS, siteById } from '../data/sites';
import { addCheckin, bestHour, density, fmtHour, hourly, km, nudge } from '../lib/crowd';
import { useApp } from '../lib/app';
import { openMap } from '../lib/maps';
import { zoneParts } from '../lib/time';
import { speakSeq, splitSentences, stopSpeech } from '../lib/voice';
import { Chip, Cover, Header, Icon, LangToggle, Meter } from '../ui';

const udaipurHour = () => zoneParts().hour;

export default function SiteScreen({ id }: { id: string }) {
  const { t, lang, go, back, passport, setPassport, bump } = useApp();
  const site = siteById(id);
  const [active, setActive] = useState(-1);
  const [speaking, setSpeaking] = useState(false);
  const [toast, setToast] = useState('');

  const sentences = splitSentences(`${site.story[lang]} ${site.legacy[lang]}`);
  const d = density(site);
  const alt = nudge(site);
  const bars = hourly(site).slice(6, 22);
  const now = udaipurHour();
  const best = bestHour(site);
  const stamped = !!passport.stamps[site.id];
  const makers = PARTNERS.filter((p) => p.nearSite === site.id);

  useEffect(() => { stopSpeech(); setSpeaking(false); setActive(-1); return () => stopSpeech(); }, [lang, id]);
  useEffect(() => { if (toast) { const x = setTimeout(() => setToast(''), 3500); return () => clearTimeout(x); } }, [toast]);

  const toggleListen = () => {
    if (speaking) { stopSpeech(); setSpeaking(false); setActive(-1); return; }
    setSpeaking(true);
    speakSeq(sentences, lang, setActive, () => { setSpeaking(false); setActive(-1); });
  };

  const stamp = () => {
    const finish = () => {
      setPassport({ ...passport, stamps: { ...passport.stamps, [site.id]: Date.now() } });
      addCheckin(site.id);
      bump();
    };
    if (passport.demo) return finish();
    navigator.geolocation.getCurrentPosition(
      (p) => (km({ lat: p.coords.latitude, lng: p.coords.longitude }, site) < 0.5 ? finish() : setToast(t('tooFar'))),
      () => setToast(t('tooFar')),
      { timeout: 8000 },
    );
  };

  return (
    <div className="scroll">
      <Header title={site.name[lang]} onBack={back} right={<LangToggle />} />

      <div className="card big" style={{ margin: '0 18px', width: 'auto' }}>
        <Cover site={site} />
        <div className="bd">
          <div><Chip tone={site.hotspot ? 'pink' : 'peach'}>{site.tag[lang]}</Chip></div>
          <h3>{site.name[lang]}</h3>
          <div className="meta"><Icon n="pin" size={18} />{site.built[lang]}</div>
          <Meter d={d} />
          <div className="actions">
            <button className="btn-dark" onClick={() => openMap(site)}><Icon n="nav" size={20} />{t('direction')}</button>
            <button className="btn-round" aria-label="AR" onClick={() => go({ name: 'ar', id: site.id })}><Icon n="cube" /></button>
            <button className={`btn-round ${speaking ? 'dark' : ''}`} aria-label="Listen" onClick={toggleListen}><Icon n={speaking ? 'stop' : 'speaker'} /></button>
          </div>
        </div>
      </div>

      <div className="card panel">
        <h3>{t('story')} {speaking && <span className="wave"><i /><i /><i /><i /></span>}</h3>
        <p>
          {sentences.map((s, i) => (
            <span key={i} style={active === i ? { background: '#ffd9c4', borderRadius: 6, padding: '1px 3px' } : undefined}>{s} </span>
          ))}
        </p>
        <div className="actions" style={{ marginTop: 0 }}>
          <button className="btn-dark sm" onClick={toggleListen}><Icon n={speaking ? 'stop' : 'speaker'} size={20} />{speaking ? t('stop') : t('listen')}</button>
        </div>
      </div>

      <div className="card panel">
        <h3>{t('crowdToday')}</h3>
        <div className="chart">
          {bars.map((v, i) => (
            <i key={i} className={i + 6 === now ? 'now' : i + 6 === best ? 'hi' : ''} style={{ height: `${Math.max(5, v)}%` }} />
          ))}
        </div>
        <div className="axis"><span>6</span><span>9</span><span>12</span><span>15</span><span>18</span><span>21</span></div>
        <p>{t('best')} <b>{fmtHour(best, lang)}</b>. {site.tip[lang]}</p>
      </div>

      {alt && d >= 40 && (
        <div className="card panel">
          <h3>{t('tryInstead')}</h3>
          <button className="card row" style={{ margin: 0, width: '100%' }} onClick={() => go({ name: 'site', id: alt.site.id })}>
            <Cover site={alt.site} />
            <div className="info">
              <h3>{alt.site.name[lang]}</h3>
              <div className="meta"><Icon n="pin" size={16} />{alt.km.toFixed(1)} {t('away')}</div>
              <Meter d={density(alt.site)} />
            </div>
          </button>
        </div>
      )}

      {makers.length > 0 && (
        <div className="card panel">
          <h3>{t('nearby')}</h3>
          {makers.map((p) => (
            <div key={p.id} className="meta" style={{ justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{p.name}</span>
              <Chip tone="gray">{p.craft?.[lang]}</Chip>
            </div>
          ))}
          <div className="src">{t('sample')}</div>
        </div>
      )}

      <div className="pad" style={{ marginTop: 18 }}>
        <button className="btn-dark" style={{ width: '100%' }} disabled={stamped} onClick={stamp}>
          <Icon n={stamped ? 'check' : 'award'} size={22} />{stamped ? t('stamped') : t('stamp')}
        </button>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
