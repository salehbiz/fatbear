// Move a fixed-size clipping layer instead of relaying out the photograph on scroll.
// The inner transform cancels the clip's unequal axes, preserving object-fit: cover.
export function photoTransforms(rect, base, image = {w:1280,h:720}) {
 const sx=rect.w/base.w, sy=rect.h/base.h;
 const cover=Math.max(rect.w/image.w,rect.h/image.h);
 return {
  frame:{x:rect.x,y:rect.y,sx,sy},
  image:{x:(rect.w-image.w*cover)*.5/sx,y:(rect.h-image.h*cover)*.4/sy,sx:cover/sx,sy:cover/sy},
 };
}
const transform = ({x,y,sx,sy}) => `translate3d(${x}px, ${y}px, 0px) scale(${sx}, ${sy})`;

export function createPhotoMotion(frame, image) {
 let base, previous;
 return {
  measure(box) {
   if(base && base.w===box.w && base.h===box.h)return;
   base={w:box.w,h:box.h};
   frame.style.width=`${base.w}px`;
   frame.style.height=`${base.h}px`;
   previous=undefined;
  },
  render(rect) {
   if(!base)return;
   if(previous && ['x','y','w','h'].every(key=>previous[key]===rect[key]))return;
   const pose=photoTransforms(rect,base);
   frame.style.transform=transform(pose.frame);
   image.style.transform=transform(pose.image);
   previous={...rect};
  },
 };
}
