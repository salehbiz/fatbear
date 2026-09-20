export type FrameTier = 'desktop-hq' | 'desktop' | 'mobile';

export function getFrameTier(): FrameTier {
  if (typeof window === 'undefined') return 'desktop-hq';
  const w = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;
  const conn = (navigator as any)?.connection;
  const slowConn =
    conn?.effectiveType === '3g' ||
    conn?.saveData === true ||
    (typeof conn?.downlink === 'number' && conn.downlink < 3);

  if (w < 768 || slowConn) {
    return 'mobile';
  }

  // Serve 4K frames only on high-DPR screens (Retina, 4K/5K monitors)
  // where the canvas actually renders enough pixels to benefit.
  // Standard 1080p screens (dpr=1) get 1920x1080 frames which map 1:1.
  if (dpr >= 1.25) {
    return 'desktop-hq';
  }
  return 'desktop';
}
