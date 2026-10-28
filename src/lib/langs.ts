import type { Traveller } from './plan';

export interface LangInfo { code: string; native: string; english: string; locale: string; rtl?: boolean }
const L = (code: string, native: string, english: string, locale: string, rtl = false): LangInfo => ({ code, native, english, locale, rtl });

export const LANGS: Record<string, LangInfo> = Object.fromEntries([
  L('en', 'English', 'English', 'en-IN'), L('hi', 'हिन्दी', 'Hindi', 'hi-IN'),
  L('fr', 'Français', 'French', 'fr-FR'), L('de', 'Deutsch', 'German', 'de-DE'), L('es', 'Español', 'Spanish', 'es-ES'),
  L('it', 'Italiano', 'Italian', 'it-IT'), L('pt', 'Português', 'Portuguese', 'pt-BR'), L('nl', 'Nederlands', 'Dutch', 'nl-NL'),
  L('sv', 'Svenska', 'Swedish', 'sv-SE'), L('da', 'Dansk', 'Danish', 'da-DK'), L('fi', 'Suomi', 'Finnish', 'fi-FI'),
  L('pl', 'Polski', 'Polish', 'pl-PL'), L('ru', 'Русский', 'Russian', 'ru-RU'), L('tr', 'Türkçe', 'Turkish', 'tr-TR'),
  L('he', 'עברית', 'Hebrew', 'he-IL', true), L('ar', 'العربية', 'Arabic', 'ar-SA', true),
  L('ja', '日本語', 'Japanese', 'ja-JP'), L('ko', '한국어', 'Korean', 'ko-KR'), L('zh', '中文', 'Chinese (Simplified)', 'zh-CN'),
  L('th', 'ไทย', 'Thai', 'th-TH'), L('id', 'Bahasa Indonesia', 'Indonesian', 'id-ID'), L('ms', 'Bahasa Melayu', 'Malay', 'ms-MY'),
  L('bn', 'বাংলা', 'Bengali', 'bn-IN'), L('ta', 'தமிழ்', 'Tamil', 'ta-IN'), L('te', 'తెలుగు', 'Telugu', 'te-IN'),
  L('mr', 'मराठी', 'Marathi', 'mr-IN'), L('gu', 'ગુજરાતી', 'Gujarati', 'gu-IN'), L('kn', 'ಕನ್ನಡ', 'Kannada', 'kn-IN'),
  L('ml', 'മലയാളം', 'Malayalam', 'ml-IN'), L('pa', 'ਪੰਜਾਬੀ', 'Punjabi', 'pa-IN'), L('or', 'ଓଡ଼ିଆ', 'Odia', 'or-IN'),
  L('ne', 'नेपाली', 'Nepali', 'ne-NP'), L('as', 'অসমীয়া', 'Assamese', 'as-IN'), L('ur', 'اردو', 'Urdu', 'ur-IN', true), L('si', 'සිංහල', 'Sinhala', 'si-LK'),
  L('kok', 'कोंकणी', 'Konkani', 'kok-IN'),
].map((x) => [x.code, x]));

export const localeOf = (code: string) => LANGS[code]?.locale ?? 'en-IN';
export const nativeName = (code: string) => LANGS[code]?.native ?? code;

export const COUNTRY_LANGS: Record<string, string[]> = {
  Canada: ['fr'], Germany: ['de'], France: ['fr'], Italy: ['it'], Spain: ['es'], Portugal: ['pt'], Netherlands: ['nl'], Belgium: ['nl', 'fr'],
  Switzerland: ['de', 'fr', 'it'], Austria: ['de'], Sweden: ['sv'], Denmark: ['da'], Finland: ['fi'], Poland: ['pl'], Russia: ['ru'], Turkey: ['tr'],
  Israel: ['he'], 'United Arab Emirates': ['ar'], 'Saudi Arabia': ['ar'], Japan: ['ja'], 'South Korea': ['ko'], China: ['zh'], Singapore: ['zh'],
  Malaysia: ['ms'], Thailand: ['th'], Indonesia: ['id'], 'Sri Lanka': ['si'], Nepal: ['ne'], Bangladesh: ['bn'], Brazil: ['pt'], Argentina: ['es'], Mexico: ['es'],
};

export const STATE_LANGS: Record<string, string[]> = {
  Gujarat: ['gu'], Maharashtra: ['mr'], 'West Bengal': ['bn'], 'Tamil Nadu': ['ta'], Telangana: ['te'], 'Andhra Pradesh': ['te'],
  Karnataka: ['kn'], Kerala: ['ml'], Punjab: ['pa'], Odisha: ['or'], Assam: ['as'], 'Jammu & Kashmir': ['ur'], Chandigarh: ['pa'],
  Goa: ['kok'], Sikkim: ['ne'],
};

/** Extra languages offered next to English and Hindi, based on the traveller's country or home state. */
export const regionalLangs = (t: Pick<Traveller, 'type' | 'from'> | null | undefined): string[] =>
  !t ? [] : (t.type === 'foreign' ? COUNTRY_LANGS : STATE_LANGS)[t.from] ?? [];

/** Languages to offer for a traveller type and place: Indians get Hindi + English + their state's language; visitors get English + their country's language. */
export const languageOptions = (type: Traveller['type'], from: string): string[] =>
  [...(type === 'indian' ? ['hi', 'en'] : ['en']), ...regionalLangs({ type, from })].filter((c, i, a) => a.indexOf(c) === i);
