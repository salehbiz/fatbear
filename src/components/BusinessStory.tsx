import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { syncBusinessMetrics } from '../lib/business-metrics-view.mjs';
import { Check, Users, ShoppingBag, EnvelopeSimple, ArrowDownLeft, House, ChatCircle, Bell, Storefront, Gear, UploadSimple, ListBullets, CalendarBlank, VideoCamera, Tag, ChartLineUp, Wallet, CaretDown, PlusCircle, CheckCircle } from '@phosphor-icons/react';
import { creator, conversations } from '../lib/creator.mjs';
import { business, businessMetricsAt } from '../lib/business-motion.mjs';
import { media } from '../lib/media';
import { VerifiedBadge } from './InstagramProfile';
import EditorialField from './EditorialField';

export default function BusinessStory({staticView=false}:{staticView?:boolean}){
 const sectionRef=useRef<HTMLElement>(null);
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

 useLayoutEffect(()=>{
  if(staticView || !sectionRef.current)return;
  const p=Number(sectionRef.current.dataset.businessProgress || 0);
  syncBusinessMetrics(sectionRef.current,businessMetricsAt(p),false);
 });
 const final=staticView;
 const endCurve=Array.from({length:31},(_,i)=>`${i===0?"M":"L"}${600*i/30},${149-143*(i/30)**1.6}`).join(" ");
 return <section ref={sectionRef} className={`business-story${staticView?' business-static':''}`} aria-label="Maya’s illustrative creator business">
  <div className="business-paper"><EditorialField/></div>
  <aside className="purchase-notifications" aria-label="Illustrative purchases">
   {['Photo diary','Behind the scenes','Poolside collection','Photo diary','Studio collection','Behind the scenes'].map((product,i)=><div className="purchase-notification" key={i}><img src={active ? media(`inbox/${conversations[i].avatar}`) : ''} loading="lazy" decoding="async" alt=""/><div><header><span>Passes</span><small>now</small></header><strong>{conversations[i].name} bought {product.toLowerCase()}.</strong><p>Purchase confirmed <span>+$40</span></p></div></div>)}
  </aside>
  <div className="business-film"><div className="business-film-image"><img src={active ? media(`business/${staticView?'end':'crew-poster'}.webp`) : ''} width="1280" height="720" loading="lazy" decoding="async" alt="Maya’s photography crew working beside the pool"/>{!staticView&&<canvas width="1280" height="720" aria-hidden="true"/>}</div></div>
  <div id={staticView?'build':undefined} className="business-film-copy"><p className="eyebrow">V / Build</p><h2><span>You create.</span><br/><span><em>Your team takes it further.</em></span></h2><p className="crew-support">Creative, production, and marketing—working together around you.</p></div>
  <ul className="crew-roles" aria-label="The team behind the work">{['Creative & strategy','Content & production','Marketing & growth'].map((role,i)=><li className={`crew-role crew-role-${i}`} key={role}><span className="crew-role-dot" aria-hidden="true"/>{role}<i className="crew-connector" aria-hidden="true"/></li>)}</ul>
  <div className="business-copy business-copy-one"><p className="eyebrow">V / Build</p><h2><span>Behind the content.</span> <span><em>Inside the business.</em></span></h2></div>
  <div className="business-copy business-copy-two"><p className="eyebrow">V / Build</p><h2><span>More than attention.</span> <span><em>A new possibility.</em></span></h2></div>
  <div className="business-copy business-copy-end"><p className="eyebrow">V / Build</p><h2><span>Build something</span> <span><em>of your own.</em></span></h2></div>
  <section className="business-dashboard" aria-label="Illustrative creator dashboard">
   <aside className="passes-sidebar" aria-label="Illustrative creator navigation">
    <div className="passes-dashboard-logo"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M11 3h10a9 9 0 0 1 0 18H11V3ZM3 21h8v8H3z" fill="currentColor"/></svg><strong>passes</strong></div>
    <div className="passes-shortcuts" aria-hidden="true">{[House,ChatCircle,Bell,Storefront,Gear].map((Icon,i)=><span key={i}><Icon size={17}/>{i===1&&<i>9+</i>}</span>)}</div>
    <p>Creator tools</p>
    {[{Icon:UploadSimple,label:'Vault'},{Icon:ListBullets,label:'Lists'},{Icon:CalendarBlank,label:'Scheduler'},{Icon:VideoCamera,label:'Start Livestream'},{Icon:ChatCircle,label:'Welcome Messages'},{Icon:Tag,label:'Post Categories'},{Icon:Users,label:'Manage Memberships'}].map(({Icon,label})=><div className="passes-nav-item" key={label}><Icon size={16}/><span>{label}</span></div>)}
    <p>Monetization & insights</p>
    {[{Icon:Wallet,label:'Earnings'},{Icon:ChartLineUp,label:'Analytics'},{Icon:ShoppingBag,label:'Orders'}].map(({Icon,label})=><div className="passes-nav-item" key={label}><Icon size={16}/><span>{label}</span></div>)}
    <div className="passes-sidebar-account"><img src={media('avatar.webp')} loading="lazy" decoding="async" alt="Maya"/><span>Create</span><PlusCircle size={16}/></div>
   </aside>
   <div className="passes-workspace">
   <header className="dashboard-header"><div className="passes-tabs"><strong>Dashboard</strong><span>Explore</span></div><div className="dashboard-owner"><img src={media('avatar.webp')} loading="lazy" decoding="async" alt="Maya"/><span>{creator.handle}<VerifiedBadge/></span></div></header>
   <div className="passes-workspace-content">
   <div className="passes-welcome"><h3>Welcome Back Maya!</h3><span className="month-tag">This Month <CaretDown size={14}/></span></div>
   <div className="business-stats">
    <div><span>New Memberships</span><strong className="business-subscribers">{final?'2,000':'0'}</strong></div>
    <div><span>Content Purchases</span><strong className="business-purchases">{final?'750':'1'}</strong></div>
    <div><span>Membership Revenue</span><strong className="subscription-revenue">{final?'$50,000':'$0'}</strong></div>
    <div><span>Content Revenue</span><strong className="purchase-revenue">{final?'$30,000':'$40'}</strong></div>
   </div>
   <div className="dashboard-body"><div className="dashboard-finances">
    <div className="earnings-heading"><strong>Performance Metrics</strong><span className="performance-period">This Month</span></div>
    <span className="total-revenue-label">Total Revenue</span>
    <div className="business-earnings" role="img" aria-label={final?'80,000 dollars in illustrative monthly gross revenue':'40 dollars in illustrative monthly gross revenue'}><span className="currency">$</span><span className="earnings-readable sr-only">{final?'80,000':'40'}</span><span className="earnings-digits" aria-hidden="true">{[10000,1000,100,10,1].map(place=><span className="earnings-digit-group" data-place={place} key={place}><span className="earnings-digit-window"><span className="earnings-digit-strip" style={final?{transform:`translateY(-${Math.floor(business.earnings/place)%10}em)`}:undefined}>{Array.from({length:11},(_,n)=><span key={n}>{n%10}</span>)}</span></span>{place===1000&&<span className="earnings-comma">,</span>}</span>)}</span><span className="earnings-period">/ month</span></div>
    <p className="earnings-caption">Memberships + content purchases</p>
    <div className="revenue-chart" role="img" aria-label="Illustrative monthly earnings growth"><div className="chart-levels"><span>$80K</span><span>$40K</span><span>$0</span></div><svg viewBox="0 0 600 155" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="business-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#292929" stopOpacity=".24"/><stop offset="1" stopColor="#292929" stopOpacity="0"/></linearGradient></defs><path className="chart-grid" d="M0 6H600 M0 77H600 M0 149H600"/><path className="revenue-area" d={final?`${endCurve} L600,149 L0,149Z`:"M0 149L600 149Z"}/><path className="revenue-line" d={final?endCurve:"M0 149L600 149"}/><circle className="revenue-dot" cx="600" cy={final?6:149} r="4"/></svg><div className="chart-days"><span>01</span><span>08</span><span>15</span><span>22</span><span>30</span></div></div>
    <figure className="business-preview"><img src={active ? media('business/end.webp') : ''} loading="lazy" decoding="async" alt="Behind the scenes of Maya’s latest shoot"/><figcaption>Behind the scenes</figcaption></figure>
   </div><aside className="dashboard-activity"><div className="passes-onboarding"><div><strong>Onboarding</strong><span>5/5 completed</span></div><p><CheckCircle size={17} weight="fill"/>Set Up Your Profile</p><p><CheckCircle size={17} weight="fill"/>Create Memberships</p></div><div className="activity-heading"><span>Recent activity</span><i/>This Month</div><div className="business-transactions">{[{person:0,label:'Photo diary unlocked',amount:40},{person:1,label:'New subscriber',amount:25},{person:2,label:'Collection purchased',amount:40}].map((event,i)=><div className="business-transaction" key={i}><img src={active ? media(`inbox/${conversations[event.person].avatar}`) : ''} loading="lazy" decoding="async" alt=""/><div><strong>{conversations[event.person].name}</strong><span>{event.label}</span></div><b>+${event.amount}</b></div>)}</div><div className="messages-heading"><EnvelopeSimple size={17}/><span>Messages</span><small>Creator inbox</small></div><div className="business-messages">{[{person:0,text:'The full collection is so good 🤍'},{person:1,text:'Just subscribed. Can’t wait for more.'}].map(event=><div className="business-message" key={event.person}><img src={active ? media(`inbox/${conversations[event.person].avatar}`) : ''} loading="lazy" decoding="async" alt=""/><div><strong>{conversations[event.person].name}</strong><p>{event.text}</p></div><i/></div>)}</div></aside></div>
   </div><footer className="dashboard-footnote"><span>Illustrative month · Gross revenue</span><span>Subscriptions + content purchases</span></footer></div>
  </section>
  <div className="business-notifications" aria-hidden="true">{[{name:'Alex',text:'New subscriber',value:'+$25'},{name:'Amelia',text:'Collection purchased',value:'+$40'},{name:'Sophie',text:'New message',value:'',message:'The full collection is so good 🤍'},{name:'Liv',text:'Photo diary unlocked',value:'+$40'}].map((event,i)=><div className="business-toast" key={event.name} data-event={i}><span className="toast-icon"><ArrowDownLeft size={19}/></span><div><strong>{event.text}</strong><small>{'message' in event?event.message:`${event.name} · Your creator business`}</small></div><b>{event.value}</b></div>)}</div>
 </section>;
}
