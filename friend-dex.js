(()=>{'use strict';
  const {characters,number,facePortrait}=GTZFriends;
  const slots=20,grid=document.querySelector('#dex-grid'),search=document.querySelector('#dex-search'),sort=document.querySelector('#dex-sort'),detail=document.querySelector('#dex-detail'),profile=document.querySelector('#dex-profile'),prev=document.querySelector('#dex-prev'),next=document.querySelector('#dex-next'),close=document.querySelector('#dex-close'),current=document.querySelector('#dex-current'),count=document.querySelector('#dex-result-count');
  const filters=[...document.querySelectorAll('[data-dex-filter]')],buttons=[];
  let selected=0,activeFilter='all';
  function fromLocation(){const m=location.hash.match(/^#friend-(\d{1,2})$/);const n=m?Number(m[1]):Number(new URLSearchParams(location.search).get('friend'));return Number.isInteger(n)&&n>=1&&n<=slots?n:0;}
  const mark='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  for(let id=1;id<=slots;id++){
    const c=characters[id-1],b=document.createElement('button');
    b.type='button';b.dataset.friendId=String(id);b.className='dex-tile dex-glass'+(c?'':' dex-unknown')+(c?.faceCrops.length>1?' dex-dual-face':'');b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-label','No. '+number(id)+' '+(c?c.name:'미공개 감띠, 물음표'));
    if(c)b.style.setProperty('--dex-friend',c.color);
    b.innerHTML=`<span class="dex-tile-top"><span class="dex-tile-no">NO. ${number(id)}</span><span class="dex-tile-state" aria-hidden="true"></span></span><span class="dex-tile-portrait">${c?`${facePortrait(id)}`:'<span class="dex-tile-mark" aria-hidden="true">?</span>'}</span><span class="dex-tile-info"><span><strong>${c?c.name:'???'}</strong><small>${c?c.type:'미공개'}</small></span>${mark}</span>`;
    b.addEventListener('click',()=>select(id,true));buttons.push(b);grid.append(b);
  }
  function select(id,update=false){
    selected=id;
    buttons.forEach((b,i)=>b.classList.toggle('is-selected',i+1===id));
    const c=characters[id-1];
    profile.innerHTML=c?GTZProfile(c):`<div class="profile-art unknown-art"><div class="profile-art-top"><span>NO. ${number(id)}</span><span>UNDISCOVERED</span></div><div class="unknown-mark" aria-hidden="true">?</div><span class="profile-type">미공개 감띠</span></div><div class="profile-info"><p class="fx-kicker">UNKNOWN FRIEND</p><h2>???</h2><p class="profile-tagline">아직 발견되지 않았어요.</p><p class="profile-story">새로운 감띠즈의 이야기가 공개되면 이곳에 기록됩니다. 어떤 친구가 찾아올지 기대해 주세요!</p><dl class="profile-facts"><div><dt>이름</dt><dd>???</dd></div><div><dt>성격</dt><dd>???</dd></div><div><dt>특징</dt><dd>???</dd></div></dl></div>`;
    current.textContent='NO. '+number(id)+' / '+number(slots);
    prev.disabled=id===1;next.disabled=id===slots;
    if(update){const url=new URL(location.href);url.searchParams.delete('friend');url.hash='friend-'+number(id);history.replaceState(null,'',url);}
    if(!detail.open)detail.showModal();
    detail.scrollTop=0;
  }
  function filter(){
    const q=search.value.trim().toLowerCase().replace(/^no\.?\s*|^#/,'');let visible=0;
    buttons.forEach((b,i)=>{const c=characters[i],value=c?[number(c.id),c.name,c.english,c.type,c.origin,c.story].join(' '):number(i+1)+' ??? 미공개';const match=q&&/^\d+$/.test(q)?Number(q)===i+1:!q||value.toLowerCase().includes(q);b.hidden=!match||(activeFilter==='known'&&!c)||(activeFilter==='unknown'&&!!c);if(!b.hidden)visible++;});
    document.querySelector('#dex-empty').hidden=visible!==0;
    count.textContent=visible+'개의 도감 슬롯';
  }
  search.addEventListener('input',filter);
  sort.addEventListener('change',()=>{(sort.value==='desc'?[...buttons].reverse():buttons).forEach(b=>grid.append(b));});
  filters.forEach(b=>b.addEventListener('click',()=>{activeFilter=b.dataset.dexFilter;filters.forEach(f=>f.setAttribute('aria-pressed',String(f===b)));filter();}));
  prev.addEventListener('click',()=>{if(selected>1)select(selected-1,true);});
  next.addEventListener('click',()=>{if(selected<slots)select(selected+1,true);});
  close.addEventListener('click',()=>detail.close());
  detail.addEventListener('click',e=>{if(e.target===detail){const r=detail.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)detail.close();}});
  detail.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'&&!prev.disabled){e.preventDefault();select(selected-1,true);}if(e.key==='ArrowRight'&&!next.disabled){e.preventDefault();select(selected+1,true);}});
  detail.addEventListener('close',()=>{if(fromLocation()){const url=new URL(location.href);url.hash='';url.searchParams.delete('friend');history.replaceState(null,'',url);}const b=buttons[selected-1];if(b&&!b.hidden)b.focus({preventScroll:true});});
  window.addEventListener('hashchange',()=>{const id=fromLocation();if(id)select(id);else if(detail.open)detail.close();});
  const initial=fromLocation();if(initial)select(initial);
})();
