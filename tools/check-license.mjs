import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';

const source=fs.readFileSync(new URL('../license.js',import.meta.url),'utf8');
const start=source.indexOf('  async function commitPreview(');
const end=source.indexOf('  async function render()',start);
assert.ok(start>=0&&end>start,'Preview commit implementation must exist');
function fixture(){
  const pending=[],replacements=[];
  class Image{
    constructor(){pending.push(this)}
    decode(){return new Promise(resolve=>{this.finishDecode=resolve})}
    replaceWith(next){replacements.push(next)}
  }
  const ctx=vm.createContext({
    Image,back:{width:540,height:859},renderVersion:1,
    backArt:{replaceWith(next){replacements.push(next)}}
  });
  vm.runInContext(source.slice(start,end)+'\nthis.commit=commitPreview;',ctx);
  return {ctx,pending,replacements};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('license art is replaced only after image load and decode, with explicit dimensions',async()=>{
  const {ctx,pending,replacements}=fixture();
  const committed=ctx.commit('data:image/png;base64,preview',1);
  assert.equal(replacements.length,0);
  pending[0].onload();
  await tick();
  assert.equal(replacements.length,0);
  pending[0].finishDecode();
  await committed;
  assert.equal(replacements.length,1);
  assert.equal(replacements[0].width,540);
  assert.equal(replacements[0].height,859);
  assert.equal(replacements[0].className,'license-art license-art-composed');
});
test('a stale render cannot replace a newer card image',async()=>{
  const {ctx,pending,replacements}=fixture();
  const old=ctx.commit('data:image/png;base64,old',1);
  ctx.renderVersion=2;
  const latest=ctx.commit('data:image/png;base64,new',2);
  pending[0].onload();
  pending[1].onload();
  await tick();
  pending[1].finishDecode();
  await latest;
  pending[0].finishDecode();
  await old;
  assert.equal(replacements.length,1);
  assert.equal(replacements[0].src,'data:image/png;base64,new');
});
test('a failed PNG must not replace the visible card',async()=>{
  const {ctx,pending,replacements}=fixture();
  const commit=ctx.commit('data:image/png;base64,broken',1);
  pending[0].onerror();
  await assert.rejects(commit,/Card preview decode failed/);
  assert.equal(replacements.length,0);
});

test('curved reflection retains the previous fixed-surface movement and source artwork',()=>{
  const css=fs.readFileSync(new URL('../license.css',import.meta.url),'utf8');
  const reflection=fs.readFileSync(new URL('../assets/license/reflection.svg',import.meta.url),'utf8');
  assert.match(css,/background-image:url\("assets\/license\/reflection\.svg/);
  assert.match(css,/background-size:240% 240%/);
  assert.match(css,/animation:license-surface-idle 8s ease-in-out infinite alternate/);
  assert.match(reflection,/feGaussianBlur/);
  assert.ok((reflection.match(/<path d="M[^"]* C/g)||[]).length>=4);
  assert.match(source,/layer\.style\.backgroundPosition=/);
  assert.match(source,/ctx\.drawImage\(img,0,CROP_Y,W,H,0,0,W,H\)/);
});

test('Favorite dial centers square cards by measured geometry and retains the radio selection',()=>{
  const start=source.indexOf('  let profileHover=null'),end=source.indexOf('  function viewEdit(',start);
  const css=fs.readFileSync(new URL('../license-profile.css',import.meta.url),'utf8');
  const html=fs.readFileSync(new URL('../license.html',import.meta.url),'utf8');
  assert.match(css,/aspect-ratio:1/);assert.match(css,/scroll-snap-type:x mandatory/);assert.match(css,/scroll-snap-align:center/);
  assert.doesNotMatch(html,/class="license-profile-controls"/);assert.match(css,/--profile-live-size/);assert.match(source,/function profileSpring/);
  const width=300,cardSize=120,gap=13,padding=(width-cardSize)/2;
  const cards=Array.from({length:14},(_,i)=>({classes:new Set(),getBoundingClientRect(){return {left:padding+i*(cardSize+gap)-friends.scrollLeft,width:cardSize}},classList:{toggle(k,on){on?cards[i].classes.add(k):cards[i].classes.delete(k)}}}));
  const radios=cards.map(()=>({checked:false}));
  const friends={children:cards,clientWidth:width,scrollLeft:0,getBoundingClientRect:()=>({left:0,width}),scrollTo({left}){this.scrollLeft=left;},querySelector(s){const n=Number(s.match(/\d+/)[0]);radios.forEach(r=>r.checked=false);return radios[n];}};
  const nodes=Object.fromEntries(['license-profile-prev','license-profile-next','license-profile-count'].map(id=>[id,{}]));
  const context=vm.createContext({friends,names:cards.map((_,i)=>'Friend '+i),selected:0,reduced:{matches:true},editing:true,wallet:false,$:id=>nodes[id],render(){},performance:{now:()=>0},requestAnimationFrame:()=>1});
  vm.runInContext(source.slice(start,end)+'\nthis.select=setSelected;this.nearest=closestProfile;this.choose=chooseProfile;',context);
  context.select(0);
  assert.ok(cards[0].classes.has('is-profile-current'));assert.ok(cards[1].classes.has('is-profile-near'));
  context.select(5);
  assert.equal(friends.scrollLeft,5*(cardSize+gap));
  assert.equal(context.nearest(),5);assert.equal(radios[5].checked,true);
  friends.scrollLeft=8*(cardSize+gap)+7;context.choose(context.nearest(),false);
  assert.equal(radios[8].checked,true);
  context.select(13);
  assert.equal(context.nearest(),13);
});
