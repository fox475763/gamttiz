import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
const root=new URL('../',import.meta.url);
const path=fs.existsSync(new URL('site-features.js',root))?'site-features.js':'license-v6/site-features.js';
const script=fs.readFileSync(new URL(path,root),'utf8');
const wallet=script.slice(script.indexOf('const walletMedia='),script.lastIndexOf('})();'));
const KEY='gamttiz-license-shake-enabled-v1',LICENSE='gamttiz-my-license-v1';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('wallet presentation is separate, composited and supports all 16 characters',()=>{
  const css=fs.readFileSync(new URL('license-wallet.css',root),'utf8');
  assert.match(wallet,/버터갈릭감띠','매콤감띠'/);
  assert.doesNotMatch(wallet,/walletStyle\.textContent/);
  assert.match(css,/gtz-wallet-reflection 8s/);
  assert.match(css,/assets\/license\/reflection\.svg/);
  assert.match(css,/translate3d\(-16%,-12%,0\)/);
  assert.doesNotMatch(css,/backdrop-filter\s*:/);
  assert.match(wallet,/gtz-wallet-visibility/);
});
function createPage(storage,permission='granted',activationKnown=false,withMount=true){
  const elements=[],timers=new Map();let clock=0,count=0,requests=0,interaction=false,mode=permission,prompts=0;
  class El{
    constructor(cls=''){this.cls=cls;this.children=[];this.attrs={};this.events=new Map();this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),contains:c=>this.classes.has(c),toggle:(c,b)=>b?this.classes.add(c):this.classes.delete(c)};this.contentWindow={postMessage(){}};elements.push(this);}
    append(...children){this.children.push(...children);}
    replaceChildren(...children){this.children=children;}
    setAttribute(k,v){this.attrs[k]=v;}
    addEventListener(k,f){this.events.set(k,f);}
    removeEventListener(k,f){if(this.events.get(k)===f)this.events.delete(k);}
    fire(k,e={}){return this.events.get(k)?.(e);}
    getBoundingClientRect(){return {height:600};}
  }
  const doc=new El(),win=new El(),mount=new El(),body=new El(),html=new El();
  doc.getElementById=id=>id==='license-shake-setting-mount'&&withMount?mount:null;doc.hidden=false;doc.body=body;doc.documentElement=html;doc.head=new El();doc.createElement=tag=>new El(tag);
  win.DeviceMotionEvent={requestPermission:async()=>{requests++;if(mode==='gesture'){if(!interaction)throw Error('NotAllowedError');prompts++;}return mode==='denied'?'denied':'granted';}};
  const ctx={window:win,document:doc,navigator:{maxTouchPoints:5,...(activationKnown?{userActivation:{get isActive(){return interaction}}}:{})},location:{origin:'https://example.com'},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},make:(tag,cls)=>new El(cls),dock:{dataset:{mode:'closed'}},setMode(){},matchMedia:q=>({matches:!q.includes('reduced'),addEventListener(){}}),performance:{now:()=>clock},setTimeout:(fn,ms)=>{timers.set(++count,{fn,ms});return count},clearTimeout:id=>timers.delete(id)};
  vm.runInNewContext(wallet,ctx);
  const one=c=>elements.find(e=>e.cls===c);
  return {button:one('gtz-shake-button'),reconnect:one('gtz-shake-reconnect'),recovery:one('gtz-shake-recovery'),sheet:one('gtz-wallet-sheet'),status:one('gtz-shake-status'),win,doc,get requests(){return requests},get prompts(){return prompts},setPermission:p=>{mode=p},tap:async()=>{interaction=true;await doc.fire('click',{isTrusted:true,target:{closest:()=>null}});interaction=false;},press:async control=>{interaction=true;await control.fire('click');interaction=false;},runWatchdog:async()=>{for(const [id,t] of [...timers])if(t.ms===1200){timers.delete(id);await t.fn();}},shake:()=>{clock+=150;win.fire('devicemotion',{acceleration:{x:18,y:0,z:0}});clock+=150;win.fire('devicemotion',{acceleration:{x:-18,y:0,z:0}});}};
}
const saved=()=>new Map([[LICENSE,JSON.stringify({name:'감띠',number:'GTZ - 0001'})]]);
test('activation survives destruction and reconstruction of the page',async()=>{
  const store=saved(),first=createPage(store);
  await first.button.fire('click');assert.equal(store.get(KEY),'1');assert.equal(first.button.attrs['aria-pressed'],'true');
  const reopened=createPage(store);assert.equal(reopened.button.attrs['aria-pressed'],'true');await tick();
  assert.equal(reopened.requests,0);assert.equal(reopened.reconnect.hidden,false);reopened.shake();assert.ok(reopened.sheet.classes.has('is-open'));assert.equal(reopened.reconnect.hidden,true);
  await reopened.button.fire('click');assert.equal(store.get(KEY),'0');
  const off=createPage(store);await tick();assert.equal(off.requests,0);assert.equal(off.button.attrs['aria-pressed'],'false');off.shake();assert.ok(!off.sheet.classes.has('is-open'));
});
test('Safari-style user gesture requirement never clears a stored preference',async()=>{
  const store=saved();store.set(KEY,'1');
  const reopened=createPage(store,'gesture');await tick();
  assert.equal(reopened.button.attrs['aria-pressed'],'true');assert.equal(store.get(KEY),'1');assert.equal(reopened.reconnect.hidden,false);
  await reopened.tap();assert.equal(reopened.requests,0);await reopened.press(reopened.reconnect);assert.equal(reopened.requests,1);assert.equal(reopened.reconnect.hidden,true);reopened.shake();assert.ok(reopened.sheet.classes.has('is-open'));
  const refused=createPage(store,'denied');await tick();await refused.press(refused.reconnect);assert.equal(store.get(KEY),'1');assert.equal(refused.button.attrs['aria-pressed'],'true');
  await refused.button.fire('click');assert.equal(store.get(KEY),'0');
});
test('issuance animation, page lifecycle and arbitrary taps never request permission',async()=>{
  const store=new Map([[KEY,'1']]),page=createPage(store,'gesture');await tick();
  page.doc.body.classList.add('license-animating');store.set(LICENSE,JSON.stringify({name:'감띠',number:'GTZ - 0002'}));
  page.win.fire('gamttiz:license-change');page.win.fire('pageshow');await page.tap();await page.press(page.button);await page.press(page.reconnect);assert.equal(page.requests,0);
  page.doc.body.classList.remove('license-animating');page.win.fire('pageshow');await page.tap();assert.equal(page.requests,0);
  await page.press(page.reconnect);assert.equal(page.requests,1);
});
test('no license suppresses shake activation; Member retains wallet gesture',async()=>{
  const store=new Map([[KEY,'1']]);const noCard=createPage(store);await tick();assert.equal(noCard.requests,0);noCard.shake();assert.ok(!noCard.sheet.classes.has('is-open'));
  const licensed=saved();licensed.set(KEY,'1');const page=createPage(licensed);await tick();page.win.GTZMember={active:'radar'};page.shake();assert.ok(page.sheet.classes.has('is-open'));
});
test('cold Safari launch reuses a grant silently; no permission popup',async()=>{
  const store=saved();store.set(KEY,'1');const page=createPage(store,'granted',true,false);
  await page.runWatchdog();assert.equal(page.requests,1);assert.equal(page.prompts,0);
  page.shake();assert.ok(page.sheet.classes.has('is-open'));assert.equal(page.recovery,undefined);assert.equal(store.get(KEY),'1');
});
test('expired Safari permission preserves preference without floating button',async()=>{
  const store=saved();store.set(KEY,'1');const page=createPage(store,'gesture',true,false);
  await page.tap();assert.equal(page.requests,0);assert.equal(page.recovery,undefined);
  await page.runWatchdog();assert.equal(page.requests,1);assert.equal(page.prompts,0);assert.equal(page.recovery,undefined);assert.equal(store.get(KEY),'1');
  const id=createPage(store,'gesture',true,true);await id.runWatchdog();
  assert.equal(id.reconnect.hidden,false);await id.press(id.reconnect);assert.equal(id.requests,2);assert.equal(id.prompts,1);id.shake();assert.ok(id.sheet.classes.has('is-open'));assert.equal(id.recovery,undefined);
});
test('foreground recovery re-arms and does not ask during issuance',async()=>{
  const store=saved();store.set(KEY,'1');const page=createPage(store,'gesture',true,false);
  page.doc.body.classList.add('license-animating');await page.runWatchdog();assert.equal(page.requests,0);
  page.doc.body.classList.remove('license-animating');page.doc.hidden=true;page.doc.fire('visibilitychange');page.doc.hidden=false;page.doc.fire('visibilitychange');
  await page.runWatchdog();assert.equal(page.requests,1);assert.equal(page.prompts,0);assert.equal(page.recovery,undefined);
});

