import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const output = new URL('../data/fry-radar.json', import.meta.url);
const now = new Date();
const queries = [
  // 국내 할인 및 이벤트
  '감튀 할인',
  '감튀 이벤트',
  '감자튀김 할인',
  '감자튀김 이벤트',
  '감자튀김 프로모션',
  '양념감자 할인',
  '감자튀김 축제',
  // 신메뉴
  '감자튀김 신메뉴',
  '양념감자 신메뉴',
  '프렌치프라이 신제품',
  // 국내 감자튀김 굿즈·콜라보
  '감자튀김 굿즈',
  '감튀홀더 굿즈',
  '감자튀김 콜라보',
  '프렌치프라이 한정판',
  // 소스·시즈닝
  '감자튀김 디핑소스',
  '감자튀김 시즈닝',
  '치즈프라이 신메뉴',
  // 국내 맛집·팝업
  '감자튀김 맛집',
  '감자튀김 전문점 오픈',
  '감자튀김 팝업스토어',
  // 감튀 트렌드
  '감자튀김 트렌드',
  '감자튀김 소비',
  '감자튀김 인기',
];

const decode = value => String(value || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&#(x[\da-f]+|\d+);|&([a-z]+);/gi, (_, numeric, named) => {
  if (numeric) return String.fromCodePoint(parseInt(numeric.replace(/^x/i, ''), numeric.startsWith('x') ? 16 : 10));
  return ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '})[named.toLowerCase()] || `&${named};`;
}).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const field = (xml, tag) => decode(xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))?.[1]);
const fry = /감자\s*튀김|감튀|프렌치\s*프라이|후렌치\s*후라이(?:즈)?|양념\s*감자|치즈\s*프라이|트러플\s*프라이|웨지\s*감자|french\s*fr(?:y|ies)/i;
const news = /할인|이벤트|행사|축제|신제품|신메뉴|신상|출시|증정|무료|프로모션|한정|쿠폰|특가|혜택|판매|선보|재출시|굿즈|홀더|키링|콜라보|협업|컬래버|디핑|소스|시즈닝|맛집|전문점|팝업|오픈|개점|트렌드|문화|유행|인기|화제|소비|조사|통계|선호|순위/i;
const exclude = /주가|증시|환율|부동산|정치|대통령|코인|투자|레시피|먹방|칼로리|건강|만드는 법|요리법/i;
// 해외 기사 자체는 제외하되 해외 브랜드의 국내 출시 소식은 허용합니다.
const overseasOnly = (title, url = '') => {
  let host;
  try { host = new URL(url).hostname.toLowerCase(); }
  catch { return true; }

  // 한국어로 번역된 해외 기사도 국내 소식으로 저장하지 않습니다.
  if (/(?:^|\.)(?:note\.com|medium\.com|reddit\.com)$/.test(host) ||
      /\.(?:jp|cn|tw|hk|sg|uk|de|fr|be|ca|au|th|vn|id|my)$/.test(host)) return true;

  const domestic = /한국|국내|우리나라|서울|부산|대구|인천|광주|대전|울산|제주|경기도|대한민국/i.test(title);
  const foreignTopic = /세계(?:의|에서|각국)|해외(?:에서|의|발|현지|시장|소식)|\d+개국|유학생|(?:일본|미국|중국|대만|홍콩|영국|프랑스|벨기에|독일|캐나다|호주|싱가포르|태국)(?:에서|현지|시장|매장|한정|출시|유행|소식)/i.test(title);
  return foreignTopic && !domestic;
};
// 제목의 주제부터 확인해 분류하고, 필요할 때만 설명을 참고합니다.
const category = (title, description = '') => {
  const rules = [
    ['festival', /축제|페스티벌/],
    ['discount', /할인|쿠폰|특가|가격\s*인하|무료\s*증정/],
    ['goods', /굿즈|감튀\s*홀더|감자튀김\s*홀더|키링|한정판\s*(?:패키지|굿즈)|콜라보|협업|컬래버|기획\s*상품/],
    ['sauce', /디핑|소스|시즈닝|맛가루|양념\s*가루|트러플\s*마요/],
    ['place', /맛집|전문점|팝업|푸드트럭|매장\s*(?:오픈|개점)|(?:오픈|개점)한\s*(?:매장|가게)/],
    ['new-product', /신메뉴|신제품|신상|신규\s*메뉴|출시|재출시|선보/],
    ['trend', /트렌드|문화|유행|인기|화제|소비|통계|조사|선호|순위|판매량/],
    ['event', /이벤트|행사|프로모션|한정|증정|혜택/]
  ];
  for (const text of [title, title + ' ' + description]) {
    for (const [key, pattern] of rules) if (pattern.test(text)) return key;
  }
  return 'other';
};
const canonical = raw => {
  try {
    let url = new URL(raw);
    if (url.hostname.endsWith('bing.com') && url.searchParams.has('url')) url = new URL(url.searchParams.get('url'));
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (/^(?:www\.)?(?:bing\.com|news\.google\.com)$/.test(url.hostname)) return null;
    for (const key of [...url.searchParams.keys()]) if (/^(?:utm_|fbclid|gclid)/i.test(key)) url.searchParams.delete(key);
    url.hash = '';
    return url.href;
  } catch { return null; }
};
const getFeed = async query => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss&setlang=ko`, {signal:controller.signal, headers:{'user-agent':'GAMTTIZ-Fry-Radar/1.0 (+https://fox475763.github.io/gamttiz/)'}});
    if (!response.ok) throw Error(`RSS ${response.status}`);
    const xml = await response.text();
    if (!/<rss\b/i.test(xml)) {
      throw new Error('RSS 형식이 아닌 응답입니다.');
    }
    return xml;

  } finally { clearTimeout(timeout); }
};
const verify = async url => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, {method:'GET', signal:controller.signal, redirect:'follow', headers:{'user-agent':'Mozilla/5.0'}});
    return response.ok && /text\/html|application\/pdf/.test(response.headers.get('content-type') || '');
  } catch { return false; }
  finally { clearTimeout(timeout); }
};

let previous;
try { previous = JSON.parse(await fs.readFile(output, 'utf8')); } catch { previous = {updatedAt:null,items:[]}; }
const existing = Array.isArray(previous.items) ? previous.items.filter(item => !overseasOnly(item.title || '', item.url)).map(item => ({...item, category:category(item.title || '', item.summary || '')})) : [];
const found = new Map(existing.map(item => [item.url,item]));
let feedsSucceeded = 0;
let added = 0;
for (const query of queries) {
  let xml;
  try { xml = await getFeed(query); feedsSucceeded++; } catch (error) { console.warn(`${query}: ${error.message}`); continue; }
  console.log(`[RSS 검색] ${query}: ${(xml.match(/<item\b/gi) || []).length}건 발견`);
  for (const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const item = match[1];
    const title = field(item,'title');
    const url = canonical(field(item,'link'));
    const source = field(item,'News:Source') || new URL(url || 'https://example.com').hostname;
    const description = field(item,'description');
    const published = new Date(field(item,'pubDate'));
    const searchText = `${title} ${description}`;
    if (!url || !fry.test(searchText) || !news.test(searchText) || exclude.test(title) || overseasOnly(title,url) || !Number.isFinite(published.getTime())) continue;
    if (published > now || now - published > 14 * 86400000) continue;
    if (!/[가-힣]/.test(title) || /\.jp$|\.cn$|\.tw$/.test(new URL(url).hostname)) continue;
    if (found.has(url)) continue;
    console.log(`[검증 시도] ${title}`);

    if (!(await verify(url))) {
      console.warn(`[원문 접근 실패] ${title}: ${url}`);
      continue;
    }
    const summary = description && fry.test(description) ? description.slice(0, 140) : title;
    const id = crypto.createHash('sha256').update(url).digest('hex').slice(0, 12);
    found.set(url,{id,title,url,summary,source,category:category(title,description),publishedAt:published.toISOString(),collectedAt:now.toISOString(),eventStart:null,eventEnd:null});
    added++;
    console.log(`Added: ${title} — ${url}`);
  }
}

/* Google 뉴스 RSS 수집 */
const googleQueries = [
  '감자튀김 할인',
  '감자튀김 이벤트',
  '프렌치프라이 신제품',
  '감자튀김 신메뉴',
  '감튀 굿즈 콜라보',
  '감자튀김 디핑소스',
  '감자튀김 시즈닝',
  '감자튀김 맛집 팝업',
  '감자튀김 전문점 오픈',
  '감자튀김 트렌드'
];

for (const query of googleQueries) {
  try {
    const endpoint = new URL('https://news.google.com/rss/search');
    endpoint.searchParams.set('q', query);
    endpoint.searchParams.set('hl', 'ko');
    endpoint.searchParams.set('gl', 'KR');
    endpoint.searchParams.set('ceid', 'KR:ko');

    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) throw Error(`HTTP ${response.status}`);

    const xml = await response.text();
    if (!/<rss\b/i.test(xml)) throw Error('RSS 형식 오류');

    feedsSucceeded++;

    const matches = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)];
    console.log(`[Google 뉴스] ${query}: ${matches.length}건 발견`);

    let checked = 0;
    let saved = 0;

    for (const [, item] of matches) {
      const title = field(item, 'title');
      const description = field(item, 'description');
      const publisher = field(item, 'source');
      const published = new Date(field(item, 'pubDate'));
      const searchText = `${title} ${description}`;

      if (!publisher || !fry.test(searchText) || !news.test(searchText)) continue;
      if (!/[가-힣]/.test(title) || exclude.test(title) || !Number.isFinite(published.getTime())) continue;
      if (published > now || now - published > 14 * 86400000) continue;

      let url;
      try {
        const link = new URL(field(item, 'link'));
        if (link.protocol !== 'https:' ||
            link.hostname !== 'news.google.com' ||
            !link.pathname.startsWith('/rss/articles/')) continue;
        url = link.href;
      } catch {
        continue;
      }

      if (overseasOnly(title,url)) continue;
      if (found.has(url)) continue;
      if ([...found.values()].some(x => x.title === title)) continue;

      if (++checked > 6) break;
      if (!(await verify(url))) continue;

      const id = crypto.createHash('sha256')
        .update(url).digest('hex').slice(0, 12);

      found.set(url, {
        id,
        title,
        url,
        summary: title,
        source: `${publisher} (Google 뉴스 경유)`,
        category: category(title,description),
        publishedAt: published.toISOString(),
        collectedAt: now.toISOString(),
        eventStart: null,
        eventEnd: null
      });

      saved++;
      added++;
    }

    console.log(`[Google 뉴스 저장] ${query}: ${saved}건`);
  } catch (error) {
    console.warn(`[Google 뉴스 오류] ${query}: ${error.message}`);
  }
}
if (!feedsSucceeded) throw Error('All RSS feeds failed; preserving previous data.');
const items = [...found.values()].sort((a,b)=>
  (Date.parse(b.publishedAt || b.eventStart) || 0) - (Date.parse(a.publishedAt || a.eventStart) || 0)
).slice(0,100);
await fs.writeFile(output,JSON.stringify({updatedAt:now.toISOString(),items},null,2)+'\n');
console.log(`Feeds: ${feedsSucceeded}; new verified items: ${added}; total: ${items.length}`);

