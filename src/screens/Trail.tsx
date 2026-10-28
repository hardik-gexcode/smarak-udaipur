import { useState } from 'react';
import { PARTNERS, siteById } from '../data/sites';
import { useApp } from '../lib/app';
import { openMap, pref } from '../lib/maps';
import { Chip, Header, Icon, Photo } from '../ui';

export default function Trail() {
  const { t, lang, go } = useApp();
  const [tab, setTab] = useState<'artisan' | 'stay'>(pref.get('trail', 'artisan') as 'artisan' | 'stay');
  const list = PARTNERS.filter((p) => p.kind === tab);

  return (
    <div className="scroll">
      <Header
        title={t('trail')}
        right={
          <div className="seg">
            <button className={tab === 'artisan' ? 'on' : ''} onClick={() => setTab('artisan')}>{t('artisans')}</button>
            <button className={tab === 'stay' ? 'on' : ''} onClick={() => setTab('stay')}>{t('stays')}</button>
          </div>
        }
      />
      {list.map((p) => {
        const near = siteById(p.nearSite);
        return (
          <div key={p.id} className="card panel" style={{ margin: '0 18px 14px' }}>
            {p.img && <Photo src={p.img} alt={p.name} />}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {tab === 'artisan'
                ? <Chip>{p.craft![lang]}</Chip>
                : p.badges!.map((b, i) => <Chip key={i} tone="green">{b[lang]}</Chip>)}
            </div>
            <h3 style={{ fontSize: 22 }}>{p.name}</h3>
            <div className="meta"><Icon n="pin" size={18} />{near.name[lang]}</div>
            <div className="actions" style={{ marginTop: 4 }}>
              <button className="btn-dark sm" onClick={() => openMap(p)}><Icon n="nav" size={18} />{t('direction')}</button>
              <button className="btn-round" style={{ width: 48, height: 48 }} aria-label="Site" onClick={() => go({ name: 'site', id: near.id })}><Icon n="arrow" size={20} /></button>
              {p.website
                ? <a className="src" href={p.website} target="_blank" rel="noreferrer">{t('website')}</a>
                : <span className="src" style={{ marginLeft: 'auto' }}>{t('sample')}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
