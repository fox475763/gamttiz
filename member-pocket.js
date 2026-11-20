(() => {
  'use strict';
  const M=GTZMemberModel,member=GTZMember,$=id=>document.getElementById(id),stage=$('pocket-stage'),friends=$('pocket-friends'),picker=$('pocket-picker'),status=$('pocket-status');
  let state=null,id=null,key=null,timer=0,motion=false,requesting=false,frame=0,animTimer=0,shownSlots='',tilt=0,target=0,permissionGranted=false;
  function saved(){try{return M.pet(JSON.parse(localStorage.getItem(key)||'null'),id);}catch{return M.pet(null,id);}}
  function save(){try{localStorage.setItem(key,JSON.stringify(state));return true;}catch{status.textContent='저장 공간을 사용할 수 없어요. 브라우저 설정을 확인해주세요.';return false;}}
  function draw(){
    if(!state||!member.isActive('pocket'))return;
    const stats=M.petStats(state);$('pocket-day').textContent=`DAY ${stats.day}`;$('pocket-care').textContent=`♥ ${state.care}`;$('pocket-mood').textContent=stats.mood;
    for(const [name,value] of [['full',stats.full],['happy',stats.happy]]){$(`pocket-${name}`).value=value;$(`pocket-${name}-value`).textContent=value;}
    const slotKey=state.slots.join(',');if(slotKey!==shownSlots){
      shownSlots=slotKey;friends.replaceChildren();state.slots.forEach((index,i)=>{
        const wrap=document.createElement('button');wrap.type='button';wrap.className='pocket-character';wrap.setAttribute('aria-label',`${M.names[index]} 쓰다듬기`);wrap.style.setProperty('--slot',i);wrap.style.setProperty('--count',state.slots.length);
        const img=document.createElement('img');img.src=M.art(index);img.alt=M.names[index];img.decoding='async';wrap.append(img);wrap.addEventListener('click',()=>act('play'));friends.append(wrap);
      });
    }
    $('pocket-count').textContent=`${state.slots.length} / 6`;
    picker.querySelectorAll('button').forEach(b=>{const selected=state.slots.includes(Number(b.dataset.index));b.setAttribute('aria-pressed',String(selected));b.disabled=!selected&&state.slots.length===6;});
  }
  function pulse(name,duration=800){
    stage.classList.remove('is-fed','is-playing','is-customizing');
    void stage.offsetWidth;
    stage.classList.add(name);clearTimeout(animTimer);
    animTimer=setTimeout(()=>stage.classList.remove('is-fed','is-playing','is-customizing'),duration);
  }
  function act(kind){
    if(!member.isActive('pocket')||!state)return;
    state=M.interact(state,kind);save();draw();status.textContent=kind==='feed'?'간식 고마워요!':'함께 놀아서 좋아요!';
    pulse(kind==='feed'?'is-fed':'is-playing',950);
  }
  M.names.forEach((name,index)=>{const b=document.createElement('button');b.type='button';b.dataset.index=index;b.className='pocket-choice';b.setAttribute('aria-pressed','false');const img=document.createElement('img');img.src=M.art(index);img.alt='';img.loading='lazy';img.decoding='async';const label=document.createElement('span');label.textContent=name;b.append(img,label);b.addEventListener('click',()=>{
    if(!state||!member.isActive('pocket'))return;
    if(state.slots.includes(index)){if(state.slots.length===1){status.textContent='홀더에 감띠 한 명은 남겨주세요.';return;}state.slots=state.slots.filter(x=>x!==index);}else if(state.slots.length<6)state.slots.push(index);
    save();draw();pulse('is-customizing',430);status.textContent='';
  });picker.append(b);});
  $('pocket-feed').addEventListener('click',()=>act('feed'));$('pocket-play').addEventListener('click',()=>act('play'));
  function animate(){frame=0;if(!motion||!member.isActive('pocket')||document.hidden)return;tilt+=(target-tilt)*.17;stage.style.setProperty('--hold-tilt',`${tilt.toFixed(2)}deg`);if(Math.abs(target-tilt)>.05)frame=requestAnimationFrame(animate);}
  function read(e){const g=e.accelerationIncludingGravity;if(!motion||document.hidden||!g||![g.x,g.y,g.z].every(Number.isFinite))return;target=M.clamp(g.x*3,-23,23);if(!frame)frame=requestAnimationFrame(animate);}
  function stop(){motion=false;$('pocket-device').classList.remove('is-motion');window.removeEventListener('devicemotion',read);cancelAnimationFrame(frame);frame=0;target=tilt=0;stage.style.setProperty('--hold-tilt','0deg');$('pocket-motion').textContent='흔들리는 홀더 켜기';$('pocket-motion').setAttribute('aria-pressed','false');}
  $('pocket-motion').addEventListener('click',async()=>{
    if(!member.isActive('pocket')||requesting)return;if(motion){stop();return;}
    if(!window.DeviceMotionEvent){status.textContent='이 기기는 움직임 센서를 지원하지 않아요.';return;}
    requesting=true;
    try{if(!permissionGranted&&typeof DeviceMotionEvent.requestPermission==='function'&&await DeviceMotionEvent.requestPermission()!=='granted')throw Error();permissionGranted=true;if(!member.isActive('pocket'))return;motion=true;$('pocket-device').classList.add('is-motion');window.addEventListener('devicemotion',read,{passive:true});$('pocket-motion').textContent='흔들리는 홀더 끄기';$('pocket-motion').setAttribute('aria-pressed','true');status.textContent='휴대폰을 좌우로 기울여 보세요.';}catch{status.textContent='움직임 센서 권한을 허용해주세요.';}finally{requesting=false;}
  });
  function enter(next){const k=M.petKey(next);if(k!==key){stop();id=next;key=k;state=saved();shownSlots='';save();}else{state=saved();}draw();clearInterval(timer);timer=setInterval(draw,60000);}
  function leave(){clearInterval(timer);timer=0;stop();clearTimeout(animTimer);stage.classList.remove('is-fed','is-playing','is-customizing');}
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInterval(timer);timer=0;cancelAnimationFrame(frame);frame=0;}else if(member.isActive('pocket')){draw();if(!timer)timer=setInterval(draw,60000);}});
  window.addEventListener('pagehide',leave);member.register('pocket',{enter,leave});
})();

