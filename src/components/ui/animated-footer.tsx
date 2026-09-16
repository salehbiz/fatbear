import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { CHAPTERS } from '../../lib/chapters.mjs';
import './animated-footer.css';

// Adapted from VengeanceUI's animated-footer registry: canvas ASCII imagery,
// pointer illumination and a centre-out character reveal, using local CSS.
const artwork = ['hand-left.jpg', 'hand-right.jpg'].map(name =>
 `https://raw.githubusercontent.com/Ashutoshx7/VengeanceUI/main/public/animated-footer/${name}`);
type Cell = { x: number; y: number; glyph: string; until: number };
export function AnimatedFooter({ jump }: { jump?: (world:number)=>void }) {
 const root = useRef<HTMLElement>(null);
 useLayoutEffect(() => {
  const el=root.current!;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  let disposed=false,visible=false,raf=0;
  const scenes: {canvas:HTMLCanvasElement;ctx:CanvasRenderingContext2D;cells:Cell[];height:number}[]=[];
  const images:HTMLImageElement[]=[];
  const pointer={x:0,y:0},drift={x:0,y:0};
  const context=gsap.context(()=>{},el);
  let timeline:gsap.core.Timeline;
  context.add(()=>{
   timeline=gsap.timeline({paused:true}).fromTo('[data-footer-char]',{yPercent:115},{yPercent:0,duration:1.15,ease:'power3.out',stagger:{each:.045,from:'center'}},0)
    .fromTo('.af-art',{opacity:0,x:(i:number)=>i===0?-120:120},{opacity:1,x:0,duration:1.4,ease:'power3.out'},0)
    .fromTo('.af-content',{opacity:0,y:20},{opacity:1,y:0,duration:.8},.1);
  });
  const draw=()=>{
   raf=0;if(disposed||!visible)return;
   drift.x+=(pointer.x-drift.x)*.07;drift.y+=(pointer.y-drift.y)*.07;
   scenes.forEach(({canvas,ctx,cells,height},index)=>{
    ctx.clearRect(0,0,800,height);
    const now=performance.now();
    cells.forEach(cell=>{const lit=cell.until>now;ctx.fillStyle=lit?'#c6d5aa':'#89917b';if(lit)ctx.fillRect(cell.x,cell.y,10,10);ctx.fillStyle=lit?'#252c21':'#89917b';ctx.fillText(cell.glyph,cell.x,cell.y+9);});
    canvas.style.transform=`translate(${preference.matches?0:drift.x*(index?1:-1)}px,${preference.matches?0:drift.y}px)`;
   });
   if(!preference.matches)raf=requestAnimationFrame(draw);
  };
  const start=()=>{if(!raf&&visible&&!disposed)raf=requestAnimationFrame(draw);};
  el.querySelectorAll<HTMLCanvasElement>('canvas').forEach((canvas,index)=>{
   const image=new Image();images.push(image);image.crossOrigin='anonymous';
   image.onload=()=>{
    if(disposed)return;
    try {
     const sampler=document.createElement('canvas');sampler.width=80;sampler.height=Math.max(1,Math.round(80*image.naturalHeight/image.naturalWidth));
     const sample=sampler.getContext('2d')!;sample.drawImage(image,0,0,80,sampler.height);
     const pixels=sample.getImageData(0,0,80,sampler.height).data,cells:Cell[]=[],ramp='....::=+xX#0369';
     for(let y=0;y<sampler.height;y++)for(let x=0;x<80;x++){
      const n=(y*80+x)*4,light=(pixels[n]*.299+pixels[n+1]*.587+pixels[n+2]*.114)/255;
      const glyph=ramp[Math.min(ramp.length-1,Math.floor((1-light)*ramp.length))];
      if(glyph!=='.'&&pixels[n+3]>128)cells.push({x:x*10,y:y*10,glyph,until:0});
     }
     canvas.width=800;canvas.height=sampler.height*10;const ctx=canvas.getContext('2d')!;ctx.font='10px monospace';
     scenes.push({canvas,ctx,cells,height:canvas.height});start();
    }catch{canvas.hidden=true;}
   };
   image.onerror=()=>{canvas.hidden=true;};image.src=artwork[index];
  });
  const move=(event:PointerEvent)=>{
   if(preference.matches)return;
   const rect=el.getBoundingClientRect();pointer.x=((event.clientX-rect.left)/rect.width-.5)*24;pointer.y=((event.clientY-rect.top)/rect.height-.5)*16;
   scenes.forEach(scene=>{const box=scene.canvas.getBoundingClientRect();if(!box.width)return;const x=(event.clientX-box.left)/box.width*800,y=(event.clientY-box.top)/box.height*scene.height;scene.cells.forEach(cell=>{if(Math.hypot(cell.x-x,cell.y-y)<55)cell.until=performance.now()+320;});});
  };
  const reset=()=>{pointer.x=pointer.y=0;};
  const change=()=>{if(preference.matches){timeline.progress(1).pause();reset();}start();};
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){if(preference.matches)timeline.progress(1).pause();else timeline.play();start();}else{cancelAnimationFrame(raf);raf=0;if(!preference.matches)timeline.reverse();}},{threshold:.12});
  observer.observe(el);preference.addEventListener('change',change);el.addEventListener('pointermove',move);el.addEventListener('pointerleave',reset);
  if(preference.matches)timeline!.progress(1).pause();
  return()=>{disposed=true;observer.disconnect();cancelAnimationFrame(raf);images.forEach(image=>{image.onload=null;image.onerror=null;});preference.removeEventListener('change',change);el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',reset);context.revert();};
 },[]);
 return <footer ref={root} className="animated-footer">
  <div className="af-content"><div><p className="eyebrow">Your next chapter</p><p className="af-invitation">Find your people.<br/><em>Create what comes next.</em></p><a href="#application" className="apply-button">Apply to join <span aria-hidden="true">↗</span></a></div>
  <nav aria-label="Explore the chapters">{CHAPTERS.map(c=><a key={c.id} href={c.destination?'#belong':`#${c.id}`} onClick={jump?event=>{event.preventDefault();jump(c.focus);}:undefined}><small>{c.numeral}</small>{c.name}</a>)}</nav></div>
  <div className="af-art af-art-left" aria-hidden="true"><canvas/></div><div className="af-art af-art-right" aria-hidden="true"><canvas/></div>
  <h2 className="af-wordmark" aria-label="Fat Bear">{Array.from('Fat Bear').map((letter,i)=><span className="af-mask" key={i}><span data-footer-char aria-hidden="true">{letter===' '?'\u00a0':letter}</span></span>)}</h2>
  <div className="af-bottom"><span>A membership club for creators.</span><small>© {new Date().getFullYear()} Fat Bear</small></div>
 </footer>;
}
