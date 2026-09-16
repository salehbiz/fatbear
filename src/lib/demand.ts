import { conversationAt } from './demand-motion.mjs';
import { bloomAt, bloomFilter } from './depth.mjs';

type DemandState = ReturnType<typeof import('./demand-motion.mjs').demandStateAt>;
export function createDemandMotion(root:HTMLElement){
 const get=(selector:string)=>root.querySelector<HTMLElement>(selector)!;
 const profilePage=get('.instagram-profile-page'),inbox=get('.inbox-page'),list=get('.conversation-list');
 const glass=get('.glass-surface'),window=get('.instagram-window'),nav=get('.social-plane > .profile-nav');
 const rows=[...root.querySelectorAll<HTMLElement>('.conversation')];
 const link=get('.bio-link-label'),linkTarget=get('.bio-link-target');
 const cursor=get('.story-cursor'),ripple=get('.link-ripple');
 const reveal=get('.passes-reveal'),page=get('.passes-page'),hero=get('.passes-hero'),feed=get('.passes-feed');
 const surroundings=[...root.querySelectorAll<HTMLElement>('.profile-top,.profile-identity,.profile-bio>strong,.profile-threads,.profile-bio>p,.profile-buttons,.profile-highlights,.profile-tabs,.profile-grid,.featured-frame')];
 function style(el:HTMLElement,key:'transform'|'opacity'|'visibility'|'clipPath'|'filter',value:string){if(el.style[key]!==value)el.style[key]=value;}
 function alpha(el:HTMLElement,value:number){style(el,'opacity',String(value));style(el,'visibility',value===0?'hidden':'inherit');}
 function hidden(el:HTMLElement,value:boolean){if(el.getAttribute('aria-hidden')!==String(value))el.setAttribute('aria-hidden',String(value));if(el.inert!==value)el.inert=value;}
 return {
  render(d:number,w:number,h:number,state:DemandState){
   style(profilePage,'transform',`translate3d(${state.profileX}px,0,0)`);
   style(inbox,'transform',`translate3d(${state.inboxX}px,0,0)`);
   style(glass,'transform',`scaleY(${state.panelHeight/860})`);
   style(window,'clipPath',state.panelHeight===860?'none':`inset(0px 0px ${860-state.panelHeight}px 0px round 30px)`);
   style(nav,'transform',`translate3d(0,${state.panelHeight-860}px,0)`);
   alpha(profilePage,state.slide===1?0:1);alpha(inbox,state.slide===0?0:1);
   hidden(inbox,state.slide<.8);hidden(linkTarget,d<.10||state.slide>.1||d>.94);
   style(list,'transform',`translate3d(0,${state.rowsY}px,0)`);
   rows.forEach((row,index)=>{
    const value=conversationAt(d,index);
    alpha(row,value.opacity);style(row,'transform',`translate3d(0,${value.y}px,0)`);
    hidden(row,value.opacity<.5);
   });
   style(link,'transform',`scale(${1-state.press*.035})`);
   if(link.style.getPropertyValue('--link-emphasis')!==String(state.linkEmphasis))link.style.setProperty('--link-emphasis',String(state.linkEmphasis));
   surroundings.forEach(el=>style(el,'opacity',String(1-state.linkEmphasis*.62)));
   alpha(cursor,state.cursorOpacity);
   style(cursor,'transform',`translate3d(${state.cursorX}px,${state.cursorY}px,0) scale(${1-state.press*.16})`);
   const ring=state.ripple;
   alpha(ripple,Math.sin(ring*Math.PI)*.65);
   style(ripple,'transform',`translate3d(${state.cursorX-19}px,${state.cursorY-19}px,0) scale(${.35+ring*1.7})`);
   alpha(reveal,state.reveal>0?1:0);hidden(reveal,state.reveal<.995);
   const pose=state.landingPose;
   style(reveal,'clipPath',state.reveal===1?'none':`inset(${pose.y}px ${Math.max(0,w-pose.x-pose.width)}px ${Math.max(0,h-pose.y-pose.height)}px ${pose.x}px round 28px)`);
   if(page.style.width!==`${pose.width}px`)page.style.width=`${pose.width}px`;
   if(page.style.height!==`${pose.height}px`)page.style.height=`${pose.height}px`;
   const settled=state.reveal;
   style(page,'transform',`translate3d(${pose.x}px,${pose.y+(1-settled)*pose.height}px,0) perspective(1800px) rotateX(${pose.rotationX*settled}deg) rotateY(${pose.rotationY*settled}deg) rotate(${pose.rotation*settled}deg) scale(${1+(pose.scale-1)*settled})`);
   style(get('.passes-loading'),'transform',`scaleX(${state.loading})`);
   alpha(get('.passes-loading'),state.loadingOpacity);
   const coverScale=String(1+Math.abs(pose.photoY)*.004);
   if(page.style.getPropertyValue('--cover-scale')!==coverScale)page.style.setProperty('--cover-scale',coverScale);
   alpha(hero,state.landingContent);alpha(feed,state.landingContent);
   // Queried live: the preview collection buttons re-render these tiles.
   const tiles=[...feed.querySelectorAll<HTMLElement>('.passes-tiles article')];
   tiles.forEach((tile,i)=>{const b=bloomAt(state.landingContent,i,tiles.length,.7);style(tile,'transform',`scale(${b.scale})`);style(tile,'filter',bloomFilter(b));style(tile,'opacity',String(b.enter));});
  },
 };
}
