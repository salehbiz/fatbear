export type FrameTier = '4k' | 'desktop';

export function getFrameTier(): FrameTier {
  if (typeof window === 'undefined') return '4k';
  const w = window.innerWidth;
  const conn = (navigator as any)?.connection;
  const slowConn =
    conn?.effectiveType === '3g' ||
    conn?.saveData === true ||
    (typeof conn?.downlink === 'number' && conn.downlink < 1.5);

  // Mobile gets 1080p frames; desktop always gets 4K.
  if (w < 768 || slowConn) return 'desktop';
  return '4k';
}
