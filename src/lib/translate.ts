import { PARTNERS, SITES } from '../data/sites';
import { api } from './api';
import { D, packs } from './i18n';
import { LANGS } from './langs';

const SITE_FIELDS = ['name', 'tag', 'built', 'story', 'legacy', 'tip'] as const;

/** Every English string in the app that needs translating, keyed so a pack can be applied back. */
function collectEnglish(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(D)) out[`u:${k}`] = v[0];
  for (const s of SITES) for (const f of SITE_FIELDS) out[`s:${s.id}.${f}`] = s[f].en;
  for (const p of PARTNERS) {
    if (p.craft) out[`p:${p.id}.craft`] = p.craft.en;
    p.badges?.forEach((b, i) => { out[`p:${p.id}.b${i}`] = b.en; });
  }
  return out;
}

// Bump the cache version whenever translation behavior changes. Earlier releases
// could cache untranslated English strings as if they were a completed pack.
const storeKey = (code: string) => `smarak.pack.v3.${Object.keys(collectEnglish()).length}.${code}`;

/** Writes translated strings into the live data objects, which fall back to English for anything missing. */
function applyPack(code: string, pack: Record<string, string>, complete = true) {
  if (complete) packs[code] = pack;
  for (const s of SITES) for (const f of SITE_FIELDS) { const v = pack[`s:${s.id}.${f}`]; if (v) s[f][code] = v; }
  for (const p of PARTNERS) {
    const c = pack[`p:${p.id}.craft`]; if (c && p.craft) p.craft[code] = c;
    p.badges?.forEach((b, i) => { const v = pack[`p:${p.id}.b${i}`]; if (v) b[code] = v; });
  }
}

export const isBuiltIn = (code: string) => code === 'en' || code === 'hi';

/** Loads a previously downloaded pack from the device. Returns true if the language is ready to use offline. */
export function loadCachedPack(code: string): boolean {
  if (isBuiltIn(code) || packs[code]) return true;
  try {
    const raw = localStorage.getItem(storeKey(code));
    if (!raw) return false;
    applyPack(code, JSON.parse(raw));
    return true;
  } catch { return false; }
}

/** Downloads a complete translation pack, then caches it on the device for offline use. */
export async function downloadPack(code: string, onProgress: (done: number, total: number) => void): Promise<boolean> {
  const entries = Object.entries(collectEnglish());
  const chunks: [string, string][][] = [];
  let cur: [string, string][] = [], size = 0;
  for (const e of entries) {
    if (cur.length && (size + e[1].length > 3200 || cur.length >= 20)) { chunks.push(cur); cur = []; size = 0; }
    cur.push(e); size += e[1].length;
  }
  if (cur.length) chunks.push(cur);

  const pack: Record<string, string> = {};
  onProgress(0, chunks.length);
  for (let i = 0; i < chunks.length; i++) {
    const r = await api<{ strings?: Record<string, string> }>('/api/translate', { lang: code, langName: LANGS[code]?.english ?? code, strings: Object.fromEntries(chunks[i]) }, 60000);
    const strings = r.data?.strings;
    if (!r.ok || !strings) {
      if (!Object.keys(pack).length) return false;
      break;
    }
    Object.assign(pack, strings);
    onProgress(i + 1, chunks.length);
  }
  const complete = Object.keys(pack).length === entries.length;
  if (!Object.keys(pack).length) return false;
  if (complete) {
    try { localStorage.setItem(storeKey(code), JSON.stringify(pack)); } catch { /* storage full: still usable this session */ }
  }
  // A partial network response still gives the traveller translated content;
  // missing entries fall back to English and the next selection can retry.
  applyPack(code, pack, complete);
  return true;
}
