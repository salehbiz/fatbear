import { IRIS_START, IRIS_END } from './profile-motion.mjs';
import { range, smooth } from './math.mjs';

// The iris is drawn as light before it burns: colour drains and its fibres glow over the lead,
// then the pupil dissolves outward from the photograph's subject until the film has gone.
export const GLOW_LEAD = .35;
export const GLOW_START = IRIS_START - GLOW_LEAD;

export function revealAt(world) {
  const glow = smooth(range(world, GLOW_START, IRIS_START));
  const dissolve = range(world, IRIS_START, IRIS_END);
  return {
    active: world >= GLOW_START && world < IRIS_END ? 1 : 0,
    dissolve,
    grayscale: glow,
    edge: glow * .5,
    brightness: 1 - dissolve,
  };
}
