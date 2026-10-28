import { AppProvider, useApp } from './lib/app';
import { Icon } from './ui';
import { nativeName } from './lib/langs';
import Home from './screens/Home';
import Explore from './screens/Explore';
import SiteScreen from './screens/Site';
import Trail from './screens/Trail';
import Passport from './screens/Passport';
import ARView from './screens/ARView';
import Login from './screens/Login';
import Onboarding from './screens/Onboarding';

const TABS = [
  ['home', 'home'], ['explore', 'compass'], ['trail', 'bag'], ['passport', 'award'],
] as const;

function Shell() {
  const { screen, go, t, user, traveller, busyLang, langError } = useApp();
  const overlay = (<>{busyLang && <div className="overlay"><div><img src="/logo.png" width={96} height={96} alt="" style={{ borderRadius: 24 }} /><h3 style={{ marginTop: 14 }}>{t('translating')} {nativeName(busyLang.code)}…</h3><div className="bar2"><i style={{ width: `${Math.max(6, busyLang.pct)}%` }} /></div></div></div>}{langError && <div className="toast" style={{ zIndex: 120, top: 20, bottom: 'auto' }}>{t('translateFail')}</div>}</>);
  if (!user) return <div className="phone">{overlay}<Login /></div>;
  if (!traveller) return <div className="phone">{overlay}<Onboarding /></div>;
  const activeTab = screen.name === 'site' ? 'explore' : screen.name;
  const key = 'id' in screen ? `${screen.name}:${screen.id}` : screen.name;

  return (
    <div className="phone">
      {busyLang && <div className="overlay"><div><img src="/logo.png" width={96} height={96} alt="" style={{ borderRadius: 24 }} /><h3 style={{ marginTop: 14 }}>{t('translating')} {nativeName(busyLang.code)}…</h3><div className="bar2"><i style={{ width: `${Math.max(6, busyLang.pct)}%` }} /></div></div></div>}
      {langError && <div className="toast" style={{ zIndex: 120, top: 20, bottom: 'auto' }}>{t('translateFail')}</div>}
      <div key={key} style={{ height: '100%' }}>
        {screen.name === 'home' && <Home />}
        {screen.name === 'explore' && <Explore />}
        {screen.name === 'trail' && <Trail />}
        {screen.name === 'passport' && <Passport />}
        {screen.name === 'site' && <SiteScreen id={screen.id} />}
        {screen.name === 'ar' && <ARView id={screen.id} />}
      </div>
      {screen.name !== 'ar' && (
        <nav className="tabbar">
          {TABS.map(([name, icon]) => (
            <button key={name} className={`tab ${activeTab === name ? 'on' : ''} ${name === 'explore' ? '' : 'fl'}`} onClick={() => go({ name })}>
              <Icon n={icon} size={28} />
              {t(name)}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

export default function App() {
  return <AppProvider><Shell /></AppProvider>;
}
