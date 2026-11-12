(()=>{
  'use strict';
  const track=document.getElementById('gallery');
  const area=document.getElementById('friends-carousel');
  const previous=document.getElementById('friends-prev');
  const next=document.getElementById('friends-next');
  const counter=document.getElementById('friends-position');
  if(!track||!area)return;

  const originals=Array.from(track.querySelectorAll('.friend-carousel-card'));
  if(!originals.length)return;

  // Repeat the entire 14-friend set. The boundary is visually identical,
  // so scrolling can wrap without returning visibly to the beginning.
  for(const source of originals){
    const copy=source.cloneNode(true);
    copy.setAttribute('aria-hidden','true');
    copy.tabIndex=-1;
    // cloneNode does not copy event listeners; open the original detail view.
    copy.addEventListener('click',()=>source.click());
    track.append(copy);
  }

  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const speed=30; // constant, gentle motion in CSS pixels per second
  let cycleWidth=0;
  let cardStride=0;
  let frame=0;
  let lastTime=0;
  let activeIndex=-1;

  function measure(){
    const first=originals[0];
    const firstCopy=track.children[originals.length];
    cycleWidth=firstCopy.offsetLeft-first.offsetLeft;
    cardStride=originals[1]?.offsetLeft-first.offsetLeft||first.getBoundingClientRect().width;
    if(cycleWidth>0 && track.scrollLeft>=cycleWidth)
      track.scrollLeft%=cycleWidth;
    updateCounter();
  }
  function updateCounter(){
    if(!counter||cardStride<=0)return;
    const index=Math.floor((track.scrollLeft+cardStride/2)/cardStride)%originals.length;
    if(index===activeIndex)return;
    activeIndex=index;
    counter.textContent=String(index+1).padStart(2,'0')+' / '+String(originals.length).padStart(2,'0');
  }
  function wrap(){
    if(cycleWidth>0 && track.scrollLeft>=cycleWidth)
      track.scrollLeft=track.scrollLeft%cycleWidth;
  }
  function animate(time){
    if(lastTime){
      // Browsers throttle background tabs: skip their elapsed time instead of jumping.
      const elapsed=Math.min((time-lastTime)/1000,0.05);
      if(!reduceMotion.matches&&cycleWidth>0){
        track.scrollLeft+=speed*elapsed;
        wrap();
        updateCounter();
      }
    }
    lastTime=time;
    frame=window.requestAnimationFrame(animate);
  }
  function jumpBy(direction){
    if(cardStride<=0||cycleWidth<=0)return;
    track.scrollLeft=(track.scrollLeft+direction*cardStride+cycleWidth)%cycleWidth;
    updateCounter();
  }

  previous?.addEventListener('click',()=>jumpBy(-1));
  next?.addEventListener('click',()=>jumpBy(1));
  track.addEventListener('scroll',()=>{wrap();updateCounter();},{passive:true});
  window.addEventListener('resize',measure);
  document.addEventListener('visibilitychange',()=>{lastTime=0;});
  // Only the system accessibility preference stops automatic movement.
  reduceMotion.addEventListener?.('change',()=>{lastTime=0;});

  measure();
  if(previous)previous.disabled=originals.length<2;
  if(next)next.disabled=originals.length<2;
  frame=window.requestAnimationFrame(animate);
})();
