import test from 'node:test';
import assert from 'node:assert/strict';
import { photoTransforms, createPhotoMotion } from '../src/lib/photo-motion.mjs';
import { photoRectAt } from '../src/lib/profile-motion.mjs';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} must equal ${b}`);
const image={w:1280,h:720};
const post={x:0,y:136,w:440,h:530};
const tile={x:9,y:480,w:138.6666667,h:188.5};

test('fixed photo layers cover every crop without stretching or exposed edges, forwards and backwards',()=>{
 for(const base of [post,{x:0,y:136,w:440,h:407}]){
  const steps=Array.from({length:101},(_,i)=>i/100);
  for(const s of [...steps,...steps.toReversed()]){
   const rect=photoRectAt(s,base,tile),pose=photoTransforms(rect,base,image);
   near(base.w*pose.frame.sx,rect.w);near(base.h*pose.frame.sy,rect.h);
   near(pose.frame.x,rect.x);near(pose.frame.y,rect.y);
   const sx=pose.frame.sx*pose.image.sx,sy=pose.frame.sy*pose.image.sy;
   near(sx,sy); // The clipping box changes aspect ratio; the photograph never does.
   const x=pose.image.x*pose.frame.sx,y=pose.image.y*pose.frame.sy;
   assert.ok(x<=1e-8 && y<=1e-8);
   assert.ok(x+image.w*sx>=rect.w-1e-8 && y+image.h*sy>=rect.h-1e-8);
   near(x,(rect.w-image.w*sx)*.5);near(y,(rect.h-image.h*sy)*.4);
  }
 }
});

test('scrolling writes only transforms; holding the crop writes no photo styles',()=>{
 const writes=[];
 const element=name=>({style:new Proxy({},{set(target,key,value){writes.push({name,key,value});target[key]=value;return true;}})});
 const frame=element('frame'),photo=element('photo'),motion=createPhotoMotion(frame,photo);
 motion.measure(post);motion.render(post);writes.length=0;
 for(let i=0;i<100;i++)motion.render(photoRectAt(.255+i*.0005,post,tile));
 assert.equal(writes.length,0,'camera movement during the post hold must leave the photograph untouched');
 for(const s of [.34,.37,.4,.43,.46,.4,.34,.33])motion.render(photoRectAt(s,post,tile));
 assert.ok(writes.length>0);assert.ok(writes.every(write=>write.key==='transform'));
 motion.render(tile);writes.length=0;
 for(let i=0;i<100;i++)motion.render(photoRectAt(.5+i*.004,post,tile));
 assert.equal(writes.length,0,'the grid hold must leave the photograph untouched');
});

test('resizing invalidates the crop once and replay restores the exact original transform',()=>{
 const frame={style:{}},photo={style:{}},motion=createPhotoMotion(frame,photo);
 motion.measure(post);motion.render(post);
 const original={frame:{...frame.style},photo:{...photo.style}};
 motion.render(tile);
 const resized={...post,h:407};motion.measure(resized);motion.render(photoRectAt(.40,resized,tile));
 motion.measure(post);motion.render(post);
 assert.deepEqual({frame:frame.style,photo:photo.style},original);
});
