export type Lang = string; // 'en' and 'hi' are built in; other codes come from translated packs
export type L = Record<string, string>;
export type Kind = 'palace' | 'temple' | 'island' | 'garden' | 'haveli' | 'hill' | 'cenotaph' | 'statue' | 'fort' | 'tower' | 'lake';
export type Area = 'udaipur' | 'nathdwara' | 'kumbhalgarh' | 'chittorgarh';
export type Theme = 'history' | 'spiritual' | 'art' | 'nature' | 'photo';

export interface Site {
  id: string;
  name: L;
  tag: L;
  kind: Kind;
  area: Area; // day-trip cluster used by the planner
  img?: string; // bundled photo in public/img (optional; a drawn cover is used if missing)
  gallery?: string[];
  themes: Theme[];
  mapQ?: string; // search text for directions when coordinates are only approximate
  lat: number; // approximate
  lng: number;
  hotspot: boolean; // one of the over-visited landmarks SMARAK balances
  hue: [string, string]; // cover gradient
  built: L;
  story: L;
  legacy: L;
  tip: L;
  profile: number[]; // typical crowd 0..1 for each hour of the day
}

/** Builds a 24h crowd curve from gaussian peaks: [centreHour, width, amplitude]. */
const curve = (...peaks: [number, number, number][]): number[] =>
  Array.from({ length: 24 }, (_, h) => {
    const open = h >= 6 && h <= 21 ? 1 : 0.08;
    const v = peaks.reduce((s, [c, w, a]) => s + a * Math.exp(-((h - c) ** 2) / (2 * w * w)), 0.06);
    return Math.min(1, v * open);
  });

export const SITES: Site[] = [
  {
    id: 'city-palace',
    area: 'udaipur',
    img: '/img/city-palace.jpg',
    themes: ['history','art','photo'],
    name: { en: 'City Palace', hi: 'सिटी पैलेस' },
    tag: { en: 'Palace & Museum', hi: 'महल और संग्रहालय' },
    kind: 'palace', lat: 24.5764, lng: 73.6835, hotspot: true, hue: ['#ee5a30', '#f4b08c'],
    built: { en: '1559 onward · Maharana Udai Singh II', hi: '1559 से · महाराणा उदय सिंह द्वितीय' },
    story: {
      en: 'In 1559 Maharana Udai Singh II, seeking a safer capital for Mewar than Chittorgarh, founded Udaipur and began the City Palace on a ridge above Lake Pichola. Successive rulers kept adding to it for nearly four centuries. Its courtyards, balconies and mirror work blend Rajasthani and Mughal styles into one vast complex.',
      hi: '1559 में महाराणा उदय सिंह द्वितीय ने मेवाड़ के लिए चित्तौड़गढ़ से अधिक सुरक्षित राजधानी की तलाश में उदयपुर बसाया और पिछोला झील के ऊपर पहाड़ी पर सिटी पैलेस बनवाना शुरू किया। लगभग चार सदियों तक शासक इसमें जोड़ते रहे। इसके आँगन, झरोखे और शीशे का काम राजस्थानी और मुग़ल शैली का अनोखा संगम है।',
    },
    legacy: {
      en: 'It is among the largest palace complexes in Rajasthan, and part of it still serves as a museum and royal residence. Look for the peacock glass mosaics of Mor Chowk and the mirror work of Manak Mahal.',
      hi: 'यह राजस्थान के सबसे बड़े महल परिसरों में से एक है और इसका एक हिस्सा आज भी संग्रहालय व शाही निवास है। मोर चौक की मोर आकृतियाँ और माणक महल का शीशे का काम ज़रूर देखें।',
    },
    tip: {
      en: 'Arrive at opening time or after 4 PM to miss the tour-bus peaks. The boat jetty is steps away.',
      hi: 'टूर-बसों की भीड़ से बचने के लिए खुलते ही या शाम 4 बजे के बाद जाएँ। नाव घाट पास ही है।',
    },
    profile: curve([11, 1.8, 0.85], [16, 1.6, 0.7]),
  },
  {
    id: 'jagdish-temple',
    area: 'udaipur',
    img: '/img/jagdish-temple.jpg',
    themes: ['spiritual','history','art'],
    name: { en: 'Jagdish Temple', hi: 'जगदीश मंदिर' },
    tag: { en: 'Temple', hi: 'मंदिर' },
    kind: 'temple', lat: 24.5788, lng: 73.6837, hotspot: true, hue: ['#c7442b', '#e9a07c'],
    built: { en: '1651 · Maharana Jagat Singh I', hi: '1651 · महाराणा जगत सिंह प्रथम' },
    story: {
      en: 'Maharana Jagat Singh I built this Indo-Aryan temple in 1651. It stands on a high platform reached by 32 steps guarded by stone elephants. The sanctum holds a black stone image of Vishnu as Jagannath, and a Garuda shrine faces it.',
      hi: 'महाराणा जगत सिंह प्रथम ने 1651 में यह इंडो-आर्य शैली का मंदिर बनवाया। ऊँचे चबूतरे तक 32 सीढ़ियाँ जाती हैं, जिनके पास पत्थर के हाथी खड़े हैं। गर्भगृह में भगवान विष्णु की जगन्नाथ रूप में काले पत्थर की मूर्ति है और सामने गरुड़ मंदिर है।',
    },
    legacy: {
      en: 'The tower is carved with dancers, musicians and elephants. Daily aarti and bhajans keep it a living place of worship, not just a monument.',
      hi: 'मंदिर का शिखर नर्तकियों, वादकों और हाथियों की नक्काशी से सजा है। रोज़ की आरती और भजन इसे केवल स्मारक नहीं, जीवित उपासना स्थल बनाए रखते हैं।',
    },
    tip: {
      en: 'Dress modestly and remove your shoes. Early-morning aarti is the calmest time.',
      hi: 'शालीन कपड़े पहनें और जूते बाहर उतारें। सुबह की आरती का समय सबसे शांत रहता है।',
    },
    profile: curve([8, 1.4, 0.7], [18, 1.8, 0.85]),
  },
  {
    id: 'lake-palace',
    area: 'udaipur',
    img: '/img/lake-palace.jpg',
    themes: ['history','photo'],
    name: { en: 'Lake Palace (Jag Niwas)', hi: 'लेक पैलेस (जग निवास)' },
    tag: { en: 'Lake Heritage', hi: 'झील विरासत' },
    kind: 'island', lat: 24.5753, lng: 73.6803, hotspot: true, hue: ['#7d8fb8', '#f0b59a'],
    built: { en: '1743–1746 · Maharana Jagat Singh II', hi: '1743–1746 · महाराणा जगत सिंह द्वितीय' },
    story: {
      en: 'Maharana Jagat Singh II built Jag Niwas between 1743 and 1746 on an island in Lake Pichola as a summer retreat. Its white marble courtyards and pavilions seem to float on the water.',
      hi: 'महाराणा जगत सिंह द्वितीय ने 1743 से 1746 के बीच पिछोला झील के द्वीप पर ग्रीष्मकालीन विश्राम स्थल के रूप में जग निवास बनवाया। इसके सफ़ेद संगमरमर के आँगन और मंडप पानी पर तैरते-से लगते हैं।',
    },
    legacy: {
      en: 'Today it is a luxury hotel, and it appeared in the 1983 Bond film Octopussy. Entry is for guests and diners, so the best view is from the ghats or a sunset boat ride.',
      hi: 'आज यह एक लग्ज़री होटल है और 1983 की बॉन्ड फ़िल्म ऑक्टोपसी में भी दिखा था। भीतर प्रवेश केवल मेहमानों और भोजन करने वालों के लिए है, इसलिए घाटों या शाम की नाव-सवारी से इसे देखना सबसे अच्छा है।',
    },
    tip: {
      en: 'View it from the lake at sunset. Book a table well ahead if you want to go inside.',
      hi: 'सूर्यास्त के समय झील से इसे देखें। भीतर जाना हो तो पहले से टेबल बुक करें।',
    },
    profile: curve([17.5, 1.8, 0.9], [10.5, 1.5, 0.35]),
  },
  {
    id: 'saheliyon-ki-bari',
    area: 'udaipur',
    img: '/img/saheliyon-ki-bari.jpg',
    themes: ['nature','history'],
    name: { en: 'Saheliyon-ki-Bari', hi: 'सहेलियों की बाड़ी' },
    tag: { en: 'Garden', hi: 'उद्यान' },
    kind: 'garden', lat: 24.6012, lng: 73.6855, hotspot: false, hue: ['#4f9a6a', '#d6e3b3'],
    built: { en: 'Early 18th century · Maharana Sangram Singh II', hi: '18वीं सदी का आरंभ · महाराणा संग्राम सिंह द्वितीय' },
    story: {
      en: 'The Garden of the Maidens was laid out in the early 18th century for the women of the royal household and their companions. Its fountains are gravity-fed and run without electric pumps.',
      hi: 'सहेलियों की बाड़ी 18वीं सदी के आरंभ में राजपरिवार की महिलाओं और उनकी सहेलियों के लिए बनी थी। इसके फव्वारे गुरुत्वाकर्षण से चलते हैं और इनमें बिजली के पंप नहीं लगते।',
    },
    legacy: {
      en: 'Marble elephants, a lotus pool and shaded kiosks make it one of the calmest corners of the city, and an equally rich alternative to the crowded ghats.',
      hi: 'संगमरमर के हाथी, कमल का कुंड और छायादार छतरियाँ इसे शहर के सबसे शांत कोनों में से एक बनाते हैं। भीड़ भरे घाटों का उतना ही समृद्ध विकल्प।',
    },
    tip: {
      en: 'Mornings are quietest. Pair it with Fateh Sagar lake for a calm half-day.',
      hi: 'सुबह सबसे शांत समय है। फ़तेह सागर झील के साथ इसे जोड़कर आधा दिन आराम से बिताएँ।',
    },
    profile: curve([11, 2, 0.4], [16, 1.8, 0.3]),
  },
  {
    id: 'bagore-ki-haveli',
    area: 'udaipur',
    img: '/img/bagore-ki-haveli.jpg',
    themes: ['history','art'],
    name: { en: 'Bagore Ki Haveli', hi: 'बागोर की हवेली' },
    tag: { en: 'Haveli Museum', hi: 'हवेली संग्रहालय' },
    kind: 'haveli', lat: 24.5798, lng: 73.6805, hotspot: false, hue: ['#b9532f', '#f0c08a'],
    built: { en: '18th century · Amir Chand Badwa', hi: '18वीं सदी · अमरचंद बड़वा' },
    story: {
      en: 'Amir Chand Badwa, chief minister of Mewar, built this haveli in the 18th century on Gangaur Ghat. It has well over a hundred rooms, courtyards and balconies facing Lake Pichola.',
      hi: 'मेवाड़ के प्रधानमंत्री अमरचंद बड़वा ने 18वीं सदी में गणगौर घाट पर यह हवेली बनवाई। इसमें सौ से अधिक कमरे, आँगन और पिछोला झील की ओर खुलते झरोखे हैं।',
    },
    legacy: {
      en: 'Restored as a museum, it shows royal costumes, antique instruments and mirror-work rooms. An evening folk dance show keeps living traditions on stage.',
      hi: 'संग्रहालय के रूप में संरक्षित इस हवेली में शाही पोशाकें, पुराने वाद्य और शीशे के काम वाले कक्ष हैं। शाम को लोकनृत्य प्रस्तुति जीवित परंपराओं को मंच देती है।',
    },
    tip: {
      en: 'Visit in the late morning, then stay for the evening dance show.',
      hi: 'देर सुबह जाएँ और शाम के लोकनृत्य कार्यक्रम के लिए रुकें।',
    },
    profile: curve([12, 2, 0.4], [19, 1.2, 0.55]),
  },
  {
    id: 'sajjangarh',
    area: 'udaipur',
    img: '/img/sajjangarh.jpg',
    themes: ['nature','photo'],
    name: { en: 'Sajjangarh Monsoon Palace', hi: 'सज्जनगढ़ मानसून पैलेस' },
    tag: { en: 'Hill Palace', hi: 'पहाड़ी महल' },
    kind: 'hill', lat: 24.5936, lng: 73.6467, hotspot: false, hue: ['#6d5c8f', '#f2a98a'],
    built: { en: '1880s · Maharana Sajjan Singh', hi: '1880 के दशक · महाराणा सज्जन सिंह' },
    story: {
      en: 'Maharana Sajjan Singh built this palace in the 1880s on a hilltop west of the city, as a retreat to watch the monsoon clouds gather. The hill now lies within a wildlife sanctuary.',
      hi: 'महाराणा सज्जन सिंह ने 1880 के दशक में शहर के पश्चिम की पहाड़ी पर मानसूनी बादलों को निहारने के लिए यह महल बनवाया। यह पहाड़ी आज वन्यजीव अभयारण्य के भीतर है।',
    },
    legacy: {
      en: 'Its terraces give a sweeping view over Udaipur and its lakes, and the sunsets here are famous. It is far less crowded than the lakeside landmarks.',
      hi: 'इसकी छतों से उदयपुर और उसकी झीलों का विहंगम दृश्य दिखता है और यहाँ के सूर्यास्त प्रसिद्ध हैं। झील किनारे के स्मारकों की तुलना में यहाँ भीड़ बहुत कम रहती है।',
    },
    tip: {
      en: 'Go about an hour before sunset by taxi. Carry water; the climb up is open and sunny.',
      hi: 'सूर्यास्त से लगभग एक घंटा पहले टैक्सी से जाएँ। पानी साथ रखें, ऊपर का रास्ता खुला और धूप वाला है।',
    },
    profile: curve([17.3, 1.4, 0.45], [10, 1.5, 0.2]),
  },
  {
    id: 'ahar-cenotaphs',
    area: 'udaipur',
    img: '/img/ahar-cenotaphs.jpg',
    themes: ['history','photo'],
    name: { en: 'Ahar Cenotaphs', hi: 'आहड़ की छतरियाँ' },
    tag: { en: 'Royal Cenotaphs', hi: 'राजसी छतरियाँ' },
    kind: 'cenotaph', lat: 24.587, lng: 73.722, hotspot: false, hue: ['#8a6f5a', '#e8c9a6'],
    built: { en: 'From the early 1600s · Mewar Maharanas', hi: '1600 के दशक से · मेवाड़ के महाराणा' },
    story: {
      en: 'Ahar is the royal cremation ground of Mewar. Its marble cenotaphs, or chhatris, mark the Maharanas who ruled here, beginning with Maharana Amar Singh I in the early 1600s.',
      hi: 'आहड़ मेवाड़ का शाही श्मशान स्थल है। यहाँ की संगमरमर की छतरियाँ उन महाराणाओं की स्मृति में बनी हैं जिन्होंने शासन किया, जिनमें सबसे पहली महाराणा अमर सिंह प्रथम की है।',
    },
    legacy: {
      en: 'Nearby, the Ahar museum shows finds from a settlement more than 3,000 years old. Few visitors come here, so you can see the carving in peace.',
      hi: 'पास का आहड़ संग्रहालय 3,000 वर्ष से अधिक पुरानी बस्ती की खुदाई से मिली वस्तुएँ दिखाता है। यहाँ बहुत कम पर्यटक आते हैं, इसलिए नक्काशी शांति से देख सकते हैं।',
    },
    tip: {
      en: 'Golden hour is best for photos, and you will likely have it almost to yourself.',
      hi: 'तस्वीरों के लिए सुनहरी रोशनी का समय सबसे अच्छा है, और संभवतः आप लगभग अकेले होंगे।',
    },
    profile: curve([9.5, 1.8, 0.2], [16.5, 1.6, 0.22]),
  },
  {
    id: 'shrinathji',
    area: 'nathdwara',
    img: '/img/shrinathji.jpg',
    themes: ['spiritual', 'art', 'history'],
    mapQ: 'Shrinathji Temple Nathdwara',
    name: { en: 'Shrinathji Temple, Nathdwara', hi: 'श्रीनाथजी मंदिर, नाथद्वारा' },
    tag: { en: 'Pilgrimage', hi: 'तीर्थ' },
    kind: 'temple', lat: 24.938, lng: 73.823, hotspot: true, hue: ['#d98a2b', '#f6d28a'],
    built: { en: '1672 · Maharana Raj Singh I gave it a home', hi: '1672 · महाराणा राज सिंह प्रथम ने स्थान दिया' },
    story: {
      en: 'Shrinathji is Krishna as a child lifting Mount Govardhan, worshipped in the Pushtimarg tradition of Vallabhacharya. In 1672, to keep the image safe during Aurangzeb\'s reign, it was carried from Govardhan towards Mewar. Tradition says the chariot wheel sank into the ground at Sinhad, and Maharana Raj Singh I gave the deity a home there. The place became Nathdwara, the Gateway of the Lord.',
      hi: 'श्रीनाथजी बालरूप श्रीकृष्ण हैं, जो गोवर्धन पर्वत उठाए हुए हैं, और इनकी पूजा वल्लभाचार्य की पुष्टिमार्ग परंपरा में होती है। 1672 में औरंगज़ेब के शासनकाल में मूर्ति को सुरक्षित रखने के लिए उसे गोवर्धन से मेवाड़ की ओर ले जाया गया। मान्यता है कि सिंहाड़ गाँव में रथ का पहिया धँस गया और महाराणा राज सिंह प्रथम ने वहीं देवता को स्थान दिया। वही स्थान नाथद्वारा, यानी प्रभु का द्वार, कहलाया।',
    },
    legacy: {
      en: 'The temple is run in the haveli tradition, with eight darshans through the day. Nathdwara is also the home of Pichwai painting, the large devotional cloth art made behind the deity. Annakut and Janmashtami draw very large crowds.',
      hi: 'मंदिर हवेली परंपरा में चलता है, जहाँ दिन में आठ दर्शन होते हैं। नाथद्वारा पिछवाई चित्रकला का भी घर है, जो देवता के पीछे लगने वाली बड़ी भक्ति-चित्रकारी है। अन्नकूट और जन्माष्टमी पर यहाँ बहुत भीड़ होती है।',
    },
    tip: {
      en: 'Darshan timings change with season and festivals, so check the notice at the gate. Phones and cameras are usually not allowed inside, so leave them behind. Mornings and festival days are busiest; the Statue of Belief nearby is a calmer pairing.',
      hi: 'दर्शन का समय मौसम और त्योहारों के अनुसार बदलता है, इसलिए गेट पर लगी सूचना देखें। भीतर आमतौर पर फ़ोन और कैमरे की अनुमति नहीं होती, इन्हें बाहर रखें। सुबह और त्योहार के दिन सबसे ज़्यादा भीड़ होती है; पास की स्टैच्यू ऑफ़ बिलीफ़ एक शांत विकल्प है।',
    },
    profile: curve([7, 1.2, 0.6], [11, 1.4, 0.8], [16.5, 1.4, 0.9]),
  },
  {
    id: 'statue-of-belief',
    area: 'nathdwara',
    img: '/img/statue-of-belief.jpg',
    themes: ['spiritual', 'photo', 'nature'],
    mapQ: 'Statue of Belief Vishwas Swaroopam Nathdwara',
    name: { en: 'Statue of Belief (Vishwas Swaroopam)', hi: 'स्टैच्यू ऑफ़ बिलीफ़ (विश्वास स्वरूपम्)' },
    tag: { en: 'Monument', hi: 'स्मारक' },
    kind: 'statue', lat: 24.9377, lng: 73.7942, hotspot: false, hue: ['#c2561f', '#f0a259'],
    built: { en: 'Opened 2022 · about 369 ft (112 m)', hi: '2022 में खुली · लगभग 369 फ़ीट (112 मीटर)' },
    story: {
      en: 'Vishwas Swaroopam, the Statue of Belief, is a seated Shiva statue about 369 feet tall on Ganesh Tekri hill near Nathdwara. It opened in October 2022 after years of construction and is counted among the tallest Shiva statues in the world. It rises above the Aravalli countryside and can be seen from far away.',
      hi: 'विश्वास स्वरूपम्, यानी स्टैच्यू ऑफ़ बिलीफ़, नाथद्वारा के पास गणेश टेकरी पहाड़ी पर बनी लगभग 369 फ़ीट ऊँची बैठी हुई शिव प्रतिमा है। वर्षों के निर्माण के बाद यह अक्टूबर 2022 में खुली और दुनिया की सबसे ऊँची शिव प्रतिमाओं में गिनी जाती है। अरावली के मैदानों के ऊपर यह दूर से ही दिखाई देती है।',
    },
    legacy: {
      en: 'The complex has landscaped gardens and viewing galleries, and the statue is lit up in the evening. It pairs naturally with a Shrinathji darshan, with far smaller queues.',
      hi: 'परिसर में सजे हुए बगीचे और दर्शक दीर्घाएँ हैं, और शाम को प्रतिमा रोशनी से जगमगाती है। श्रीनाथजी के दर्शन के साथ यह स्वाभाविक जोड़ी है, और यहाँ कतारें कहीं छोटी होती हैं।',
    },
    tip: {
      en: 'Go in the late afternoon for golden light and stay for the evening glow. Carry water, because the walk up is open and sunny.',
      hi: 'सुनहरी रोशनी के लिए देर दोपहर में जाएँ और शाम की जगमगाहट देखने के लिए रुकें। पानी साथ रखें, क्योंकि ऊपर का रास्ता खुला और धूप वाला है।',
    },
    profile: curve([17, 2, 0.5], [10, 2, 0.22]),
  },
  {
    id: 'eklingji',
    area: 'nathdwara',
    img: '/img/eklingji.png',
    themes: ['spiritual','history','art'],
    mapQ: 'Eklingji Temple Kailashpuri',
    name: { en: 'Eklingji Temple (Kailashpuri)', hi: 'एकलिंगजी मंदिर (कैलाशपुरी)' },
    tag: { en: 'Temple', hi: 'मंदिर' },
    kind: 'temple', lat: 24.6812, lng: 73.7134, hotspot: false, hue: ['#9a7b4f', '#f1d9a6'],
    built: { en: 'Traditionally 734 CE · Bappa Rawal', hi: 'परंपरा के अनुसार 734 ई. · बप्पा रावल' },
    story: {
      en: 'Eklingji is Shiva as the ruling deity of Mewar. Tradition says Bappa Rawal founded the shrine in 734 CE at Kailashpuri, about 22 km north of Udaipur, and the Maharanas ruled as the deity\'s regents. The temple was rebuilt over the centuries, notably in the 15th century. Its sanctum holds a four-faced black marble Shiva.',
      hi: 'एकलिंगजी मेवाड़ के राजा माने जाने वाले शिव हैं। परंपरा के अनुसार बप्पा रावल ने 734 ई. में उदयपुर से लगभग 22 किमी उत्तर में कैलाशपुरी में यह मंदिर स्थापित किया, और महाराणा स्वयं को देवता का दीवान मानकर शासन करते थे। मंदिर का सदियों में पुनर्निर्माण हुआ, विशेषकर 15वीं सदी में। गर्भगृह में काले संगमरमर की चतुर्मुखी शिव प्रतिमा है।',
    },
    legacy: {
      en: 'A walled complex of marble and sandstone with about 108 temples surrounds the main shrine. Mondays and festivals such as Mahashivratri are the busiest days.',
      hi: 'मुख्य मंदिर के चारों ओर संगमरमर और बलुआ पत्थर के लगभग 108 मंदिरों वाला परकोटा परिसर है। सोमवार और महाशिवरात्रि जैसे त्योहारों पर सबसे ज़्यादा भीड़ होती है।',
    },
    tip: {
      en: 'Go early on a weekday for a calm darshan. Phones and cameras are usually not allowed inside, so leave them behind.',
      hi: 'शांत दर्शन के लिए किसी कार्यदिवस पर सुबह जल्दी जाएँ। भीतर आमतौर पर फ़ोन और कैमरे की अनुमति नहीं होती, इन्हें बाहर रखें।',
    },
    profile: curve([7, 1.5, 0.55], [17, 1.5, 0.5]),
  },
  {
    id: 'nagda-sas-bahu',
    area: 'nathdwara',
    img: '/img/nagda-sas-bahu.png',
    themes: ['history','art','spiritual'],
    mapQ: 'Sas Bahu Temples Nagda',
    name: { en: 'Sas-Bahu Temples, Nagda', hi: 'सास-बहू मंदिर, नागदा' },
    tag: { en: 'Ancient Temples', hi: 'प्राचीन मंदिर' },
    kind: 'temple', lat: 24.6706, lng: 73.7283, hotspot: false, hue: ['#a77a4a', '#e9cf9b'],
    built: { en: '10th century · early Mewar capital', hi: '10वीं सदी · मेवाड़ की आरंभिक राजधानी' },
    story: {
      en: 'Nagda was an early capital of Mewar, long before Chittorgarh. Its Sas-Bahu temples, from the 10th century, are two neighbouring Vishnu temples. The name is a local form of Sahastra Bahu, the thousand-armed Vishnu. They stand beside a lake in carved stone.',
      hi: 'नागदा चित्तौड़गढ़ से बहुत पहले मेवाड़ की आरंभिक राजधानी थी। 10वीं सदी के इसके सास-बहू मंदिर पास-पास बने दो विष्णु मंदिर हैं। यह नाम सहस्रबाहु, यानी हज़ार भुजाओं वाले विष्णु, का स्थानीय रूप है। ये एक झील के किनारे तराशे हुए पत्थर से बने हैं।',
    },
    legacy: {
      en: 'Intricate carvings of gods, dancers and scenes from the epics cover the pillars and ceilings. The site is far quieter than Eklingji next door.',
      hi: 'खंभों और छतों पर देवताओं, नर्तकियों और महाकाव्यों के दृश्यों की बारीक नक्काशी है। पास के एकलिंगजी की तुलना में यहाँ बहुत शांति रहती है।',
    },
    tip: {
      en: 'Stop here on the way to or from Eklingji. Late afternoon light is lovely on the carving.',
      hi: 'एकलिंगजी आते-जाते यहाँ रुकें। देर दोपहर की रोशनी में नक्काशी बहुत सुंदर दिखती है।',
    },
    profile: curve([10, 2, 0.12], [16, 2, 0.12]),
  },
  {
    id: 'chittorgarh-fort',
    area: 'chittorgarh',
    img: '/img/chittorgarh-fort.png',
    themes: ['history','photo','nature'],
    mapQ: 'Chittorgarh Fort',
    name: { en: 'Chittorgarh Fort', hi: 'चित्तौड़गढ़ किला' },
    tag: { en: 'UNESCO Hill Fort', hi: 'यूनेस्को पहाड़ी किला' },
    kind: 'fort', lat: 24.8887, lng: 74.6469, hotspot: true, hue: ['#b5563b', '#f0c18a'],
    built: { en: 'Mewar\'s capital until 1568 · UNESCO site (2013)', hi: '1568 तक मेवाड़ की राजधानी · यूनेस्को स्थल (2013)' },
    story: {
      en: 'Chittorgarh was the capital of Mewar for centuries and is one of India\'s largest forts, spread over a hill about 180 metres high. It was besieged three times: by Alauddin Khalji in 1303, by Bahadur Shah of Gujarat in 1535 and by Akbar in 1567–68. Tradition says that each time the women performed jauhar and the men rode out to fight. After the last siege Udai Singh II made Udaipur his capital.',
      hi: 'चित्तौड़गढ़ सदियों तक मेवाड़ की राजधानी रहा और लगभग 180 मीटर ऊँची पहाड़ी पर फैला भारत के सबसे बड़े किलों में से एक है। इस पर तीन बार घेरा पड़ा: 1303 में अलाउद्दीन खिलजी, 1535 में गुजरात के बहादुर शाह और 1567–68 में अकबर का। परंपरा है कि हर बार महिलाओं ने जौहर किया और पुरुष युद्ध के लिए निकले। आख़िरी घेरे के बाद उदय सिंह द्वितीय ने उदयपुर को राजधानी बनाया।',
    },
    legacy: {
      en: 'The fort is part of the UNESCO World Heritage listing Hill Forts of Rajasthan (2013). Inside are towers, palaces, temples and water tanks, and the legends of Rani Padmini, Meera Bai and Maharana Kumbha.',
      hi: 'यह किला यूनेस्को विश्व धरोहर सूची "राजस्थान के पहाड़ी किले" (2013) का हिस्सा है। भीतर मीनारें, महल, मंदिर और जलाशय हैं, और रानी पद्मिनी, मीराबाई तथा महाराणा कुम्भा की कथाएँ जुड़ी हैं।',
    },
    tip: {
      en: 'Allow at least half a day and wear comfortable shoes. Early morning is cooler and quieter. It is roughly 2.5 hours by road from Udaipur.',
      hi: 'कम से कम आधा दिन रखें और आरामदायक जूते पहनें। सुबह का समय ठंडा और शांत रहता है। उदयपुर से सड़क मार्ग से यह लगभग 2.5 घंटे दूर है।',
    },
    profile: curve([11, 2.2, 0.5], [16, 2, 0.45]),
  },
  {
    id: 'vijay-stambh',
    area: 'chittorgarh',
    img: '/img/vijay-stambh.png',
    themes: ['history','art','photo'],
    mapQ: 'Vijay Stambh Chittorgarh',
    name: { en: 'Vijay Stambh (Tower of Victory)', hi: 'विजय स्तंभ' },
    tag: { en: 'Monument', hi: 'स्मारक' },
    kind: 'tower', lat: 24.8878, lng: 74.6465, hotspot: false, hue: ['#c9635a', '#f5cfa0'],
    built: { en: '1440s · Maharana Kumbha', hi: '1440 के दशक · महाराणा कुम्भा' },
    story: {
      en: 'Maharana Kumbha raised this nine-storey tower in the 1440s to mark his victory over Mahmud Khalji, the Sultan of Malwa. It is about 37 metres tall and carved from base to top with gods, goddesses and scenes from the epics.',
      hi: 'महाराणा कुम्भा ने 1440 के दशक में मालवा के सुल्तान महमूद खिलजी पर अपनी विजय की स्मृति में यह नौ मंज़िला स्तंभ बनवाया। यह लगभग 37 मीटर ऊँचा है और नीचे से ऊपर तक देवी-देवताओं तथा महाकाव्यों के दृश्यों से तराशा गया है।',
    },
    legacy: {
      en: 'A stairway inside climbs the storeys, though access to the top may be restricted. The carving is so dense that it is sometimes called a museum in stone.',
      hi: 'भीतर सीढ़ियाँ मंज़िलों तक जाती हैं, पर ऊपर तक जाने की अनुमति सीमित हो सकती है। नक्काशी इतनी घनी है कि इसे कभी-कभी पत्थर का संग्रहालय कहा जाता है।',
    },
    tip: {
      en: 'It glows at golden hour and is often lit up in the evening, so stay on after the fort quietens down.',
      hi: 'सुनहरी रोशनी में यह दमकता है और शाम को अक्सर प्रकाशित होता है, इसलिए किले में भीड़ घटने के बाद भी रुकें।',
    },
    profile: curve([10.5, 2, 0.4], [16.5, 2, 0.4]),
  },
  {
    id: 'kumbhalgarh',
    area: 'kumbhalgarh',
    img: '/img/kumbhalgarh.png',
    themes: ['history','nature','photo'],
    mapQ: 'Kumbhalgarh Fort',
    name: { en: 'Kumbhalgarh Fort', hi: 'कुम्भलगढ़ किला' },
    tag: { en: 'UNESCO Hill Fort', hi: 'यूनेस्को पहाड़ी किला' },
    kind: 'fort', lat: 25.1528, lng: 73.587, hotspot: false, hue: ['#6b7a4f', '#e8c88a'],
    built: { en: '1443–1458 · Maharana Kumbha', hi: '1443–1458 · महाराणा कुम्भा' },
    story: {
      en: 'Maharana Kumbha built Kumbhalgarh in the 15th century on a ridge of the Aravalli hills. Its wall, about 36 kilometres long, is often called the longest continuous fort wall in India and is wide enough for horsemen to ride abreast. Maharana Pratap is traditionally said to have been born here in 1540.',
      hi: 'महाराणा कुम्भा ने 15वीं सदी में अरावली की एक पर्वतमाला पर कुम्भलगढ़ बनवाया। लगभग 36 किलोमीटर लंबी इसकी दीवार को अक्सर भारत की सबसे लंबी अटूट किले की दीवार कहा जाता है, और यह इतनी चौड़ी है कि घुड़सवार साथ-साथ चल सकें। परंपरा के अनुसार महाराणा प्रताप का जन्म 1540 में यहीं हुआ था।',
    },
    legacy: {
      en: 'Hundreds of Jain and Hindu temples stand inside the walls, and the climb to Badal Mahal gives views across the Aravallis. It is a UNESCO World Heritage Site (2013) inside a wildlife sanctuary.',
      hi: 'दीवारों के भीतर सैकड़ों जैन और हिंदू मंदिर हैं, और बादल महल की चढ़ाई से अरावली का नज़ारा दिखता है। यह वन्यजीव अभयारण्य के भीतर यूनेस्को विश्व धरोहर स्थल (2013) है।',
    },
    tip: {
      en: 'It is around 85 km from Udaipur, so start early and pair it with Ranakpur. Carry water and wear sturdy shoes.',
      hi: 'यह उदयपुर से लगभग 85 किमी दूर है, इसलिए जल्दी निकलें और रणकपुर के साथ जोड़ें। पानी साथ रखें और मज़बूत जूते पहनें।',
    },
    profile: curve([11, 2, 0.35], [15.5, 2, 0.3]),
  },
  {
    id: 'ranakpur',
    area: 'kumbhalgarh',
    img: '/img/ranakpur.png',
    themes: ['spiritual','art','history'],
    mapQ: 'Ranakpur Jain Temple',
    name: { en: 'Ranakpur Jain Temple', hi: 'रणकपुर जैन मंदिर' },
    tag: { en: 'Jain Temple', hi: 'जैन मंदिर' },
    kind: 'temple', lat: 25.1166, lng: 73.4725, hotspot: false, hue: ['#d9c9a8', '#f6ecd2'],
    built: { en: '15th century · Dharna Shah, with Rana Kumbha\'s support', hi: '15वीं सदी · धरणा शाह, राणा कुम्भा के सहयोग से' },
    story: {
      en: 'The Adinath Jain temple at Ranakpur was built in the 15th century by the merchant Dharna Shah, with the support of Maharana Kumbha. It is carved in pale marble in a wooded valley of the Aravallis. The temple is said to have about 1,444 pillars, no two carved alike.',
      hi: 'रणकपुर का आदिनाथ जैन मंदिर 15वीं सदी में सेठ धरणा शाह ने महाराणा कुम्भा के सहयोग से बनवाया। यह अरावली की एक हरी-भरी घाटी में हल्के संगमरमर से तराशा गया है। कहा जाता है कि इसमें लगभग 1,444 खंभे हैं और कोई दो खंभे एक जैसे नहीं हैं।',
    },
    legacy: {
      en: 'The marble changes colour with the light through the day, and the domes, ceilings and pillars are carved in astonishing detail. It is a working temple, so check dress and leather rules at the gate.',
      hi: 'दिन भर की रोशनी के साथ संगमरमर का रंग बदलता है, और गुंबदों, छतों व खंभों पर अद्भुत बारीक नक्काशी है। यह पूजा का सक्रिय मंदिर है, इसलिए पहनावे और चमड़े के नियम गेट पर देख लें।',
    },
    tip: {
      en: 'Visiting hours for tourists can differ from worship hours, so check on the day. Cover shoulders and knees and expect to remove shoes.',
      hi: 'पर्यटकों के दर्शन का समय पूजा के समय से अलग हो सकता है, इसलिए उसी दिन जाँच लें। कंधे और घुटने ढकें और जूते उतारने के लिए तैयार रहें।',
    },
    profile: curve([11, 2, 0.3], [15, 2, 0.3]),
  },
  {
    id: 'haldighati',
    area: 'nathdwara',
    img: '/img/haldighati.png',
    themes: ['history','nature','photo'],
    mapQ: 'Haldighati Rajsamand',
    name: { en: 'Haldighati', hi: 'हल्दीघाटी' },
    tag: { en: 'Battlefield', hi: 'युद्धभूमि' },
    kind: 'hill', lat: 24.8956, lng: 73.6944, hotspot: false, hue: ['#c79a2e', '#f2dc9a'],
    built: { en: '18 June 1576 · Battle of Haldighati', hi: '18 जून 1576 · हल्दीघाटी का युद्ध' },
    story: {
      en: 'On 18 June 1576 Maharana Pratap\'s Mewar army met a Mughal force led by Man Singh I at the narrow Haldighati pass. The soil here is yellow like turmeric, which gave the pass its name. Pratap\'s loyal horse Chetak, badly wounded, carried him from the battlefield and died at a spot now marked by a memorial.',
      hi: '18 जून 1576 को महाराणा प्रताप की मेवाड़ी सेना हल्दीघाटी के संकरे दर्रे पर मान सिंह प्रथम के नेतृत्व वाली मुग़ल सेना से भिड़ी। यहाँ की मिट्टी हल्दी जैसी पीली है, इसी से दर्रे का नाम पड़ा। गंभीर घायल होने पर भी प्रताप के वफ़ादार घोड़े चेतक ने उन्हें युद्धभूमि से निकाला और उसने एक स्थान पर प्राण त्यागे, जहाँ अब स्मारक है।',
    },
    legacy: {
      en: 'You can visit Chetak Samadhi, a Maharana Pratap museum and Rakt Talai, where the fighting was fiercest. Roadside shops sell rose products, including gulkand, from Haldighati\'s famous roses.',
      hi: 'यहाँ चेतक समाधि, महाराणा प्रताप संग्रहालय और रक्त तलाई देखी जा सकती है, जहाँ युद्ध सबसे भीषण था। सड़क किनारे दुकानों पर हल्दीघाटी के प्रसिद्ध गुलाबों से बने गुलकंद जैसे उत्पाद मिलते हैं।',
    },
    tip: {
      en: 'It lies on the road between Udaipur and Nathdwara, about 40 km from Udaipur, so fit it into a Nathdwara day. Carry water; there is little shade.',
      hi: 'यह उदयपुर और नाथद्वारा के रास्ते में, उदयपुर से लगभग 40 किमी दूर है, इसलिए इसे नाथद्वारा वाले दिन में जोड़ें। पानी साथ रखें; छाया कम है।',
    },
    profile: curve([10, 2, 0.25], [16, 2, 0.22]),
  },
  {
    id: 'fateh-sagar',
    area: 'udaipur',
    img: '/img/fateh-sagar.png',
    themes: ['nature','photo'],
    mapQ: 'Fateh Sagar Lake Udaipur',
    name: { en: 'Fateh Sagar Lake', hi: 'फ़तेह सागर झील' },
    tag: { en: 'Lake', hi: 'झील' },
    kind: 'lake', lat: 24.6045, lng: 73.678, hotspot: false, hue: ['#4f86a8', '#f2c9a6'],
    built: { en: '1678 · rebuilt 1889', hi: '1678 · 1889 में पुनर्निर्मित' },
    story: {
      en: 'Maharana Jai Singh built Fateh Sagar in 1678. After floods damaged the dam, Maharana Fateh Singh rebuilt it in the late 1880s, and the new embankment was laid by the Duke of Connaught, so it was also called the Connaught Dam. Hills and the green Nehru Island Park frame the lake.',
      hi: 'महाराणा जय सिंह ने 1678 में फ़तेह सागर बनवाया। बाढ़ से बाँध टूटने पर महाराणा फ़तेह सिंह ने 1880 के दशक के अंत में इसे फिर बनवाया, और नए बाँध की नींव ड्यूक ऑफ़ कनॉट ने रखी, इसलिए इसे कनॉट बाँध भी कहा गया। पहाड़ियाँ और हरा नेहरू द्वीप उद्यान झील को घेरते हैं।',
    },
    legacy: {
      en: 'Evenings bring locals for boat rides, snacks and sunset walks along the lakeside. It is a relaxed alternative to the busy Pichola ghats.',
      hi: 'शाम को लोग नौका-सवारी, खान-पान और झील किनारे सूर्यास्त की सैर के लिए आते हैं। यह भीड़ भरे पिछोला घाटों का आरामदेह विकल्प है।',
    },
    tip: {
      en: 'Come around sunset and walk the promenade. The Saheliyon-ki-Bari garden is a short ride away.',
      hi: 'सूर्यास्त के समय आएँ और किनारे की सैरगाह पर टहलें। सहेलियों की बाड़ी बगीचा थोड़ी ही दूरी पर है।',
    },
    profile: curve([17.5, 2, 0.45], [11, 2.5, 0.15]),
  },
  {
    id: 'lake-pichola', area: 'udaipur', img: '/img/lake-pichola.png', gallery: ['/img/lake-pichola-steps.png'], themes: ['nature','photo','history'], mapQ: 'Lake Pichola Udaipur',
    name: { en: 'Lake Pichola', hi: 'पिछोला झील' }, tag: { en: 'Lake & Ghats', hi: 'झील और घाट' }, kind: 'lake', lat: 24.5758, lng: 73.6798, hotspot: true, hue: ['#607f9b','#e6b8a0'],
    built: { en: '14th century · expanded by Maharana Udai Singh II', hi: '14वीं सदी · महाराणा उदय सिंह द्वितीय ने विस्तार कराया' },
    story: { en: 'Lake Pichola is an artificial freshwater lake created in 1362 and later enlarged when Maharana Udai Singh II founded Udaipur. Ghats, palaces and islands line its shores, giving the old city its unmistakable waterfront.', hi: 'पिछोला झील 1362 में बनाई गई कृत्रिम मीठे पानी की झील है। उदयपुर बसाने के बाद महाराणा उदय सिंह द्वितीय ने इसका विस्तार कराया। इसके किनारे घाट, महल और द्वीप हैं, जो पुराने शहर को खास झील-किनारा दृश्य देते हैं।' },
    legacy: { en: 'Boat routes connect the city waterfront with Jag Mandir and views of Jag Niwas. The lake remains part of Udaipur’s living water landscape.', hi: 'नावें शहर के घाटों से जग मंदिर तक जाती हैं और जग निवास के सुंदर दृश्य दिखाती हैं। यह झील आज भी उदयपुर के जीवंत जल-परिदृश्य का हिस्सा है।' },
    tip: { en: 'Choose an official boat jetty and check the last departure before sunset. Do not throw anything into the lake.', hi: 'अधिकृत नाव-घाट से नाव लें और सूर्यास्त से पहले आख़िरी नाव का समय जाँचें। झील में कचरा न डालें।' }, profile: curve([10,2,0.35],[18,2,0.8]),
  },
  {
    id: 'bahubali-hills', area: 'udaipur', img: '/img/bahubali-hills.png', themes: ['nature','photo'], mapQ: 'Bahubali Hills Badi Lake Udaipur',
    name: { en: 'Bahubali Hills', hi: 'बाहुबली हिल्स' }, tag: { en: 'Badi Lake Viewpoint', hi: 'बड़ी झील का दृश्य-बिंदु' }, kind: 'hill', lat: 24.6708, lng: 73.6297, hotspot: false, hue: ['#426b54','#a9c6a4'],
    built: { en: 'Aravalli viewpoint · Badi Lake', hi: 'अरावली दृश्य-बिंदु · बड़ी झील' },
    story: { en: 'A narrow ridge above Badi Lake creates the dramatic viewpoint known as Bahubali Hills. The walk rewards visitors with broad views over the lake and the folds of the Aravalli hills.', hi: 'बड़ी झील के ऊपर एक सँकरी पहाड़ी धार बाहुबली हिल्स का प्रसिद्ध दृश्य-बिंदु बनाती है। यहाँ तक पैदल पहुँचने पर झील और अरावली की पहाड़ियों के विस्तृत नज़ारे मिलते हैं।' },
    legacy: { en: 'The rocky ridge and quiet lake landscape are a favourite for sunrise and landscape photography. The path is natural and uneven.', hi: 'चट्टानी धार और शांत झील का दृश्य सूर्योदय तथा प्रकृति-फ़ोटोग्राफ़ी के लिए लोकप्रिय है। रास्ता प्राकृतिक और ऊबड़-खाबड़ है।' },
    tip: { en: 'Wear grippy shoes, carry water, and avoid the exposed ridge in strong wind or rain. Leave no litter.', hi: 'अच्छी पकड़ वाले जूते पहनें, पानी साथ रखें और तेज़ हवा या बारिश में खुली पहाड़ी धार पर न जाएँ। कचरा न छोड़ें।' }, profile: curve([7,1.5,0.35],[17,2,0.35]),
  },
  {
    id: 'rayta-hills', area: 'udaipur', img: '/img/rayta-hills.png', themes: ['nature','photo'], mapQ: 'Rayta Hills Udaipur',
    name: { en: 'Rayta Hills', hi: 'रायता हिल्स' }, tag: { en: 'Aravalli Drive', hi: 'अरावली का पहाड़ी रास्ता' }, kind: 'hill', lat: 24.495, lng: 73.590, hotspot: false, hue: ['#67845b','#d8c79c'],
    built: { en: 'Aravalli range · Udaipur district', hi: 'अरावली पर्वतमाला · उदयपुर ज़िला' },
    story: { en: 'Rayta is a green Aravalli hill landscape known for its winding road, open ridgelines and seasonal monsoon colour. The route is a scenic rural drive rather than a developed monument.', hi: 'रायता अरावली का हरा पहाड़ी इलाक़ा है, जो घुमावदार सड़क, खुली पहाड़ियों और मानसून में हरियाली के लिए जाना जाता है। यह विकसित स्मारक नहीं, बल्कि सुंदर ग्रामीण रास्ता है।' },
    legacy: { en: 'Small villages and grazing land sit among the folds of the hills. Please respect local access, farms and roadside communities.', hi: 'पहाड़ियों के बीच छोटे गाँव और चरागाह हैं। स्थानीय रास्तों, खेतों और सड़क किनारे रहने वाले समुदायों का सम्मान करें।' },
    tip: { en: 'Check road and weather conditions before setting out; avoid stopping on blind bends and carry drinking water.', hi: 'निकलने से पहले सड़क और मौसम की स्थिति जाँचें। अंधे मोड़ों पर न रुकें और पीने का पानी साथ रखें।' }, profile: curve([8,2,0.25],[16,2,0.25]),
  },
  {
    id: 'gangaur-ghat', area: 'udaipur', img: '/img/gangaur-ghat.png', themes: ['history','photo','spiritual'], mapQ: 'Gangaur Ghat Udaipur',
    name: { en: 'Gangaur Ghat', hi: 'गणगौर घाट' }, tag: { en: 'Historic Waterfront', hi: 'ऐतिहासिक झील-किनारा' }, kind: 'lake', lat: 24.5791, lng: 73.6812, hotspot: true, hue: ['#b77e64','#ecd2ad'],
    built: { en: 'Old City · Lake Pichola waterfront', hi: 'पुराना शहर · पिछोला झील का किनारा' },
    story: { en: 'Gangaur Ghat is one of the old city’s best-known steps to Lake Pichola. Its gateways and broad stone stairs frame the water and remain a gathering place for residents, visitors and festival processions.', hi: 'गणगौर घाट पुराने शहर की पिछोला झील तक जाने वाली प्रसिद्ध सीढ़ियों में से एक है। इसके द्वार और चौड़ी पत्थर की सीढ़ियाँ झील का सुंदर दृश्य बनाती हैं। यहाँ स्थानीय लोग, यात्री और उत्सव की शोभायात्राएँ जुटती हैं।' },
    legacy: { en: 'The ghat is closely associated with Gangaur celebrations and the rhythms of everyday life by the lake. Nearby Bagore-ki-Haveli overlooks the waterfront.', hi: 'यह घाट गणगौर उत्सव और झील किनारे के रोज़मर्रा के जीवन से जुड़ा है। पास की बागोर की हवेली झील-किनारे को देखती है।' },
    tip: { en: 'Visit respectfully, especially during worship or ceremonies. Keep steps clear and never leave offerings or litter in the water.', hi: 'विशेषकर पूजा या समारोह के समय सम्मानपूर्वक आएँ। सीढ़ियाँ खाली रखें और जल में पूजा-सामग्री या कचरा न छोड़ें।' }, profile: curve([9,1.5,0.4],[18,2,0.75]),
  },
  {
    id: 'shilpgram', area: 'udaipur', img: '/img/shilpgram.png', themes: ['art','history'], mapQ: 'Shilpgram Udaipur',
    name: { en: 'Shilpgram & Crafts Fair', hi: 'शिल्पग्राम और शिल्प मेला' }, tag: { en: 'Rural Arts Complex', hi: 'ग्रामीण कला परिसर' }, kind: 'garden', lat: 24.6075, lng: 73.6334, hotspot: false, hue: ['#a76935','#e4bc73'],
    built: { en: '1989 · West Zone Cultural Centre', hi: '1989 · पश्चिम क्षेत्र सांस्कृतिक केंद्र' },
    story: { en: 'Shilpgram is a rural arts and crafts complex on Udaipur’s western edge. Its village-style huts and open spaces introduce visitors to regional architecture, handmade arts, music and dance.', hi: 'शिल्पग्राम उदयपुर के पश्चिमी किनारे पर बना ग्रामीण कला और शिल्प परिसर है। गाँव जैसी झोपड़ियाँ और खुले मैदान क्षेत्रीय वास्तुकला, हस्तकला, संगीत और नृत्य से परिचित कराते हैं।' },
    legacy: { en: 'The annual Shilpgram Utsav brings craftspeople, performers and visitors together. Dates and participating stalls change each year; the fair is seasonal.', hi: 'वार्षिक शिल्पग्राम उत्सव कारीगरों, कलाकारों और यात्रियों को एक साथ लाता है। मेले की तारीख़ें और दुकानें हर साल बदलती हैं; यह मौसमी आयोजन है।' },
    tip: { en: 'Check the official calendar before planning around the fair. Ask makers before photographing them and buy directly when possible.', hi: 'मेले के लिए यात्रा तय करने से पहले आधिकारिक कैलेंडर देखें। कारीगरों की तस्वीर लेने से पहले पूछें और संभव हो तो उनसे सीधे खरीदें।' }, profile: curve([11,2,0.3],[17,2,0.6]),
  },
  {
    id: 'jag-mandir', area: 'udaipur', img: '/img/jag-mandir.png', themes: ['history','photo'], mapQ: 'Jag Mandir Island Palace Udaipur',
    name: { en: 'Jag Mandir', hi: 'जग मंदिर' }, tag: { en: 'Island Palace', hi: 'द्वीप महल' }, kind: 'island', lat: 24.5727, lng: 73.6796, hotspot: false, hue: ['#7695a7','#e5d3b5'],
    built: { en: '16th–17th centuries · Lake Pichola', hi: '16वीं–17वीं सदी · पिछोला झील' },
    story: { en: 'Jag Mandir is a palace complex on an island in Lake Pichola. Construction began under Maharana Amar Singh and continued under Maharana Karan Singh and Maharana Jagat Singh I, creating marble pavilions and courtyards above the water.', hi: 'जग मंदिर पिछोला झील के एक द्वीप पर बना महल परिसर है। इसका निर्माण महाराणा अमर सिंह के समय शुरू हुआ और महाराणा करण सिंह तथा महाराणा जगत सिंह प्रथम के समय आगे बढ़ा। इसके संगमरमर के मंडप और आँगन पानी के ऊपर बने हैं।' },
    legacy: { en: 'Its Gul Mahal is associated with the Mughal prince Khurram, later Emperor Shah Jahan, who is said to have stayed here during a period of refuge.', hi: 'इसका गुल महल मुग़ल राजकुमार ख़ुर्रम, बाद के सम्राट शाहजहाँ, से जुड़ा है। कहा जाता है कि शरण के समय वे यहाँ ठहरे थे।' },
    tip: { en: 'Reach the island by an authorised boat service and confirm operating hours and entry conditions before departure.', hi: 'द्वीप तक अधिकृत नाव सेवा से जाएँ और निकलने से पहले नाव का समय तथा प्रवेश नियम जाँच लें।' }, profile: curve([11,2,0.35],[16,2,0.5]),
  },
  {
    id: 'moti-magri', area: 'udaipur', img: '/img/moti-magri.png', themes: ['history','photo'], mapQ: 'Moti Magri Maharana Pratap Memorial Udaipur',
    name: { en: 'Moti Magri (Pratap Memorial)', hi: 'मोती मगरी (प्रताप स्मारक)' }, tag: { en: 'Hilltop Memorial', hi: 'पहाड़ी स्मारक' }, kind: 'statue', lat: 24.5966, lng: 73.6847, hotspot: false, hue: ['#68798b','#d8c6a5'],
    built: { en: 'Maharana Pratap Memorial · Fateh Sagar', hi: 'महाराणा प्रताप स्मारक · फ़तेह सागर' },
    story: { en: 'Moti Magri is a hill overlooking Fateh Sagar Lake, crowned by a memorial to Maharana Pratap and his horse Chetak. The complex honours Mewar’s history and offers views across the lake and city.', hi: 'मोती मगरी फ़तेह सागर झील के ऊपर स्थित पहाड़ी है, जिसके शिखर पर महाराणा प्रताप और उनके घोड़े चेतक का स्मारक है। यह परिसर मेवाड़ के इतिहास को सम्मान देता है और झील तथा शहर का दृश्य दिखाता है।' },
    legacy: { en: 'The memorial sculpture depicts Pratap mounted on Chetak. Exhibits across the site tell stories of Mewar’s rulers and battles.', hi: 'स्मारक की मूर्ति में प्रताप को चेतक पर सवार दिखाया गया है। परिसर की प्रदर्शनियाँ मेवाड़ के शासकों और युद्धों की कहानियाँ बताती हैं।' },
    tip: { en: 'Expect an uphill walk and check opening times locally. Keep to marked paths and allow time for the exhibits.', hi: 'ऊपर की ओर पैदल चढ़ाई के लिए तैयार रहें और स्थानीय रूप से खुलने का समय जाँचें। तय रास्तों पर चलें और प्रदर्शनियाँ देखने का समय रखें।' }, profile: curve([10,2,0.3],[16,2,0.45]),
  },
  {
    id: 'karni-mata-udaipur', area: 'udaipur', img: '/img/karni-mata-udaipur.png', themes: ['spiritual','history','photo'], mapQ: 'Karni Mata Temple Machla Magra Udaipur',
    name: { en: 'Karni Mata Temple', hi: 'करणी माता मंदिर' }, tag: { en: 'Hilltop Temple & Ropeway', hi: 'पहाड़ी मंदिर और रोपवे' }, kind: 'temple', lat: 24.5685, lng: 73.6815, hotspot: false, hue: ['#b27a50','#e5ca9b'],
    built: { en: 'Machla Magra · overlooking Lake Pichola', hi: 'मचला मगरी · पिछोला झील के ऊपर' },
    story: { en: 'Karni Mata Temple stands on Machla Magra hill above Udaipur. Visitors reach it by a steep walk or, when operating, the ropeway. From the hilltop, the lake, City Palace and old city spread out below.', hi: 'करणी माता मंदिर उदयपुर के ऊपर मचला मगरी पहाड़ी पर स्थित है। यहाँ तक खड़ी चढ़ाई से पैदल या चालू होने पर रोपवे से पहुँचा जा सकता है। पहाड़ी से झील, सिटी पैलेस और पुराना शहर दिखाई देता है।' },
    legacy: { en: 'The shrine is a place of worship as well as a popular viewpoint. Ropeway service and access can change with weather and maintenance.', hi: 'यह मंदिर पूजा-स्थल होने के साथ लोकप्रिय दृश्य-बिंदु भी है। मौसम और रखरखाव के कारण रोपवे सेवा तथा पहुँच में बदलाव हो सकता है।' },
    tip: { en: 'Check ropeway status before travelling, dress respectfully and avoid the exposed path in heavy rain.', hi: 'जाने से पहले रोपवे की स्थिति जाँचें, सम्मानजनक पहनावा रखें और तेज़ बारिश में खुले रास्ते से बचें।' }, profile: curve([8,1.5,0.3],[18,2,0.7]),
  },
];

export const siteById = (id: string) => SITES.find((s) => s.id === id)!;

export interface Partner {
  id: string;
  name: string;
  nearSite: string;
  kind: 'artisan' | 'stay';
  img?: string;
  productImg?: string;
  craft?: L;
  badges?: L[];
  lat: number;
  lng: number;
  mapQ?: string;
  website?: string;
}

/** Demo rows are marked as samples; website-linked rows cite public business information, not a formal partnership. */
export const PARTNERS: Partner[] = [
  { id: 'a1', name: 'Mewar Miniature Studio', nearSite: 'jagdish-temple', kind: 'artisan', productImg: '/img/products/miniature.svg', craft: { en: 'Miniature painting', hi: 'लघु चित्रकला' }, lat: 24.5784, lng: 73.6829 },
  { id: 'a2', name: 'Lakeside Silver Workshop', nearSite: 'city-palace', kind: 'artisan', productImg: '/img/products/silver-jewellery.svg', craft: { en: 'Silver jewellery', hi: 'चाँदी के गहने' }, lat: 24.5771, lng: 73.6842 },
  { id: 'a3', name: 'Kathputli Puppet Corner', nearSite: 'bagore-ki-haveli', kind: 'artisan', productImg: '/img/products/puppets.svg', craft: { en: 'Puppet making', hi: 'कठपुतली निर्माण' }, lat: 24.5795, lng: 73.6812 },
  { id: 'a4', name: 'Molela Terracotta Collective', nearSite: 'saheliyon-ki-bari', kind: 'artisan', productImg: '/img/products/terracotta.svg', craft: { en: 'Terracotta plaques', hi: 'मोलेला टेराकोटा' }, lat: 24.6005, lng: 73.6849 },
  { id: 'a6', name: 'Nathdwara Pichwai Atelier', nearSite: 'shrinathji', kind: 'artisan', productImg: '/img/products/pichwai.svg', craft: { en: 'Pichwai painting', hi: 'पिछवाई चित्रकला' }, lat: 24.9372, lng: 73.8236 },
  { id: 'a5', name: 'Bandhani & Block-print Atelier', nearSite: 'ahar-cenotaphs', kind: 'artisan', productImg: '/img/products/block-print.svg', craft: { en: 'Bandhani, hand-block and textile printing', hi: 'बंधेज, हाथ की ब्लॉक प्रिंट और वस्त्र छपाई' }, lat: 24.5862, lng: 73.7211 },
  { id: 's1', name: 'Lakeview Jharokha Stay', nearSite: 'bagore-ki-haveli', kind: 'stay', img: '/img/stay-lakeview.jpg', badges: [{ en: 'Rainwater harvesting', hi: 'वर्षा जल संचयन' }, { en: 'Plastic-free', hi: 'प्लास्टिक-मुक्त' }], lat: 24.5801, lng: 73.6808 },
  { id: 's2', name: 'Mural Haveli Suites', nearSite: 'city-palace', kind: 'stay', img: '/img/stay-mural.jpg', badges: [{ en: 'Buys from local artisans', hi: 'स्थानीय कारीगरों से खरीद' }, { en: 'Solar hot water', hi: 'सौर गर्म पानी' }], lat: 24.5769, lng: 73.6826 },
  { id: 's3', name: 'Terrace Lakeside Heritage Hotel', nearSite: 'jagdish-temple', kind: 'stay', img: '/img/stay-terrace.jpg', badges: [{ en: 'Farm-to-table', hi: 'खेत से थाली तक' }, { en: 'Refill water stations', hi: 'रीफ़िल पानी केंद्र' }], lat: 24.5792, lng: 73.6832 },
  { id: 'a7', name: 'Pacific Art Udaipur', nearSite: 'bagore-ki-haveli', kind: 'artisan', productImg: '/img/products/miniature.svg', craft: { en: 'Mewar miniature painting · workshops and classes', hi: 'मेवाड़ लघु चित्रकला · कार्यशालाएँ और कक्षाएँ' }, lat: 24.5830, lng: 73.6790, mapQ: 'Pacific Art Udaipur, 192 Naga Nagri, Outside Chandpole, Udaipur', website: 'https://www.pacificartudaipur.com/home' },
  { id: 'a8', name: 'TAAP – The Artisans House', nearSite: 'saheliyon-ki-bari', kind: 'artisan', productImg: '/img/products/block-print.svg', craft: { en: 'Hand-block-printed textiles and artisan-made home goods', hi: 'हाथ से छपे वस्त्र और कारीगरों द्वारा बने घरेलू सामान' }, lat: 24.6000, lng: 73.6800, mapQ: 'TAAP The Artisans House, 47 Krishna Complex, Bedla Road, Udaipur', website: 'https://taaptheartisanshouse.in/pages/contact-us' },
  { id: 's4', name: 'Fateh Garh', nearSite: 'lake-palace', kind: 'stay', badges: [{ en: 'Solar and wind energy', hi: 'सौर और पवन ऊर्जा' }, { en: 'Rainwater harvesting', hi: 'वर्षा जल संचयन' }, { en: 'Recycled building materials', hi: 'पुनर्चक्रित निर्माण सामग्री' }], lat: 24.5753, lng: 73.6803, mapQ: 'Fateh Garh, Bujara, Sisarma Road, Udaipur', website: 'https://www.fatehcollection.com/fateh-garh-udaipur-resort/about-fateh-garh/our-goal.html' },
  { id: 's5', name: 'The Mangal View Residency', nearSite: 'city-palace', kind: 'stay', badges: [{ en: 'Solar panels supply 30% of energy needs', hi: 'सौर पैनल से 30% ऊर्जा की ज़रूरत पूरी' }], lat: 24.5780, lng: 73.6820, mapQ: 'The Mangal View Residency, Sharma Colony, Brahmpuri, Udaipur', website: 'https://www.themangalview.com/' },
  { id: 's6', name: 'Ramada by Wyndham Udaipur Resort and Spa', nearSite: 'fateh-sagar', kind: 'stay', badges: [{ en: 'Solar panels', hi: 'सौर पैनल' }, { en: 'Rainwater harvesting', hi: 'वर्षा जल संचयन' }, { en: 'Treated water reused for gardens', hi: 'उपचारित पानी का बगीचों में पुनः उपयोग' }], lat: 24.6045, lng: 73.6780, mapQ: 'Ramada by Wyndham Udaipur Resort and Spa, Rampura Circle, Kodiyat Main Road, Udaipur', website: 'https://www.ramadaudaipur.com/about' },
];

// Missing translations fall back to English, so a half-translated language never shows blanks.
const fb = (l: L): L => new Proxy(l, { get: (t, k) => (typeof k === 'string' ? t[k] ?? t.en : undefined) });
for (const s of SITES) for (const k of ['name', 'tag', 'built', 'story', 'legacy', 'tip'] as const) s[k] = fb(s[k]);
for (const p of PARTNERS) { if (p.craft) p.craft = fb(p.craft); if (p.badges) p.badges = p.badges.map(fb); }
