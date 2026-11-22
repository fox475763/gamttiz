(()=>{'use strict';
  const {characters,image,dayKey}=GTZFriends;
  const stack=document.querySelector('#fry-stack'),stage=document.querySelector('#fry-stage'),revealStage=document.querySelector('#fry-reveal'),revealImage=document.querySelector('#fry-reveal-image'),revealName=document.querySelector('#fry-reveal-name'),hint=document.querySelector('#fry-pull-hint'),replay=document.querySelector('#draw-replay'),status=document.querySelector('#draw-status'),dateLabel=document.querySelector('#draw-date'),result=document.querySelector('#draw-result'),placeholder=document.querySelector('#draw-placeholder'),profile=document.querySelector('#draw-profile');
  const key='gamttiz-daily-draw-v1',reduced=matchMedia('(prefers-reduced-motion: reduce)');
  // Five straight rectangular sticks sit within the original five-slot 3D holder.
  const shapes=[[31,40,0,7.8],[40.5,44,0,7.8],[50,46,0,7.8],[59.5,43,0,7.8],[69,39,0,7.8]];
  const allIds=characters.map(c=>c.id);
  let date=dayKey(),selected=0,selectedSlot=0,remaining=[...allIds],busy=false,drag=null,keyboardPull=null,generation=0;
  const fries=shapes.map(([x,len,tilt,width],i)=>{
    const el=document.createElement('button');el.type='button';el.className='fry-choice';
    el.setAttribute('aria-label',(i+1)+'번째 감자튀김. 위로 당기기. 키보드는 위쪽 방향키.');
    el.style.setProperty('--x',x+'%');el.style.setProperty('--len',len+'%');el.style.setProperty('--tilt',tilt+'deg');el.style.setProperty('--fry-width',width+'%');
    el.innerHTML='<span class="fry-stick" aria-hidden="true"></span>';
    stack.append(el);return el;
  });
  function getSaved(){
    try{
      const saved=JSON.parse(localStorage.getItem(key));
      if(!(saved?.date===date&&allIds.includes(saved.id)))return null;
      const validBag=Array.isArray(saved.remaining)&&saved.remaining.every(id=>allIds.includes(id));
      const bag=validBag?[...new Set([...saved.remaining,...(saved.roster===allIds.length?[]:allIds.filter(id=>id>14))])].filter(id=>id!==saved.id):allIds.filter(id=>id!==saved.id);
      return {id:saved.id,slot:Number.isInteger(saved.slot)&&saved.slot>=0&&saved.slot<fries.length?saved.slot:(saved.id-1)%fries.length,remaining:bag};
    }catch{return null;}
  }
  function save(){try{localStorage.setItem(key,JSON.stringify({date,id:selected,slot:selectedSlot,remaining,roster:allIds.length}));}catch{/* Private-mode storage is optional. */}}
  // Draw without replacement until all 16 friends are seen; reshuffle for the next round.
  function choose(){
    if(!remaining.length)remaining=[...allIds];
    const candidates=remaining.filter(id=>id!==selected),pool=candidates.length?candidates:remaining;
    const id=pool[Math.floor(Math.random()*pool.length)];remaining=remaining.filter(n=>n!==id);return id;
  }
  function updateDate(){dateLabel.textContent=date.replaceAll('-',' . ');}
  function threshold(){return Math.max(55,Math.min(93,Math.round((stage.clientHeight||300)*.23)));}
  function setPull(f,pull,x=0){f.style.setProperty('--pull',-Math.max(0,pull)+'px');f.style.setProperty('--pull-x',Math.max(-19,Math.min(19,x))+'px');}
  function resetPull(f){f.classList.remove('is-dragging','is-preview');f.style.removeProperty('--pull');f.style.removeProperty('--pull-x');}
  function clearChoice(){
    drag=null;keyboardPull=null;stage.classList.remove('is-pulling','is-revealing','is-revealed','is-grabbing');revealStage.hidden=true;hint.hidden=false;
    fries.forEach(f=>{f.classList.remove('is-picked');resetPull(f);f.disabled=false;});
    replay.hidden=true;
  }
  function waiting(message){
    generation++;busy=false;clearChoice();profile.hidden=true;profile.innerHTML='';placeholder.hidden=false;result.classList.remove('is-revealed');
    revealImage.removeAttribute('src');revealName.textContent='';
    status.textContent=message||'감튀 하나를 잡고 위로 쭉 당겨보세요.';
  }
  function showResult(id,animate=false){
    const c=characters[id-1];stage.classList.remove('is-pulling','is-revealing','is-grabbing');stage.classList.add('is-revealed');
    fries.forEach((f,i)=>{f.disabled=true;f.classList.toggle('is-picked',i===selectedSlot);});
    revealImage.src=image(id);revealName.textContent=c.name;revealStage.hidden=false;hint.hidden=true;
    placeholder.hidden=true;profile.hidden=false;profile.innerHTML=GTZProfile(c,{daily:true});result.classList.toggle('is-revealed',animate);
    replay.hidden=false;status.textContent='오늘의 감띠는 '+c.name+'!';
    if(animate&&matchMedia('(max-width: 780px)').matches){result.focus({preventScroll:true});result.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});}
  }
  // Retain only the draw history for the non-repeating random bag, never restore the result UI.
  function restoreBag(){
    date=dayKey();const saved=getSaved();selected=saved?.id||0;selectedSlot=0;remaining=saved?.remaining??[...allIds];updateDate();
  }
  function resetDay(){
    if(date===dayKey())return;restoreBag();
    waiting('새로운 하루! 감튀를 잡고 위로 당겨보세요.');
  }
  const pause=ms=>reduced.matches?Promise.resolve():new Promise(resolve=>setTimeout(resolve,ms));
  async function start(slot,pull=0,x=0){
    if(busy)return;resetDay();selected=choose();selectedSlot=slot;
    save();busy=true;const run=++generation;clearChoice();status.textContent='감튀가 쏙! 어떤 감띠일까요?';
    profile.hidden=true;placeholder.hidden=false;result.classList.remove('is-revealed');hint.hidden=true;
    fries.forEach((f,i)=>{f.disabled=true;f.classList.toggle('is-picked',i===selectedSlot);});
    setPull(fries[selectedSlot],pull,x);stage.classList.add('is-pulling');
    await pause(630);if(run!==generation)return;
    const c=characters[selected-1];revealImage.src=image(c.id);revealName.textContent=c.name;revealStage.hidden=false;
    stage.classList.remove('is-pulling');stage.classList.add('is-revealing');
    await pause(820);if(run!==generation)return;
    busy=false;showResult(selected,true);
  }
  fries.forEach((f,i)=>{
    f.addEventListener('pointerdown',e=>{
      if(busy||f.disabled||!e.isPrimary||e.button!==0)return;
      if(keyboardPull){resetPull(fries[keyboardPull.slot]);keyboardPull=null;}
      drag={slot:i,id:e.pointerId,y:e.clientY,x:e.clientX,pull:0,dx:0};
      f.classList.add('is-preview');stage.classList.add('is-grabbing');status.textContent='잡았어요! 위로 당겨주세요.';
      try{f.setPointerCapture(e.pointerId);}catch{}
    });
    f.addEventListener('pointermove',e=>{
      if(!drag||drag.slot!==i||drag.id!==e.pointerId)return;
      const d=drag;d.pull=Math.max(0,d.y-e.clientY);d.dx=e.clientX-d.x;
      f.classList.remove('is-preview');f.classList.add('is-dragging');
      setPull(f,d.pull+12,d.dx);
      if(d.pull>=threshold()){drag=null;start(i,Math.min(d.pull+12,127),d.dx);}
    });
    function release(e,cancel=false){
      if(!drag||drag.slot!==i||drag.id!==e.pointerId)return;
      const d=drag;drag=null;stage.classList.remove('is-grabbing');
      const pull=Math.max(d.pull,d.y-e.clientY);
      if(!cancel&&pull>=threshold()){start(i,Math.min(pull+12,127),d.dx);return;}
      resetPull(f);status.textContent='감튀 하나를 잡고 위로 쭉 당겨보세요.';
    }
    f.addEventListener('pointerup',e=>release(e));
    f.addEventListener('pointercancel',e=>release(e,true));
    f.addEventListener('lostpointercapture',e=>release(e,true));
    // No click/tap-to-draw: only a completed upward pull commits the result.
    // ArrowUp provides the same progressive pull gesture for keyboard users.
    f.addEventListener('keydown',e=>{
      if(busy||f.disabled)return;
      if(e.key==='Escape'&&keyboardPull?.slot===i){keyboardPull=null;resetPull(f);stage.classList.remove('is-grabbing');return;}
      if(e.key!=='ArrowUp')return;e.preventDefault();
      if(!keyboardPull||keyboardPull.slot!==i){if(keyboardPull)resetPull(fries[keyboardPull.slot]);keyboardPull={slot:i,pull:0};}
      keyboardPull.pull+=28;f.classList.add('is-dragging');stage.classList.add('is-grabbing');setPull(f,keyboardPull.pull);
      if(keyboardPull.pull>=threshold()){const p=keyboardPull.pull;keyboardPull=null;start(i,p);}
    });
    f.addEventListener('blur',()=>{if(keyboardPull?.slot===i){keyboardPull=null;resetPull(f);stage.classList.remove('is-grabbing');}});
  });
  // Replay only restores the carton; the user must physically pull another fry.
  replay.addEventListener('click',()=>{if(busy)return;resetDay();waiting('감튀를 다시 잡고 당겨 새로운 감띠를 만나보세요.');});
  restoreBag();waiting();
  // Browser back/forward cache can keep the old DOM alive; clear it on exit and re-entry.
  window.addEventListener('pagehide',()=>waiting());
  window.addEventListener('pageshow',e=>{if(e.persisted){restoreBag();waiting();}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!busy)resetDay();});
})();
