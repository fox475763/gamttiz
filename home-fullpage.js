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
  let current=0,position=0,goal=0,frame=0,lastFrame=0,snapping=false,dragging=false,dragPosition=0,targetFocus=false,inMotion=false,frameHeight=0,measureQueued=false,inkTimer=0,paletteIndex=-1;
  let wheelTimer=0,lastWheel=-Infinity,wheelDirection=0,wheelOrigin=0;
  const previewed=new Set();
  const clampIndex=index=>Math.max(0,Math.min(scenes.length-1,index));
  const setPalette=(palette,duration=440)=>{
    const previous=host.dataset.palette;
    host.style.setProperty('--stage-speed',`${duration}ms`);
    host.dataset.palette=palette;body.dataset.homePalette=palette;
    clearTimeout(inkTimer);
    const ink=palette==='red'?'white':'dark';
    const apply=()=>{body.dataset.homeInk=ink;document.dispatchEvent(new Event('gtz-home-palette'));};
    if(!previous||reduced.matches||body.dataset.homeInk===ink)apply();
    else inkTimer=setTimeout(apply,palette==='red'?Math.round(duration*.5):Math.round(duration*.18));
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
  const scheduleMeasure=()=>{if(!measureQueued){measureQueued=true;requestAnimationFrame(()=>{measure();if(inMotion)requestFrame();});}};
  function setActive(index,announce=true){
    current=index;
    scenes.forEach((el,i)=>{
      const selected=i===index;
      el.classList.toggle('is-current',selected);el.classList.toggle('is-before',i<index);el.classList.remove('is-leaving','is-preview');el.style.removeProperty('transform');
      el.inert=!selected;el.setAttribute('aria-hidden',String(!selected));
    });
    previewed.clear();body.dataset.homeScene=String(index);body.dataset.homeSceneCount=String(scenes.length);
    if(announce){const heading=scenes[index].querySelector('h1,h2');status.textContent=`${index+1} / ${scenes.length} · ${heading?.textContent.trim()||'감띠즈'}`;}
    document.dispatchEvent(new Event('gtz-home-scene'));
  }
  function motion(active){
    if(inMotion===active)return;
    inMotion=active;
    if(window.GTZHomeMotion)window.GTZHomeMotion.scrolling=active;
    document.dispatchEvent(new Event('gtz-home-scroll-state'));
  }
  const transform=(offset,fit)=>`translate3d(0,calc(-50% + ${offset}px),0) scale(${fit})`;
  const overlayOpen=()=>!!document.querySelector('dialog[open],.control-dock:not([data-mode="closed"]),.gtz-wallet-sheet[aria-hidden="false"]');
  // One continuous virtual dial: only the two adjacent scenes receive a
  // compositor transform. Neither the document nor the stage scrolls.
  function syncPalette(index){
    if(paletteIndex===index)return;
    paletteIndex=index;setPalette(order[index].palette,300);
    body.dataset.homeScene=String(index);document.dispatchEvent(new Event('gtz-home-scene'));
  }
  function paint(){
    const lower=Math.floor(position),upper=Math.ceil(position);
    const next=new Set([lower,upper]);
    for(const i of previewed)if(!next.has(i)){const el=order[i].el;el.classList.remove('is-preview');el.style.removeProperty('transform');previewed.delete(i);}
    for(const i of next){
      const {el,fit}=order[i];
      if(!previewed.has(i)){el.classList.add('is-preview');previewed.add(i);}
      el.style.transform=transform((i-position)*frameHeight,fit);
    }
    syncPalette(Math.round(position));
  }
  function begin(){
    if(inMotion)return;
    if(order[current].el.contains(document.activeElement))viewport.focus({preventScroll:true});
    // Keep the actual section inert while its contents are in transit.
    order[current].el.classList.remove('is-current');order[current].el.inert=true;order[current].el.setAttribute('aria-hidden','true');
    motion(true);paint();
  }
  function finish(index){
    clearTimeout(wheelTimer);wheelTimer=0;
    if(frame)cancelAnimationFrame(frame);frame=0;lastFrame=0;
    dragging=false;snapping=false;position=goal=clampIndex(index);
    syncPalette(position);setActive(position);motion(false);
    if(targetFocus)viewport.focus({preventScroll:true});targetFocus=false;
  }
  function requestFrame(){if(!frame)frame=requestAnimationFrame(tick);}
  function tick(now){
    frame=0;
    if(!inMotion){lastFrame=0;return;}
    if(overlayOpen()){finish(Math.round(position));return;}
    if(dragging){position=dragPosition;paint();lastFrame=0;return;}
    // Time-based damping is continuous across input events: no per-page lock,
    // no backlog of animations, and no sudden acceleration at each boundary.
    const dt=lastFrame?Math.max(1,Math.min(48,now-lastFrame)):16;lastFrame=now;
    const factor=reduced.matches?1:1-Math.exp(-dt/(snapping?82:58));
    position=clampIndex(position+(goal-position)*factor);
    if(Math.abs(goal-position)<.005){position=goal;paint();if(snapping)finish(Math.round(goal));else lastFrame=0;return;}
    paint();requestFrame();
  }
  function snapTo(index,focus=false){
    clearTimeout(wheelTimer);wheelTimer=0;
    targetFocus=focus;goal=clampIndex(Math.round(index));dragging=false;snapping=true;
    if(reduced.matches||Math.abs(position-goal)<.005){finish(goal);return;}
    begin();requestFrame();
  }
  function go(index,{focus=false,instant=false}={}){
    const next=clampIndex(index);targetFocus=focus;
    // Explicit links can jump to a distant section without playing every
    // intervening chapter. Adjacent moves retain the same soft landing.
    if(instant||reduced.matches||Math.abs(next-position)>1.45){finish(next);return;}
    snapTo(next,focus);
  }
  function stepBy(direction,count=1,focus=false){
    const base=Math.round(goal);
    snapTo(clampIndex(base+direction*count),focus);
  }
  function wheelSettle(){
    wheelTimer=0;
    let target=Math.round(goal);
    if(target===wheelOrigin&&Math.abs(goal-wheelOrigin)>=.10)target=wheelOrigin+wheelDirection;
    lastWheel=-Infinity;
    snapTo(clampIndex(target));
  }
  viewport.addEventListener('wheel',e=>{
    if(e.ctrlKey||overlayOpen()||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
    e.preventDefault();
    const now=performance.now();
    const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?frameHeight:1);
    const direction=Math.sign(delta);if(!direction)return;
    if(now-lastWheel>170||direction!==wheelDirection){
      if(direction!==wheelDirection&&inMotion)goal=position;
      wheelOrigin=Math.round(goal);
    }
    lastWheel=now;wheelDirection=direction;
    // About one screen per 340–520 input pixels. Limit the untravelled
    // lead to a little over one scene so flings cannot queue many pages.
    const stride=Math.max(340,Math.min(520,frameHeight*.55));
    const amount=Math.min(.85,Math.abs(delta)/stride)*direction;
    goal=clampIndex(Math.max(position-1.12,Math.min(position+1.12,goal+amount)));
    if(Math.abs(goal-position)<.0001&&!inMotion)return;
    targetFocus=false;dragging=false;snapping=false;begin();requestFrame();
    clearTimeout(wheelTimer);wheelTimer=setTimeout(wheelSettle,125);
  },{passive:false});
  let gesture=null,ignoreClicksUntil=0;
  function cancelGesture(){
    if(gesture?.axis==='y'){position=dragPosition;dragging=false;snapTo(Math.round(position));}
    gesture=null;
  }
  viewport.addEventListener('touchstart',e=>{
    if(e.touches.length!==1||overlayOpen()){cancelGesture();return;}
    const t=e.touches[0],now=performance.now();gesture={x:t.clientX,y:t.clientY,axis:null,base:position,lastY:t.clientY,lastTime:now,velocity:0};
  },{passive:true});
  viewport.addEventListener('touchmove',e=>{
    if(!gesture||e.touches.length!==1){cancelGesture();return;}
    const t=e.touches[0],dx=t.clientX-gesture.x,dy=t.clientY-gesture.y;
    if(!gesture.axis&&Math.max(Math.abs(dx),Math.abs(dy))>8){
      gesture.axis=Math.abs(dy)>Math.abs(dx)*1.15?'y':'x';
      if(gesture.axis==='y'){
        clearTimeout(wheelTimer);wheelTimer=0;
        gesture.base=position;goal=position;dragging=true;snapping=false;targetFocus=false;begin();
      }
    }
    if(gesture.axis!=='y')return;
    if(e.cancelable)e.preventDefault();
    const now=performance.now(),dt=Math.max(1,now-gesture.lastTime);
    gesture.velocity=(gesture.lastY-t.clientY)/dt;gesture.lastY=t.clientY;gesture.lastTime=now;
    // The content follows the finger immediately, rather than waiting for
    // touchend. One gesture is limited to the adjacent scene in either direction.
    dragPosition=clampIndex(Math.max(gesture.base-1,Math.min(gesture.base+1,gesture.base-dy/Math.max(1,frameHeight))));
    requestFrame();
  },{passive:false});
  viewport.addEventListener('touchend',e=>{
    if(!gesture)return;
    const t=e.changedTouches[0],dy=t.clientY-gesture.y,g=gesture;gesture=null;
    if(g.axis!=='y')return;
    position=dragPosition;dragging=false;
    const now=performance.now(),velocity=now-g.lastTime<110?g.velocity:0;
    const base=Math.round(g.base),direction=Math.sign(-dy);
    const projected=position+Math.max(-.22,Math.min(.22,velocity*115/Math.max(1,frameHeight)));
    let next=Math.round(projected);
    if(next===base&&Math.abs(dy)>42&&(Math.abs(position-g.base)>.16||Math.abs(velocity)>.65))next=base+direction;
    next=clampIndex(Math.max(base-1,Math.min(base+1,next)));
    ignoreClicksUntil=now+300;snapTo(next);
  },{passive:true});
  viewport.addEventListener('touchcancel',cancelGesture,{passive:true});
  viewport.addEventListener('click',e=>{if(performance.now()<ignoreClicksUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
  document.addEventListener('keydown',e=>{
    if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||overlayOpen()||e.target.closest?.('input,textarea,select,[contenteditable]'))return;
    const keys={ArrowDown:1,PageDown:1,ArrowUp:-1,PageUp:-1};
    if(e.key in keys||(e.key===' '&&!e.target.closest?.('a,button'))){e.preventDefault();stepBy(e.key in keys?keys[e.key]:e.shiftKey?-1:1,1,true);return;}
    if(e.key==='Home'||e.key==='End'){e.preventDefault();if(!e.repeat)go(e.key==='Home'?0:scenes.length-1,{focus:true});}
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
  position=goal=initial;paletteIndex=initial;host.classList.add('stage-initial');setPalette(order[initial].palette);measure();setActive(initial,false);
  requestAnimationFrame(()=>requestAnimationFrame(()=>host.classList.remove('stage-initial')));
  const syncMotion=()=>host.classList.toggle('stage-paused',document.hidden||reduced.matches);
  document.addEventListener('visibilitychange',syncMotion);reduced.addEventListener?.('change',syncMotion);syncMotion();
  addEventListener('resize',scheduleMeasure,{passive:true});addEventListener('pageshow',scheduleMeasure);addEventListener('load',scheduleMeasure,{once:true});
  document.fonts?.ready.then(scheduleMeasure);
  if('ResizeObserver' in window){const ro=new ResizeObserver(scheduleMeasure);ro.observe(viewport);scenes.forEach(el=>ro.observe(el));}
})();
