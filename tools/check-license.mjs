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

test('royal foil masks exclude burgundy and white/transparent corners',()=>{
  const context=vm.createContext({});
  vm.runInContext(fs.readFileSync(new URL('../license-material.js',import.meta.url),'utf8'),context);
  const M=context.GTZLicenseMaterial;
  assert.equal(M.foilAmount(130,0,0),0);
  assert.equal(M.foilAmount(255,255,255),0);
  assert.equal(M.foilAmount(245,197,99,0),0);
  assert.ok(M.foilAmount(245,197,99)>.95);
  assert.ok(M.foilAmount(157,30,10)>0);
  const a=new Uint8ClampedArray([130,0,0,255,245,197,99,255,255,255,255,0,125,0,0,255]);
  const b=a.slice(),mask=M.finishPixels(a,2,2),other=M.finishPixels(b,2,2);
  assert.deepEqual(Array.from(mask),[0,255,0,0]);
  assert.deepEqual(Array.from(mask),Array.from(other));assert.deepEqual(Array.from(a),Array.from(b));
  assert.equal(a[11],0);assert.equal(a[3],255);assert.ok(a[4]>a[5]&&a[5]>a[6]);
});
test('static material and masked angle-responsive foil survive the wallet fallback',()=>{
  const html=fs.readFileSync(new URL('../license.html',import.meta.url),'utf8'),css=fs.readFileSync(new URL('../license.css',import.meta.url),'utf8');
  assert.ok(html.indexOf('license-material.js')<html.indexOf('license.js?'));
  assert.equal((html.match(/class="license-rim"/g)||[]).length,2);
  assert.match(css,/-webkit-mask-image: var\(--foil-mask,none\)/);
  assert.match(css,/\.license-flat \.license-paper-core\s*\{\s*display: block/);
  assert.ok(source.includes('GTZLicenseMaterial.prepare'));
  assert.ok(source.includes('drawTemplate(exportFront.getContext'));
  assert.ok(source.includes('drawQr(ctx);'));
  assert.ok(source.includes('front.toDataURL'));
});
