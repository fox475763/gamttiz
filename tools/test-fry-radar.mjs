import test from 'node:test';
import assert from 'node:assert/strict';
import {canonical,cleanText,normalizeTitle,koreanRelated,classify,related,dateOnly,dateRange,eventEndTime,isCurrent,dedupe,evenKoreaHour} from './fry-radar-common.mjs';
test('KST even-hour schedule maps to odd UTC hours',()=>{
  for(let h=0;h<24;h++)assert.equal(evenKoreaHour(h),h%2===1);
});
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
});
test('HTML entities and CDATA are decoded',()=>{
  assert.equal(cleanText('<![CDATA[감자튀김 &amp; 소스]]>'),'감자튀김 & 소스');
  assert.equal(normalizeTitle(' 감자튀김  할인 - 뉴시스'),'감자튀김 할인');
});
