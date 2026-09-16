import { mix, range } from './math.mjs';

const glide=t=>t*t*t*(t*(t*6-15)+10);
const ease=(p,a,b)=>glide(range(p,a,b));
export const business = Object.freeze({subscribers:2000,subscriptionPrice:25,purchases:750,purchasePrice:40,earnings:80000});
export const BUSINESS_LAST_FRAME=251;
export function businessMetricsAt(p){
 const subscribers=Math.round(business.subscribers*ease(p,.59,.84)**1.35);
 // The first $40 sale is part of the eventual total, not an extra notification charge.
 const purchases=p<.035?0:1+Math.round((business.purchases-1)*ease(p,.61,.86)**1.2);
 return {subscribers,purchases,subscriptionsRevenue:subscribers*25,purchasesRevenue:purchases*40,earnings:subscribers*25+purchases*40};
}
export function dashboardBox(w,h){
 const mobile=w<768,short=h<680;
 // Wide screens keep the chapter rail's column clear of the dashboard.
 const width=Math.min(1120,w-(mobile?40:w>=1500?440:112)),y=mobile?(short?166:238):(short?180:238);
 const height=Math.min(mobile?(short?310:470):570,h-y-(mobile?68:74));
 return {x:(w-width)/2,y,w:width,h:height};
}
// Copy windows in business progress: enter start, enter end, exit start, exit end.
export const BUSINESS_COPY=Object.freeze([[.21,.27,.45,.51],[.53,.60,.70,.75],[.72,.77,.86,.91],[.89,.95,1.5,1.6]]);
export function businessStateAt(p,w,h){
 const mobile=w<768;
 const copyIn=BUSINESS_COPY.map(([a,b])=>ease(p,a,b)),copyOut=BUSINESS_COPY.map(([,,c,d])=>ease(p,c,d));
 return {
  firstSale:ease(p,.015,.06)*(1-ease(p,.13,.19)),
  expand:ease(p,.14,.25),frame:Math.round(BUSINESS_LAST_FRAME*ease(p,.25,.51)),
  retreat:ease(p,.51,.62),filmOpacity:ease(p,.125,.15),
  paper:ease(p,.19,.25),passesOpacity:1-ease(p,.17,.25),
  dashboardOpacity:ease(p,.525,.60),
  camera:{y:mix(22,0,ease(p,.53,.65))-Math.sin(range(p,.65,1)*Math.PI)*5,
   scale:mix(.985,1,ease(p,.53,.65)),rotationY:mix(mobile?-1:-3,0,ease(p,.53,.67)),rotation:Math.sin(range(p,.65,1)*Math.PI)*(mobile?.1:.3)},
  earningsFocus:ease(p,.69,.77)*(1-ease(p,.87,.94)),
  metrics:businessMetricsAt(p),
  filmCopy:copyIn[0]*(1-copyOut[0]),
  copyOne:copyIn[1]*(1-copyOut[1]),
  copyTwo:copyIn[2]*(1-copyOut[2]),
  copyEnd:copyIn[3]*(1-copyOut[3]),
  copyIn,copyOut,
 };
}
export function businessToastAt(p,index){
 const start=.615+index*.048;
 const enter=ease(p,start,start+.025),leave=ease(p,start+.095,start+.135);
 return {opacity:enter*(1-leave),y:(1-enter)*22-leave*28};
}
export function filmBoxAt(state,start,end,w,h){
 const full={x:0,y:0,w,h};
 const a=Object.fromEntries(['x','y','w','h'].map(k=>[k,mix(start[k],full[k],state.expand)]));
 return Object.fromEntries(['x','y','w','h'].map(k=>[k,mix(a[k],end[k],state.retreat)]));
}
