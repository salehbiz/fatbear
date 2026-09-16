import test from 'node:test';
import assert from 'node:assert/strict';
import { revealAt, GLOW_START, GLOW_LEAD } from '../src/lib/reveal-motion.mjs';
import { IRIS_START, IRIS_END, OPENING_TRAVEL } from '../src/lib/profile-motion.mjs';
import { frameAt } from '../src/lib/math.mjs';

test('the iris is drawn as light before it burns, and the burn completes exactly when the film hides', () => {
 assert.equal(GLOW_START, IRIS_START - GLOW_LEAD);
 assert.equal(revealAt(GLOW_START - .001).active, 0);
 assert.deepEqual(revealAt(GLOW_START), { active: 1, dissolve: 0, grayscale: 0, edge: 0, brightness: 1 });
 const lit = revealAt(IRIS_START);
 assert.equal(lit.grayscale, 1); assert.equal(lit.edge, .5); assert.equal(lit.dissolve, 0); assert.equal(lit.active, 1);
 assert.ok(revealAt(OPENING_TRAVEL).dissolve > 0 && revealAt(OPENING_TRAVEL).dissolve < 1, 'the last film frame arrives mid-burn, never as a black hold');
 const done = revealAt(IRIS_END);
 assert.equal(done.dissolve, 1); assert.equal(done.brightness, 0); assert.equal(done.active, 0);
 assert.ok(frameAt(GLOW_START / 12, 169) >= 140, 'the glow begins while the iris texture is still on screen');
 let previous = revealAt(GLOW_START);
 for (let w = GLOW_START; w <= IRIS_END + 1e-9; w += .005) {
  const r = revealAt(w);
  assert.ok(r.dissolve >= previous.dissolve && r.grayscale >= previous.grayscale && r.brightness <= previous.brightness, 'the reveal only advances');
  previous = r;
 }
});
