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
