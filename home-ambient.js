/* A single fixed animated stage follows chapter colours. Scroll handling
   reads only cached boundaries and updates the palette on chapter changes. */
(() => {
  'use strict';
  const host=document.querySelector('.home-ambient');
  const viewport=document.querySelector('.home-scroll-viewport');
  if(!host||!viewport)return;
  const chapters=[
    ['.hero','red'],['.collection','white'],
    ['.story-row:not(.reverse)','yellow'],['.story-row.reverse','red'],
    ['.holder','white'],['.home-package','yellow'],['.experience-teaser','red'],
    ['.radar-preview','white'],['.home-news,.home-news-feed','yellow'],
    ['.guide','white'],['.home-contact','red'],['.social','yellow'],
  ].map(([selector,palette])=>({el:document.querySelector(selector),palette})).filter(c=>c.el);
  let bounds=[],scheduled=false,measureNeeded=true,inkTimer=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const measure=()=>{
    const origin=viewport.getBoundingClientRect().top-viewport.scrollTop;
    bounds=chapters.map(c=>({...c,top:c.el.getBoundingClientRect().top-origin})).sort((a,b)=>a.top-b.top);
    measureNeeded=false;
  };
  const setPalette=palette=>{
    const previous=host.dataset.palette;
    if(previous===palette)return;
    host.dataset.palette=palette;
    document.body.dataset.homePalette=palette;
    clearTimeout(inkTimer);
    const ink=palette==='red'?'white':'dark';
    const applyInk=()=>{document.body.dataset.homeInk=ink;document.dispatchEvent(new Event('gtz-home-palette'));};
    if(!previous||reduced.matches||document.body.dataset.homeInk===ink)applyInk();
    else inkTimer=setTimeout(applyInk,palette==='red'?320:90);
  };
  const update=()=>{
    scheduled=false;
    if(measureNeeded)measure();
    // Change once at each chapter boundary, with a short eased colour handoff.
    const position=viewport.scrollTop+viewport.clientHeight*.44;
    let chapter=bounds[0];
    for(const candidate of bounds){if(candidate.top>position)break;chapter=candidate;}
    if(chapter)setPalette(chapter.palette);
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
  viewport.addEventListener('scroll',requestUpdate,{passive:true});
  addEventListener('resize',requestMeasure,{passive:true});
  addEventListener('pageshow',requestMeasure);
  addEventListener('load',requestMeasure,{once:true});
  if('ResizeObserver' in window){
    const observer=new ResizeObserver(requestMeasure);
    observer.observe(viewport);
    observer.observe(document.querySelector('#main'));
    chapters.forEach(c=>observer.observe(c.el));
  }
  document.fonts?.ready.then(requestMeasure);
  document.addEventListener('visibilitychange',syncMotion);
  if(reduced.addEventListener)reduced.addEventListener('change',syncMotion);else reduced.addListener(syncMotion);
  syncMotion();
  // Native fragment links keep working inside the viewport; the empty home
  // link needs to reset this scroll surface rather than the locked document.
  document.addEventListener('click',event=>{
    const link=event.target.closest?.('a[href="#"]');
    if(!link||event.defaultPrevented||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault();
    viewport.scrollTo({top:0,behavior:reduced.matches?'auto':'smooth'});
    if(location.hash)history.replaceState(history.state,'',location.pathname+location.search);
  });
})();
