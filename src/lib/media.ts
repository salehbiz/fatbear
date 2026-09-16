// Replace VITE_MEDIA_BASE with an asset/CDN base; keep the same manifest and relative paths.
export function media(path: string) {
  const base = (import.meta.env.VITE_MEDIA_BASE || '/media').replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}
