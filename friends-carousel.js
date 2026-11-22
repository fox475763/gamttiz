(()=>{
  'use strict';
  const track=document.getElementById('gallery');
  const viewport=document.querySelector('.collection-carousel-window');
  const dots=document.getElementById('friends-dots');
  if(!track||!viewport)return;

  const originals=Array.from(track.querySelectorAll('.friend-carousel-card'));
  if(originals.length<2)return;
  const region=document.getElementById('friends-carousel');
  originals.forEach((card,i)=>{
    const img=card.querySelector('img');
    if(img){const photo=document.createElement('span');photo.className='friend-photo';img.before(photo);photo.append(img);}
    const english=document.createElement('small');english.className='friend-english';english.textContent=products[i]?.english||'';card.querySelector('.card-label')?.append(english);
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
  let visible=true, dotTimer=0, interacting=false, focused=false, holdTimer=0, manualHold=false, selectionMotion=null;
  function syncMotion(){
    if(!animation)return;
    const walletOpen=document.documentElement.classList.contains('gtz-wallet-open');
    if(walletOpen||window.GTZHomeMotion?.scrolling||reduced.matches||!visible){selectionMotion?.cancel();selectionMotion=null;}
    const running=visible&&!document.hidden&&!walletOpen&&!reduced.matches&&!window.GTZHomeMotion?.scrolling&&!interacting&&!focused&&!manualHold;
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
    selectionMotion?.cancel();selectionMotion=null;
    // Brief compositor-only slide on explicit selection; no scroll-linked frame loop.
    const loopDistance=duration*speed/1000;
    let from=(((Number(animation.currentTime)||0)%duration+duration)%duration)*speed/1000;
    let target=index*step;
    if(target-from>loopDistance/2)from+=loopDistance;
    else if(from-target>loopDistance/2)target+=loopDistance;
    animation.currentTime=(index*step/speed*1000)%duration;
    updateDots();
    syncMotion();
    if(!reduced.matches&&visible&&!window.GTZHomeMotion?.scrolling&&Math.abs(target-from)<=step*2.1){
      selectionMotion=track.animate([{transform:`translate3d(${-from}px,0,0)`},{transform:`translate3d(${-target}px,0,0)`}],{duration:280,easing:'cubic-bezier(.2,.7,.24,1)'});
      const motion=selectionMotion;motion.finished.catch(()=>{}).then(()=>{if(selectionMotion===motion)selectionMotion=null;});
    }
    holdTimer=setTimeout(()=>{manualHold=false;syncMotion();},3000);
  }

  viewport.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){interacting=true;syncMotion();}});
  viewport.addEventListener('pointerleave',()=>{interacting=false;syncMotion();});
  region?.addEventListener('focusin',()=>{focused=true;syncMotion();});
  region?.addEventListener('focusout',e=>{if(!region.contains(e.relatedTarget)){focused=false;syncMotion();}});
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
  document.addEventListener('gtz-wallet-visibility',syncMotion);
  layout();
})();

