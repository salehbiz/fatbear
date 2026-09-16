import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, chapterAt, chapterLabel, chapterEnd, chapterProgress } from '../src/lib/chapters.mjs';
import { STORY_START, TOTAL_TRAVEL, PASSES_END } from '../src/lib/profile-motion.mjs';

test('chapters tile the story in order, and every jump lands inside its own chapter', () => {
 assert.equal(CHAPTERS.length, 6);
 assert.ok(CHAPTERS[0].start < STORY_START);
 assert.ok(CHAPTERS[4].start > PASSES_END, 'Build begins with the crew film');
 for (let i = 0; i < CHAPTERS.length; i++) {
  const c = CHAPTERS[i];
  if (i) assert.ok(c.start > CHAPTERS[i - 1].start, `${c.numeral} starts after ${CHAPTERS[i - 1].numeral}`);
  assert.ok(c.focus >= c.start && c.focus < chapterEnd(i), `${c.numeral} jump target stays inside the chapter`);
  assert.equal(chapterAt(c.focus), i);
  assert.equal(chapterLabel(i), `${c.numeral} / ${c.name}`);
 }
 assert.equal(chapterEnd(CHAPTERS.length - 1), TOTAL_TRAVEL + 2);
 assert.equal(chapterAt(0), 0); assert.equal(chapterAt(TOTAL_TRAVEL), CHAPTERS.length - 1);
});

test('segmented progress fills chapter by chapter and reverses', () => {
 const steps = Array.from({ length: 301 }, (_, i) => i / 300 * TOTAL_TRAVEL);
 let previous = chapterProgress(0);
 for (const world of steps) {
  const fills = chapterProgress(world);
  fills.forEach((f, i) => { assert.ok(f >= 0 && f <= 1); assert.ok(f >= previous[i] - 1e-12, 'fills only grow going forward'); if (i) assert.ok(f === 0 || fills[i - 1] === 1, 'a chapter fills only after the previous one is full'); });
  previous = fills;
 }
 assert.deepEqual(chapterProgress(TOTAL_TRAVEL), [1,1,1,1,1,0]);
 assert.deepEqual(chapterProgress(TOTAL_TRAVEL+2), CHAPTERS.map(() => 1));
 assert.deepEqual(chapterProgress(0), CHAPTERS.map(() => 0));
});

test('Belong is a normal-flow destination after the pin, and reversing gives identical states',()=>{
 assert.equal(CHAPTERS[5].destination,'belong');assert.ok(CHAPTERS[5].focus>TOTAL_TRAVEL);
 const positions=[0,10,TOTAL_TRAVEL,17,8,28,STORY_START];
 assert.deepEqual(positions.slice().reverse().map(chapterProgress).reverse(),positions.map(chapterProgress));
});
