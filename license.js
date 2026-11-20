(() => {
  'use strict';
  const KEY = 'gamttiz-my-license-v1';
  const names = ['감띠','뚱감띠','케이준띠','탄감띠','덜감띠','케찹 감띠','빙빙이','휜감띠','감감이와 띠띠','울룩불룩띠','웨지감띠','부스러끼','두리감띠','촉촉감띠'];
  const $ = id => document.getElementById(id);
  const form = $('license-form'), input = $('license-name'), friends = $('license-friends');
  const flip = $('license-flip'), front = $('license-front'), back = $('license-back');
  const fctx = front.getContext('2d'), bctx = back.getContext('2d');
  const W = 1080, H = 1718, CROP_Y = 101;
  const imagePath = index => `assets/illustrations-3d/friend-${String(index+1).padStart(2,'0')}.png`;
  const images = new Map();
  let record = null, selected = 0, editing = true, isBack = false, ready = false, saving = false, renderVersion = 0;
  let frontImage, backImage;
  const status = message => { $('license-status').textContent = message; };
  const cleanName = str => [...String(str || '').replace(/[\u0000-\u001f\u007f]/g,'').trim()].slice(0,18).join('');
  const validRecord = value => value && value.version === 1 && cleanName(value.name) && Number.isInteger(value.character) && value.character >= 0 && value.character < names.length && /^GTZ-[A-Z2-9]{6}-[A-Z2-9]{6}$/.test(value.number) && Number.isFinite(Date.parse(value.issuedAt));
  function restore() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || 'null');
      return validRecord(value) ? value : null;
    } catch { return null; }
  }
  function number() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const random = crypto.getRandomValues(new Uint8Array(12));
    const id = Array.from(random, n => alphabet[n & 31]).join('');
    return `GTZ-${id.slice(0,6)}-${id.slice(6)}`;
  }
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
  function setSide(value) {
    isBack = value; flip.classList.toggle('is-back',isBack);
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
    $('license-panel-description').textContent = editing ? '이름과 가장 좋아하는 감띠를 골라주세요. 뒷면에 실시간으로 반영돼요.' : '카드를 눌러 나의 정보가 담긴 뒷면을 확인하세요.';
    $('license-submit').textContent = record?'수정 내용 저장':'라이센스 발급받기';
    $('license-cancel').hidden = !record;
    if(record){ input.value=record.name; setSelected(record.character); $('license-owner').textContent=record.name; $('license-number').textContent=record.number; }
    $('license-submit').disabled = !ready || saving || !cleanName(input.value);
    render();
  }
  names.forEach((name,index)=>{
    const label=document.createElement('label'); label.className='license-friend';
    const radio=document.createElement('input'); radio.type='radio'; radio.name='character'; radio.value=String(index); radio.setAttribute('aria-label',name); radio.checked=index===0;
    const img=document.createElement('img'); img.src=imagePath(index); img.alt=''; img.loading='lazy'; img.decoding='async';
    const text=document.createElement('span'); text.textContent=name;
    label.append(radio,img,text); friends.append(label);
    radio.addEventListener('change',()=>{setSelected(index);setSide(true);render();});
  });
  flip.addEventListener('click',()=>setSide(!isBack)); $('license-turn').addEventListener('click',()=>setSide(!isBack));
  input.addEventListener('input',()=>{$('license-submit').disabled=!ready||saving||!cleanName(input.value);setSide(true);render();});
  form.addEventListener('submit',async event=>{
    event.preventDefault(); if(!ready || saving) return;
    const name = cleanName(input.value); if(!name){status('이름을 입력해주세요.');input.focus();return;}
    const old = record || restore();
    const next = {version:1,name,character:selected,number:old?.number||number(),issuedAt:old?.issuedAt||new Date().toISOString()};
    saving=true; $('license-submit').disabled=true;
    try { await image(imagePath(next.character)); localStorage.setItem(KEY,JSON.stringify(next)); }
    catch { status('저장하지 못했어요. 브라우저 저장 설정과 네트워크를 확인해주세요.');return; }
    finally {saving=false;$('license-submit').disabled=!ready||!cleanName(input.value);}
    record=next; viewEdit(false); setSide(true); status(old?'라이센스 정보가 수정되었어요.':'나만의 라이센스가 발급되었어요!');
  });
  $('license-edit').addEventListener('click',()=>{viewEdit(true);setSide(true);status('');input.focus();});
  $('license-cancel').addEventListener('click',()=>{viewEdit(false);status('수정을 취소했어요.');});
  $('license-delete').addEventListener('click',()=>{
    if(!confirm('이 브라우저에 저장된 라이센스를 삭제할까요? 삭제하면 복구할 수 없어요.'))return;
    try {localStorage.removeItem(KEY);}catch{status('삭제하지 못했어요. 브라우저 저장 설정을 확인해주세요.');return;}
    record=null;input.value='';setSelected(0);viewEdit(true);setSide(false);status('라이센스를 삭제했어요.');
  });
  async function download(side) {
    if(!record||editing||!ready)return;
    if(side==='back') await render();
    const canvas=side==='front'?front:back;
    canvas.toBlob(blob=>{
      if(!blob){status('이미지를 저장할 수 없어요.');return;}
      const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`GAMTTIZ-${record.number}-${side}.png`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
      status('PNG 저장을 시작했어요.');
    },'image/png');
  }
  $('download-front').addEventListener('click',()=>download('front')); $('download-back').addEventListener('click',()=>download('back'));
  window.addEventListener('storage',event=>{if(event.key!==KEY)return;record=restore();if(!record){input.value='';setSelected(0);}viewEdit(!record);setSide(false);});
  record=restore(); viewEdit(!record);
  Promise.all([image('assets/license/front.png'),image('assets/license/back.png')]).then(async ([f,b])=>{
    frontImage=f;backImage=b; try{await document.fonts.load('600 46px "Wanted Sans Variable"');await document.fonts.ready;}catch{}
    drawTemplate(fctx,frontImage);drawTemplate(bctx,backImage);ready=true;viewEdit(!record);
  }).catch(()=>status('카드 이미지를 불러오지 못했어요. 잠시 후 다시 접속해주세요.'));
})();
