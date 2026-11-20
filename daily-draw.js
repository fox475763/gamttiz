(()=>{'use strict';
  const {characters,number,image,dayKey,targetAngle}=GTZFriends;
  const wheel=document.querySelector('#draw-wheel'),button=document.querySelector('#draw-button'),status=document.querySelector('#draw-status'),dateLabel=document.querySelector('#draw-date'),result=document.querySelector('#draw-result'),placeholder=document.querySelector('#draw-placeholder'),profile=document.querySelector('#draw-profile');
  const key='gamttiz-daily-draw-v1',reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let date=dayKey(),selected=0,angle=0,spinning=false;
  const positions=characters.map((c,i)=>{const el=document.createElement('div');el.className='wheel-slot';el.style.setProperty('--angle',i*360/characters.length+'deg');el.innerHTML=`<span><img src="${image(c.id)}" alt=""><small>${number(c.id)}</small></span>`;wheel.append(el);return el;});
  function getSaved(){try{const saved=JSON.parse(localStorage.getItem(key));return saved?.date===date&&Number.isInteger(saved.id)&&saved.id>=1&&saved.id<=characters.length?saved.id:0;}catch{return 0;}}
  function save(id){try{localStorage.setItem(key,JSON.stringify({date,id}));}catch{/* Private-mode storage is optional. */}}
  function choose(){return Math.floor(Math.random()*characters.length)+1;}
  function updateDate(){dateLabel.textContent=date.replaceAll('-',' . ');}
  function reveal(id,animate=false){const c=characters[id-1];positions.forEach((p,i)=>p.classList.toggle('is-picked',i+1===id));placeholder.hidden=true;profile.hidden=false;profile.innerHTML=GTZProfile(c,{daily:true});result.classList.toggle('is-revealed',animate);button.disabled=false;button.innerHTML='연출 다시 보기 <span aria-hidden="true">↻</span>';status.textContent='오늘의 감띠는 '+c.name+'!';if(animate&&matchMedia('(max-width: 780px)').matches){result.focus({preventScroll:true});result.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});}}
  function resetDay(){const today=dayKey();if(date===today)return;date=today;selected=getSaved();updateDate();profile.hidden=true;placeholder.hidden=false;result.classList.remove('is-revealed');positions.forEach(p=>p.classList.remove('is-picked'));if(selected){angle=targetAngle(angle,selected);wheel.style.transform='rotate('+angle+'deg)';reveal(selected);}else{button.innerHTML='룰렛 돌리기 <span aria-hidden="true">↻</span>';status.textContent='새로운 하루! 오늘의 감띠를 기다리고 있어요.';}}
  button.addEventListener('click',async()=>{
    if(spinning)return;resetDay();selected ||= choose();save(selected);spinning=true;button.disabled=true;button.textContent='감띠를 찾는 중…';status.textContent='룰렛이 돌아가고 있어요.';
    profile.hidden=true;placeholder.hidden=false;result.classList.remove('is-revealed');positions.forEach(p=>p.classList.remove('is-picked'));
    const end=targetAngle(angle,selected),frames=[{transform:'rotate('+angle+'deg)'},{transform:'rotate('+end+'deg)'}];
    if(!reduced.matches&&typeof wheel.animate==='function'){const spin=wheel.animate(frames,{duration:3300,easing:'cubic-bezier(.12,.72,.12,1)',fill:'forwards'});try{await spin.finished;}catch{}wheel.style.transform=frames[1].transform;spin.cancel();}
    else wheel.style.transform=frames[1].transform;
    angle=end;spinning=false;reveal(selected,true);
  });
  updateDate();selected=getSaved();if(selected){angle=targetAngle(0,selected);wheel.style.transform='rotate('+angle+'deg)';reveal(selected);}
})();
