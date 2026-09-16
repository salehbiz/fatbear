import test from 'node:test';
import assert from 'node:assert/strict';
import { demandStateAt, conversationAt, landingPoseAt } from '../src/lib/demand-motion.mjs';
import { cameraAt, PLANE, OPENING_TRAVEL, SOCIAL_TRAVEL, AUDIENCE_END, DEMAND_TRAVEL, PASSES_END, TOTAL_TRAVEL, followerAt } from '../src/lib/profile-motion.mjs';
const post={x:0,y:136,w:440,h:530};
const link={x:15,y:280,w:161.65625,h:29.5};
const sizes=[[1440,900],[1920,1080],[1280,720],[390,844],[320,568],[768,900]];
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const state=(d,w=1440,h=900)=>demandStateAt(d,w,h,cameraAt(1,w,h,post),link);

test('the destination remains portrait, contained and reversible while its arrival keeps moving',()=>{
 for(const [w,h] of sizes){
  const samples=Array.from({length:101},(_,i)=>.86+i*.0014);
  const forward=samples.map(d=>landingPoseAt(d,w,h));
  assert.deepEqual(forward.toReversed(),samples.toReversed().map(d=>landingPoseAt(d,w,h)));
  for(const p of forward){
   assert.ok(p.width/p.height<=.591);assert.ok(p.width<=420);
   assert.ok(p.x>=24&&p.x+p.width<=w-24);
   assert.ok(p.y>=70&&p.y+p.height<=h-60);
  }
  const end=landingPoseAt(1,w,h);near(end.x+end.width/2,w/2);
  if(w<768){near(end.y,78);assert.ok(end.y+end.height<=h-128);}else near(end.y+end.height/2,h/2);
  near(end.scale,1);
  assert.equal(landingPoseAt(.97,w,h).rotationY,0,'sheet stays aligned until fully raised');
  assert.notEqual(landingPoseAt(.98,w,h).rotationY,landingPoseAt(1,w,h).rotationY);
  assert.notEqual(landingPoseAt(.98,w,h).photoY,landingPoseAt(1,w,h).photoY);
 }
});

test('the continuation starts exactly at the existing camera without compressing earlier travel',()=>{
 near(OPENING_TRAVEL,5.1);near(SOCIAL_TRAVEL,8);near(AUDIENCE_END,13.1);near(PASSES_END-AUDIENCE_END,DEMAND_TRAVEL);
 for(const [w,h] of sizes){
  const original=cameraAt(1,w,h,post),next=state(0,w,h);
  for(const key of ['x','y','scale','rotation','rotationX','rotationY'])near(next.camera[key],original[key]);
  near(next.profileX,0);assert.equal(next.inboxX,PLANE.w);assert.equal(next.reveal,0);assert.equal(next.instagramOpacity,1);
 }
 assert.equal(followerAt(1),28684);
});

test('inbox pages slide in opposite directions and return to the same profile',()=>{
 assert.equal(state(.24).slide,1);assert.equal(state(.48).slide,1);assert.equal(state(.60).slide,0);
 for(let i=0;i<=100;i++){
  const s=state(i/100);near(s.inboxX-s.profileX,PLANE.w);
  assert.ok(s.profileX>=-PLANE.w && s.profileX<=0);assert.ok(s.inboxX>=0 && s.inboxX<=PLANE.w);
 }
});

test('the bio link stays complete and right-weighted throughout approach, press and release',()=>{
 for(const [w,h] of sizes)for(const d of [.75,.80,.835]){
  const s=state(d,w,h),p=s.camera;
  const left=p.x+link.x*p.scale,right=left+link.w*p.scale,top=p.y+link.y*p.scale;
  assert.ok(left>=31.9 && right<=w-31.9);
  assert.ok(top>h*.35 && top+link.h*p.scale<h*.57);
  near((left+right)/2,w*(w<=768?.5:.62));near(p.rotationX,0);near(p.rotationY,0);
  if(d>=.815)assert.ok(s.cursorX>=left&&s.cursorX<=right&&s.cursorY>=top&&s.cursorY<=top+link.h*p.scale);
 }
 assert.equal(state(.835).press,1);assert.equal(state(.86).press,0);
});

test('the browser sheet waits for the pullback and loads before the source disappears',()=>{
 for(const [w,h] of sizes){
  const close=state(.84,w,h),returned=state(.915,w,h),opening=state(.95,w,h),ready=state(1,w,h);
  assert.ok(returned.camera.scale<close.camera.scale);
  assert.equal(returned.reveal,0);
  assert.ok(returned.camera.x>=24);
  assert.ok(returned.camera.y+PLANE.h*returned.camera.scale<=h-60);
  assert.ok(opening.reveal>0&&opening.reveal<1);
  assert.equal(opening.instagramOpacity,1);
  assert.ok(opening.loading>0&&opening.loading<1);
  assert.equal(ready.loading,1);assert.equal(ready.loadingOpacity,0);
  assert.equal(ready.landingContent,1);
 }
});

test('messages reveal progressively and the reading interval continues moving',()=>{
 for(let row=0;row<8;row++){
  assert.equal(conversationAt(0,row).opacity,0);assert.equal(conversationAt(.48,row).opacity,1);
  assert.ok(conversationAt(.28,row).opacity>=conversationAt(.28,row+1).opacity);
 }
 for(const d of [.30,.33,.36,.40,.44]){
  const a=state(d),b=state(d+.01);
  assert.notEqual(a.rowsY,b.rowsY);assert.notDeepEqual(a.camera,b.camera);
 }
});

test('short phones enlarge the inbox while keeping the complete panel in the viewport',()=>{
 const s=state(.35,320,568),p=s.camera;
 assert.equal(s.panelHeight,620);
 assert.ok(p.scale*27>=16,'key requests must stay readable');
 assert.ok(p.x>=20 && p.x+PLANE.w*p.scale<=300);
 assert.ok(p.y>=65 && p.y+(s.panelHeight+64)*p.scale<=503);
 assert.equal(state(.60,320,568).panelHeight,PLANE.h,'return restores the original profile');
});

test('reverse scrolling, fast jumps and resize-back produce the same state with no blank handoff',()=>{
 for(const [w,h] of sizes){
  const steps=Array.from({length:201},(_,i)=>i/200),forward=steps.map(d=>state(d,w,h));
  assert.deepEqual(forward.toReversed(),steps.toReversed().map(d=>state(d,w,h)));
  for(const d of [1,.32,.86,0,.60,.98,.835]){
   const before=state(d,w,h);state(d,390,844);assert.deepEqual(state(d,w,h),before);
   assert.ok(before.instagramOpacity>0||before.reveal===1,'the source must remain until the destination covers it');
  }
 }
 const end=state(1);assert.equal(end.reveal,1);assert.equal(end.instagramOpacity,0);assert.equal(end.cursorOpacity,0);assert.equal(end.landingContent,1);assert.equal(end.landingY,0);
});
