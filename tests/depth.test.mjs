import test from 'node:test';
import assert from 'node:assert/strict';
import { copyDrift, lineSlide, flipFade, bloomAt, bloomFrom, bloomFilter, DRIFT } from '../src/lib/depth.mjs';

const round = n => Math.round(n * 1e6) / 1e6;

test('depth layers drift symmetrically on desktop and only lift on phones', () => {
 for (const amount of Object.values(DRIFT)) {
  assert.equal(copyDrift(0, amount), amount); assert.equal(copyDrift(.5, amount), 0); assert.equal(copyDrift(1, amount), -amount);
  for (let i = 0; i <= 100; i++) { const lift = copyDrift(i / 100, amount, true); assert.ok(lift <= 0 && lift >= -amount * .5); }
  assert.equal(copyDrift(1, amount, true), -amount * .5);
 }
});

test('headline lines enter from alternating sides and land exactly in place', () => {
 assert.equal(lineSlide(0, 0), -120); assert.equal(lineSlide(0, 1), 120); assert.equal(lineSlide(0, 1, true), 40);
 for (const i of [0, 1, 2]) { assert.equal(lineSlide(1, i), 0); assert.equal(lineSlide(1, i, true), 0); }
 let previous = -120;
 for (let k = 1; k <= 100; k++) { const x = lineSlide(k / 100, 0); assert.ok(x >= previous && x <= 0); previous = x; }
});

test('headline lines flip and fade into their settled position', () => {
 for (const index of [0, 1]) {
  const start = flipFade(0, index), end = flipFade(1, index);
  assert.equal(start.opacity, 0); assert.notEqual(start.rotationX, 0); assert.notEqual(start.y, 0);
  assert.deepEqual(end, { y: 0, rotationX: 0, opacity: 1 });
 }
});

test('bloom staggers within its window, settles completely and leaves no filter behind', () => {
 for (const count of [3, 4, 5]) {
  const starts = [];
  for (let i = 0; i < count; i++) {
   const closed = bloomAt(0, i, count), open = bloomAt(1, i, count);
   assert.deepEqual([closed.enter, closed.scale, closed.saturate, closed.brightness].map(round), [0, .6, 0, 1.6]);
   assert.deepEqual([open.enter, open.scale, open.saturate, open.brightness].map(round), [1, 1, 1, 1]);
   assert.equal(bloomFilter(open), ''); assert.notEqual(bloomFilter(closed), '');
   starts.push(Array.from({ length: 1001 }, (_, k) => k / 1000).find(t => bloomAt(t, i, count).enter > 0));
  }
  assert.ok(starts.every((t, i) => !i || t > starts[i - 1]), 'later items start later');
  assert.ok(bloomAt(.999, count - 1, count).enter < 1 && bloomAt(1, count - 1, count).enter === 1, 'the last item settles exactly at the end');
 }
 assert.equal(round(bloomFrom(1, .88).scale), 1); assert.equal(round(bloomFrom(0, .88).scale), .88);
});
