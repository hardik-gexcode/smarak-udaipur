import { PARTNERS, Site, Lang } from '../data/sites';
import { bestHour, density, fmtHour } from './crowd';
import { greeting } from './time';
import { fmt, tr } from './i18n';

/** Guide questions use the built-in heritage pack and never call a generative AI API. */
export async function ask(site: Site, q: string, lang: Lang): Promise<{ text: string; source: 'offline' }> {
  return { text: offlineAnswer(site, q, lang), source: 'offline' };
}

const has = (q: string, re: RegExp) => re.test(q.toLowerCase());

export function offlineAnswer(site: Site, q: string, lang: Lang): string {
  const L = /[\u0900-\u097F]/.test(q) ? 'hi' : lang;
  const name = site.name[L];

  if (has(q, /^\s*(hi|hello|hey|namaste|namaskar|good (morning|afternoon|evening))\b|नमस्ते|नमस्कार|हेलो|सुप्रभात/)) {
    return `${greeting(L).text}! ${tr('hello', L)} ${name}. ${site.built[L]}.`;
  }
  if (has(q, /crowd|busy|rush|quiet|best time|when to (go|visit)|भीड़|शांत|समय|कब जाएँ|कब जाएं/)) {
    const d = density(site);
    if (d < 8) return `${fmt(tr('ansQuiet', L), { name })} ${site.tip[L]}`;
    return `${fmt(tr('ansCrowd', L), { name, d, h: fmtHour(bestHour(site), L) })} ${site.tip[L]}`;
  }
  if (has(q, /artisan|craft|shop|buy|कारीगर|शिल्प|खरीद/)) {
    const p = PARTNERS.find((x) => x.nearSite === site.id && x.kind === 'artisan');
    if (p) return fmt(tr('ansCraft', L), { p: p.name, c: p.craft![L] });
  }
  if (has(q, /who|when|year|built|build|founded|कब|कितना पुराना|किसने|कौन|बनवाया|बनाया|साल/)) return `${site.built[L]}. ${site.story[L].split(/(?<=[.।])\s/)[0]}`;
  if (has(q, /famous|special|legacy|known|why|खास|विरासत|मशहूर|प्रसिद्ध|क्यों/)) return site.legacy[L];
  if (has(q, /tip|visit|कैसे|टिप/)) return site.tip[L];
  return `${site.story[L]} ${site.legacy[L]}`;
}
