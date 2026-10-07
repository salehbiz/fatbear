import { useState, useEffect } from 'react';
import { ArrowCounterClockwise, Heart, UserPlus, Cursor, HandPointing } from '@phosphor-icons/react';
import InstagramPost from './InstagramPost';
import InstagramProfile, { ProfileNavigation } from './InstagramProfile';
import InstagramInbox from './InstagramInbox';
import PassesLanding from './PassesLanding';
import EditorialField from './EditorialField';
import BusinessStory from './BusinessStory';
import { creator } from '../lib/creator.mjs';
import { CHAPTERS, chapterLabel } from '../lib/chapters.mjs';
import { media } from '../lib/media';

export default function SocialStory({replay,openPasses,jump,staticView=false}:{replay?:()=>void;openPasses?:()=>void;jump?:(world:number)=>void;staticView?:boolean}) {
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

  return <section className="social-story" aria-label="From one post to her creator business">
    <EditorialField/>
    <header className="story-masthead"><span><svg className="brand-wordmark" viewBox="360 518 360 44" role="img" aria-label="Fat Bear"><g fill="currentColor"><path d="M362.91,520.86h30.84v9.36h-20.16v6.55h18.23v8.87h-18.23v13.77h-10.68V520.86z"/><path d="M418.53,520.59h10.3l16.41,38.83h-11.46l-2.81-6.88h-14.87l-2.75,6.88h-11.24L418.53,520.59z M427.9,544.21 l-4.3-10.96l-4.35,10.96H427.9z"/><path d="M464.47,530.22H452.9v-9.36h33.82v9.36h-11.57v29.19h-10.68V530.22z"/><path d="M528.68,520.86h19.77c4.85,0,8.26,1.21,10.52,3.47c1.54,1.54,2.48,3.58,2.48,6.22v0.11 c0,4.46-2.53,7.1-5.95,8.59c4.68,1.54,7.66,4.19,7.66,9.42v0.11c0,6.61-5.4,10.63-14.6,10.63h-19.88V520.86z M545.81,536.23 c3.25,0,5.07-1.1,5.07-3.36v-0.11c0-2.09-1.65-3.3-4.85-3.3h-6.94v6.77H545.81z M547.35,550.82c3.25,0,5.12-1.27,5.12-3.52v-0.11 c0-2.09-1.65-3.47-5.23-3.47h-8.15v7.11H547.35z"/><path d="M579.08,520.86h31.01v9.09h-20.43v5.84h18.51v8.43h-18.51v6.11h20.71v9.09h-31.28V520.86z"/><path d="M640.15,520.59h10.3l16.41,38.83h-11.46l-2.81-6.88h-14.87l-2.75,6.88h-11.24L640.15,520.59z M649.52,544.21 l-4.3-10.96l-4.35,10.96H649.52z"/><path d="M681.62,520.86h18.23c5.89,0,9.97,1.54,12.56,4.19c2.26,2.2,3.41,5.18,3.41,8.98v0.11 c0,5.89-3.14,9.8-7.93,11.84l9.2,13.44h-12.34l-7.77-11.68h-0.11h-4.57v11.68h-10.68V520.86z M699.36,539.37 c3.64,0,5.73-1.76,5.73-4.57v-0.11c0-3.03-2.2-4.57-5.78-4.57h-6.99v9.25H699.36z"/></g></svg></span><span className="masthead-description">Creator management agency</span></header>
    <div id={staticView?'create':undefined} className="story-copy copy-world"><p className="eyebrow">I / Create</p><h2><span>{CHAPTERS[0].lead}</span><br/><span><em>{CHAPTERS[0].emphasis}</em></span></h2><p className="story-description">Keep posting what you already post.</p></div>
    <div id={staticView?'get-seen':undefined} className="story-copy copy-attention"><p className="eyebrow">II / Get Seen</p><h2><span>{CHAPTERS[1].lead}</span><br/><span><em>{CHAPTERS[1].emphasis}</em></span></h2><p className="story-description">Every like is someone asking to get closer.</p></div>
    <div className="scene-shadow" aria-hidden="true"/><div className="scene-viewport"><div className="social-plane"><div className="glass-surface" aria-hidden="true"/><div className="instagram-window"><div className="instagram-profile-page"><InstagramPost staticView={staticView}/><InstagramProfile staticView={staticView} openPasses={openPasses}/><div className="featured-frame"><img className="featured-photo" src={active ? media('poolside-post.webp') : ''} width="1280" height="720" loading="lazy" decoding="async" alt="Maya beside the pool, the featured photograph in her post and profile"/></div></div>{!staticView&&<InstagramInbox/>}</div>{!staticView&&<ProfileNavigation/>}</div></div>
    <div className="reaction-field" aria-hidden="true"><div className="reaction reaction-follow"><span className="reaction-icon"><UserPlus size={22}/></span><div><strong>They’re here for you.</strong><span className="reaction-followers">New people. New possibilities.</span></div></div><div className="reaction reaction-like"><span className="reaction-icon"><Heart size={22} weight="fill"/></span><div><strong><b className="reaction-likes">24</b> likes</strong><span>Your moment is travelling.</span></div></div></div>
    <div id={staticView?'connect':undefined} className="story-copy copy-outcome">{staticView&&<p className="static-demo-label">Illustrative creator story · Demo metrics</p>}<p className="eyebrow">III / Connect</p><h2><span>{CHAPTERS[2].lead}</span><br/><span><em>{CHAPTERS[2].emphasis}</em></span></h2><p className="story-description">Your dedicated team replies 24/7, in your voice.</p><div className="closing-metrics"><p><strong>{creator.views}</strong><span>views</span></p><p><strong>{(creator.newFollowers/1000).toFixed(1)}K</strong><span>new followers</span></p><p><strong>{creator.finalLikes.toLocaleString('en-US')}</strong><span>likes</span></p></div></div>
    {staticView&&<InstagramInbox/>}<div id={staticView?'unlock':undefined} className="story-copy copy-unlock"><p className="eyebrow">IV / Unlock</p><h2><span>{CHAPTERS[3].lead}</span><br/><span><em>{CHAPTERS[3].emphasis}</em></span></h2></div><PassesLanding/><BusinessStory staticView={staticView}/>
    <div className="story-cursor" aria-hidden="true"><Cursor className="desktop-cursor" weight="fill" size={34}/><HandPointing className="mobile-touch" weight="fill" size={43}/></div><span className="link-ripple" aria-hidden="true"/>
    <footer className="story-footer"><span className="story-chapter">{chapterLabel(0)}</span><span className="demo-label">Illustrative creator story · Demo metrics</span>{replay&&<button className="replay" onClick={replay}><span>Replay the story</span><i className="replay-orb"><ArrowCounterClockwise size={13} weight="light"/></i></button>}</footer><div className="story-progress" aria-hidden="true">{CHAPTERS.map(chapter=><span key={chapter.numeral}/>)}</div>
  </section>;
}
