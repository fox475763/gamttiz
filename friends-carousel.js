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
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let centers=[],active=-1,hoverX=null,scales=[],step=1;
  // Measure only on resize; scroll frames update transforms, not card geometry.
  function measure(){
    const base=track.offsetLeft;
    centers=cards.map(card=>base+card.offsetLeft+card.offsetWidth/2);
    step=Math.max(1,centers[1]-centers[0]||cards[0].offsetWidth);
    schedule();
  }
  function focusAt(x){
    let nearest=0;
    for(let i=1;i<centers.length;i++)if(Math.abs(centers[i]-x)<Math.abs(centers[nearest]-x))nearest=i;
    return nearest;
  }
  const focusPoint=()=>viewport.scrollLeft<2?centers[0]:viewport.scrollLeft>max()-2?centers.at(-1):viewport.scrollLeft+viewport.clientWidth/2;
  function settle(target=viewport.scrollLeft){
    target=Math.max(0,Math.min(max(),target));
    if(target<step*.38||target>max()-step*.38){viewport.scrollTo({left:target<step*.38?0:max(),behavior:reduced.matches?'auto':'smooth'});return;}
    const i=focusAt(target+viewport.clientWidth/2);
    viewport.scrollTo({left:Math.max(0,Math.min(max(),centers[i]-viewport.clientWidth/2)),behavior:reduced.matches?'auto':'smooth'});
  }
  let pending=false;
  function paint(){
    pending=false;
    const progress=max()?viewport.scrollLeft/max():0;
    range.value=String(Math.round(progress*1000));
    range.style.setProperty('--friends-progress',Math.max(0,Math.min(100,progress*100))+'%');
    const x=hoverX===null?focusPoint():viewport.scrollLeft+hoverX;
    const next=focusAt(x);
    if(next!==active){
      cards[active]?.classList.remove('is-dock-focus');
      cards[next]?.classList.add('is-dock-focus');active=next;
    }
    for(let i=0;i<cards.length;i++){
      const distance=Math.abs((centers[i]||0)-x)/step;
      const scale=reduced.matches?1:.78+.22*Math.exp(-distance*distance*.95);
      const value=scale.toFixed(3);
      if(scales[i]!==value){cards[i].style.setProperty('--dock-scale',value);scales[i]=value;}
    }
    range.setAttribute('aria-valuetext',Math.round(progress*100)+'%');
  }
  function schedule(){if(!pending){pending=true;requestAnimationFrame(paint);}}
  viewport.addEventListener('scroll',schedule,{passive:true});
  range.addEventListener('pointerdown',()=>viewport.classList.add('is-scrubbing'));
  range.addEventListener('input',()=>{hoverX=null;viewport.scrollLeft=max()*Number(range.value)/1000;schedule();});
  function endScrub(){viewport.classList.remove('is-scrubbing');}
  range.addEventListener('pointerup',endScrub);
  range.addEventListener('pointercancel',endScrub);
  range.addEventListener('blur',endScrub);
  range.addEventListener('keydown',e=>e.stopPropagation());
  range.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>Math.abs(e.deltaY)||e.shiftKey)e.stopPropagation();},{passive:true});
  let drag=null,suppressUntil=0;
  viewport.addEventListener('dragstart',e=>e.preventDefault());
  viewport.addEventListener('pointerdown',e=>{
    if(e.pointerType!=='mouse'||e.button!==0)return;
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:viewport.scrollLeft,active:false,lastX:e.clientX,lastT:performance.now(),velocity:0};
  });
  viewport.addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse'||drag?.active)return;
    const r=viewport.getBoundingClientRect();
    hoverX=(e.clientX-r.left)/(r.width/viewport.offsetWidth||1);
    schedule();
  },{passive:true});
  viewport.addEventListener('pointerleave',()=>{hoverX=null;schedule();},{passive:true});
  window.addEventListener('pointermove',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(!drag.active){
      if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){drag=null;return;}
      if(Math.abs(dx)<6)return;
      drag.active=true;hoverX=null;viewport.classList.add('is-dragging');
      viewport.setPointerCapture?.(e.pointerId);
    }
    e.preventDefault();
    const scale=viewport.getBoundingClientRect().width/viewport.offsetWidth||1;
    const now=performance.now(),dt=Math.max(1,now-drag.lastT);
    drag.velocity=drag.velocity*.55+(drag.lastX-e.clientX)/dt/scale*.45;
    drag.lastT=now;drag.lastX=e.clientX;
    viewport.scrollLeft=drag.left-dx/scale;
  },{passive:false});
  function end(e){
    if(!drag||drag.id!==e.pointerId)return;
    if(drag.active){suppressUntil=performance.now()+350;viewport.classList.remove('is-dragging');const velocity=performance.now()-drag.lastT<100?drag.velocity:0;const travel=Math.max(-step*1.6,Math.min(step*1.6,velocity*145));settle(viewport.scrollLeft+travel);}
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
  window.addEventListener('resize',measure);
  if('ResizeObserver' in window){const observer=new ResizeObserver(measure);observer.observe(viewport);observer.observe(track);}
  reduced.addEventListener?.('change',schedule);
  measure();
})();
