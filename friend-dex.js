(()=>{'use strict';
  const {characters,number,image}=GTZFriends;
  const slots=20,grid=document.querySelector('#dex-grid'),search=document.querySelector('#dex-search'),detail=document.querySelector('#dex-detail'),profile=document.querySelector('#dex-profile'),prev=document.querySelector('#dex-prev'),next=document.querySelector('#dex-next');
  const buttons=[];
  function fromHash(){const m=location.hash.match(/^#friend-(\d{1,2})$/);const n=m?Number(m[1]):Number(new URLSearchParams(location.search).get('friend'));return n>=1&&n<=slots?n:1;}
  let selected=fromHash();
  for(let id=1;id<=slots;id++){
    const c=characters[id-1],b=document.createElement('button');
    b.type='button';b.className='dex-tile'+(c?'':' dex-unknown');b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','No. '+number(id)+' '+(c?c.name:'미공개 감띠, 물음표'));
    b.innerHTML=`<span class="dex-tile-no">NO. ${number(id)}</span>${c?`<img src="${image(id)}" alt="" loading="lazy" decoding="async">`:'<span class="dex-tile-mark" aria-hidden="true">?</span>'}<strong>${c?c.name:'???'}</strong><small>${c?c.type:'미공개'}</small>`;
    b.addEventListener('click',()=>select(id,true));buttons.push(b);grid.append(b);
  }
  function select(id,update=false){
    selected=id;
    buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i+1===id)));
    const c=characters[id-1];
    profile.innerHTML=c?GTZProfile(c):`<div class="profile-art unknown-art"><div class="profile-art-top"><span>NO. ${number(id)}</span><span>UNDISCOVERED</span></div><div class="unknown-mark" aria-hidden="true">?</div><span class="profile-type">미공개 감띠</span></div><div class="profile-info"><p class="fx-kicker">UNKNOWN FRIEND</p><h2>???</h2><p class="profile-tagline">아직 발견되지 않았어요.</p><p class="profile-story">새로운 감띠즈의 이야기가 공개되면 이곳에 기록됩니다. 어떤 친구가 찾아올지 기대해 주세요!</p><dl class="profile-facts"><div><dt>이름</dt><dd>???</dd></div><div><dt>성격</dt><dd>???</dd></div><div><dt>특징</dt><dd>???</dd></div></dl></div>`;
    prev.disabled=id===1;next.disabled=id===slots;
    if(update){history.replaceState(null,'','#friend-'+number(id));if(matchMedia('(max-width: 780px)').matches){detail.focus({preventScroll:true});detail.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}}
  }
  function filter(){const q=search.value.trim().toLowerCase();let visible=0;buttons.forEach((b,i)=>{const c=characters[i],value=c?[number(c.id),c.name,c.english,c.type,c.origin,c.story].join(' '):number(i+1)+' ??? 미공개';b.hidden=!!q&&!value.toLowerCase().includes(q);if(!b.hidden)visible++;});document.querySelector('#dex-empty').hidden=visible!==0;}
  search.addEventListener('input',filter);
  prev.addEventListener('click',()=>{if(selected>1)select(selected-1,true);});
  next.addEventListener('click',()=>{if(selected<slots)select(selected+1,true);});
  window.addEventListener('hashchange',()=>select(fromHash()));
  select(selected);
  if(location.hash.startsWith('#friend-')&&matchMedia('(max-width: 780px)').matches)requestAnimationFrame(()=>detail.scrollIntoView({behavior:'instant',block:'start'}));
})();
