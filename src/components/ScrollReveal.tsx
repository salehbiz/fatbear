import { type ReactNode, useLayoutEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ScrollReveal.css';

gsap.registerPlugin(ScrollTrigger);

type ScrollRevealProps = {
  children: ReactNode;
  id?: string;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
};

/** A normal-flow, word-by-word reveal for the closing invitation. */
export default function ScrollReveal({
  children,
  id,
  enableBlur = true,
  baseOpacity = 0.12,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = '',
  textClassName = '',
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const words = useMemo(() => typeof children === 'string'
    ? children.split(/(\s+)/).map((word, index) => /^\s+$/.test(word)
      ? word
      : <span className="scroll-reveal-word" key={`${word}-${index}`}>{word}</span>)
    : children, [children]);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const context = gsap.context(() => {
      const wordElements = gsap.utils.toArray<HTMLElement>('.scroll-reveal-word', element);
      gsap.fromTo(element, { rotate: baseRotation }, {
        rotate: 0,
        ease: 'none',
        scrollTrigger: { trigger: element, start: 'top bottom', end: 'bottom bottom', scrub: true },
      });
      gsap.fromTo(wordElements,
        { opacity: baseOpacity, filter: enableBlur ? `blur(${blurStrength}px)` : 'none' },
        {
          opacity: 1,
          filter: 'blur(0px)',
          stagger: 0.05,
          ease: 'none',
          scrollTrigger: { trigger: element, start: 'top bottom-=20%', end: 'bottom bottom', scrub: true },
        },
      );
    }, element);
    return () => context.revert();
  }, [baseOpacity, baseRotation, blurStrength, enableBlur]);

  return <h2 id={id} ref={containerRef} className={`scroll-reveal ${containerClassName}`}>
    <span className={`scroll-reveal-text ${textClassName}`}>{words}</span>
  </h2>;
}
