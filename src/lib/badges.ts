export interface TravelBadge {
  xp: number;
  icon: string;
  title: string;
  hindi: string;
  subtitle: string;
}

export const TRAVEL_BADGES: TravelBadge[] = [
  { xp: 50, icon: '🥾', title: 'First Footsteps', hindi: 'पहले क़दम', subtitle: 'Your Mewar trail begins' },
  { xp: 100, icon: '🧭', title: 'Mewar Wayfinder', hindi: 'मेवाड़ पथ-प्रदर्शक', subtitle: 'Finding your way through Mewar' },
  { xp: 150, icon: '🏛️', title: 'Heritage Pathfinder', hindi: 'धरोहर पथिक', subtitle: 'Stories and places collected' },
  { xp: 200, icon: '⛰️', title: 'Aravalli Voyager', hindi: 'अरावली यात्री', subtitle: 'A true explorer of the hills' },
  { xp: 250, icon: '🌟', title: 'Mewar Trailblazer', hindi: 'मेवाड़ के अग्रणी यात्री', subtitle: 'A remarkable journey through Mewar' },
  { xp: 300, icon: '👑', title: 'Living Legend', hindi: 'जीवंत किंवदंती', subtitle: 'A legendary heritage journey' },
];

export const earnedTravelBadges = (xp: number) => TRAVEL_BADGES.filter((badge) => xp >= badge.xp);
export const latestTravelBadge = (xp: number) => earnedTravelBadges(xp).at(-1);
export const nextTravelBadge = (xp: number) => TRAVEL_BADGES.find((badge) => xp < badge.xp);
