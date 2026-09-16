import { mix, range, smooth } from './math.mjs';

// Layers drift against the camera at their own rates while they are on stage.
// Phones only lift, so copy placed above the scene never travels down into the post.
export const DRIFT = Object.freeze({ copy: 46, card: 22, business: 34 });
export const copyDrift = (t, amount, mobile = false) => mobile ? mix(0, -amount * .5, t) : mix(amount, -amount, t);

// Headline lines arrive from alternating sides and settle exactly on their layout position.
export function lineSlide(enter, index, mobile = false) {
  const distance = (1 - enter) * (mobile ? 40 : 120);
  return distance ? (index % 2 ? distance : -distance) : 0;
}

// A restrained flip-fade gives headline lines a physical entrance while the
// parent copy remains fully reversible on the scroll clock.
export function flipFade(enter, index, mobile = false) {
  const remaining = 1 - enter;
  if (!remaining) return { y: 0, rotationX: 0, opacity: enter };
  const offset = remaining * (mobile ? 14 : 22);
  return { y: index % 2 ? offset : -offset, rotationX: remaining * (index % 2 ? -68 : 68), opacity: enter };
}

// Blooming elements settle scale, saturation and light together; the filter is gone once settled.
export const bloomFrom = (enter, from = .6) => ({ enter, scale: mix(from, 1, enter), saturate: enter, brightness: mix(1.6, 1, enter) });
export function bloomAt(t, index, count, from = .6, width = .55) {
  const start = count > 1 ? index / (count - 1) * (1 - width) : 0;
  return bloomFrom(smooth(range(t, start, start + width)), from);
}
export const bloomFilter = b => b.enter >= 1 ? '' : `saturate(${b.saturate.toFixed(3)}) brightness(${b.brightness.toFixed(3)})`;
