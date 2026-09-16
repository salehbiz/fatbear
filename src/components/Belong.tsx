import { AnimatedFooter } from './ui/animated-footer';
import { useRef, useState } from 'react';
import { submitApplication, validateApplication } from '../lib/application.mjs';
import { Form, Input, SubmitButton } from './ui/form';

export default function Belong({jump}:{jump?:(world:number)=>void}) {
 const formId=import.meta.env.VITE_FORMSPREE_FORM_ID;
 const [status,setStatus]=useState<'idle'|'submitting'|'success'|'error'>('idle');
 const [message,setMessage]=useState('');
 const [errors,setErrors]=useState<Record<string,string>>({});
 const busy=useRef(false),feedback=useRef<HTMLParagraphElement>(null);
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy.current)return;
  const form=event.currentTarget,values=Object.fromEntries(new FormData(form)),invalid=validateApplication(values);
  setErrors(invalid);
  if(Object.keys(invalid).length){(form.elements.namedItem(Object.keys(invalid)[0]) as HTMLElement)?.focus();return;}
  busy.current=true;setStatus('submitting');setMessage('Sending your application…');
  try {setMessage(await submitApplication(formId,values));setStatus('success');}
  catch(error){setMessage((error as Error).message);setStatus('error');}
  finally{busy.current=false;requestAnimationFrame(()=>feedback.current?.focus({preventScroll:true}));}
 }
 return <section id="belong" className="belong" aria-label="Fat Bear membership application">
  <div id="application" className="application-area application-simple"><div className="application-intro"><h2>Apply to <em>join.</em></h2></div>
   <Form onSubmit={submit} noValidate aria-label="Membership application" aria-busy={status==='submitting'}>
    {status!=='success'&&<><label htmlFor="apply-email">Email<Input id="apply-email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required maxLength={254} aria-invalid={!!errors.email} aria-describedby={errors.email?'email-error':undefined}/>{errors.email&&<span className="field-error" id="email-error">{errors.email}</span>}</label>
    <label className="application-trap" aria-hidden="true">Leave this blank<input name="_gotcha" tabIndex={-1} autoComplete="off"/></label>
    <SubmitButton type="submit" loading={status==='submitting'} disabled={!formId}>Submit</SubmitButton></>}
    <p ref={feedback} tabIndex={-1} className={`application-feedback ${status}`} role={status==='error'?'alert':'status'} aria-live="polite">{message}</p>
   </Form>
  </div>
  <AnimatedFooter jump={jump}/>
 </section>;
}
