export type FrameTier = '4k' | 'desktop' | 'mobile';

export function getFrameTier(): FrameTier {
  if (typeof window === 'undefined') return '4k';
  const w = window.innerWidth;
  const conn = (navigator as any)?.connection;
  const slowConn = conn?.effectiveType === '3g' || (typeof conn?.downlink === 'number' && conn.downlink < 3);

  if (w < 768 || slowConn) {
    return 'mobile';
  }
  return '4k';
}
