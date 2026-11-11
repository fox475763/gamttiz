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
const fry = /감자\s*튀김|프렌치\s*프라이|프렌치\s*프라이즈|후렌치\s*후라이|french\s*fr(?:y|ies)/i;
const news = /할인|이벤트|행사|축제|신제품|출시|증정|무료|프로모션|한정|쿠폰|판매|선보/i;
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
    return await response.text();
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
  for (const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const item = match[1];
    const title = field(item,'title');
    const url = canonical(field(item,'link'));
    const source = field(item,'News:Source') || new URL(url || 'https://example.com').hostname;
    const description = field(item,'description');
    const published = new Date(field(item,'pubDate'));
    if (!url || !fry.test(title) || !news.test(title) || exclude.test(title) || !Number.isFinite(published.getTime())) continue;
    if (published > now || now - published > 120 * 86400000) continue;
    if (!/[가-힣]/.test(title) || /\.jp$|\.cn$|\.tw$/.test(new URL(url).hostname)) continue;
    if (found.has(url)) continue;
    if (!(await verify(url))) continue;
    const summary = description && fry.test(description) ? description.slice(0, 140) : title;
    const id = crypto.createHash('sha256').update(url).digest('hex').slice(0, 12);
    found.set(url,{id,title,url,summary,source,category:category(title),publishedAt:published.toISOString(),collectedAt:now.toISOString(),eventStart:null,eventEnd:null});
    added++;
    console.log(`Added: ${title} — ${url}`);
  }
}
if (!feedsSucceeded) throw Error('All RSS feeds failed; preserving previous data.');
const items = [...found.values()].sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,100);
await fs.writeFile(output,JSON.stringify({updatedAt:now.toISOString(),items},null,2)+'\n');
console.log(`Feeds: ${feedsSucceeded}; new verified items: ${added}; total: ${items.length}`);

