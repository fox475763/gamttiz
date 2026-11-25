/* Only Member's static UI is cached; no license or personal data is stored here. */
const CACHE='gamttiz-member-20261126-permanentmenu-v66';
const VERSION='20261123friends16';
const WALLET_VERSION='20261121walletsmooth11';
const CONTROL_VERSION='20261126permanentmenu21';
const paths=['favicon.ico?v=20261123pcround7','member.html','member.webmanifest','manifest.webmanifest',`manifest.webmanifest?v=20261123pcround7`,'assets/gamttiz-pc-rounded-192.png','assets/gamttiz-pc-rounded-512.png','assets/gamttiz-app-icon-512.png','assets/gamttiz-app-icon-180.png?v=20261123unified6','assets/gamttiz-pc-rounded-32.png?v=20261123pcround7','assets/badge.png','assets/fry-radar-thumbnail.png?v=20261122radarred1','style.css','refinement.css','site-font.css','experience.css','studio-polish.css','catalog-news.css','site-features.css?v=20261126permanentmenu21','typography-system.css?v=20261113a','brand-type.css?v=20261122type1','assets/fonts/wanted-sans-variable.woff2','editorial.css?v=20261113glassrestore','license-wallet.css?v=20261125walletdrag14','assets/license/reflection.svg?v=20261121curve2',`site-features.js?v=${CONTROL_VERSION}`,`member.js?v=${WALLET_VERSION}`,...['member.css','member-model.js','fry-radar.css','radar-editorial.css','radar-model.js','ui-system.css'].map(p=>`${p}?v=${VERSION}`),...Array.from({length:16},(_,i)=>`assets/illustrations/friend-${String(i+1).padStart(2,'0')}.svg`)];
paths.push('fry-radar.js?v=20261123attachedicon4','member.webmanifest?v=20261123friends16&icon=20261123pcround7',`member.webmanifest?v=${VERSION}`,'liquid-glass.css?v=20261125menustable11','liquid-glass.js?v=20261126permanentmenu21');
const urls=new Set(paths.map(p=>new URL(p,self.registration.scope).href));
const memberURL=new URL('member.html',self.registration.scope).href;
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(paths.map(p=>new Request(new URL(p,self.registration.scope),{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('gamttiz-member-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
// All public navigation and common menu resources revalidate consistently,
// even on pages outside Member. Keep the original Member-only offline cache.
const scope=new URL(self.registration.scope);
const publicPages=new Set(['','index.html','collection.html','products.html','project.html','license.html','member.html','play.html','news.html','quiz.html','combo.html','draw.html']);
const menuAssets=new Set(['site-features.js','site-features.css','liquid-glass.js','liquid-glass.css','home-fullpage.js','home-fullpage.css','license-wallet.css']);
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  const relative=url.pathname.slice(scope.pathname.length);
  const isMember=req.mode==='navigate'&&relative==='member.html';
  const isPublic=req.mode==='navigate'&&publicPages.has(relative);
  const cacheable=isMember||urls.has(url.href);
  if(!cacheable&&!isPublic&&!menuAssets.has(relative))return;
  event.respondWith((async()=>{
    const key=isMember?memberURL:req;
    let response;
    try{response=await fetch(req,{cache:'no-store'});}
    catch(error){
      if(cacheable){
        try{const saved=await (await caches.open(CACHE)).match(key);if(saved)return saved;}catch{}
      }
      return Response.error();
    }
    // Quota, eviction, or storage permission failures must NEVER replace a
    // successful network response with an error or obsolete cached script.
    if(cacheable&&response.ok){
      try{const cache=await caches.open(CACHE);await cache.put(key,response.clone());}catch{}
    }
    return response;
  })());
});
