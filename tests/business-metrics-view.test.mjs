import test from 'node:test';
import assert from 'node:assert/strict';
import { syncBusinessMetrics } from '../src/lib/business-metrics-view.mjs';
import { businessMetricsAt } from '../src/lib/business-motion.mjs';

function fixture(){
 const nodes = new Map();
 const node = () => ({textContent:'',style:{},attributes:{},getAttribute(key){return this.attributes[key]??null;},setAttribute(key,value){this.attributes[key]=value;}});
 for(const name of ['earnings-readable','business-earnings','business-subscribers','business-purchases','subscription-revenue','purchase-revenue','revenue-line','revenue-area','revenue-dot'])nodes.set(`.${name}`,node());
 let groups;
 const replaceDigits=()=>{groups=[10000,1000,100,10,1].map(place=>({...node(),dataset:{place:String(place)},strip:node(),querySelector(){return this.strip;}}));};
 replaceDigits();
 return {querySelector:s=>nodes.get(s),querySelectorAll:()=>groups,replaceDigits};
}

test('same final total repairs replaced digits and a React-reset chart',()=>{
 const root=fixture(),m=businessMetricsAt(1);
 syncBusinessMetrics(root,m);
 root.replaceDigits();
 root.querySelector('.revenue-line').setAttribute('d','M0 149L600 149');
 root.querySelector('.revenue-dot').setAttribute('cy','149');
 root.querySelector('.earnings-readable').textContent='40';
 // Reapply exactly the same total: the old lastEarnings guard skipped this.
 syncBusinessMetrics(root,m);
 assert.deepEqual(root.querySelectorAll().map(g=>g.strip.style.transform),['translateY(-8em)','translateY(-0em)','translateY(-0em)','translateY(-0em)','translateY(-0em)']);
 assert.equal(root.querySelector('.earnings-readable').textContent,'80,000');
 assert.equal(root.querySelector('.revenue-dot').getAttribute('cy'),'6');
 assert.match(root.querySelector('.revenue-line').getAttribute('d'),/L600,6$/);
 assert.equal(root.querySelector('.subscription-revenue').textContent,'$50,000');
 assert.equal(root.querySelector('.purchase-revenue').textContent,'$30,000');
});

test('jumping to the endpoint settles digit motion, and reverse restores the first sale',()=>{
 const root=fixture();
 syncBusinessMetrics(root,businessMetricsAt(.75),true);
 assert.match(root.querySelectorAll()[0].strip.style.transition,/140ms/);
 syncBusinessMetrics(root,businessMetricsAt(1),false);
 assert.equal(root.querySelectorAll()[0].strip.style.transition,'none');
 syncBusinessMetrics(root,businessMetricsAt(.06),false);
 assert.equal(root.querySelector('.earnings-readable').textContent,'40');
 assert.deepEqual(root.querySelectorAll().map(g=>g.style.display),['none','none','none','flex','flex']);
 syncBusinessMetrics(root,businessMetricsAt(1),false);
 assert.equal(root.querySelector('.earnings-readable').textContent,'80,000');
});
