import { CHAPTERS, themeReveal, chapterEnd } from './chapters.mjs';
import { range } from './math.mjs';

export function createChapterWorlds(root:HTMLElement) {
 const worlds=[...root.querySelectorAll<HTMLElement>('.chapter-world')];
 const loaded=new Set<number>();
 return (world:number)=>worlds.forEach((el,i)=>{
  const chapter=CHAPTERS[i];
  // Request the next world early; direct jumps request the destination immediately.
  if(!loaded.has(i)&&world>=chapter.start-2){
   const source=el.querySelector('source'),img=el.querySelector('img');
   if(source)source.srcset=source.dataset.srcset!;
   if(img)img.src=img.dataset.src!;
   loaded.add(i);
  }
  const reveal=i===0?1:themeReveal(world,chapter.start);
  el.style.visibility=reveal>0?'visible':'hidden';
  // An irregular, softly crossfaded leading edge is reversible and allocated once.
  const edge=105-reveal*110;
  el.style.clipPath=reveal===1?'none':`polygon(0 ${edge+1}%,12% ${edge-1}%,27% ${edge+1.5}%,40% ${edge}%,58% ${edge+2}%,73% ${edge-.5}%,89% ${edge+1}%,100% ${edge}%,100% 100%,0 100%)`;
  el.style.opacity=String(Math.min(1,reveal*3));
  const progress=range(world,chapter.start,chapterEnd(i));
  const picture=el.querySelector<HTMLElement>('picture');
  if(picture)picture.style.transform=`translate3d(${12-progress*24}px,${24-progress*48}px,0)`;
  const grain=el.querySelector<HTMLElement>('.world-grain')!;
  grain.style.transform=`translate3d(${progress*14}px,${progress*-20}px,0)`;
 });
}
