(() => {
  const page = location.pathname.split('/').pop() || 'index.html';
  if(page==='license.html'&&new URLSearchParams(location.search).get('wallet')==='1')return;
  const pages = [
    {title:'홈', description:'감띠즈를 처음부터 둘러보기', url:'index.html', keys:'home gamttiz 감띠즈'},
    {title:'감띠즈 컬렉션', description:'14종의 감띠와 각각의 이야기', url:'index.html#collection', keys:'collection 캐릭터 키링 감띠'},
    {title:'제품 정보', description:'랜덤박스, 키링, 홀더', url:'products.html', keys:'products 랜덤박스 굿즈 제품'},
    {title:'공지', description:'감띠즈의 공식 공지와 제작·운영 소식', url:'news.html', keys:'notice news 공지 소식 게시글'},
    {title:'Fry Rader (감튀 레이더)', description:'감자튀김 할인·이벤트·굿즈 등 외부 소식', url:'fry-radar.html', keys:'fry radar rader 레이더 감튀 소식 할인 이벤트'},
    {title:'감튀 취향 테스트', description:'10개의 질문으로 나의 감띠 찾기', url:'quiz.html', keys:'quiz 테스트 성향'},
    {title:'나만의 감띠 홀더', description:'감띠를 담고 3D 홀더를 돌려보기', url:'combo.html', keys:'combo 체험 3d'},
    {title:'나의 라이센스 (MY ID)', description:'나만의 감띠즈 애호가 라이센스를 발급하고 열람하기', url:'license.html', keys:'my id license 라이센스 라이선스 회원증 카드 발급'},
    {title:'체험 모아보기', description:'감띠즈의 두 가지 체험', url:'play.html', keys:'play 게임'},
    {title:'프로젝트 정보', description:'기획 의도, 제작자, 디자인 정보', url:'project.html', keys:'project info 포트폴리오'}
  ];
  const names = ['감띠','뚱감띠','케이준띠','탄감띠','덜감띠','케찹 감띠','빙빙이','휜감띠','감감이와 띠띠','울룩불룩띠','웨지감띠','부스러끼','두리감띠','촉촉감띠'];
  names.forEach((name,index) => pages.push({title:name, description:`감띠즈 ${String(index+1).padStart(2,'0')}번 친구 자세히 보기`, url:`index.html?friend=${index+1}#collection`, keys:`감자튀김 캐릭터 ${name}`}));
  const make = (tag, className, value) => { const el=document.createElement(tag); if(className)el.className=className; if(value)el.textContent=value; return el; };
  const header = document.querySelector('.header');
  const nav = header?.querySelector('nav[aria-label="주 메뉴"]');
  if(nav && !nav.querySelector('a[href="license.html"]')) {
    const link=make('a','','MY ID');link.href='license.html';
    const play=nav.querySelector('a[href="play.html"]');if(play)play.after(link);else nav.append(link);
  }
  const scrim = make('div','control-scrim');
  scrim.setAttribute('aria-hidden','true');
  document.body.append(scrim);

  const dock = make('div','control-dock');
  dock.dataset.mode = 'closed';
  const trigger = make('button','control-trigger');
  trigger.type = 'button';
  trigger.setAttribute('aria-label','컨트롤 버튼: 누르면 메뉴, 길게 누르면 검색');
  trigger.setAttribute('aria-expanded','false');
  trigger.setAttribute('aria-controls','control-search control-menu control-contact');
  trigger.textContent = 'Menu';
  const search = make('section','control-search'); search.id='control-search'; search.setAttribute('aria-label','사이트 검색'); search.setAttribute('aria-hidden','true'); search.inert=true;
  const searchInput=make('input','control-search-input'); searchInput.type='search'; searchInput.placeholder='감띠즈 검색'; searchInput.autocomplete='off'; searchInput.setAttribute('aria-label','검색어');
  const searchResults=make('div','control-search-results'); searchResults.setAttribute('aria-live','polite');
  search.append(searchInput,searchResults);
  const menu=make('nav','control-menu'); menu.id='control-menu'; menu.setAttribute('aria-label','컨트롤 메뉴'); menu.setAttribute('aria-hidden','true'); menu.inert=true;
  menu.append(make('span','control-panel-label','GAMTTIZ / MENU'));
  const menuLinks=make('div','control-menu-links');
  const menuTranslations={Home:'홈',Collection:'컬렉션',Play:'체험','MY ID':'나의 라이센스',Products:'제품',Notice:'브랜드 공지',News:'브랜드 공지','공지':'브랜드 공지','Fry Rader':'감튀 레이더','Fry Radar':'감튀 레이더','Project Info':'프로젝트 정보',Instagram:'인스타그램',Contact:'문의',Search:'검색'};
  const addMenuSubtitle=(item)=>{
    const label=item.textContent.trim();
    const translation=menuTranslations[label];
    if(translation)item.append(make('small','control-menu-subtitle',translation));
    return item;
  };
  const home=make('a','','Home');home.href='index.html';menuLinks.append(addMenuSubtitle(home));
  nav?.querySelectorAll('a').forEach(link=>{const item=link.cloneNode(true);item.removeAttribute('class');item.textContent=item.textContent.replace(/\s*↗\s*$/u,'');menuLinks.append(addMenuSubtitle(item));});
  const menuContact=make('button','','Contact');menuContact.type='button';menuContact.addEventListener('click',()=>setMode('contact'));
  const menuSearch=make('button','control-menu-search','Search');menuSearch.type='button';menuSearch.addEventListener('click',()=>setMode('search'));
  menuSearch.insertAdjacentHTML('afterbegin','<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.2" stroke="currentColor" stroke-width="1.8"/><path d="m15.5 15.5 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>');
  menuLinks.append(addMenuSubtitle(menuContact),addMenuSubtitle(menuSearch));menu.append(menuLinks);
  const contact=make('section','control-contact');contact.id='control-contact';contact.setAttribute('aria-label','문의 방법 선택');contact.setAttribute('aria-hidden','true');contact.inert=true;
  contact.append(make('span','control-panel-label','CONTACT GAMTTIZ'));
  const contactLinks=make('div','control-contact-links');
  const dm=make('a','','Instagram DM ↗');dm.href='https://ig.me/m/gamttiz_official';dm.target='_blank';dm.rel='noopener noreferrer';dm.append(make('small','','@gamttiz_official'));
  const mail=make('a','','Gmail에서 작성 ↗');
  mail.href='https://mail.google.com/mail/?view=cm&fs=1&to=fox475763%40gmail.com&su=GAMTTIZ%20%EB%AC%B8%EC%9D%98';
  mail.target='_blank';mail.rel='noopener noreferrer';mail.append(make('small','','fox475763@gmail.com'));
  const mailApp=make('a','','메일 앱으로 열기 ↗');mailApp.href='mailto:fox475763@gmail.com?subject=GAMTTIZ%20%EB%AC%B8%EC%9D%98';
  mailApp.append(make('small','','기본 메일 앱 사용'));
  const copy=make('button','contact-copy','이메일 주소 복사');copy.type='button';
  const copyStatus=make('p','contact-copy-status');copyStatus.setAttribute('role','status');
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText('fox475763@gmail.com');copyStatus.textContent='이메일 주소를 복사했어요.';}catch{copyStatus.textContent='fox475763@gmail.com — 주소를 선택해 복사해 주세요.';}});
  contactLinks.append(dm,mail,mailApp,copy);contact.append(contactLinks,copyStatus);
  dock.append(search,menu,contact,trigger);document.body.append(dock);
  // Restart one complete light sweep for every touch or mouse press.
  dock.addEventListener('pointerdown',event=>{
    const target=event.target.closest('button,a');
    if(!target || !dock.contains(target))return;
    target.classList.remove('glass-pressed');
    void target.offsetWidth;
    target.classList.add('glass-pressed');
    window.setTimeout(()=>target.classList.remove('glass-pressed'),900);
  });

  const normalize=value=>String(value||'').toLocaleLowerCase('ko').replace(/\s+/g,'');
  let newsLoaded=false;
  async function loadSearchNews(){
    if(newsLoaded)return; newsLoaded=true;
    try { const posts=typeof loadNewsPosts==='function' ? await loadNewsPosts({force:true}) : await fetch('news/posts.json',{cache:'no-store'}).then(r=>r.json()); if(Array.isArray(posts))posts.forEach(post=>{if(post?.id&&post?.title)pages.push({title:post.title,description:post.excerpt||'소식 보기',url:`news.html?id=${encodeURIComponent(post.id)}`,keys:`notice news 공지 소식 ${post.body||''}`});}); renderResults(); } catch {}
  }
  function renderResults(){
    const query=normalize(searchInput.value);
    searchResults.replaceChildren();
    searchResults.hidden=!query;
    if(!query)return;
    const results=pages.filter(item=>normalize(`${item.title} ${item.description} ${item.keys}`).includes(query)).slice(0,8);
    if(!results.length){searchResults.append(make('p','control-no-results','검색 결과가 없어요. 다른 단어로 찾아보세요.'));return;}
    results.forEach(item=>{const link=make('a','control-result');link.href=item.url;link.append(make('strong','',item.title),make('span','',item.description),make('b','','↗'));searchResults.append(link);});
  }
  function setMode(mode){
    const next=dock.dataset.mode===mode?'closed':mode;
    dock.dataset.mode=next;
    updateMenuTextColor();
    scrim.classList.toggle('is-open',next!=='closed');
    trigger.setAttribute('aria-expanded',String(next!=='closed'));
    for(const [name,panel] of [['search',search],['menu',menu],['contact',contact]]){const active=next===name;panel.inert=!active;panel.setAttribute('aria-hidden',String(!active));}
    trigger.setAttribute('aria-label',next==='closed'?'컨트롤 버튼: 누르면 메뉴, 길게 누르면 검색':`${next==='search'?'검색':next==='menu'?'메뉴':'문의'} 닫기`);
    if(next==='search'){renderResults();loadSearchNews();window.setTimeout(()=>searchInput.focus({preventScroll:true}),180);}
    else if(document.activeElement===searchInput)trigger.focus({preventScroll:true});
  }
  let start=null, holdTimer=0, gestureHandled=false;
  trigger.addEventListener('pointerdown',event=>{
    start={x:event.clientX,y:event.clientY};gestureHandled=false;
    clearTimeout(holdTimer);
    holdTimer=window.setTimeout(()=>{gestureHandled=true;setMode('search');try{navigator.vibrate?.(12);}catch{}},540);
  });
  trigger.addEventListener('pointermove',event=>{if(start && (Math.abs(event.clientX-start.x)>12||Math.abs(event.clientY-start.y)>12))clearTimeout(holdTimer);});
  trigger.addEventListener('pointerup',event=>{
    clearTimeout(holdTimer);
    if(!start)return;
    const dx=event.clientX-start.x,dy=event.clientY-start.y;start=null;
    if(gestureHandled)return;
    if(dx < -34 && Math.abs(dx)>Math.abs(dy)){gestureHandled=true;setMode('search');}
    else if(dy < -34 && Math.abs(dy)>Math.abs(dx)){gestureHandled=true;setMode('menu');}
  });
  trigger.addEventListener('pointercancel',()=>{clearTimeout(holdTimer);start=null;});
  trigger.addEventListener('contextmenu',event=>event.preventDefault());
  trigger.addEventListener('click',()=>{if(gestureHandled){gestureHandled=false;return;}setMode('menu');});
  let menuSwipeX=null;
  menu.addEventListener('pointerdown',event=>{menuSwipeX=event.clientX;});
  menu.addEventListener('pointerup',event=>{if(menuSwipeX!==null && event.clientX-menuSwipeX < -45)setMode('search');menuSwipeX=null;});
  menu.addEventListener('pointercancel',()=>{menuSwipeX=null;});
  scrim.addEventListener('click',()=>setMode('closed'));
  searchInput.addEventListener('input',renderResults);
  document.addEventListener('pointerdown',event=>{if(dock.dataset.mode!=='closed'&&!dock.contains(event.target))setMode('closed');});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&dock.dataset.mode!=='closed'){event.preventDefault();setMode('closed');trigger.focus({preventScroll:true});}
    if((event.key==='/'&&!/input|textarea/i.test(document.activeElement?.tagName||''))||(event.key.toLowerCase()==='k'&&(event.ctrlKey||event.metaKey))){event.preventDefault();if(dock.dataset.mode!=='search')setMode('search');}
  });
  const footer=document.querySelector('footer');if(footer){const link=make('button','site-footer-contact','문의하기 ↗');link.type='button';link.addEventListener('click',()=>setMode('contact'));footer.append(link);}

  let dismissed=false;try{dismissed=sessionStorage.getItem('gamttiz-entry-dismissed')==='1';}catch{}
  let externalReferrer=false;try{externalReferrer=!!document.referrer && new URL(document.referrer).host!==location.host;}catch{}
  const externalEntry=page!=='index.html' && (externalReferrer || new URLSearchParams(location.search).has('utm_source'));
  if(externalEntry && !dismissed){
    const guide=make('aside','site-entry-guide');guide.setAttribute('aria-label','방문 안내');
    guide.append(make('strong','','감띠즈에 오신 걸 환영해요.'),make('span','','이 페이지를 즐긴 뒤 홈에서 14명의 친구도 만나보세요.'));
    const homeLink=make('a','','홈 둘러보기 ↗');homeLink.href='index.html';guide.append(homeLink);
    const dismiss=make('button','','닫기 ✕');dismiss.type='button';dismiss.addEventListener('click',()=>{guide.remove();try{sessionStorage.setItem('gamttiz-entry-dismissed','1');}catch{}});guide.append(dismiss);
    header?.after(guide);
  }
  
let colorFrame = 0;
let lastButtonColor = '';

function setButtonColor(color) {
  if (color === lastButtonColor) return;
  trigger.style.setProperty('color', color, 'important');
  lastButtonColor = color;
}

function updateMenuTextColor() {
  if (dock.dataset.mode !== 'closed') {
    setButtonColor('#ffffff');
    return;
  }

  const rect = trigger.getBoundingClientRect();
  const dockVisibility = dock.style.visibility;
  const scrimVisibility = scrim.style.visibility;
  dock.style.visibility = 'hidden';
  scrim.style.visibility = 'hidden';

  let behind;
  try {
    behind = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    );
  } finally {
    dock.style.visibility = dockVisibility;
    scrim.style.visibility = scrimVisibility;
  }

  let isRed = false;
  for (let el = behind; el; el = el.parentElement) {
    const rgb = getComputedStyle(el).backgroundColor.match(/[\d.]+/g)?.map(Number);
    if (!rgb || (rgb[3] ?? 1) < 0.8) continue;
    const [r, g, b] = rgb;
    isRed = r > 140 && r > g * 1.45 && r > b * 1.45;
    break;
  }
  setButtonColor(isRed ? '#ffffff' : '#e93636');
}

function scheduleMenuTextColorUpdate() {
  if (colorFrame) return;
  colorFrame = requestAnimationFrame(() => {
    colorFrame = 0;
    updateMenuTextColor();
  });
}

window.addEventListener('scroll', scheduleMenuTextColorUpdate, { passive: true });
window.addEventListener('resize', scheduleMenuTextColorUpdate);
window.addEventListener('load', scheduleMenuTextColorUpdate);
updateMenuTextColor();

// Shake-to-open is a mobile-only wallet and uses explicit sensor consent.
const walletMedia=matchMedia('(max-width: 900px)');
{
  const sheet=make('section','gtz-wallet-sheet');sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-label','나의 라이센스');sheet.hidden=true;
  const backdrop=make('button','gtz-wallet-backdrop');backdrop.type='button';backdrop.setAttribute('aria-label','라이센스 닫기');
  const content=make('div','gtz-wallet-content'),title=make('p','gtz-wallet-title','MY LICENSE');
  const close=make('button','gtz-wallet-close','×');close.type='button';close.setAttribute('aria-label','닫기');
  const frame=make('iframe','gtz-wallet-frame');frame.title='나의 감띠즈 라이센스 카드';
  const detail=make('a','gtz-wallet-detail','MY ID 페이지 ↗');detail.href='license.html';
  content.append(title,close,frame,detail);sheet.append(backdrop,content);document.body.append(sheet);
  const shakeSettings=make('div','gtz-shake-setting');shakeSettings.hidden=true;
  const shakeButton=make('button','gtz-shake-button','흔들어 카드 열기 켜기');shakeButton.type='button';
  const shakeStatus=make('p','gtz-shake-status');shakeStatus.setAttribute('role','status');
  shakeSettings.append(shakeButton,shakeStatus);
  const shakeMount=document.getElementById('license-shake-setting-mount');
  if(shakeMount)shakeMount.append(shakeSettings);
  const shakeKey='gamttiz-license-shake-enabled-v1';
  let enabled=false,sensorSeen=false,requesting=false,open=false,presented=false,sheetTimer=0,warmTimer=0,frameStarted=false,lastExists=null;
  let gravity=null,firstHit=null,lastHit=-Infinity,lastOpened=-Infinity;
  try{enabled=localStorage.getItem(shakeKey)==='1';}catch{}
  const reducedWallet=matchMedia('(prefers-reduced-motion: reduce)');
  function mobile(){return walletMedia.matches&&(matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0);}
  function canMotion(){return typeof window.DeviceMotionEvent!=='undefined';}
  function hasCard(){try{const r=JSON.parse(localStorage.getItem('gamttiz-my-license-v1')||'null');return !!(r?.name&&r?.number);}catch{return false;}}
  function remember(value){enabled=value;try{localStorage.setItem(shakeKey,value?'1':'0');}catch{}}
  function updateSetting(){
    shakeSettings.hidden=!mobile()||!hasCard();
    shakeButton.disabled=requesting||!canMotion();
    shakeButton.textContent=enabled&&sensorSeen?'흔들어 카드 열기 끄기':enabled?'흔들어 카드 열기 다시 활성화':'흔들어 카드 열기 켜기';
    shakeButton.setAttribute('aria-pressed',String(enabled&&sensorSeen));
    if(!canMotion())shakeStatus.textContent='이 브라우저는 움직임 센서를 지원하지 않아요. MY ID 메뉴를 이용해주세요.';
  }
  shakeButton.addEventListener('click',async()=>{
    if(!mobile()||!hasCard()||!canMotion()||requesting)return;
    if(enabled&&sensorSeen){
      remember(false);sensorSeen=false;firstHit=null;gravity=null;
      shakeStatus.textContent='흔들기 기능을 껐어요.';updateSetting();return;
    }
    requesting=true;updateSetting();
    try{
      // Safari requires this call synchronously within a user activation.
      const permission=typeof window.DeviceMotionEvent.requestPermission==='function'?await window.DeviceMotionEvent.requestPermission():'granted';
      if(permission!=='granted'){remember(false);shakeStatus.textContent='동작 센서 권한을 허용해야 흔들기 기능을 사용할 수 있어요.';return;}
      remember(true);sensorSeen=false;gravity=null;firstHit=null;warm();
      shakeStatus.textContent='휴대폰을 좌우로 두 번 가볍게 흔들어 카드를 열어보세요.';
    }catch{remember(false);shakeStatus.textContent='센서 권한을 확인할 수 없어요. Safari에서 다시 허용해주세요.';}
    finally{requesting=false;updateSetting();}
  });
  function notifyFrame(active){if(frameStarted)frame.contentWindow?.postMessage({type:'gamttiz-wallet-visibility',active},location.origin);}
  frame.addEventListener('load',()=>notifyFrame(presented));
  function startFrame(){
    if(frameStarted||!mobile())return;
    frameStarted=true;frame.src='license.html?wallet=1&v=20261120application12';
  }
  function warm(){
    if(frameStarted||warmTimer||!enabled||!hasCard()||!mobile())return;
    warmTimer=setTimeout(()=>{
      warmTimer=0;if(document.body.classList.contains('license-animating')){warm();return;}
      if(typeof requestIdleCallback==='function')requestIdleCallback(startFrame,{timeout:1800});else startFrame();
    },700);
  }
  function sync(){
    const exists=hasCard();
    if(lastExists!==null&&lastExists!==exists&&frameStarted){
      frame.src='license.html?wallet=1&v=20261120application12';
    }
    lastExists=exists;updateSetting();
    if(!mobile()||!exists){if(presented)settle(false);return;}
    if(exists)warm();
  }
  function present(){
    clearTimeout(sheetTimer);sheetTimer=0;if(presented)return;
    presented=true;sheet.classList.add('is-visible');
    document.documentElement.classList.add('gtz-wallet-open');startFrame();notifyFrame(true);
  }
  function settle(next){
    if(next&&(!mobile()||!hasCard()))return;
    if(next&&!presented){present();content.getBoundingClientRect();}
    if(!presented)return;
    open=next;sheet.classList.toggle('is-open',next);
    sheet.setAttribute('aria-hidden',String(!next));sheet.inert=!next;
    clearTimeout(sheetTimer);
    if(next){if(dock.dataset.mode!=='closed')setMode(dock.dataset.mode);notifyFrame(true);return;}
    lastOpened=performance.now();firstHit=null;notifyFrame(false);
    sheetTimer=setTimeout(()=>{
      if(!open){presented=false;sheet.classList.remove('is-visible');document.documentElement.classList.remove('gtz-wallet-open');}
      sheetTimer=0;
    },reducedWallet.matches?0:440);
  }
  function vector(v){return v&&[v.x,v.y,v.z].every(Number.isFinite)?[v.x,v.y,v.z]:null;}
  function motion(e){
    if(!enabled||!mobile()||document.hidden)return;
    let a=vector(e.acceleration);
    if(!a){
      const raw=vector(e.accelerationIncludingGravity);if(!raw)return;
      if(!gravity){gravity=raw.slice();return;}
      a=raw.map((x,i)=>x-gravity[i]);gravity=gravity.map((x,i)=>x*.88+raw[i]*.12);
    }
    if(!sensorSeen){sensorSeen=true;updateSetting();}
    if(!lastExists||open||presented||document.body.classList.contains('license-animating'))return;
    const now=performance.now(),power=Math.hypot(...a);
    if(now-lastOpened<2200||power<11||now-lastHit<85)return;
    lastHit=now;
    if(firstHit&&now-firstHit.time>1000)firstHit=null;
    if(!firstHit){firstHit={a,power,time:now};return;}
    const similarity=a.reduce((sum,x,i)=>sum+x*firstHit.a[i],0)/(power*firstHit.power);
    if(similarity<-.35&&now-firstHit.time>=85){
      firstHit=null;lastOpened=now;settle(true);
    }else if(now-firstHit.time>450)firstHit={a,power,time:now};
  }
  window.addEventListener('devicemotion',motion,{passive:true});
  document.addEventListener('visibilitychange',()=>{firstHit=null;gravity=null;});
  close.addEventListener('click',()=>settle(false));backdrop.addEventListener('click',()=>settle(false));
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&presented)settle(false);});
  window.addEventListener('storage',e=>{if(e.key==='gamttiz-my-license-v1')sync();if(e.key===shakeKey){try{enabled=localStorage.getItem(shakeKey)==='1';}catch{}updateSetting();}});
  window.addEventListener('gamttiz:license-change',sync);window.addEventListener('pageshow',sync);
  sheet.hidden=false;sheet.inert=true;sheet.setAttribute('aria-hidden','true');
  if(walletMedia.addEventListener)walletMedia.addEventListener('change',sync);
  else if(walletMedia.addListener)walletMedia.addListener(sync);
  sync();
}

})();




