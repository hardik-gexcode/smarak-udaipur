import { useState } from 'react';
import { SITES, Site } from '../data/sites';
import { density, levelOf } from '../lib/crowd';
import { useApp } from '../lib/app';
import { openMap, pref } from '../lib/maps';
import { Chip, Cover, Header, Icon, Meter } from '../ui';

type Filter = 'all' | 'quiet' | 'hot';

export default function Explore() {
  const { t, lang, go } = useApp();
  const [view, setView] = useState<'list' | 'cards'>('list');
  const [filter, setFilter] = useState<Filter>(pref.get('filter', 'all') as Filter);

  const items = SITES.filter((s) => (filter === 'quiet' ? levelOf(density(s)) === 'quiet' : filter === 'hot' ? s.hotspot : true));
  const open = (s: Site) => go({ name: 'site', id: s.id });

  return (
    <div className="scroll">
      <Header
        title={t('explore')}
        right={
          <div className="seg" role="group">
            <button className={view === 'cards' ? 'on' : ''} onClick={() => setView('cards')} aria-label="Cards"><Icon n="card" size={20} /></button>
            <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} aria-label="List"><Icon n="list" size={20} /></button>
          </div>
        }
      />
      <div className="filters">
        {([['all', 'all'], ['quiet', 'quietNow'], ['hot', 'hotspots']] as const).map(([f, k]) => (
          <button key={f} className={`pill ${filter === f ? 'on' : ''}`} style={{ height: 44 }} onClick={() => setFilter(f)}>{t(k)}</button>
        ))}
      </div>

      {view === 'list' ? (
        items.map((s) => (
          <button key={s.id} className="card row" onClick={() => open(s)}>
            <Cover site={s} />
            <div className="info">
              <div><Chip tone={s.hotspot ? 'pink' : 'peach'}>{s.tag[lang]}</Chip></div>
              <h3>{s.name[lang]}</h3>
              <Meter d={density(s)} />
            </div>
          </button>
        ))
      ) : (
        <div className="big-rail">
          {items.map((s) => (
            <div key={s.id} className="card big">
              <Cover site={s} />
              <div className="bd">
                <div><Chip tone={s.hotspot ? 'pink' : 'peach'}>{s.tag[lang]}</Chip></div>
                <h3>{s.name[lang]}</h3>
                <div className="meta"><Icon n="pin" size={18} />{s.built[lang]}</div>
                <Meter d={density(s)} />
                <div className="actions">
                  <button className="btn-dark" onClick={() => openMap(s)}><Icon n="nav" size={20} />{t('direction')}</button>
                  <button className="btn-round" aria-label="AR" onClick={() => go({ name: 'ar', id: s.id })}><Icon n="cube" /></button>
                  <button className="btn-round" aria-label="More" onClick={() => open(s)}><Icon n="dots" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
