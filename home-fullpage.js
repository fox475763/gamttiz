/* Wheel and vertical swipes choose scenes; they do not scroll the page. */
(() => {
  'use strict';
  const host=document.querySelector('.home-ambient');
  const viewport=document.querySelector('.home-scroll-viewport');
  const main=document.querySelector('#main');
  if(!host||!viewport||!main)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const body=document.body;
  const hero=main.querySelector('.hero');
  const ticker=main.querySelector('.ticker');
  if(hero&&ticker)hero.append(ticker);
  const stories=main.querySelector('.stories');
  // Each of the two existing stories is its own viewport-sized scene.
  if(stories){
    const rows=[...stories.querySelectorAll(':scope > .story-row')];
    for(const row of rows.slice(1)){
      const section=stories.cloneNode(false);section.removeAttribute('id');
      section.setAttribute('aria-label','감띠즈 이야기 02');
      stories.after(section);section.append(row);
    }
  }
  const footer=viewport.querySelector('footer');
  const social=main.querySelector('.social');
  if(footer&&social)social.append(footer);
  const scenes=[...main.children].filter(el=>el.matches('section'));
  if(!scenes.length)return;
  const paletteFor=el=>el.matches('.hero,.experience-teaser,.home-contact')||el.querySelector('.story-row.reverse')?'red':el.matches('.home-package,.home-news,.home-news-feed,.social')||el.querySelector('.story-row:not(.reverse)')?'yellow':'white';
  const order=scenes.map(el=>({el,palette:paletteFor(el),fit:1}));
  const status=document.createElement('p');status.className='home-scene-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');viewport.append(status);
  viewport.setAttribute('aria-label','홈 콘텐츠, 휠 또는 스와이프와 위아래 방향키로 장면 이동');
  body.classList.add('home-fullpage','home-palette-ready');
  scenes.forEach((el,i)=>{el.classList.add('home-scene');el.dataset.scene=String(i);el.inert=true;el.setAttribute('aria-hidden','true');});
  let current=0,transitioning=false,pending=null,frameHeight=0,measureQueued=false,inkTimer=0,transitionSerial=0;
  const setPalette=palette=>{
    const previous=host.dataset.palette;
    host.dataset.palette=palette;body.dataset.homePalette=palette;
    clearTimeout(inkTimer);
    const ink=palette==='red'?'white':'dark';
    const apply=()=>{body.dataset.homeInk=ink;document.dispatchEvent(new Event('gtz-home-palette'));};
    if(!previous||reduced.matches||body.dataset.homeInk===ink)apply();
    else inkTimer=setTimeout(apply,palette==='red'?220:80);
  };
  function measure(){
    measureQueued=false;
    frameHeight=viewport.clientHeight;
    viewport.style.setProperty('--scene-h',`${frameHeight}px`);
    // Most scenes use responsive sizing. The final fit guard is for short
    // screens, long translated headlines, late fonts and dynamic notices.
    for(const s of order){
      const natural=Math.max(s.el.offsetHeight,s.el.scrollHeight);
      const fit=Math.min(1,Math.max(0.35,(frameHeight-8)/Math.max(1,natural)));
      s.fit=fit;s.el.style.setProperty('--scene-fit',String(fit));
    }
  }
  const scheduleMeasure=()=>{if(!measureQueued){measureQueued=true;requestAnimationFrame(measure);}};
  function setActive(index,announce=true){
    current=index;
    scenes.forEach((el,i)=>{
      const selected=i===index;
      el.classList.toggle('is-current',selected);el.classList.toggle('is-before',i<index);el.classList.remove('is-leaving');
      el.inert=!selected;el.setAttribute('aria-hidden',String(!selected));
    });
    body.dataset.homeScene=String(index);body.dataset.homeSceneCount=String(scenes.length);
    if(announce){const heading=scenes[index].querySelector('h1,h2');status.textContent=`${index+1} / ${scenes.length} · ${heading?.textContent.trim()||'감띠즈'}`;}
    document.dispatchEvent(new Event('gtz-home-scene'));
  }
  function motion(active){
    if(window.GTZHomeMotion)window.GTZHomeMotion.scrolling=active;
    document.dispatchEvent(new Event('gtz-home-scroll-state'));
  }
  const transform=(offset,fit)=>`translate3d(0,calc(-50% + ${offset}px),0) scale(${fit})`;
  function go(index,{focus=false,instant=false}={}){
    index=Math.max(0,Math.min(scenes.length-1,index));
    if(transitioning){if(focus||instant)pending={index,focus,instant};return;}
    if(index===current){if(focus)viewport.focus({preventScroll:true});return;}
    const from=order[current],to=order[index],dir=index>current?1:-1;
    if(from.el.contains(document.activeElement))viewport.focus({preventScroll:true});
    measure();transitioning=true;motion(true);
    const serial=++transitionSerial;
    from.el.classList.remove('is-current');from.el.classList.add('is-leaving');from.el.inert=true;from.el.setAttribute('aria-hidden','true');
    to.el.classList.add('is-current');to.el.classList.remove('is-before');to.el.inert=true;
    const done=()=>{
      if(serial!==transitionSerial)return;
      setActive(index);transitioning=false;motion(false);setPalette(to.palette);
      if(focus)viewport.focus({preventScroll:true});
      if(pending){const next=pending;pending=null;go(next.index,next);}
    };
    if(instant||reduced.matches||typeof from.el.animate!=='function'){setPalette(to.palette);done();return;}
    // Only the outgoing and incoming scenes move; the fixed stage, header,
    // and glass menu never move. No per-frame layout or forced scrolling.
    const h=frameHeight+12;
    const options={duration:680,easing:'cubic-bezier(.22,.72,.25,1)',fill:'both'};
    const a=from.el.animate([{transform:transform(0,from.fit)},{transform:transform(-dir*h,from.fit)}],options);
    const b=to.el.animate([{transform:transform(dir*h,to.fit)},{transform:transform(0,to.fit)}],options);
    setPalette(to.palette);
    Promise.allSettled([a.finished,b.finished]).then(()=>{a.cancel();b.cancel();done();});
  }
  const overlayOpen=()=>!!document.querySelector('dialog[open],.control-dock:not([data-mode="closed"]),.gtz-wallet-sheet[aria-hidden="false"]');
  let wheelDistance=0,lastWheel=-Infinity,wheelConsumed=false;
  viewport.addEventListener('wheel',e=>{
    if(e.ctrlKey||overlayOpen()||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
    e.preventDefault();
    const now=performance.now();
    if(now-lastWheel>170){wheelDistance=0;wheelConsumed=false;}
    lastWheel=now;
    if(transitioning||wheelConsumed){wheelConsumed=true;return;}
    const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?frameHeight:1);
    if(Math.sign(delta)!==Math.sign(wheelDistance))wheelDistance=0;
    wheelDistance+=delta;
    if(Math.abs(wheelDistance)>=30){wheelConsumed=true;go(current+Math.sign(wheelDistance));}
  },{passive:false});
  let gesture=null,ignoreClicksUntil=0;
  viewport.addEventListener('touchstart',e=>{
    if(e.touches.length!==1||overlayOpen()){gesture=null;return;}
    const t=e.touches[0];gesture={x:t.clientX,y:t.clientY,axis:null};
  },{passive:true});
  viewport.addEventListener('touchmove',e=>{
    if(!gesture||e.touches.length!==1){gesture=null;return;}
    const t=e.touches[0],dx=t.clientX-gesture.x,dy=t.clientY-gesture.y;
    if(!gesture.axis&&Math.max(Math.abs(dx),Math.abs(dy))>9)gesture.axis=Math.abs(dy)>Math.abs(dx)*1.15?'y':'x';
    if(gesture.axis==='y'&&e.cancelable)e.preventDefault();
  },{passive:false});
  viewport.addEventListener('touchend',e=>{
    if(!gesture)return;
    const t=e.changedTouches[0],dx=t.clientX-gesture.x,dy=t.clientY-gesture.y;
    const vertical=gesture.axis!=='x'&&Math.abs(dy)>44&&Math.abs(dy)>Math.abs(dx)*1.25;gesture=null;
    if(vertical&&!overlayOpen()){ignoreClicksUntil=performance.now()+350;go(current+(dy<0?1:-1));}
  },{passive:true});
  viewport.addEventListener('touchcancel',()=>{gesture=null;},{passive:true});
  viewport.addEventListener('click',e=>{if(performance.now()<ignoreClicksUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
  document.addEventListener('keydown',e=>{
    if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||overlayOpen()||e.target.closest?.('input,textarea,select,[contenteditable]'))return;
    const keys={ArrowDown:1,PageDown:1,ArrowUp:-1,PageUp:-1};
    let target=e.key in keys?current+keys[e.key]:null;
    if(e.key===' '&&!e.target.closest?.('a,button'))target=current+(e.shiftKey?-1:1);
    if(e.key==='Home')target=0;if(e.key==='End')target=scenes.length-1;
    if(target!==null){e.preventDefault();if(!e.repeat)go(target,{focus:true});}
  });
  function indexFromHash(hash){
    if(!hash||hash==='#')return 0;
    if(hash==='#main')return current;
    let id;try{id=decodeURIComponent(hash.slice(1));}catch{return -1;}
    const target=document.getElementById(id);return target?scenes.findIndex(el=>el===target||el.contains(target)):-1;
  }
  document.addEventListener('click',e=>{
    const link=e.target.closest?.('a[href^="#"]');
    if(!link||e.defaultPrevented||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
    const hash=link.getAttribute('href'),index=indexFromHash(hash);
    if(index<0)return;e.preventDefault();
    if(hash==='#main'){viewport.focus({preventScroll:true});return;}
    const url=location.pathname+location.search+(hash==='#'?'':hash);
    if(url!==location.pathname+location.search+location.hash)history.pushState(null,'',url);
    go(index,{focus:true});
  });
  const syncHash=()=>{const index=indexFromHash(location.hash);if(index>=0)go(index,{focus:true});};
  addEventListener('hashchange',syncHash);addEventListener('popstate',syncHash);
  const initial=Math.max(0,indexFromHash(location.hash));
  host.classList.add('stage-initial');setPalette(order[initial].palette);measure();setActive(initial,false);
  requestAnimationFrame(()=>requestAnimationFrame(()=>host.classList.remove('stage-initial')));
  const syncMotion=()=>host.classList.toggle('stage-paused',document.hidden||reduced.matches);
  document.addEventListener('visibilitychange',syncMotion);reduced.addEventListener?.('change',syncMotion);syncMotion();
  addEventListener('resize',scheduleMeasure,{passive:true});addEventListener('pageshow',scheduleMeasure);addEventListener('load',scheduleMeasure,{once:true});
  document.fonts?.ready.then(scheduleMeasure);
  if('ResizeObserver' in window){const ro=new ResizeObserver(scheduleMeasure);ro.observe(viewport);scenes.forEach(el=>ro.observe(el));}
})();
