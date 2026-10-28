import { AppProvider, useApp } from './lib/app';
import { Icon } from './ui';
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
  const { screen, go, t, user, traveller } = useApp();
  if (!user) return <div className="phone"><Login /></div>;
  if (!traveller) return <div className="phone"><Onboarding /></div>;
  const activeTab = screen.name === 'site' ? 'explore' : screen.name;
  const key = 'id' in screen ? `${screen.name}:${screen.id}` : screen.name;

  return (
    <div className="phone">
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
