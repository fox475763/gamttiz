(()=>{
'use strict';
const $=id=>document.getElementById(id);
const login=$('radar-login-panel'),panel=$('radar-admin-panel'),posts=$('radar-admin-posts'),status=$('radar-admin-status'),dialog=$('radar-admin-confirm');
let selected=null;
const make=(tag,className,value)=>{const node=document.createElement(tag);if(className)node.className=className;if(value!=null)node.textContent=value;return node;};
const request=post=>{
 const params=new URLSearchParams({template:'fry-delete.md',title:'[FRY DELETE] '+post.id,body:'POST_ID: '+post.id+'\n\n삭제 대상: '+post.title+'\n출처: '+post.url+'\n\nGitHub 관리자로 Submit new issue를 눌러 삭제합니다.'});
 const link='https://github.com/fox475763/gamttiz/issues/new?'+params.toString();
 // Navigate in the same tab to avoid popup blocking.
 location.href=link;
};
const show=()=>{
 login.hidden=true;panel.hidden=false;
 status.textContent='게시물을 불러오는 중이에요.';
 fetch('data/fry-radar.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(data=>{
   const items=Array.isArray(data.items)?data.items.filter(x=>x&&x.id&&x.title&&x.url):[];
   status.textContent='현재 게시물 '+items.length+'건 · 아래에서 삭제할 글을 선택하세요.';
   posts.replaceChildren();
   for(const item of items){
     const row=make('div','radar-admin-post'),info=make('div','radar-admin-post-info');
     info.append(make('div','radar-admin-post-title',item.title),make('div','radar-admin-post-meta',item.source||'출처 미확인'));
     const button=make('button','radar-admin-delete','삭제');
     button.type='button';button.setAttribute('aria-label',item.title+' 삭제');
     button.addEventListener('click',()=>{selected=item;$('radar-admin-selected').textContent=item.title;if(dialog.showModal)dialog.showModal();else if(confirm(item.title+' 삭제 요청을 열까요?'))request(item);});
     row.append(info,button);posts.append(row);
   }
 }).catch(()=>{status.textContent='게시물 목록을 불러오지 못했어요. 새로고침해 주세요.';});
};
$('radar-enter-admin').addEventListener('click',show);
$('radar-admin-exit').addEventListener('click',()=>{panel.hidden=true;login.hidden=false;selected=null;});
$('radar-admin-cancel').addEventListener('click',()=>dialog.close());
$('radar-admin-approve').addEventListener('click',()=>{if(selected)request(selected)});
dialog.addEventListener('close',()=>{selected=null});
})();