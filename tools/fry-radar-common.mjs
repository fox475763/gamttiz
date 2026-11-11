// Shared, dependency-free checks for the FRY RADAR collectors.
export const DAY = 86_400_000;
export const FRY = /감자\s*튀김|감튀|감튀홀더|양념\s*감자|포테이토|프렌치\s*프라이|후렌치\s*후라이|치즈\s*프라이|프라이즈|웨지\s*감자|french\s*fr(?:y|ies)/i;
export const TOPIC = /할인|쿠폰|이벤트|행사|축제|프로모션|신제품|신메뉴|신상|출시|선보|굿즈|홀더|콜라보|협업|시즈닝|소스|디핑|팝업|전문점|오픈|맛집|한정|무료|증정|판매|트렌드|소비|문화|화제/i;
export const EXCLUDE = /주가|증시|환율|부동산|정치|대통령|투자|암호화폐|코인|채용|가맹\s*모집|창업\s*비용|개인정보|먹방|만드는 법|레시피/i;
export const FOREIGN = /(?:해외|외국|세계\s*각국|유학생|[1-9]\d*개국)(?:에서|의|발|현지|시장|소식|을|에게)?|(?:일본|미국|중국|대만|홍콩|영국|프랑스|벨기에|독일|캐나다|호주|싱가포르|태국)(?:에서|현지|시장|매장|한정|출시|유행|소식)/i;
export const KOREA = /한국|국내|우리나라|서울|부산|대구|인천|광주|대전|울산|제주|경기도|대한민국/i;
export function cleanText(value){
  return String(value||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,' ').replace(/&#(x[0-9a-f]+|\d+);|&(amp|lt|gt|quot|apos|nbsp);/gi,(s,n,k)=>{
    if(n){try{return String.fromCodePoint(parseInt(n.replace(/^x/i,''),n[0].toLowerCase()==='x'?16:10));}catch{return '';}}
    return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '}[k.toLowerCase()]||s;
  }).replace(/\s+/g,' ').trim();
}
export function canonical(raw,base){
  try{
    let u=new URL(raw,base);
    if(!['http:','https:'].includes(u.protocol)||u.username||u.password)return null;
    if(u.hostname.endsWith('bing.com')&&u.searchParams.has('url'))u=new URL(u.searchParams.get('url'));
    if(!['http:','https:'].includes(u.protocol))return null;
    if(/^(?:www\.)?(?:bing\.com|news\.google\.com|google\.com)$/.test(u.hostname))return null;
    for(const k of [...u.searchParams.keys()])if(/^(?:utm_|fbclid|gclid|ref_src|igshid)/i.test(k))u.searchParams.delete(k);
    u.hash='';
    return u.href;
  }catch{return null;}
}
export function normalizeTitle(t){
  return cleanText(t).replace(/\s*[-|｜]\s*(?:뉴스|연합뉴스|뉴시스|매일경제|헤럴드경제|한국경제)\s*$/,'').replace(/\s+/g,' ').trim().toLocaleLowerCase('ko-KR');
}
export function koreanRelated(title,url=''){
  let host='';
  try{host=new URL(url).hostname.toLowerCase()}catch{return false}
  if(/\.(?:jp|cn|tw|hk|sg|uk|de|fr|be|ca|au|th)$/.test(host)||/(?:^|\.)(?:note\.com|medium\.com|reddit\.com)$/.test(host))return false;
  return !FOREIGN.test(title)||KOREA.test(title);
}
export function classify(title,description=''){
  for(const s of [title,title+' '+description]){
    const checks=[['festival',/축제|페스티벌/],['discount',/할인|쿠폰|특가|가격\s*인하|무료\s*증정/],['goods',/굿즈|감튀\s*홀더|감자튀김\s*홀더|키링|콜라보|협업|컬래버/],['sauce',/디핑|소스|시즈닝|맛가루/],['place',/맛집|전문점|팝업|푸드트럭|매장\s*오픈/],['new-product',/신메뉴|신제품|신상|출시|재출시|선보/],['trend',/트렌드|문화|유행|인기|소비|통계|선호|순위/],['event',/이벤트|행사|프로모션|한정|증정|혜택/]];
    for(const [label,pattern] of checks)if(pattern.test(s))return label;
  }
  return 'other';
}
export function related(title,body=''){
  if(EXCLUDE.test(title)||!FRY.test(title+' '+body))return false;
  if(FRY.test(title))return true;
  const words=cleanText(body).slice(0,12000);
  const near=new RegExp('(?:'+FRY.source+')[\\s\\S]{0,140}(?:'+TOPIC.source+')|(?:'+TOPIC.source+')[\\s\\S]{0,140}(?:'+FRY.source+')','i');
  return TOPIC.test(title)&&near.test(words);
}
export function dateOnly(value){
  const m=String(value||'').match(/(20\d{2})[-./년]\s*(\d{1,2})[-./월]\s*(\d{1,2})/);
  if(!m)return null;
  const [y,mo,d]=m.slice(1).map(Number);
  const dt=new Date(Date.UTC(y,mo-1,d));
  return dt.getUTCFullYear()===y&&dt.getUTCMonth()===mo-1&&dt.getUTCDate()===d?dt.toISOString().slice(0,10):null;
}
export function dateRange(value){
  const r=/(20\d{2}[-./년]\s*\d{1,2}[-./월]\s*\d{1,2}(?:일)?)\s*(?:~|～|–|—|부터|\s-\s)\s*(20\d{2}[-./년]\s*\d{1,2}[-./월]\s*\d{1,2}(?:일)?)/.exec(value||'');
  if(!r)return null;
  const eventStart=dateOnly(r[1]),eventEnd=dateOnly(r[2]);
  return eventStart&&eventEnd&&eventStart<=eventEnd?{eventStart,eventEnd}:null;
}
export function eventEndTime(end){return /^\d{4}-\d\d-\d\d$/.test(end||'')?Date.parse(end+'T23:59:59+09:00'):NaN;}
export function isCurrent(item,clock=Date.now(),maxAgeDays=14){
  const end=eventEndTime(item.eventEnd);
  if(Number.isFinite(end))return end>=clock;
  const published=Date.parse(item.publishedAt||'');
  return Number.isFinite(published)&&published<=clock&&clock-published<=maxAgeDays*DAY;
}
export function dedupe(items){
  const byUrl=new Map(),byTitle=new Set();
  for(const item of items){
    if(!item||!item.url||!item.title)continue;
    const url=canonical(item.url);
    if(!url)continue;
    const host=new URL(url).hostname.replace(/^www\./,'');
    const key=host+'|'+normalizeTitle(item.title)+'|'+(item.eventStart||'')+'|'+(item.eventEnd||'');
    if(byUrl.has(url)||byTitle.has(key))continue;
    byUrl.set(url,{...item,url});byTitle.add(key);
  }
  return [...byUrl.values()];
}
export const evenKoreaHour = utcHour => (utcHour+9)%2===0;
