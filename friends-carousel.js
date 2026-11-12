(()=>{
  'use strict';
  const track=document.getElementById('gallery');
  const viewport=document.querySelector('.collection-carousel-window');
  const dots=document.getElementById('friends-dots');
  if(!track||!viewport)return;

  const originals=Array.from(track.querySelectorAll('.friend-carousel-card'));
  if(originals.length<2)return;

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
    if(!(distance>0)||!(spacing>0))return;

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
    updateDots();
  }

  function jumpTo(index){
    if(!animation||!duration||!step)return;
    animation.currentTime=(index*step/speed*1000)%duration;
    updateDots();
  }

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
  // Update the current red dot while the strip continues moving.
  window.setInterval(updateDots,200);
})();