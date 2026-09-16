import { useRef } from 'react';
import { CHAPTERS } from '../lib/chapters.mjs';

export default function ChapterRail({ jump }: { jump: (world: number) => void }) {
  const menu = useRef<HTMLDetailsElement>(null);
  return <><nav className="chapter-rail" aria-label="Chapters">
    <ol>{CHAPTERS.map(chapter => <li key={chapter.numeral}>
      <button type="button" aria-label={`${chapter.numeral}. ${chapter.name}`} onClick={() => jump(chapter.focus)}><span className="rail-name" aria-hidden="true">{chapter.name}</span><span className="rail-numeral" aria-hidden="true">{chapter.numeral}</span></button>
    </li>)}</ol>
  </nav><details className="chapter-menu" ref={menu}><summary>Chapters <span aria-hidden="true">＋</span></summary><nav aria-label="Mobile chapters">{CHAPTERS.map(chapter=><button key={chapter.id} type="button" onClick={()=>{menu.current?.removeAttribute('open');jump(chapter.focus);}}>{chapter.numeral} — {chapter.name}</button>)}</nav></details></>;
}
