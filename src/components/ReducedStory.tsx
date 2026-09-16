import { CHAPTERS } from '../lib/chapters.mjs';
import InstagramPost from './InstagramPost';
import InstagramProfile from './InstagramProfile';
import InstagramInbox from './InstagramInbox';
import PassesLanding from './PassesLanding';
import BusinessStory from './BusinessStory';

export default function ReducedStory(){
 return <div className="reduced-chapters">{CHAPTERS.slice(0,5).map((c,i)=><section id={c.id} className={`reduced-chapter reduced-${c.id}`} key={c.id} style={{backgroundColor:'var(--page-background)'}} aria-labelledby={`heading-${c.id}`}>
  <header><p className="eyebrow">{c.numeral} / {c.name}</p><h2 id={`heading-${c.id}`}>{c.lead}<br/><em>{c.emphasis}</em></h2></header>
  {i===0&&<div className="social-plane"><InstagramPost staticView/></div>}
  {i===1&&<div className="social-plane"><InstagramProfile staticView/></div>}
  {i===2&&<InstagramInbox/>}
  {i===3&&<PassesLanding/>}
  {i===4&&<BusinessStory staticView/>}
  <p className="reduced-demo">Illustrative creator story · Demo metrics</p>
 </section>)}</div>;
}
