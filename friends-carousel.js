(()=>{
  'use strict';
  const track=document.getElementById('gallery');
  const viewport=document.querySelector('.collection-carousel-window');
  const range=document.getElementById('friends-scroll');
  if(!track||!viewport||!range)return;
  const cards=Array.from(track.querySelectorAll('.friend-carousel-card'));
  if(!cards.length)return;
  cards.forEach(card=>{
    const img=card.querySelector('img');
    if(img){const photo=document.createElement('span');photo.className='friend-photo';img.before(photo);photo.append(img);}
  });
  const max=()=>Math.max(0,viewport.scrollWidth-viewport.clientWidth);
  let pending=false;
  function paint(){
    pending=false;
    const progress=max()?viewport.scrollLeft/max():0;
    range.value=String(Math.round(progress*1000));
    range.style.setProperty('--friends-progress',Math.max(0,Math.min(100,progress*100))+'%');
    range.setAttribute('aria-valuetext',Math.round(progress*100)+'%');
  }
  function schedule(){if(!pending){pending=true;requestAnimationFrame(paint);}}
  viewport.addEventListener('scroll',schedule,{passive:true});
  range.addEventListener('input',()=>{viewport.scrollLeft=max()*Number(range.value)/1000;schedule();});
  range.addEventListener('keydown',e=>e.stopPropagation());
  range.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>Math.abs(e.deltaY)||e.shiftKey)e.stopPropagation();},{passive:true});
  let drag=null,suppressUntil=0;
  viewport.addEventListener('dragstart',e=>e.preventDefault());
  viewport.addEventListener('pointerdown',e=>{
    if(e.pointerType!=='mouse'||e.button!==0)return;
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:viewport.scrollLeft,active:false};
  });
  window.addEventListener('pointermove',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(!drag.active){
      if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){drag=null;return;}
      if(Math.abs(dx)<6)return;
      drag.active=true;viewport.classList.add('is-dragging');
      viewport.setPointerCapture?.(e.pointerId);
    }
    e.preventDefault();
    const scale=viewport.getBoundingClientRect().width/viewport.offsetWidth||1;
    viewport.scrollLeft=drag.left-dx/scale;
  },{passive:false});
  function end(e){
    if(!drag||drag.id!==e.pointerId)return;
    if(drag.active){suppressUntil=performance.now()+350;viewport.classList.remove('is-dragging');}
    drag=null;
    if(viewport.hasPointerCapture?.(e.pointerId))viewport.releasePointerCapture(e.pointerId);
  }
  window.addEventListener('pointerup',end);
  window.addEventListener('pointercancel',end);
  viewport.addEventListener('click',e=>{
    if(performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();suppressUntil=0;}
  },true);
  viewport.addEventListener('wheel',e=>{
    if(e.shiftKey&&Math.abs(e.deltaY)>Math.abs(e.deltaX)){
      e.preventDefault();e.stopPropagation();viewport.scrollLeft+=e.deltaY;
    }else if(Math.abs(e.deltaX)>Math.abs(e.deltaY))e.stopPropagation();
  },{passive:false});
  viewport.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)||e.target!==viewport)return;
    e.preventDefault();e.stopPropagation();
    const step=cards[0].offsetWidth+16;
    viewport.scrollTo({left:e.key==='Home'?0:e.key==='End'?max():viewport.scrollLeft+(e.key==='ArrowLeft'?-step:step),behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
  });
  window.addEventListener('resize',schedule);
  if('ResizeObserver' in window){const observer=new ResizeObserver(schedule);observer.observe(viewport);observer.observe(track);}
  schedule();
})();
