import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
const src=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
vm.runInThisContext(src('member-model.js'));
const M=globalThis.GTZMemberModel;
const now=Date.parse('2026-11-20T00:00:00Z');
const sample={version:1,name:'감띠 팬',character:3,number:'GTZ - 0008',issuedAt:new Date(now).toISOString()};
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<.00001,`${actual} ≠ ${expected}`);
test('existing license and legacy IDs, invalid licenses denied',()=>{
  assert.deepEqual(M.license(sample),sample);
  assert.ok(M.license({...sample,number:'GTZ-ABC234-XYZ567'}));
  for(const bad of [null,{}, {...sample,character:14},{...sample,number:'GTZ - 0000'},{...sample,issuedAt:'invalid'},{...sample,name:''}])assert.equal(M.license(bad),null);
  assert.deepEqual(M.readLicense({getItem:()=>JSON.stringify(sample)}),sample);
  assert.equal(M.readLicense({getItem:()=>'{broken'}),null);
});
test('retired pet model is no longer exposed',()=>{assert.equal(M.pet,undefined);assert.equal(M.petKey,undefined);});
test('real gravity vector measurement, rotation and calibration',()=>{
  near(M.measure(0,0,9.8).flat,0);
  near(M.measure(0,0,-9.8).flat,0);
  near(M.measure(0,9.8,0).edge,90);
  near(M.measure(0,-9.8,0).edge,-90);
  near(M.measure(0,4.9,Math.sqrt(9.8**2-4.9**2)).flat,30);
  near(M.measure(4.9,0,Math.sqrt(9.8**2-4.9**2),90).edge,-30);
  const diagonal=M.measure(4.9,4.9,Math.sqrt(9.8**2-2*4.9**2));near(diagonal.flat,45);
  const zero={x:diagonal.x,y:diagonal.y,edge:diagonal.edge,normal:diagonal.normal};
  near(M.relative(diagonal,zero).flat,0);
  assert.equal(M.measure(0,0,0),null);
});
test('Member HTML contains all implementation targets and install entry',()=>{
  const html=src('member.html'),ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  for(const file of ['member.js','member-level.js']){
    for(const [,id] of src(file).matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.has(id),file+': missing '+id);
  }
  assert.match(html,/id="member-unlocked" hidden/);
  assert.match(html,/data-member-view="radar" hidden/);
  assert.match(html,/data-member-view="level" hidden/);
  const manifest=JSON.parse(src('member.webmanifest'));
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.start_url,'./member.html#hub');
});
test('Member UI controls and offline versions stay in sync',()=>{
  const html=src('member.html'),sw=src('member-sw.js'),version=/const VERSION='([^']+)'/.exec(sw)[1];
  for(const file of ['member.css','member-model.js','member.js','member-level.js','fry-radar.js','fry-radar.css','member.webmanifest']){
    assert.ok(html.includes(file+'?v='+version),file+' must match the offline cache version');
  }
  assert.ok(!html.includes("member-pocket.js"));
  assert.ok(!html.includes('data-member-view="pocket"'));
  for(const id of ["radar-list","radar-archive-list","radar-preview-list","radar-admin"])assert.ok(html.includes(`id="${id}"`));
  assert.match(html,/id="level-start" type="button" aria-pressed="false"/);
  assert.match(html,/id="level-board" data-mode="flat"/);
  assert.equal((html.match(/id="level-start"/g)||[]).length,1);
  assert.equal((html.match(/id="member-avatar"/g)||[]).length,1);
  assert.match(src('member.css'),/prefers-reduced-motion:reduce/);
});
test('Member navigation reveals only the authorized view and animates route changes',()=>{
  class Element {
    constructor(name){this.dataset={memberView:name};this.hidden=true;this.textContent='';this.attributes={};this.listeners={};this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c)};}
    getAttribute(k){return this.attributes[k]??null}
    set src(s){this.attributes.src=s}
    addEventListener(type,fn){this.listeners[type]=fn}
    querySelector(){return {focus(){}}}
  }
  const ids=new Map(),get=id=>{if(!ids.has(id))ids.set(id,new Element());return ids.get(id)};
  const pages=['hub','radar','level'].map(n=>new Element(n)),listeners={};
  const location={hash:'#radar'},data=new Map([[M.KEY,JSON.stringify(sample)]]);
  const window={addEventListener:(name,fn)=>listeners[name]=fn,scrollTo(){},isSecureContext:false};
  vm.runInNewContext(src('member.js'),{GTZMemberModel:M,document:{getElementById:get,querySelectorAll:()=>pages,addEventListener(){},title:''},location,localStorage:{getItem:k=>data.get(k)||null},navigator:{},window});
  assert.equal(window.GTZMember.active,'radar');
  assert.equal(get('member-avatar').getAttribute('src'),M.art(sample.character));
  assert.equal(pages[1].hidden,false);assert.equal(pages[0].hidden,true);
  assert.ok(pages[1].classes.has('is-entering'));
  location.hash='#level';listeners.hashchange();
  assert.equal(window.GTZMember.active,'level');assert.equal(pages[1].hidden,true);assert.equal(pages[2].hidden,false);
  assert.ok(pages[2].classes.has('is-entering'));assert.ok(!pages[1].classes.has('is-entering'));
  location.hash='#post-item';listeners.hashchange();assert.equal(window.GTZMember.active,'radar');
  location.hash='#radar-admin';listeners.hashchange();assert.equal(window.GTZMember.active,'radar');
  location.hash='#pocket';listeners.hashchange();assert.equal(window.GTZMember.active,'hub');
  data.delete(M.KEY);listeners.pageshow();assert.equal(get('member-locked').hidden,false);assert.equal(get('member-unlocked').hidden,true);assert.ok(pages.every(p=>p.hidden));
});


test('Radar only fetches when authorized and active; leaving aborts requests',()=>{
  const requests=[],listeners={};let active=false,registered;
  const el={addEventListener(){},value:''};
  const ids=new Set(['radar-list','radar-archive-list','radar-health','radar-search','radar-category','radar-sort','radar-updated']);
  const window={GTZMember:{isActive:name=>active&&name==='radar',register(name,h){assert.equal(name,'radar');registered=h}},addEventListener(name,fn){listeners[name]=fn},setInterval:()=>1,clearInterval(){}};
  vm.runInNewContext(src('fry-radar.js'),{window,document:{getElementById:id=>ids.has(id)?el:null,querySelector:()=>null,addEventListener(){},hidden:false},location:{hash:'#radar'},fetch:(url,opt)=>{requests.push({url,signal:opt.signal});return new Promise(()=>{})},setTimeout:()=>1,clearTimeout(){},clearInterval(){},AbortController});
  assert.ok(registered);
  listeners.focus();assert.equal(requests.length,0);
  active=true;registered.enter();assert.equal(requests.length,2);
  active=false;registered.leave();assert.ok(requests.every(r=>r.signal.aborted));
  listeners.online();assert.equal(requests.length,2);
});
