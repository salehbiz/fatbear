import gsap from 'gsap';
import { settleProgress, shouldRefreshViewport, canvasPixelRatio, storyTravelUnit } from './mobile-motion.mjs';
import { createStoryMotion } from './story';
import { OPENING_TRAVEL, TOTAL_TRAVEL, AUDIENCE_END, PASSES_END, STORY_START, IRIS_START, IRIS_END, INTRO_TRAVEL, demandProgressAt } from './profile-motion.mjs';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import manifest from './manifest';
import { FrameCache } from './FrameCache';
import { FilmRenderer } from './FilmRenderer';
import { revealAt } from './reveal-motion.mjs';
import { EXPANSION_END, coverRect, focalAt, frameAt, mix, range, smooth } from './math.mjs';
import { getFrameTier } from './frameTier';
gsap.registerPlugin(ScrollTrigger);

export function createScroll(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>('.stage')!;
  const film = root.querySelector<HTMLElement>('.film-surface')!;
  const slot = root.querySelector<HTMLElement>('.media-slot')!;
  const canvas = root.querySelector<HTMLCanvasElement>('.film-canvas')!;
  const poster = root.querySelector<HTMLImageElement>('.poster')!;
  // The film burns open inside its own shader; the 2D canvas with the clip-path aperture is the fallback (?film=2d previews it).
  const film3d = import.meta.env.DEV && new URLSearchParams(location.search).get('film') === '2d' ? null : FilmRenderer.create(canvas);
  const ctx = film3d ? null : canvas.getContext('2d', { alpha: false });
  film.classList.toggle('gl', !!film3d);
  // The reveal drains the film into the page's own paper tone and draws the iris in its ink.
  const rgb = (hex: string): [number, number, number] => { const h = hex.trim().replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  const paper = rgb(getComputedStyle(document.documentElement).getPropertyValue('--page-background') || '#deded2');
  const ink = rgb(getComputedStyle(root.querySelector('.social-story')!).getPropertyValue('--ink') || '#303426');
  const fat = root.querySelector<HTMLElement>('.word-fat')!;
  const bear = root.querySelector<HTMLElement>('.word-bear')!;
  const footer = root.querySelector<HTMLElement>('.hero-footer')!;
  const brand = root.querySelector<HTMLElement>('.brand-corner')!;
  const story = createStoryMotion(root);
  const portal = root.querySelector<SVGSVGElement>('.portal')!;
  const edge = root.querySelector<SVGPathElement>('.portal-edge')!;
  let w = innerWidth, h = innerHeight, progress = 0, initial = { x: 0, y: 0, w: 0, h: 0 }, focus = { x: 0, y: 0 };
  let reveal = revealAt(0);
  // The opening (mark → Fat [film] Bear → the slot expanding to the viewport) runs on its own clock with scroll locked.
  // It ends on the full-screen film with the footer and brand still in place; the first scroll takes them away.
  const introState = { o: 0 };
  let introPlaying = true;
  let intro: gsap.core.Timeline;
  let filmW = 0, filmH = 0, lastDraw = '', disposed = false;
  let travelHeight = storyTravelUnit(w, h);
  let resizing = false;
  let resizeProgress = 0;
  let previousWorld = -1;
  const lastFrame = manifest.lastFrame; // First fully black frame. Trailing black excluded.
  const tier = getFrameTier();
  const tierDir = tier === '4k' ? 'frames-4k' : tier === 'mobile' ? 'frames-mobile' : 'frames';
  const cache = new FrameCache(
    lastFrame,
    tier === '4k' ? 40 : tier === 'mobile' ? 60 : 48,
    () => draw(),
    n => `${tierDir}/${String(n + 1).padStart(4, '0')}.webp`,
    n => `frames-preview/${String(n + 1).padStart(4, '0')}.webp`
  );
  let targetProgress = 0;
  const touch = matchMedia('(pointer: coarse)').matches;
  function measure() {
    w = innerWidth; h = innerHeight;
    cache.setLimit(tier === '4k' ? 40 : tier === 'mobile' ? 60 : 48);
    stage.style.height = `${h}px`;
    const box = slot.getBoundingClientRect(), stageBox = stage.getBoundingClientRect();
    initial = { x: box.left - stageBox.left, y: box.top - stageBox.top, w: box.width, h: box.height };
    portal.setAttribute('viewBox', `0 0 ${w} ${h}`);
    // Allocate once per viewport, never once per scroll event.
    const dpr = canvasPixelRatio(w, devicePixelRatio);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    lastDraw = '';
    previousWorld = -1;
    story.measure();
    focus = story.arrivalFocus(w, h);
    if (introPlaying) layoutOpening(introState.o);
    render(progress);
  }
  // Opening layout for a position inside the expansion, 0 → EXPANSION_END, shared by the intro clock and scroll.
  function layoutOpening(opening: number) {
    const expansion = smooth(range(opening, 0, EXPANSION_END));
    filmW = mix(initial.w, w, expansion); filmH = mix(initial.h, h, expansion);
    gsap.set(film, { x: mix(initial.x, 0, expansion), y: mix(initial.y, 0, expansion), width: filmW, height: filmH });
    gsap.set(fat, { x: -w * expansion * .53, opacity: 1 - range(opening, .0275, .075) });
    gsap.set(bear, { x: w * expansion * .53, opacity: 1 - range(opening, .0275, .075) });
    stage.classList.toggle('over-film', expansion > .5);
  }
  function draw() {
    if (disposed || (!introPlaying && previousWorld >= IRIS_END)) return;
    const frame = cache.nearest();
    if (!frame) return;
    const signature = `${frame.index}:${filmW.toFixed(2)}:${filmH.toFixed(2)}:${reveal.active}:${reveal.dissolve.toFixed(4)}:${reveal.grayscale.toFixed(3)}`;
    if (lastDraw === signature) return;
    const r = coverRect(filmW, filmH, 1280, 720, focalAt(frame.index));
    if (film3d) {
      if (!film3d.draw(frame.index, frame.image, { film: [filmW, filmH], crop: r, center: [focus.x, focus.y], reveal, paper, ink })) return;
    } else if (ctx) {
      ctx.setTransform(canvas.width / filmW, 0, 0, canvas.height / filmH, 0, 0);
      ctx.drawImage(frame.image, r.x, r.y, r.w, r.h);
    } else return;
    // Without the shader, the frame fades out over the paper-toned surface before the aperture cuts it.
    canvas.style.opacity = film3d ? '1' : String(1 - reveal.grayscale); poster.style.opacity = '0'; lastDraw = signature;
    const lqip = document.getElementById('hero-lqip');
    if (lqip && lqip.style.opacity !== '0') {
      lqip.style.opacity = '0';
      setTimeout(() => lqip.remove(), 400);
    }
    stage.dataset.frame = String(frame.index);
    stage.dataset.cache = JSON.stringify(cache.stats());
  }
  // The hole is cut into the film surface itself and opens on the photograph's subject, so the last frames stay visible around it.
  function aperture(t: number) {
    const cx = focus.x, cy = focus.y;
    const reach = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) * 1.06;
    const radius = reach * smooth(t);
    const amplitude = Math.sin(t * Math.PI) * .022;
    const points = Array.from({ length: 96 }, (_, i) => {
      const angle = i / 96 * Math.PI * 2;
      const r = radius * (1 + amplitude * (Math.sin(angle * 7 + .8) + .4 * Math.sin(angle * 19)));
      return `${i ? 'L' : 'M'}${(cx + Math.cos(angle) * r).toFixed(2)},${(cy + Math.sin(angle) * r).toFixed(2)}`;
    }).join(' ') + ' Z';
    edge.setAttribute('d', points);
    film.style.clipPath = `path(evenodd, "M0,0 H${w} V${h} H0 Z ${points}")`;
  }
  function render(p: number) {
    progress = p;
    // Scroll position 0 is the expanded film on its first frame; the expansion itself belongs to the intro.
    const world = INTRO_TRAVEL + p * (TOTAL_TRAVEL - INTRO_TRAVEL);
    const inPost = world >= OPENING_TRAVEL;
    const iris = range(world, IRIS_START, IRIS_END);
    const filmShown = iris < 1, revealing = iris > 0 && filmShown;
    const opening = world / 12;
    // Freeze the hidden film and opening typography during the social chapter; the intro owns the layout while it plays.
    if (!introPlaying && (filmShown || previousWorld < IRIS_END)) {
      layoutOpening(opening);
      // The footer and brand remain on the opening frame and leave with the first scroll.
      const cue = 1 - range(world, INTRO_TRAVEL, INTRO_TRAVEL + .35);
      gsap.set(footer, { opacity: cue, y: -12 * (1 - cue) });
      footer.setAttribute('aria-hidden', String(cue < .5));
      gsap.set(brand, { opacity: cue });
    }
    gsap.set(film, { visibility: filmShown ? 'visible' : 'hidden' });
    reveal = revealAt(world);
    stage.classList.toggle('revealing', reveal.active === 1);
    const aperturing = !film3d && revealing;
    gsap.set(portal, { visibility: aperturing ? 'visible' : 'hidden' });
    if (aperturing) aperture(iris); else if (film.style.clipPath) film.style.clipPath = '';
    story.render(range(world, STORY_START, AUDIENCE_END), w, h, world >= IRIS_START, demandProgressAt(world-AUDIENCE_END), range(world, PASSES_END, TOTAL_TRAVEL), world);
    stage.dataset.progress = p.toFixed(4);
    stage.dataset.iris = iris.toFixed(3);
    stage.dataset.film = film3d ? 'webgl' : '2d';
    // The film keeps requesting through the reveal so the surround is the terminal black frame, not a stale earlier one.
    if (filmShown) { cache.request(frameAt(opening, lastFrame)); draw(); }
    else if(world>PASSES_END-.6) cache.release();
    else cache.pause();
    previousWorld = world;
  }
  const lenis = new Lenis({ lerp: .105, smoothWheel: true, syncTouch: false });
  const tick = (time: number, elapsedMs: number) => {
    lenis.raf(time * 1000);
    if (!disposed && !resizing && !introPlaying && progress !== targetProgress) {
      render(w < 768 ? settleProgress(progress, targetProgress, elapsedMs) : targetProgress);
    }
  };
  lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(tick);
  ScrollTrigger.config({ ignoreMobileResize: true, autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load' });
  let trigger: ScrollTrigger;
  function mountTrigger() {
    trigger = ScrollTrigger.create({ trigger: stage, pin: true, start: 'top top', end: () => `+=${travelHeight * (TOTAL_TRAVEL - INTRO_TRAVEL)}`, invalidateOnRefresh: true, onUpdate: self => { if (!resizing) targetProgress = self.progress; }, onRefresh: self => { if (!resizing) { targetProgress = self.progress; render(self.progress); } } });
  }
  // A real native scroll during the opening (scrollbar, keyboard, restored position) ends it at once.
  function introScroll() { if (scrollY > 20) { stage.dataset.introSkip = String(Math.round(scrollY)); skipIntro(); } }
  function finishIntro() {
    introPlaying = false;
    stage.dataset.intro = 'done';
    window.removeEventListener('scroll', introScroll);
    previousWorld = -1;
    lenis.start();
    if (!disposed) { render(progress); ScrollTrigger.update(); }
  }
  function playIntro() {
    introPlaying = true;
    stage.dataset.intro = 'playing';
    lenis.stop();
    window.addEventListener('scroll', introScroll, { passive: true });
    intro.restart();
  }
  function skipIntro() { intro.progress(1, true); finishIntro(); }
  const context = gsap.context(() => {
    intro = gsap.timeline({ paused: true, onComplete: finishIntro });
    intro.call(() => { introState.o = 0; layoutOpening(0); })
      .fromTo('.intro-mark', { opacity: 0, scale: .93 }, { opacity: 1, scale: 1, duration: .23, ease: 'power2.out' }, 0)
      .to('.intro-mark', { opacity: 0, duration: .2 }, .32)
      .fromTo('.wordmark-row', { opacity: 0 }, { opacity: 1, duration: .38 }, .32)
      .fromTo(film, { opacity: 0 }, { opacity: 1, duration: .35 }, .32)
      .to(introState, { o: EXPANSION_END, duration: .65, ease: 'power2.inOut', onUpdate: () => { layoutOpening(introState.o); draw(); } }, .8);
    measure();
    mountTrigger();
    // A restored mid-story position (reload) skips the opening.
    if (introPlaying) { if (scrollY > 1) skipIntro(); else playIntro(); }
  }, root);
  let timer: ReturnType<typeof setTimeout>;
  function refreshAt(p: number) {
    const closing = root.querySelector<HTMLElement>('#belong')!;
    const afterStory = scrollY > trigger.end;
    const closingOffset = closing.getBoundingClientRect().top;
    resizing = true;
    progress = p;
    trigger.kill(); measure(); mountTrigger(); lenis.resize();
    lenis.scrollTo(afterStory ? scrollY + closing.getBoundingClientRect().top - closingOffset : trigger.start + p * (trigger.end - trigger.start), { immediate: true });
    resizing = false;
    targetProgress = p;
    render(p);
  }
  function resize() {
    if (!shouldRefreshViewport(w, h, innerWidth, innerHeight, touch)) return;
    if (!resizing) resizeProgress = progress;
    resizing = true;
    clearTimeout(timer);
    timer = setTimeout(() => {
      const p = resizeProgress;
      travelHeight = storyTravelUnit(innerWidth, innerHeight);
      refreshAt(p);
    }, 140);
  }
  window.addEventListener('resize', resize);
  // A chapter tap immediately after rotation must win over the pending resize restore.
  function finishPendingResize() {
    if (!resizing) return;
    clearTimeout(timer);
    travelHeight = storyTravelUnit(innerWidth, innerHeight);
    refreshAt(resizeProgress);
  }
  // Native focus scrolling uses the unpinned layout position in some browsers.
  // Preserve the camera while tabbing between currently available story controls.
  function keyboardFocus(event: KeyboardEvent) {
    if (event.key !== 'Tab' || !stage.contains(document.activeElement) || scrollY > trigger.end) return;
    const controls = [...stage.querySelectorAll<HTMLElement>('button,a[href],summary')].filter(el => !el.matches(':disabled') && !el.closest('[inert], [aria-hidden="true"]') && el.getClientRects().length && getComputedStyle(el).visibility!=='hidden' && (!el.closest('details')||el.matches('summary')||el.closest('details')!.open));
    const index = controls.indexOf(document.activeElement as HTMLElement);
    const next = index + (event.shiftKey ? -1 : 1);
    if (index >= 0 && next >= 0 && next < controls.length) {
      event.preventDefault();
      controls[next].focus({ preventScroll: true });
    }
  }
  root.addEventListener('keydown', keyboardFocus);
  function applicationLink(event:MouseEvent){
    const link=(event.target as HTMLElement).closest<HTMLAnchorElement>('a[href="#application"]');
    if(!link)return;
    finishPendingResize();
    event.preventDefault();if(introPlaying)skipIntro();
    lenis.scrollTo(root.querySelector<HTMLElement>('#application')!,{duration:1.4,onComplete:()=>root.querySelector<HTMLInputElement>('#apply-email')?.focus({preventScroll:true})});
  }
  root.addEventListener('click',applicationLink);
  // Font metrics must use the same guarded refresh as resize, preserving the story position.
  void document.fonts.ready.then(() => { if (!disposed && !resizing) refreshAt(progress); });
  return {
    replay: () => { finishPendingResize();lenis.scrollTo(0, { duration: 1.5, onComplete: () => { if (!disposed && !introPlaying) playIntro(); } }); },
    openPasses: () => { finishPendingResize();lenis.scrollTo(travelHeight * (PASSES_END - INTRO_TRAVEL), { duration: 4.5 }); },
    jumpTo: (target: number) => { finishPendingResize();if(introPlaying)skipIntro();lenis.scrollTo(target>TOTAL_TRAVEL?root.querySelector<HTMLElement>('#belong')!:travelHeight * (target - INTRO_TRAVEL), { duration: 1.6, onComplete: () => { if(target>TOTAL_TRAVEL)root.querySelector<HTMLInputElement>('#apply-email')?.focus({preventScroll:true}); } }); },
    destroy: () => { disposed = true; clearTimeout(timer); window.removeEventListener('resize', resize); window.removeEventListener('scroll', introScroll); root.removeEventListener('keydown', keyboardFocus);root.removeEventListener('click',applicationLink); trigger.kill(); story.destroy(); cache.destroy(); film3d?.destroy(); gsap.ticker.remove(tick); lenis.destroy(); context.revert(); },
  };
}
