(()=>{
  'use strict';
  const labels={discount:'할인',event:'이벤트',festival:'축제','new-product':'신제품',other:'기타'};
  const list=document.getElementById('radar-list');
  const archive=document.getElementById('radar-archive-list');
  const preview=document.getElementById('radar-preview-list');
  if(!list&&!archive&&!preview)return;
  const search=document.getElementById('radar-search');
  const category=document.getElementById('radar-category');
  const sort=document.getElementById('radar-sort');
  const count=document.getElementById('radar-count');
  const archiveCount=document.getElementById('radar-archive-count');
  const updated=document.getElementById('radar-updated');
  const DAY=86400000;
  const MAX_RECENT_DAYS=14;
  let items=[];

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
    const end=eventTime(item.eventEnd,true);
    if(Number.isFinite(end) && end<Date.now())return 'ended';
    const start=eventTime(item.eventStart);
    if(Number.isFinite(start) && start>Date.now())return 'upcoming';
    if(Number.isFinite(end))return 'dated';
    const published=Date.parse(item.publishedAt||'');
    if(!Number.isFinite(published)||Date.now()-published>MAX_RECENT_DAYS*DAY)return 'past';
    return 'recent';
  };
  const statusLabels={ended:'종료',past:'지난 기사',upcoming:'예정',dated:'종료일 확인',recent:'기간 미확인'};
  const isArchived=item=>['ended','past'].includes(statusOf(item));
  const card=(item,home)=>{
    const state=statusOf(item);
    const node=el('a','radar-card'+(isArchived(item)?' radar-card-archived':''));
    node.href=home?`fry-radar.html#post-${encodeURIComponent(item.id)}`:item.url;
    if(!home){node.id=`post-${item.id}`;node.target='_blank';node.rel='noopener noreferrer';}
    const top=el('div','radar-card-top');
    const badge=el('span','radar-badge',labels[item.category]||'소식');
    const stateBadge=el('span','radar-status radar-status-'+state,statusLabels[state]);
    const time=el('time','',dateLabel(item.publishedAt));
    top.append(badge,stateBadge,time);
    const title=el('h3','',item.title);
    const summary=el('p','',item.summary||'원문에서 자세히 확인해 주세요.');
    const bottom=el('div','radar-card-bottom');
    bottom.append(el('span','',item.source||'출처 확인'),el('span','','↗'));
    node.append(top,title,summary,bottom);
    return node;
  };
  // 지난 소식은 큰 카드 대신 제목만 표시하는 가로형 링크 목록으로 보여줍니다.
  const archiveRow=item=>{
    const node=el('a','radar-archive-row');
    node.href=item.url;
    node.id=`post-${item.id}`;
    node.target='_blank';
    node.rel='noopener noreferrer';
    node.title=item.title;
    const title=el('span','radar-archive-title',item.title);
    const arrow=el('span','radar-archive-arrow','↗');
    arrow.setAttribute('aria-hidden','true');
    node.append(title,arrow);
    return node;
  };
  const empty=(container,title,description)=>{
    const node=el('div','radar-empty');
    node.append(el('strong','',title),el('p','',description));
    container.append(node);
  };
  const byNewest=(a,b)=>(date(b.publishedAt)?.getTime()||0)-(date(a.publishedAt)?.getTime()||0);
  const render=()=>{
    const term=(search?.value||'').trim().toLocaleLowerCase();
    const group=category?.value||'all';
    const order=sort?.value||'newest';
    const shown=items.filter(item=>
      (group==='all'||item.category===group)&&
      (!term||[item.title,item.summary,item.source].some(value=>String(value||'').toLocaleLowerCase().includes(term)))
    ).sort(byNewest);
    if(order==='oldest')shown.reverse();

    if(list){
      const current=shown.filter(item=>!isArchived(item));
      list.replaceChildren();
      if(current.length)current.forEach(item=>list.append(card(item,false)));
      else empty(list,'최근 소식이 없어요.','최근 14일 내 확인된 감튀 소식이 들어오면 여기에 표시할게요.');
      if(count)count.textContent=`${current.length}개의 최근 소식`;
    }
    if(archive){
      const past=shown.filter(isArchived);
      archive.replaceChildren();
      if(past.length)past.forEach(item=>archive.append(archiveRow(item)));
      else empty(archive,'보관된 지난 소식이 없어요.','종료일이 확인되거나 발행 후 14일이 지난 소식이 여기에 모입니다.');
      if(archiveCount)archiveCount.textContent=`${past.length}개의 지난 소식`;
    }
    if(preview){
      preview.replaceChildren();
      const latest=items.filter(item=>!isArchived(item)).sort(byNewest).slice(0,3);
      if(latest.length)latest.forEach(item=>preview.append(card(item,true)));
      else empty(preview,'최근 감튀 소식을 찾는 중이에요.','새로운 할인·행사·신제품 소식이 검증되면 소개할게요.');
    }
    if(list&&location.hash){
      let hash;
      try{hash=decodeURIComponent(location.hash.slice(1));}
      catch{hash=location.hash.slice(1);}
      if(hash&&document.getElementById(hash))requestAnimationFrame(()=>document.getElementById(hash)?.scrollIntoView({block:'center'}));
    }
  };
  [search,category,sort].forEach(control=>control?.addEventListener(control===search?'input':'change',render));
  fetch('data/fry-radar.json',{cache:'no-store'})
    .then(response=>{if(!response.ok)throw Error(`HTTP ${response.status}`);return response.json();})
    .then(data=>{
      items=Array.isArray(data.items)?data.items.filter(item=>item&&item.id&&item.title&&validUrl(item.url)):[];
      if(updated)updated.textContent=data.updatedAt?`마지막 수집: ${dateLabel(data.updatedAt)}`:'아직 수집된 소식이 없습니다.';
      render();
    }).catch(()=>{
      if(updated)updated.textContent='소식을 불러오지 못했어요. 잠시 후 다시 확인해 주세요.';
      if(list){list.replaceChildren();empty(list,'소식을 불러오지 못했어요.','잠시 후 새로고침해 주세요.');}
      if(archive){archive.replaceChildren();empty(archive,'지난 소식을 불러오지 못했어요.','잠시 후 새로고침해 주세요.');}
      if(preview){preview.replaceChildren();empty(preview,'소식을 불러오지 못했어요.','잠시 후 다시 확인해 주세요.');}
    });
})();
