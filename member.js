(() => {
  'use strict';
  const M=GTZMemberModel,$=id=>document.getElementById(id),views=[...document.querySelectorAll('[data-member-view]')];
  const handlers=new Map();let id=null,active=null,installEvent=null,shownView=null;
  const route=()=>{const name=location.hash.slice(1);if(name.startsWith('post-')||name==='radar-admin')return 'radar';return views.some(v=>v.dataset.memberView===name)?name:'hub';};
  const sameLicense=(a,b)=>a?.number===b?.number&&a?.issuedAt===b?.issuedAt&&a?.character===b?.character;
  function sync(){
    const next=M.readLicense(localStorage),previous=active,previousId=id;
    id=next;active=next?route():null;
    $('member-locked').hidden=!!next;$('member-unlocked').hidden=!next;
    views.forEach(view=>view.hidden=view.dataset.memberView!==active);
    if(next){
      $('member-greeting').textContent=next.name;
      if($('member-avatar').getAttribute('src')!==M.art(next.character))$('member-avatar').src=M.art(next.character);
    }
    const view=next?views.find(v=>v.dataset.memberView===active):$('member-locked');
    if(view!==shownView){
      shownView?.classList.remove('is-entering');
      view?.classList.add('is-entering');
      shownView=view;
    }
    if(previous&&(previous!==active||!next||!sameLicense(previousId,next)))handlers.get(previous)?.leave?.();
    if(active)handlers.get(active)?.enter?.(next);
    document.title=(active==='radar'?'FRY RADER':active==='level'?'GAMTTIZ LEVEL':'Member · 감띠즈 멤버')+' — GAMTTIZ';
  }
  window.GTZMember={get license(){return id;},get active(){return active;},register(name,handler){handlers.set(name,handler);if(active===name)handler.enter?.(id);},isActive:name=>active===name&&!!M.readLicense(localStorage)};
  window.addEventListener('hashchange',()=>{sync();shownView?.querySelector('h1[tabindex]')?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});});
  window.addEventListener('storage',e=>{if(e.key===M.KEY||e.key===null)sync();});
  window.addEventListener('gamttiz:license-change',sync);window.addEventListener('pageshow',sync);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync();});
  $('member-backup').addEventListener('click',()=>{
    const current=M.readLicense(localStorage);if(!current)return sync();
    try{
      const data={format:'gamttiz-member-backup',version:1,license:current};
      const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
      const a=document.createElement('a');a.href=url;a.download='GAMTTIZ-member-backup.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
      $('member-backup-status').textContent='백업 파일을 저장했어요. 개인 기기에 보관하고 홈 화면 앱에서 불러오세요.';
    }catch{$('member-backup-status').textContent='백업하지 못했어요. 저장 공간을 확인해주세요.';}
  });
  $('member-restore').addEventListener('click',()=>$('member-import-file').click());
  $('member-import-file').addEventListener('change',async e=>{
    const file=e.target.files?.[0];e.target.value='';if(!file)return;
    try{
      if(file.size>100000)throw Error();const data=JSON.parse(await file.text()),restored=M.license(data.license);
      if(data.format!=='gamttiz-member-backup'||data.version!==1||!restored)throw Error();
      if(M.readLicense(localStorage)){sync();return;}
      const current=Number(localStorage.getItem(M.COUNTER)||0),count=Math.max(Number.isSafeInteger(current)&&current>=0?current:0,M.serial(restored.number));
      localStorage.setItem(M.COUNTER,String(count));localStorage.setItem(M.KEY,JSON.stringify(restored));
      window.dispatchEvent(new Event('gamttiz:license-change'));sync();
    }catch{$('member-lock-status').textContent='올바른 감띠즈 백업 파일을 선택해주세요. (파일은 이 기기에만 저장됩니다.)';}
  });
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e;$('member-install').hidden=false;});
  $('member-install').addEventListener('click',async()=>{if(!installEvent)return;try{await installEvent.prompt();}finally{installEvent=null;$('member-install').hidden=true;}});
  window.addEventListener('appinstalled',()=>{$('member-install').hidden=true;});
  sync();
  if('serviceWorker'in navigator&&window.isSecureContext)navigator.serviceWorker.register('member-sw.js',{scope:'./'}).catch(()=>{});
})();

