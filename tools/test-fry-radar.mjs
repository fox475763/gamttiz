import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchText,mapLimit} from './fry-radar-network.mjs';
import {eventEvidence,reconcileEvent} from './fry-radar-recheck.mjs';
import {collectionDue} from './fry-radar-schedule.mjs';

test('hourly runs always execute; recovery only runs when stale',()=>{
  const now=Date.parse('2026-11-16T10:47:00Z');
  assert.equal(collectionDue('17 * * * *','2026-11-16T10:30:00Z',now),true);
  assert.equal(collectionDue('47 * * * *','2026-11-16T10:20:00Z',now),false);
  assert.equal(collectionDue('47 * * * *','2026-11-16T09:20:00Z',now),true);
  assert.equal(collectionDue('47 * * * *',null,now),true);
});
test('retry throttling and network failures, never retry a permanent 404',async()=>{
  let calls=0;const delays=[];
  const result=await fetchText('https://example.com',{wait:async n=>delays.push(n),fetcher:async()=>{
    calls++;if(calls===1)throw Error('network');
    return calls===2?new Response('',{status:429,headers:{'retry-after':'1'}}):new Response('ok');
  }});
  assert.equal(result.text,'ok');assert.equal(calls,3);assert.equal(delays.length,2);
  calls=0;
  await assert.rejects(fetchText('https://example.com',{wait:async()=>{},fetcher:async()=>{calls++;return new Response('',{status:404});}}),/404/);
  assert.equal(calls,1);
});
test('bounded work preserves input order',async()=>{
  let active=0,max=0;
  assert.deepEqual(await mapLimit([1,2,3,4],2,async n=>{active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,5));active--;return n*2;}),[2,4,6,8]);
  assert.equal(max,2);
});
test('date revisions preserve ID and history; ambiguous pages do not overwrite',()=>{
  const item={id:'stable',title:'롯데리아 리아스낵타임 할인',url:'https://example.com/event/1',eventEnd:'2026-11-30'};
  const evidence=eventEvidence('<main>롯데리아 리아스낵타임 할인 2026.11.01 ~ 2026.12.05 조기 종료될 수 있습니다.</main>');
  assert.equal(reconcileEvent(item,evidence,'2026-11-16T00:00:00Z'),true);
  assert.equal(item.id,'stable');assert.equal(item.eventEnd,'2026-12-05');assert.equal(item.eventStatus,undefined);
  assert.equal(item.eventChanges.length,1);
  const unrelated=eventEvidence('<main>다른 브랜드 이벤트 2026.11.01 ~ 2026.11.20 본 행사는 조기 종료되었습니다.</main>');
  assert.equal(reconcileEvent(item,unrelated,'2026-11-16T01:00:00Z'),false);
  assert.equal(item.eventEnd,'2026-12-05');
  const ended=eventEvidence('<main>롯데리아 리아스낵타임 할인 본 행사는 조기 종료되었습니다.</main>');
  assert.equal(reconcileEvent(item,ended,'2026-11-16T02:00:00Z'),true);
  assert.equal(item.eventStatus,'ended-early');
  assert.equal(eventEvidence('<div>일시적인 접속 오류</div>'),null);
  assert.equal(eventEvidence('<main>2026.11.01 ~ 2026.11.10 및 2026.11.20 ~ 2026.11.30</main>').range,null);
  const legacy='<div class="board-detail-wrap"><div>롯데리아 할인</div>2026.11.01 ~ 2026.11.30</div><div>2026.12.01 ~ 2026.12.31</div>';
  assert.equal(eventEvidence(legacy,'https://www.lotteeatz.com/event/main/selectEvent/1').range.eventEnd,'2026-11-30');
  assert.equal(eventEvidence(legacy,'https://unrelated.example/event'),null);
  const kfc={title:'KFC 둠프라이 행사',eventStart:'2026-11-10',eventEnd:'2027-01-04'};
  reconcileEvent(kfc,eventEvidence('<main>KFC 둠프라이 행사 11/10(화)~1/6(수)</main>'),'2026-11-16T00:00:00Z');
  assert.equal(kfc.eventEnd,'2027-01-06');
  assert.equal(kfc.recheckStatus,'verified');
});
import {canonical,cleanText,normalizeTitle,koreanRelated,classify,related,dateOnly,dateRange,eventEndTime,isCurrent,dedupe} from './fry-radar-common.mjs';
test('canonical URL removes tracking and rejects Google News intermediates',()=>{
  assert.equal(canonical('https://example.kr/post?utm_source=foo&id=12#anchor'),'https://example.kr/post?id=12');
  assert.equal(canonical('https://news.google.com/rss/articles/abc'),null);
  assert.equal(canonical('javascript:alert(1)'),null);
});
test('date parsing validates leap days and an explicit Korean campaign end',()=>{
  assert.equal(dateOnly('2026.11.31'),null);
  assert.equal(dateOnly('2024.02.29'),'2024-02-29');
  assert.deepEqual(dateRange('2026.11.01 ~ 2026.11.30'),{eventStart:'2026-11-01',eventEnd:'2026-11-30'});
  assert.equal(eventEndTime('2026-11-30'),Date.parse('2026-11-30T23:59:59+09:00'));
});
test('known ongoing campaigns survive old article date and end automatically',()=>{
  const a={publishedAt:'2026-08-10T00:00:00Z',eventEnd:'2026-11-30'};
  assert.equal(isCurrent(a,Date.parse('2026-11-11T09:00:00+09:00')),true);
  assert.equal(isCurrent(a,Date.parse('2026-12-01T09:00:00+09:00')),false);
  assert.equal(isCurrent({publishedAt:null},Date.now()),false);
});
test('fries topic relevance and domestic filtering',()=>{
  assert.equal(related('롯데리아 포테이토 할인','11월 한정'),true);
  assert.equal(related('버거킹 신메뉴','매장 공지'),false);
  assert.equal(koreanRelated('세계 5개국 감자튀김 문화','https://note.com/blog/article'),false);
  assert.equal(koreanRelated('일본에서 출시한 감자튀김','https://example.com/article'),false);
  assert.equal(koreanRelated('한국에서 판매하는 미국 브랜드 감튀','https://example.com/article'),true);
  assert.equal(classify('감자튀김 굿즈 콜라보'),'goods');
});
test('canonicalization avoids duplicate articles',()=>{
  const items=[{title:'감자튀김 할인',url:'https://example.com/a?utm_medium=feed'},{title:'감자튀김 할인',url:'https://example.com/a'},{title:'감자튀김 할인',url:'https://example.com/b'}];
  assert.equal(dedupe(items).length,1);
  assert.equal(dedupe([...items,{title:'감자튀김 할인',url:'https://another-brand.kr/a'}]).length,2);
});
test('HTML entities and CDATA are decoded',()=>{
  assert.equal(cleanText('<![CDATA[감자튀김 &amp; 소스]]>'),'감자튀김 & 소스');
  assert.equal(normalizeTitle(' 감자튀김  할인 - 뉴시스'),'감자튀김 할인');
});
