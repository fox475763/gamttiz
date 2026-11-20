(() => {
  'use strict';
  const KEY = 'gamttiz-my-license-v1';
  const COUNTER = 'gamttiz-license-local-sequence';
  const wallet = new URLSearchParams(location.search).get('wallet') === '1';
  if(wallet) document.body.classList.add('license-wallet-view');
  const names = ['감띠','뚱감띠','케이준띠','탄감띠','덜감띠','케찹 감띠','빙빙이','휜감띠','감감이와 띠띠','울룩불룩띠','웨지감띠','부스러끼','두리감띠','촉촉감띠'];
  const $ = id => document.getElementById(id);
  const form = $('license-form'), input = $('license-name'), friends = $('license-friends');
  const flip = $('license-flip'), front = $('license-front'), back = $('license-back');
  const fctx = front.getContext('2d'), bctx = back.getContext('2d');
  const W = 1080, H = 1718, CROP_Y = 101;
  const imagePath = index => `assets/illustrations-3d/friend-${String(index+1).padStart(2,'0')}.png`;
  const images = new Map();
  let record = null, selected = 0, editing = true, isBack = false, ready = false, saving = false, renderVersion = 0;
  let frontImage, backImage, yaw=0, drag=null, ignoreClick=false;
  const status = message => { $('license-status').textContent = message; };
  const cleanName = str => [...String(str || '').replace(/[\u0000-\u001f\u007f]/g,'').trim()].slice(0,18).join('');
  const serial = value => Number(/^GTZ - (\d{4,})$/.exec(value || '')?.[1] || 0);
  const validRecord = value => value && value.version === 1 && cleanName(value.name) && Number.isInteger(value.character) && value.character >= 0 && value.character < names.length && (serial(value.number)>0 || /^GTZ-[A-Z2-9]{6}-[A-Z2-9]{6}$/.test(value.number)) && Number.isFinite(Date.parse(value.issuedAt));
  function restore() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || 'null');
      if(!validRecord(value)) return null;
      if(!serial(value.number)){value.number=number();localStorage.setItem(KEY,JSON.stringify(value));}
      return value;
    } catch { return null; }
  }
  function number() {
    const current=Number(localStorage.getItem(COUNTER)||0);
    const n=(Number.isSafeInteger(current)&&current>=0?current:0)+1;
    localStorage.setItem(COUNTER,String(n));
    return `GTZ - ${String(n).padStart(4,'0')}`;
  }
  const changed = () => window.dispatchEvent(new Event('gamttiz:license-change'));
  function image(url) {
    if (!images.has(url)) {
      images.set(url, new Promise((resolve, reject) => {
        const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error('이미지를 불러오지 못했습니다.')); img.src = url;
      }).catch(error => { images.delete(url); throw error; }));
    }
    return images.get(url);
  }
  function drawTemplate(ctx, img) {
    ctx.clearRect(0,0,W,H);
    ctx.drawImage(img,0,CROP_Y,W,H,0,0,W,H);
  }
  function drawValue(ctx, value, x, y, maxWidth, fontSize) {
    ctx.fillStyle = '#ffe09a'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    let size = fontSize;
    do { ctx.font = `600 ${size}px "Wanted Sans Variable", "Noto Sans CJK KR", "Noto Sans KR", "Malgun Gothic", Arial, sans-serif`; size--; } while (size > 20 && ctx.measureText(value).width > maxWidth);
    ctx.fillText(value,x,y,maxWidth);
  }
  async function render() {
    const seq = ++renderVersion;
    const name = editing ? cleanName(input.value) : record?.name || '';
    const member = record?.number || '발급 후 생성';
    const index = editing ? selected : record?.character ?? selected;
    if (!ready) return;
    try {
      const sprite = await image(imagePath(index));
      if (seq !== renderVersion) return;
      drawTemplate(bctx,backImage);
      const max = 376, scale = Math.min(max/sprite.naturalWidth,max/sprite.naturalHeight);
      const w = sprite.naturalWidth*scale, h = sprite.naturalHeight*scale;
      bctx.drawImage(sprite,540-w/2,704-CROP_Y-h/2,w,h);
      drawValue(bctx,name || '이름을 입력해주세요',950,1071-CROP_Y,633,46);
      drawValue(bctx,names[index],950,1233-CROP_Y,510,40);
      drawValue(bctx,member,950,1400-CROP_Y,530,34);
      $('license-card-details').textContent = `${name || '이름 미입력'}, ${names[index]}, ${member}`;
    } catch { if(seq === renderVersion) status('감띠 이미지를 불러오지 못했어요. 다시 시도해주세요.'); }
  }
  function setSide(value, target) {
    isBack = value; flip.classList.toggle('is-back',isBack);
    const half=Math.round(yaw/180);
    yaw=target ?? ((half%2!==0)===value?half*180:(half+1)*180);
    flip.style.setProperty('--yaw',yaw+'deg');flip.style.setProperty('--pitch','0deg');
    flip.setAttribute('aria-pressed',String(isBack));
    flip.setAttribute('aria-label',isBack?'카드 앞면 보기':'카드 뒷면 보기');
    $('license-turn').textContent = isBack?'↻ 앞면 보기':'↻ 뒷면 보기';
  }
  function setSelected(index) {
    selected = index; const radio = friends.querySelector(`input[value="${index}"]`); if(radio) radio.checked = true;
  }
  function viewEdit(value) {
    editing = value;
    form.hidden = !editing; $('license-actions').hidden = editing;
    $('license-badge').textContent = record && !editing ? 'MY LICENSE' : record ? 'EDIT PREVIEW' : 'PREVIEW';
    $('license-panel-kicker').textContent = editing ? 'CREATE MY LICENSE' : 'GAMTTIZ / MY LICENSE';
    $('license-panel-title').textContent = editing ? record?'라이센스 정보 수정':'나만의 라이센스 만들기' : '나의 감띠즈 라이센스';
    $('license-panel-description').textContent = editing ? '이름과 가장 좋아하는 감띠를 골라주세요. 뒷면에 실시간으로 반영돼요.' : '카드를 손으로 돌려 빛의 반사와 나의 정보를 확인하세요.';
    $('license-submit').textContent = record?'수정 내용 저장':'라이센스 카드 만들기';
    $('license-cancel').hidden = !record;
    if(record){ input.value=record.name; setSelected(record.character); $('license-owner').textContent=record.name; $('license-number').textContent=record.number; }
    $('license-submit').disabled = !ready || saving || !cleanName(input.value);
    return render();
  }
  names.forEach((name,index)=>{
    const label=document.createElement('label'); label.className='license-friend';
    const radio=document.createElement('input'); radio.type='radio'; radio.name='character'; radio.value=String(index); radio.setAttribute('aria-label',name); radio.checked=index===0;
    const img=document.createElement('img'); img.src=imagePath(index); img.alt=''; img.loading='lazy'; img.decoding='async';
    const text=document.createElement('span'); text.textContent=name;
    label.append(radio,img,text); friends.append(label);
    radio.addEventListener('change',()=>{setSelected(index);setSide(true);render();});
  });
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function light(e){
    const r=flip.getBoundingClientRect(),x=clamp((e.clientX-r.left)/r.width,0,1),y=clamp((e.clientY-r.top)/r.height,0,1);
    flip.style.setProperty('--light-x',(x*100)+'%');flip.style.setProperty('--light-y',(y*100)+'%');
    flip.style.setProperty('--foil',String(.45+Math.min(.45,Math.abs(x-.5)+Math.abs(y-.5))));
    return {x,y};
  }
  function resetLight(){flip.classList.remove('is-tracking','is-dragging');flip.style.setProperty('--foil','0');flip.style.setProperty('--pitch','0deg');flip.style.setProperty('--yaw',yaw+'deg');}
  flip.addEventListener('pointerdown',e=>{
    if(e.button!==0||drag)return;
    ignoreClick=false;drag={id:e.pointerId,x:e.clientX,y:e.clientY,yaw,moved:false};
    flip.setPointerCapture(e.pointerId);flip.classList.add('is-dragging');light(e);
  });
  flip.addEventListener('pointermove',e=>{
    if(drag&&drag.id!==e.pointerId)return;
    const {x,y}=light(e);
    if(drag){
      const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
      if(Math.hypot(dx,dy)>7)drag.moved=true;
      flip.style.setProperty('--yaw',(drag.yaw+dx*1.15)+'deg');
      flip.style.setProperty('--pitch',clamp(-dy*.55,-34,34)+'deg');
    }else if(e.pointerType==='mouse'||e.pointerType==='pen'){
      flip.classList.add('is-tracking');flip.style.setProperty('--yaw',(yaw+(x-.5)*36)+'deg');flip.style.setProperty('--pitch',((.5-y)*32)+'deg');
    }
  });
  function finishDrag(e,cancel=false){
    if(!drag||drag.id!==e.pointerId)return;
    const d=drag;drag=null;ignoreClick=d.moved||cancel;
    if(d.moved&&!cancel){const target=Math.round((d.yaw+(e.clientX-d.x)*1.15)/180)*180;setSide(Math.abs(target/180)%2===1,target);}
    resetLight();
    if(flip.hasPointerCapture(e.pointerId))flip.releasePointerCapture(e.pointerId);
  }
  flip.addEventListener('pointerup',e=>finishDrag(e));flip.addEventListener('pointercancel',e=>finishDrag(e,true));flip.addEventListener('lostpointercapture',e=>finishDrag(e,true));
  flip.addEventListener('pointerleave',()=>{if(!drag)resetLight();});
  flip.addEventListener('click',()=>{if(ignoreClick){ignoreClick=false;return;}setSide(!isBack);}); $('license-turn').addEventListener('click',()=>setSide(!isBack));
  input.addEventListener('input',()=>{$('license-submit').disabled=!ready||saving||!cleanName(input.value);setSide(true);render();});
  form.addEventListener('submit',async event=>{
    event.preventDefault(); if(!ready || saving) return;
    const name = cleanName(input.value); if(!name){status('이름을 입력해주세요.');input.focus();return;}
    saving=true; $('license-submit').disabled=true;
    try {
      await image(imagePath(selected));
      const old=record||restore();
      const next={version:1,name,character:selected,number:old?.number||number(),issuedAt:old?.issuedAt||new Date().toISOString()};
      localStorage.setItem(KEY,JSON.stringify(next));record=next;
      await viewEdit(false);setSide(!old?false:true);changed();
      if(!old){
        const overlay=$('license-issuing');overlay.hidden=false;
        await new Promise(resolve=>setTimeout(resolve,matchMedia('(prefers-reduced-motion: reduce)').matches?250:2350));
        overlay.hidden=true;$('license-celebration').hidden=false;
        status('라이센스카드가 발급되었습니다.');
        document.querySelector('.license-preview').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
      }else status('라이센스 정보가 수정되었어요.');
    }
    catch { status('저장하지 못했어요. 브라우저 저장 설정과 네트워크를 확인해주세요.');return; }
    finally {saving=false;$('license-submit').disabled=!ready||!cleanName(input.value);}
  });
  $('license-edit').addEventListener('click',()=>{viewEdit(true);setSide(true);status('');input.focus();});
  $('license-cancel').addEventListener('click',()=>{viewEdit(false);status('수정을 취소했어요.');});
  $('license-delete').addEventListener('click',()=>{
    if(!confirm('이 브라우저에 저장된 라이센스를 삭제할까요? 삭제하면 복구할 수 없어요.'))return;
    try {localStorage.removeItem(KEY);}catch{status('삭제하지 못했어요. 브라우저 저장 설정을 확인해주세요.');return;}
    record=null;input.value='';setSelected(0);$('license-celebration').hidden=true;viewEdit(true);setSide(false);status('라이센스를 삭제했어요.');changed();
  });
  // Single ZIP download avoids browsers blocking simultaneous downloads.
  function zip(files){
    const table=Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);return c>>>0;});
    const crc=bytes=>{let c=0xffffffff;for(const b of bytes)c=(c>>>8)^table[(c^b)&255];return (c^0xffffffff)>>>0;};
    const header=(length,fields)=>{const a=new Uint8Array(length),d=new DataView(a.buffer);for(const [offset,value,size] of fields){if(size===2)d.setUint16(offset,value,true);else d.setUint32(offset,value,true);}return a;};
    const parts=[],central=[];let pos=0,centralSize=0;
    for(const file of files){
      const name=new TextEncoder().encode(file.name),bytes=file.bytes,sum=crc(bytes),size=bytes.length;
      const l=header(30,[[0,0x04034b50,4],[4,20,2],[14,sum,4],[18,size,4],[22,size,4],[26,name.length,2]]);
      const c=header(46,[[0,0x02014b50,4],[4,20,2],[6,20,2],[16,sum,4],[20,size,4],[24,size,4],[28,name.length,2],[42,pos,4]]);
      parts.push(l,name,bytes);central.push(c,name);pos+=l.length+name.length+size;centralSize+=c.length+name.length;
    }
    const end=header(22,[[0,0x06054b50,4],[8,files.length,2],[10,files.length,2],[12,centralSize,4],[16,pos,4]]);
    return new Blob([...parts,...central,end],{type:'application/zip'});
  }
  async function download(){
    if(!record||editing||!ready||saving)return;
    const button=$('download-both');button.disabled=true;
    try {
      // Rendering has already completed on issuance; refresh before encoding.
      await render();
      const base='GAMTTIZ-'+record.number.replace(/\s/g,'');
      const files=[['front',front],['back',back]].map(([side,canvas])=>({name:base+'-'+side+'.png',bytes:Uint8Array.from(atob(canvas.toDataURL('image/png').split(',')[1]),c=>c.charCodeAt(0))}));
      const blob=zip(files),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download=base+'.zip';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
      status('앞면과 뒷면 PNG를 하나의 ZIP 파일로 저장했어요.');
    }catch{status('카드를 저장하지 못했어요. 다시 시도해주세요.');}
    finally{button.disabled=false;}
  }
  $('download-both').addEventListener('click',download);
  window.addEventListener('storage',event=>{if(event.key!==KEY)return;record=restore();if(!record){input.value='';setSelected(0);}viewEdit(!record);setSide(false);});
  record=restore(); viewEdit(!record);
  if(wallet&&!record){
    const preview=document.querySelector('.license-preview');preview.hidden=true;
    const empty=document.createElement('a');empty.className='license-wallet-empty';empty.href='license.html';empty.target='_top';empty.textContent='아직 발급된 카드가 없어요. 나만의 라이센스 만들기 ↗';document.querySelector('.license-layout').append(empty);
    return;
  }
  Promise.all([image('assets/license/front.png'),image('assets/license/back.png')]).then(async ([f,b])=>{
    frontImage=f;backImage=b; try{await document.fonts.load('600 46px "Wanted Sans Variable"');await document.fonts.ready;}catch{}
    drawTemplate(fctx,frontImage);drawTemplate(bctx,backImage);ready=true;viewEdit(!record);
  }).catch(()=>status('카드 이미지를 불러오지 못했어요. 잠시 후 다시 접속해주세요.'));
})();

