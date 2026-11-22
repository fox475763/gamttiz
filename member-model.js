/* License state shared by Member. */
(() => {
  'use strict';
  const names=['감띠','뚱감띠','케이준띠','탄감띠','덜감띠','케찹 감띠','빙빙이','휜감띠','감감이와 띠띠','울룩불룩띠','웨지감띠','부스러끼','두리감띠','촉촉감띠','버터갈릭감띠','매콤감띠'];
  const KEY='gamttiz-my-license-v1',COUNTER='gamttiz-license-local-sequence';
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
  globalThis.GTZMemberModel={names,KEY,COUNTER,validIndex,serial,license,readLicense,art};
})();
