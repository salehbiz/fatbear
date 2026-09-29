export type FrameTier = '4k' | 'desktop' | 'mobile';

// Tiers are chosen by the physical pixels the full-screen film covers, not by CSS width, and a slow
// connection never lowers the resolution: FrameCache shows preview frames first and upgrades around the
// playhead, so a slow network only delays sharpness. Save-Data is the one explicit request to send less.
export function getFrameTier(): FrameTier {
  if (typeof window === 'undefined') return '4k';
  const w = window.innerWidth;
  const conn = (navigator as any)?.connection;
  const saveData = conn?.saveData === true || conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g';
  if (w < 768) return 'mobile';
  if (saveData) return 'desktop';
  return w * Math.min(window.devicePixelRatio || 1, 2) > 2200 ? '4k' : 'desktop';
}

// A portrait viewport shows a 9:16 slice of the film, so it loads the tier baked in that shape from the 8K master.
export const portraitFilm = () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
