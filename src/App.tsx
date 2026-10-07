import { useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { ArrowDown, ArrowUpRight } from '@phosphor-icons/react';
import { media } from './lib/media';
import { createScroll } from './lib/scroll';
import SocialStory from './components/SocialStory';
import TexturedPortal from './components/TexturedPortal';
import Belong from './components/Belong';
import ReducedStory from './components/ReducedStory';
import SiteBackground from './components/SiteBackground';
import { CHAPTERS, INTRO_COPY } from './lib/chapters.mjs';
import './chapters.css';

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
// Development-only preview of the same fallback used by the OS motion preference.
const previewReduced = import.meta.env.DEV && new URLSearchParams(location.search).get('motion') === 'reduce';
const subscribe = (callback: () => void) => { motionPreference.addEventListener('change', callback); return () => motionPreference.removeEventListener('change', callback); };

export default function App() {
  const root = useRef<HTMLElement>(null);
  const replayRef = useRef<() => void>(() => {});
  const passesRef = useRef<() => void>(() => {});
  const jumpRef = useRef<(world: number) => void>(() => {});
  const reduced = useSyncExternalStore(subscribe, () => previewReduced || motionPreference.matches);
  useLayoutEffect(() => {
    if (!root.current || reduced) return;
    const controller = createScroll(root.current);
    replayRef.current = controller.replay;
    passesRef.current = controller.openPasses;
    jumpRef.current = controller.jumpTo;
    return controller.destroy;
  }, [reduced]);
  if (reduced) return <main className="static-experience"><SiteBackground reduced/><header className="static-header"><h1>Fat Bear Agency</h1><p>{INTRO_COPY}</p><a className="apply-button" href="#application">Talk to us ↗</a></header><ReducedStory/><Belong/></main>;
  return <main ref={root} className="experience">
    <SiteBackground/>
    <section className="stage" aria-label="Fatbear creator story">
      <div className="brand-corner" aria-hidden="true"><svg viewBox="306 312 468 516"><path fill="currentColor" d="M676.43,530.32c-2.34-0.83-2.51-4.07-0.28-5.14c43.04-20.61,74.27-55.86,74.27-113.52v-1.49
c0-35.82-12.68-63.43-33.58-84.32c-30.59-30.6-76.86-47.01-142.52-47.01H309.25c-1.55,0-2.81,1.26-2.81,2.81v516.73
c0,1.55,1.26,2.81,2.81,2.81H360V364.53c0-0.4,0.32-0.72,0.72-0.72h287.55c0.4,0,0.72,0.32,0.72,0.72v86.28
c0,0.4-0.32,0.72-0.72,0.72H460.84c-0.4,0-0.72,0.32-0.72,0.72v77.69c0,0.4,0.32,0.72,0.72,0.72h169.37c0.4,0,0.72,0.32,0.72,0.72
v81.64c0,0.4-0.32,0.72-0.72,0.72H460.84c-0.4,0-0.72,0.32-0.72,0.72v186.68h115.7c124.61,0,197.74-54.47,197.74-144.01v-1.49
C773.56,587.26,736.04,551.51,676.43,530.32z"/></svg></div>
      <button className="masthead-apply" onClick={()=>jumpRef.current(CHAPTERS[5].focus)}>Talk to us <span aria-hidden="true">↗</span></button>
      <SocialStory replay={() => replayRef.current()} openPasses={() => passesRef.current()} jump={world => jumpRef.current(world)}/>
      <div className="wordmark-row" aria-hidden="true"><span className="word-fat">Fat</span><span className="media-slot"/><span className="word-bear">Bear</span></div>
      <h1 className="sr-only">Fat Bear Agency. We turn your fans into income.</h1>
      <div className="film-surface">
        {/* Portrait screens get frame 1 of the portrait tier, so the poster is as sharp as the film it hands over to. */}
        <picture>
          <source media="(orientation: portrait) and (max-width: 1100px)" srcSet={media('poster-portrait.webp')}/>
          <img className="poster" srcSet={`${media('poster-phone.webp')} 960w, ${media('poster-mobile.webp')} 1920w, ${media('poster-2560.webp')} 2560w`} sizes="100vw" src={media('poster-mobile.webp')} width="1280" height="720" fetchPriority="high" alt="A creator standing beside a sunlit pool"/>
        </picture>
        <canvas className="film-canvas" aria-hidden="true"/>
      </div>
      <div className="hero-footer"><span className="footer-title">{INTRO_COPY}</span><span className="scroll-cue">Scroll to explore <ArrowDown size={16}/></span><span className="footer-end">Your fans are waiting. <ArrowUpRight size={16}/></span></div>
      <div className="intro-mark" aria-hidden="true">fatbear</div>
      <TexturedPortal/>
    </section>
    <Belong jump={world=>jumpRef.current(world)}/>
  </main>;
}
