import assert from 'node:assert/strict';
import {test} from 'node:test';
import '../radar-model.js';
const M=globalThis.GTZRadarModel;
const now=Date.parse('2026-11-20T15:01:00Z');
test('KST deadline and invalid date handling',()=>{
 assert.equal(M.daysLeft({eventEnd:'2026-11-24'},now),3);
 assert.equal(M.daysLeft({eventEnd:'2026-11-21'},now),0);
 assert.equal(M.daysLeft({eventEnd:'2026-11-20'},now),-1);
 assert.equal(M.daysLeft({eventEnd:'2026-11-21',eventStatus:'ended-early'},now),null);
 assert.equal(M.day('2026-02-30'),null);
});
test('only explicit, unambiguous sale pairs are compared',()=>{
 assert.deepEqual(M.offer({category:'discount',summary:'12,100원 → 8,600원'}),{original:12100,sale:8600,saving:3500,percent:29});
 assert.equal(M.offer({category:'discount',summary:'2,100원 할인, 1,700원 추가'}),null);
 assert.equal(M.offer({category:'discount',summary:'2,100원 → 1,700원, 3000원 → 2000원'}),null);
 assert.equal(M.offer({category:'event',summary:'2,100원 → 1,700원'}),null);
});
test('brand aliases, new posts and safe calendar data',()=>{
 assert.deepEqual(M.brandNames({title:'맥도날드와 롯데리아 감튀'}),['맥도날드','롯데리아']);
 assert.equal(M.isNew({collectedAt:'2026-11-20T16:00:00Z'},now),true);
 assert.equal(M.isNew({collectedAt:'2026-11-20T16:00:00Z'},0),false);
 const event={id:'abc',title:'감튀, 이벤트;\n즐겨요',eventStart:'2026-11-21',eventEnd:'2026-11-23',url:'https://example.com'};
 const ics=M.calendar(event,now);
 assert.match(ics,/DTEND;VALUE=DATE:20261124/);
 assert.match(ics,/SUMMARY:감튀\\, 이벤트\\;\\n즐겨요/);
 assert.equal(M.calendar({...event,eventStatus:'ended-early'},now),null);
 assert.equal(M.calendar({...event,eventEnd:null},now),null);
});
