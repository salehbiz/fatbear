import { mix, range, smooth } from './math.mjs';
// Manually marked centres in the 1280×720 source footage, indexed by decoded frame.
const tracks = [
 [[100,205,604],[150,359,550],[200,535,470],[251,594,498]],
 [[50,650,620],[100,640,440],[150,648,418],[200,648,422],[251,649,471]],
 [[175,445,710],[200,527,552],[251,594,537]],
];
export function crewAnchor(frame,index,rect){
 const keys=tracks[index];let a=keys[0],b=a;
 for(let i=1;i<keys.length;i++){b=keys[i];if(frame<=b[0])break;a=b;}
 const t=a[0]===b[0]?0:range(frame,a[0],b[0]);
 const scale=Math.max(rect.w/1280,rect.h/720);
 return {x:rect.x+(rect.w-1280*scale)*.5+mix(a[1],b[1],t)*scale,
 y:rect.y+(rect.h-720*scale)*.4+mix(a[2],b[2],t)*scale,
 opacity:smooth(range(frame,keys[0][0],keys[0][0]+16))};
}
