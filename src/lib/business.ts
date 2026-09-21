import { crewAnchor } from './crew-tracking.mjs';
import { syncBusinessMetrics } from './business-metrics-view.mjs';
import { FrameCache } from './FrameCache';
import { getFrameTier } from './frameTier';
import { media } from './media';
import { createPhotoMotion } from './photo-motion.mjs';
import { landingPoseAt } from './demand-motion.mjs';
import { businessStateAt, businessToastAt, dashboardBox, filmBoxAt, BUSINESS_LAST_FRAME, BUSINESS_COPY } from './business-motion.mjs';
import { mix, range, smooth } from './math.mjs';
import { DRIFT, copyDrift, lineSlide, flipFade, bloomAt, bloomFrom, bloomFilter } from './depth.mjs';

export function createBusinessMotion(root:HTMLElement){
 const get=(s:string)=>root.querySelector<HTMLElement>(s)!;
 const section=get('.business-story'),paper=get('.business-paper'),passes=get('.passes-page'),dashboard=get('.business-dashboard');
 const film=get('.business-film'),image=get('.business-film-image'),poster=image.querySelector<HTMLImageElement>('img')!,canvas=image.querySelector<HTMLCanvasElement>('canvas')!,ctx=canvas.getContext('2d',{alpha:false})!;
 const photo=createPhotoMotion(film,image),earnings=get('.business-earnings');
 const purchases=[...root.querySelectorAll<HTMLElement>('.purchase-notification')];
 const crewRoles=[...root.querySelectorAll<HTMLElement>('.crew-role')];
 const copies=['.business-film-copy','.business-copy-one','.business-copy-two','.business-copy-end'].map(get);
 const toasts=[...root.querySelectorAll<HTMLElement>('.business-toast')],transactions=[...root.querySelectorAll<HTMLElement>('.business-transaction')];
 const lines=copies.map(el=>[...el.querySelectorAll<HTMLElement>('h2>span')]),stats=[...root.querySelectorAll<HTMLElement>('.business-stats>div')];
 let viewport={w:innerWidth,h:innerHeight};
 let start={x:0,y:0,w:320,h:180},end={...start},box=dashboardBox(innerWidth,innerHeight),current=0,active=false,drawn=-1,disposed=false;
 const tier = getFrameTier();
 const crewDir = tier === '4k' ? 'crew-4k' : tier === 'mobile' ? 'crew-mobile' : 'crew-webp';
 const cache=new FrameCache(
  BUSINESS_LAST_FRAME,
  tier === '4k' ? 28 : tier === 'mobile' ? 50 : 40,
  draw,
  n=>`business/${crewDir}/${String(n+1).padStart(4,'0')}.webp`,
  n=>`business/crew-preview/${String(n+1).padStart(4,'0')}.webp`
 );
 function style(el:HTMLElement,key:'transform'|'opacity'|'visibility'|'filter',value:string){if(el.style[key]!==value)el.style[key]=value;}
 function alpha(el:HTMLElement,n:number){style(el,'opacity',String(n));style(el,'visibility',n===0?'hidden':'inherit');}
 function local(el:HTMLElement,parent:HTMLElement){
  let x=0,y=0,node:HTMLElement|null=el;
  while(node&&node!==parent){x+=node.offsetLeft;y+=node.offsetTop;const next=node.offsetParent as HTMLElement|null;if(next){x+=next.clientLeft;y+=next.clientTop;}node=next;}
  const css=getComputedStyle(el);return {x,y,w:parseFloat(css.width),h:parseFloat(css.height)};
 }
 function renderCrew(frame:number){
  const {w,h}=viewport,s=businessStateAt(current,w,h),rect=filmBoxAt(s,start,end,w,h);
  crewRoles.forEach((el,i)=>{
   const anchor=crewAnchor(frame,i,rect),mobile=w<768;
   const scale=mix(1,mobile?.86:.68,smooth(range(frame,80,251)));
   const width=el.offsetWidth*scale,height=el.offsetHeight*scale;
   const dx=mobile?(i===1?24:-width-18):(i===1?70*scale:-width-50*scale);
   const dy=(i===2?30:-48)*scale;
   const x=Math.max(16,Math.min(w-width-16,anchor.x+dx));
   const y=Math.max(mobile?240:300,Math.min(h-height-65,anchor.y+dy));
   const onScreen=anchor.x>16&&anchor.x<w-16&&anchor.y>100&&anchor.y<h-60;
   const opacity=onScreen?anchor.opacity*(1-smooth(range(current,.48,.51))):0;
   alpha(el,opacity);el.setAttribute('aria-hidden',String(opacity<.5));
   style(el,'transform',`translate3d(${x}px,${y}px,0) scale(${scale})`);
   const connector=el.querySelector<HTMLElement>('.crew-connector')!;
   const sx=anchor.x>x+width/2?width:0,sy=height/2;
   const vx=anchor.x-x-sx,vy=anchor.y-y-sy;
   connector.style.left=`${sx/scale}px`;connector.style.top=`${sy/scale}px`;
   connector.style.width=`${Math.hypot(vx,vy)/scale}px`;
   connector.style.transform=`rotate(${Math.atan2(vy,vx)}rad)`;
  });
 }
 function draw(){
  if(disposed||!active||current>=.63)return;
  const frame=cache.nearest();if(!frame)return;
  if(current>=.51&&frame.index!==BUSINESS_LAST_FRAME){canvas.style.opacity='0';return;}
  if(drawn!==frame.index){
   canvas.width=frame.image.width;canvas.height=frame.image.height;
   ctx.drawImage(frame.image,0,0);drawn=frame.index;
  }
  canvas.style.opacity='1';section.dataset.frame=String(frame.index);renderCrew(frame.index);
 }
 return {
  measure(w:number,h:number){
   box=dashboardBox(w,h);dashboard.style.width=`${box.w}px`;dashboard.style.height=`${box.h}px`;
   const pass=landingPoseAt(1,w,h);passes.style.width=`${pass.width}px`;passes.style.height=`${pass.height}px`;
   const cover=local(get('.passes-cover'),passes),preview=local(get('.business-preview'),dashboard);
   start={x:pass.x+cover.x,y:pass.y+cover.y,w:cover.w,h:cover.h};
   end={x:box.x+preview.x,y:box.y+preview.y,w:preview.w,h:preview.h};
   photo.measure({w,h});cache.setLimit(tier==='4k'?28:tier==='mobile'?50:40);
  },
  render(p:number,w:number,h:number,visible:boolean,warm=false){
   current=p;active=visible;viewport={w,h};
   style(section,'visibility',visible?'visible':'hidden');section.inert=!visible;section.setAttribute('aria-hidden',String(!visible));
   if(!visible){alpha(passes,1);passes.inert=false;if(warm){cache.request(0);}else cache.pause();return;}
   const s=businessStateAt(p,w,h),mobile=w<768;
   section.dataset.businessProgress=p.toFixed(4);section.dataset.earnings=String(s.metrics.earnings);
   alpha(paper,s.paper);alpha(passes,s.passesOpacity);passes.inert=p>.125;
   style(get('.business-paper .field-lines'),'transform',`translate3d(${-p*32}px,${p*16}px,0)`);
   style(get('.business-paper .field-orbit'),'transform',`translate3d(${-p*78}px,${-p*20}px,0)`);
   const lp=landingPoseAt(1,w,h),unwind=1-smooth(range(p,.02,.125));
   style(passes,'transform',`translate3d(${lp.x}px,${lp.y}px,0) perspective(1800px) rotateY(${lp.rotationY*unwind}deg) rotate(${lp.rotation*unwind}deg)`);
   purchases.forEach((card,i)=>{
    const enter=smooth(range(p,.012+i*.014,.038+i*.014)),leave=smooth(range(p,.128,.155));
    const compact=w<900,shown=mobile?i<2:!compact||i<3;
    const width=mobile?Math.min(290,w-48):compact?Math.min(218,w*.55):Math.min(290,(w-lp.width)/2-100);
    const left=i%2===0;
    const offsets=[.23,.34,.48,.61,.72,.19];
    const x=mobile?(w-width)/2:compact?(left?16:w-width-16):(left?lp.x-width-32-(i===2?16:0):lp.x+lp.width+32+(i===3?14:0));
    const y=mobile?h-112:h*(compact?[.19,.72,.43][i%3]:offsets[i]);
    card.style.width=`${width}px`;
    const mobileEnter=smooth(range(p,.012+i*.065,.028+i*.065));
    const mobileLeave=smooth(range(p,.062+i*.065,.077+i*.065));
    alpha(card,shown?(mobile?mobileEnter*(1-mobileLeave):enter*(1-leave)):0);
    style(card,'transform',`translate3d(${x+(left?-1:1)*18*(1-enter)}px,${y+24*(1-enter)-leave*18-8*range(p,.04,.155)}px,0) rotate(${compact?0:[-1.8,1.2,.8,-1.1,-.5,1.7][i]}deg) scale(${.96+.04*enter})`);
   });
   alpha(film,s.filmOpacity*(1-smooth(range(p,.62,.64))));film.style.borderRadius=`${mix(mix(13,0,s.expand),9,s.retreat)}px`;
   // The same canvas expands into the film and lands inside the dashboard preview.
   photo.render(filmBoxAt(s,start,end,w,h));
   const posterSource=media(`business/${p>=.51?'end':'crew-poster'}.webp`);if(poster.getAttribute('src')!==posterSource)poster.src=posterSource;
   if(p>=.63){cache.release();canvas.style.opacity='0';drawn=-1;}
   else {cache.request(s.frame);draw();}
   alpha(dashboard,s.dashboardOpacity);
   const pose=s.camera;
   // Align the preview exactly during the film landing; start the slight drift afterwards.
   const settled=smooth(range(p,.62,.67));
   style(dashboard,'transform',`translate3d(${box.x}px,${box.y+pose.y*settled}px,0) perspective(1800px) rotateY(${pose.rotationY*settled}deg) rotate(${pose.rotation*settled}deg) scale(${1+(pose.scale-1)*settled})`);
   copies.forEach((el,i)=>{
    const enter=s.copyIn[i],a=enter*(1-s.copyOut[i]),[from,,,to]=BUSINESS_COPY[i];
    alpha(el,a);style(el,'transform',`translate3d(0,${(1-a)*12+copyDrift(range(p,from,Math.min(1,to)),DRIFT.business,mobile)}px,0)`);el.setAttribute('aria-hidden',String(a<.5));
    lines[i].forEach((line,j)=>{const flip=flipFade(enter,j,mobile);style(line,'opacity',String(flip.opacity));style(line,'transform',`translate3d(${lineSlide(enter,j,mobile)}px,${flip.y}px,0) rotateX(${flip.rotationX}deg)`);});
   });
   renderCrew(p>=.51?BUSINESS_LAST_FRAME:Math.max(0,drawn));
   syncBusinessMetrics(section,s.metrics,p>.61&&p<.86);
   style(earnings,'transform',`scale(${1+s.earningsFocus*(mobile?.035:.065)})`);
   stats.forEach((el,i)=>{const b=bloomAt(range(p,.525,.66),i,stats.length,.86);style(el,'transform',`scale(${b.scale})`);style(el,'filter',bloomFilter(b));style(el,'opacity',String(b.enter));});
   transactions.forEach((el,i)=>{const b=bloomFrom(smooth(range(p,.59+i*.018,.62+i*.018)),.88);alpha(el,b.enter);style(el,'transform',`scale(${b.scale})`);style(el,'filter',bloomFilter(b));});
   toasts.forEach((el,i)=>{const n=businessToastAt(p,i),show=mobile&&i!==0&&i!==2?0:n.opacity;alpha(el,show);const x=mobile?(w-250)/2:(i%2===0?box.x+box.w-265:box.x+box.w-320),y=mobile?box.y+box.h-35:box.y+box.h-68+(i%2)*13;style(el,'transform',`translate3d(${x}px,${y+n.y}px,0) rotate(${mobile?0:i%2===0?-1.5:1}deg)`);});
  },
  destroy(){disposed=true;cache.destroy();},
 };
}
