import test from 'node:test';
import assert from 'node:assert/strict';
import {validateApplication,submitApplication,APPLICATION_SUCCESS} from '../src/lib/application.mjs';
const values={email:'demo@example.com',_gotcha:''};
test('an email alone is a complete application and invalid email is rejected',()=>{
 assert.deepEqual(validateApplication(values),{});
 assert.equal(Object.keys(validateApplication({})).length,1);
 assert.ok(validateApplication({email:'invalid'}).email);
 assert.ok(validateApplication({email:'  '}).email);
});
test('missing configuration and spam never send or report success',async()=>{
 const noFetch=()=>{throw Error('must not fetch');};
 await assert.rejects(submitApplication('',values,noFetch),/not open/);
 await assert.rejects(submitApplication('form-id',{...values,_gotcha:'bot'},noFetch),/couldn’t send/);
});
test('confirmed successful delivery uses the configured endpoint and exact success copy',async()=>{
 const result=await submitApplication('test-id',values,async(url,options)=>{
  assert.equal(url,'https://formspree.io/f/test-id');assert.equal(options.method,'POST');
  assert.deepEqual(JSON.parse(options.body),values);assert.equal(options.headers.Accept,'application/json');return {ok:true};
 });assert.equal(result,APPLICATION_SUCCESS);
});
test('server failure and network failure preserve the input and report retryable errors',async()=>{
 const original={...values};
 await assert.rejects(submitApplication('test-id',values,async()=>({ok:false,status:422})),/saved here/);
 await assert.rejects(submitApplication('test-id',values,async()=>{throw Error('offline');}),/Connection interrupted/);
 await assert.rejects(submitApplication('test-id',values,async()=>({ok:false,status:429})),/wait a moment/);
 assert.deepEqual(values,original);
});
