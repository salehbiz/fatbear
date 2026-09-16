import test from 'node:test';
import assert from 'node:assert/strict';
import { creator } from '../src/lib/creator.mjs';
import { OPENING_TRAVEL, SOCIAL_TRAVEL, TOTAL_TRAVEL, PASSES_END, AUDIENCE_END, DEMAND_TRAVEL, followerAt, digitPosition, postLikesAt, photoRectAt } from '../src/lib/profile-motion.mjs';
test('opening distance is preserved and the social chapter receives eight viewports',()=>{
 assert.equal(OPENING_TRAVEL,12*.425);assert.equal(SOCIAL_TRAVEL,8);assert.equal(AUDIENCE_END,13.1);assert.equal(PASSES_END,AUDIENCE_END+DEMAND_TRAVEL);
});
test('the self-running opening hands scroll over on the first film frame with the film travel intact',async()=>{
 const {INTRO_TRAVEL}=await import('../src/lib/profile-motion.mjs');
 const {EXPANSION_END,frameAt}=await import('../src/lib/math.mjs');
 assert.equal(INTRO_TRAVEL,12*EXPANSION_END);
 assert.equal(frameAt(INTRO_TRAVEL/12,169),0,'scroll position 0 is the first frame');
 assert.ok(frameAt(INTRO_TRAVEL/12+.01,169)>0,'the first scroll movement advances the film');
 assert.ok(Math.abs((OPENING_TRAVEL-INTRO_TRAVEL)-4.02)<1e-9,'the film keeps its 4.02 viewports of travel');
 assert.ok(TOTAL_TRAVEL-INTRO_TRAVEL>0);
});
test('followers and likes reach consistent endpoints without overshoot in either direction',()=>{
 const a=Array.from({length:1001},(_,i)=>followerAt(i/1000));
 assert.equal(a[0],284);assert.equal(a.at(-1),28684);assert.equal(a.at(-1)-a[0],creator.newFollowers);
 assert.ok(a.every((n,i)=>n>=284&&n<=28684&&(!i||n>=a[i-1])));
 assert.deepEqual(a.toReversed(),Array.from({length:1001},(_,i)=>followerAt((1000-i)/1000)));
 assert.equal(postLikesAt(0),creator.initialLikes);assert.equal(postLikesAt(1),creator.finalLikes);
 for(const n of [284,999,1000,9999,10000,28684])for(const place of [1,10,100,1000,10000])assert.equal(digitPosition(n,place),Math.floor(n/place)%10);
});
test('the persistent photograph lands exactly in the measured post and grid boxes',()=>{
 const post={x:0,y:150,w:340,h:405},tile={x:10,y:512,w:105,h:122};
 assert.deepEqual(photoRectAt(0,post,tile),post);assert.deepEqual(photoRectAt(.33,post,tile),post);assert.deepEqual(photoRectAt(.46,post,tile),tile);assert.deepEqual(photoRectAt(1,post,tile),tile);
 for(let i=0;i<=100;i++){const r=photoRectAt(i/100,post,tile);assert.ok(r.w>=tile.w&&r.w<=post.w&&r.h>=tile.h&&r.h<=post.h);}
});

test('the pupil opens onto a large post beside the copy, which settles without a full-bleed stage',async()=>{
 const {cameraAt,PLANE,ARRIVAL,ARRIVAL_MOBILE,STORY_START,STORY_LEAD,IRIS_START,IRIS_END}=await import('../src/lib/profile-motion.mjs');
 const {frameAt}=await import('../src/lib/math.mjs');
 assert.equal(STORY_START,OPENING_TRAVEL-STORY_LEAD);assert.ok(IRIS_START<OPENING_TRAVEL&&OPENING_TRAVEL<IRIS_END);
 assert.ok(frameAt(IRIS_START/12,169)>=156,'the hole starts after the pupil already fills the centre of the frame');
 assert.ok(ARRIVAL>.6&&ARRIVAL<ARRIVAL_MOBILE&&ARRIVAL_MOBILE<.95);
 const photo={x:0,y:136,w:440,h:530};
 for(const [w,h] of [[1440,900],[1024,768],[390,844]]){
  const start=cameraAt(0,w,h,photo),rest=cameraAt(.25,w,h,photo),full=Math.max(w/photo.w,h/photo.h);
  assert.ok(start.scale<full*.6&&start.scale>rest.scale*1.2,`${w}: arrival is neither full-bleed nor resting`);
  if(w>=768)assert.ok(start.x>w*.4&&start.x<w*.62,`${w}: the post arrives beside the copy`);
  assert.ok(start.x>=0&&start.x+PLANE.w*start.scale<=w,`${w}: the post arrives inside the viewport`);
  const settled=({x,y,scale})=>({x,y,scale});
  assert.deepEqual(settled(cameraAt(.25,w,h,photo)),settled(cameraAt(.3,w,h,photo)),`${w}: settled before the interactive hold`);
  let previous=start.scale;for(let i=1;i<=25;i++){const s=cameraAt(i/100,w,h,photo).scale;assert.ok(s<=previous+1e-9,`${w}: settle only shrinks`);previous=s;}
 }
});
test('the growth close-up keeps the chapter rail column clear on wide screens',async()=>{
 const {cameraAt,RAIL_CLEARANCE}=await import('../src/lib/profile-motion.mjs');
 const photo={x:0,y:136,w:440,h:530};
 for(const [w,h] of [[1500,1000],[1500,1200],[1600,900],[1920,1080],[2560,1440]])for(let i=62;i<=86;i++){
  const pose=cameraAt(i/100,w,h,photo);
  assert.ok(pose.x>=RAIL_CLEARANCE,`${w}x${h} at s=${i/100}: left edge ${pose.x.toFixed(1)}`);
 }
});
test('growth camera reserves margins for the complete profile header and never isolates the count',async()=>{
 const {cameraAt,PLANE}=await import('../src/lib/profile-motion.mjs');
 const photo={x:0,y:136,w:600,h:430};
 for(const [w,h] of [[1440,900],[1920,1080],[1280,720],[768,800],[390,844],[320,568]]){
  for(let i=61;i<=86;i++){
   const pose=cameraAt(i/100,w,h,photo);
   assert.ok(pose.x>=20,`${w}: left margin`);
   assert.ok(pose.x+PLANE.w*pose.scale<=w-20,`${w}: right margin`);
   assert.ok(pose.y>=(w<768?210:h*.12),`${w}: top breathing room`);
   assert.ok(pose.y+350*pose.scale<h-65,`${w}: lower breathing room`);
   assert.ok(Math.abs(pose.rotationY)<=8&&Math.abs(pose.rotationX)<=4&&Math.abs(pose.rotation)<=2);
   if(w>=768)assert.ok(350*pose.scale<=h*.440001);
  }
 }
});
test('scroll camera returns the same pose on reverse, resize-back, and repeated stops',async()=>{
 const {cameraAt}=await import('../src/lib/profile-motion.mjs');
 const photo={x:0,y:136,w:600,h:430};
 const path=Array.from({length:101},(_,i)=>cameraAt(i/100,1440,900,photo));
 assert.deepEqual(path.toReversed(),Array.from({length:101},(_,i)=>cameraAt((100-i)/100,1440,900,photo)));
 const stop=cameraAt(.72,1440,900,photo);
 cameraAt(.72,390,844,photo);
 assert.deepEqual(cameraAt(.72,1440,900,photo),stop);
 assert.notEqual(cameraAt(.62,1440,900,photo).rotationY,cameraAt(.86,1440,900,photo).rotationY);
});

test('the tall profile crosses the stage and returns along the same reversible camera path',async()=>{
 const {cameraAt,PLANE}=await import('../src/lib/profile-motion.mjs');
 const photo={x:0,y:136,w:440,h:530};
 const center=s=>{const p=cameraAt(s,1440,900,photo);return p.x+PLANE.w*p.scale/2;};
 assert.ok(PLANE.h/PLANE.w>1.8);
 assert.ok(center(.33)>1440*.65);
 assert.ok(center(.70)<1440*.35);
 assert.ok(center(1)>1440*.65);
 for(const boundary of [.40,.62,.88,.985]){
  const a=cameraAt(boundary-.00001,1440,900,photo),b=cameraAt(boundary+.00001,1440,900,photo);
  assert.ok(Math.abs(a.x-b.x)<.2&&Math.abs(a.y-b.y)<.2,'camera joins must not jump');
 }
});
