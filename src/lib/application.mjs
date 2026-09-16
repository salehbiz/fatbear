export const APPLICATION_SUCCESS = 'Application received. Thank you.';
export function validateApplication(values) {
 /** @type {Record<string, string>} */
 const errors={};
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email?.trim()||'')) errors.email='Please enter a valid email address.';
 return errors;
}
export async function submitApplication(id, values, fetcher=fetch) {
 if(!id||!/^[-a-zA-Z0-9]+$/.test(id)) throw new Error('Applications are not open yet. Please check back soon.');
 if(Object.keys(validateApplication(values)).length) throw new Error('Please check the required fields.');
 if(values._gotcha) throw new Error('We couldn’t send your application. Please try again.');
 let response;
 try {
  response=await fetcher(`https://formspree.io/f/${id}`,{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify(values),signal:AbortSignal.timeout(20000)});
 } catch { throw new Error('Connection interrupted. Your answers are saved here. Please try again.'); }
 if(!response.ok) throw new Error(response.status===429?'Too many attempts. Please wait a moment and try again.':'We couldn’t send your application. Your answers are saved here. Please try again.');
 return APPLICATION_SUCCESS;
}
