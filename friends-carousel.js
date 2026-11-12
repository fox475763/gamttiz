(()=>{
  'use strict';
  const track=document.getElementById('gallery');
  const viewport=document.querySelector('.collection-carousel-window');
  const previous=document.getElementById('friends-prev');
  const next=document.getElementById('friends-next');
  const counter=document.getElementById('friends-position');
  if(!track||!viewport)return;

  const originals=Array.from(track.querySelectorAll('.friend-carousel-card'));
  if(originals.length<2)return;

  // Two identical sequences make the reset at the end of each loop invisible.
  for(const original of originals){
    const duplicate=original.cloneNode(true);
    duplicate.setAttribute('aria-hidden','true');
    duplicate.tabIndex=-1;
    // Preserve the full character detail dialog on the repeated cards.
    duplicate.addEventListener('click',()=>original.click());
    track.append(duplicate);
  }

  const speed=32; // steady leftward movement, in CSS pixels per second
  let animation=null;
  let duration=0;
  let step=0;
  let activeIndex=-1;

  function updateCounter(){
    if(!counter||!animation||!duration||!step)return;
    const progress=((Number(animation.currentTime)||0)%duration+duration)%duration;
    const index=Math.floor((progress*speed/1000+step/2)/step)%originals.length;
    if(index===activeIndex)return;
    activeIndex=index;
    counter.textContent=String(index+1).padStart(2,'0')+' / '+String(originals.length).padStart(2,'0');
  }

  function layout(){
    const first=originals[0];
    const duplicate=track.children[originals.length];
    const distance=duplicate.offsetLeft-first.offsetLeft;
    const spacing=originals[1].offsetLeft-first.offsetLeft;
    if(!(distance>0)||!(spacing>0))return;

    // Keep the same fractional loop progress through resize/layout changes.
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
    animation.currentTime=phase*duration;
    updateCounter();
  }

  function moveOne(direction){
    if(!animation||!duration||!step)return;
    const current=Number(animation.currentTime)||0;
    animation.currentTime=((current+direction*step/speed*1000)%duration+duration)%duration;
    updateCounter();
  }

  previous?.addEventListener('click',()=>moveOne(-1));
  next?.addEventListener('click',()=>moveOne(1));

  // Recalculate distances only when the layout changes, not every animation frame.
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

  document.addEventListener('visibilitychange',()=>{
    if(!animation)return;
    if(document.hidden)animation.pause();
    else animation.play();
  });

  layout();
  // Updating only the numeric counter does not affect the smooth animation.
  window.setInterval(updateCounter,250);
})();