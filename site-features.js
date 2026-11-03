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
  const make = (tag, className, text) => { const el=document.createElement(tag); if(className)el.className=className; if(text)el.textContent=text; return el; };
  const header = document.querySelector('.header');
  const controls = make('div','site-controls');
  const searchButton = make('button','site-control site-search-button','검색'); searchButton.type='button'; searchButton.setAttribute('aria-label','사이트 전체 검색');
  const contactButton = make('button','site-control site-contact-button','문의 ↗'); contactButton.type='button'; contactButton.setAttribute('aria-label','문의 방법 선택');
  controls.append(searchButton,contactButton); header?.append(controls);
  const search = make('dialog','site-dialog site-search'); search.setAttribute('aria-label','사이트 검색');
  const searchHead=make('div','site-dialog-head'); searchHead.append(make('strong','','GAMTTIZ SEARCH'));
  const searchClose=make('button','site-dialog-close','닫기 ✕'); searchClose.type='button'; searchClose.setAttribute('aria-label','검색 닫기'); searchHead.append(searchClose);
  const searchInput=make('input','site-search-input'); searchInput.type='search'; searchInput.placeholder='감띠, 제품, 소식을 검색해보세요'; searchInput.setAttribute('aria-label','검색어');
  const searchResults=make('div','site-search-results'); searchResults.setAttribute('aria-live','polite');
  search.append(searchHead,searchInput,searchResults); document.body.append(search);
  const normalize=value=>String(value||'').toLocaleLowerCase('ko').replace(/\s+/g,'');
  let newsLoaded=false;
  async function loadSearchNews(){
    if(newsLoaded)return; newsLoaded=true;
    try { const posts=typeof loadNewsPosts==='function' ? await loadNewsPosts({force:true}) : await fetch('news/posts.json',{cache:'no-store'}).then(r=>r.json()); if(Array.isArray(posts))posts.forEach(post=>{if(post?.id&&post?.title)pages.push({title:post.title,description:post.excerpt||'소식 보기',url:`news.html?id=${encodeURIComponent(post.id)}`,keys:`news 소식 ${post.body||''}`});}); renderResults(); } catch {}
  }
  function renderResults(){
    const query=normalize(searchInput.value); const results=pages.filter(item=>!query||normalize(`${item.title} ${item.description} ${item.keys}`).includes(query)).slice(0,20);
    searchResults.replaceChildren();
    if(!results.length){searchResults.append(make('p','site-no-results','검색 결과가 없어요. 다른 단어로 찾아보세요.'));return;}
    results.forEach(item=>{const link=make('a','site-result');link.href=item.url;link.append(make('strong','',item.title),make('span','',item.description),make('b','','↗'));searchResults.append(link);});
  }
  searchButton.addEventListener('click',()=>{renderResults();search.showModal();searchInput.focus();loadSearchNews();});
  searchClose.addEventListener('click',()=>search.close()); searchInput.addEventListener('input',renderResults);
  const contact=make('dialog','site-dialog site-contact');contact.setAttribute('aria-label','문의 방법 선택');
  const contactHead=make('div','site-dialog-head');contactHead.append(make('strong','','CONTACT GAMTTIZ'));
  const contactClose=make('button','site-dialog-close','닫기 ✕');contactClose.type='button';contactHead.append(contactClose);
  contact.append(contactHead,make('h2','','감띠즈에게 이야기해 주세요.'),make('p','','편한 방법을 골라 문의를 보내주세요.'));
  const contactChoices=make('div','site-contact-choices');
  const dm=make('a','','Instagram DM ↗');dm.href='https://ig.me/m/gamttiz_official';dm.target='_blank';dm.rel='noopener noreferrer';dm.append(make('small','','@gamttiz_official'));
  const mail=make('a','','이메일 보내기 ↗');mail.href='mailto:fox475763@gmail.com?subject=GAMTTIZ%20%EB%AC%B8%EC%9D%98';mail.append(make('small','','fox475763@gmail.com'));
  contactChoices.append(dm,mail);contact.append(contactChoices);document.body.append(contact);
  contactButton.addEventListener('click',()=>contact.showModal());contactClose.addEventListener('click',()=>contact.close());
  [search,contact].forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();}));
  document.addEventListener('keydown',event=>{if((event.key==='/'&&!/input|textarea/i.test(document.activeElement.tagName))||(event.key.toLowerCase()==='k'&&(event.ctrlKey||event.metaKey))){event.preventDefault();if(!search.open){renderResults();search.showModal();searchInput.focus();loadSearchNews();}}});
  const footer=document.querySelector('footer');if(footer){const link=make('button','site-footer-contact','문의하기 ↗');link.type='button';link.addEventListener('click',()=>contact.showModal());footer.append(link);}
  let dismissed=false;try{dismissed=sessionStorage.getItem('gamttiz-entry-dismissed')==='1';}catch{}
  let externalReferrer=false;try{externalReferrer=!!document.referrer && new URL(document.referrer).host!==location.host;}catch{}
  const externalEntry=page!=='index.html' && (externalReferrer || new URLSearchParams(location.search).has('utm_source'));
  if(externalEntry && !dismissed){
    const guide=make('aside','site-entry-guide');guide.setAttribute('aria-label','방문 안내');
    guide.append(make('strong','','감띠즈에 오신 걸 환영해요.'),make('span','','이 페이지를 즐긴 뒤 홈에서 14명의 친구도 만나보세요.'));
    const home=make('a','','홈 둘러보기 ↗');home.href='index.html';guide.append(home);
    const dismiss=make('button','','닫기 ✕');dismiss.type='button';dismiss.addEventListener('click',()=>{guide.remove();try{sessionStorage.setItem('gamttiz-entry-dismissed','1');}catch{}});guide.append(dismiss);
    header?.after(guide);
  }
})();
