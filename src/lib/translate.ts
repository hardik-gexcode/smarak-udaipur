import { PARTNERS, SITES } from '../data/sites';
import { OFFLINE_LANG_CODES } from './offlinePacks';

const SITE_FIELDS = ['name', 'tag', 'built', 'story', 'legacy', 'tip'] as const;

/** Only languages whose UI strings ship in the JavaScript bundle are selectable. */
export const isBuiltIn = (code: string) => code === 'en' || code === 'hi' || OFFLINE_LANG_CODES.has(code);

/** Prepares readable site/partner fallbacks synchronously; this never uses storage or network. */
export function loadCachedPack(code: string): boolean {
  if (!isBuiltIn(code)) return false;
  for (const site of SITES) for (const field of SITE_FIELDS) {
    if (!site[field][code]) site[field][code] = site[field].en;
  }
  for (const partner of PARTNERS) {
    if (partner.craft && !partner.craft[code]) partner.craft[code] = partner.craft.en;
    partner.badges?.forEach((badge) => { if (!badge[code]) badge[code] = badge.en; });
  }
  return true;
}
