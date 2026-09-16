import type { CSSProperties } from 'react';
import { ArrowLeft, CaretDown, NotePencil, MagnifyingGlass, Camera, Plus } from '@phosphor-icons/react';
import { creator, conversations } from '../lib/creator.mjs';
import { media } from '../lib/media';
import { VerifiedBadge } from './InstagramProfile';

export default function InstagramInbox(){
 return <section className="inbox-page" aria-label="Illustrative audience messages">
  <header className="inbox-header"><ArrowLeft size={25} aria-hidden="true"/><strong>{creator.handle}<VerifiedBadge/><CaretDown size={14} aria-hidden="true"/></strong><NotePencil size={25} aria-hidden="true"/></header>
  <div className="inbox-search" aria-hidden="true"><MagnifyingGlass size={20}/><span>Search</span></div>
  <div className="inbox-notes" aria-hidden="true"><div className="inbox-note"><span className="note-bubble">Your note</span><span className="note-avatar"><img src={media('avatar.webp')} alt=""/><i><Plus size={13}/></i></span><span>Your note</span></div>{conversations.slice(0,3).map((person,i)=><div className="inbox-note" key={person.name}><span className="note-bubble">{['Need this 🤍','So good!','New favourite'][i]}</span><span className="fan-avatar" style={{'--avatar-color':person.color} as CSSProperties}><img src={media(`inbox/${person.avatar}`)} width="192" height="192" alt=""/></span><span>{person.name}</span></div>)}</div>
  <div className="inbox-tabs" aria-hidden="true"><span className="is-active">Primary <b>8</b></span><span>General</span><span>Requests <b>12</b></span></div>
  <div className="inbox-messages"><div className="conversation-list">{conversations.map((person,i)=><article className={`conversation${person.key?' conversation-key':''}`} key={person.name} data-conversation={i}><span className="fan-avatar" style={{'--avatar-color':person.color} as CSSProperties} aria-hidden="true"><img src={media(`inbox/${person.avatar}`)} width="192" height="192" alt=""/></span><div className="conversation-text"><div><strong>{person.name}</strong><span>{person.time}</span></div><p>{person.message}</p></div><i className="unread-dot" aria-label="Unread"/><Camera className="conversation-camera" size={24} aria-hidden="true"/></article>)}</div></div>
 </section>;
}
