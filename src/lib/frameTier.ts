export type FrameTier = 'hq' | 'desktop' | 'mobile';

// Vaultfy / resilient-hero-scrub tiering: phones get the mobile tier, and the 2560 tier needs a high-density
// screen on a fast connection. Phones get 1080×1920 portrait frames cut from the 8K master.
export function getFrameTier(): FrameTier {
  if (typeof window === 'undefined') return 'hq';
  const w = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;
  const conn = (navigator as any)?.connection;
  const slowConn =
    conn?.saveData === true ||
    conn?.effectiveType === '3g' ||
    conn?.effectiveType === '2g' ||
    conn?.effectiveType === 'slow-2g' ||
    (typeof conn?.downlink === 'number' && conn.downlink < 3);
  if (w < 768) return 'mobile';
  if (dpr >= 1.25 && !slowConn && w * Math.min(dpr, 2) > 2200) return 'hq';
  return 'desktop';
}

// A portrait viewport shows a 9:16 slice of the film, so it loads the tier baked in that shape from the 8K master.
export const portraitFilm = () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
