import test from 'node:test';
import assert from 'node:assert/strict';
import { coverRect, focalAt, frameAt, frameWindow, attentionAt } from '../src/lib/math.mjs';

test('window expansion never advances the film; endpoint excludes the trailing black hold', () => {
  for (const p of [0, .03, .089, .09]) assert.equal(frameAt(p, 169), 0);
  assert.equal(frameAt(.425, 169), 169);
  assert.equal(frameAt(1, 169), 169);
  const forwards = Array.from({ length: 101 }, (_, i) => frameAt(i / 100, 169));
  assert.deepEqual(forwards.toReversed(), Array.from({ length: 101 }, (_, i) => frameAt((100 - i) / 100, 169)));
});

test('focal crop covers all viewport shapes and keeps the subject inside the frame', () => {
  for (const [w, h] of [[390,844],[1440,900],[80,60],[844,390]]) {
    for (let frame = 0; frame <= 169; frame++) {
      const f = focalAt(frame), r = coverRect(w, h, 1280,720,f);
      assert.ok(r.x <= 0 && r.y <= 0);
      assert.ok(r.x + r.w >= w - .001 && r.y + r.h >= h - .001);
      const focalX = r.x + f.x * r.w, focalY = r.y + f.y * r.h;
      assert.ok(focalX >= 0 && focalX <= w && focalY >= 0 && focalY <= h);
    }
  }
});

test('decode window stays bounded at endpoints, jumps and direction reversals', () => {
  for (const limit of [20,36]) for (const target of [0,1,85,168,169]) for (const direction of [-1,1]) {
    const result = frameWindow(target,169,limit,direction);
    assert.equal(result[0],target);
    assert.ok(result.length <= limit);
    assert.equal(result.length,new Set(result).size);
    assert.ok(result.every(n=>n>=0&&n<=169));
  }
});


test('illustrative growth is bounded, monotonic and reversible at chapter boundaries', () => {
  assert.equal(attentionAt(0), 24);
  assert.equal(attentionAt(.685), 24);
  assert.equal(attentionAt(.925), 128640);
  assert.equal(attentionAt(1), 128640);
  const values = Array.from({length:1001}, (_,i)=>attentionAt(i/1000));
  assert.ok(values.every((n,i)=>i===0 || n>=values[i-1]));
  assert.deepEqual(values.toReversed(), Array.from({length:1001}, (_,i)=>attentionAt((1000-i)/1000)));
});
