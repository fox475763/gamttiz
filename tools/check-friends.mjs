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
test('All 14 entries have face-focused original SVG crops and distinct expanded field notes',()=>{
  const {facePortrait}=ctx.GTZFriends;
  const subtitles=new Set(),episodes=new Set();
  characters.forEach(c=>{
    assert.ok(c.faceCrops.length>=1);
    c.faceCrops.forEach(([x,y,w,h])=>{assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=56.69001&&y+h<=141.73);});
    assert.equal((facePortrait(c.id).match(/class="dex-face"/g)||[]).length,c.faceCrops.length);
    assert.match(facePortrait(c.id),new RegExp(image(c.id)));
    for(const key of ['subtitle','appearance','talent','weakness','secret','episode'])assert.ok(c.details[key].length>7);
    assert.equal(c.details.traits.length,3);subtitles.add(c.details.subtitle);episodes.add(c.details.episode);
    const profile=ctx.GTZProfile(c);
    for(const text of ['표정 확대','외형 특징','특기','약한 순간','감띠의 소소한 비밀','어느 날, 감띠즈에서'])assert.ok(profile.includes(text));
  });
  assert.equal(subtitles.size,14);assert.equal(episodes.size,14);assert.equal(characters[8].faceCrops.length,2);
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
 assert.equal(grid.children.length,20);assert.equal(detail.open,false);assert.equal(grid.children.filter(b=>b.innerHTML.includes('dex-face')).length,14);assert.match(grid.children[8].className,/dex-dual-face/);
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
 assert.match(js,/pointermove/);assert.match(js,/d\.pull>=threshold\(\)/);assert.doesNotMatch(html,/id="draw-button"/);assert.equal((html.match(/class="fry-holder-vector" viewBox="0 0 480 480"/g)||[]).length,2);assert.doesNotMatch(html,/holder-fbx-render/);assert.match(html,/class="fry-holder-face"/);assert.match(css,/fry-holder-face\{pointer-events:visiblePainted\}/);assert.match(css,/is-preview:not\(:disabled\) \.fry-stick/);assert.doesNotMatch(js,/f\.addEventListener\('click'/);
});
test('Fry drag, 14 unique random draws, fresh reload and back navigation, legacy migration and Korea-date reset',async()=>{
  let today='2026-11-21',randomCalls=0;
  const storage=new Map();
  class El {
    constructor(){this.children=[];this.events={};this.hidden=false;this.disabled=false;this.classes=new Set();this.classList={add:(...k)=>k.forEach(c=>this.classes.add(c)),remove:(...k)=>k.forEach(c=>this.classes.delete(c)),toggle:(k,v)=>v?this.classes.add(k):this.classes.delete(k)};this.style={setProperty(){},removeProperty(){}};}
    append(b){this.children.push(b);}
    setAttribute(){}
    removeAttribute(k){delete this[k];}
    setPointerCapture(){}
    addEventListener(k,fn){this.events[k]=fn;}
    emit(k,e={}){return this.events[k]?.(e);}
  }
  const fakeMath=Object.create(Math);fakeMath.random=()=>{randomCalls++;return .25;};
  const run=()=>{
    const ids=['fry-stack','fry-stage','fry-reveal','fry-reveal-image','fry-reveal-name','fry-pull-hint','draw-replay','draw-status','draw-date','draw-result','draw-placeholder','draw-profile'];
    const nodes=Object.fromEntries(ids.map(id=>[id,new El()]));
    const doc={querySelector:s=>nodes[s.slice(1)],createElement:()=>new El(),addEventListener(){}};
    const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
    const events={};nodes.pageEvent=(k,e={})=>events[k]?.(e);
    const m=vm.createContext({window:{addEventListener(k,fn){events[k]=fn;}},document:doc,GTZFriends:{...ctx.GTZFriends,dayKey:()=>today},GTZProfile:ctx.GTZProfile,localStorage,Math:fakeMath,matchMedia:q=>({matches:q.includes('reduced')})});
    vm.runInContext(src('daily-draw.js'),m);return nodes;
  };
  const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
  const key='gamttiz-daily-draw-v1',nodes=run(),fries=nodes['fry-stack'].children;
  assert.equal(fries.length,5);
  const first=fries[2],point={isPrimary:true,button:0,pointerId:1,clientX:80,clientY:120};
  first.emit('click',{detail:1});assert.equal(storage.has(key),false);
  first.emit('pointerdown',point);assert.equal(first.classes.has('is-preview'),true);assert.equal(fries.filter(f=>f.classes.has('is-preview')).length,1);first.emit('pointerup',point);assert.equal(first.classes.has('is-preview'),false);assert.equal(storage.has(key),false);
  first.emit('pointerdown',point);first.emit('pointermove',{...point,clientY:110});first.emit('pointercancel',point);
  assert.equal(storage.has(key),false);
  first.emit('pointerdown',point);first.emit('pointermove',{...point,clientY:25});first.emit('pointerup',{...point,clientY:55});
  await flush();
  const saved=JSON.parse(storage.get(key));assert.equal(saved.slot,2);assert.equal(saved.id,4);
  const name=nodes['fry-reveal-name'].textContent;assert.equal(name,characters[3].name);
  assert.equal(nodes['draw-profile'].hidden,false);assert.equal(fries.filter(f=>f.classes.has('is-picked')).length,1);
  nodes['draw-replay'].emit('click');assert.equal(nodes['draw-profile'].hidden,true);assert.equal(randomCalls,1);
  const another=fries[4];another.emit('pointerdown',point);another.emit('pointermove',{...point,clientY:25});await flush();assert.notEqual(nodes['fry-reveal-name'].textContent,name);
  assert.equal(randomCalls,2);
  const second=JSON.parse(storage.get(key)),reload=run();assert.equal(reload['fry-reveal-name'].textContent,'');assert.equal(reload['draw-profile'].hidden,true);assert.ok(reload['fry-stack'].children.every(f=>!f.disabled&&!f.classes.has('is-picked')));
  assert.equal(second.remaining.length,12);
  const seen=new Set([saved.id,second.id]);
  for(let i=0;i<12;i++){
    reload['draw-replay'].emit('click');const f=reload['fry-stack'].children[i%5];f.emit('pointerdown',point);f.emit('pointermove',{...point,clientY:25});await flush();
    const record=JSON.parse(storage.get(key));assert.ok(!seen.has(record.id));seen.add(record.id);
  }
  assert.equal(seen.size,14);assert.equal(randomCalls,14);assert.equal(JSON.parse(storage.get(key)).remaining.length,0);
  const last=JSON.parse(storage.get(key)).id;
  reload['draw-replay'].emit('click');const next=reload['fry-stack'].children[1];next.emit('pointerdown',point);next.emit('pointermove',{...point,clientY:25});await flush();assert.notEqual(JSON.parse(storage.get(key)).id,last);assert.equal(JSON.parse(storage.get(key)).remaining.length,13);
  storage.set(key,JSON.stringify({date:today,id:7}));const old=run();assert.equal(old['fry-reveal-name'].textContent,'');assert.equal(old['draw-profile'].hidden,true);
  old['draw-replay'].emit('click');const legacyFry=old['fry-stack'].children[0];legacyFry.emit('pointerdown',point);legacyFry.emit('pointermove',{...point,clientY:25});await flush();assert.notEqual(JSON.parse(storage.get(key)).id,7);assert.equal(JSON.parse(storage.get(key)).remaining.length,12);
  old.pageEvent('pagehide');old.pageEvent('pageshow',{persisted:true});assert.equal(old['draw-profile'].hidden,true);assert.equal(old['fry-reveal-name'].textContent,'');assert.equal(old['draw-placeholder'].hidden,false);assert.equal(old['draw-replay'].hidden,true);assert.ok(old['fry-stack'].children.every(f=>!f.disabled&&!f.classes.has('is-picked')));
  // Leaving during extraction must not let a queued animation restore the old result.
  legacyFry.emit('pointerdown',point);legacyFry.emit('pointermove',{...point,clientY:25});old.pageEvent('pagehide');old.pageEvent('pageshow',{persisted:true});await flush();assert.equal(old['draw-profile'].hidden,true);assert.equal(old['fry-reveal'].hidden,true);
  today='2026-11-22';old['draw-replay'].emit('click');const keyboard=old['fry-stack'].children[0];for(let i=0;i<3;i++)keyboard.emit('keydown',{key:'ArrowUp',preventDefault(){}});await flush();assert.equal(JSON.parse(storage.get(key)).date,today);
});

test('Rectangular sticks are contained inside the rendered holder at rest',()=>{
 const js=src('daily-draw.js'),m=js.match(/const shapes=(\[\[.*?\]\]);/);
 assert.ok(m);const sticks=JSON.parse(m[1]);assert.equal(sticks.length,5);
 for(const [x,len,tilt,w] of sticks){assert.equal(tilt,0);assert.ok(x-w/2>=26&&x+w/2<=74);assert.ok(100-28-len>=23);assert.ok(100-28-len<39);}
 const css=src('fry-pick.css');assert.match(css,/bottom:28%/);assert.match(css,/translateY\(-12px\)/);assert.doesNotMatch(css,/fry-stick::before|fry-stick::after/);
});

test('Holder is viewed straight on, with symmetrical front lip and five round holes',()=>{
 const html=src('draw.html'),front=html.match(/<div class="fry-pack fry-pack-front"[\s\S]*?<\/svg>/)[0];
 assert.match(front,/M94 89C104 126 109 164 132 190C154 213 194 222 240 222C286 222 326 213 348 190C371 164 376 126 386 89/);
 assert.match(front,/V342Q386 374 354 374H126Q94 374 94 342Z/);
 assert.equal((front.match(/<circle /g)||[]).length,5);
 assert.doesNotMatch(front,/fill="#d22c31"|rotate\(/);
});

test('Play game cards use three matching vector icons and shared light glass without old character art',()=>{
 const html=src('play.html'),css=src('play-hub.css');
 const grid=html.match(/<div class="hub-grid">([\s\S]*?)<\/section>/)[1];
 assert.doesNotMatch(grid,/hub-art|<img\b/);
 assert.equal((grid.match(/class="hub-icon"/g)||[]).length,3);
 assert.equal((grid.match(/class="hub-card-head"/g)||[]).length,3);
 for(const [href,cls] of [['quiz.html','hub-quiz'],['combo.html','hub-combo'],['draw.html','hub-daily']]){
   assert.match(grid,new RegExp('href="'+href+'" class="'+cls+'"'));
 }
 assert.match(html,/play-hub\.css\?v=/);
 assert.match(css,/backdrop-filter:blur\(22px\)/);
 assert.match(css,/conic-gradient/);
 assert.match(css,/mask-composite:exclude/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/\.hub-card-head\{display:flex;align-items:center/);
});
