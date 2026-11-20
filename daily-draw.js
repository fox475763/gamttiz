(()=>{'use strict';
  const {characters,image,dayKey}=GTZFriends;
  const stack=document.querySelector('#fry-stack'),stage=document.querySelector('#fry-stage'),revealStage=document.querySelector('#fry-reveal'),revealImage=document.querySelector('#fry-reveal-image'),revealName=document.querySelector('#fry-reveal-name'),hint=document.querySelector('#fry-pull-hint'),button=document.querySelector('#draw-button'),status=document.querySelector('#draw-status'),dateLabel=document.querySelector('#draw-date'),result=document.querySelector('#draw-result'),placeholder=document.querySelector('#draw-placeholder'),profile=document.querySelector('#draw-profile');
  const key='gamttiz-daily-draw-v1',reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const shapes=[[20,38,-12],[30,45,-7],[40,40,-3],[50,49,1],[60,43,5],[70,46,8],[80,35,13]];
  let date=dayKey(),selected=0,selectedSlot=0,busy=false,drag=null;
  const fries=shapes.map(([x,len,tilt],i)=>{
    const el=document.createElement('button');el.type='button';el.className='fry-choice';
    el.setAttribute('aria-label',(i+1)+'번째 감자튀김 뽑기');
    el.style.setProperty('--x',x+'%');el.style.setProperty('--len',len+'%');el.style.setProperty('--tilt',tilt+'deg');
    el.innerHTML='<span class="fry-stick" aria-hidden="true"></span>';
    stack.append(el);return el;
  });
  function getSaved(){try{const saved=JSON.parse(localStorage.getItem(key));return saved?.date===date&&Number.isInteger(saved.id)&&saved.id>=1&&saved.id<=characters.length?{id:saved.id,slot:Number.isInteger(saved.slot)&&saved.slot>=0&&saved.slot<fries.length?saved.slot:(saved.id-1)%fries.length}:null;}catch{return null;}}
  function save(){try{localStorage.setItem(key,JSON.stringify({date,id:selected,slot:selectedSlot}));}catch{/* Private-mode storage is optional. */}}
  function choose(){return Math.floor(Math.random()*characters.length)+1;}
  function updateDate(){dateLabel.textContent=date.replaceAll('-',' . ');}
  function clearChoice(){
    stage.classList.remove('is-pulling','is-revealing','is-revealed');revealStage.hidden=true;hint.hidden=false;
    fries.forEach(f=>{f.classList.remove('is-picked','is-dragging');f.style.removeProperty('--pull');f.disabled=false;});
  }
  function showResult(id,animate=false){
    const c=characters[id-1];stage.classList.remove('is-pulling','is-revealing');stage.classList.add('is-revealed');
    fries.forEach((f,i)=>{f.disabled=true;f.classList.toggle('is-picked',i===selectedSlot);});
    revealImage.src=image(id);revealName.textContent=c.name;revealStage.hidden=false;hint.hidden=true;
    placeholder.hidden=true;profile.hidden=false;profile.innerHTML=GTZProfile(c,{daily:true});result.classList.toggle('is-revealed',animate);
    button.disabled=false;button.innerHTML='연출 다시 보기 <span aria-hidden="true">↻</span>';status.textContent='오늘의 감띠는 '+c.name+'!';
    if(animate&&matchMedia('(max-width: 780px)').matches){result.focus({preventScroll:true});result.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});}
  }
  function resetDay(){
    const today=dayKey();if(date===today)return;date=today;const saved=getSaved();selected=saved?.id||0;selectedSlot=saved?.slot||0;updateDate();clearChoice();profile.hidden=true;placeholder.hidden=false;result.classList.remove('is-revealed');
    if(selected)showResult(selected);else{button.innerHTML='감튀 하나 뽑기 <span aria-hidden="true">↑</span>';status.textContent='새로운 하루! 감튀를 골라 뽑아보세요.';}
  }
  const pause=ms=>reduced.matches?Promise.resolve():new Promise(resolve=>setTimeout(resolve,ms));
  async function start(slot,pull=0){
    if(busy)return;resetDay();if(!selected){selected=choose();selectedSlot=slot;}else selectedSlot=Number.isInteger(slot)?slot:selectedSlot;
    save();busy=true;clearChoice();button.disabled=true;button.textContent='감튀를 뽑는 중…';status.textContent='감튀를 뽑았어요. 어떤 감띠일까요?';
    profile.hidden=true;placeholder.hidden=false;result.classList.remove('is-revealed');hint.hidden=true;
    fries.forEach((f,i)=>{f.disabled=true;f.classList.toggle('is-picked',i===selectedSlot);});
    fries[selectedSlot].style.setProperty('--pull',-Math.max(0,pull)+'px');stage.classList.add('is-pulling');
    await pause(630);
    const c=characters[selected-1];revealImage.src=image(c.id);revealName.textContent=c.name;revealStage.hidden=false;
    stage.classList.remove('is-pulling');stage.classList.add('is-revealing');
    await pause(820);
    busy=false;showResult(selected,true);
  }
  fries.forEach((f,i)=>{
    let suppressClick=false;
    f.addEventListener('pointerdown',e=>{
      if(busy||f.disabled||!e.isPrimary||e.button!==0)return;
      suppressClick=false;drag={slot:i,id:e.pointerId,y:e.clientY,x:e.clientX,pull:0,moved:false};
      f.classList.add('is-dragging');try{f.setPointerCapture(e.pointerId);}catch{}
    });
    f.addEventListener('pointermove',e=>{
      if(!drag||drag.slot!==i||drag.id!==e.pointerId)return;
      const distance=drag.y-e.clientY;drag.pull=Math.min(115,Math.max(0,distance));drag.moved ||= Math.abs(distance)>10||Math.abs(drag.x-e.clientX)>10;
      f.style.setProperty('--pull',-drag.pull+'px');
    });
    function release(e,cancel=false){
      if(!drag||drag.slot!==i||drag.id!==e.pointerId)return;
      const d=drag;drag=null;f.classList.remove('is-dragging');suppressClick=d.moved;
      if(!cancel&&d.pull>=40){start(i,d.pull);return;}
      f.style.removeProperty('--pull');
    }
    f.addEventListener('pointerup',e=>release(e));
    f.addEventListener('pointercancel',e=>release(e,true));
    f.addEventListener('lostpointercapture',e=>release(e,true));
    f.addEventListener('click',e=>{if(suppressClick&&e.detail!==0){suppressClick=false;return;}start(i);});
  });
  button.addEventListener('click',()=>{resetDay();start(selected?selectedSlot:Math.floor(Math.random()*fries.length));});
  updateDate();const saved=getSaved();if(saved){selected=saved.id;selectedSlot=saved.slot;showResult(selected);}
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!busy)resetDay();});
})();
