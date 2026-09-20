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
    <header className="story-masthead"><span>fatbear</span><span className="masthead-description">A membership club for creators</span></header>
    <div id={staticView?'create':undefined} className="story-copy copy-world"><p className="eyebrow">I / Create</p><h2><span>{CHAPTERS[0].lead}</span><br/><span><em>{CHAPTERS[0].emphasis}</em></span></h2><p className="story-description">A perspective only you can bring.</p></div>
    <div id={staticView?'get-seen':undefined} className="story-copy copy-attention"><p className="eyebrow">II / Get Seen</p><h2><span>{CHAPTERS[1].lead}</span><br/><span><em>{CHAPTERS[1].emphasis}</em></span></h2><p className="story-description">One connection becomes another.</p></div>
    <div className="scene-shadow" aria-hidden="true"/><div className="scene-viewport"><div className="social-plane"><div className="glass-surface" aria-hidden="true"/><div className="instagram-window"><div className="instagram-profile-page"><InstagramPost staticView={staticView}/><InstagramProfile staticView={staticView} openPasses={openPasses}/><div className="featured-frame"><img className="featured-photo" src={active ? media('poolside-post.webp') : ''} width="1280" height="720" loading="lazy" decoding="async" alt="Maya beside the pool, the featured photograph in her post and profile"/></div></div>{!staticView&&<InstagramInbox/>}</div>{!staticView&&<ProfileNavigation/>}</div></div>
    <div className="reaction-field" aria-hidden="true"><div className="reaction reaction-follow"><span className="reaction-icon"><UserPlus size={22}/></span><div><strong>They’re here for you.</strong><span className="reaction-followers">New people. New possibilities.</span></div></div><div className="reaction reaction-like"><span className="reaction-icon"><Heart size={22} weight="fill"/></span><div><strong><b className="reaction-likes">24</b> likes</strong><span>Your moment is travelling.</span></div></div></div>
    <div id={staticView?'connect':undefined} className="story-copy copy-outcome">{staticView&&<p className="static-demo-label">Illustrative creator story · Demo metrics</p>}<p className="eyebrow">III / Connect</p><h2><span>{CHAPTERS[2].lead}</span><br/><span><em>{CHAPTERS[2].emphasis}</em></span></h2><p className="story-description">An audience becomes a conversation.</p><div className="closing-metrics"><p><strong>{creator.views}</strong><span>views</span></p><p><strong>{(creator.newFollowers/1000).toFixed(1)}K</strong><span>new followers</span></p><p><strong>{creator.finalLikes.toLocaleString('en-US')}</strong><span>likes</span></p></div></div>
    {staticView&&<InstagramInbox/>}<div id={staticView?'unlock':undefined} className="story-copy copy-unlock"><p className="eyebrow">IV / Unlock</p><h2><span>{CHAPTERS[3].lead}</span><br/><span><em>{CHAPTERS[3].emphasis}</em></span></h2></div><PassesLanding/><BusinessStory staticView={staticView}/>
    <div className="story-cursor" aria-hidden="true"><Cursor className="desktop-cursor" weight="fill" size={34}/><HandPointing className="mobile-touch" weight="fill" size={43}/></div><span className="link-ripple" aria-hidden="true"/>
    <footer className="story-footer"><span className="story-chapter">{chapterLabel(0)}</span><span className="demo-label">Illustrative creator story · Demo metrics</span>{replay&&<button className="replay" onClick={replay}><span>Replay the story</span><i className="replay-orb"><ArrowCounterClockwise size={13} weight="light"/></i></button>}</footer><div className="story-progress" aria-hidden="true">{CHAPTERS.map(chapter=><span key={chapter.numeral}/>)}</div>
  </section>;
}
