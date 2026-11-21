(()=>{
  'use strict';
  const track=document.getElementById('gallery');
  const viewport=document.querySelector('.collection-carousel-window');
  const dots=document.getElementById('friends-dots');
  if(!track||!viewport)return;

  const originals=Array.from(track.querySelectorAll('.friend-carousel-card'));
  if(originals.length<2)return;
  const count=document.getElementById('friends-count');
  const pauseButton=document.getElementById('friends-pause');
  const controls=document.querySelector('.home-carousel-controls');
  const region=document.getElementById('friends-carousel');
  originals.forEach((card,i)=>{
    const index=document.createElement('span');index.className='home-friend-index';index.textContent='NO. '+String(i+1).padStart(2,'0');index.setAttribute('aria-hidden','true');card.prepend(index);
    const arrow=document.createElement('span');arrow.className='home-friend-arrow';arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');card.querySelector('.card-label')?.append(arrow);
  });

  // Two identical sequences create a seamless endless loop.
  for(const original of originals){
    const duplicate=original.cloneNode(true);
    duplicate.setAttribute('aria-hidden','true');
    duplicate.tabIndex=-1;
    duplicate.addEventListener('click',()=>original.click());
    track.append(duplicate);
  }

  const speed=32; // constant gentle motion: pixels per second
  let animation=null;
  let duration=0;
  let step=0;
  let activeIndex=-1;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible=true, dotTimer=0, manuallyPaused=false, interacting=false, focused=false, holdTimer=0, manualHold=false;
  function syncMotion(){
    if(!animation)return;
    const running=visible&&!document.hidden&&!reduced.matches&&!window.GTZHomeMotion?.scrolling&&!manuallyPaused&&!interacting&&!focused&&!manualHold;
    if(running){animation.play();if(!dotTimer)dotTimer=setInterval(updateDots,200);}
    else {animation.pause();clearInterval(dotTimer);dotTimer=0;}
    updateDots();
  }

  const dotButtons=originals.map((_,i)=>{
    const dot=document.createElement('button');
    dot.type='button';
    dot.className='carousel-dot';
    dot.setAttribute('aria-label',`${i+1}번째 감띠 보기`);
    dot.setAttribute('aria-pressed','false');
    dot.addEventListener('click',()=>jumpTo(i));
    dots?.append(dot);
    return dot;
  });

  function updateDots(){
    if(!animation||!duration||!step)return;
    const progress=((Number(animation.currentTime)||0)%duration+duration)%duration;
    const index=Math.floor((progress*speed/1000+step/2)/step)%originals.length;
    if(index===activeIndex)return;
    activeIndex=index;
    if(count)count.textContent=String(index+1).padStart(2,'0');
    dotButtons.forEach((dot,i)=>{
      const selected=i===index;
      dot.classList.toggle('is-active',selected);
      dot.setAttribute('aria-pressed',String(selected));
    });
  }

  function layout(){
    const first=originals[0];
    const duplicate=track.children[originals.length];
    const distance=duplicate.offsetLeft-first.offsetLeft;
    const spacing=originals[1].offsetLeft-first.offsetLeft;
    if(!(distance>0)||!(spacing>0)||typeof track.animate!=='function')return;
    if(animation&&Math.abs(duration-distance/speed*1000)<1&&step===spacing){syncMotion();return;}

    const phase=animation&&duration
      ? (((Number(animation.currentTime)||0)%duration)+duration)%duration/duration
      : 0;
    animation?.cancel();
    duration=distance/speed*1000;
    step=spacing;
    animation=track.animate(
      [{transform:'translate3d(0,0,0)'},{transform:'translate3d(-'+distance+'px,0,0)'}],
      {duration,iterations:Infinity,easing:'linear'}
    );
    activeIndex=-1;
    animation.currentTime=phase*duration;
    syncMotion();
  }

  function jumpTo(index){
    if(!animation||!duration||!step)return;
    index=(index+originals.length)%originals.length;
    manualHold=true;clearTimeout(holdTimer);
    animation.currentTime=(index*step/speed*1000)%duration;
    updateDots();
    syncMotion();
    holdTimer=setTimeout(()=>{manualHold=false;syncMotion();},3000);
  }

  document.getElementById('friends-prev')?.addEventListener('click',()=>jumpTo(activeIndex-1));
  document.getElementById('friends-next')?.addEventListener('click',()=>jumpTo(activeIndex+1));
  pauseButton?.addEventListener('click',()=>{
    manuallyPaused=!manuallyPaused;
    pauseButton.setAttribute('aria-pressed',String(manuallyPaused));
    pauseButton.setAttribute('aria-label',manuallyPaused?'자동 재생 시작':'자동 재생 일시 정지');
    pauseButton.querySelector('path')?.setAttribute('d',manuallyPaused?'M9 5l11 7-11 7z':'M9 5v14M15 5v14');
    syncMotion();
  });
  viewport.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){interacting=true;syncMotion();}});
  viewport.addEventListener('pointerleave',()=>{interacting=false;syncMotion();});
  region?.addEventListener('focusin',e=>{if(!controls?.contains(e.target)){focused=true;syncMotion();}});
  region?.addEventListener('focusout',e=>{if(!region.contains(e.relatedTarget)||controls?.contains(e.relatedTarget)){focused=false;syncMotion();}});
  // Touch swipes change only the horizontal selection. Do not intercept vertical scrolling.
  let origin=null,suppressClick=false;
  viewport.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'){origin={x:e.clientX,y:e.clientY};interacting=true;syncMotion();}},{passive:true});
  viewport.addEventListener('pointerup',e=>{
    if(!origin)return;
    const dx=e.clientX-origin.x,dy=e.clientY-origin.y;origin=null;interacting=false;
    if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.4){suppressClick=true;jumpTo(activeIndex+(dx<0?1:-1));setTimeout(()=>{suppressClick=false;},400);}
    syncMotion();
  },{passive:true});
  viewport.addEventListener('pointercancel',()=>{origin=null;interacting=false;syncMotion();},{passive:true});
  viewport.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopPropagation();suppressClick=false;}},true);

  let pending=false;
  const scheduleLayout=()=>{
    if(pending)return;
    pending=true;
    requestAnimationFrame(()=>{pending=false;layout();});
  };
  window.addEventListener('resize',scheduleLayout);
  if('ResizeObserver' in window){
    const observer=new ResizeObserver(scheduleLayout);
    observer.observe(viewport);
    observer.observe(originals[0]);
  }
  document.addEventListener('visibilitychange',syncMotion);
  if(reduced.addEventListener)reduced.addEventListener('change',syncMotion);
  else reduced.addListener?.(syncMotion);
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncMotion();}).observe(viewport);
  document.addEventListener('gtz-home-scroll-state',syncMotion);
  layout();
})();
