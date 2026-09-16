import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Compile the actual loader for Node, substituting only the browser asset URL resolver.
const source = readFileSync(new URL('../src/lib/FrameCache.ts', import.meta.url),'utf8')
  .replace("'./math.mjs'", JSON.stringify(new URL('../src/lib/math.mjs',import.meta.url).href))
  .replace("import { media } from './media';", "const media = p => 'https://test.invalid/' + p;");
const compiled = ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const { FrameCache } = await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const flush = () => new Promise(r=>setImmediate(r));

test('separate film paths and releasing a chapter preserve bounded reverse loading',async()=>{
 const fetchBefore=globalThis.fetch,bitmapBefore=globalThis.createImageBitmap,urls=[],images=[];
 globalThis.fetch=async url=>{urls.push(url);return {ok:true,blob:async()=>new Blob()};};
 globalThis.createImageBitmap=async()=>{const image={closed:false,close(){this.closed=true;}};images.push(image);return image;};
 const cache=new FrameCache(287,20,()=>{},n=>`business/frames/${String(n+1).padStart(4,'0')}.jpg`);
 try{
  cache.request(200);await flush();assert.equal(cache.nearest().index,200);
  cache.release();assert.equal(cache.stats().decoded,0);assert.ok(images.every(i=>i.closed));
  cache.request(20);await flush();assert.equal(cache.nearest().index,20);assert.ok(cache.stats().decoded<=20);
  assert.ok(urls.every(u=>u.includes('/business/frames/')&&u.endsWith('.jpg')));
 }finally{cache.destroy();globalThis.fetch=fetchBefore;globalThis.createImageBitmap=bitmapBefore;}
});

test('cache evicts on jumps, remains bounded, and closes every bitmap on destruction', async () => {
  const fetchBefore = globalThis.fetch, bitmapBefore = globalThis.createImageBitmap;
  const images=[];
  globalThis.fetch = async () => ({ ok:true, blob:async()=>new Blob() });
  globalThis.createImageBitmap = async () => { const image={closed:false,close(){this.closed=true;}}; images.push(image); return image; };
  const cache=new FrameCache(169,24,()=>{});
  try {
    for(const frame of [0,90,169,80,1]) { cache.request(frame); await flush(); assert.ok(cache.stats().decoded<=24); assert.equal(cache.nearest().index,frame); }
    assert.ok(images.some(i=>i.closed));
    cache.destroy(); assert.ok(images.every(i=>i.closed));
  } finally { cache.destroy(); globalThis.fetch=fetchBefore; globalThis.createImageBitmap=bitmapBefore; }
});

test('late decode completion after teardown is disposed, not published', async () => {
  const fetchBefore = globalThis.fetch, bitmapBefore = globalThis.createImageBitmap;
  const pending=[], images=[]; let updates=0;
  globalThis.fetch = async () => ({ok:true,blob:async()=>new Blob()});
  globalThis.createImageBitmap = () => new Promise(resolve=>pending.push(resolve));
  const cache=new FrameCache(169,24,()=>updates++);
  try {
    cache.request(50); await flush(); cache.destroy();
    for (const resolve of pending) {const image={closed:false,close(){this.closed=true;}}; images.push(image); resolve(image);}
    await flush(); assert.equal(updates,0); assert.ok(images.every(i=>i.closed)); assert.equal(cache.stats().decoded,0);
  } finally { cache.destroy(); globalThis.fetch=fetchBefore; globalThis.createImageBitmap=bitmapBefore; }
});

test('a missing target frame falls back without a retry loop', async () => {
  const fetchBefore=globalThis.fetch, bitmapBefore=globalThis.createImageBitmap, warnBefore=console.warn;
  let attempts=0;
  globalThis.fetch = async url => { if(url.endsWith('0051.webp')) { attempts++; return {ok:false,status:404}; } return {ok:true,blob:async()=>new Blob()}; };
  globalThis.createImageBitmap=async()=>({close(){}}); console.warn=()=>{};
  const cache=new FrameCache(169,24,()=>{});
  try {cache.request(50); await flush(); cache.request(50); await flush(); assert.equal(attempts,1); assert.ok(cache.nearest()); assert.notEqual(cache.nearest().index,50);}
  finally{cache.destroy();globalThis.fetch=fetchBefore;globalThis.createImageBitmap=bitmapBefore;console.warn=warnBefore;}
});
