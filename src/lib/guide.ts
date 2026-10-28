import { PARTNERS, Site, Lang } from '../data/sites';
import { bestHour, density, fmtHour } from './crowd';
import { greeting } from './time';
import { fmt, tr } from './i18n';
import { LANGS } from './langs';
import { api } from './api';

/** Offline-first Q&A: retrieval over the on-device heritage pack, optionally escalated to Gemini when online. */
export async function ask(site: Site, q: string, lang: Lang): Promise<{ text: string; source: 'gemini' | 'offline' | 'unconfigured' | 'unavailable' }> {
  const l = /[\u0900-\u097F]/.test(q) ? 'hi' : lang;
  if (navigator.onLine) {
    try {
      const r = await api<{ text?: string }>('/api/ask', {
        q, lang: l, langName: LANGS[l]?.english ?? 'English', site: site.name.en,
        context: `${site.built.en}. ${site.story.en} ${site.legacy.en} ${site.tip.en}`,
      }, 12000);
      if (r.ok && r.data?.text) return { text: r.data.text, source: 'gemini' };
    } catch {}
    const offline = offlineAnswer(site, q, lang);
    return { text: offline, source: 'offline' };
  }
  return { text: offlineAnswer(site, q, lang), source: 'offline' };
}

const has = (q: string, re: RegExp) => re.test(q.toLowerCase());

export function offlineAnswer(site: Site, q: string, lang: Lang): string {
  const L = /[\u0900-\u097F]/.test(q) ? 'hi' : lang;
  const isHi = L === 'hi';
  const name = site.name[L];

  // 1. Greetings & introduction
  if (has(q, /^\s*(hi|hello|hey|namaste|namaskar|good (morning|afternoon|evening))\b|नमस्ते|नमस्कार|हेलो|सुप्रभात/)) {
    return `${greeting(L).text}! ${tr('hello', L)} ${name}. ${site.built[L]}. ${site.tag[L]}.`;
  }

  // 2. Tickets, Entry Fees & Pricing
  if (has(q, /ticket|fee|price|cost|charge|rupee|how much|entry|admission|टिकट|फीस|शुल्क|खर्च|कितना|पैसे|प्रवेश/)) {
    if (site.id === 'city-palace') {
      return isHi
        ? 'सिटी पैलेस संग्रहालय का टिकट वयस्कों के लिए लगभग ₹300 और बच्चों के लिए ₹100 है। कैमरा व गाइड टिकट अलग से मिलते हैं। टिकट काउंटर सुबह 9:30 बजे से शाम 4:30 बजे तक खुले रहते हैं।'
        : 'City Palace Museum entry is approximately ₹300 for adults and ₹100 for children. Camera tickets and audio guides are extra. Ticket counters operate from 9:30 AM to 4:30 PM.';
    }
    if (site.id === 'saheliyon-ki-bari') {
      return isHi
        ? 'सहेलियों की बाड़ी का टिकट भारतीय नागरिकों के लिए लगभग ₹20 और विदेशी पर्यटकों के लिए ₹100 है। फव्वारों और कमल कुंड का आनंद दिनभर लिया जा सकता है।'
        : 'Entry to Saheliyon-ki-Bari is around ₹20 for Indian citizens and ₹100 for foreign visitors. The fountains and marble lotus pool can be enjoyed all day.';
    }
    if (site.id === 'bagore-ki-haveli') {
      return isHi
        ? 'बागोर की हवेली संग्रहालय का दिन का टिकट लगभग ₹60 है। शाम के प्रसिद्ध धरोहर लोकनृत्य कार्यक्रम का टिकट अलग से ₹100 से ₹150 में शाम 5:30 बजे से मिलता है।'
        : 'Bagore Ki Haveli museum entry is around ₹60 by day. The famous Dharohar evening folk dance show requires a separate ticket (₹100–₹150), sold from 5:30 PM.';
    }
    if (site.id === 'sajjangarh') {
      return isHi
        ? 'सज्जनगढ़ मानसून पैलेस में प्रवेश शुल्क लगभग ₹60 (भारतीय) और ₹300 (विदेशी) है। अभयारण्य से ऊपर गाड़ी ले जाने का अलग टोल लगता है।'
        : 'Monsoon Palace entry is around ₹60 for Indians and ₹300 for foreigners, plus the wildlife sanctuary vehicle entry toll.';
    }
    if (site.kind === 'temple' || site.id === 'ahar-cenotaphs') {
      return isHi
        ? `${name} में प्रवेश पूरी तरह निःशुल्क है। जूते बाहर उतारकर प्रवेश करें; स्वेच्छा से दान दिया जा सकता है।`
        : `Entry to ${name} is completely free. Shoes must be removed at the entrance, and voluntary offerings are accepted.`;
    }
    return isHi
      ? `${name} का प्रवेश सामान्यतः निःशुल्क या नाममात्र शुल्क का है। विस्तृत जानकारी के लिए मुख्य प्रवेश द्वार पर टिकट काउंटर देखें।`
      : `Entry to ${name} is generally free or has a nominal ticket at the gate. Check with the site counter upon arrival.`;
  }

  // 3. Boating, Lakes & Water
  if (has(q, /boat|boating|ferry|ride|lake|pichola|fateh sagar|water|नाव|बोट|सवारी|झील|पिछोला|फ़तेह सागर|पानी/)) {
    if (site.id === 'lake-palace' || site.id === 'city-palace' || site.kind === 'island') {
      return isHi
        ? 'पिछोला झील में बोटिंग सिटी पैलेस के रामेश्वर घाट और दूध तलाई से उपलब्ध है। सामान्य बोट राइड ₹400–₹500 और जगमंदिर रुकने वाली सनसेट क्रूज़ ₹800–₹1000 में होती है।'
        : 'Boat rides on Lake Pichola depart from the City Palace Rameshwar Ghat and Dudh Talai. Regular rides cost ₹400–₹500, while the sunset cruise stopping at Jagmandir island is ₹800–₹1,000.';
    }
    return isHi
      ? 'उदयपुर में पिछोला झील और फ़तेह सागर दोनों पर बोटिंग उपलब्ध है। सूर्यास्त के समय बोटिंग का अनुभव सबसे मनमोहक रहता है।'
      : 'Boating is available on both Lake Pichola and Fateh Sagar in Udaipur. A sunset boat ride offers the most magical view of the palaces.';
  }

  // 4. Timings, Hours, Shows & Best time
  if (has(q, /timing|time|hour|open|close|when|light show|sound show|show|समय|कब खुलता|कब बंद|घंटे|शो|लाइट शो/)) {
    if (site.id === 'city-palace') {
      return isHi
        ? 'सिटी पैलेस रोज़ाना सुबह 9:30 बजे से शाम 5:30 बजे तक खुला रहता है। शाम को मानक चौक में मेवाड़ लाइट एंड साउंड शो होता है (अंग्रेज़ी 7:00 बजे, हिंदी 8:00 बजे)।'
        : 'City Palace is open daily from 9:30 AM to 5:30 PM. The Mewar Light & Sound show takes place at Manek Chowk every evening (English at 7:00 PM, Hindi at 8:00 PM).';
    }
    if (site.id === 'bagore-ki-haveli') {
      return isHi
        ? 'हवेली संग्रहालय सुबह 9:30 से शाम 5:30 तक खुला रहता है। शाम 7:00 से 8:00 बजे तक गणगौर घाट पर लाइव धरोहर लोकनृत्य प्रस्तुति होती है।'
        : 'The haveli museum is open 9:30 AM to 5:30 PM. The live Dharohar folk dance performance takes place right on the lakefront from 7:00 PM to 8:00 PM.';
    }
    if (site.id === 'sajjangarh') {
      return isHi
        ? 'मानसून पैलेस सुबह 9:00 से शाम 6:00 बजे तक खुला रहता है। शाम 4:30 से 5:30 बजे के बीच पहुँचना सूर्यास्त के लिए सबसे उत्तम है।'
        : 'Monsoon Palace is open 9:00 AM to 6:00 PM. Arriving between 4:30 PM and 5:30 PM gives you the ultimate sunset panorama.';
    }
    const d = density(site);
    const bh = fmtHour(bestHour(site), L);
    return isHi
      ? `${name} के लिए सबसे शांत समय लगभग ${bh} है। ${site.tip[L]}`
      : `The quietest time to visit ${name} today is around ${bh}. ${site.tip[L]}`;
  }

  // 5. Maharana Pratap, History, Battles & Founders
  if (has(q, /who|pratap|udai singh|founder|built|build|history|battle|haldighati|chetak|king|maharana|इतिहास|किसने|बनाया|प्रताप|उदय सिंह|हल्दीघाटी|चेतक|राजा|महाराणा/)) {
    if (has(q, /pratap|हल्दीघाटी|चेतक|प्रताप/)) {
      return isHi
        ? 'महाराणा प्रताप मेवाड़ के अदम्य शूरवीर थे जिन्होंने 1576 के हल्दीघाटी युद्ध में मुग़ल सेना का बहादुरी से सामना किया। उनका स्वामिभक्त अश्व चेतक आज भी शौर्य और वफ़ादारी का प्रतीक है।'
        : 'Maharana Pratap was the legendary warrior king of Mewar who fiercely defended independence against Mughal forces at Haldighati in 1576, alongside his faithful horse Chetak.';
    }
    return `${site.built[L]}. ${site.story[L]}`;
  }

  // 6. Photography, Views & Sunset
  if (has(q, /photo|photography|camera|picture|sunset|view|drone|तस्वीर|फोटो|कैमरा|सूर्यास्त|दृश्य|व्यू/)) {
    if (site.id === 'sajjangarh') {
      return isHi
        ? 'सज्जनगढ़ की छत से पूरी झीलों की नगरी और अरावली पर्वतमाला का 360-डिग्री विहंगम सूर्यास्त दृश्य दिखता है। सुनहरी रोशनी में तस्वीरें अद्भुत आती हैं।'
        : 'Sajjangarh terrace offers a 360-degree panorama of Udaipur lakes and the Aravalli hills. Golden hour light creates unforgettable photos.';
    }
    return isHi
      ? `${name} पर तस्वीरें खींचने के लिए सुनहरी धूप और सुबह का समय सबसे बढ़िया है। ${site.legacy[L]}`
      : `Golden hour in the morning and late afternoon offers the finest light at ${name}. ${site.legacy[L]}`;
  }

  // 7. Architecture, Mirrors, Courtyards & Art
  if (has(q, /architecture|mirror|glass|peacock|carving|marble|stone|art|डिजाइन|नक्काशी|शीशा|मोर|संगमरमर|कला/)) {
    return `${site.legacy[L]} ${site.story[L].split(/(?<=[.।])\s/)[0]}`;
  }

  // 8. Food, Restaurants, Dining & Specialties
  if (has(q, /food|eat|restaurant|cafe|dinner|lunch|thali|dal baati|sweet|खाना|भोजन|रेस्टोरेंट|कैफे|दाल बाटी|कचोरी|मिठाई/)) {
    return isHi
      ? 'उदयपुर के प्रामाणिक स्वाद में दाल बाटी चूरमा, गट्टे की सब्ज़ी और जगदीश चौक की गर्म प्याज़ कचौरी प्रसिद्ध हैं। गणगौर घाट और चाँदपोल के पास झील किनारे रूफ़टॉप रेस्तराँ शाम के भोजन के लिए बेहतरीन हैं।'
      : 'Classic Mewari food includes Dal Baati Churma, Gatte ki Sabzi, and hot Pyaaz Kachoris near Jagdish Chowk. Rooftop lakeside cafes around Gangaur Ghat and Chandpole offer memorable dinner views.';
  }

  // 9. Shopping, Handicrafts & Artisans
  if (has(q, /artisan|craft|shop|buy|shopping|market|souvenir|pichwai|painting|leather|कारीगर|शिल्प|खरीद|दुकान|बाज़ार|पिछवाई|चित्र/)) {
    const p = PARTNERS.find((x) => x.nearSite === site.id && x.kind === 'artisan');
    if (p) return fmt(tr('ansCraft', L), { p: p.name, c: p.craft![L] });
    return isHi
      ? 'उदयपुर में हाथी पोल बाज़ार पिछवाई और लघु चित्रकारी के लिए, बड़ा बाज़ार बंधेज साड़ियों के लिए, और घंटाघर चांदी के आभूषणों के लिए मशहूर है। सीधे स्थानीय कारीगरों से खरीदें।'
      : 'Hathi Pol market is famous for Pichwai and miniature paintings, Bada Bazaar for bandhani textiles, and Clock Tower for silverwork. Buying directly supports local artisans.';
  }

  // 10. Rules, Dress code, Footwear
  if (has(q, /dress|wear|shoe|shoes|rule|etiquette|safety|नियम|कपड़े|जूते|सुरक्षा/)) {
    return isHi
      ? 'मंदिरों और धार्मिक स्थलों में शालीन कपड़े पहनें, जूते बाहर उतारें और स्थानीय मान्यताओं का सम्मान करें। सादे पानी की बोतल साथ रखें।'
      : 'At temples and sacred sites, dress modestly, remove footwear, and be mindful of local customs. Carry water and avoid flash photography inside inner sanctums.';
  }

  // 11. General legacy & highlights
  if (has(q, /famous|special|legacy|known|why|खास|विरासत|मशहूर|प्रसिद्ध|क्यों/)) {
    return site.legacy[L];
  }

  // 12. Contextual default answer
  return `${site.story[L]} ${site.legacy[L]} ${site.tip[L]}`;
}
