import { creator } from './creator.mjs';
export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const mix = (a, b, t) => a + (b - a) * t;
export const range = (p, start, end) => clamp((p - start) / (end - start));
export const smooth = (t) => t * t * (3 - 2 * t);
// The media slot has finished expanding to the full viewport at this opening position; frames advance from here.
export const EXPANSION_END = .09;
export const frameAt = (p, last) => Math.round(range(p, EXPANSION_END, 0.425) * last);

// Measured visual anchors in the approved 1280×720 edit, in source coordinates.
// Fullscreen phone crop follows the face, then the visible iris and phone reflection.
const anchors = [[0, .511, .35], [44, .512, .40], [66, .62, .46], [78, .535, .485], [98, .50, .50], [125, .53, .53], [145, .50, .50], [169, .50, .50]];
export function focalAt(frame) {
  for (let i = 1; i < anchors.length; i++) {
    if (frame <= anchors[i][0]) {
      const a = anchors[i - 1], b = anchors[i];
      const t = smooth(range(frame, a[0], b[0]));
      return { x: mix(a[1], b[1], t), y: mix(a[2], b[2], t) };
    }
  }
  return { x: .5, y: .5 };
}

export function coverRect(w, h, sw, sh, focal) {
  const scale = Math.max(w / sw, h / sh);
  const dw = sw * scale, dh = sh * scale;
  return { x: clamp(w / 2 - focal.x * dw, w - dw, 0), y: clamp(h / 2 - focal.y * dh, h - dh, 0), w: dw, h: dh };
}

export function frameWindow(target, last, limit, direction = 1) {
  const ahead = Math.floor(limit * .65), behind = limit - ahead - 1;
  const indices = [target];
  for (let d = 1; d <= Math.max(ahead, behind); d++) {
    if (d <= ahead) indices.push(target + d * direction);
    if (d <= behind) indices.push(target - d * direction);
  }
  return indices.filter(n => n >= 0 && n <= last);
}

// Story values are deliberately illustrative and deterministic in both scroll directions.
export const attentionAt = p => Math.round(mix(creator.initialLikes, creator.finalLikes, smooth(range(p, .685, .925)) ** 2));
