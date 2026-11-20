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
function createPage(storage,permission='granted'){
  const elements=[];let clock=0,count=0,requests=0,interaction=false,mode=permission;
  class El{
    constructor(cls=''){this.cls=cls;this.children=[];this.attrs={};this.events=new Map();this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),contains:c=>this.classes.has(c),toggle:(c,b)=>b?this.classes.add(c):this.classes.delete(c)};this.contentWindow={postMessage(){}};elements.push(this);}
    append(...children){this.children.push(...children);}
    setAttribute(k,v){this.attrs[k]=v;}
    addEventListener(k,f){this.events.set(k,f);}
    fire(k,e={}){return this.events.get(k)?.(e);}
    getBoundingClientRect(){return {height:600};}
  }
  const doc=new El(),win=new El(),mount=new El(),body=new El(),html=new El();
  doc.getElementById=id=>id==='license-shake-setting-mount'?mount:null;doc.hidden=false;doc.body=body;doc.documentElement=html;
  win.DeviceMotionEvent={requestPermission:async()=>{requests++;if(mode==='gesture'&&!interaction)throw Error('NotAllowedError');return mode==='denied'?'denied':'granted';}};
  const ctx={window:win,document:doc,navigator:{maxTouchPoints:5},location:{origin:'https://example.com'},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},make:(tag,cls)=>new El(cls),dock:{dataset:{mode:'closed'}},setMode(){},matchMedia:q=>({matches:!q.includes('reduced'),addEventListener(){}}),performance:{now:()=>clock},setTimeout:()=>++count,clearTimeout(){}};
  vm.runInNewContext(wallet,ctx);
  const one=c=>elements.find(e=>e.cls===c);
  return {button:one('gtz-shake-button'),reconnect:one('gtz-shake-reconnect'),sheet:one('gtz-wallet-sheet'),status:one('gtz-shake-status'),win,doc,get requests(){return requests},setPermission:p=>{mode=p},tap:async()=>{interaction=true;await doc.fire('click',{isTrusted:true,target:{closest:()=>null}});interaction=false;},press:async control=>{interaction=true;await control.fire('click');interaction=false;},shake:()=>{clock+=150;win.fire('devicemotion',{acceleration:{x:18,y:0,z:0}});clock+=150;win.fire('devicemotion',{acceleration:{x:-18,y:0,z:0}});}};
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
test('no license and active Member measurement tools suppress shake activation',async()=>{
  const store=new Map([[KEY,'1']]);const noCard=createPage(store);await tick();assert.equal(noCard.requests,0);noCard.shake();assert.ok(!noCard.sheet.classes.has('is-open'));
  const licensed=saved();licensed.set(KEY,'1');const page=createPage(licensed);await tick();page.win.GTZMember={active:'level'};page.shake();assert.ok(!page.sheet.classes.has('is-open'));
});
