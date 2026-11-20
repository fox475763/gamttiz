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
  const art=i=>`assets/illustrations/friend-${String(i+1).padStart(2,'0')}.svg`;
  const deg=v=>v*180/Math.PI;
  function measure(x,y,z,rotation=0){
    if(![x,y,z].every(Number.isFinite))return null;
    const length=Math.hypot(x,y,z);if(length<.5)return null;
    const r=rotation*Math.PI/180,xx=(x*Math.cos(r)+y*Math.sin(r))/length,yy=(-x*Math.sin(r)+y*Math.cos(r))/length,zz=z/length;
    return {x:deg(Math.asin(clamp(xx,-1,1))),y:deg(Math.asin(clamp(yy,-1,1))),flat:deg(Math.atan2(Math.hypot(xx,yy),Math.abs(zz))),edge:deg(Math.asin(clamp(yy,-1,1))),normal:[xx,yy,zz]};
  }
  function relative(m,zero){const flat=zero.normal?deg(Math.acos(clamp(Math.abs(m.normal.reduce((sum,n,i)=>sum+n*zero.normal[i],0)),0,1))):m.flat;return {x:m.x-zero.x,y:m.y-zero.y,flat,edge:m.edge-zero.edge};}
  globalThis.GTZMemberModel={names,KEY,COUNTER,clamp,validIndex,serial,license,readLicense,art,measure,relative};
})();
