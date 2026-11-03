(() => {
  const page = location.pathname.split('/').pop() || 'index.html';
  const pages = [
    {title:'홈', description:'감띠즈를 처음부터 둘러보기', url:'index.html', keys:'home gamttiz 감띠즈'},
    {title:'감띠즈 컬렉션', description:'14종의 감띠와 각각의 이야기', url:'index.html#collection', keys:'collection 캐릭터 키링 감띠'},
    {title:'제품 정보', description:'랜덤박스, 키링, 홀더', url:'products.html', keys:'products 랜덤박스 굿즈 제품'},
    {title:'소식', description:'감띠즈의 새로운 소식과 사진', url:'news.html', keys:'news 공지 게시글'},
    {title:'감튀 취향 테스트', description:'10개의 질문으로 나의 감띠 찾기', url:'quiz.html', keys:'quiz 테스트 성향'},
    {title:'나만의 감띠 홀더', description:'감띠를 담고 3D 홀더를 돌려보기', url:'combo.html', keys:'combo 체험 3d'},
    {title:'체험 모아보기', description:'감띠즈의 두 가지 체험', url:'play.html', keys:'play 게임'},
    {title:'프로젝트 정보', description:'기획 의도, 제작자, 디자인 정보', url:'project.html', keys:'project info 포트폴리오'}
  ];
  const names = ['감띠','뚱감띠','케이준띠','탄감띠','덜감띠','케찹 감띠','빙빙이','휜감띠','감감이와 띠띠','울룩불룩띠','웨지감띠','부스러끼','두리감띠','촉촉감띠'];
  names.forEach((name,index) => pages.push({title:name, description:`감띠즈 ${String(index+1).padStart(2,'0')}번 친구 자세히 보기`, url:`index.html?friend=${index+1}#collection`, keys:`감자튀김 캐릭터 ${name}`}));
  const make = (tag, className, value) => { const el=document.createElement(tag); if(className)el.className=className; if(value)el.textContent=value; return el; };
  const header = document.querySelector('.header');
  const nav = header?.querySelector('nav[aria-label="주 메뉴"]');
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
  const home=make('a','','Home');home.href='index.html';menuLinks.append(home);
  nav?.querySelectorAll('a').forEach(link=>{const item=link.cloneNode(true);item.removeAttribute('class');item.textContent=item.textContent.replace(/\s*↗\s*$/u,'');menuLinks.append(item);});
  const menuContact=make('button','','Contact');menuContact.type='button';menuContact.addEventListener('click',()=>setMode('contact'));
  const menuSearch=make('button','control-menu-search','Search');menuSearch.type='button';menuSearch.addEventListener('click',()=>setMode('search'));
  menuSearch.insertAdjacentHTML('afterbegin','<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.2" stroke="currentColor" stroke-width="1.8"/><path d="m15.5 15.5 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>');
  menuLinks.append(menuContact,menuSearch);menu.append(menuLinks);
  const contact=make('section','control-contact');contact.id='control-contact';contact.setAttribute('aria-label','문의 방법 선택');contact.setAttribute('aria-hidden','true');contact.inert=true;
  contact.append(make('span','control-panel-label','CONTACT GAMTTIZ'));
  const contactLinks=make('div','control-contact-links');
  const dm=make('a','','Instagram DM ↗');dm.href='https://ig.me/m/gamttiz_official';dm.target='_blank';dm.rel='noopener noreferrer';dm.append(make('small','','@gamttiz_official'));
  const mail=make('a','','Gmail ↗');mail.href='mailto:fox475763@gmail.com?subject=GAMTTIZ%20%EB%AC%B8%EC%9D%98';mail.append(make('small','','fox475763@gmail.com'));
  contactLinks.append(dm,mail);contact.append(contactLinks);
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
    try { const posts=typeof loadNewsPosts==='function' ? await loadNewsPosts({force:true}) : await fetch('news/posts.json',{cache:'no-store'}).then(r=>r.json()); if(Array.isArray(posts))posts.forEach(post=>{if(post?.id&&post?.title)pages.push({title:post.title,description:post.excerpt||'소식 보기',url:`news.html?id=${encodeURIComponent(post.id)}`,keys:`news 소식 ${post.body||''}`});}); renderResults(); } catch {}
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
  
function updateMenuTextColor() {
  const rect = trigger.getBoundingClientRect();

  // 버튼과 어두운 오버레이를 잠깐 제외하고
  // 버튼 뒤에 있는 실제 웹페이지 요소 확인
  dock.style.visibility = 'hidden';
  scrim.style.visibility = 'hidden';

  const behind = document.elementFromPoint(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2
  );

  dock.style.visibility = '';
  scrim.style.visibility = '';

  let isRed = false;

  for (let el = behind; el; el = el.parentElement) {
    const rgb = getComputedStyle(el)
      .backgroundColor.match(/[\d.]+/g)?.map(Number);

    if (!rgb || (rgb[3] ?? 1) < 0.8) continue;

    const [r, g, b] = rgb;
    isRed = r > 140 && r > g * 1.45 && r > b * 1.45;
    break;
  }

  trigger.style.setProperty('color', dock.dataset.mode !== 'closed' || isRed ? '#ffffff' : '#e93636', 'important');
}

window.addEventListener('scroll', updateMenuTextColor, {
  passive: true
});
window.addEventListener('resize', updateMenuTextColor);
updateMenuTextColor();

})();
