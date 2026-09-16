export type ConnectionTelemetry = {
  isMobile: boolean;
  isSlow: boolean;
  dpr: number;
};

export function getConnectionTelemetry(): ConnectionTelemetry {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const conn = typeof navigator !== 'undefined' ? (navigator as any).connection : undefined;
  const isSlow =
    conn?.effectiveType === '3g' ||
    conn?.effectiveType === '2g' ||
    conn?.saveData === true ||
    (typeof conn?.downlink === 'number' && conn.downlink < 3);
  const isMobile = w < 768;
  return { isMobile, isSlow: Boolean(isSlow), dpr };
}
