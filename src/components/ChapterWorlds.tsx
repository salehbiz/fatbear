import { CHAPTERS } from '../lib/chapters.mjs';

export default function ChapterWorlds() {
 return <div className="chapter-worlds" aria-hidden="true">{CHAPTERS.slice(0,5).map((chapter,index)=><div key={chapter.id} className="chapter-world" data-world={index} style={{backgroundColor:chapter.color}}>
  {chapter.asset&&<picture><source media="(max-width: 767px)" data-srcset={`/media/chapters/${chapter.asset}-mobile.webp`}/><img data-src={`/media/chapters/${chapter.asset}-desktop.webp`} alt="" decoding="async"/></picture>}
  <div className="world-veil"/><div className="world-grain"/>
 </div>)}</div>;
}
