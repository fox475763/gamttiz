(() => {
  const page = location.pathname.split('/').pop() || 'index.html';
  if(page==='license.html'&&new URLSearchParams(location.search).get('wallet')==='1')return;
  const pages = [
    {title:'홈', description:'감띠즈를 처음부터 둘러보기', url:'index.html', keys:'home gamttiz 감띠즈'},
    {title:'감띠즈 도감', description:'14종의 감띠와 미공개 친구들의 도감', url:'collection.html', keys:'collection dex 도감 캐릭터 키링 감띠'},
    {title:'제품 정보', description:'랜덤박스, 키링, 홀더', url:'products.html', keys:'products 랜덤박스 굿즈 제품'},
    {title:'공지', description:'감띠즈의 공식 공지와 제작·운영 소식', url:'news.html', keys:'notice news 공지 소식 게시글'},
    {title:'Fry Rader (감튀 레이더)', description:'감자튀김 할인·이벤트·굿즈 등 외부 소식', url:'member.html#radar', keys:'fry radar rader 레이더 감튀 소식 할인 이벤트'},
    {title:'감튀 취향 테스트', description:'10개의 질문으로 나의 감띠 찾기', url:'quiz.html', keys:'quiz 테스트 성향'},
    {title:'나만의 감띠 홀더', description:'감띠를 담고 3D 홀더를 돌려보기', url:'combo.html', keys:'combo 체험 3d'},
    {title:'나의 라이센스 (MY ID)', description:'나만의 감띠즈 애호가 라이센스를 발급하고 열람하기', url:'license.html', keys:'my id license 라이센스 라이선스 회원증 카드 발급'},
    {title:'오늘의 감띠 뽑기', description:'감튀 하나를 골라 오늘 함께할 감띠 만나기', url:'draw.html', keys:'daily draw 감튀 감자튀김 랜덤 뽑기 게임'},
    {title:'체험 모아보기', description:'감띠즈의 세 가지 체험', url:'play.html', keys:'play 게임'},
    {title:'Member · 멤버 전용', description:'라이센스 보유자의 감튀 레이더', url:'member.html', keys:'member 멤버 회원 감튀 레이더 웹앱'},
    {title:'프로젝트 정보', description:'기획 의도, 제작자, 디자인 정보', url:'project.html', keys:'project info 포트폴리오'}
  ];
  const names = ['감띠','뚱감띠','케이준띠','탄감띠','덜감띠','케찹 감띠','빙빙이','휜감띠','감감이와 띠띠','울룩불룩띠','웨지감띠','부스러끼','두리감띠','촉촉감띠'];
  names.forEach((name,index) => pages.push({title:name, description:`감띠즈 ${String(index+1).padStart(2,'0')}번 친구 자세히 보기`, url:`collection.html#friend-${String(index+1).padStart(2,'0')}`, keys:`감자튀김 캐릭터 ${name}`}));
  const make = (tag, className, value) => { const el=document.createElement(tag); if(className)el.className=className; if(value)el.textContent=value; return el; };
  const header = document.querySelector('.header');
  const nav = header?.querySelector('nav[aria-label="주 메뉴"]');
  if(nav && !nav.querySelector('a[href="license.html"]')) {
    const link=make('a','','MY ID');link.href='license.html';
    const play=nav.querySelector('a[href="play.html"]');if(play)play.after(link);else nav.append(link);
  }
  if(nav && !nav.querySelector('a[href="member.html"]')) {
    const link=make('a','','Member');link.href='member.html';
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
  // The glass shell never scrolls; only this inner surface does.
  const menuScroll=make('div','control-panel-scroll');
  menuScroll.append(make('span','control-panel-label','GAMTTIZ / MENU'));
  menu.append(menuScroll);
  const menuLinks=make('div','control-menu-links');
  const menuTranslations={Home:'홈',Collection:'감띠즈 도감',Play:'체험',Member:'멤버 전용','MY ID':'나의 라이센스',Products:'제품',Notice:'브랜드 공지',News:'브랜드 공지','공지':'브랜드 공지','Fry Rader':'감튀 레이더','Fry Radar':'감튀 레이더','Project Info':'프로젝트 정보',Instagram:'인스타그램',Contact:'문의',Search:'검색'};
  // Decorative outline icons are embedded locally, so no icon font or extra request is needed.
  const menuIcons={
    Home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    Collection:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    Play:'<path d="M7 7h10c2 0 3.3 1.2 3.8 3.1l1 4.7a2.6 2.6 0 0 1-4.5 2.2L15 14H9l-2.3 3A2.6 2.6 0 0 1 2.2 14.8l1-4.7A3.8 3.8 0 0 1 7 7Z"/><path d="M8 9v5m-2.5-2.5h5M16 10v.1M19 12.5v.1"/>',
    Member:'<circle cx="10" cy="8" r="3.5"/><path d="M3 20v-2a7 7 0 0 1 14 0v2H3Zm14-15a3.5 3.5 0 0 1 0 7m2 2a5 5 0 0 1 2 4v2"/>',
    'MY ID':'<rect x="2.5" y="5" width="19" height="14" rx="2"/><circle cx="8" cy="10" r="2"/><path d="M4.5 16a3.5 3.5 0 0 1 7 0M14 10h4.5M14 14h4.5"/>',
    Products:'<path d="m3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v10M7.5 5 16.5 9"/>',
    Notice:'<path d="M4 10h5l10-5v14L9 14H4a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2Zm2 4 2 6h3l-2-6M21 10v4"/>',
    'Project Info':'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    Instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    Contact:'<path d="M20 16a2 2 0 0 1-2 2H9l-5 3V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/><path d="M8 9h8m-8 4h5"/>',
    Search:'<circle cx="10.8" cy="10.8" r="6.2"/><path d="m15.5 15.5 5 5"/>',
    'Fry Rader':'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12 18.4 5.6M12 12h.01"/>'
  };
  const addMenuSubtitle=(item)=>{
    const label=item.textContent.trim();
    const translation=menuTranslations[label];
    const iconName=({News:'Notice','공지':'Notice','Fry Radar':'Fry Rader'})[label]||label;
    const artwork=menuIcons[iconName]||menuIcons['Project Info'];
    const text=make('span','control-menu-text');
    text.append(make('span','control-menu-title',label));
    if(translation)text.append(make('small','control-menu-subtitle',translation));
    item.replaceChildren(text);
    item.insertAdjacentHTML('afterbegin','<svg class="control-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+artwork+'</svg>');
    return item;
  };
  const home=make('a','','Home');home.href='index.html';menuLinks.append(addMenuSubtitle(home));
  nav?.querySelectorAll('a').forEach(link=>{const item=link.cloneNode(true);item.removeAttribute('class');item.textContent=item.textContent.replace(/\s*↗\s*$/u,'');menuLinks.append(addMenuSubtitle(item));});
  const menuContact=make('button','','Contact');menuContact.type='button';menuContact.addEventListener('click',()=>setMode('contact'));
  const menuSearch=make('button','control-menu-search','Search');menuSearch.type='button';menuSearch.addEventListener('click',()=>setMode('search'));
  menuLinks.append(addMenuSubtitle(menuContact),addMenuSubtitle(menuSearch));menuScroll.append(menuLinks);
  function syncCurrentMenuLink(){
    const current=new URL(location.href),normalized=url=>url.pathname.replace(/\/$/,'/index.html');
    const links=[...menuLinks.querySelectorAll('a')];
    const matching=links.filter(link=>{const url=new URL(link.href,current);return url.origin===current.origin&&normalized(url)===normalized(current).replace(/\/draw\.html$/,'/play.html');});
    const selected=matching.find(link=>{const url=new URL(link.href,current);return url.hash&&url.hash===current.hash;})||matching.find(link=>!new URL(link.href,current).hash);
    for(const link of links){if(link===selected)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}
  }
  syncCurrentMenuLink();
  window.addEventListener('hashchange',syncCurrentMenuLink);
  const contact=make('section','control-contact');contact.id='control-contact';contact.setAttribute('aria-label','문의 방법 선택');contact.setAttribute('aria-hidden','true');contact.inert=true;
  const contactScroll=make('div','control-panel-scroll');
  contactScroll.append(make('span','control-panel-label','CONTACT GAMTTIZ'));contact.append(contactScroll);
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
  contactLinks.append(dm,mail,mailApp,copy);contactScroll.append(contactLinks,copyStatus);
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
    if(next==='menu'){syncCurrentMenuLink();menuScroll.scrollTop=0;}
    if(next==='contact')contactScroll.scrollTop=0;
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
    setButtonColor('#e93636');
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
  const frame=make('div','gtz-wallet-frame gtz-wallet-lite');frame.setAttribute('aria-label','나의 감띠즈 라이센스 카드');
  const detail=make('a','gtz-wallet-detail','MY ID 페이지 ↗');detail.href='license.html';
  content.append(title,close,frame,detail);sheet.append(backdrop,content);document.body.append(sheet);
  const shakeSettings=make('div','gtz-shake-setting');shakeSettings.hidden=true;
  const shakeButton=make('button','gtz-shake-button','흔들어 카드 열기 켜기');shakeButton.type='button';
  const shakeReconnect=make('button','gtz-shake-reconnect','센서 권한 다시 연결');shakeReconnect.type='button';shakeReconnect.hidden=true;
  const shakeStatus=make('p','gtz-shake-status');shakeStatus.setAttribute('role','status');
  shakeSettings.append(shakeButton,shakeReconnect,shakeStatus);
  const shakeMount=document.getElementById('license-shake-setting-mount');
  if(shakeMount)shakeMount.append(shakeSettings);
  const shakeKey='gamttiz-license-shake-enabled-v1';
  let enabled=false,sensorSeen=false,sessionAllowed=false,requesting=false,open=false,presented=false,sheetTimer=0,warmTimer=0,frameStarted=false,lastExists=null;
  let recoveryTimer=0,recoveryNeeded=false,silentAttempted=false,silentPending=false,recoveryEpoch=0;
  let gravity=null,firstHit=null,lastHit=-Infinity,lastOpened=-Infinity;
  try{enabled=localStorage.getItem(shakeKey)==='1';}catch{}
  const reducedWallet=matchMedia('(prefers-reduced-motion: reduce)');
  function mobile(){return walletMedia.matches&&(matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0);}
  function canMotion(){return typeof window.DeviceMotionEvent!=='undefined';}
  function needsPermission(){return typeof window.DeviceMotionEvent?.requestPermission==='function';}
  function hasCard(){try{const r=JSON.parse(localStorage.getItem('gamttiz-my-license-v1')||'null');return !!(r?.name&&r?.number);}catch{return false;}}
  function remember(value){enabled=value;try{localStorage.setItem(shakeKey,value?'1':'0');}catch{}}
  function clearRecovery(){clearTimeout(recoveryTimer);recoveryTimer=0;recoveryNeeded=false;recoveryEpoch++;silentPending=false;}
  function resetSensor(){clearRecovery();silentAttempted=false;sensorSeen=false;sessionAllowed=false;firstHit=null;gravity=null;shakeStatus.textContent='';}
  function restorePreference(){try{const saved=localStorage.getItem(shakeKey)==='1';if(saved!==enabled){enabled=saved;resetSensor();}}catch{}}
  function mayRecover(){return enabled&&mobile()&&hasCard()&&canMotion()&&needsPermission()&&!document.hidden&&!document.body.classList.contains('license-animating');}
  function updateSetting(){
    shakeSettings.hidden=!mobile()||!hasCard();
    shakeButton.disabled=requesting||!canMotion();
    // A saved preference is independent of whether the new document has received sensor data.
    shakeButton.textContent=requesting?'센서 권한 확인 중…':enabled?'흔들어 카드 열기 끄기':'흔들어 카드 열기 켜기';
    shakeButton.setAttribute('aria-pressed',String(enabled));
    shakeReconnect.hidden=!enabled||sensorSeen||(!recoveryNeeded&&sessionAllowed)||!needsPermission();
    shakeReconnect.disabled=requesting;
    if(!canMotion())shakeStatus.textContent='이 브라우저는 움직임 센서를 지원하지 않아요. MY ID 메뉴를 이용해주세요.';
    else if(enabled&&!sensorSeen&&!sessionAllowed&&!requesting&&!shakeStatus.textContent)shakeStatus.textContent=needsPermission()?'활성화 설정이 저장되어 있어요. 연결이 필요하면 센서 권한 다시 연결을 눌러주세요.':'휴대폰을 좌우로 두 번 가볍게 흔들어 카드를 열어보세요.';
  }
  async function connectSensor(){
    if(requesting||!mobile()||!hasCard()||!canMotion()||document.body.classList.contains('license-animating'))return;
    const wasEnabled=enabled;clearRecovery();silentAttempted=true;
    requesting=true;updateSetting();
    try{
      // Permission is requested exclusively from explicit shake controls,
      // never during rendering, card issuance, navigation or other gestures.
      const permission=needsPermission()?await window.DeviceMotionEvent.requestPermission():'granted';
      if(permission!=='granted')throw new Error('sensor permission not granted');
      if(wasEnabled&&!enabled)return;
      remember(true);sessionAllowed=true;gravity=null;firstHit=null;warm();
      watchSensor();
      shakeStatus.textContent='휴대폰을 좌우로 두 번 가볍게 흔들어 카드를 열어보세요.';
    }catch{
      if(!wasEnabled)remember(false);
      sessionAllowed=false;recoveryNeeded=enabled;
      shakeStatus.textContent=enabled?'흔들기 설정은 켜져 있어요. 센서 권한을 다시 연결해주세요.':'동작 센서 권한을 허용해야 흔들기 기능을 사용할 수 있어요.';
    }
    finally{requesting=false;updateSetting();if(sessionAllowed&&!sensorSeen)watchSensor();}
  }
  function watchSensor(){
    if(recoveryTimer||requesting||silentPending||sensorSeen||!mayRecover())return;
    recoveryTimer=setTimeout(async()=>{
      recoveryTimer=0;
      if(sensorSeen||requesting||!mayRecover())return;
      // Only check an existing grant WITHOUT transient activation. A new
      // permission prompt is forbidden without that activation by WebKit.
      // If Safari discarded the grant the call rejects; retain the setting
      // and offer manual reconnection only on the issued MY ID page.
      if(!silentAttempted&&navigator.userActivation?.isActive===false){
        silentAttempted=true;silentPending=true;
        const epoch=recoveryEpoch;
        try{
          const result=await window.DeviceMotionEvent.requestPermission();
          if(epoch!==recoveryEpoch||!mayRecover())return;
          if(result==='granted'){sessionAllowed=true;silentPending=false;watchSensor();return;}
        }catch{}
        finally{if(epoch===recoveryEpoch)silentPending=false;}
        if(epoch!==recoveryEpoch)return;
      }
      if(!mayRecover()||sensorSeen)return;
      recoveryNeeded=true;sessionAllowed=false;
      shakeStatus.textContent='흔들기 설정은 유지됐어요. Safari 센서 권한을 다시 연결해주세요.';
      updateSetting();
    },1200);
  }
  shakeButton.addEventListener('click',()=>{
    if(!mobile()||!hasCard()||!canMotion()||requesting||document.body.classList.contains('license-animating'))return;
    if(enabled){
      remember(false);resetSensor();
      shakeStatus.textContent='흔들기 기능을 껐어요.';updateSetting();return;
    }
    return connectSensor();
  });
  shakeReconnect.addEventListener('click',()=>{if(enabled&&!requesting)return connectSensor();});
  // Render the exact issued license artwork on one small canvas, without
  // mounting the entire license page in an iframe or running 3D animations.
  const walletStyle=document.createElement('style');
  walletStyle.textContent='.gtz-wallet-lite{display:flex!important;flex-direction:column;align-items:center;justify-content:center;min-height:0;padding:12px 6px;background:transparent!important;border:0!important;box-shadow:none!important}.gtz-wallet-lite-card{display:block;width:min(72vw,290px);height:auto;aspect-ratio:1080/1718;border-radius:12px;box-shadow:0 12px 28px #0003;background:#780708}.gtz-wallet-lite-error{font-size:13px;color:#7d1616;text-align:center;padding:30px 12px}';
  document.head.append(walletStyle);
  const friendNames=['감띠','뚱감띠','케이준띠','탄감띠','덜감띠','케찹 감띠','빙빙이','휜감띠','감감이와 띠띠','울룩불룩띠','웨지감띠','부스러끼','두리감띠','촉촉감띠'];
  const qrMatrix=[
    '111111100101010011111011101111111',
    '100000100111011111000100001000001',
    '101110101001010011101101001011101',
    '101110101001101110001010101011101',
    '101110101111100101100111001011101',
    '100000101010100110101110101000001',
    '111111101010101010101010101111111',
    '000000001101101100100111000000000',
    '101111100100011101001001001111100',
    '011110011000000010011111101101101',
    '101100101100000110101110100010110',
    '001010011111001010000100011011100',
    '111101110111100000110010110111010',
    '111011000011111110001101101000011',
    '100100110110011000010010011001110',
    '111100010101110010011110011111100',
    '000111100011100001010000010111001',
    '001111001011011001111011101101111',
    '000110111111101111001110110110110',
    '101100011000110011111110110111100',
    '101110101010100010001011110111010',
    '110111000100011100100101001000001',
    '100110110001100111101010010100010',
    '100001000001110100100101101010100',
    '100011111000110101100000111110000',
    '000000001111001010111011100010111',
    '111111100110100110100111101010110',
    '100000101001101100011101100011110',
    '101110101011110000110100111111011',
    '101110101101000111001101010011011',
    '101110101010011001010001001101000',
    '100000100010101010111111011011100',
    '111111101111101001010001101100010',
  ];
  function notifyFrame(active){}
  function startFrame(){
    if(!mobile())return;
    let data;try{data=JSON.parse(localStorage.getItem('gamttiz-my-license-v1')||'null')}catch{}
    frame.replaceChildren();frameStarted=true;
    if(!data||!Number.isInteger(data.character)||data.character<0||data.character>=friendNames.length)return;
    const canvas=document.createElement('canvas');canvas.className='gtz-wallet-lite-card';
    canvas.width=540;canvas.height=859;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','감띠즈 라이센스 뒷면 '+data.name);
    frame.append(canvas);
    const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return;
    const load=src=>new Promise((resolve,reject)=>{const img=new Image();img.decoding='async';img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});
    const index=data.character;
    Promise.all([load('assets/license/back.png'),load('assets/illustrations-3d/friend-'+String(index+1).padStart(2,'0')+'.png')]).then(([template,sprite])=>{
      if(!canvas.isConnected)return;
      ctx.setTransform(.5,0,0,.5,0,0);
      const W=1080,H=1718,CROP_Y=101;
      ctx.drawImage(template,0,CROP_Y,W,H,0,0,W,H);
      const max=376,scale=Math.min(max/sprite.naturalWidth,max/sprite.naturalHeight);
      const w=sprite.naturalWidth*scale,h=sprite.naturalHeight*scale;
      ctx.drawImage(sprite,540-w/2,704-CROP_Y-h/2,w,h);
      function value(text,x,y,maxWidth,size){
        ctx.fillStyle='#ffe09a';ctx.textAlign='right';ctx.textBaseline='alphabetic';
        text=String(text||'');let fontSize=size;
        do{ctx.font='600 '+fontSize+'px "Wanted Sans Variable","Noto Sans CJK KR","Noto Sans KR","Malgun Gothic",Arial,sans-serif';fontSize--;}while(fontSize>20&&ctx.measureText(text).width>maxWidth);
        ctx.fillText(text,x,y,maxWidth);
      }
      value(data.name,950,1071-CROP_Y,633,46);
      value(friendNames[index],950,1233-CROP_Y,510,40);
      value(data.number,950,1400-CROP_Y,530,34);
      const issued=new Date(data.issuedAt);
      let date='발급 후 표시';
      if(Number.isFinite(issued.getTime())){
        const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(issued);
        date=['year','month','day'].map(type=>parts.find(p=>p.type===type)?.value||'').join('.');
      }
      ctx.fillStyle='#ffe09a';ctx.textAlign='left';ctx.textBaseline='alphabetic';
      ctx.font='42px Georgia,"Times New Roman",serif';ctx.fillText('issued date.',129,1401);
      ctx.font='600 39px "Wanted Sans Variable",Arial,sans-serif';ctx.fillText(date,129,1460,545);
      ctx.font='500 23px Arial,sans-serif';ctx.fillText('SCAN TO OPEN MY ID',129,1547,545);
      const module=6,quiet=4,x=704,y=1340,size=(qrMatrix.length+quiet*2)*module;
      ctx.fillStyle='#f5d578';ctx.fillRect(x,y,size,size);ctx.fillStyle='#780708';
      qrMatrix.forEach((row,j)=>{for(let i=0;i<row.length;i++)if(row[i]==='1')ctx.fillRect(x+(i+quiet)*module,y+(j+quiet)*module,module,module)});
    }).catch(()=>{if(canvas.isConnected)frame.append(make('p','gtz-wallet-lite-error','라이센스 이미지를 불러오지 못했어요. MY ID 페이지에서 확인해주세요.'));});
  }
  function warm(){/* Never preload a second license page. */}
  function sync(){
    const exists=hasCard();
    if(lastExists!==null&&lastExists!==exists&&frameStarted){
      frameStarted=false;if(presented)startFrame();else frame.replaceChildren();
    }
    lastExists=exists;updateSetting();
    if(!mobile()||!exists||!enabled){clearRecovery();updateSetting();if(presented&&!exists)settle(false);return;}
    if(exists){watchSensor();}
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
    if(!enabled||!mobile()||document.hidden||presented||open)return;
    let a=vector(e.acceleration);
    if(!a){
      const raw=vector(e.accelerationIncludingGravity);if(!raw)return;
      if(!gravity){gravity=raw.slice();return;}
      a=raw.map((x,i)=>x-gravity[i]);gravity=gravity.map((x,i)=>x*.88+raw[i]*.12);
    }
    if(!sensorSeen){sensorSeen=true;sessionAllowed=true;clearRecovery();shakeStatus.textContent='휴대폰을 좌우로 두 번 가볍게 흔들어 카드를 열어보세요.';updateSetting();}
    if(!lastExists||document.body.classList.contains('license-animating'))return;
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
  function resumeSensors(){
    restorePreference();resetSensor();
    window.removeEventListener?.('devicemotion',motion);
    window.addEventListener('devicemotion',motion,{passive:true});sync();
  }
  document.addEventListener('visibilitychange',()=>{firstHit=null;gravity=null;if(document.hidden){clearRecovery();updateSetting();}else resumeSensors();});
  close.addEventListener('click',()=>settle(false));backdrop.addEventListener('click',()=>settle(false));
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&presented)settle(false);});
  window.addEventListener('storage',e=>{if(e.key===shakeKey||e.key===null)restorePreference();if(e.key==='gamttiz-my-license-v1'||e.key===shakeKey||e.key===null)sync();});
  window.addEventListener('gamttiz:license-change',sync);window.addEventListener('pageshow',e=>{if(e.persisted)resumeSensors();else{restorePreference();sync();}});
  window.addEventListener('hashchange',sync);
  sheet.hidden=false;sheet.inert=true;sheet.setAttribute('aria-hidden','true');
  if(walletMedia.addEventListener)walletMedia.addEventListener('change',sync);
  else if(walletMedia.addListener)walletMedia.addListener(sync);
  sync();
}

})();
