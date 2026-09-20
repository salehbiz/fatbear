export type FrameTier = 'desktop' | 'mobile';

export function getFrameTier(): FrameTier {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  const conn = (navigator as any)?.connection;
  const slowConn = conn?.effectiveType === '3g' || (typeof conn?.downlink === 'number' && conn.downlink < 3);

  if (w < 768 || slowConn) {
    return 'mobile';
  }
  return 'desktop';
}
