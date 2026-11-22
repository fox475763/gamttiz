/* Only Member's static UI is cached; no license or personal data is stored here. */
const CACHE='gamttiz-member-20261122-radar-v46';
const VERSION='20261123friends16';
const WALLET_VERSION='20261121walletsmooth11';
const CONTROL_VERSION='20261123friends16';
const paths=['member.html','member.webmanifest','member-icon.svg','assets/badge.png','assets/fry-radar-thumbnail.png?v=20261122radarred1','style.css','refinement.css','site-font.css','experience.css','studio-polish.css','catalog-news.css','site-features.css?v=20261123glassscroll1','typography-system.css?v=20261113a','brand-type.css?v=20261122type1','assets/fonts/wanted-sans-variable.woff2','editorial.css?v=20261113glassrestore','license-wallet.css?v=20261120reopen6',`site-features.js?v=${CONTROL_VERSION}`,`member.js?v=${WALLET_VERSION}`,...['member.css','member-model.js','fry-radar.css','fry-radar.js','radar-editorial.css','radar-model.js','ui-system.css'].map(p=>`${p}?v=${VERSION}`),...Array.from({length:16},(_,i)=>`assets/illustrations/friend-${String(i+1).padStart(2,'0')}.svg`)];
paths.push(`member.webmanifest?v=${VERSION}`,'liquid-glass.css?v=20261123glassscroll1','liquid-glass.js?v=20261123glassscroll1');
const urls=new Set(paths.map(p=>new URL(p,self.registration.scope).href));
const memberURL=new URL('member.html',self.registration.scope).href;
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(paths.map(p=>new Request(new URL(p,self.registration.scope),{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('gamttiz-member-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url),isMember=req.mode==='navigate'&&url.origin===new URL(memberURL).origin&&url.pathname===new URL(memberURL).pathname;
  if(!isMember&&!urls.has(url.href))return;
  event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(req,{cache:'no-store'});if(response.ok)await cache.put(isMember?memberURL:req,response.clone());return response;}catch{const saved=await cache.match(isMember?memberURL:req);return saved||Response.error();}})());
});

