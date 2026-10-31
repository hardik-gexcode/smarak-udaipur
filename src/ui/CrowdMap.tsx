import { useMemo } from 'react';
import { useApp } from '../lib/app';
import { density, levelOf } from '../lib/crowd';
import { SITES } from '../data/sites';

const ZOOM = 11;
const SIZE = 256;
const WIDTH = 1000;
const HEIGHT = 520;
const mercator = (lat: number, lng: number) => {
  const scale = SIZE * 2 ** ZOOM;
  const safeLat = Math.max(-85.0511, Math.min(85.0511, lat));
  const sin = Math.sin(safeLat * Math.PI / 180);
  return { x: (lng + 180) / 360 * scale, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale };
};

export default function CrowdMap() {
  const { lang, go } = useApp();
  const sites = useMemo(() => SITES.filter((site) => site.area === 'udaipur'), []);
  const center = mercator(24.5854, 73.7125);
  const left = center.x - WIDTH / 2;
  const top = center.y - HEIGHT / 2;
  const tiles = [];
  for (let x = Math.floor(left / SIZE); x <= Math.floor((left + WIDTH) / SIZE); x++) {
    for (let y = Math.floor(top / SIZE); y <= Math.floor((top + HEIGHT) / SIZE); y++) {
      const wrappedX = ((x % 2 ** ZOOM) + 2 ** ZOOM) % 2 ** ZOOM;
      tiles.push({ key: `${x}-${y}`, x: x * SIZE - left, y: y * SIZE - top, url: `https://tile.openstreetmap.org/${ZOOM}/${wrappedX}/${y}.png` });
    }
  }
  return <div className="map-frame" role="group" aria-label="Udaipur map with estimated crowd levels for destinations">
    <svg className="crowd-map-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid slice" aria-hidden="false">
      <defs>
        <radialGradient id="heat-low"><stop offset="0" stopColor="#1da765" stopOpacity=".64"/><stop offset="1" stopColor="#1da765" stopOpacity="0"/></radialGradient>
        <radialGradient id="heat-mid"><stop offset="0" stopColor="#f5a623" stopOpacity=".7"/><stop offset="1" stopColor="#f5a623" stopOpacity="0"/></radialGradient>
        <radialGradient id="heat-high"><stop offset="0" stopColor="#d91524" stopOpacity=".82"/><stop offset="1" stopColor="#d91524" stopOpacity="0"/></radialGradient>
        <filter id="label-shadow"><feMorphology in="SourceAlpha" operator="dilate" radius="2" result="dilated"/><feFlood floodColor="#14232a"/><feComposite in2="dilated" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width={WIDTH} height={HEIGHT} fill="#d7e5d8"/>
      {tiles.filter((tile) => {
        const tileY = Math.floor((tile.y + top) / SIZE);
        return tileY >= 0 && tileY < 2 ** ZOOM;
      }).map((tile) => <image key={tile.key} href={tile.url} x={tile.x} y={tile.y} width={SIZE} height={SIZE} preserveAspectRatio="none" />)}
      <rect width={WIDTH} height={HEIGHT} fill="#102024" opacity=".13" pointerEvents="none"/>
      {sites.map((site) => {
        const point = mercator(site.lat, site.lng);
        const x = point.x - left;
        const y = point.y - top;
        if (x < -20 || x > WIDTH + 20 || y < -20 || y > HEIGHT + 20) return null;
        const crowd = density(site);
        const band = levelOf(crowd) === 'quiet' ? 'low' : levelOf(crowd) === 'busy' ? 'mid' : 'high';
        const label = site.name[lang] ?? site.name.en;
        return <g key={site.id} className={`heat-pin ${band}`} role="button" tabIndex={0} aria-label={`${label}, ${crowd}% estimated crowd`} onClick={() => go({ name: 'site', id: site.id })} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); go({ name: 'site', id: site.id }); } }}>
          <circle className="heat-glow" cx={x} cy={y} r={58 + crowd * .55}/>
          <circle className="heat-marker" cx={x} cy={y} r="7"/>
          <circle className="heat-core" cx={x} cy={y} r="2.5"/>
          <text className="heat-label" x={x + 10} y={y - 9} filter="url(#label-shadow)">{label}</text>
          <text className="heat-percent" x={x + 10} y={y + 8}>{crowd}%</text>
        </g>;
      })}
      <g className="map-city-label" transform="translate(500 260)"><circle r="5"/><text x="10" y="4">UDAIPUR</text></g>
    </svg>
    <div className="map-attribution">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors</div>
  </div>;
}
