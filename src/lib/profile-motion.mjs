import { creator } from './creator.mjs';
import { mobileSceneTop } from './mobile-motion.mjs';
import { range, smooth, mix, EXPANSION_END } from './math.mjs';
export const OPENING_TRAVEL = 5.1;
// The wordmark expansion plays by itself on load; scrolling begins where it ends, on the film's first frame.
export const INTRO_TRAVEL = 12 * EXPANSION_END;
// The social chapter begins inside the dilating pupil, before the film's last frame.
export const STORY_LEAD = .2;
export const STORY_START = OPENING_TRAVEL - STORY_LEAD;
export const IRIS_START = STORY_START;
export const IRIS_END = OPENING_TRAVEL + .4;
// Camera position at the reveal, between the full-bleed photograph (0) and the resting post (1).
// Phones arrive closer to rest so the post lands below the chapter copy instead of over it.
export const ARRIVAL = .78, ARRIVAL_MOBILE = .88;
export const SOCIAL_TRAVEL = 8;
export const AUDIENCE_END = OPENING_TRAVEL + SOCIAL_TRAVEL;
const ORIGINAL_DEMAND_TRAVEL = 7.6;
const TRANSITION_START = .84;
export const DEMAND_TRAVEL = ORIGINAL_DEMAND_TRAVEL + 3;
export const demandDistanceAt = d => d <= TRANSITION_START
 ? d * ORIGINAL_DEMAND_TRAVEL
 : TRANSITION_START * ORIGINAL_DEMAND_TRAVEL + (d - TRANSITION_START) / (1 - TRANSITION_START) * (DEMAND_TRAVEL - TRANSITION_START * ORIGINAL_DEMAND_TRAVEL);
export const demandProgressAt = distance => distance <= demandDistanceAt(TRANSITION_START)
 ? range(distance,0,ORIGINAL_DEMAND_TRAVEL)
 : mix(TRANSITION_START,1,range(distance,demandDistanceAt(TRANSITION_START),DEMAND_TRAVEL));
export const PASSES_END = AUDIENCE_END + DEMAND_TRAVEL;
export const BUSINESS_TRAVEL = 9;
export const TOTAL_TRAVEL = PASSES_END + BUSINESS_TRAVEL;
export const PLANE = Object.freeze({w:440,h:860});
export const profileProgress = s => smooth(range(s,.33,.46));
export const followerValueAt = s => mix(creator.initialFollowers,creator.finalFollowers,smooth(range(s,.62,.86)) ** 1.6);
export const followerAt = s => Math.round(followerValueAt(s));
export const postLikesAt = s => Math.round(mix(creator.initialLikes,creator.finalLikes,smooth(range(s,.62,.86)) ** 1.6));
export const digitPosition = (value,place) => Math.floor(value/place)%10 + smooth(place===1 ? value%1 : range(value%place,place-1,place));
export function photoRectAt(s,post,tile){const t=profileProgress(s);return {x:mix(post.x,tile.x,t),y:mix(post.y,tile.y,t),w:mix(post.w,tile.w,t),h:mix(post.h,tile.h,t)};}
const glide = t => t*t*t*(t*(t*6-15)+10);
// From 1500px the chapter rail shows names; the growth close-up never crosses this column.
export const RAIL_CLEARANCE = 210;
export function fittedScale(w,h,growth=false){
 if(w<768){
  const top=mobileSceneTop(h);
  return growth ? Math.min((w-72)/PLANE.w,(h-top-120)/560) : Math.min((w-70)/PLANE.w,(h-top-64)/(PLANE.h+64));
 }
 // The close-up centre rests at .34 minus the .025 drift (see cameraAt); keep its left edge clear of the rail.
 const railLimit=w>=1500?(w*.315-RAIL_CLEARANCE)/(PLANE.w*.5):Infinity;
 return growth ? Math.min(w*.43/PLANE.w,h*.44/350,railLimit) : Math.min(w*.32/PLANE.w,h*.78/(PLANE.h+64));
}
// Minimum-jerk camera curves remain deterministic and reverse with the same path.
export function cameraAt(s,w,h,post){
 const mobile=w<768,pull=mix(mobile?ARRIVAL_MOBILE:ARRIVAL,1,smooth(range(s,0,.25))),morph=profileProgress(s);
 const travel=glide(range(s,.40,.62))*(1-glide(range(s,.88,.985)));
 const focus=glide(range(s,.46,.62))*(1-glide(range(s,.88,.985)));
 const base=fittedScale(w,h),close=fittedScale(w,h,true);
 const normalScale=mix(base*1.05,base,morph),restScale=mix(normalScale,close,focus);
 const drift=glide(range(s,.62,.86))*(1-glide(range(s,.88,.985)));
 // The close-up rests at 34% so the card clears the chapter rail on the left.
 const centerX=mobile?w*mix(.535,.48,travel):w*(mix(.755,.34,travel)-drift*.025);
 const normalTop=mobile?mobileSceneTop(h):h*.12;
 const top=mix(normalTop,mobile?normalTop:h*.19,focus);
 const normalX=centerX-PLANE.w*restScale*.5;
 const full=Math.max(w/post.w,h/post.h);
 const x=mix(w*.5-(post.x+post.w*.5)*full,normalX,pull);
 const y=mix(h*.5-(post.y+post.h*.5)*full,top,pull);
 const scale=mix(full,restScale,pull);
 const poses=[[0,0,0,0],[.25,-9,3,2],[.43,6,-3,-2],[.62,-5,2,1],[.86,4,-2,-1],[1,-7,3,2]];
 let a=poses[0],b=poses[1];for(let i=1;i<poses.length;i++){if(s<=poses[i][0]){a=poses[i-1];b=poses[i];break;}a=poses.at(-2);b=poses.at(-1);}
 const t=glide(range(s,a[0],b[0])),strength=pull*(mobile?.45:1);
 return {x,y,scale,rotationY:mix(a[1],b[1],t)*strength,rotationX:mix(a[2],b[2],t)*strength,rotation:mix(a[3],b[3],t)*strength,focus,travel};
}
