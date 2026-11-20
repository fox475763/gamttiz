import {fetchText,mapLimit} from './fry-radar-network.mjs';
import {eventEvidence,reconcileEvent} from './fry-radar-recheck.mjs';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {canonical,dedupe,dateRange,FRY as SHARED_FRY,TOPIC as SHARED_TOPIC,related,koreanRelated,momPromotionUrl,momPromotionLinks,officialHostAllowed} from './fry-radar-common.mjs';

const output = new URL('../data/fry-radar.json', import.meta.url);
const now = new Date();
const DAY = 86400000;
const MAX_PUBLISHED_AGE = 14 * DAY;
const execFileAsync=promisify(execFile);
const FRY = SHARED_FRY;
const TOPIC = SHARED_TOPIC;
const EXCLUDE = /주가|채용|가맹\s*모집|창업\s*비용|개인정보|매장\s*찾기/i;
const officialSources = [
  {brand:'롯데리아', list:'https://www.lotteeatz.com/event/main/', host:'lotteeatz.com', detail:/\/event\/main\/selectEvent\/\d+/i},
  {brand:'맥도날드', list:'https://www.mcdonalds.co.kr/kor/promotion/list', host:'mcdonalds.co.kr', alternates:['https://www.mcdonalds.co.kr/kor/promotion/detail.do?seq=404'], detail:/\/kor\/promotion\/(?:detail\/[a-z\d]+|detail\.do\?seq=\d+)/i},
  {brand:'버거킹', list:'https://www.burgerking.co.kr/event', host:'burgerking.co.kr', alternates:['https://web-prd.burgerking.co.kr/event','https://pf.kakao.com/_xcBxnxah'], channels:['_xcBxnxah'], detail:/\/event\/detail\/\d+|\/_xcBxnxah\/(?:contents\/posts\/)?\d+/i},
  {brand:'맘스터치', list:'https://momstouch.co.kr/promotion/list.php', host:'momstouch.co.kr',
    alternates:['https://momstouch.co.kr/m/promotion/list.php','https://www.momstouch.co.kr/promotion/list.php','https://order.momstouch.co.kr/momsmall/menu.jsp?menu_cd=001'],
    detail:/^\/(?:m\/)?promotion\/view\.php\?[^#]*\bidx=\d+|^\/momsmall\/menu_detail\.jsp\?[^#]*\bitem_cd=[a-z\d]+/i},
  {brand:'프랭크버거', list:'https://www.frankburger.co.kr/board/index.php?board=event_01&tab=3&type=list', host:'frankburger.co.kr', detail:/\/board\/index\.php\?.*board=event_01.*(?:no=|idx=|seq=|id=)\d+/i},
  {brand:'노브랜드버거', list:'https://www.shinsegaefood.com/company/pr/news_list.sf', host:'shinsegaefood.com', alternates:['https://www.shinsegaefood.com/company/pr/news_list.sf?pagging=2'], detail:/\/(news|contents|pr|media|press|board)\b|\/\w+\.sf\?/i},
  {brand:'쉐이크쉑', list:'https://www.shakeshack.kr/', host:'shakeshack.kr', hosts:['smdnewsroom.co.kr'], alternates:['https://www.smdnewsroom.co.kr/?s='+encodeURIComponent('쉐이크쉑')], detail:/\/(news|event|promotion|notice)\b|\/(?:spc|쉐이크|%EC%89%90)/i},
  {brand:'파이브가이즈', list:'https://www.fiveguys.co.kr/모든-소식-보기/', host:'fiveguys.co.kr', detail:/\/(news|blog|stories|article|press|소식|뉴스)\b/i},
  {brand:'다운타우너', list:'https://pf.kakao.com/_feexixj', host:'pf.kakao.com', detail:/\/_feexixj\/contents\/posts\/\d+/i},
  {brand:'바스버거', list:'https://pf.kakao.com/_AXkns', host:'pf.kakao.com', detail:/\/_AXkns\/contents\/posts\/\d+/i},
  {brand:'KFC', list:'https://www.kfckorea.com/promotion/promotionList/A801', host:'kfckorea.com', detail:/\/promotion\/(?:promotionList|newMenu)\/detail\/\d+/i},
  {brand:'파파이스', list:'https://popeyes.co.kr/event', host:'popeyes.co.kr', detail:/\/event\/\d+$/i}
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
  const m=String(text||'').replace(/\([월화수목금토일]\)/g,'').match(/(20\d{2}[-./년]\s*\d{1,2}[-./월]\s*\d{1,2}(?:일)?)\s*(?:~|～|–|—|부터|\s-\s)\s*(20\d{2}[-./년]\s*\d{1,2}[-./월]\s*\d{1,2}(?:일)?)/);
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

const heroImage=(html,base)=>{
  const candidates=[meta(html,'og:image:secure_url'),meta(html,'og:image'),meta(html,'twitter:image')];
  for(const m of String(html).matchAll(/<img\s+[^>]*>/gi)){
    const a=attrs(m[0]);
    if(FRY.test(a.alt||'')||/event|promotion|visual|banner|product|thumbnail/i.test(a.class||'')){
      candidates.push(a['data-src'],a['data-original'],a['data-lazy-src'],a['data-url'],a.src);
      const srcset=a['data-srcset']||a.srcset;
      if(srcset) candidates.push(...srcset.split(',').map(x=>x.trim().split(/\s+/)[0]));
    }
  }
  // Structured article/product data can expose thumbnails absent from HTML image tags.
  for(const block of String(html).matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
    try {
      const data=JSON.parse(block[1]);
      const visit=(node,depth=0)=>{
        if(!node||depth>5)return;
        if(Array.isArray(node)){node.forEach(x=>visit(x,depth+1));return;}
        if(typeof node!=='object')return;
        if(node.image){const imgs=Array.isArray(node.image)?node.image:[node.image];
          for(const img of imgs)candidates.push(typeof img==='string'?img:img?.url||img?.contentUrl);}
        if(node.thumbnailUrl)candidates.push(node.thumbnailUrl);
        for(const k of ['@graph','mainEntity','itemListElement'])if(node[k])visit(node[k],depth+1);
      };visit(data);
    } catch {}
  }
  for(const value of candidates){
    if(!value)continue;
    const url=safeUrl(value,base);
    if(!url||!url.startsWith('https:')||/\.(?:svg|ico)(?:\?|$)|logo|favicon|default|placeholder|sprite/i.test(url))continue;
    return url;
  }
  return null;
};
const titleOf = (html,fallback='') => {
  const candidates=[meta(html,'og:title')];
  for(const m of String(html).matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi))candidates.push(plain(m[1]));
  candidates.push(plain(fallback));
  const useful=candidates.map(s=>s.replace(/\s*[|｜]\s*(?:LOTTE EATZ|맥도날드|버거킹|프랭크버거).*$/i,'').trim())
    .filter(s=>s.length>=7&&!/^(?:이벤트|프로모션소식|뉴스|홈|행사|이벤트 상세|프로모션 상세|LOTTE EATZ|GAMTTIZ|Burger King)$/i.test(s)
      && !/^이벤트 상세\s*(?:[<|｜]|$)/.test(s));
  const titled=useful.find(s=>FRY.test(s)||TOPIC.test(s));
  return titled || useful.find(s=>s.length>=10) || '';
};
const relevant = (title,body) => {
  const head=String(title||'');
  if(EXCLUDE.test(head))return false;
  if(FRY.test(head)&&TOPIC.test(head))return true;
  if(FRY.test(head))return true;
  const text=plain(body).slice(0,12000);
  return TOPIC.test(head)&&FRY.test(text)&&new RegExp('(?:'+FRY.source+')[\\s\\S]{0,220}(?:'+TOPIC.source+')|(?:'+TOPIC.source+')[\\s\\S]{0,220}(?:'+FRY.source+')','i').test(text);
};
const category = title => /축제/.test(title)?'festival':/할인|쿠폰|특가/.test(title)?'discount':/굿즈|홀더|콜라보|협업/.test(title)?'goods':/소스|시즈닝|디핑/.test(title)?'sauce':/맛집|오픈|팝업/.test(title)?'place':/신메뉴|신제품|출시/.test(title)?'new-product':'event';
const hostAllowed = officialHostAllowed;
const fetchHtml = async url => {
  const page=await fetchText(url,{timeout:8500,attempts:2});
  if(!/text\/html|application\/xhtml/i.test(page.type)&&!/^\s*(?:<!doctype html|<html\b)/i.test(page.text))throw Error('non-HTML response');
  return {html:page.text,url:page.url};
};
const links = (html, source) => {
  if(source.brand==='맘스터치'&&new URL(source.list).hostname!=='order.momstouch.co.kr')
    return momPromotionLinks(html,source.list).slice(0,55);
  const map = new Map();
  const add = (raw,hint='') => {
    const url=safeUrl(raw,source.list);
    if(!url||!hostAllowed(url,source)||!source.detail.test(new URL(url).pathname+new URL(url).search)||url===source.list)return;
    if (!map.has(url))map.set(url,plain(hint).slice(0,220));
  };
  for(const m of String(html).matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)){
    const a=attrs(m[1]);
    if(a.href)add(a.href,m[2]);
    if(a['data-href'])add(a['data-href'],m[2]);
    if(a.onclick){for(const hit of a.onclick.matchAll(/(?:https?:\/\/[^'"\s]+|\/kor\/promotion\/detail\/[a-z\d]+|\/event\/detail\/\d+)/gi))add(hit[0],m[2]);}
  }
  for(const m of String(html).matchAll(/(?:https?:\\?\/\\?\/[^\s"'<>()]+|\/event\/main\/selectEvent\/\d+|\/event\/detail\/\d+|\/kor\/promotion\/detail\/[a-z\d]+)/gi)){
    const candidate=m[0].replace(/\\\//g,'/').replace(/&amp;/g,'&');
    add(candidate,html.slice(Math.max(0,m.index-150),m.index+200));
  }
  return [...map].slice(0,55).map(([url,hint])=>({url,hint}));
};

// Optional browser rendering for JS-only event listings. GitHub-hosted Linux
// runners commonly provide Chrome; when unavailable, report the limitation.
const renderOfficialListing=async url=>{
  const candidates=[process.env.CHROME_BIN,'google-chrome','chromium','chromium-browser'].filter(Boolean);
  const args=['--headless=new','--no-sandbox','--disable-dev-shm-usage',
    '--disable-gpu','--disable-extensions','--no-first-run',
    '--virtual-time-budget=6000','--dump-dom',url];
  let last;
  for(const command of candidates){
    try{
      const {stdout}=await execFileAsync(command,args,{timeout:19000,maxBuffer:6_000_000});
      if(/<html\b/i.test(stdout))return stdout;
      last=Error('browser returned no HTML');
    }catch(e){
      last=e;
      if(e.code!=='ENOENT')break;
    }
  }
  throw Error('브라우저 보조 수집 실패: '+String(last?.message||'not installed').slice(0,110));
};

// Fallback: find only brand-owned detail URLs indexed by Bing News RSS.
// This cannot bypass access restrictions and never treats a search result as verified.
const indexedOfficialLinks=async source=>{
  const query=source.brand==='맘스터치'?'맘스터치 프로모션 site:momstouch.co.kr/promotion/view.php':source.brand+' 감자튀김 포테이토 site:'+source.host;
  const ctl=new AbortController(),tid=setTimeout(()=>ctl.abort(),8500);
  try{
    const r=await fetch('https://www.bing.com/news/search?q='+encodeURIComponent(query)+'&format=rss&setlang=ko',{signal:ctl.signal});
    if(!r.ok)throw Error('RSS HTTP '+r.status);
    const rss=await r.text();
    if(!/<rss\b/i.test(rss))return [];
    const results=[];
    for(const [,item] of rss.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){
      const match=item.match(/<link>([\s\S]*?)<\/link>/i);
      const url=canonical(decode(match?.[1]||''),source.list);
      if(!url||!hostAllowed(url,source)||!source.detail.test(new URL(url).pathname+new URL(url).search))continue;
      const title=plain(item.match(/<title>([\s\S]*?)<\/title>/i)?.[1]);
      if(source.brand!=='맘스터치'&&!FRY.test(title))continue;
      const normalized=source.brand==='맘스터치'?momPromotionUrl(url,source.list):url;
      if(normalized)results.push({url:normalized,hint:title});
      if(results.length>=12)break;
    }
    return results;
  }finally{clearTimeout(tid);}
};

let suppressed={items:[]};
try{suppressed=JSON.parse(await fs.readFile(new URL('../data/fry-radar-blocked.json',import.meta.url),'utf8'));}catch{}
const blockedIds=new Set((suppressed.items||[]).map(x=>x.id).filter(Boolean));
const blockedUrls=new Set((suppressed.items||[]).map(x=>x.url).filter(Boolean));
const allowedPost=item=>!blockedIds.has(item.id)&&!blockedUrls.has(canonical(item.url));
let data;
try {data=JSON.parse(await fs.readFile(output,'utf8'));}catch{data={items:[]};}
if(!Array.isArray(data.items))data.items=[];
const items=new Map(data.items.filter(x=>x&&x.url&&allowedPost(x)).map(x=>[x.url,x]));
const healthFile=new URL('../data/fry-radar-health.json',import.meta.url);
let health={};try{health=JSON.parse(await fs.readFile(healthFile,'utf8'));}catch{}
const sourceHealth=[];
let checked=0, added=0, successes=0, pictures=0;
await mapLimit(officialSources,3,async source=>{
  let candidates=[];
  let accessed=false;
  const diag={brand:source.brand,url:source.list,reachable:false,candidates:0,checked:0,added:0,relevant:0,errors:[],excluded:{unrelated:0,oldOrUnknownDate:0,ended:0,blockedDetail:0,duplicate:0}};
  const oldStatus=health.sources?.find(x=>x.brand===source.brand);
  diag.lastReachableAt=oldStatus?.lastReachableAt||null;
  sourceHealth.push(diag);
  if(source.brand==='맘스터치'){diag.promotionReachable=false;diag.orderMenuReachable=false;}
  for(const listUrl of [source.list,...(source.alternates||[])]){
    try{
      const listing=await fetchHtml(listUrl);
      if(!hostAllowed(listing.url,source))throw Error('unrelated listing redirect');
      const routeCandidates=links(listing.html,{...source,list:listing.url});
      if(source.brand==='맘스터치'){
        const route=new URL(listing.url);
        if(route.hostname==='order.momstouch.co.kr'&&route.pathname==='/momsmall/menu.jsp')diag.orderMenuReachable=true;
        else if(/^\/(?:m\/)?promotion\/list\.php$/i.test(route.pathname))diag.promotionReachable=true;
        else throw Error('promotion listing not returned');
      }
      candidates=[...candidates,...routeCandidates];
      accessed=true;
      diag.reachable=true;
      diag.lastReachableAt=now.toISOString();
      diag.collectionUrl=listing.url;
      // Check alternate official routes too; one list may contain different events.
    }catch(e){diag.errors.push(String(e.message).slice(0,120));console.warn('[공식 수집 오류] '+source.brand+': '+e.message);}
  }
  if(candidates.length===0||(source.brand==='맘스터치'&&!candidates.some(x=>momPromotionUrl(x.url,source.list)))){
    try{
      const indexed=await indexedOfficialLinks(source);
      if(indexed.length){candidates=source.brand==='맘스터치'?[...indexed,...candidates]:indexed;diag.indexedFallback=true;}
      diag.indexedCandidates=indexed.length;
    }catch(e){diag.errors.push('보조 검색: '+String(e.message).slice(0,100));}
  }
  if(!candidates.length||(source.brand==='맘스터치'&&!candidates.some(x=>momPromotionUrl(x.url,source.list)))){
    try{
      const renderUrl=source.brand==='맘스터치'?source.list:diag.collectionUrl||source.list;
      const rendered=await renderOfficialListing(renderUrl);
      const fromBrowser=links(rendered,{...source,list:renderUrl});
      if(fromBrowser.length){
        candidates=source.brand==='맘스터치'?[...fromBrowser,...candidates]:fromBrowser;
        diag.browserFallback=true;
        if(source.brand==='맘스터치'){
          if(new URL(renderUrl).hostname==='order.momstouch.co.kr')diag.orderMenuReachable=true;
          else diag.promotionReachable=true;
        }
        diag.reachable=true;
        diag.lastReachableAt=now.toISOString();
        accessed=true;
      }
      diag.browserCandidates=fromBrowser.length;
    }catch(e){diag.errors.push(String(e.message).slice(0,150));}
  }
  diag.fallbackQueries=(health.news?.attemptedQueries||[]).filter(q=>q.includes(source.brand));
  diag.fallbackArticles=[...items.values()].filter(p=>(p.title+' '+p.summary).includes(source.brand)).map(p=>p.url);
  if(!accessed&&!candidates.length)return;
  if(accessed)successes++;
  candidates=[...new Map(candidates.map(candidate=>[candidate.url,candidate])).values()];
  diag.candidates=candidates.length;
  diag.verifiedDetails=0;
  const limit=source.brand==='맘스터치'?30:24;
  const offset=candidates.length>limit?Math.floor(now.getTime()/3600000)*limit%candidates.length:0;
  const selected=[...candidates.slice(offset),...candidates.slice(0,offset)].slice(0,limit);
  diag.remaining=Math.max(0,candidates.length-selected.length);
  console.log('[공식 목록] '+source.brand+': 상세 후보 '+candidates.length+'건');
  for(const candidate of selected){

    checked++;diag.checked++;
    let page;
    try{page=await fetchHtml(candidate.url);}catch(e){diag.excluded.blockedDetail++;continue;}
    if(!hostAllowed(page.url,source)){diag.excluded.blockedDetail++;continue;}
    diag.verifiedDetails++;
    if(source.brand==='맘스터치'&&momPromotionUrl(page.url,source.list))diag.promotionDetailReachable=true;
    let title=titleOf(page.html,candidate.hint);
    if(source.brand==='롯데리아'){
      const t=plain(page.html).slice(0,13000);
      const m=t.match(/롯데리아\s+(.{6,90}?)\s+(?:20\d{2}[-./]\d{1,2}[-./]\d{1,2})\s*~/);
      if(m)title=m[1].trim();
    }
    if(source.brand==='롯데리아' && checked<=4)console.log('[공식 제목 분석] '+candidate.url+' => '+title);
    const body=page.html.replace(/<(?:header|footer|nav)\b[^>]*>[\s\S]*?<\/(?:header|footer|nav)>/gi,' ');
    // Lotte's official detail text often puts fries discounts far from the event heading.
    // Require a specifically fries-related detail instead of matching global navigation.
    const scoped=plain(body).slice(0,13000);
    const lotteOffer=source.brand==='롯데리아' &&
      /(?:이달의 쿠폰|리아스낵타임|포테이토|양념감자)/.test(title) &&
      /(?:포테이토|양념감자|감자튀김)/.test(scoped);
    if(!(related(title,body)||lotteOffer)||!koreanRelated(title,page.url)){
      diag.excluded.unrelated++;
      if(source.brand==='롯데리아')console.log('[공식 제외] 관련성 부족: '+title);
      continue;
    }
    diag.relevant++;
    const clean=plain(body);
    const matched=clean.indexOf(title);
    const around=matched>=0?clean.slice(Math.max(0,matched-240),matched+1200):clean.slice(0,3500);
    const dateRange=rangeOf(around)||rangeOf(clean.slice(0,3500))||rangeOf(candidate.hint);
    // The legacy order catalog also includes old, yearless sales text. Do not
    // publish a regular menu or assume a year from that catalog.
    if(source.brand==='맘스터치'&&new URL(page.url).hostname==='order.momstouch.co.kr'&&(!dateRange||!TOPIC.test(title))){diag.excluded.oldOrUnknownDate++;continue;}
    const momId=source.brand==='맘스터치'&&momPromotionUrl(page.url,source.list)?new URL(page.url).searchParams.get('idx'):null;
    const equivalent=momId?[...items.values()].find(post=>momPromotionUrl(post.url,source.list)&&new URL(post.url).searchParams.get('idx')===momId):null;
    const known=items.get(page.url)||items.get(candidate.url)||equivalent;
    if(known)known.sourceTitle=title;
    const datePublished=meta(page.html,'article:published_time')||meta(page.html,'datePublished')||meta(page.html,'pubdate');
    const publishedTime=Date.parse(datePublished||'');
    const endTime=dateRange?Date.parse(dateRange.eventEnd+'T23:59:59+09:00'):NaN;
    if(dateRange&&endTime<now.getTime()){diag.excluded.ended++;if(source.brand==='롯데리아')console.log('[공식 제외] 행사 종료: '+title);continue;}
    if(!dateRange&&(!Number.isFinite(publishedTime)||publishedTime>now.getTime()||now.getTime()-publishedTime>MAX_PUBLISHED_AGE)){diag.excluded.oldOrUnknownDate++;if(source.brand==='롯데리아')console.log('[공식 제외] 날짜 확인 불가: '+title);continue;}
    const image=heroImage(page.html,page.url);
    const current=known;
    if(current){
      diag.excluded.duplicate++;
      if(image&&!current.imageUrl){current.imageUrl=image;pictures++;}

      continue;
    }
    const id=crypto.createHash('sha256').update(page.url).digest('hex').slice(0,12);
    const summary=meta(page.html,'og:description')||meta(page.html,'description')||'감자튀김 관련 공식 소식입니다. 행사 조건은 원문에서 확인해 주세요.';
    const item={id,title,summary:plain(summary).slice(0,180),url:page.url,source:source.brand+' 공식 홈페이지',category:category(title),publishedAt:Number.isFinite(publishedTime)?new Date(publishedTime).toISOString():null,collectedAt:now.toISOString(),eventStart:dateRange?.eventStart||null,eventEnd:dateRange?.eventEnd||null};
    if(image)item.imageUrl=image;
    items.set(page.url,item);added++;diag.added++;
    console.log('[공식 등록] '+source.brand+': '+title+' / '+page.url);
  }
});
// Revisit stored source URLs even after they disappear from event listings.
const rechecks={checked:0,changed:0,unavailable:0,unconfirmed:0};
await mapLimit([...items.values()],4,async post=>{
  // Retain a month of ended events for late corrections/extension notices.
  const ended=Date.parse((post.eventEnd||'')+'T23:59:59+09:00');
  if(Number.isFinite(ended)&&now.getTime()-ended>30*DAY)return;
  rechecks.checked++;
  try{
    const page=await fetchHtml(post.url);
    if(canonical(page.url)!==canonical(post.url)){post.recheckStatus='unconfirmed';post.lastCheckedAt=now.toISOString();rechecks.unconfirmed++;return;}
    if(reconcileEvent(post,eventEvidence(page.html,page.url),now.toISOString()))rechecks.changed++;
    if(post.recheckStatus!=='verified')rechecks.unconfirmed++;
    const image=heroImage(page.html,page.url);
    if(image&&!post.imageUrl){post.imageUrl=image;pictures++;}
  }catch(e){post.lastCheckedAt=now.toISOString();post.recheckStatus='unavailable';rechecks.unavailable++;}
});
if(successes===0)console.warn('[공식 수집] 모든 출처 접근 실패: 기존 데이터는 유지됩니다.');
data.items=dedupe([...items.values()].filter(allowedPost)).sort((a,b)=>Date.parse(b.publishedAt||b.eventStart||b.collectedAt||0)-Date.parse(a.publishedAt||a.eventStart||a.collectedAt||0)).slice(0,250);
data.updatedAt=now.toISOString();
await fs.writeFile(output,JSON.stringify(data,null,2)+'\n');
health.checkedAt=now.toISOString();
health.sources=sourceHealth.sort((a,b)=>officialSources.findIndex(s=>s.brand===a.brand)-officialSources.findIndex(s=>s.brand===b.brand));
health.rechecks=rechecks;
if(successes>0||health.news?.feedsSucceeded>0)health.lastCompletedAt=new Date().toISOString();
health.summary={sources:sourceHealth.length,reachable:sourceHealth.filter(x=>x.reachable).length,detailCandidates:sourceHealth.reduce((s,x)=>s+x.candidates,0),detailChecked:sourceHealth.reduce((s,x)=>s+x.checked,0),detailVerified:sourceHealth.reduce((s,x)=>s+(x.verifiedDetails||0),0),detailRemaining:sourceHealth.reduce((s,x)=>s+(x.remaining||0),0),newOfficial:added,photoEnriched:pictures,stored:data.items.length,status:sourceHealth.every(x=>x.reachable&&x.candidates>0&&!x.remaining&&!x.excluded.blockedDetail&&(x.brand!=='맘스터치'||x.promotionReachable))?'ok':'partial'};
await fs.writeFile(healthFile,JSON.stringify(health,null,2)+'\n');
console.log('[공식 수집 결과] 목록 접근 '+successes+'/'+officialSources.length+', 상세 확인 '+checked+', 새 글 '+added+', 이미지 추출 '+pictures+', 전체 '+data.items.length);
