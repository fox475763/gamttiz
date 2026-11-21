/* Native scroll: no scroll handlers, per-frame geometry, or scroll-owned state. */
(()=>{
  'use strict';
  if(!document.body.classList.contains('home-cinema')||!('IntersectionObserver' in window))return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const ticker=document.querySelector('.ticker');
  let tickerVisible=false;
  const syncTicker=()=>ticker?.classList.toggle('home-ticker-visible',tickerVisible&&!document.hidden&&!reduced.matches&&!window.GTZHomeMotion?.scrolling);
  if(ticker){
    new IntersectionObserver(([entry])=>{
      tickerVisible=entry.isIntersecting;syncTicker();
    }).observe(ticker);
    document.addEventListener('visibilitychange',syncTicker);
    document.addEventListener('gtz-home-scroll-state',syncTicker);
    reduced.addEventListener?.('change',syncTicker);
  }
  // The first poster and both story rows always remain fixed in their natural
  // layout. Only a tiny, once-per-view desktop image arrival is retained.
  if(!matchMedia('(min-width:901px) and (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)').matches)return;
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      observer.unobserve(entry.target);
      if(document.hidden||reduced.matches)continue;
      entry.target.classList.add('home-image-arrival');
      entry.target.addEventListener('animationend',()=>entry.target.classList.remove('home-image-arrival'),{once:true});
    }
  },{threshold:.25});
  document.querySelectorAll('.holder-image>img,.home-package-image>img').forEach(el=>observer.observe(el));
})();
