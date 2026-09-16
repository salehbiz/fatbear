import { mix, range } from './math.mjs';
import { PLANE } from './profile-motion.mjs';

const glide=t=>t*t*t*(t*(t*6-15)+10);
const ease=(d,a,b)=>glide(range(d,a,b));
const blend=(a,b,t)=>Object.fromEntries(['x','y','scale','rotation','rotationX','rotationY'].map(k=>[k,mix(a[k],b[k],t)]));

export function centeredProfile(w,h){
 const scale=Math.min((w-(w<768?48:160))/PLANE.w,(h-156)/(PLANE.h+64));
 return {x:(w-PLANE.w*scale)/2,y:(h-(PLANE.h+64)*scale)/2,scale,rotation:0,rotationX:0,rotationY:0};
}

// A portrait destination on every viewport. Its camera shares the scroll clock.
export function landingPoseAt(d,w,h){
 const height=Math.min(800,h-(w<768?206:156)),width=Math.min(420,w-48,height*PLANE.w/PLANE.h);
 const arrival=ease(d,.975,1),mobile=w<768;
 return {width,height,x:(w-width)/2,y:w<768?78:(h-height)/2,
  scale:1,rotation:mix(0,mobile?.15:.45,arrival),
  rotationX:0,rotationY:mix(0,mobile?.6:2,arrival),
  photoY:mix(-9,0,arrival)};
}

export function demandStateAt(d,w,h,start,link){
 const mobile=w<768,center=centeredProfile(w,h);
 const compact=mobile&&h<680,inboxHeight=compact?620:PLANE.h;
 const inboxScale=Math.min((w-(mobile?48:160))/PLANE.w,(h-156)/(inboxHeight+64));
 const inboxCenter={...center,x:(w-PLANE.w*inboxScale)/2,y:(h-(inboxHeight+64)*inboxScale)/2,scale:inboxScale};
 // Tiny changes in pose keep the reading passage alive, entirely on the scroll clock.
 const frames=[
  [0,start],
  [.14,{...center,rotationY:mobile?.5:2,rotation:mobile?.15:.4}],
  [.24,{...inboxCenter,x:inboxCenter.x+3,y:inboxCenter.y-2,rotationY:mobile?-.4:-1.5}],
  [.48,{...inboxCenter,x:inboxCenter.x-3,y:inboxCenter.y-5,rotationY:mobile?.4:1.5,rotation:mobile?-.1:-.3}],
  [.60,{...center,rotationY:mobile?-.3:-1}],
 ];
 const zoomScale=Math.min((w-(mobile?64:240))/link.w,mobile?3.1:3.8);
 // Keep the enlarged profile to the right so the Unlock copy retains a quiet,
 // readable column. The smaller mobile offset prevents the UI leaving the viewport.
 const zoomFocusX=w*(w<=768?.5:.62);
 const zoom={x:zoomFocusX-(link.x+link.w*.5)*zoomScale,y:h*.46-(link.y+link.h*.5)*zoomScale,scale:zoomScale,rotation:0,rotationX:0,rotationY:0};
 const landing=landingPoseAt(1,w,h);
 const returned={x:landing.x,y:landing.y,scale:landing.width/PLANE.w,rotation:0,rotationX:0,rotationY:0};
 frames.push([.75,zoom],[.84,zoom],[.915,returned],[1,returned]);
 let camera=start;
 for(let i=1;i<frames.length;i++)if(d<=frames[i][0]){camera=blend(frames[i-1][1],frames[i][1],ease(d,frames[i-1][0],frames[i][0]));break;}
 const slide=ease(d,.14,.24)*(1-ease(d,.48,.60));
 const centerX=camera.x+(link.x+link.w*.5)*camera.scale,centerY=camera.y+(link.y+link.h*.5)*camera.scale;
 const approach=ease(d,.75,.815),press=ease(d,.815,.835)*(1-ease(d,.845,.86));
 const reveal=ease(d,.915,.975);
 return {
  camera,slide,
  profileX:-PLANE.w*slide,inboxX:PLANE.w*(1-slide),
  panelHeight:mix(PLANE.h,inboxHeight,slide),
  rowsY:-(compact?340:140)*ease(d,compact?.32:.29,.48),
  outcomeOpacity:1-ease(d,0,.105),
  linkEmphasis:ease(d,.52,.66)*(1-ease(d,.88,.94)),
  press,centerX,centerY,
  cursorX:centerX+mix(mobile?48:98,link.w*camera.scale*.16,approach),
  cursorY:centerY+mix(mobile?110:90,4,approach),
  cursorOpacity:ease(d,.75,.78)*(1-ease(d,.85,.895)),
  ripple:range(d,.817,.88),
  reveal,
  // Keep Instagram behind the opening until the destination covers the viewport.
  instagramOpacity:1-ease(d,.975,1),
  loading:ease(d,.94,.99),
  loadingOpacity:1-ease(d,.99,1),
  landingContent:ease(d,.965,1),
  landingY:mix(18,0,ease(d,.89,1)),
  landingPose:landingPoseAt(d,w,h),
 };
}

export function conversationAt(d,index){
 const enter=ease(d,.195+index*.024,.27+index*.024);
 return {opacity:enter,y:(1-enter)*23};
}
