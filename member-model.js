/* Pure state and geometry shared by the Member tools. */
(() => {
  'use strict';
  const names=['감띠','뚱감띠','케이준띠','탄감띠','덜감띠','케찹 감띠','빙빙이','휜감띠','감감이와 띠띠','울룩불룩띠','웨지감띠','부스러끼','두리감띠','촉촉감띠'];
  const KEY='gamttiz-my-license-v1',COUNTER='gamttiz-license-local-sequence';
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const validIndex=i=>Number.isInteger(i)&&i>=0&&i<names.length;
  const serial=n=>Number(/^GTZ - (\d{4,})$/.exec(n||'')?.[1]||0);
  const cleanName=s=>[...String(s||'').replace(/[\u0000-\u001f\u007f]/g,'').trim()].slice(0,18).join('');
  function license(raw){
    if(!raw||raw.version!==1||!cleanName(raw.name)||!validIndex(raw.character)||!Number.isFinite(Date.parse(raw.issuedAt)))return null;
    if(!(Number.isSafeInteger(serial(raw.number))&&serial(raw.number)>0)&&!/^GTZ-[A-Z2-9]{6}-[A-Z2-9]{6}$/.test(raw.number||''))return null;
    return {version:1,name:cleanName(raw.name),character:raw.character,number:raw.number,issuedAt:new Date(raw.issuedAt).toISOString()};
  }
  function readLicense(store){try{return license(JSON.parse(store.getItem(KEY)||'null'));}catch{return null;}}
  const petKey=id=>`gamttiz-pocket-v1:${id.number}:${id.issuedAt}`;
  const art=i=>`assets/illustrations/friend-${String(i+1).padStart(2,'0')}.svg`;
  function pet(raw,id,now=Date.now()){
    const safeTime=v=>Number.isFinite(v)&&v>0?clamp(v,1,now):now;
    const slots=Array.isArray(raw?.slots)?[...new Set(raw.slots.filter(validIndex))].slice(0,6):[id.character];
    return {version:1,slots:slots.length?slots:[id.character],createdAt:safeTime(raw?.createdAt),lastFed:safeTime(raw?.lastFed),lastPlay:safeTime(raw?.lastPlay),care:Number.isSafeInteger(raw?.care)?clamp(raw.care,0,999999):0,lastAction:Number.isFinite(raw?.lastAction)?clamp(raw.lastAction,0,now):0};
  }
  function petStats(p,now=Date.now()){
    const hours=ms=>Math.max(0,ms)/3600000;
    const full=clamp(Math.round(100-hours(now-p.lastFed)*5),0,100);
    const happy=clamp(Math.round(100-hours(now-p.lastPlay)*3),0,100);
    const day=Math.floor(Math.max(0,now-p.createdAt)/86400000)+1;
    const hour=new Date(now).getHours();
    const mood=full<35?'출출해요!':happy<35?'같이 놀아요!':hour>=23||hour<7?'꾸벅꾸벅 졸려요.':'오늘도 함께해요!';
    return {full,happy,day,mood};
  }
  function interact(p,kind,now=Date.now()){
    const next={...p};if(kind==='feed')next.lastFed=now;if(kind==='play')next.lastPlay=now;
    if(now-p.lastAction>=5000){next.care=p.care+1;next.lastAction=now;}return next;
  }
  const deg=v=>v*180/Math.PI;
  function measure(x,y,z,rotation=0){
    if(![x,y,z].every(Number.isFinite))return null;
    const length=Math.hypot(x,y,z);if(length<.5)return null;
    const r=rotation*Math.PI/180,xx=(x*Math.cos(r)+y*Math.sin(r))/length,yy=(-x*Math.sin(r)+y*Math.cos(r))/length,zz=z/length;
    return {x:deg(Math.asin(clamp(xx,-1,1))),y:deg(Math.asin(clamp(yy,-1,1))),flat:deg(Math.atan2(Math.hypot(xx,yy),Math.abs(zz))),edge:deg(Math.asin(clamp(yy,-1,1))),normal:[xx,yy,zz]};
  }
  function relative(m,zero){const flat=zero.normal?deg(Math.acos(clamp(Math.abs(m.normal.reduce((sum,n,i)=>sum+n*zero.normal[i],0)),0,1))):m.flat;return {x:m.x-zero.x,y:m.y-zero.y,flat,edge:m.edge-zero.edge};}
  globalThis.GTZMemberModel={names,KEY,COUNTER,clamp,validIndex,serial,license,readLicense,petKey,art,pet,petStats,interact,measure,relative};
})();
