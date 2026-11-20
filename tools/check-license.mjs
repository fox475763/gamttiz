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

test('studio light follows true surface orientation and blends idle into movement',()=>{
  const start=source.indexOf('  function studioReflection('),end=source.indexOf('  function paint()',start);
  const context=vm.createContext({});
  vm.runInContext(source.slice(start,end)+'\nthis.light=studioReflection;',context);
  const light=context.light;
  const neutral=light(0,0,0,1),tilted=light(25,-12,0,1),edge=light(89,0,0,1);
  assert.ok(tilted.x>neutral.x);assert.ok(tilted.y>neutral.y);
  assert.ok(edge.strength<neutral.strength);
  for(let tilt=-90;tilt<=90;tilt+=10)for(let pitch=-33;pitch<=33;pitch+=11){
    const state=light(tilt,pitch,1.3,.7);
    for(const value of Object.values(state))assert.ok(Number.isFinite(value));
    assert.ok(state.strength>=0&&state.strength<=1);
    assert.ok(Math.abs(state.x)<=31&&Math.abs(state.y)<=16);
  }
  for(const key of Object.keys(light(0,0,0,0)))assert.ok(Math.abs(light(0,0,0,0)[key]-light(0,0,Math.PI*2,0)[key])<1e-8);
  const idle=light(15,10,1,0),active=light(15,10,1,1),middle=light(15,10,1,.5);
  assert.ok(Math.abs(middle.x-(idle.x+active.x)/2)<1e-8);
  assert.ok(Math.abs(middle.strength-(idle.strength+active.strength)/2)<1e-8);
});
test('reflection is a clipped overlay and leaves the original image export pipeline alone',()=>{
  const css=fs.readFileSync(new URL('../license.css',import.meta.url),'utf8');
  assert.match(css,/POLISHED METAL LIGHT ONLY/);
  assert.match(css,/\.license-page \.license-motion-gloss\s*\{[^}]*overflow:hidden/);
  assert.match(css,/\.license-page \.license-motion-gloss::before/);
  assert.match(source,/ctx\.drawImage\(img,0,CROP_Y,W,H,0,0,W,H\)/);
  assert.match(source,/classes\.contains\('license-wallet-inactive'\)/);
});
