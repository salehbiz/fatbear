import { useState, useEffect } from 'react';
import { ArrowLeft, DotsThree, GridNine, VideoCamera, UserSquare, LinkSimple, Plus, SealCheck, House, MagnifyingGlass, PlusSquare, At, Crown, Sparkle } from '@phosphor-icons/react';
import { creator, portraits } from '../lib/creator.mjs';
import { media } from '../lib/media';

export function VerifiedBadge() {
  return creator.verified ? <SealCheck className="verified-badge" size={18} weight="fill" role="img" aria-label="Verified illustrative account"/> : null;
}
export function ProfileNavigation(){
 return <nav className="profile-nav" aria-hidden="true"><House size={24}/><MagnifyingGlass size={24}/><PlusSquare size={24}/><VideoCamera size={24}/><img src={media('avatar.webp')} loading="lazy" decoding="async" alt=""/></nav>;
}
export default function InstagramProfile({staticView=false,openPasses}:{staticView?:boolean;openPasses?:()=>void}) {
  const [active, setActive] = useState(staticView);
  useEffect(() => {
    if (staticView) return;
    const activate = () => {
      setActive(true);
      window.removeEventListener('scroll', activate);
    };
    window.addEventListener('scroll', activate, { passive: true });
    const timer = setTimeout(activate, 2500);
    return () => {
      window.removeEventListener('scroll', activate);
      clearTimeout(timer);
    };
  }, [staticView]);

  return <section className="profile-layer" aria-label="Maya's illustrative Instagram profile">
    <div className="profile-details">
      <header className="profile-top"><ArrowLeft size={23} aria-hidden="true"/><strong>{creator.handle}<VerifiedBadge/></strong><DotsThree size={27} aria-hidden="true"/></header>
      <div className="profile-identity">
        <span className="profile-avatar"><img src={media('avatar.webp')} loading="lazy" decoding="async" alt="Maya"/></span>
        <div className="profile-stat"><strong>{creator.posts}</strong><span>posts</span></div>
        <div className="profile-stat follower-stat"><div className="follower-counter" role="img" aria-label={`${creator.finalFollowers.toLocaleString('en-US')} followers`}><span className="counter-readable sr-only">{creator.finalFollowers.toLocaleString('en-US')}</span><span className="counter-visual" aria-hidden="true">{[10000,1000,100,10,1].map((place,i)=><span className="digit-group" key={place} data-place={place}>{i===2 && <span className="digit-comma">,</span>}<span className="digit-window"><span className="digit-strip">{Array.from({length:11},(_,n)=><span key={n}>{n%10}</span>)}</span></span></span>)}</span></div><span>followers</span><span className="growth-note">+28.4K new</span></div>
        <div className="profile-stat"><strong>{creator.following}</strong><span>following</span></div>
      </div>
      <div className="profile-bio"><strong>{creator.name}</strong><span className="profile-threads"><At size={15}/>{creator.handle} · 2 new <i/></span><p>{creator.bio}</p><span className="profile-link"><a className="bio-link-target" href="#passes-preview" aria-label="Open Maya’s illustrative Passes page" onClick={event=>{if(openPasses){event.preventDefault();openPasses();}}}><span className="bio-link-label"><LinkSimple size={16}/>{creator.passesLink}</span></a></span></div>
      <div className="profile-buttons" aria-hidden="true"><span>Follow</span><span>Message</span><span>Email</span><span><UserSquare size={22}/></span></div>
    </div>
    <div className="profile-highlights" aria-hidden="true">{portraits.slice(0,4).map(p=><div key={p.file}><img src={active ? media(`profile/${p.file}.webp`) : ''} loading="lazy" decoding="async" alt=""/><span>{p.label}</span></div>)}<div><span className="highlight-new"><Plus size={22}/></span><span>New</span></div></div>
    <div className="profile-tabs" aria-hidden="true"><GridNine size={23} weight="fill"/><Crown size={23}/><VideoCamera size={23}/><Sparkle size={23}/><UserSquare size={23}/></div>
    <div className="profile-grid"><div className="featured-target">{staticView && <img className="static-post-photo" src={active ? media('poolside-post.webp') : ''} loading="lazy" decoding="async" alt="Maya’s featured poolside photograph"/>}</div>{portraits.map(p=><img key={p.file} src={active ? media(`profile/${p.file}.webp`) : ''} loading="lazy" decoding="async" alt={p.alt}/>)}</div>
    {staticView&&<ProfileNavigation/>}
  </section>;
}
