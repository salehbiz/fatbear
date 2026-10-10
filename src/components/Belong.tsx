import { AnimatedFooter } from './ui/animated-footer';
import './ui/form.css';

const WHATSAPP_NUMBER = '19203787572';
const WHATSAPP_MESSAGE = 'Hi Fat Bear, I’m a creator and I’d like to get in touch.';
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export default function Belong({jump}:{jump?:(world:number)=>void}) {
 return <section id="belong" className="belong" aria-label="Get in touch with Fat Bear Agency">
  <div id="application" className="application-area application-simple"><div className="application-intro"><h2>Let’s build <em>your plan.</em></h2><p>30 minutes, no commitment. We map your biggest revenue opportunities, you approve every launch.</p></div>
   <div className="membership-form">
    <a className="membership-submit whatsapp-cta" href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"><span>Get in touch</span></a>
   </div>
  </div>
  <AnimatedFooter jump={jump}/>
 </section>;
}
