import test from 'node:test';
import assert from 'node:assert/strict';
import { crewAnchor } from '../src/lib/crew-tracking.mjs';
test('crew anchors match marked tables and account for cover cropping',()=>{
 const native={x:0,y:0,w:1280,h:720};
 assert.deepEqual(crewAnchor(200,0,native),{x:535,y:470,opacity:1});
 assert.deepEqual(crewAnchor(200,2,native),{x:527,y:552,opacity:1});
 const rect={x:20,y:30,w:360,h:720};
 assert.equal(crewAnchor(200,0,rect).x,95);
 assert.equal(crewAnchor(200,0,rect).y,500);
 assert.equal(crewAnchor(100,2,native).opacity,0);
});
test('tracking is deterministic across jumps, reverse and resize',()=>{
 const rect={x:0,y:0,w:1920,h:1080};
 for(const i of [0,1,2])for(const frame of [50,100,125,150,190,200,251]){
  const expected=crewAnchor(frame,i,rect);
  crewAnchor(251,i,{x:0,y:0,w:390,h:844});
  assert.deepEqual(crewAnchor(frame,i,rect),expected);
  assert.ok(Number.isFinite(expected.x)&&Number.isFinite(expected.y));
 }
});
