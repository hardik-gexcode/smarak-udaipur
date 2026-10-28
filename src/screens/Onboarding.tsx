import { useState } from 'react';
import { Theme } from '../data/sites';
import { useApp } from '../lib/app';
import { Key } from '../lib/i18n';
import { COUNTRIES, INDIAN_STATES, Traveller } from '../lib/plan';
import { languageOptions, nativeName } from '../lib/langs';
import { Header, Icon, LangToggle } from '../ui';

const THEMES: [Theme, Key][] = [['history', 'themeHistory'], ['spiritual', 'themeSpiritual'], ['art', 'themeArt'], ['nature', 'themeNature'], ['photo', 'themePhoto']];
const GROUPS: Traveller['group'][] = ['solo', 'couple', 'family', 'friends'];

const Chips = <T extends string | number>({ items, value, onPick }: { items: [T, string][]; value: T | T[]; onPick: (v: T) => void }) => (
  <div className="filters" style={{ padding: 0, flexWrap: 'wrap', overflow: 'visible' }}>
    {items.map(([v, label]) => (
      <button key={String(v)} className={`pill ${(Array.isArray(value) ? value.includes(v) : value === v) ? 'on' : ''}`} style={{ height: 44 }} onClick={() => onPick(v)}>{label}</button>
    ))}
  </div>
);

export default function Onboarding() {
  const { t, lang, setLang, user, setTraveller, go } = useApp();
  const [type, setType] = useState<Traveller['type'] | null>(null);
  const [name, setName] = useState(user?.name ?? '');
  const [from, setFrom] = useState('');
  const [days, setDays] = useState(2);
  const [group, setGroup] = useState<Traveller['group']>('couple');
  const [interests, setInterests] = useState<Theme[]>(['history']);
  const [firstTime, setFirstTime] = useState(true);
  const langs = type ? languageOptions(type, from) : [];

  const choose = (ty: Traveller['type']) => { setType(ty); if (ty === 'foreign') setLang('en'); };
  // Picking a state or country offers that region's language in the options below (e.g. Gujarat -> Gujarati, Germany -> Deutsch).
  const pickFrom = (v: string) => { setFrom(v); };
  const toggle = (th: Theme) => setInterests((x) => (x.includes(th) ? x.filter((y) => y !== th) : [...x, th]));
  const finish = () => {
    setTraveller({ type: type!, name: name.trim() || (type === 'foreign' ? 'Guest' : 'यात्री'), from, days, group, interests: interests.length ? interests : ['history'], firstTime });
    go({ name: 'home' });
  };

  if (!type) {
    return (
      <div className="scroll">
        <Header title={t('whoAreYou')} right={<LangToggle />} />
        {([['indian', 'pin', 'indianSub'], ['foreign', 'globe', 'foreignSub']] as const).map(([ty, icon, sub]) => (
          <button key={ty} className="card panel" style={{ width: 'calc(100% - 36px)', textAlign: 'left', gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: 18 }} onClick={() => choose(ty)}>
            <span className="btn-round dark" style={{ width: 64, height: 64 }}><Icon n={icon} size={30} /></span>
            <span style={{ display: 'grid', gap: 4 }}><h3 style={{ fontSize: 22 }}>{t(ty)}</h3><span className="meta">{t(sub)}</span></span>
          </button>
        ))}
      </div>
    );
  }

  const ready = name.trim().length > 0 && from.length > 0;
  return (
    <div className="scroll">
      <Header title={t('aboutTrip')} onBack={() => setType(null)} right={<LangToggle />} />
      <div className="card panel" style={{ gap: 16 }}>
        <input className="input" placeholder={t('yourName')} value={name} onChange={(e) => setName(e.target.value)} />
        <select className="input" value={from} onChange={(e) => pickFrom(e.target.value)}>
          <option value="">{type === 'indian' ? t('homeState') : t('country')}</option>
          {(type === 'indian' ? INDIAN_STATES : COUNTRIES).map((x) => <option key={x}>{x}</option>)}
        </select>

        <h3>{t('days')}</h3>
        <Chips items={[[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5+']]} value={days} onPick={setDays} />
        <h3>{t('group')}</h3>
        <Chips items={GROUPS.map((g) => [g, t(g)] as [string, string])} value={group} onPick={(g) => setGroup(g as Traveller['group'])} />
        <h3>{t('interests')}</h3>
        <Chips items={THEMES.map(([th, k]) => [th, t(k)] as [string, string])} value={interests} onPick={(th) => toggle(th as Theme)} />

        <h3>{t('chooseLang')}</h3>
        <Chips items={langs.map((c) => [c, nativeName(c)] as [string, string])} value={lang} onPick={(l) => setLang(l)} />
        {type === 'foreign' && (<><h3>{t('firstTime')}</h3><Chips items={[['y', t('yes')], ['n', t('no')]]} value={firstTime ? 'y' : 'n'} onPick={(v) => setFirstTime(v === 'y')} /><div className="src">{t('noPassport')}</div></>)}

        <button className="btn-dark" disabled={!ready} onClick={finish}>{t('start')}</button>
      </div>
    </div>
  );
}
