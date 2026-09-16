import { useEffect, useRef } from 'react';
import { DotPattern } from './ui/dot-pattern';

export default function SiteBackground({ reduced = false }: { reduced?: boolean }) {
  const layer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const draw = () => {
      frame = 0;
      // Wrap by one pattern cell: phase remains continuous over long pages.
      layer.current?.style.setProperty('--dot-offset', `${-(window.scrollY * .012 % 26)}px`);
    };
    const update = () => { if (!frame) frame = requestAnimationFrame(draw); };
    draw();
    window.addEventListener('scroll', update, { passive: true });
    return () => { window.removeEventListener('scroll', update); cancelAnimationFrame(frame); };
  }, [reduced]);
  return <div ref={layer} className="site-dot-background" aria-hidden="true"><DotPattern/></div>;
}
