import type { Lang } from '../data/sites';
import { Key, tr } from './i18n';

const ESS: Key[] = ['ess1', 'ess2', 'ess3', 'ess4'];
const YATRA: Key[] = ['yatra1', 'yatra2', 'yatra3'];
export const essentials = (l: Lang) => ESS.map((k) => tr(k, l));
export const yatraTips = (l: Lang) => YATRA.map((k) => tr(k, l));
