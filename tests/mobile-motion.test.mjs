import test from 'node:test';
import assert from 'node:assert/strict';
import { settleProgress, shouldRefreshViewport, canvasPixelRatio, storyTravelUnit } from '../src/lib/mobile-motion.mjs';
import { dashboardBox } from '../src/lib/business-motion.mjs';
import { landingPoseAt } from '../src/lib/demand-motion.mjs';
import { cameraAt, PLANE } from '../src/lib/profile-motion.mjs';

test('mobile settling is refresh-rate independent and reaches exact endpoints',()=>{
 const simulate=(hz,target,start=0)=>{let p=start;for(let i=0;i<hz/10;i++)p=settleProgress(p,target,1000/hz);return p;};
 assert.ok(Math.abs(simulate(60,1)-simulate(120,1))<1e-12);
 assert.ok(simulate(60,1)>.94);
 assert.ok(Math.abs(settleProgress(0,1,160)-.99)<1e-12);
 let p=.5;for(let i=0;i<60;i++)p=settleProgress(p,1,1000/60);assert.equal(p,1);
 for(let i=0;i<60;i++)p=settleProgress(p,0,1000/60);assert.equal(p,0);
 assert.equal(settleProgress(.4,.4,16),.4);
});
test('mobile travel takes 20% less distance and leaves desktop unchanged',()=>{
 for(const [w,h] of [[375,667],[390,844],[430,932]])assert.equal(storyTravelUnit(w,h),h*.8);
 assert.equal(storyTravelUnit(1440,900),900);
});
test('toolbar and keyboard height changes preserve pin; width changes refresh',()=>{
 assert.equal(shouldRefreshViewport(390,844,390,760,true),false);
 assert.equal(shouldRefreshViewport(390,844,390,430,true),false);
 assert.equal(shouldRefreshViewport(844,390,844,320,true),false);
 assert.equal(shouldRefreshViewport(390,844,844,390,true),true);
 assert.equal(shouldRefreshViewport(1280,900,1280,700,false),true);
 assert.equal(canvasPixelRatio(390,3),1.5);
 assert.equal(canvasPixelRatio(1280,3),2);
});
test('phone reading states reserve margins and a separate purchase notification lane',()=>{
 for(const [w,h] of [[375,667],[390,844],[430,932]]){
  const panel=landingPoseAt(1,w,h),dashboard=dashboardBox(w,h);
  assert.ok(panel.x>=24&&panel.x+panel.width<=w-24);
  assert.ok(panel.y+panel.height<=h-128);
  assert.ok(dashboard.y+dashboard.h<=h-68);
  if(h<680)assert.ok(dashboard.h<=310);
  const profile=cameraAt(.72,w,h,{x:0,y:100,w:440,h:500});
  assert.ok(profile.x>=24);
  assert.ok(profile.x+PLANE.w*profile.scale<=w-24);
  assert.ok(profile.y+560*profile.scale<=h-110);
 }
});
