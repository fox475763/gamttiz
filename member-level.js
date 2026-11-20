(() => {
  'use strict';
  const M=GTZMemberModel,member=GTZMember,$=id=>document.getElementById(id),status=$('level-status'),dial=$('level-flat'),bubble=$('level-bubble'),needle=$('level-needle');
  let mode='flat',active=false,requested=false,requesting=false,filtered=null,raw=null,zero={x:0,y:0,edge:0},rotation=0,frame=0,watchdog=0,lastSample=0;
  const angle=()=>Number(screen.orientation?.angle??window.orientation??0)||0;
  const fmt=n=>`${Math.abs(n)<.05?'0.0':n.toFixed(1)}°`;
  const stop=()=>{active=false;window.removeEventListener('devicemotion',motion);clearTimeout(watchdog);cancelAnimationFrame(frame);frame=0;filtered=null;raw=null;lastSample=0;$('level-start').textContent='센서 활성화';$('level-zero').disabled=true;$('level-reset').disabled=true;$('level-number').textContent='—';$('level-x').textContent=$('level-y').textContent='—';$('level-message').textContent='센서를 활성화해 주세요.';$('level-board').classList.remove('is-level');bubble.style.transform='translate(-50%,-50%)';needle.style.transform='translate(-50%,-50%)';};
  function render(){
    frame=0;if(!raw||!active||!member.isActive('level')||document.hidden)return;
    const m=M.relative(raw,zero),value=mode==='flat'?m.flat:m.edge,correct=Math.abs(value)<=.5;
    $('level-number').textContent=(Math.abs(value)<.05?0:value).toFixed(1);$('level-x').textContent=fmt(m.x);$('level-y').textContent=fmt(m.y);
    $('level-board').classList.toggle('is-level',correct);$('level-message').textContent=correct?(mode==='flat'?'수평입니다!':'기준 각도입니다!'):(mode==='flat'?'감띠를 가운데에 맞춰주세요.':'휴대폰을 기울여 각도를 확인하세요.');
    const radius=dial.clientWidth*.36||90,scale=radius/22,mag=Math.hypot(m.x,m.y),limit=mag>22?22/mag:1;
    bubble.style.transform=`translate(-50%,-50%) translate(${(-m.x*scale*limit).toFixed(1)}px,${(m.y*scale*limit).toFixed(1)}px)`;
    needle.style.transform=`translate(-50%,-50%) rotate(${m.edge.toFixed(2)}deg)`;
    $('level-zero').disabled=false;$('level-reset').disabled=false;
  }
  function motion(e){
    if(!active||document.hidden||!member.isActive('level'))return;
    const g=e.accelerationIncludingGravity;if(!g||![g.x,g.y,g.z].every(Number.isFinite)||Math.hypot(g.x,g.y,g.z)<.5)return;
    const now=performance.now();if(now-lastSample<25)return;lastSample=now;
    const nextRotation=angle();if(nextRotation!==rotation){rotation=nextRotation;filtered=null;zero={x:0,y:0,edge:0};status.textContent='화면 방향이 바뀌어 영점을 초기화했어요.';}
    const data=[g.x,g.y,g.z];filtered=filtered?filtered.map((x,i)=>x*.72+data[i]*.28):data;
    raw=M.measure(...filtered,rotation);if(!raw)return;
    clearTimeout(watchdog);if(!frame)frame=requestAnimationFrame(render);
  }
  function start(){
    active=true;rotation=angle();filtered=null;raw=null;lastSample=0;window.addEventListener('devicemotion',motion,{passive:true});$('level-start').textContent='측정 중지';$('level-message').textContent='센서 신호를 기다리고 있어요.';status.textContent='측정 중에는 휴대폰을 가만히 두세요.';
    watchdog=setTimeout(()=>{if(!raw){stop();status.textContent='센서 신호가 없어요. 센서를 지원하는 모바일 브라우저에서 권한을 확인해주세요.';}},4000);
  }
  $('level-start').addEventListener('click',async()=>{
    if(!member.isActive('level')||requesting)return;if(active){stop();status.textContent='측정을 중지했어요.';return;}
    if(!window.DeviceMotionEvent){status.textContent='이 기기에는 움직임 센서가 없거나 브라우저가 지원하지 않아요.';return;}
    requesting=true;try{if(!requested&&typeof DeviceMotionEvent.requestPermission==='function'&&await DeviceMotionEvent.requestPermission()!=='granted')throw Error();requested=true;if(member.isActive('level'))start();}catch{status.textContent='움직임 센서 권한을 허용해주세요.';}finally{requesting=false;}
  });
  function setMode(next){mode=next;$('level-flat-tab').setAttribute('aria-pressed',String(mode==='flat'));$('level-angle-tab').setAttribute('aria-pressed',String(mode==='angle'));dial.hidden=mode!=='flat';$('level-angle').hidden=mode!=='angle';$('level-axes').hidden=mode!=='flat';$('level-instructions').textContent=mode==='flat'?'휴대폰을 측정할 면에 평평하게 올려놓으세요.':'휴대폰의 화면 세로 방향을 기준으로 측정할 면에 맞춰 기울이세요.';if(raw)render();}
  $('level-flat-tab').addEventListener('click',()=>setMode('flat'));$('level-angle-tab').addEventListener('click',()=>setMode('angle'));
  $('level-zero').addEventListener('click',()=>{if(!raw||!member.isActive('level'))return;zero={x:raw.x,y:raw.y,edge:raw.edge,normal:raw.normal.slice()};render();status.textContent='현재 자세를 0° 기준으로 저장했어요.';});
  $('level-reset').addEventListener('click',()=>{zero={x:0,y:0,edge:0};if(raw)render();status.textContent='기본 영점으로 되돌렸어요.';});
  function enter(id){$('level-friend').src=$('level-angle-friend').src=M.art(id.character);}
  function leave(){stop();zero={x:0,y:0,edge:0};status.textContent='';}
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&active){stop();status.textContent='화면이 비활성화되어 측정을 중지했어요.';}});window.addEventListener('pagehide',leave);
  member.register('level',{enter,leave});
})();
