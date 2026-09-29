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

test('decoded previews stay within a window of the playhead and come back after a jump', async () => {
  const fetchBefore=globalThis.fetch, bitmapBefore=globalThis.createImageBitmap;
  const images=[];
  globalThis.fetch = async url => url.includes('/full/') ? ({ok:false,status:404}) : ({ok:true,blob:async()=>new Blob([url])});
  globalThis.createImageBitmap = async () => { const image={closed:false,close(){this.closed=true;}}; images.push(image); return image; };
  const cache=new FrameCache(169,24,()=>{},n=>`full/${n}.webp`,n=>`preview/${n}.webp`);
  try {
    cache.request(0);
    for (let i=0;i<400;i++) await flush();
    assert.equal(cache.stats().previews,170);
    assert.ok(cache.stats().previewDecoded<=49);
    cache.request(169); for (let i=0;i<50;i++) await flush();
    assert.ok(cache.stats().previewDecoded<=49);
    assert.ok(images.some(i=>i.closed));
    assert.equal(cache.nearest().index,169);
  } finally { cache.destroy(); globalThis.fetch=fetchBefore; globalThis.createImageBitmap=bitmapBefore; }
});

test('fetch order follows the Vaultfy hero: sharp playhead, previews, sharp window, rest of previews, bulk', async () => {
  const fetchBefore=globalThis.fetch, bitmapBefore=globalThis.createImageBitmap;
  const order=[];
  globalThis.fetch = async url => { order.push(url.replace('https://test.invalid/','')); return {ok:true,blob:async()=>new Blob()}; };
  globalThis.createImageBitmap = async () => ({close(){}});
  const cache=new FrameCache(169,24,()=>{},n=>`full/${n}`,n=>`preview/${n}`);
  try {
    cache.request(30);
    for (let i=0;i<600;i++) await flush();
    const at = u => order.indexOf(u);
    assert.equal(order[0],'full/30');
    // Opening: the playhead and the frames just ahead come sharp before anything else.
    assert.ok(at('full/31')<at('preview/0') && at('full/32')<at('preview/0'));
    // Previews around the playhead, then the stride-8/4 passes, before the sharp window beyond the opening.
    assert.ok(at('preview/45')<at('full/42'));
    assert.ok(at('preview/168')<at('full/42'));
    // The remaining previews finish before bulk full-quality streaming starts.
    assert.ok(at('preview/167')<at('full/100'));
    // Everything ends up loaded: the whole film streams at full quality once the page has loaded.
    assert.equal(order.filter(u=>u.startsWith('full/')).length,170);
    assert.equal(cache.nearest().index,30);
  } finally { cache.destroy(); globalThis.fetch=fetchBefore; globalThis.createImageBitmap=bitmapBefore; }
});

test('a failing full-quality tier steps down to the fallback once', async () => {
  const fetchBefore=globalThis.fetch, bitmapBefore=globalThis.createImageBitmap;
  const urls=[];
  globalThis.fetch = async url => { urls.push(url); return url.includes('/hq/') ? {ok:false,status:404} : {ok:true,blob:async()=>new Blob()}; };
  globalThis.createImageBitmap = async () => ({close(){}});
  const cache=new FrameCache(40,12,()=>{},n=>`hq/${n}`,undefined,n=>`lite/${n}`);
  try {
    cache.request(10); for (let i=0;i<50;i++) await flush();
    assert.equal(cache.stats().fallenBack,true);
    assert.equal(urls.filter(u=>u.includes('/hq/')).length<=6,true);
    assert.equal(cache.nearest().index,10);
  } finally { cache.destroy(); globalThis.fetch=fetchBefore; globalThis.createImageBitmap=bitmapBefore; }
});

test('the opening holds the poster, then sharp frames, and never a nearby preview', async () => {
  const fetchBefore=globalThis.fetch, bitmapBefore=globalThis.createImageBitmap;
  const gate=[];
  globalThis.fetch = async url => { if (url.includes('/full/')) await new Promise(r=>gate.push(r)); return {ok:true,blob:async()=>new Blob([url])}; };
  globalThis.createImageBitmap = async blob => ({src:await blob.text(),close(){}});
  const cache=new FrameCache(169,24,()=>{},n=>`full/${n}`,n=>`preview/${n}`);
  try {
    cache.request(0); for (let i=0;i<300;i++) await flush();
    assert.equal(cache.nearest(),undefined);
    gate.splice(0).forEach(r=>r()); for (let i=0;i<50;i++) await flush();
    assert.match(cache.nearest().image.src,/full\/0$/);
    cache.request(5); for (let i=0;i<5;i++) await flush();
    assert.match(cache.nearest().image.src,/full\//);
    cache.request(120); for (let i=0;i<20;i++) await flush();
    assert.match(cache.nearest().image.src,/preview\/120$/);
  } finally { gate.splice(0).forEach(r=>r()); cache.destroy(); globalThis.fetch=fetchBefore; globalThis.createImageBitmap=bitmapBefore; }
});
