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
test('selected favorite, persistence, no death, elapsed time, six unique holders',()=>{
  const p=M.pet(null,sample,now);
  assert.deepEqual(p.slots,[3]);assert.equal(M.petStats(p,now).full,100);
  const restored=M.pet(JSON.parse(JSON.stringify(p)),sample,now+86400000);
  assert.equal(M.petStats(restored,now+86400000).day,2);
  assert.equal(M.petStats(restored,now+86400000).full,0);
  assert.deepEqual(restored.slots,[3]);
  assert.equal(M.petStats(M.interact(restored,'feed',now+86400000),now+86400000).full,100);
  assert.deepEqual(M.pet({...p,slots:[0,0,1,2,3,4,5,6,14]},sample,now).slots,[0,1,2,3,4,5]);
  assert.notEqual(M.petKey(sample),M.petKey({...sample,number:'GTZ - 0009'}));
});
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
  for(const file of ['member.js','member-pocket.js','member-level.js']){
    for(const [,id] of src(file).matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.has(id),file+': missing '+id);
  }
  assert.match(html,/id="member-unlocked" hidden/);
  assert.match(html,/data-member-view="pocket" hidden/);
  assert.match(html,/data-member-view="level" hidden/);
  const manifest=JSON.parse(src('member.webmanifest'));
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.start_url,'./member.html#pocket');
});
