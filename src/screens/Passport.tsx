import { useEffect, useState } from 'react';
import { SITES } from '../data/sites';
import { useApp } from '../lib/app';
import { Chip, Header, Icon, LangToggle } from '../ui';
import { passId } from './Home';
import { cloudAvailable, gender, loadVoices, saveVoice, savedVoice, setGender, speakSeq, voicesFor } from '../lib/voice';
import { nativeName } from '../lib/langs';
import { TRAVEL_BADGES, latestTravelBadge, nextTravelBadge } from '../lib/badges';

export default function Passport() {
  const { t, lang, passport, setPassport, xp, levelKey, online, user, traveller, setTraveller, signOut, leaderboard } = useApp();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [, force] = useState(0);
  useEffect(() => { loadVoices().then(setVoices); }, []);
  const en = voicesFor('en', voices), hi = voicesFor('hi', voices);
  const pickVoice = (l: string, v: string) => { saveVoice(l, v); force((x) => x + 1); };
  const test = (l: string) => {
    const sample = l === 'en' ? 'Namaste! Welcome to Udaipur, the City of Lakes.'
      : l === 'hi' ? 'नमस्ते! झीलों की नगरी उदयपुर में आपका स्वागत है.'
      : SITES.find((s) => s.story[l])?.story[l].split(/(?<=[.।!?])\s/)[0] ?? 'Namaste! Welcome to Udaipur.';
    speakSeq([sample], l, () => {}, () => {});
  };
  const got = SITES.filter((s) => passport.stamps[s.id]);
  const flexBadge = latestTravelBadge(xp);
  const nextBadge = nextTravelBadge(xp);

  return (
    <div className="scroll">
      <Header title={t('passport')} right={<LangToggle />} />

      <div className="ecard">
        <div className="id">{passId(passport.name)}</div>
        {flexBadge && <div className="ecard-badge"><span>{flexBadge.icon}</span>{lang === 'hi' ? flexBadge.hindi : flexBadge.title}</div>}
        <div className="who">
          <div className="av">{(passport.name || 'S')[0].toUpperCase()}</div>
          <div><div className="nm">{passport.name || t('traveller')}</div><div className="lv">{t(levelKey)}</div></div>
          <div className="xpb">{xp}<small>{t('xp')}</small></div>
        </div>
      </div>

      <h2 className="sect">Travel badges</h2>
      <div className="badge-grid">
        {TRAVEL_BADGES.map((badge) => {
          const earned = xp >= badge.xp;
          return <div key={badge.xp} className={`travel-badge ${earned ? 'earned' : ''}`}>
            <div className="badge-medal">{badge.icon}</div><b>{lang === 'hi' ? badge.hindi : badge.title}</b><small>{earned ? 'Unlocked' : `${badge.xp} XP`}</small>
          </div>;
        })}
      </div>
      {nextBadge && <div className="card panel badge-progress">
        <div className="meta">Next: {nextBadge.icon} {lang === 'hi' ? nextBadge.hindi : nextBadge.title} · {Math.max(0, nextBadge.xp - xp)} XP to go</div>
        <div className="progress-track"><i style={{ width: `${Math.min(100, (xp / nextBadge.xp) * 100)}%` }} /></div>
      </div>}

      <div className="card panel leaderboard">
        <h3>Local traveller leaderboard</h3>
        <div className="src">Saved on this device only</div>
        {leaderboard.length ? leaderboard.slice(0, 10).map((entry, index) => (
          <div key={entry.id} className="leader-row">
            <b className="leader-rank">{index + 1}</b><span className="leader-name">{entry.name}{entry.id === (user?.email || user?.name || 'local-profile').trim().toLocaleLowerCase() ? ' · You' : ''}<small>{entry.badges.length ? entry.badges.join(' · ') : 'Collect your first travel badge'}</small></span><b className="leader-xp">{entry.xp} XP</b>
          </div>
        )) : <div className="src">Stamp a place to join this device’s leaderboard.</div>}
      </div>

      <h2 className="sect">{t('stamps')} · {got.length}/{SITES.length}</h2>
      <div className="pad stamps">
        {SITES.map((s) => {
          const on = !!passport.stamps[s.id];
          return (
            <div key={s.id} className={`stampc ${on ? 'got' : ''}`} style={on ? { background: `linear-gradient(160deg, ${s.hue[0]}, ${s.hue[1]})` } : undefined}>
              <div>{on && <Icon n="check" size={22} sw={2.6} />}<div>{s.name[lang]}</div><div style={{ opacity: .8, fontWeight: 500 }}>+{s.hotspot ? 10 : 25}</div></div>
            </div>
          );
        })}
      </div>

      <div className="card panel" style={{ marginTop: 22 }}>
        <input className="input" placeholder={t('yourName')} value={passport.name} onChange={(e) => setPassport({ ...passport, name: e.target.value })} />
        <div className="toggle">
          <span>{t('demo')}</span>
          <button className={`sw ${passport.demo ? 'on' : ''}`} aria-label="Demo mode" onClick={() => setPassport({ ...passport, demo: !passport.demo })} />
        </div>
        <div><Chip tone={online ? 'green' : 'gray'}>{online ? t('online') : t('offline')}</Chip></div>
        <button className="btn-dark sm" style={{ justifySelf: 'start' }} onClick={() => setPassport({ ...passport, stamps: {} })}>{t('reset')}</button>
      </div>

      <div className="card panel">
        <h3>{t('voice')}</h3>
        {([['en', en, 'voiceEn', 'noEnVoice'], ['hi', hi, 'voiceHi', 'noHiVoice']] as const).map(([l, list, label, miss]) => (
          <div key={l} style={{ display: 'grid', gap: 8 }}>
            <div className="meta">{t(label)}</div>
            {list.length > 0 ? (
              <select className="input" value={savedVoice(l)} onChange={(e) => pickVoice(l, e.target.value)}>
                <option value="">{t('autoVoice')}</option>
                {list.map((v) => <option key={v.name} value={v.name}>{v.name}</option>)}
              </select>
            ) : <div className="src">{t(miss)}</div>}
            <button className="btn-dark sm" style={{ justifySelf: 'start' }} onClick={() => test(l)}><Icon n="speaker" size={18} />{t('testVoice')}</button>
          </div>
        ))}
        {!['en', 'hi'].includes(lang) && (() => {
          const list = voicesFor(lang, voices);
          return <div style={{ display: 'grid', gap: 8 }}>
            <div className="meta">{nativeName(lang)}</div>
            {list.length > 0
              ? <select className="input" value={savedVoice(lang)} onChange={(e) => pickVoice(lang, e.target.value)}>
                  <option value="">{t('autoVoice')}</option>
                  {list.map((v) => <option key={v.name} value={v.name}>{v.name}</option>)}
                </select>
              : <div className="src">{t('regionalVoiceNote')}</div>}
            <button className="btn-dark sm" style={{ justifySelf: 'start' }} onClick={() => test(lang)}><Icon n="speaker" size={18} />{t('testVoice')}</button>
          </div>;
        })()}
        {cloudAvailable && (
          <div className="seg" style={{ justifySelf: 'start' }}>
            <button className={gender() === 'f' ? 'on' : ''} onClick={() => { setGender('f'); force((x) => x + 1); }}>{t('female')}</button>
            <button className={gender() === 'm' ? 'on' : ''} onClick={() => { setGender('m'); force((x) => x + 1); }}>{t('male')}</button>
          </div>
        )}
      </div>

      <div className="card panel">
        {user && <div className="meta">{user.email || (user.method === 'guest' ? 'Guest' : user.name)}{traveller && <> · <Chip tone="gray">{t(traveller.type)}</Chip></>}</div>}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-dark sm" onClick={() => setTraveller(null)}>{t('editTrip')}</button>
          <button className="pill" style={{ height: 48 }} onClick={signOut}><Icon n="logout" size={20} />{t('signOut')}</button>
        </div>
      </div>
    </div>
  );
}
