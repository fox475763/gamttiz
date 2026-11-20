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
