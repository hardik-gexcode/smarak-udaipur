import { SITES, Theme } from '../data/sites';

export interface Traveller {
  type: 'indian' | 'foreign';
  name: string;
  from: string; // Indian state or country
  days: number;
  group: 'solo' | 'couple' | 'family' | 'friends';
  interests: Theme[];
  firstTime: boolean;
}

type Cluster = 'nathdwara' | 'kumbhalgarh' | 'chittorgarh';

/** Day-by-day plan: Udaipur days balance one headline landmark with two quieter sites; day trips cover Nathdwara, Kumbhalgarh and Chittorgarh. */
export function buildPlan(t: Traveller): string[][] {
  const score = (id: string) => SITES.find((s) => s.id === id)!.themes.filter((x) => t.interests.includes(x)).length;
  const city = SITES.filter((s) => s.area === 'udaipur');
  const hot = city.filter((s) => s.hotspot).map((s) => s.id).sort((a, b) => score(b) - score(a));
  const calm = city.filter((s) => !s.hotspot).map((s) => s.id).sort((a, b) => score(b) - score(a));

  const trips: [Cluster, number][] = (['nathdwara', 'kumbhalgarh', 'chittorgarh'] as Cluster[])
    .map((c) => [c, SITES.filter((s) => s.area === c).reduce((a, s) => a + score(s.id), 0) + (c === 'nathdwara' && t.type === 'indian' ? 2 : 0) + (c === 'chittorgarh' ? 1 : 0)] as [Cluster, number])
    .sort((a, b) => b[1] - a[1]);
  const tripDays = t.days >= 2 ? Math.min(3, Math.floor(t.days / 2)) : 0;
  const tripClusters = trips.slice(0, tripDays).map(([c]) => c);
  const cityDays = Math.max(1, t.days - tripDays);

  const days: string[][] = [];
  for (let d = 0; d < cityDays; d++) {
    const day: string[] = [];
    if (hot.length) day.push(hot.shift()!);
    for (let k = 0; k < 2 && calm.length; k++) day.push(calm.shift()!);
    if (day.length) days.push(day);
  }
  tripClusters.forEach((c, i) => {
    const ids = SITES.filter((s) => s.area === c).map((s) => s.id).sort((a, b) => score(b) - score(a)).slice(0, 4);
    days.splice(Math.min(i * 2 + 1, days.length), 0, ids);
  });
  return days;
}

export const INDIAN_STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman & Nicobar', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];

export const COUNTRIES = ['United States', 'United Kingdom', 'Canada', 'Australia', 'New Zealand', 'Ireland', 'Germany', 'France', 'Italy', 'Spain', 'Portugal', 'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Russia', 'Turkey', 'Israel', 'United Arab Emirates', 'Saudi Arabia', 'Japan', 'South Korea', 'China', 'Singapore', 'Malaysia', 'Thailand', 'Indonesia', 'Sri Lanka', 'Nepal', 'Bangladesh', 'Brazil', 'Argentina', 'Mexico', 'South Africa', 'Other'];
