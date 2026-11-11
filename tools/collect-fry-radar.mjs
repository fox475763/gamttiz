import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const output = new URL('../data/fry-radar.json', import.meta.url);
const now = new Date();
const queries = [
  '감튀 할인',
  '감튀 이벤트',
  '감튀 신제품',
  '감튀 프로모션',
  '감자튀김 할인',
  '감자튀김 이벤트',
  '감자튀김 신제품',
  '프렌치프라이 프로모션',
  '후렌치후라이 행사',
  '양념감자 할인',
  '감튀 축제',
  'french fries promotion Korea',
];

const decode = value => String(value || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&#(x[\da-f]+|\d+);|&([a-z]+);/gi, (_, numeric, named) => {
  if (numeric) return String.fromCodePoint(parseInt(numeric.replace(/^x/i, ''), numeric.startsWith('x') ? 16 : 10));
  return ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '})[named.toLowerCase()] || `&${named};`;
}).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const field = (xml, tag) => decode(xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))?.[1]);
const fry = /감자\s*튀김|감튀|프렌치\s*프라이|후렌치\s*후라이|후렌치\s*후라이즈|양념\s*감자|french\s*fr(?:y|ies)/i;
const news = /할인|이벤트|행사|축제|신제품|신메뉴|출시|증정|무료|프로모션|한정|쿠폰|특가|혜택|판매|선보|재출시/i;
const exclude = /주가|증시|환율|부동산|정치|대통령|코인|투자|레시피|먹방|리뷰|칼로리|건강|만드는 법|요리법/i;
const category = title => /축제/.test(title) ? 'festival' : /할인|쿠폰|특가/.test(title) ? 'discount' : /신제품|출시|선보/.test(title) ? 'new-product' : 'event';
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
const existing = Array.isArray(previous.items) ? previous.items : [];
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
    if (!url || !fry.test(searchText) || !news.test(searchText) || exclude.test(title) || !Number.isFinite(published.getTime())) continue;
    if (published > now || now - published > 120 * 86400000) continue;
    if (!/[가-힣]/.test(title) || /\.jp$|\.cn$|\.tw$/.test(new URL(url).hostname)) continue;
    if (found.has(url)) continue;
    console.log(`[검증 시도] ${title}`);

    if (!(await verify(url))) {
      console.warn(`[원문 접근 실패] ${title}: ${url}`);
      continue;
    }
    const summary = description && fry.test(description) ? description.slice(0, 140) : title;
    const id = crypto.createHash('sha256').update(url).digest('hex').slice(0, 12);
    found.set(url,{id,title,url,summary,source,category:category(title),publishedAt:published.toISOString(),collectedAt:now.toISOString(),eventStart:null,eventEnd:null});
    added++;
    console.log(`Added: ${title} — ${url}`);
  }
}

/* Google 뉴스 RSS 수집 */
const googleQueries = [
  '감자튀김 할인',
  '감자튀김 이벤트',
  '감튀 행사',
  '프렌치프라이 신제품',
  '양념감자 프로모션'
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
      if (exclude.test(title) || !Number.isFinite(published.getTime())) continue;
      if (published > now || now - published > 45 * 86400000) continue;

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
        category: category(title),
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
const items = [...found.values()].sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,100);
await fs.writeFile(output,JSON.stringify({updatedAt:now.toISOString(),items},null,2)+'\n');
console.log(`Feeds: ${feedsSucceeded}; new verified items: ${added}; total: ${items.length}`);

