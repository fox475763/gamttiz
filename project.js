(() => {
  'use strict';
  const profiles=[
    ['감띠','180°C 기름에서 깔끔하게 튀겨진 감자튀김. 반듯한 실루엣은 감띠즈의 기본 형태입니다.'],
    ['뚱감띠','조금 더 듬직한 모습의 감자튀김. 굵기의 차이만으로도 다른 인상을 만들어 냅니다.'],
    ['케이준띠','케이준 시즈닝을 입은 기다란 감자튀김. 표면의 무늬가 특징입니다.'],
    ['탄감띠','실수로 200°C 기름에 들어간 감자튀김. 진하게 튀겨진 색에서 개성이 시작됩니다.'],
    ['덜감띠','약속이 있어서 조금 일찍 밖으로 나온 감자튀김. 덜 튀겨진 색을 캐릭터의 설정으로 연결했습니다.'],
    ['케찹 감띠','머리에 케찹을 돌돌 바른 감자튀김. 감튀에 익숙한 소스를 하나의 특징으로 표현했습니다.'],
    ['빙빙이','꽁꽁 냉동실에서 이제 막 나온 감자튀김. 튀기기 전의 상태도 감띠즈 세계의 일부입니다.'],
    ['휜감띠','그냥 휘었다. 굽은 형태 그 자체가 캐릭터의 특징입니다.'],
    ['감감이와 띠띠','한 감자에서 나뉜 쌍둥이 남매 감자튀김. 둘이라는 관계가 실루엣과 이야기를 만듭니다.'],
    ['울룩불룩띠','형태가 울룩불룩한 감자튀김. 매끈하지 않은 외곽선도 개성으로 바라봅니다.'],
    ['웨지감띠','조각 사과처럼 옆으로 누운 웨지 감자튀김. 일반 감띠와 다른 커팅 형태가 특징입니다.'],
    ['부스러끼','겁이 많아서 어딘가에 숨어 있는 감자튀김. 작은 부스러기도 감띠즈의 친구입니다.'],
    ['두리감띠','서로 등 부분이 딱 붙어 사는 감자튀김. 붙어 있는 모습에서 이야기를 만들었습니다.'],
    ['촉촉감띠','기름이 흥건해 촉촉하고 흐물흐물한 감자튀김. 눅눅함도 하나의 매력으로 담았습니다.']
  ];
  const lineup=document.getElementById('project-lineup');
  const dialog=document.getElementById('edition-character-dialog');
  if(lineup&&dialog){
    let selected=0;
    const image=document.getElementById('edition-character-image');
    const number=document.getElementById('edition-character-number');
    const title=document.getElementById('edition-character-title');
    const description=document.getElementById('edition-character-description');
    const path=i=>'assets/illustrations/friend-'+String(i+1).padStart(2,'0')+'.svg';
    function show(i){
      selected=(i+profiles.length)%profiles.length;
      const [name,copy]=profiles[selected];
      image.src=path(selected);image.alt=name+' 원본 일러스트';
      number.textContent='GAMTTIZ / NO. '+String(selected+1).padStart(2,'0');
      title.textContent=name;description.textContent=copy;
      if(!dialog.open){dialog.showModal();dialog.scrollTop=0;}
    }
    const fragment=document.createDocumentFragment();
    profiles.forEach(([name],i)=>{
      const button=document.createElement('button');button.type='button';button.className='edition-character';button.setAttribute('aria-label',name+' 원본 일러스트와 특징 보기');
      const no=document.createElement('span');no.textContent='NO. '+String(i+1).padStart(2,'0');
      const art=document.createElement('img');art.src=path(i);art.alt=name;art.loading='lazy';art.decoding='async';
      const caption=document.createElement('strong');caption.textContent=name+' ↗';
      button.append(no,art,caption);button.addEventListener('click',()=>show(i));fragment.append(button);
    });
    lineup.append(fragment);
    dialog.querySelector('.edition-dialog-close').addEventListener('click',()=>dialog.close());
    dialog.querySelectorAll('[data-char-dir]').forEach(button=>button.addEventListener('click',()=>show(selected+Number(button.dataset.charDir))));
    dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  }
  const specimen=document.getElementById('type-preview');
  const weights=[...document.querySelectorAll('[data-type-weight]')];
  weights.forEach(button=>button.addEventListener('click',()=>{
    if(!specimen)return;
    specimen.style.fontWeight=button.dataset.typeWeight;
    weights.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  }));
  const colorStatus=document.getElementById('color-copy-status');
  document.querySelectorAll('[data-hex]').forEach(button=>button.addEventListener('click',async()=>{
    const hex=button.dataset.hex;
    try{await navigator.clipboard.writeText(hex);colorStatus.textContent=hex+' · 복사했어요.';}
    catch{colorStatus.textContent=hex+' · 색상 코드';}
  }));
})();