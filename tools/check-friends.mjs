import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=p=>fs.readFileSync(p,'utf8');
const ctx=vm.createContext({Intl,Date});
vm.runInContext(src('friends-data.js'),ctx);
vm.runInContext(src('friends-profile.js'),ctx);
const {characters,number,image,dayKey,targetAngle}=ctx.GTZFriends;
test('14 complete, unique profiles and original illustrations',()=>{
 assert.equal(characters.length,14);
 assert.equal(new Set(characters.map(c=>c.name)).size,14);
 characters.forEach((c,i)=>{assert.equal(c.id,i+1);for(const key of ['origin','story','likes','habit','friend','quote','message','type'])assert.ok(c[key].length>0);assert.ok(c.story.length>85);assert.equal(image(c.id),'assets/illustrations/friend-'+number(c.id)+'.svg');assert.match(ctx.GTZProfile(c,{daily:true}),new RegExp('collection.html#friend-'+number(c.id)));});
});
test('Korea midnight changes the daily draw date',()=>{
 assert.equal(dayKey(new Date('2026-11-20T14:59:59Z')),'2026-11-20');
 assert.equal(dayKey(new Date('2026-11-20T15:00:00Z')),'2026-11-21');
});
test('Every selected segment lands at the top pointer, including repeated spins',()=>{
 let current=0;for(let id=1;id<=14;id++){let target=targetAngle(current,id);assert.ok(target-current>=1800&&target-current<=2160);const facing=(target+(id-1)*360/14)%360;assert.ok(Math.min(facing,360-facing)<1e-6);current=target;}
});
test('Home carousel stays in place; Play and search link to the new pages',()=>{
 const home=src('index.html'),play=src('play.html'),shared=src('site-features.js');
 assert.match(home,/id="friends-carousel"/);assert.match(home,/id="random" class="text-button" href="draw.html"/);assert.match(home,/href="collection.html" aria-label="감띠즈를 소개합니다/);
 assert.match(play,/href="draw.html" class="hub-daily"/);assert.ok(shared.includes("url:'draw.html'")&&shared.includes("url:'collection.html'"));
 assert.match(src('friend-dex.js'),/slots=20/);assert.match(src('friend-dex.js'),/미공개 감띠/);assert.match(src('daily-draw.js'),/saved\?\.date===date/);
});

test('National index includes accessible search, sort, status filters and dialog navigation',()=>{
 const html=src('collection.html'),css=src('national-dex.css'),js=src('friend-dex.js');
 assert.match(html,/<dialog id="dex-detail"/);
 assert.match(html,/id="dex-sort"/);
 for(const f of ['all','known','unknown'])assert.ok(html.includes('data-dex-filter="'+f+'"'));
 assert.match(css,/conic-gradient/);assert.match(css,/backdrop-filter:blur/);
 assert.match(js,/detail\.showModal\(\)/);assert.match(js,/detail\.close\(\)/);
 assert.match(js,/history\.replaceState/);
});

test('National index interaction: filter, exact number search, sort, detail navigation and deep links',()=>{
 const nodes={},eventMap={};
 class Element {
   constructor(){this.listeners={};this.children=[];this.attrs={};this.style={setProperty(){}};this.classList={toggle(){}};this.dataset={};this.hidden=false;this.open=false;this.value='';}
   addEventListener(k,fn){this.listeners[k]=fn;}
   emit(k,e={}){this.listeners[k]?.(e);}
   setAttribute(k,v){this.attrs[k]=v;}
   append(b){this.children=this.children.filter(x=>x!==b);this.children.push(b);}
   focus(){}
   showModal(){this.open=true;}
   close(){this.open=false;this.emit('close');}
 }
 const ids=['dex-grid','dex-search','dex-sort','dex-detail','dex-profile','dex-prev','dex-next','dex-close','dex-current','dex-result-count','dex-empty'];ids.forEach(id=>nodes[id]=new Element());
 const filters=['all','known','unknown'].map(dexFilter=>{const e=new Element();e.dataset.dexFilter=dexFilter;return e;});
 const location={href:'https://example.test/gamttiz/collection.html',hash:'',search:''};
 const history={replaceState(a,b,url){location.href=url.href;location.hash=url.hash;location.search=url.search;}};
 const doc={querySelector:s=>nodes[s.slice(1)],querySelectorAll:()=>filters,createElement:()=>new Element()};
 const mock=vm.createContext({GTZFriends:ctx.GTZFriends,GTZProfile:ctx.GTZProfile,document:doc,URL,URLSearchParams,location,history,window:{addEventListener(k,fn){eventMap[k]=fn;}}});
 vm.runInContext(src('friend-dex.js'),mock);
 const grid=nodes['dex-grid'],search=nodes['dex-search'],sort=nodes['dex-sort'],detail=nodes['dex-detail'],profile=nodes['dex-profile'];
 assert.equal(grid.children.length,20);assert.equal(detail.open,false);
 filters[2].emit('click');assert.equal(grid.children.filter(b=>!b.hidden).length,6);
 filters[0].emit('click');search.value='No. 07';search.emit('input');assert.equal(grid.children.filter(b=>!b.hidden).length,1);
 grid.children.find(b=>!b.hidden).emit('click');assert.equal(detail.open,true);assert.match(profile.innerHTML,/빙빙이/);
 nodes['dex-next'].emit('click');assert.equal(nodes['dex-current'].textContent,'NO. 08 / 20');
 nodes['dex-close'].emit('click');assert.equal(location.hash,'');assert.equal(detail.open,false);
 sort.value='desc';sort.emit('change');assert.match(grid.children[0].attrs['aria-label'],/No\. 20/);
 location.href='https://example.test/gamttiz/collection.html#friend-15';location.hash='#friend-15';eventMap.hashchange();assert.equal(detail.open,true);assert.match(profile.innerHTML,/\?\?\?/);
});

test('GAMTTIZ DEX uses existing editorial palette and has no collection-record panel',()=>{
 const html=src('collection.html'),css=src('national-dex.css');
 assert.doesNotMatch(html,/COLLECTION RECORD|dex-overview|전국도감|NATIONAL INDEX/);
 assert.match(html,/<h2 id="dex-library-title">감띠즈 도감<\/h2>/);
 assert.match(css,/background:var\(--ed-paper,#f8f8f5\)/);
 assert.match(css,/--dex-red:var\(--gtz-red,#e93636\)/);
 assert.doesNotMatch(css,/dex-overview|dex-progress/);
});

test('Vertical dial lays out horizontal rows, snaps at the center and retains details',()=>{
 const html=src('collection.html'),css=src('national-dex.css'),js=src('dex-dial.js');
 assert.match(html,/id="dex-grid"[^>]*tabindex="0"/);
 assert.match(html,/dex-dial\.js\?/);
 assert.match(css,/scroll-snap-type:y mandatory/);
 assert.match(css,/scroll-snap-align:center/);
 assert.match(css,/dex-dial \.dex-tile\{[\s\S]*?grid-template-columns:/);
 assert.match(css,/is-dial-current/);assert.match(js,/prefers-reduced-motion/);
});
test('Dial follows scroll center, skips hidden rows, resets filters and navigates without opening details',()=>{
 const nodes={},queue=[];
 class El {
   constructor(id){this.id=id;this.children=[];this.dataset={};this.hidden=false;this.scrollTop=0;this.attrs={};this.classes=new Set();this.classList={add:k=>this.classes.add(k),remove:k=>this.classes.delete(k),toggle:(k,v)=>v?this.classes.add(k):this.classes.delete(k)};this.events={};}
   addEventListener(k,f){this.events[k]=f;}
   emit(k,e={}){this.events[k]?.(e);}
   setAttribute(k,v){this.attrs[k]=v;}
   removeAttribute(k){delete this.attrs[k];}
   getBoundingClientRect(){if(this.id==='dex-grid')return{top:0,height:400};const visible=nodes['dex-grid'].children.filter(x=>!x.hidden),i=visible.indexOf(this);return{top:155+i*100-nodes['dex-grid'].scrollTop,height:90};}
   scrollTo({top}){this.scrollTop=top;this.emit('scroll');}
   focus(){doc.activeElement=this;}
   querySelector(){return this.children.find(x=>x.classes.has('is-selected')&&!x.hidden);}
 }
 for(const id of ['dex-grid','dex-dial-up','dex-dial-down','dex-dial-number','dex-detail','dex-search','dex-sort','.dex-dial'])nodes[id]=new El(id);
 const grid=nodes['dex-grid'],shell=nodes['.dex-dial'],filter=new El('filter');
 for(let id=1;id<=20;id++){const b=new El('row'+id);b.dataset.friendId=String(id);grid.children.push(b);}
 const doc={querySelector:s=>nodes[s.startsWith('#')?s.slice(1):s],querySelectorAll:()=>[filter],activeElement:null};
 let seq=0;const flush=()=>{while(queue.length)queue.shift()();};
 const env=vm.createContext({document:doc,GTZFriends:ctx.GTZFriends,matchMedia:()=>({matches:true}),requestAnimationFrame:f=>{queue.push(f);return ++seq;},window:{}});
 vm.runInContext(src('dex-dial.js'),env);flush();
 assert.equal(nodes['dex-dial-number'].textContent,'NO. 01');assert.equal(nodes['dex-dial-up'].disabled,true);
 nodes['dex-dial-down'].emit('click');flush();assert.equal(nodes['dex-dial-number'].textContent,'NO. 02');
 grid.scrollTop=500;grid.emit('scroll');flush();assert.equal(nodes['dex-dial-number'].textContent,'NO. 06');
 assert.equal(grid.children.filter(b=>b.classes.has('is-dial-current')).length,1);
 grid.children.forEach((b,i)=>b.hidden=i<14);filter.emit('click');flush();assert.equal(nodes['dex-dial-number'].textContent,'NO. 15');
 grid.emit('keydown',{key:'End',preventDefault(){}});flush();assert.equal(nodes['dex-dial-number'].textContent,'NO. 20');assert.equal(nodes['dex-dial-down'].disabled,true);
 grid.children.forEach(b=>b.hidden=true);filter.emit('click');flush();assert.equal(shell.hidden,true);
});

test('Daily fry pick replaces the roulette with independent selectable fries',()=>{
 const html=src('draw.html'),css=src('fry-pick.css'),js=src('daily-draw.js'),play=src('play.html');
 assert.match(html,/id="fry-stack"/);assert.doesNotMatch(html,/룰렛|draw-wheel|wheel-slot/);
 assert.match(html,/fry-pick\.css/);assert.doesNotMatch(play,/룰렛/);
 assert.match(css,/touch-action:none/);assert.match(css,/fry-extract/);assert.match(css,/fry-character-in/);
 assert.match(js,/pointermove/);assert.match(js,/d\.pull>=40/);
});
test('Fry drag, replay, old saved result migration and Korea-date reset',async()=>{
  let today='2026-11-21',randomCalls=0;
  const storage=new Map();
  class El {
    constructor(){this.children=[];this.events={};this.hidden=false;this.disabled=false;this.classes=new Set();this.classList={add:(...k)=>k.forEach(c=>this.classes.add(c)),remove:(...k)=>k.forEach(c=>this.classes.delete(c)),toggle:(k,v)=>v?this.classes.add(k):this.classes.delete(k)};this.style={setProperty(){},removeProperty(){}};}
    append(b){this.children.push(b);}
    setAttribute(){}
    setPointerCapture(){}
    addEventListener(k,fn){this.events[k]=fn;}
    emit(k,e={}){return this.events[k]?.(e);}
  }
  const fakeMath=Object.create(Math);fakeMath.random=()=>{randomCalls++;return .25;};
  const run=()=>{
    const ids=['fry-stack','fry-stage','fry-reveal','fry-reveal-image','fry-reveal-name','fry-pull-hint','draw-button','draw-status','draw-date','draw-result','draw-placeholder','draw-profile'];
    const nodes=Object.fromEntries(ids.map(id=>[id,new El()]));
    const doc={querySelector:s=>nodes[s.slice(1)],createElement:()=>new El(),addEventListener(){}};
    const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
    const m=vm.createContext({document:doc,GTZFriends:{...ctx.GTZFriends,dayKey:()=>today},GTZProfile:ctx.GTZProfile,localStorage,Math:fakeMath,matchMedia:q=>({matches:q.includes('reduced')})});
    vm.runInContext(src('daily-draw.js'),m);return nodes;
  };
  const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
  const key='gamttiz-daily-draw-v1',nodes=run(),fries=nodes['fry-stack'].children;
  assert.equal(fries.length,7);
  const first=fries[2],point={isPrimary:true,button:0,pointerId:1,clientX:80,clientY:120};
  first.emit('pointerdown',point);first.emit('pointermove',{...point,clientY:110});first.emit('pointercancel',point);
  assert.equal(storage.has(key),false);
  first.emit('pointerdown',point);first.emit('pointermove',{...point,clientY:55});first.emit('pointerup',{...point,clientY:55});
  await flush();
  const saved=JSON.parse(storage.get(key));assert.equal(saved.slot,2);assert.equal(saved.id,4);
  const name=nodes['fry-reveal-name'].textContent;assert.equal(name,characters[3].name);
  assert.equal(nodes['draw-profile'].hidden,false);assert.equal(fries.filter(f=>f.classes.has('is-picked')).length,1);
  nodes['draw-button'].emit('click');await flush();assert.equal(nodes['fry-reveal-name'].textContent,name);
  assert.equal(randomCalls,1);
  const reload=run();assert.equal(reload['fry-reveal-name'].textContent,name);
  storage.set(key,JSON.stringify({date:today,id:7}));const old=run();assert.equal(old['fry-reveal-name'].textContent,characters[6].name);
  today='2026-11-22';old['draw-button'].emit('click');await flush();assert.equal(JSON.parse(storage.get(key)).date,today);
});
