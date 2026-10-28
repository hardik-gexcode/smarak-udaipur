/** Opens turn-by-turn directions. Works offline-first: the destination is on-device, only navigation needs a network. */
export const openMap = (s: { lat: number; lng: number; mapQ?: string }) =>
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${s.mapQ ? encodeURIComponent(s.mapQ) : `${s.lat},${s.lng}`}`, '_blank');

/** Tiny cross-screen preferences (e.g. "open Explore filtered to quiet spots"). */
export const pref = {
  get: (k: string, d: string) => sessionStorage.getItem(`smarak.${k}`) ?? d,
  set: (k: string, v: string) => sessionStorage.setItem(`smarak.${k}`, v),
};
