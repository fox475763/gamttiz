import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const output = new URL('../data/fry-radar.json', import.meta.url);
const now = new Date();
const DAY = 86400000;
const MAX_PUBLISHED_AGE = 14 * DAY;
const FRY = /감자\s*튀김|감튀|양념\s*감자|포테이토|프렌치\s*프라이|후렌치\s*후라이|치즈\s*프라이|프라이즈|프라이드\s*포테이토|french\s*fries/i;
const TOPIC = /할인|프로모션|행사|이벤트|쿠폰|특가|소식|출시|신메뉴|신제품|굿즈|콜라보|협업|시즈닝|디핑|소스|맛집|팝업|오픈|한정|무료|증정|시즌/i;
const EXCLUDE = /주가|채용|가맹\s*모집|창업\s*비용|개인정보|매장\s*찾기/i;
const officialSources = [
  {brand:'롯데리아', list:'https://www.lotteeatz.com/event/main/', host:'lotteeatz.com', detail:/\/event\/main\/selectEvent\/\d+/i},
  {brand:'맥도날드', list:'https://www.mcdonalds.co.kr/kor/promotion/list', host:'mcdonalds.co.kr', detail:/\/kor\/promotion\/detail\/[a-z0-9]+/i},
  {brand:'버거킹', list:'https://www.burgerking.co.kr/event', host:'burgerking.co.kr', detail:/\/event\/detail\/\d+/i},
  {brand:'맘스터치', list:'https://www.momstouch.co.kr/', host:'momstouch.co.kr', detail:/\/[^?#]*(event|promotion|board|notice|news)[^?#]*/i},
  {brand:'프랭크버거', list:'https://www.frankburger.co.kr/board/index.php?board=event_01&tab=3&type=list', host:'frankburger.co.kr', detail:/\/board\/index\.php\?.*board=event_01.*(?:no=|idx=|seq=|id=)\d+/i},
  {brand:'노브랜드버거', list:'https://www.shinsegaefood.co.kr/main.sf', host:'shinsegaefood.co.kr', detail:/\/(news|contents|pr|media|press|board)\b|\/\w+\.sf\?/i},
  {brand:'쉐이크쉑', list:'https://www.shakeshack.kr/', host:'shakeshack.kr', detail:/\/(news|event|promotion|notice)\b/i},
  {brand:'파이브가이즈', list:'https://www.fiveguys.co.kr/모든-소식-보기/', host:'fiveguys.co.kr', detail:/\/(news|blog|stories|article|press|소식|뉴스)\b/i},
  {brand:'다운타우너', list:'https://pf.kakao.com/_feexixj', host:'pf.kakao.com', detail:/\/_feexixj\/contents\/posts\/\d+/i},
  {brand:'바스버거', list:'https://pf.kakao.com/_AXkns', host:'pf.kakao.com', detail:/\/_AXkns\/contents\/posts\/\d+/i}
];

const decode = str => String(str || '').replace(/&#(x[0-9a-f]+|\d+);/gi, (_, v) => {
  try {return String.fromCodePoint(parseInt(v.replace(/^x/i, ''), /^x/i.test(v) ? 16 : 10));} catch {return '';}
}).replace(/&(?:amp|quot|apos|nbsp|lt|gt);/gi, m => ({'&amp;':'&','&quot;':'"','&apos;':"'",'&nbsp;':' ','&lt;':'<','&gt':'>'})[m.toLowerCase()] || m);
const plain = html => decode(String(html || '').replace(/<(?:script|style|noscript|svg)\b[^>]*>[\s\S]*?<\/(?:script|style|noscript|svg)>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g,' ').trim());
const dateOf = str => {
  if(!str)return null;
  const m = String(str).match(/(20\d{2})[-./년]\s*(\d{1,2})[-./월]\s*(\d{1,2})/);
  if (!m) return null;
  const y=Number(m[1]),mo=Number(m[2]),d=Number(m[3]);
  if (mo<1||mo>12||d<1||d>31)return null;
  const stamp=new Date(Date.UTC(y,mo-1,d));
  return stamp.getUTCFullYear()===y && stamp.getUTCMonth()===mo-1 && stamp.getUTCDate()===d ? stamp.toISOString().slice(0,10) : null;
};
const rangeOf = text => {
  const m=String(text||'').match(/(20\d{2}[-./년]\s*\d{1,2}[-./월]\s*\d{1,2}(?:일)?)\s*(?:~|～|–|—|부터|\s-\s)\s*(20\d{2}[-./년]\s*\d{1,2}[-./월]\s*\d{1,2}(?:일)?)/);
  const start=m&&dateOf(m[1]), end=m&&dateOf(m[2]);
  if (!start||!end||start>end||Number(end.slice(0,4))>now.getUTCFullYear()+2)return null;
  return {eventStart:start,eventEnd:end};
};
const safeUrl = (value, base) => {
  try {
    const u = new URL(decode(value || ''),base);
    if(!['http:','https:'].includes(u.protocol) || u.username || u.password)return null;
    u.hash='';
    return u.href;
  } catch {return null;}
};
const attrs = tag => {
  const obj={};
  for(const m of String(tag).matchAll(/([a-zA-Z_:][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))obj[m[1].toLowerCase()]=decode(m[2]??m[3]??m[4]);
  return obj;
};
const meta = (html,key) => {
  for(const m of String(html).matchAll(/<meta\s+[^>]*>/gi)){
    const a=attrs(m[0]);
    if([a.property,a.name,a.itemprop].some(v=>v?.toLowerCase()===key.toLowerCase()))return a.content||'';
  }
  return '';
};
const heroImage = (html, base) => {
  const candidates=[meta(html,'og:image:secure_url'),meta(html,'og:image'),meta(html,'twitter:image')];
  for(const m of String(html).matchAll(/<img\s+[^>]*>/gi)){
    const a=attrs(m[0]);
    if(FRY.test(a.alt||'')||/event|promotion|visual|banner|product|main|thumbnail/i.test(a.class||''))candidates.push(a['data-src'],a.src,a['data-original']);
  }
  for(const value of candidates){
    if(!value)continue;
    const url=safeUrl(value,base);
    if(!url||!/^https:/.test(url)||/\.(?:svg|ico)(?:\?|$)|logo|favicon|default|placeholder|sprite/i.test(url))continue;
    return url;
  }
  return null;
};
const titleOf = (html,fallback='') => {
  const candidates=[meta(html,'og:title')];
  for(const m of String(html).matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi))candidates.push(plain(m[1]));
  candidates.push(plain(fallback));
  return candidates.map(s=>s.replace(/\s*[|｜]\s*(?:LOTTE EATZ|맥도날드|버거킹|프랭크버거).*$/i,'').trim())
    .find(s=>s.length>=8&&!/^(?:이벤트|프로모션소식|뉴스|홈|행사|이벤트 상세|프로모션 상세)|^이벤트 상세\b/.test(s))||'';
};
const relevant = (title,body) => {
  const head=String(title||'');
  if(EXCLUDE.test(head))return false;
  if(FRY.test(head)&&TOPIC.test(head))return true;
  if(FRY.test(head))return true;
  const text=plain(body).slice(0,3800);
  return TOPIC.test(head)&&FRY.test(text)&&new RegExp('(?:'+FRY.source+')[\\s\\S]{0,75}(?:'+TOPIC.source+')|(?:'+TOPIC.source+')[\\s\\S]{0,75}(?:'+FRY.source+')','i').test(text);
};
const category = title => /축제/.test(title)?'festival':/할인|쿠폰|특가/.test(title)?'discount':/굿즈|홀더|콜라보|협업/.test(title)?'goods':/소스|시즈닝|디핑/.test(title)?'sauce':/맛집|오픈|팝업/.test(title)?'place':/신메뉴|신제품|출시/.test(title)?'new-product':'event';
const hostAllowed = (url, source) => {
  try {
    const host=new URL(url).hostname.toLowerCase();
    if (source.host==='pf.kakao.com')return host==='pf.kakao.com'&&url.includes(new URL(source.list).pathname);
    return host===source.host||host.endsWith('.'+source.host);
  } catch {return false;}
};
const fetchHtml = async url => {
  const ctl=new AbortController(), timeout=setTimeout(()=>ctl.abort(),8500);
  try{
    const r=await fetch(url,{signal:ctl.signal,redirect:'follow',headers:{'user-agent':'GAMTTIZ-Fry-Radar/1.1 (public official site monitoring; +https://fox475763.github.io/gamttiz/)',accept:'text/html,application/xhtml+xml;q=0.9'}});
    if(!r.ok||!/text\/html|application\/xhtml/i.test(r.headers.get('content-type')||''))throw Error('HTTP '+r.status+' / non-HTML');
    const body=await r.text();
    if(body.length>3_000_000)throw Error('oversized HTML');
    return {html:body,url:r.url};
  }finally{clearTimeout(timeout);}
};
const links = (html, source) => {
  const map = new Map();
  const add = (raw,hint='') => {
    const url=safeUrl(raw,source.list);
    if(!url||!hostAllowed(url,source)||!source.detail.test(new URL(url).pathname+new URL(url).search)||url===source.list)return;
    if (!map.has(url))map.set(url,plain(hint).slice(0,220));
  };
  for(const m of String(html).matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)){
    const a=attrs(m[1]);if(a.href)add(a.href,m[2]);
  }
  for(const m of String(html).matchAll(/(?:https?:\\?\/\\?\/[^\s"'<>()]+|\/event\/main\/selectEvent\/\d+|\/event\/detail\/\d+|\/kor\/promotion\/detail\/[a-z\d]+)/gi)){
    const candidate=m[0].replace(/\\\//g,'/').replace(/&amp;/g,'&');
    add(candidate,html.slice(Math.max(0,m.index-150),m.index+200));
  }
  return [...map].slice(0,24).map(([url,hint])=>({url,hint}));
};

let data;
try {data=JSON.parse(await fs.readFile(output,'utf8'));}catch{data={items:[]};}
if(!Array.isArray(data.items))data.items=[];
const items=new Map(data.items.filter(x=>x&&x.url).map(x=>[x.url,x]));
let checked=0, added=0, pictures=0, successes=0;
for(const source of officialSources){
  let candidates=[];
  try{
    const listing=await fetchHtml(source.list);
    candidates=links(listing.html,source);
    successes++;
  }catch(e){console.warn('[공식 수집 오류] '+source.brand+': '+e.message);continue;}
  console.log('[공식 목록] '+source.brand+': 상세 후보 '+candidates.length+'건');
  for(const candidate of candidates.slice(0,18)){
    if(checked>=90)break;
    checked++;
    let page;
    try{page=await fetchHtml(candidate.url);}catch(e){continue;}
    if(!hostAllowed(page.url,source))continue;
    const title=titleOf(page.html,candidate.hint);
    const body=page.html.replace(/<(?:header|footer|nav)\b[^>]*>[\s\S]*?<\/(?:header|footer|nav)>/gi,' ');
    if(!relevant(title,body))continue;
    const clean=plain(body);
    const dateRange=rangeOf(clean.slice(0,2600))||rangeOf(candidate.hint);
    const datePublished=meta(page.html,'article:published_time')||meta(page.html,'datePublished')||meta(page.html,'pubdate');
    const publishedTime=Date.parse(datePublished||'');
    const endTime=dateRange?Date.parse(dateRange.eventEnd+'T23:59:59+09:00'):NaN;
    if(dateRange&&endTime<now.getTime())continue;
    if(!dateRange&&(!Number.isFinite(publishedTime)||publishedTime>now.getTime()||now.getTime()-publishedTime>MAX_PUBLISHED_AGE))continue;
    const image=heroImage(page.html,page.url);
    const current=items.get(page.url)||items.get(candidate.url);
    if(current){
      if(image&&!current.imageUrl){current.imageUrl=image;pictures++;}
      if(dateRange&&!current.eventEnd){Object.assign(current,dateRange);}
      continue;
    }
    const id=crypto.createHash('sha256').update(page.url).digest('hex').slice(0,12);
    const summary=meta(page.html,'og:description')||meta(page.html,'description')||'감자튀김 관련 공식 소식입니다. 행사 조건은 원문에서 확인해 주세요.';
    const item={id,title,summary:plain(summary).slice(0,180),url:page.url,source:source.brand+' 공식 홈페이지',category:category(title),publishedAt:Number.isFinite(publishedTime)?new Date(publishedTime).toISOString():null,collectedAt:now.toISOString(),eventStart:dateRange?.eventStart||null,eventEnd:dateRange?.eventEnd||null};
    if(image)item.imageUrl=image;
    items.set(page.url,item);added++;
    console.log('[공식 등록] '+source.brand+': '+title+' / '+page.url);
  }
}
for(const post of [...items.values()].filter(x=>!x.imageUrl).slice(0,8)){
  try{
    const page=await fetchHtml(post.url);
    const image=heroImage(page.html,page.url);
    if(image){post.imageUrl=image;pictures++;}
  }catch{}
}
if(successes===0)console.warn('[공식 수집] 모든 출처 접근 실패: 기존 데이터는 유지됩니다.');
data.items=[...items.values()].sort((a,b)=>Date.parse(b.publishedAt||b.eventStart||b.collectedAt||0)-Date.parse(a.publishedAt||a.eventStart||a.collectedAt||0)).slice(0,100);
data.updatedAt=now.toISOString();
await fs.writeFile(output,JSON.stringify(data,null,2)+'\n');
console.log('[공식 수집 결과] 목록 접근 '+successes+'/'+officialSources.length+', 상세 확인 '+checked+', 새 글 '+added+', 이미지 '+pictures+', 전체 '+data.items.length);
