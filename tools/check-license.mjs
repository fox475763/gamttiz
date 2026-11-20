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
