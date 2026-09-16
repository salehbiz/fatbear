import gsap from 'gsap';
import { mix, range, smooth } from './math.mjs';
import { creator } from './creator.mjs';
import { profileProgress, followerAt, postLikesAt, photoRectAt, cameraAt, fittedScale } from './profile-motion.mjs';
import { chapterAt, chapterLabel, chapterProgress } from './chapters.mjs';
import { createPhotoMotion } from './photo-motion.mjs';
import { centeredProfile, demandStateAt } from './demand-motion.mjs';
import { createDemandMotion } from './demand';
import { createBusinessMotion } from './business';
import { DRIFT, copyDrift, lineSlide, flipFade, bloomAt, bloomFilter } from './depth.mjs';

type Box = {x:number;y:number;w:number;h:number};
export function createStoryMotion(root:HTMLElement){
 const get=(s:string)=>root.querySelector<HTMLElement>(s)!;
 const story=get('.social-story'),plane=get('.social-plane'),post=get('.post-layer'),profile=get('.profile-layer'),photo=get('.featured-photo');
 const photoMotion=createPhotoMotion(get('.featured-frame'),photo);
 const demandMotion=createDemandMotion(root),nav=get('.social-plane > .profile-nav');
 const businessMotion=createBusinessMotion(root);
 const counter=get('.follower-counter'),readable=get('.counter-readable'),growth=get('.growth-note'),likes=get('.live-likes');
 const reactionLikes=get('.reaction-likes'),reactionFollowers=get('.reaction-followers');
 const chapter=get('.story-chapter'),field=get('.field-lines'),orbit=get('.field-orbit'),shadow=get('.scene-shadow');
 const segments=[...root.querySelectorAll<HTMLElement>('.story-progress>span')];
 const digits=[...root.querySelectorAll<HTMLElement>('.digit-group')];
 const cards=[get('.reaction-follow'),get('.reaction-like')];
 const copies=[get('.copy-world'),get('.copy-attention'),get('.copy-outcome'),get('.copy-unlock')];
 const lines=copies.map(el=>[...el.querySelectorAll<HTMLElement>('h2>span')]);
 const tiles=[...root.querySelectorAll<HTMLElement>('.profile-grid>img')];
 const rollers=digits.map(group=>gsap.quickTo(group.querySelector('.digit-strip'),'y',{duration:.14,ease:'power2.out'}));
 let postBox:Box={x:0,y:136,w:600,h:430},tileBox:Box={x:12,y:426,w:190,h:138},lastCount=-1,lastLikes=-1;
 let linkBox:Box={x:18,y:260,w:170,h:30};
 function localBox(el:HTMLElement):Box{
  let x=0,y=0,node:HTMLElement|null=el;
  while(node&&node!==plane){x+=node.offsetLeft;y+=node.offsetTop;node=node.offsetParent as HTMLElement|null;}
  const style=getComputedStyle(el);
  return {x,y,w:parseFloat(style.width),h:parseFloat(style.height)};
 }
 function attribute(el:HTMLElement,name:string,value:string){if(el.getAttribute(name)!==value)el.setAttribute(name,value);}
 function style(el:HTMLElement,name:'opacity'|'visibility'|'transform'|'filter',value:string){if(el.style[name]!==value)el.style[name]=value;}
 function opacity(el:HTMLElement,value:number){
  style(el,'opacity',String(value));
  // Inherit the chapter's visibility so replay cannot reveal inactive descendants.
  style(el,'visibility',value===0?'hidden':'inherit');
 }
 function copy(index:number,enter:number,exit:number,offset:number,mobile:boolean){
  const el=copies[index],value=enter*(1-exit);
  opacity(el,value);style(el,'transform',`translate3d(0, ${offset}px, 0)`);attribute(el,'aria-hidden',String(value<.5));
  lines[index].forEach((line,i)=>{const flip=flipFade(enter,i,mobile);style(line,'opacity',String(flip.opacity));style(line,'transform',`translate3d(${lineSlide(enter,i,mobile)}px, ${flip.y}px, 0) rotateX(${flip.rotationX}deg)`);});
 }
 return {
  measure(){
   const tap=Math.ceil(47/(fittedScale(innerWidth,innerHeight)*1.05));
   story.style.setProperty('--social-tap-size',`${Math.max(48,tap)}px`);
   story.style.setProperty('--post-action-height',`${Math.max(144,tap+68)}px`);
   story.style.setProperty('--bio-hit-size',`${Math.ceil(48/centeredProfile(innerWidth,innerHeight).scale)}px`);
   postBox=localBox(get('.post-photograph'));tileBox=localBox(get('.featured-target'));
   linkBox=localBox(get('.bio-link-label'));
   photoMotion.measure(postBox);
   businessMotion.measure(innerWidth,innerHeight);
  },
  render(s:number,w:number,h:number,visible=true,d=0,b=0,world=0){
   style(story,'visibility',visible?'visible':'hidden');if(story.inert===visible)story.inert=!visible;attribute(story,'aria-hidden',String(!visible));
   if(!visible){businessMotion.render(0,w,h,false);return;}
   const mobile=w<768,morph=profileProgress(s),basePose=cameraAt(s,w,h,postBox);
   const demand=demandStateAt(d,w,h,basePose,linkBox),pose=demand.camera;
   // One compositor transform owns the camera; no repeated tween allocation or layout writes.
   style(plane,'transform',`perspective(1800px) translate3d(${pose.x}px, ${pose.y}px, 0px) rotate(${pose.rotation}deg) rotateY(${pose.rotationY}deg) rotateX(${pose.rotationX}deg) scale(${pose.scale})`);
   const postOpacity=1-smooth(range(morph,0,.30)),profileOpacity=smooth(range(morph,.32,.84));
   opacity(post,postOpacity);opacity(profile,profileOpacity);
   opacity(plane,demand.instagramOpacity);opacity(nav,profileOpacity);
   // Grid tiles bloom in around the arriving photograph; each tile's filter is gone once it settles.
   tiles.forEach((tile,i)=>{const b=bloomAt(range(morph,.45,1),i,tiles.length);style(tile,'transform',`scale(${b.scale})`);style(tile,'filter',bloomFilter(b));style(tile,'opacity',String(b.enter));});
   const interactive=s>=.255&&s<=.33;if(post.inert===interactive)post.inert=!interactive;attribute(post,'aria-hidden',String(!interactive));attribute(profile,'aria-hidden',String(morph<.8||demand.slide>.2||d>.94));
   // A single opaque photograph moves through measured boxes; it never crossfades or swaps.
   photoMotion.render(photoRectAt(s,postBox,tileBox));
   const count=followerAt(s);
   if(count!==lastCount){
    const text=count.toLocaleString('en-US');counter.setAttribute('aria-label',`${text} followers`);readable.textContent=text;
    digits.forEach((group,i)=>{
     const place=Number(group.dataset.place),show=count>=place||place===1;
     style(group.querySelector<HTMLElement>('.digit-window')!,'opacity',show?'1':'0');
     const comma=group.querySelector<HTMLElement>('.digit-comma');if(comma)style(comma,'opacity',count>=1000?'1':'0');
     const target=-(Math.floor(count/place)%10)*42;
     if(lastCount<0||s<=.62||s>=.86){rollers[i].tween.pause();gsap.set(group.querySelector('.digit-strip'),{y:target});}else rollers[i](target);
    });
    growth.textContent=`+${(count-creator.initialFollowers).toLocaleString('en-US')} new`;
    reactionFollowers.textContent=`${(count-creator.initialFollowers).toLocaleString('en-US')} new connections`;
    lastCount=count;
   }
   opacity(growth,smooth(range(s,.62,.67)));
   const likeCount=postLikesAt(s);if(likeCount!==lastLikes){likes.dataset.base=String(likeCount);likes.textContent=(likeCount+Number(likes.dataset.liked||0)).toLocaleString('en-US');reactionLikes.textContent=likeCount.toLocaleString('en-US');lastLikes=likeCount;}
   const worldIn=smooth(range(s,.03,.16)),worldOut=smooth(range(s,.38,.44)),toAttention=smooth(range(s,.57,.635)),toOutcome=smooth(range(s,.94,.985));
   const attentionOut=smooth(range(s,.87,.91));
   // Copy drifts against the camera for as long as it is on stage; lines slide in only while entering.
   copy(0,worldIn,worldOut,24*(1-worldIn)-18*worldOut+copyDrift(range(s,.03,.44),DRIFT.copy,mobile),mobile);
   copy(1,toAttention,attentionOut,20*(1-toAttention)-18*attentionOut+copyDrift(range(s,.57,.91),DRIFT.copy,mobile),mobile);
   copy(2,toOutcome,1-demand.outcomeOpacity,22*(1-toOutcome)-22*(1-demand.outcomeOpacity)+copyDrift(s<1?range(s,.94,1)*.6:.6+range(d,0,.105)*.4,DRIFT.copy,mobile),mobile);
   copy(3,smooth(range(d,.53,.59)),smooth(range(d,.78,.85)),copyDrift(range(d,.53,.85),DRIFT.copy,mobile),mobile);
   gsap.set(root.querySelectorAll('.story-masthead,.story-footer'),{opacity:worldIn});
   gsap.set(field,{x:mix(26,-30,s)-d*22,y:mix(18,-16,s)+d*12});
   gsap.set(orbit,{x:mix(65,-90,s)-d*65,y:mix(-20,30,s)-d*20});
   gsap.set(shadow,{x:pose.x+220*pose.scale-190,y:h*.85,scaleX:pose.scale,scaleY:mix(.7,1.4,basePose.focus),opacity:worldIn*(1-basePose.focus*.8)*demand.instagramOpacity*(1-demand.linkEmphasis*.9)});
   cards.forEach((card,i)=>{
    const enter=smooth(range(s,.65+i*.075,.7+i*.075)),out=smooth(range(s,.865,.915));
    const scale=mobile?.72:.9;
    // Quiet lower margin; notifications never cross the profile header or the copy.
    const cx=mobile?w*.5-268*scale*.5:w*(i===0?.57:.70);
    const cy=mobile?h-116:h*(i===0?.70:.82);
    const drift=copyDrift(range(s,.65,.915),DRIFT.card,mobile);
    gsap.set(card,{x:cx,y:cy+(1-enter)*20-out*25+drift,scale,rotation:i===0?-2:2,opacity:enter*(1-out)*(mobile&&i===1?0:1)});
   });
   demandMotion.render(d,w,h,demand);
   const current=chapterAt(world),label=chapterLabel(current);
   story.dataset.chapter=String(current);
   if(chapter.textContent!==label)chapter.textContent=label;
   businessMotion.render(b,w,h,b>0,d>.93);
   chapterProgress(world).forEach((fill,i)=>{const value=fill.toFixed(4);const segment=segments[i];if(segment&&segment.style.getPropertyValue('--fill')!==value)segment.style.setProperty('--fill',value);});
   attribute(story,'data-focus',String(basePose.focus>.001&&d===0));attribute(story,'data-social-progress',s.toFixed(4));attribute(story,'data-followers',String(count));attribute(story,'data-morph',morph.toFixed(4));attribute(story,'data-demand-progress',d.toFixed(4));
  },
  // Where the featured photograph's subject sits at the reveal (object-position 50% 40%), in viewport pixels.
  arrivalFocus(w:number,h:number){
   const pose=cameraAt(0,w,h,postBox);
   return {x:pose.x+(postBox.x+postBox.w*.5)*pose.scale,y:pose.y+(postBox.y+postBox.h*.4)*pose.scale};
  },
  destroy(){rollers.forEach(roll=>roll.tween.kill());businessMotion.destroy();},
 };
}
