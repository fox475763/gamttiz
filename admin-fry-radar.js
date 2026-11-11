(()=>{
  'use strict';
  const root=document.getElementById('admin-radar-posts');
  const status=document.getElementById('admin-radar-status');
  if(!root||!status)return;
  const create=(tag,cls,txt)=>{
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    if(txt!=null)node.textContent=txt;
    return node;
  };
  fetch('data/fry-radar.json',{cache:'no-store'})
    .then(response=>{if(!response.ok)throw Error('HTTP '+response.status);return response.json();})
    .then(data=>{
      const items=Array.isArray(data.items)?data.items.filter(p=>p&&p.id&&p.title&&p.url):[];
      root.replaceChildren();
      status.textContent='현재 게시된 FRY RADAR 소식 '+items.length+'건';
      for(const post of items){
        const row=create('div','admin-radar-post');
        const info=create('div');
        info.append(create('strong','',post.title),create('small','',post.id));
        const link=create('a','admin-radar-delete','삭제 요청');
        const params=new URLSearchParams({
          title:'[FRY DELETE] '+post.id,
          body:'POST_ID: '+post.id+'\n\n삭제 대상: '+post.title+'\n출처: '+post.url+'\n\n관리자 계정으로 이 이슈를 등록하면 해당 게시물이 삭제되고 자동 재게시가 차단됩니다.'
        });
        link.href='https://github.com/fox475763/gamttiz/issues/new?'+params.toString();
        link.target='_blank';
        link.rel='noopener noreferrer';
        link.addEventListener('click',event=>{
          if(!window.confirm('이 소식을 삭제 요청할까요? 삭제 후에는 자동으로 다시 게시되지 않습니다.'))event.preventDefault();
        });
        row.append(info,link);
        root.append(row);
      }
    })
    .catch(()=>{status.textContent='게시물 목록을 불러오지 못했습니다. 새로고침해 주세요.';});
})();