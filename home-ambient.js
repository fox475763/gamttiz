/* A single fixed animated stage follows chapter colours. Scroll handling
   reads only cached boundaries and updates the palette on chapter changes. */
(() => {
  'use strict';
  const host=document.querySelector('.home-ambient');
  if(!host)return;
  const chapters=[
    ['.hero','red'],['.collection','cream'],
    ['.story-row:not(.reverse)','gold'],['.story-row.reverse','coral'],
    ['.holder','cream'],['.home-package','gold'],['.experience-teaser','coral'],
    ['.radar-preview','white'],['.home-news,.home-news-feed','gold'],
    ['.guide','cream'],['.home-contact','coral'],['.social','gold'],
  ].map(([selector,palette])=>({el:document.querySelector(selector),palette})).filter(c=>c.el);
  let bounds=[],scheduled=false,measureNeeded=true;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const measure=()=>{
    const scroll=window.scrollY;
    bounds=chapters.map(c=>({...c,top:c.el.getBoundingClientRect().top+scroll})).sort((a,b)=>a.top-b.top);
    measureNeeded=false;
  };
  const update=()=>{
    scheduled=false;
    if(measureNeeded)measure();
    // Lead the transition a little as the next chapter enters the viewport.
    const position=window.scrollY+window.innerHeight*.42;
    let chapter=bounds[0];
    for(const candidate of bounds){if(candidate.top>position)break;chapter=candidate;}
    if(chapter&&host.dataset.palette!==chapter.palette)host.dataset.palette=chapter.palette;
  };
  const requestUpdate=()=>{
    if(!scheduled){scheduled=true;requestAnimationFrame(update);}
  };
  const requestMeasure=()=>{measureNeeded=true;requestUpdate();};
  const syncMotion=()=>host.classList.toggle('stage-paused',document.hidden||reduced.matches);
  host.classList.add('stage-initial');
  update();
  document.body.classList.add('home-palette-ready');
  requestAnimationFrame(()=>requestAnimationFrame(()=>host.classList.remove('stage-initial')));
  addEventListener('scroll',requestUpdate,{passive:true});
  addEventListener('resize',requestMeasure,{passive:true});
  addEventListener('pageshow',requestMeasure);
  addEventListener('load',requestMeasure,{once:true});
  if('ResizeObserver' in window){
    const observer=new ResizeObserver(requestMeasure);
    observer.observe(document.querySelector('#main'));
    chapters.forEach(c=>observer.observe(c.el));
  }
  document.fonts?.ready.then(requestMeasure);
  document.addEventListener('visibilitychange',syncMotion);
  if(reduced.addEventListener)reduced.addEventListener('change',syncMotion);else reduced.addListener(syncMotion);
  syncMotion();
})();
