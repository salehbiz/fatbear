import { AnimatedFooter } from './ui/animated-footer';
import { WhatsappLogo } from '@phosphor-icons/react';
import './ui/form.css';

const WHATSAPP_NUMBER = '19203787572';
const WHATSAPP_MESSAGE = 'Hi Fat Bear, I’m a creator and I’d like to talk about running my paywall platform.';
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export default function Belong({jump}:{jump?:(world:number)=>void}) {
 return <section id="belong" className="belong" aria-label="Talk to Fat Bear Agency">
  <div id="application" className="application-area application-simple"><div className="application-intro"><h2>Talk to <em>us.</em></h2><p>Message us on WhatsApp. We map your platform, you approve every launch.</p></div>
   <div className="membership-form">
    <a className="membership-submit whatsapp-cta" href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"><span><WhatsappLogo size={20} weight="fill" aria-hidden="true"/>Chat on WhatsApp</span></a>
   </div>
  </div>
  <AnimatedFooter jump={jump}/>
 </section>;
}
