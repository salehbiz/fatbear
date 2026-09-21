export type FrameTier = '4k' | 'desktop' | 'mobile';

export function getFrameTier(): FrameTier {
  if (typeof window === 'undefined') return '4k';
  const w = window.innerWidth;
  const conn = (navigator as any)?.connection;
  const slowConn =
    conn?.effectiveType === '3g' ||
    conn?.effectiveType === '2g' ||
    conn?.saveData === true ||
    (typeof conn?.downlink === 'number' && conn.downlink < 1.5);

  // Mobile screens or slow connections get tiny mobile-tier frames (~35KB each)
  if (w < 768 || slowConn) return 'mobile';
  // Mid-range desktop gets 1080p frames (~150KB each)
  if (w < 1440) return 'desktop';
  // Large screens on fast connections get 4K frames (~300KB each)
  return '4k';
}
