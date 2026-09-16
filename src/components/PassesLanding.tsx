import { useState } from 'react';
import { ArrowUpRight, Sparkle, LockSimple } from '@phosphor-icons/react';
import { VerifiedBadge } from './InstagramProfile';
import { creator, portraits } from '../lib/creator.mjs';
import { media } from '../lib/media';

// An illustrative destination until the client supplies the actual Passes profile.
export default function PassesLanding(){
 const [filter,setFilter]=useState('All posts');
 const tiles=filter==='Behind the scenes'?[portraits[4],portraits[2],portraits[0]]:filter==='Photo diaries'?[portraits[3],portraits[1],portraits[0]]:[portraits[4],portraits[3],portraits[0]];
 return <div className="passes-reveal"><section id="passes-preview" className="passes-page" aria-label="Maya’s illustrative Passes landing page">
  <div className="passes-browser-bar" aria-label="Illustrative browser address"><LockSimple size={12}/><span>{creator.passesLink}</span><span aria-hidden="true">···</span><i className="passes-loading" aria-hidden="true"/></div>
  <header className="passes-header"><span className="passes-wordmark"><Sparkle weight="fill" size={21}/>passes</span><span>CREATOR PREVIEW</span><img src={media('avatar.webp')} alt="Maya"/></header>
  <div className="passes-hero"><div className="passes-introduction"><p className="passes-handle">@{creator.handle}<VerifiedBadge/></p><h2>{creator.name}</h2><p className="passes-tagline">A little closer.<br/><em>A little more me.</em></p><p className="passes-description">The moments between the posts.<br/>Come behind the scenes.</p><button className="passes-explore" onClick={()=>setFilter('Behind the scenes')}>See what’s inside<ArrowUpRight size={19}/></button></div><figure className="passes-cover"><img src={media('business/crew-poster.jpg')} width="1280" height="720" alt="Maya beside the pool"/><figcaption><span>01 / A world of my own</span><span>With you in it.</span></figcaption></figure></div>
  <div className="passes-feed"><div className="passes-tabs" aria-label="Preview collections">{['All posts','Behind the scenes','Photo diaries'].map(label=><button key={label} onClick={()=>setFilter(label)} aria-pressed={filter===label}>{label}</button>)}</div><div className="passes-tiles">{tiles.map((p,i)=><article key={p.file}><img src={media(`profile/${p.file}.webp`)} alt={p.alt}/><div><span>{['A little more of my world','The in-between moments','Something just for you'][i]}</span><LockSimple size={15} aria-label="Illustrative member content"/></div></article>)}</div></div>
  <p className="passes-demo">Illustrative Passes profile · Preview content</p>
 </section></div>;
}
