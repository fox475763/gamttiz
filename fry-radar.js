(()=>{
  'use strict';
  const labels={discount:'할인',event:'이벤트',festival:'축제','new-product':'신메뉴',goods:'굿즈·콜라보',sauce:'소스·시즈닝',place:'맛집·팝업',trend:'감튀 트렌드',other:'기타'};
  const list=document.getElementById('radar-list');
  const archive=document.getElementById('radar-archive-list');
  const preview=document.getElementById('radar-preview-list');
  const member=window.GTZMember;
  // The home carousel is a public preview only. The full board stays license-gated.
  const homePreview=!!document.getElementById('fry-radar-preview')&&!!preview&&!list&&!archive;
  if(!homePreview&&(!member||!list||!archive))return;
  let homeRunning=false;
  const isActive=()=>homePreview?homeRunning:member.isActive('radar');
  const search=document.getElementById('radar-search');
  const category=document.getElementById('radar-category');
  const sort=document.getElementById('radar-sort');
  const count=document.getElementById('radar-count');
  const archiveCount=document.getElementById('radar-archive-count');
  const updated=document.getElementById('radar-updated');
  const DAY=86400000;
  const MAX_RECENT_DAYS=14;
  let items=[];
  const model=window.GTZRadarModel;
  const tabs=document.querySelectorAll?.('[data-radar-view]')||[];
  const dealPanel=document.getElementById('radar-deal-panel'),deals=document.getElementById('radar-deals');
  let view='all',saved=new Set(),previousVisit=0,sessionKey='',visitRecorded=false;
  const storageRead=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
  const storageWrite=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};
  const nearEnd=item=>{const days=model?.daysLeft(item);return statusOf(item)==='ongoing'&&days!=null&&days>=0&&days<=3;};
  const cash=n=>n.toLocaleString('ko-KR')+'원';

  const el=(tag,className,text)=>{
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text!=null)node.textContent=text;
    return node;
  };
  const validUrl=value=>{
    try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:null;}
    catch{return null;}
  };
  const date=value=>{
    const time=Date.parse(value||'');
    return Number.isFinite(time)?new Date(time):null;
  };
  const dateLabel=value=>{
    const d=date(value);
    return d?new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Seoul'}).format(d):'날짜 미확인';
  };
  // 날짜만 입력된 행사 종료일은 한국 시간 해당 날짜 23:59:59까지 유효합니다.
  const eventTime=(value,endOfDay=false)=>{
    if(typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value))
      return Date.parse(value+(endOfDay?'T23:59:59+09:00':'T00:00:00+09:00'));
    return Date.parse(value||'');
  };
  const statusOf=item=>{
    if(item.eventStatus==='ended-early')return 'ended';
    const now=Date.now();
    // Evergreen menu info is not a newly published article or an open-ended promotion.
    // Display it as verified only for 7 days after a successful source check.
    if(item.kind==='ongoing-menu'){
      const confirmed=Date.parse(item.verifiedAt||'');
      return Number.isFinite(confirmed)&&confirmed<=now&&now-confirmed<=7*DAY?'available':'unverified';
    }
    const end=eventTime(item.eventEnd,true);
    if(Number.isFinite(end) && end<now)return 'ended';
    const start=eventTime(item.eventStart);
    if(Number.isFinite(start) && start>now)return 'upcoming';
    // 기간을 검증한 행사는 발표 기사가 오래됐어도 최신 목록에 남깁니다.
    if(Number.isFinite(end) && end>=now)return 'ongoing';
    const published=Date.parse(item.publishedAt||'');
    if(!Number.isFinite(published)||now-published>MAX_RECENT_DAYS*DAY)return 'past';
    return 'recent';
  };
  const statusLabels={ended:'종료',past:'지난 기사',upcoming:'예정',ongoing:'진행 중',available:'운영 확인',unverified:'판매 여부 확인 필요',recent:'기간 미확인'};
  const isArchived=item=>['ended','past'].includes(statusOf(item));
  // Original brand artwork for stories with no usable source photo.
  // Never pretend a generic illustration depicts the actual event.
  const fallbackImage=(className)=>{
    const img=el('img',className+' radar-thumb-fallback');
    img.src='assets/fry-radar-thumbnail-icon.svg?v=20261123attachedicon4';img.alt='감튀레이더 공통 썸네일 · 실제 기사 사진 아님';
    // The same small local PNG is cached and shared across cards; load it immediately.
    img.loading='eager';img.decoding='async';img.width=1280;img.height=800;
    return img;
  };
  const sourceImage=item=>{
    if(typeof item.imageUrl!=='string'||/과거 홍보 이미지|행사 배너가 아님|임시 이미지/.test(item.imageNote||''))return null;
    try{const url=new URL(item.imageUrl);return url.protocol==='https:'&&!/\.(?:svg|ico)(?:\?|$)/i.test(url.pathname)?url.href:null;}catch{return null;}
  };
  const card=item=>{
    const state=statusOf(item);
    const node=el('a','radar-card'+(isArchived(item)?' radar-card-archived':''));
    node.href=item.url;node.target='_blank';node.rel='noopener noreferrer';
    const top=el('div','radar-card-top');
    const badge=el('span','radar-badge',labels[item.category]||'소식');
    const stateBadge=el('span','radar-status radar-status-'+state,statusLabels[state]);
    const period=item.kind==='ongoing-menu'?(item.verifiedAt?'확인일 '+dateLabel(item.verifiedAt):'판매 기간 미확인'):(item.eventStart&&item.eventEnd?dateLabel(item.eventStart)+' ~ '+dateLabel(item.eventEnd):dateLabel(item.publishedAt));
    const time=el('time','',period);
    top.append(badge,stateBadge,time);
    if(model?.isNew(item,previousVisit))top.append(el('span','radar-new','NEW'));
    if(nearEnd(item))top.append(el('span','radar-new',model.daysLeft(item)===0?'오늘 종료':'D-'+model.daysLeft(item)));
    const title=el('h3','',item.title);
    // A genuine source photo takes precedence. Missing, broken or explicitly
    // historical stand-in photos use the same branded thumbnail as Home.
    const media=el('div','radar-card-media'),picture=el('div','radar-card-photo');
    media.append(picture);
    const imageUrl=sourceImage(item);
    const fallback=()=>{picture.replaceChildren(fallbackImage('radar-card-image'));media.querySelector('.radar-image-note')?.remove();};
    if(imageUrl){
      const img=el('img','radar-card-image');
      img.src=imageUrl;img.alt=(item.source||'원문')+' 대표 사진';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
      img.addEventListener('error',fallback,{once:true});picture.append(img);
      if(item.imageNote)media.append(el('span','radar-image-note',item.imageNote));
    }else fallback();
    // The feed is a visual index; read the full story at its original source.
    // Summaries remain in the data for search and verification, not in the UI.
    node.append(media,title,top);
    return node;
  };
  // 지난 소식은 큰 카드 대신 제목만 표시하는 가로형 링크 목록으로 보여줍니다.
  const archiveRow=item=>{
    const node=el('a','radar-archive-row');
    node.href=item.url;
    node.target='_blank';
    node.rel='noopener noreferrer';
    node.title=item.title;
    const title=el('span','radar-archive-title',item.title);
    const arrow=el('span','radar-archive-arrow','↗');
    arrow.setAttribute('aria-hidden','true');
    node.append(title,arrow);
    return node;
  };
  const entry=(item,past=false)=>{
    const wrap=el('article',past?'radar-entry radar-entry-past':'radar-entry');
    wrap.id='post-'+item.id;
    const link=past?archiveRow(item):card(item);
    const actions=el('div','radar-entry-actions');
    const save=el('button','radar-action',saved.has(item.id)?'★':'☆');
    save.type='button';save.setAttribute('aria-pressed',String(saved.has(item.id)));
    save.setAttribute('aria-label',item.title+' 즐겨찾기');
    save.title=saved.has(item.id)?'즐겨찾기 해제':'즐겨찾기 추가';
    save.addEventListener('click',()=>{
      if(!isActive())return;
      if(saved.has(item.id))saved.delete(item.id);else saved.add(item.id);
      storageWrite(sessionKey+':saved',[...saved]);
      if(view==='saved'){render();tabs[1]?.focus();return;}
      save.textContent=saved.has(item.id)?'★':'☆';
      save.title=saved.has(item.id)?'즐겨찾기 해제':'즐겨찾기 추가';
      save.setAttribute('aria-pressed',String(saved.has(item.id)));
    });
    actions.append(save);
    wrap.append(link,actions);return wrap;
  };
  const empty=(container,title,description)=>{
    const node=el('div','radar-empty');
    node.append(el('strong','',title),el('p','',description));
    container.append(node);
  };
  const byNewest=(a,b)=>(date(b.publishedAt||b.eventStart)?.getTime()||0)-(date(a.publishedAt||a.eventStart)?.getTime()||0);
  // Home carousel: the latest three verified stories.
  const previewDots=document.getElementById('radar-preview-dots');
  const previewCarousel=document.getElementById('radar-preview-carousel');
  const prefersReducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let previewIndex=0;
  let previewTimer=null;

  const previewCard=item=>{
    const node=el('a','radar-preview-item');
    node.href='member.html#post-'+encodeURIComponent(item.id);
    const thumb=el('div','radar-preview-thumb');
    const imageUrl=sourceImage(item);
    const fallback=()=>{node.removeAttribute('title');thumb.replaceChildren(fallbackImage('radar-preview-image'));};
    if(imageUrl){
      if(item.imageNote)node.title=item.imageNote;
      const img=el('img','radar-preview-image');
      img.src=imageUrl;img.alt=item.imageNote||'';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
      img.addEventListener('error',fallback,{once:true});thumb.append(img);
    }else fallback();

    // Full-bleed photo with only the headline on a bottom-up translucent fade.
    const shade=el('div','radar-preview-overlay');
    shade.append(el('h3','',item.title));
    node.append(thumb,shade);
    return node;
  };

  const previewStops=()=>{
    if(!preview)return [0];
    const cards=[...preview.querySelectorAll('.radar-preview-item')];
    if(!cards.length)return [0];
    const max=Math.max(0,preview.scrollWidth-preview.clientWidth);
    const first=cards[0].offsetLeft;
    const stops=[];
    for(const card of cards){
      const position=Math.max(0,Math.min(max,card.offsetLeft-first));
      if(!stops.length||position-stops[stops.length-1]>40)stops.push(position);
    }
    return stops.length?stops:[0];
  };

  const previewNav=()=>{
    const total=preview?.querySelector('.radar-preview-item')?previewStops().length:0;
    previewIndex=Math.max(0,Math.min(previewIndex,total-1));
    if(!previewDots)return;
    if(previewDots.children.length!==total){
      previewDots.replaceChildren();
      for(let i=0;i<total;i++){
        const dot=el('button','carousel-dot');
        dot.type='button';
        dot.setAttribute('aria-label',(i+1)+'번째 감튀 소식 보기');
        dot.setAttribute('aria-pressed','false');
        dot.addEventListener('click',()=>{goToPreview(i);startPreviewTimer();});
        previewDots.append(dot);
      }
    }
    [...previewDots.children].forEach((dot,i)=>{
      const active=i===previewIndex;
      dot.classList.toggle('is-active',active);
      dot.setAttribute('aria-pressed',String(active));
    });
  };
  const goToPreview=(index)=>{
    if(!preview||!isActive())return;
    const stops=previewStops();
    previewIndex=(index+stops.length)%stops.length;
    preview.scrollTo({left:stops[previewIndex],behavior:prefersReducedMotion?.matches?'auto':'smooth'});
    previewNav();
  };
  const stopPreviewTimer=()=>{
    if(previewTimer!==null){window.clearInterval(previewTimer);previewTimer=null;}
  };
  const startPreviewTimer=()=>{
    stopPreviewTimer();
    if(!isActive()||!preview||previewStops().length<2||prefersReducedMotion?.matches)return;
    previewTimer=window.setInterval(()=>{
      if(!isActive()||document.hidden||!previewCarousel||window.GTZHomeMotion?.scrolling)return;
      const bounds=previewCarousel.getBoundingClientRect();
      if(bounds.bottom<0||bounds.top>window.innerHeight)return;
      if(previewCarousel.matches(':hover')||preview.contains(document.activeElement))return;
      goToPreview(previewIndex+1);
    },5000);
  };
  preview?.addEventListener('scroll',()=>{
    const stops=previewStops();
    const current=preview.scrollLeft;
    previewIndex=stops.reduce((closest,position,index)=>
      Math.abs(position-current)<Math.abs(stops[closest]-current)?index:closest,0);
    previewNav();
  },{passive:true});
  if(preview){
    window.addEventListener('resize',()=>{goToPreview(Math.min(previewIndex,previewStops().length-1));startPreviewTimer();});
    prefersReducedMotion?.addEventListener?.('change',startPreviewTimer);
  }
  const renderPreview=()=>{
    if(!preview)return;
    stopPreviewTimer();
    preview.replaceChildren();
    const latest=items.filter(item=>!isArchived(item)).sort(byNewest).slice(0,3);
    if(!latest.length){
      empty(preview,'최근 감튀 소식을 찾는 중이에요.','새로운 국내 감튀 소식이 검증되면 소개할게요.');
      previewNav();
      return;
    }
    latest.forEach(item=>preview.append(previewCard(item)));
    previewIndex=0;
    preview.scrollLeft=0;
    window.requestAnimationFrame(()=>{previewNav();startPreviewTimer();});
  };

  let lastAnchor='';
  const revealAnchor=()=>{
    if(!isActive())return;
    let hash;try{hash=decodeURIComponent(location.hash.slice(1));}catch{hash=location.hash.slice(1);}
    if(!(hash.startsWith('post-')||hash==='radar-admin')){lastAnchor='';return;}
    if(hash===lastAnchor)return;
    const target=document.getElementById(hash);if(!target)return;
    lastAnchor=hash;if(hash==='radar-admin')target.open=true;
    const originalHash=location.hash;
    requestAnimationFrame(()=>{if(isActive()&&location.hash===originalHash)target.scrollIntoView({block:'center'});});
  };
  const render=(updatePreview=false)=>{
    if(!isActive())return;
    const term=(search?.value||'').trim().toLocaleLowerCase();
    const group=category?.value||'all';
    const order=sort?.value||'newest';
    const shown=items.filter(item=>
      (group==='all'||item.category===group)&&
      (view==='all'||view==='saved'&&saved.has(item.id)||view==='new'&&model?.isNew(item,previousVisit)||view==='ending'&&nearEnd(item)||view==='discount'&&item.category==='discount'&&statusOf(item)==='ongoing')&&
      (!term||[item.title,item.summary,item.source,item.brand,...(model?.brandNames(item)||[])].some(value=>String(value||'').toLocaleLowerCase().includes(term)))
    ).sort(byNewest);
    if(order==='oldest')shown.reverse();
    if(order==='ending')shown.sort((a,b)=>(statusOf(a)==='ongoing'?(model?.daysLeft(a)??Infinity):Infinity)-(statusOf(b)==='ongoing'?(model?.daysLeft(b)??Infinity):Infinity));
    if(dealPanel&&deals){dealPanel.hidden=view!=='discount';deals.replaceChildren();if(view==='discount'){const verified=shown.filter(i=>model?.offer(i));if(!verified.length)deals.append(el('p','','현재 정상가와 행사가가 모두 확인된 행사가 없습니다.'));for(const item of verified){const o=model.offer(item),row=el('a','radar-deal-row');row.href=item.url;row.target='_blank';row.rel='noopener noreferrer';row.append(el('strong','',item.title),el('span','',cash(o.original)+' → '+cash(o.sale)),el('b','',cash(o.saving)+' 절약 · '+o.percent+'%'));deals.append(row);}}}

    if(list){
      const current=shown.filter(item=>!isArchived(item));
      list.replaceChildren();
      if(current.length)current.forEach(item=>list.append(entry(item)));
      else empty(list,view==='all'?'조건에 맞는 소식이 없어요.':'해당 소식이 아직 없어요.',view==='new'&&!previousVisit?'첫 방문 이후 새로 수집된 소식이 표시됩니다.':'필터를 바꾸거나 다음 소식을 기다려 주세요.');
      if(count)count.textContent=`${current.length}개의 최근 소식`;
    }
    if(archive){
      const past=shown.filter(isArchived);
      archive.replaceChildren();
      if(past.length)past.forEach(item=>archive.append(entry(item,true)));
      else empty(archive,'보관된 지난 소식이 없어요.','종료일이 확인되거나 발행 후 14일이 지난 소식이 여기에 모입니다.');
      if(archiveCount)archiveCount.textContent=`${past.length}개의 지난 소식`;
    }
    if(updatePreview===true&&preview)renderPreview();
    revealAnchor();
  };
  tabs.forEach(tab=>tab.addEventListener('click',()=>{view=tab.dataset.radarView;tabs.forEach(t=>t.setAttribute('aria-pressed',String(t===tab)));render();}));
  [search,category,sort].forEach(control=>control?.addEventListener(control===search?'input':'change',render));
  // The real search input is the sole trigger. The panel floats below it,
  // rather than inserting a second button or moving the news grid.
  const filterPanel=document.getElementById('radar-filter-panel');
  const filterScrim=document.getElementById('radar-search-scrim');
  const toolbar=filterPanel?.closest('.radar-toolbar');
  let filterOpen=false,filterFrame=0,skipSearchFocus=false,filterCloseTimer=0;
  function fitFilterPanel(){
    filterFrame=0;
    if(!filterOpen||!toolbar)return;
    const row=toolbar.querySelector('.radar-search-row');
    const bounds=row.getBoundingClientRect(),vv=window.visualViewport;
    const bottom=vv?vv.offsetTop+vv.height:window.innerHeight;
    const remaining=bottom-bounds.bottom-20;
    // The software keyboard can leave very little room under the field.
    // Keep it anchored, and scroll the page just enough to expose controls.
    if(remaining<170&&bounds.top>(vv?.offsetTop||0)+18){
      const delta=Math.min(170-remaining,bounds.top-(vv?.offsetTop||0)-18);
      if(delta>1)window.scrollBy({top:delta,behavior:'instant'});
    }
    const available=bottom-row.getBoundingClientRect().bottom-20;
    filterPanel.style.setProperty('--radar-filter-space',Math.max(76,available)+'px');
  }
  function queueFilterFit(){
    if(filterOpen&&!filterFrame)filterFrame=requestAnimationFrame(fitFilterPanel);
  }
  function setFilters(open,restoreFocus=false){
    if(!search||!filterPanel||!toolbar)return;
    if(filterOpen===open)return;
    filterOpen=open;
    clearTimeout(filterCloseTimer);
    if(open){toolbar.classList.add('filters-visible');filterScrim?.classList.remove('is-closing');}
    else{
      filterScrim?.classList.add('is-closing');
      filterCloseTimer=setTimeout(()=>{toolbar.classList.remove('filters-visible');filterScrim?.classList.remove('is-closing');},480);
    }
    search.setAttribute('aria-expanded',String(open));
    filterPanel.setAttribute('aria-hidden',String(!open));
    filterPanel.inert=!open;
    toolbar.classList.toggle('filters-open',open);
    filterScrim?.classList.toggle('is-open',open);
    if(open){fitFilterPanel();queueFilterFit();}
    else{
      if(filterFrame)cancelAnimationFrame(filterFrame);filterFrame=0;
      if(restoreFocus){
        skipSearchFocus=true;search.focus({preventScroll:true});skipSearchFocus=false;
      }else if(toolbar.contains(document.activeElement))document.activeElement.blur();
    }
  }
  if(search&&filterPanel&&toolbar){
    search.addEventListener('focus',()=>{if(!skipSearchFocus)setFilters(true);});
    search.addEventListener('click',()=>setFilters(true));
    filterScrim?.addEventListener('click',()=>setFilters(false));
    toolbar.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&filterOpen){event.preventDefault();event.stopPropagation();setFilters(false,true);}
      else if(event.key==='Enter'&&event.target===search&&!event.isComposing){event.preventDefault();setFilters(!filterOpen);}
    });
    document.addEventListener('focusin',event=>{if(filterOpen&&!toolbar.contains(event.target))setFilters(false);});
    window.addEventListener('resize',queueFilterFit,{passive:true});
    window.addEventListener('scroll',queueFilterFit,{passive:true});
    window.visualViewport?.addEventListener('resize',queueFilterFit,{passive:true});
    window.visualViewport?.addEventListener('scroll',queueFilterFit,{passive:true});
  }
  const healthView=document.getElementById('radar-health');
  let refreshing=false,loaded=false,lastSignature='',timer=0,generation=0;
  const controllers=new Set();
  const readJSON=async file=>{
    const controller=new AbortController();controllers.add(controller);
    const timeout=setTimeout(()=>controller.abort(),15000);
    try{
      const response=await fetch(file,{cache:'no-cache',signal:controller.signal});
      if(!response.ok)throw Error('HTTP '+response.status);
      return await response.json();
    }finally{clearTimeout(timeout);controllers.delete(controller);}
  };
  const refresh=async()=>{
    if(refreshing||document.hidden||!isActive())return;
    refreshing=true;const epoch=generation;
    try{
      const [dataResult,healthResult]=await Promise.allSettled([
        readJSON('data/fry-radar.json'),healthView?readJSON('data/fry-radar-health.json'):Promise.resolve(null)
      ]);
      if(epoch!==generation||!isActive())return;
      if(healthView&&healthResult.status==='fulfilled'){
        const at=new Date(healthResult.value.checkedAt);
        if(Number.isFinite(at.getTime()))healthView.textContent=(healthResult.value.summary?.status==='partial'?'일부 수집 경로 점검 필요 · ':'')+(healthResult.value.summary?.sources?`${healthResult.value.summary.reachable}/${healthResult.value.summary.sources}개 공식 경로 연결 · `:'')+'최근 검사 '+new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(at);
      }
      if(healthView&&healthResult.status==='rejected')healthView.textContent='수집 상태를 확인하지 못했어요.';
      if(dataResult.status!=='fulfilled')throw Error('data unavailable');
      const data=dataResult.value;
      if(!Array.isArray(data.items))throw Error('invalid data');
      const fresh=data.items.filter(item=>item&&item.id&&item.title&&validUrl(item.url));
      // Ignore audit timestamps so hourly checks do not reset the carousel.
      const signature=JSON.stringify(fresh.map(({lastCheckedAt,recheckStatus,eventChanges,...item})=>({...item,displayState:statusOf(item)})));
      if(signature!==lastSignature){
        const focused=document.activeElement?.closest('[id]')?.id;
        const scrollY=window.scrollY;
        items=fresh;render(true);
        if(loaded&&!homePreview){
          if(focused)document.getElementById(focused)?.focus({preventScroll:true});
          window.scrollTo({top:scrollY,behavior:'instant'});
        }
        lastSignature=signature;
      }
      if(!homePreview&&!visitRecorded&&sessionKey){storageWrite(sessionKey+':visit',Date.now());visitRecorded=true;}
      loaded=true;
      if(updated)updated.textContent=data.updatedAt?'마지막 수집: '+dateLabel(data.updatedAt):'아직 수집된 소식이 없습니다.';
    }catch{
      // A temporary failure must not erase posts already on screen.
      if(epoch!==generation||!isActive())return;
      if(!loaded){
        if(updated)updated.textContent='연결을 다시 확인하고 있어요.';
        for(const target of [list,archive,preview])if(target){target.replaceChildren();empty(target,'소식을 불러오는 중이에요.','잠시 후 자동으로 다시 확인합니다.');}
      }
    }finally{refreshing=false;if(epoch!==generation&&isActive())refresh();}
  };
  function enter(license){
    if(!homePreview&&!sessionKey){sessionKey='gtz:radar:'+String(license?.number||member?.license?.number||'local')+':'+String(license?.issuedAt||member?.license?.issuedAt||'');const value=storageRead(sessionKey+':saved',[]);saved=new Set(Array.isArray(value)?value:[]);previousVisit=Number(storageRead(sessionKey+':visit',0))||0;visitRecorded=false;lastSignature='';view='all';tabs.forEach(t=>t.setAttribute('aria-pressed',String(t.dataset.radarView==='all')));}
    if(homePreview)homeRunning=true;
    const hash=location.hash.slice(1);
    if(!homePreview&&hash.startsWith('post-')&&loaded){let id=hash;try{id=decodeURIComponent(hash);}catch{}if(!document.getElementById(id)){search.value='';category.value='all';view='all';tabs.forEach(t=>t.setAttribute('aria-pressed',String(t.dataset.radarView==='all')));render();}}
    revealAnchor();if(!timer)timer=window.setInterval(refresh,homePreview?300000:120000);
    if(loaded)startPreviewTimer();refresh();
  }
  function leave(){setFilters(false);sessionKey='';if(homePreview)homeRunning=false;generation++;controllers.forEach(c=>c.abort());controllers.clear();clearInterval(timer);timer=0;stopPreviewTimer();lastAnchor='';}
  if(homePreview)enter();else member.register('radar',{enter,leave});
  window.addEventListener('focus',refresh);
  window.addEventListener('online',refresh);
  window.addEventListener('pageshow',homePreview?enter:refresh);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  window.addEventListener('pagehide',leave);
})();
