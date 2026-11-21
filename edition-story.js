(() => {
  'use strict';
  const body=document.body;
  const scenes=[...document.querySelectorAll('#main > section[data-chapter]')];
  if(!scenes.length)return;
  const indexEl=document.querySelector('[data-edition-index]'),labelEl=document.querySelector('[data-edition-label]');
  const prev=document.querySelector('[data-edition-prev]'),next=document.querySelector('[data-edition-next]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function syncChapters(){
    const index=Math.max(0,Math.min(scenes.length-1,Number(body.dataset.homeScene)||0));
    indexEl.textContent=String(index+1).padStart(2,'0')+' / '+String(scenes.length).padStart(2,'0');
    labelEl.textContent=scenes[index].dataset.chapter;
    for(const [control,delta] of [[prev,-1],[next,1]]){
      const target=scenes[index+delta];
      control.setAttribute('aria-disabled',String(!target));
      control.href='#'+(target||scenes[index]).id;
      control.tabIndex=target?0:-1;
    }
  }
  for(const button of [prev,next])button.addEventListener('click',e=>{if(button.getAttribute('aria-disabled')==='true'){e.preventDefault();e.stopPropagation();}});
  document.addEventListener('gtz-home-scene',syncChapters);syncChapters();
  const groups=new Map();
  document.querySelectorAll('[data-strip]').forEach(button=>{
    const track=document.getElementById(button.dataset.strip);if(!track)return;
    if(!groups.has(track))groups.set(track,[]);
    groups.get(track).push(button);
    button.addEventListener('click',()=>{
      const card=track.firstElementChild;
      const step=card?card.getBoundingClientRect().width+parseFloat(getComputedStyle(track).columnGap||0):track.clientWidth*.7;
      track.scrollBy({left:Number(button.dataset.dir)*Math.max(80,step),behavior:reduced.matches?'auto':'smooth'});
    });
  });
  for(const [track,buttons] of groups){
    let frame=0;
    const update=()=>{
      frame=0;
      const end=Math.max(0,track.scrollWidth-track.clientWidth);
      buttons.forEach(button=>button.disabled=Number(button.dataset.dir)<0?track.scrollLeft<=2:track.scrollLeft>=end-2);
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
    track.addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
    if('ResizeObserver' in window)new ResizeObserver(schedule).observe(track);
    document.addEventListener('gtz-home-scene',schedule);update();
  }
})();