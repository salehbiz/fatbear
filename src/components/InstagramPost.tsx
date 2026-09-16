import { useRef, useState } from 'react';
import { BookmarkSimple, ChatCircle, DotsThree, Heart, House, MagnifyingGlass, PaperPlaneTilt, PlusSquare, VideoCamera } from '@phosphor-icons/react';
import { creator } from '../lib/creator.mjs';
import { media } from '../lib/media';
import { VerifiedBadge } from './InstagramProfile';

// Fictional creator and illustrative metrics; this is a local interactive story.
export default function InstagramPost({staticView=false}:{staticView?:boolean}) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const count = useRef<HTMLSpanElement>(null);
  function toggleLike() {
    const next = !liked;
    setLiked(next);
    if (count.current) {
      count.current.dataset.liked = String(Number(next));
      count.current.textContent = (Number(count.current.dataset.base || creator.initialLikes) + Number(next)).toLocaleString('en-US');
    }
  }
  return <article className="post-layer" aria-label="Maya's illustrative Instagram post">
    <header className="ig-top"><span className="ig-logotype">Instagram</span><div aria-hidden="true"><Heart size={23}/><PaperPlaneTilt size={23}/></div></header>
    <header className="post-header"><span className="avatar-ring"><img src={media('avatar.webp')} width="34" height="34" alt=""/></span><div><strong>{creator.handle}<VerifiedBadge/></strong><span>Original audio</span></div><DotsThree size={25} className="post-menu" aria-hidden="true"/></header>
    <div className="post-photograph">{staticView && <img className="static-post-photo" src={media('poolside-post.webp')} alt="Maya beside the sunlit pool"/>}</div>
    <div className="post-actions">
      <div className="action-row"><button className={liked ? 'icon-button liked' : 'icon-button'} aria-label={liked ? 'Unlike post' : 'Like post'} aria-pressed={liked} onClick={toggleLike}><Heart size={26} weight={liked ? 'fill' : 'regular'}/></button><span className="decorative-icon" aria-hidden="true"><ChatCircle size={26}/></span><span className="decorative-icon" aria-hidden="true"><PaperPlaneTilt size={26}/></span><button className="icon-button save-button" aria-label={saved ? 'Unsave post' : 'Save post'} aria-pressed={saved} onClick={() => setSaved(!saved)}><BookmarkSimple size={25} weight={saved ? 'fill' : 'regular'}/></button></div>
      <p className="like-count"><span ref={count} className="live-likes" data-base={creator.initialLikes} data-liked="0">{creator.initialLikes}</span> likes</p>
      <p className="post-caption"><strong>{creator.handle}</strong> {creator.caption}</p>
      <p className="post-time">JUST NOW</p>
    </div>
    <div className="ig-bottom" aria-hidden="true"><House size={24} weight="fill"/><MagnifyingGlass size={24}/><PlusSquare size={24}/><VideoCamera size={24}/><img src={media('avatar.webp')} alt=""/></div>
  </article>;
}
