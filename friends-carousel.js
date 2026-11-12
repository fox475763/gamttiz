(()=>{
  'use strict';
  const track=document.getElementById('gallery');
  const area=document.getElementById('friends-carousel');
  const prev=document.getElementById('friends-prev');
  const next=document.getElementById('friends-next');
  const position=document.getElementById('friends-position');
  if(!track||!area)return;

  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const detail=document.getElementById('detail');
  let index=0;
  let timer=null;
  const slides=()=>Array.from(track.querySelectorAll('.friend-carousel-card'));
  const stops=()=>{
    const cards=slides();
    if(!cards.length)return [0];
    const max=Math.max(0,track.scrollWidth-track.clientWidth);
    const first=cards[0].offsetLeft;
    const values=[];
    for(const card of cards){
      const offset=Math.min(max,Math.max(0,card.offsetLeft-first));
      if(!values.length||offset-values[values.length-1]>3)values.push(offset);
    }
    return values.length?values:[0];
  };
  const update=()=>{
    const points=stops();
    index=Math.min(index,points.length-1);
    if(position)position.textContent=
      String(index+1).padStart(2,'0')+' / '+String(points.length).padStart(2,'0');
    if(prev)prev.disabled=points.length<=1;
    if(next)next.disabled=points.length<=1;
  };
  const moveTo=target=>{
    const points=stops();
    index=(target+points.length)%points.length;
    track.scrollTo({
      left:points[index],
      behavior:reducedMotion.matches?'auto':'smooth'
    });
    update();
  };
  const pause=()=>{if(timer!==null){window.clearInterval(timer);timer=null;}};
  const play=()=>{
    pause();
    if(reducedMotion.matches||stops().length<=1)return;
    timer=window.setInterval(()=>{
      if(document.hidden||detail?.open||area.matches(':hover')||
         track.contains(document.activeElement))return;
      const box=area.getBoundingClientRect();
      if(box.bottom<=0||box.top>=window.innerHeight)return;
      moveTo(index+1);
    },5000);
  };

  prev?.addEventListener('click',()=>{moveTo(index-1);play();});
  next?.addEventListener('click',()=>{moveTo(index+1);play();});
  track.addEventListener('scroll',()=>{
    const points=stops();
    index=points.reduce((best,current,i)=>
      Math.abs(current-track.scrollLeft)<Math.abs(points[best]-track.scrollLeft)?i:best,0);
    update();
  },{passive:true});
  window.addEventListener('resize',()=>{moveTo(Math.min(index,stops().length-1));play();});
  reducedMotion.addEventListener?.('change',play);

  update();
  play();
})();