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
  if (reduced) return <main className="static-experience"><SiteBackground reduced/><header className="static-header"><h1>Fatbear</h1><p>{INTRO_COPY}</p><a className="apply-button" href="#application">Apply to join ↗</a></header><ReducedStory/><Belong/></main>;
  return <main ref={root} className="experience">
    <SiteBackground/>
    <section className="stage" aria-label="Fatbear creator story">
      <div className="brand-corner" aria-hidden="true">fb</div>
      <button className="masthead-apply" onClick={()=>jumpRef.current(CHAPTERS[5].focus)}>Apply to join <span aria-hidden="true">↗</span></button>
      <SocialStory replay={() => replayRef.current()} openPasses={() => passesRef.current()} jump={world => jumpRef.current(world)}/>
      <div className="wordmark-row" aria-hidden="true"><span className="word-fat">Fat</span><span className="media-slot"/><span className="word-bear">Bear</span></div>
      <h1 className="sr-only">Fat Bear. A membership club for creators.</h1>
      <div className="film-surface">
        <img className="poster" srcSet={`${media('poster-phone.webp')} 960w, ${media('poster-mobile.webp')} 1920w, ${media('poster.webp')} 3840w`} sizes="100vw" src={media('poster-mobile.webp')} width="1280" height="720" fetchPriority="high" alt="A creator standing beside a sunlit pool"/>
        <canvas className="film-canvas" aria-hidden="true"/>
      </div>
      <div className="hero-footer"><span className="footer-title">{INTRO_COPY}</span><span className="scroll-cue">Scroll to explore <ArrowDown size={16}/></span><span className="footer-end">It starts with you. <ArrowUpRight size={16}/></span></div>
      <div className="intro-mark" aria-hidden="true">fatbear</div>
      <TexturedPortal/>
    </section>
    <Belong jump={world=>jumpRef.current(world)}/>
  </main>;
}
