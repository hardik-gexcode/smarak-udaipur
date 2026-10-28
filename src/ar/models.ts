import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Kind } from '../data/sites';

/*
 * Each monument has its own hand-built model that follows its real silhouette (see BUILDERS below).
 * They are approximations. For a photoreal result drop a scanned model at public/models/<site-id>.glb and the
 * app will use it automatically instead (see loadGlbModel).
 */

const mat = (color: number, rough = 0.85, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.02, ...extra });

const STONE = mat(0xf0e6d2), MARBLE = mat(0xf8f5ee, 0.6), SAND = mat(0xdcc193), SANDSTONE = mat(0xc98f64), PINK = mat(0xd8a69a);
const YELLOW = mat(0xe3c06a), GOLD = mat(0xe0a92e, 0.35, { metalness: 0.5 }), COPPER = mat(0xb8642f, 0.55);
const DARK = mat(0x2d2019, 0.7), BLACK = mat(0x15110f, 0.5), TEAL = mat(0x3f9a8e), GREEN = mat(0x4f8f5a), ROCK = mat(0xa9a69e, 1);
const HILL = mat(0x8a7a5f, 1), EARTH = mat(0xc9a64a, 1), TRUNK = mat(0x5b3f2a), LEAF = mat(0x4f8f4a, 1);
const WATER = mat(0x3d6c8f, 0.2, { metalness: 0.3, transparent: true, opacity: 0.88 });
const SPRAY = mat(0xcfe9ff, 0.3, { transparent: true, opacity: 0.8 });
const HORSE = mat(0xece7df, 0.8);

type V3 = [number, number, number];
const box = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material = STONE) => {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y + h / 2, z);
  return o;
};
const cyl = (rt: number, rb: number, h: number, x: number, y: number, z: number, m: THREE.Material = STONE, seg = 24) => {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  o.position.set(x, y + h / 2, z);
  return o;
};
const ball = (r: number, x: number, y: number, z: number, m: THREE.Material = STONE) => {
  const o = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), m);
  o.position.set(x, y, z);
  return o;
};
const dome = (r: number, x: number, y: number, z: number, m: THREE.Material = STONE, finial = true) => {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), m));
  if (finial) g.add(cyl(0.02 * r + 0.01, 0.02 * r + 0.01, r * 0.55, 0, r * 0.98, 0, GOLD, 6));
  g.position.set(x, y, z);
  return g;
};
const chhatri = (x: number, y: number, z: number, s = 1, m: THREE.Material = STONE) => {
  const g = new THREE.Group();
  const h = 0.9 * s;
  for (const a of [-1, 1]) for (const b of [-1, 1]) g.add(cyl(0.06 * s, 0.06 * s, h, a * 0.28 * s, 0, b * 0.28 * s, m, 10));
  g.add(box(0.8 * s, 0.07 * s, 0.8 * s, 0, h, 0, m), dome(0.34 * s, 0, h + 0.07 * s, 0, m));
  g.position.set(x, y, z);
  return g;
};
const tree = (x: number, z: number, y = 0, s = 1) => {
  const g = new THREE.Group();
  g.add(cyl(0.07 * s, 0.1 * s, 0.7 * s, 0, 0, 0, TRUNK, 6), ball(0.45 * s, 0, 0.95 * s, 0, LEAF));
  g.position.set(x, y, z);
  return g;
};

/** Instanced copies of one geometry, for rows of windows and battlements without hundreds of draw calls. */
const inst = (geo: THREE.BufferGeometry, m: THREE.Material, pts: V3[], rotY = 0) => {
  const im = new THREE.InstancedMesh(geo, m, pts.length);
  const d = new THREE.Object3D();
  pts.forEach((p, i) => { d.position.set(...p); d.rotation.y = rotY; d.updateMatrix(); im.setMatrixAt(i, d.matrix); });
  return im;
};
const archGeo = (w: number, h: number, depth = 0.06) => {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(-w / 2, h - w / 2); s.absarc(0, h - w / 2, w / 2, Math.PI, 0, true); s.lineTo(w / 2, 0); s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
};
const arch = (w: number, h: number, x: number, y: number, z: number, m: THREE.Material = DARK) => {
  const o = new THREE.Mesh(archGeo(w, h), m);
  o.position.set(x, y, z);
  return o;
};
const row = (n: number, x0: number, x1: number, y: number, z: number): V3[] =>
  Array.from({ length: n }, (_, i) => [n === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * i) / (n - 1), y, z] as V3);

/** A row of pointed-arch windows along a facade. */
const windows = (n: number, x0: number, x1: number, y: number, z: number, w = 0.22, h = 0.5, m: THREE.Material = DARK) => inst(archGeo(w, h), m, row(n, x0, x1, y, z));
/** Battlements (kangura) along a straight wall. */
const crenel = (x0: number, x1: number, y: number, z: number, m: THREE.Material = SAND) =>
  inst(new THREE.BoxGeometry(0.17, 0.22, 0.14), m, row(Math.max(2, Math.floor((x1 - x0) / 0.32)), x0, x1, y + 0.11, z));

function octTower(r: number, h: number, x: number, y: number, z: number, m: THREE.Material = STONE, domeM: THREE.Material = STONE) {
  const g = new THREE.Group();
  g.add(cyl(r * 0.92, r, h, 0, 0, 0, m, 8));
  for (const f of [0.33, 0.66]) g.add(cyl(r * 1.1, r * 1.1, 0.1, 0, h * f, 0, SAND, 8));
  g.add(cyl(r * 1.18, r * 1.05, 0.14, 0, h, 0, SAND, 8), dome(r * 1.1, 0, h + 0.14, 0, domeM));
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const w = new THREE.Mesh(archGeo(r * 0.36, r * 0.9, 0.05), DARK);
    w.position.set(Math.sin(a) * r * 0.96, h * 0.52, Math.cos(a) * r * 0.96);
    w.rotation.y = a;
    g.add(w);
  }
  g.position.set(x, y, z);
  return g;
}

/** Curved north-Indian temple tower (shikhara) with ribs, amalaka disc, kalash and flag. */
function shikhara(h: number, r: number, x: number, y: number, z: number, m: THREE.Material = STONE, flag = true) {
  const g = new THREE.Group();
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    pts.push(new THREE.Vector2(r * (1 - Math.pow(t, 1.35) * 0.9) * (1 + 0.05 * Math.sin(t * 46)), t * h));
  }
  const bodyMat = (m as THREE.MeshStandardMaterial).clone();
  bodyMat.flatShading = true;
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 14), bodyMat));
  g.add(cyl(r * 0.24, r * 0.24, h * 0.04, 0, h, 0, SAND, 16), ball(r * 0.12, 0, h + h * 0.07, 0, GOLD));
  if (flag) g.add(cyl(0.012, 0.012, h * 0.2, 0, h + h * 0.08, 0, GOLD, 6), box(0.22, 0.12, 0.01, 0.12, h + h * 0.22, 0, mat(0xe0661c)));
  g.position.set(x, y, z);
  return g;
}

function pyramidRoof(w: number, h: number, x: number, y: number, z: number, m: THREE.Material = STONE) {
  const o = new THREE.Mesh(new THREE.ConeGeometry(w * 0.72, h, 4), m);
  o.rotation.y = Math.PI / 4;
  o.position.set(x, y + h / 2, z);
  return o;
}

function elephant(x: number, y: number, z: number) {
  const g = new THREE.Group();
  g.add(box(0.9, 0.35, 1.3, 0, 0, 0, STONE));
  g.add(box(0.62, 0.55, 0.95, 0, 0.35, -0.05, ROCK), box(0.4, 0.45, 0.4, 0, 0.45, 0.55, ROCK), cyl(0.06, 0.09, 0.5, 0, 0.1, 0.8, ROCK, 8));
  for (const a of [-1, 1]) for (const b of [-1, 1]) g.add(cyl(0.09, 0.1, 0.35, a * 0.22, 0.35, b * 0.33, ROCK, 8));
  g.position.set(x, y, z);
  return g;
}

function horse(x: number, y: number, z: number, s = 1) {
  const g = new THREE.Group();
  g.add(box(0.9, 0.45, 0.4, 0, 0.55, 0, HORSE));
  const neck = box(0.22, 0.6, 0.26, 0.5, 0.75, 0, HORSE);
  neck.rotation.z = -0.5;
  g.add(neck, box(0.4, 0.2, 0.22, 0.85, 1.3, 0, HORSE));
  for (const a of [-1, 1]) for (const b of [-1, 1]) g.add(cyl(0.06, 0.05, 0.6, a * 0.32, 0, b * 0.14, HORSE, 6));
  g.add(box(0.1, 0.1, 0.1, -0.5, 0.95, 0, HORSE));
  g.scale.setScalar(s);
  g.position.set(x, y, z);
  return g;
}

const water = (r: number, x = 0, y = -0.1, z = 0) => cyl(r, r, 0.12, x, y, z, WATER, 48);
const hillMound = (rt: number, rb: number, h: number, x: number, z: number, m: THREE.Material = HILL) => cyl(rt, rb, h, x, -0.1, z, m, 14);

/* ------------------------------------------------------------------ monuments ------------------------------------------------------------------ */

function cityPalace() {
  const g = new THREE.Group();
  g.add(water(11, 0, -0.1, 3.5));
  g.add(box(17, 1.3, 1, 0, 0, 3.0, SAND), crenel(-8, 8, 1.3, 3.4, SAND));
  for (let i = 0; i < 4; i++) g.add(box(4.2, 0.2 * (4 - i), 0.3, 1.5, 0, 3.7 + i * 0.3, SAND));
  g.add(box(7.6, 2.5, 2.6, -1.5, 1.3, 0), box(6.2, 1.8, 2.2, -1.5, 3.8, 0), box(6.2, 0.15, 2.4, -1.5, 5.6, 0, SAND));
  g.add(box(6.2, 2.1, 2.4, 5.4, 1.3, 0), box(4.6, 1.3, 2.0, 5.4, 3.4, 0), box(3.4, 1.6, 2.0, -6.8, 1.3, 0), box(3.4, 1.0, 1.7, -6.8, 2.9, 0));
  g.add(box(17, 0.2, 2.8, 0, 1.15, 0.2, SAND));
  // domed octagonal corner towers, as seen from the lake
  g.add(octTower(0.75, 4.9, -5.2, 1.3, 1.45), octTower(0.7, 5.3, 2.2, 1.3, 1.45), octTower(1.0, 4.6, 8.7, 1.3, 1.2));
  g.add(octTower(0.4, 1.3, -3.2, 5.6, 0.2), octTower(0.4, 1.5, -1.5, 5.6, 0.2), octTower(0.4, 1.3, 0.2, 5.6, 0.2));
  g.add(octTower(0.5, 2.4, -8.3, 1.3, 0.8));
  g.add(windows(14, -4.6, 1.8, 2.1, 1.31), windows(14, -4.6, 1.8, 3.1, 1.31), windows(10, -4.2, 1.2, 4.3, 1.11), windows(9, 3.8, 8.0, 2.0, 1.31), windows(8, 3.8, 7.6, 3.5, 1.01));
  for (const x of [-4.2, -2.4, -0.6, 1.0]) g.add(box(0.7, 0.12, 0.5, x, 2.9, 1.5, SAND), box(0.7, 0.55, 0.05, x, 3.02, 1.75, DARK), chhatri(x, 3.55, 1.5, 0.55));
  for (const x of [-3, -0.6]) g.add(chhatri(x, 5.75, -0.4, 0.9));
  g.add(tree(-9.3, 3.4, 0, 1.4), tree(-8.4, 3.9, 0, 1.1));
  return g;
}

function jagdishTemple() {
  const g = new THREE.Group();
  g.add(box(7, 2.3, 8.5, 0, 0, -1.2, SAND), box(6.2, 0.18, 7.7, 0, 2.3, -1.2, STONE));
  for (let i = 0; i < 14; i++) g.add(box(2.8, 2.3 - i * 0.16, 0.3, 0, 0, 3.0 + i * 0.3, STONE)); // the long front stair
  g.add(elephant(-1.95, 0, 3.1), elephant(1.95, 0, 3.1));
  g.add(box(3.2, 1.2, 2.4, 0, 2.48, 1.7), box(3.5, 0.15, 2.7, 0, 3.68, 1.7, SAND), pyramidRoof(3.4, 1.0, 0, 3.83, 1.7, STONE));
  for (const x of [-1.4, -0.5, 0.5, 1.4]) g.add(cyl(0.1, 0.1, 1.2, x, 2.48, 2.8, STONE, 10));
  g.add(box(3.0, 1.9, 2.4, 0, 2.48, -0.7), pyramidRoof(3.2, 1.2, 0, 4.38, -0.7, STONE));
  g.add(box(2.4, 2.2, 2.4, 0, 2.48, -2.9), shikhara(5.6, 1.45, 0, 4.68, -2.9, STONE));
  for (const [x, z] of [[-2.3, -1.2], [2.3, -1.2], [-2.3, -3.4], [2.3, -3.4]]) g.add(box(0.9, 0.9, 0.9, x, 2.48, z), shikhara(1.6, 0.5, x, 3.38, z, STONE, false));
  return g;
}

function lakePalace() {
  const g = new THREE.Group();
  g.add(water(9.5), cyl(5.6, 5.9, 0.5, 0, -0.15, 0, SAND, 48));
  g.add(box(10, 1.8, 2.8, 0, 0.35, 0.3, MARBLE), box(9.2, 1.4, 2.4, 0, 2.15, 0.3, MARBLE), box(10.2, 0.14, 3.0, 0, 3.55, 0.3, STONE));
  g.add(windows(14, -4.3, 4.3, 0.95, 1.73, 0.3, 0.8), windows(12, -4.1, 4.1, 2.4, 1.53, 0.26, 0.7));
  for (const x of [-4.8, 4.8]) for (const z of [-0.9, 1.5]) g.add(octTower(0.42, 2.9, x, 0.35, z, MARBLE, MARBLE));
  g.add(box(2.4, 1.2, 1.4, 1.2, 0.35, 1.9, SAND), chhatri(0.5, 1.55, 1.9, 1.0, SAND), chhatri(1.2, 1.55, 1.9, 1.0, SAND), chhatri(1.9, 1.55, 1.9, 1.0, SAND));
  for (const x of [-3, -1.5, 0.5, 2.5, 3.8]) g.add(chhatri(x, 3.7, -0.4, 0.7, MARBLE));
  g.add(tree(-4.6, 2.4, 0.35, 1.3), tree(-3.6, 3.1, 0.35, 1.1), tree(-2.6, 2.7, 0.35, 1.2), tree(3.8, -2.2, 0.35, 1.2), tree(-4.2, -2.4, 0.35, 1.1));
  g.add(box(2.6, 0.12, 0.7, 3.2, 0.3, 3.4, STONE));
  return g;
}

function saheliyon() {
  const g = new THREE.Group();
  g.add(cyl(5.2, 5.2, 0.15, 0, -0.1, 0, GREEN, 40), cyl(2.1, 2.1, 0.3, 0, 0, 0, TEAL, 36), cyl(1.9, 1.9, 0.22, 0, 0.05, 0, WATER, 36));
  // central domed pavilion standing in the pool, as in the real garden
  g.add(cyl(0.9, 0.95, 0.5, 0, 0.1, 0, STONE, 8));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.add(cyl(0.07, 0.07, 1.2, Math.cos(a) * 0.72, 0.6, Math.sin(a) * 0.72, STONE, 8)); }
  g.add(cyl(0.95, 0.95, 0.1, 0, 1.8, 0, STONE, 8), dome(0.85, 0, 1.9, 0, mat(0xe8c98a)));
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.3; g.add(cyl(0.025, 0.04, 0.7 + (i % 3) * 0.3, Math.cos(a) * 1.5, 0.2, Math.sin(a) * 1.5, SPRAY, 8)); }
  for (const [x, z] of [[-3.4, 0], [3.4, 0]]) g.add(chhatri(x, 0, z, 1.1, mat(0xe8c98a)));
  g.add(box(10.4, 0.9, 0.25, 0, 0, -5, MARBLE), box(0.25, 0.9, 10.4, -5, 0, 0, MARBLE), box(0.25, 0.9, 10.4, 5, 0, 0, MARBLE));
  g.add(windows(8, -4, 4, 0.15, -4.86, 0.5, 0.6, TEAL));
  g.add(tree(-3.6, 3.6, 0, 1.2), tree(3.6, 3.6, 0, 1.2), tree(-3.6, -3.6, 0, 1.2), tree(3.6, -3.6, 0, 1.2));
  return g;
}

function bagoreHaveli() {
  const g = new THREE.Group();
  g.add(box(9, 3.4, 2.6, 0, 0, 0, YELLOW), box(9.4, 0.18, 2.9, 0, 3.4, 0, SAND), crenel(-4.5, 4.5, 3.58, 1.3, SAND));
  g.add(box(4.2, 1.5, 2.2, 0, 3.58, -0.1, YELLOW), box(4.5, 0.15, 2.5, 0, 5.08, -0.1, SAND));
  g.add(arch(1.7, 2.6, 0, 0, 1.31, BLACK), arch(1.2, 2.0, 0, 0, 1.33, mat(0xe8a8bc)));
  g.add(box(2.4, 0.9, 0.05, -3.1, 0.2, 1.32, TEAL), box(2.4, 0.9, 0.05, 3.1, 0.2, 1.32, TEAL));
  for (const x of [-2.6, 2.6]) g.add(box(1.1, 0.12, 0.7, x, 2.3, 1.45, SAND), box(1.1, 0.7, 0.05, x, 2.42, 1.7, DARK), chhatri(x, 3.15, 1.45, 0.6, YELLOW));
  g.add(windows(3, -1.2, 1.2, 4.0, 1.0, 0.55, 1.0, mat(0x9fc4e8)), windows(6, -3.8, 3.8, 2.4, 1.31, 0.24, 0.6));
  for (const x of [-3.8, 3.8]) g.add(chhatri(x, 3.55, 0.4, 0.9, YELLOW));
  for (const x of [-1.6, 1.6]) {
    const c = cyl(0.12, 0.14, 1.3, x, 0, 2.2, BLACK, 10);
    c.rotation.x = Math.PI / 2; c.position.y = 0.35;
    g.add(c, cyl(0.28, 0.28, 0.08, x, 0, 2.2, DARK, 12));
  }
  for (let i = 0; i < 5; i++) g.add(box(6, 0.1 * (5 - i), 0.3, 0, 0, 3.2 + i * 0.3, SAND));
  g.add(cyl(7, 7, 0.06, 0, -0.08, 6.4, WATER, 40));
  return g;
}

function sajjangarh() {
  const g = new THREE.Group();
  g.add(hillMound(1.6, 5.2, 3.6, 0, 0), hillMound(0.8, 2.6, 4.4, -3, -1.2, mat(0x7c6d54, 1)));
  const t = 3.4;
  g.add(box(4.8, 1.4, 2.4, 0, t, 0, MARBLE), box(3.4, 1.2, 1.9, 0, t + 1.4, 0, MARBLE), crenel(-2.4, 2.4, t + 1.4, 1.2, STONE));
  g.add(box(1.3, 3.1, 1.3, 1.6, t + 1.4, 0, MARBLE), box(1.5, 0.12, 1.5, 1.6, t + 2.6, 0, STONE), chhatri(1.6, t + 4.5, 0, 0.95, MARBLE));
  g.add(box(1.1, 2.0, 1.1, -1.5, t + 1.4, 0, MARBLE), chhatri(-1.5, t + 3.4, 0, 0.8, MARBLE));
  for (const x of [-2.3, 2.3]) g.add(cyl(0.75, 0.85, 1.7, x, t - 0.3, 1.0, MARBLE, 18), dome(0.72, x, t + 1.4, 1.0, MARBLE));
  g.add(windows(7, -2, 2, t + 0.5, 1.21, 0.25, 0.6), windows(5, -1.3, 1.3, t + 1.7, 0.96, 0.22, 0.5));
  g.add(tree(-3.2, 2.6, 0.2, 1.1), tree(2.5, 3.0, 0.1, 1.0));
  return g;
}

function aharCenotaphs() {
  const g = new THREE.Group();
  g.add(box(9, 0.3, 6, 0, 0, 0, SAND), cyl(5.5, 5.5, 0.05, 0, -0.05, 0, mat(0x9ab36a, 1), 30));
  let i = 0;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++, i++) {
    const s = 0.8 + ((i * 37) % 7) * 0.07 + (r === 1 && c === 2 ? 0.55 : 0);
    const x = -3.4 + c * 1.7 + (r % 2) * 0.35, z = -1.9 + r * 1.9;
    g.add(box(1.1 * s, 0.45 * s, 1.1 * s, x, 0.3, z, SAND), chhatri(x, 0.3 + 0.45 * s, z, 1.15 * s, i % 4 === 0 ? mat(0xb9b2a5) : STONE));
  }
  g.add(tree(-4.8, 2.6, 0, 1.2), tree(4.8, -2.6, 0, 1.2));
  return g;
}

function fatehSagar() {
  const g = new THREE.Group();
  g.add(water(8.5, 0, -0.1, 0), box(16, 0.5, 0.9, 0, 0, 5.2, SAND), crenel(-8, 8, 0.5, 5.2, STONE));
  g.add(hillMound(0.5, 3.4, 3.2, -6, -5.5), hillMound(0.6, 4.2, 4.0, 1, -7), hillMound(0.4, 3, 2.8, 7, -5));
  g.add(cyl(1.7, 1.9, 0.35, 1.5, -0.05, 0.5, GREEN, 24), chhatri(1.4, 0.3, 0.4, 1.0), tree(2.4, 0.9, 0.3, 1.1), tree(0.6, 0.9, 0.3, 1.0));
  g.add(box(1.3, 0.1, 0.45, -3.5, 0, 2.8, SAND), box(0.8, 0.5, 0.05, -3.5, 0.1, 2.58, mat(0xe0661c)));
  for (const x of [-5, -3, 3, 5]) g.add(tree(x, 5.9, 0, 1.2));
  return g;
}

function statueOfBelief() {
  const g = new THREE.Group();
  g.add(cyl(6, 6, 0.15, 0, -0.1, 0, GREEN, 40));
  for (let i = 0; i < 5; i++) g.add(box(7 - i * 0.7, 0.28, 7 - i * 0.7, 0, 0.05 + i * 0.28, 0, SAND));
  const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(1.9, 1), ROCK);
  rock.scale.set(1, 0.9, 1); rock.position.set(0, 2.5, 0); g.add(rock);
  const legs = cyl(0.62, 0.62, 3.4, 0, 0, 0, COPPER, 18);
  legs.rotation.z = Math.PI / 2; legs.position.set(0, 4.3, 0.15);
  g.add(legs, cyl(0.85, 1.05, 2.5, 0, 4.5, 0, COPPER, 20), ball(0.52, 0, 7.5, 0, COPPER), cyl(0, 0.34, 0.9, 0, 7.8, 0, DARK, 12));
  g.add(cyl(0.2, 0.25, 1.8, -1.2, 4.9, 0.3, COPPER, 10), cyl(0.2, 0.25, 1.8, 1.2, 4.9, 0.3, COPPER, 10));
  g.add(cyl(0.045, 0.045, 5.6, 2.1, 3.6, 0.2, GOLD, 8));
  for (const dx of [-0.22, 0, 0.22]) g.add(cyl(0, 0.08, 0.8, 2.1 + dx, 9.1, 0.2, GOLD, 8));
  for (const [x, z] of [[-4.4, -3], [4.4, -3], [-4.4, 3.4], [4.4, 3.4]]) g.add(tree(x, z, 0, 1.4));
  return g;
}

function shrinathjiGate() {
  const g = new THREE.Group();
  g.add(box(10, 3.0, 2.4, 0, 0, 0, YELLOW), box(10.4, 0.16, 2.7, 0, 3.0, 0, SAND), crenel(-5, 5, 3.16, 1.1, SAND));
  g.add(octTower(0.8, 4.0, -4.6, 0, 1.0, YELLOW, mat(0xe8d9b0)), octTower(0.55, 3.4, 4.6, 0, 1.0, YELLOW, mat(0xe8d9b0)));
  g.add(arch(2.7, 3.0, 0, 0, 1.21, TEAL), arch(2.1, 2.5, 0, 0, 1.25, DARK), arch(1.5, 2.0, 0, 0, 1.28, mat(0xf2c9d0)));
  g.add(windows(5, -3.6, -1.8, 1.8, 1.21, 0.3, 0.7), windows(5, 1.8, 3.6, 1.8, 1.21, 0.3, 0.7));
  for (let i = 0; i < 6; i++) g.add(box(3.4, 0.12 * (6 - i), 0.3, 0, 0, 1.4 + i * 0.3, SAND));
  // sanctum with golden spires behind the gate
  g.add(box(6, 2.2, 3, 0, 3.0, -2.6, STONE));
  for (const x of [-2.1, 0, 2.1]) g.add(shikhara(1.9, 0.7, x, 5.2, -2.6, mat(0xe8d6a8), true));
  g.add(dome(0.9, 0, 5.2, -3.8, mat(0xe8c98a)));
  return g;
}

function eklingji() {
  const g = new THREE.Group();
  g.add(box(9, 0.3, 8, 0, 0, 0, SAND), box(9, 1.2, 0.3, 0, 0.3, 3.9, MARBLE), box(9, 1.2, 0.3, 0, 0.3, -3.9, MARBLE), box(0.3, 1.2, 8, 4.4, 0.3, 0, MARBLE), box(0.3, 1.2, 8, -4.4, 0.3, 0, MARBLE));
  g.add(crenel(-4.5, 4.5, 1.5, 3.9, STONE), crenel(-4.5, 4.5, 1.5, -3.9, STONE));
  g.add(box(3.0, 1.6, 3.0, 0, 0.3, -1.4, MARBLE), shikhara(5.4, 1.5, 0, 1.9, -1.4, MARBLE));
  g.add(box(3.8, 1.2, 2.6, 0, 0.3, 1.3, MARBLE), pyramidRoof(3.9, 1.0, 0, 1.5, 1.3, MARBLE), pyramidRoof(2.4, 0.9, 0, 2.3, 1.3, MARBLE), dome(0.3, 0, 3.2, 1.3, GOLD, false));
  for (const x of [-1.5, -0.5, 0.5, 1.5]) g.add(cyl(0.08, 0.08, 1.2, x, 0.3, 2.7, MARBLE, 10));
  g.add(chhatri(-2.6, 0.3, 2.9, 0.8, MARBLE), arch(1.4, 1.4, 0, 0.3, 4.06, BLACK));
  for (let i = 0; i < 9; i++) for (const s of [-1, 1]) g.add(shikhara(0.9 + (i % 3) * 0.15, 0.28, s * 3.5, 0.3, -3.4 + i * 0.8, i % 2 ? STONE : MARBLE, false));
  return g;
}

function sasBahu() {
  const g = new THREE.Group();
  g.add(cyl(5.5, 5.5, 0.06, 0, -0.08, -3.5, WATER, 36), box(9, 0.5, 6, 0, 0, 0, SAND));
  const unit = (x: number, w: number, h: number) => {
    g.add(box(w, 0.35, w * 1.1, x, 0.5, 0, SAND), box(w * 0.7, 1.3, w * 0.7, x, 0.85, -0.5, STONE), shikhara(h, w * 0.4, x, 2.15, -0.5, SANDSTONE, false));
    g.add(box(w * 0.9, 0.12, w * 0.8, x, 2.03, 0.9, SAND), pyramidRoof(w * 0.95, 0.8, x, 2.15, 0.9, SANDSTONE));
    for (const px of [-0.38, 0.38]) for (const pz of [0.55, 1.2]) g.add(cyl(0.07, 0.07, 1.2, x + px * w, 0.85, pz, STONE, 8));
  };
  unit(-1.9, 3.0, 3.6);
  unit(2.6, 2.2, 2.7);
  g.add(tree(-4.2, 2, 0.5, 1.2), tree(4.4, 2.2, 0.5, 1.1));
  return g;
}

function vijayStambh() {
  const g = new THREE.Group();
  g.add(box(5, 0.35, 5, 0, 0, 0, SAND), box(3.4, 0.5, 3.4, 0, 0.35, 0, SANDSTONE));
  for (let i = 0; i < 5; i++) g.add(box(1.6, 0.1 * (5 - i), 0.28, 0, 0.35, 1.8 + i * 0.28, SAND));
  let y = 0.85;
  for (let i = 0; i < 9; i++) {
    const w = 1.9 - i * 0.1, h = 0.72;
    g.add(box(w, h, w, 0, y, 0, i % 2 ? PINK : SANDSTONE), box(w + 0.45, 0.07, w + 0.45, 0, y + h, 0, SAND));
    for (const s of [-1, 1]) for (const t of [-1, 1]) g.add(box(0.06, 0.2, 0.06, (s * (w + 0.4)) / 2, y + h + 0.07, (t * (w + 0.4)) / 2, SAND));
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2, o = new THREE.Mesh(archGeo(w * 0.28, h * 0.7, 0.05), DARK);
      o.position.set(Math.sin(a) * w * 0.5, y + h * 0.1, Math.cos(a) * w * 0.5); o.rotation.y = a; g.add(o);
    }
    y += h + 0.07;
  }
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; g.add(cyl(0.05, 0.05, 0.7, Math.cos(a) * 0.55, y, Math.sin(a) * 0.55, SAND, 8)); }
  g.add(cyl(0.65, 0.65, 0.08, 0, y + 0.7, 0, SAND, 8), dome(0.62, 0, y + 0.78, 0, SANDSTONE));
  g.add(tree(-2.2, 2, 0.35, 1.1), tree(2.3, -2, 0.35, 1.1));
  return g;
}

function chittorgarhFort() {
  const g = new THREE.Group();
  const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), HILL);
  hill.scale.set(6.2, 1.9, 2.6); hill.position.y = -0.1; g.add(hill);
  const top = 1.8;
  const N = 56;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, b = ((i + 1) / N) * Math.PI * 2;
    const p = [Math.cos(a) * 4.9, Math.sin(a) * 1.9], q = [Math.cos(b) * 4.9, Math.sin(b) * 1.9];
    const w = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(q[0] - p[0], q[1] - p[1]) + 0.05, 0.6, 0.2), SANDSTONE);
    w.position.set((p[0] + q[0]) / 2, top + 0.3, (p[1] + q[1]) / 2);
    w.rotation.y = -Math.atan2(q[1] - p[1], q[0] - p[0]);
    g.add(w);
    if (i % 7 === 0) g.add(cyl(0.28, 0.32, 0.9, p[0], top, p[1], SANDSTONE, 10));
  }
  g.add(box(1.8, 1.2, 1.0, -5.0, top, 0, SANDSTONE), arch(0.8, 0.95, -5.0, top, 0.51, BLACK), cyl(0.35, 0.4, 1.7, -5.0, top, 0.6, SANDSTONE, 10), cyl(0.35, 0.4, 1.7, -5.0, top, -0.6, SANDSTONE, 10));
  const tower = vijayStambh();
  tower.scale.setScalar(0.45); tower.position.set(2.6, top, 0.2); g.add(tower);
  g.add(box(1.4, 0.9, 1.0, -1.2, top, 0.3, STONE), cyl(0.6, 0.6, 0.06, -2.2, top, 0.9, WATER, 18), box(1.6, 1.4, 1.2, -2.8, top, -0.5, SAND));
  g.add(box(0.5, 1.2, 0.5, 0.5, top, -0.7, SAND), dome(0.35, 0.5, top + 1.2, -0.7, SAND));
  g.add(tree(-0.4, -0.9, top, 1.0), tree(1.2, 0.9, top, 1.0), tree(-3.8, 0.8, top, 0.9));
  return g;
}

function kumbhalgarh() {
  const g = new THREE.Group();
  g.add(hillMound(1.3, 5.3, 4.0, 0, 0), hillMound(0.6, 2.4, 4.8, -3.6, -1.0, mat(0x7c6d54, 1)), hillMound(0.6, 2.4, 4.4, 3.4, -1.6, mat(0x7c6d54, 1)));
  const pt = (t: number): V3 => {
    const a = t * Math.PI * 3.6, r = 5.0 - t * 3.5;
    return [Math.cos(a) * r, 0.2 + t * 3.55, Math.sin(a) * r * 0.9];
  };
  const N = 90;
  for (let i = 0; i < N; i++) {
    const p = pt(i / N), q = pt((i + 1) / N);
    const len = Math.hypot(q[0] - p[0], q[2] - p[2]);
    const w = new THREE.Mesh(new THREE.BoxGeometry(len + 0.05, 0.5, 0.2), SANDSTONE);
    w.position.set((p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + 0.25, (p[2] + q[2]) / 2);
    w.rotation.y = -Math.atan2(q[2] - p[2], q[0] - p[0]);
    g.add(w);
    if (i % 9 === 0) g.add(cyl(0.3, 0.36, 0.85, p[0], p[1], p[2], SANDSTONE, 10));
  }
  const t = 3.7;
  g.add(box(2.6, 1.1, 1.8, 0, t, 0, SAND), box(1.8, 1.0, 1.4, 0, t + 1.1, 0, STONE), chhatri(-0.5, t + 2.1, 0, 0.8), chhatri(0.5, t + 2.1, 0, 0.8), crenel(-1.3, 1.3, t + 1.1, 0.95, SAND));
  g.add(shikhara(1.1, 0.34, -2.0, 3.0, 0.8, STONE, false), shikhara(0.9, 0.3, 2.0, 2.4, -0.6, STONE, false), tree(-1.9, 0.6, 2.6, 0.8));
  return g;
}

function ranakpur() {
  const g = new THREE.Group();
  g.add(box(8, 0.7, 7, 0, 0, 0, MARBLE));
  for (let i = 0; i < 5; i++) g.add(box(3.2, 0.14 * (5 - i), 0.3, 0, 0, 3.5 + i * 0.3, MARBLE));
  g.add(box(3.0, 1.9, 3.0, 0, 0.7, -1.6, MARBLE), shikhara(4.8, 1.35, 0, 2.6, -1.6, MARBLE));
  g.add(box(3.4, 1.2, 3.0, 0, 0.7, 1.5, MARBLE));
  for (let i = 0; i < 4; i++) g.add(cyl(1.35 - i * 0.28, 1.5 - i * 0.28, 0.22, 0, 1.9 + i * 0.22, 1.5, MARBLE, 24));
  g.add(dome(0.7, 0, 2.8, 1.5, MARBLE), ball(0.1, 0, 3.55, 1.5, GOLD));
  for (const s of [-1, 1]) {
    g.add(box(1.8, 1.1, 1.8, s * 2.7, 0.7, 1.4, MARBLE), dome(0.85, s * 2.7, 1.8, 1.4, MARBLE), box(1.5, 1.4, 1.5, s * 2.9, 0.7, -2.2, MARBLE), shikhara(2.1, 0.62, s * 2.9, 2.1, -2.2, MARBLE, false));
  }
  for (let i = 0; i < 14; i++) { const x = -3.7 + i * 0.57; g.add(cyl(0.05, 0.05, 0.6, x, 0.7, 3.4, MARBLE, 8), cyl(0.05, 0.05, 0.6, x, 0.7, -3.4, MARBLE, 8)); }
  for (let i = 0; i < 7; i++) { const z = -3 + i; for (const s of [-1, 1]) g.add(cyl(0.05, 0.05, 0.6, s * 3.85, 0.7, z, MARBLE, 8)); }
  g.add(tree(-5, 3, 0, 1.6), tree(5.2, 2.2, 0, 1.5), tree(-5.2, -2.5, 0, 1.6));
  return g;
}

function haldighati() {
  const g = new THREE.Group();
  g.add(cyl(6, 6, 0.1, 0, -0.1, 0, EARTH, 36), hillMound(0.6, 3.2, 3.4, -4.8, -1.2), hillMound(0.6, 3.6, 4.0, 4.8, -1.6), hillMound(0.5, 2.8, 2.6, 0, -5.5));
  g.add(box(2.0, 0.04, 9, 0, 0, 0, mat(0xa8883a, 1)));
  g.add(box(3.4, 0.3, 3.0, 0, 0, 0.5, STONE), box(2.6, 0.3, 2.2, 0, 0.3, 0.5, SAND), horse(0.1, 0.6, 0.5, 1.4));
  for (const x of [-1.1, 1.1]) for (const z of [-0.5, 1.5]) g.add(cyl(0.06, 0.06, 1.6, x, 0.6, z, STONE, 8));
  g.add(box(2.6, 0.1, 2.2, 0, 2.2, 0.5, STONE), dome(0.9, 0, 2.3, 0.5, STONE));
  g.add(tree(-2.6, 2.6, 0, 1.2), tree(2.9, 3.0, 0, 1.1), tree(-3.5, -2.4, 0, 1.0));
  return g;
}

const BUILDERS: Record<string, () => THREE.Group> = {
  'city-palace': cityPalace, 'jagdish-temple': jagdishTemple, 'lake-palace': lakePalace, 'saheliyon-ki-bari': saheliyon,
  'bagore-ki-haveli': bagoreHaveli, sajjangarh, 'ahar-cenotaphs': aharCenotaphs, 'fateh-sagar': fatehSagar,
  shrinathji: shrinathjiGate, 'statue-of-belief': statueOfBelief, eklingji, 'nagda-sas-bahu': sasBahu,
  'vijay-stambh': vijayStambh, 'chittorgarh-fort': chittorgarhFort, kumbhalgarh, ranakpur, haldighati,
};

/** Fit a model into a ~6-8 unit box, resting on y=0 and centred. */
function normalise(g: THREE.Object3D): THREE.Group {
  const bb = new THREE.Box3().setFromObject(g);
  const size = bb.getSize(new THREE.Vector3());
  const s = Math.min(8 / size.x, 6.4 / size.y, 8 / size.z);
  g.scale.multiplyScalar(s);
  const c = bb.getCenter(new THREE.Vector3());
  g.position.set(-c.x * s, -bb.min.y * s, -c.z * s);
  const wrap = new THREE.Group();
  wrap.add(g);
  return wrap;
}

export function buildModel(id: string, _kind?: Kind): THREE.Group {
  return normalise((BUILDERS[id] ?? cityPalace)());
}

/**
 * Optional photoreal model: if public/models/<site-id>.glb exists it replaces the hand-built one.
 * The check reads the file's magic bytes because a dev server answers unknown URLs with index.html.
 */
export async function loadGlbModel(id: string): Promise<THREE.Group | null> {
  try {
    const r = await fetch(`/models/${id}.glb`);
    if (!r.ok) return null;
    const buf = await r.arrayBuffer();
    if (new TextDecoder().decode(buf.slice(0, 4)) !== 'glTF') return null;
    const gltf = await new GLTFLoader().parseAsync(buf, '');
    return normalise(gltf.scene);
  } catch {
    return null;
  }
}
