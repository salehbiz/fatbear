import test from 'node:test';
import assert from 'node:assert/strict';
import { businessMetricsAt, businessStateAt, businessToastAt, dashboardBox, filmBoxAt } from '../src/lib/business-motion.mjs';
import { PASSES_END, BUSINESS_TRAVEL, TOTAL_TRAVEL } from '../src/lib/profile-motion.mjs';
const sizes=[[1440,900],[1280,720],[1920,1080],[768,800],[390,844],[320,568]];

test('business retains nine viewports after the extended Passes transition',()=>{
 assert.equal(PASSES_END,23.7);assert.equal(BUSINESS_TRAVEL,9);assert.equal(TOTAL_TRAVEL,32.7);
});
test('every earnings value reconciles with purchases and subscriptions, including the first sale',()=>{
 assert.equal(businessMetricsAt(0).earnings,0);assert.equal(businessMetricsAt(.06).earnings,40);
 let previous=0;
 for(let i=0;i<=1000;i++){
  const m=businessMetricsAt(i/1000);
  assert.equal(m.earnings,m.subscribers*25+m.purchases*40);
  assert.ok(m.earnings>=previous&&m.earnings<=80000);previous=m.earnings;
 }
 assert.deepEqual(businessMetricsAt(1),{subscribers:2000,purchases:750,subscriptionsRevenue:50000,purchasesRevenue:30000,earnings:80000});
});
test('canvas rect hits its photograph, full-screen and dashboard targets without changing aspect via image stretching',()=>{
 const start={x:550,y:150,w:380,h:240},end={x:1130,y:250,w:128,h:70};
 for(const [w,h] of sizes){
  assert.deepEqual(filmBoxAt(businessStateAt(0,w,h),start,end,w,h),start);
  assert.deepEqual(filmBoxAt(businessStateAt(.4,w,h),start,end,w,h),{x:0,y:0,w,h});
  assert.deepEqual(filmBoxAt(businessStateAt(.62,w,h),start,end,w,h),end);
  const b=dashboardBox(w,h);assert.ok(b.x>=20&&b.x+b.w<=w-20);assert.ok(b.y>=160&&b.y+b.h<=h-65);
 }
});
test('film scrubbing excludes the source Instagram insert and has exact endpoints',()=>{
 assert.equal(businessStateAt(.25,1440,900).frame,0);assert.equal(businessStateAt(.51,1440,900).frame,251);
 for(let i=0;i<=1000;i++)assert.ok(businessStateAt(i/1000,1440,900).frame>=0&&businessStateAt(i/1000,1440,900).frame<=251);
});
test('all business states reverse deterministically, survive jumps and finish without notifications',()=>{
 for(const [w,h] of sizes){
  const steps=Array.from({length:101},(_,i)=>i/100),forward=steps.map(p=>businessStateAt(p,w,h));
  assert.deepEqual(forward.toReversed(),steps.toReversed().map(p=>businessStateAt(p,w,h)));
  for(const p of [.15,.37,.59,.79,1,0]){const before=businessStateAt(p,w,h);businessStateAt(p,320,568);assert.deepEqual(businessStateAt(p,w,h),before);}
 }
 for(let i=0;i<4;i++)assert.equal(businessToastAt(1,i).opacity,0);
 const end=businessStateAt(1,1440,900);assert.equal(end.metrics.earnings,80000);assert.equal(end.dashboardOpacity,1);assert.equal(end.copyEnd,1);assert.equal(end.passesOpacity,0);
});
