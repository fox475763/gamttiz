(()=>{
  'use strict';
  const labels={discount:'할인',event:'이벤트',festival:'축제','new-product':'신제품',other:'기타'};
  const list=document.getElementById('radar-list');
  const preview=document.getElementById('radar-preview-list');
  if(!list&&!preview)return;
  const search=document.getElementById('radar-search');
  const category=document.getElementById('radar-category');
  const sort=document.getElementById('radar-sort');
  const count=document.getElementById('radar-count');
  const updated=document.getElementById('radar-updated');
  let items=[];
  const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!=null)node.textContent=text;return node};
  const validUrl=value=>{try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:null}catch{return null}};
  const date=value=>{const time=Date.parse(value||'');return Number.isFinite(time)?new Date(time):null};
  const dateLabel=value=>{const d=date(value);return d?new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Seoul'}).format(d):'날짜 미확인'};
  const card=(item,home)=>{
    const node=el('a','radar-card');node.href=home?`fry-radar.html#post-${encodeURIComponent(item.id)}`:item.url;
    if(!home){node.id=`post-${item.id}`;node.target='_blank';node.rel='noopener noreferrer'}
    const top=el('div','radar-card-top');top.append(el('span','radar-badge',labels[item.category]||'소식'),el('time','',dateLabel(item.publishedAt)));
    const title=el('h3','',item.title);const summary=el('p','',item.summary||'원문에서 자세히 확인해 주세요.');
    const bottom=el('div','radar-card-bottom');bottom.append(el('span','',item.source||'출처 확인'),el('span','','↗'));
    node.append(top,title,summary,bottom);return node;
  };
  const empty=(container,filtered)=>{const node=el('div','radar-empty');node.append(el('strong','',filtered?'검색 결과가 없어요.':'아직 포착된 감튀 소식이 없어요.'),el('p','',filtered?'다른 검색어나 카테고리로 찾아보세요.':'확인된 소식이 들어오면 여기에 소개할게요.'));container.append(node)};
  const render=()=>{
    if(list){const term=(search?.value||'').trim().toLocaleLowerCase();const group=category?.value||'all';const order=sort?.value||'newest';const shown=items.filter(item=>(group==='all'||item.category===group)&&(!term||[item.title,item.summary,item.source].some(value=>String(value||'').toLocaleLowerCase().includes(term)))).sort((a,b)=>(date(b.publishedAt)?.getTime()||0)-(date(a.publishedAt)?.getTime()||0));if(order==='oldest')shown.reverse();list.replaceChildren();if(shown.length)shown.forEach(item=>list.append(card(item,false)));else empty(list,items.length>0);if(count)count.textContent=`${shown.length}개의 소식`;
      const hash=decodeURIComponent(location.hash.slice(1));if(hash&&document.getElementById(hash))requestAnimationFrame(()=>document.getElementById(hash)?.scrollIntoView({block:'center'}));
    }
    if(preview){preview.replaceChildren();const shown=[...items].sort((a,b)=>(date(b.publishedAt)?.getTime()||0)-(date(a.publishedAt)?.getTime()||0)).slice(0,3);if(shown.length)shown.forEach(item=>preview.append(card(item,true)));else empty(preview,false)}
  };
  [search,category,sort].forEach(control=>control?.addEventListener(control===search?'input':'change',render));
  fetch('data/fry-radar.json',{cache:'no-store'}).then(response=>{if(!response.ok)throw Error(`HTTP ${response.status}`);return response.json()}).then(data=>{items=Array.isArray(data.items)?data.items.filter(item=>item&&item.id&&item.title&&validUrl(item.url)):[];if(updated)updated.textContent=data.updatedAt?`마지막 수집: ${dateLabel(data.updatedAt)}`:'아직 수집된 소식이 없습니다.';render()}).catch(()=>{if(updated)updated.textContent='소식을 불러오지 못했어요. 잠시 후 다시 확인해 주세요.';if(list){list.replaceChildren();const node=el('div','radar-empty');node.append(el('strong','','소식을 불러오지 못했어요.'),el('p','','잠시 후 새로고침해 주세요.'));list.append(node)}if(preview){preview.replaceChildren();empty(preview,false)}});
})();
