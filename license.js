(() => {
  'use strict';
  const KEY = 'gamttiz-my-license-v1';
  const COUNTER = 'gamttiz-license-local-sequence';
  const wallet = new URLSearchParams(location.search).get('wallet') === '1';
  if(wallet) document.body.classList.add('license-wallet-view','license-wallet-inactive');
  const names = ['감띠','뚱감띠','케이준띠','탄감띠','덜감띠','케찹 감띠','빙빙이','휜감띠','감감이와 띠띠','울룩불룩띠','웨지감띠','부스러끼','두리감띠','촉촉감띠'];
  const $ = id => document.getElementById(id);
  const form = $('license-form'), input = $('license-name'), friends = $('license-friends');
  const oathChecks = Array.from({length:5},(_,i)=>$('license-oath-'+(i+1)));
  const oathAll = $('license-oath-all');
  const flip = $('license-flip'), front = $('license-front'), back = $('license-back');
  const W = 1080, H = 1718, CROP_Y = 101;
  const mobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  // The preview is much smaller than the exported artwork. Keep its backing
  // textures light enough for mobile GPU rotations, while exports stay 1080×1718.
  const previewScale=mobile?Math.min(1,Math.max(480,Math.min(680,325*Math.min(window.devicePixelRatio||2,2)))/W):1;
  if(previewScale<1){
    for(const canvas of [front,back]){canvas.width=Math.round(W*previewScale);canvas.height=Math.round(H*previewScale);}
  }
  const fctx=front.getContext('2d'),bctx=back.getContext('2d');
  if(previewScale<1){for(const ctx of [fctx,bctx])ctx.setTransform(previewScale,0,0,previewScale,0,0);}
  const cardInner=flip.querySelector('.license-flip-inner');
  let backArt=$('license-back-art');
  const materials=new Map();
  let previewKey='',fontRevision=0;
  const glossFaces=[$('license-gloss-front'),$('license-gloss-back')];
  // Mobile WebKit can drop a canvas or backface in a preserve-3d stack.
  // Paint one image plane at a time, with the same perspective and drag motion.
  if(mobile)flip.classList.add('license-flat');
  if(wallet)window.addEventListener('message',e=>{
    if(e.source===parent&&e.origin===location.origin&&e.data?.type==='gamttiz-wallet-visibility'){
      document.body.classList.toggle('license-wallet-inactive',!e.data.active);
    }
  });
  document.addEventListener('visibilitychange',()=>document.body.classList.toggle('license-page-inactive',document.hidden));
  const imagePath = index => `assets/illustrations-3d/friend-${String(index+1).padStart(2,'0')}.png`;
  const images = new Map();
  let record = null, selected = 0, editing = true, isBack = false, ready = false, saving = false, renderVersion = 0;
  let frontImage, backImage, yaw=0, drag=null, ignoreClick=false, exportFiles=null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pose={yaw:0,pitch:0}, goal={...pose};
  let motionFrame=0,lastFrame=0;
  function paint(){
    let angle=pose.yaw;
    if(mobile){
      const half=Math.floor((angle+90)/180);
      flip.classList.toggle('is-paint-back',Math.abs(half%2)===1);
      angle-=half*180;
    }
    cardInner.style.transform=`rotateX(${pose.pitch.toFixed(3)}deg) rotateY(${angle.toFixed(3)}deg)`;
    // Light follows the eased orientation of the card rather than a cursor
    // hotspot. The reflection naturally settles back into the idle animation.
    const tilt=pose.yaw-Math.round(pose.yaw/180)*180;
    const dx=Math.sin(tilt*Math.PI/180),dy=Math.sin(pose.pitch*Math.PI/180);
    const intensity=Math.min(.82,.16+Math.abs(dx)*.59+Math.abs(dy)*1.15);
    flip.style.setProperty('--edge-x',`${(-dx*3.1).toFixed(2)}px`);
    flip.style.setProperty('--edge-y',`${(dy*2.6).toFixed(2)}px`);
    flip.style.setProperty('--rim-x',`${(-dx*1.25).toFixed(2)}px`);
    flip.style.setProperty('--rim-y',`${(dy*1.25).toFixed(2)}px`);
    flip.style.setProperty('--shadow-x',`${(-dx*19).toFixed(1)}px`);
    flip.style.setProperty('--shadow-scale',(1-Math.abs(dx)*.26).toFixed(3));
    const lightingActive=!!drag||Math.abs(pose.yaw-yaw)>.05||Math.abs(pose.pitch)>.05||Math.abs(tilt)>.05;
    // During the complete gesture and spring-back, hide and pause both idle
    // effects. Only angle-responsive reflections are visible until settled.
    flip.classList.toggle('is-motion-light',lightingActive);
    for(const layer of glossFaces){if(!layer)continue;
      // Move the gradient inside the stationary, full-size surface. A translated
      // rectangle can expose its edges when tilted (especially in Safari).
      layer.style.backgroundPosition=`${(50+dx*48).toFixed(2)}% ${(50-dy*83).toFixed(2)}%`;
      layer.style.animation=lightingActive?'none':'';
      layer.style.opacity=lightingActive?(reduced.matches?'0.000':intensity.toFixed(3)):'';
    }
  }
  function animate(time){
    const dt=lastFrame?Math.min(42,time-lastFrame):16.7;
    lastFrame=time;const weight=1-Math.exp(-dt/(drag?48:94));let moving=false;
    for(const key of Object.keys(goal)){
      const delta=goal[key]-pose[key],threshold=.05;
      if(Math.abs(delta)>threshold){pose[key]+=delta*weight;moving=true;}else pose[key]=goal[key];
    }
    paint();
    if(moving)motionFrame=requestAnimationFrame(animate);else{motionFrame=0;lastFrame=0;}
  }
  function moveTo(values){
    Object.assign(goal,values);
    if(drag||Math.abs(goal.yaw-pose.yaw)>.05||Math.abs(goal.pitch-pose.pitch)>.05)flip.classList.add('is-motion-light');
    if(reduced.matches){Object.assign(pose,goal);paint();return;}
    if(!motionFrame)motionFrame=requestAnimationFrame(animate);
  }
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
  function materialFor(ctx,img){
    const width=ctx.canvas.width,height=ctx.canvas.height,side=img===frontImage?'front':'back';
    const key=side+':'+width+'x'+height;
    if(!materials.has(key)){
      const isPreview=width===front.width&&height===front.height;
      materials.set(key,GTZLicenseMaterial.prepare(img,width,height,CROP_Y,W,H,isPreview));
    }
    return materials.get(key);
  }
  function drawTemplate(ctx,img){
    ctx.clearRect(0,0,W,H);
    try{ctx.drawImage(materialFor(ctx,img).art,0,0,W,H);}
    catch{ctx.drawImage(img,0,CROP_Y,W,H,0,0,W,H);}
  }
  function foilText(ctx,y,size){
    const gold=ctx.createLinearGradient(0,y-size,0,y+2);
    gold.addColorStop(0,'#fff1c4');gold.addColorStop(.28,'#dfbb79');
    gold.addColorStop(.53,'#b88846');gold.addColorStop(.8,'#e9c88b');gold.addColorStop(1,'#fff0bc');
    ctx.fillStyle=gold;
  }
  function drawValue(ctx, value, x, y, maxWidth, fontSize) {
    ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    let size = fontSize;
    do { ctx.font = `600 ${size}px "Wanted Sans Variable", "Noto Sans CJK KR", "Noto Sans KR", "Malgun Gothic", Arial, sans-serif`; size--; } while (size > 20 && ctx.measureText(value).width > maxWidth);
    foilText(ctx,y,size);ctx.fillText(value,x,y,maxWidth);
  }
  function prepareFoil(){
    for(const [ctx,img,layer] of [[fctx,frontImage,glossFaces[0]],[bctx,backImage,glossFaces[1]]]){
      try{
        const {mask}=materialFor(ctx,img);
        if(!mask||!layer)continue;
        const url='url("'+mask.toDataURL('image/png')+'")';
        layer.style.setProperty('--foil-mask',url);layer.classList.add('is-foil-ready');
        if(img===frontImage)document.querySelector('.license-forge-card')?.style.setProperty('--foil-mask',url);
      }catch{/* no unmasked shine if material preparation fails */}
    }
  }
  async function commitFront(){
    const original=document.querySelector('.license-front .license-art');
    if(!original)return;
    try{
      const data=front.toDataURL('image/png'),next=new Image();
      next.className='license-art license-art-composed';next.alt=original.alt;
      next.width=front.width;next.height=front.height;
      await new Promise((resolve,reject)=>{next.onload=resolve;next.onerror=reject;next.src=data;});
      if(typeof next.decode==='function'){try{await next.decode();}catch{}}
      original.replaceWith(next);
      const forge=document.querySelector('.license-forge-card');
      if(forge){forge.style.backgroundImage='url("'+data+'")';forge.style.backgroundSize='100% 100%';}
    }catch{/* original image remains a safe fallback */}
  }
  // QR Model 2, error correction M; encodes the public MY ID page only.
  // A local, precomputed matrix needs no external QR service or personal data.
  const qrMatrix=[
    '111111100101010011111011101111111',
    '100000100111011111000100001000001',
    '101110101001010011101101001011101',
    '101110101001101110001010101011101',
    '101110101111100101100111001011101',
    '100000101010100110101110101000001',
    '111111101010101010101010101111111',
    '000000001101101100100111000000000',
    '101111100100011101001001001111100',
    '011110011000000010011111101101101',
    '101100101100000110101110100010110',
    '001010011111001010000100011011100',
    '111101110111100000110010110111010',
    '111011000011111110001101101000011',
    '100100110110011000010010011001110',
    '111100010101110010011110011111100',
    '000111100011100001010000010111001',
    '001111001011011001111011101101111',
    '000110111111101111001110110110110',
    '101100011000110011111110110111100',
    '101110101010100010001011110111010',
    '110111000100011100100101001000001',
    '100110110001100111101010010100010',
    '100001000001110100100101101010100',
    '100011111000110101100000111110000',
    '000000001111001010111011100010111',
    '111111100110100110100111101010110',
    '100000101001101100011101100011110',
    '101110101011110000110100111111011',
    '101110101101000111001101010011011',
    '101110101010011001010001001101000',
    '100000100010101010111111011011100',
    '111111101111101001010001101100010',
  ];
  function drawQr(ctx){
    const module=6,quiet=4,x=704,y=1340,size=(qrMatrix.length+quiet*2)*module;
    ctx.fillStyle='#f5d578';ctx.fillRect(x,y,size,size);
    ctx.fillStyle='#780708';
    qrMatrix.forEach((row,j)=>{for(let i=0;i<row.length;i++){if(row[i]==='1')ctx.fillRect(x+(i+quiet)*module,y+(j+quiet)*module,module,module);}});
  }
  function issuedDate(value){
    if(!value)return '발급 후 표시';
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));
    return ['year','month','day'].map(type=>parts.find(p=>p.type===type).value).join('.');
  }
  function drawBack(ctx,sprite,name,member,index,issuedAt){
    drawTemplate(ctx,backImage);
    const max=376,scale=Math.min(max/sprite.naturalWidth,max/sprite.naturalHeight);
    const w=sprite.naturalWidth*scale,h=sprite.naturalHeight*scale;
    // Recessed velvet portrait well inside the original gilt profile frame.
    ctx.save();
    ctx.beginPath();ctx.rect(337,401,406,405);ctx.clip();
    const recess=ctx.createRadialGradient(493,509,15,540,603,292);
    recess.addColorStop(0,'#a13139');recess.addColorStop(.53,'#651018');recess.addColorStop(1,'#3d090e');
    ctx.fillStyle=recess;ctx.fillRect(337,401,406,405);
    const rim=ctx.createLinearGradient(337,401,741,805);
    rim.addColorStop(0,'#f4d7a2');rim.addColorStop(.33,'#a57336');rim.addColorStop(.69,'#f9dfad');rim.addColorStop(1,'#7d4b24');
    ctx.lineWidth=3;ctx.strokeStyle=rim;ctx.strokeRect(339,403,402,401);
    ctx.shadowColor='rgba(21,0,4,.65)';ctx.shadowBlur=18;ctx.shadowOffsetY=12;
    ctx.drawImage(sprite,540-w/2,704-CROP_Y-h/2,w,h);
    ctx.restore();
    drawValue(ctx,name||'이름을 입력해주세요',950,1071-CROP_Y,633,46);
    drawValue(ctx,names[index],950,1233-CROP_Y,510,40);
    drawValue(ctx,member,950,1400-CROP_Y,530,34);
    ctx.textAlign='left';ctx.textBaseline='alphabetic';
    ctx.font='42px Georgia, "Times New Roman", serif';foilText(ctx,1401,42);ctx.fillText('issued date.',129,1401);
    ctx.font='600 39px "Wanted Sans Variable", Arial, sans-serif';foilText(ctx,1460,39);ctx.fillText(issuedDate(issuedAt),129,1460,545);
    ctx.font='500 23px Arial, sans-serif';foilText(ctx,1547,23);ctx.fillText('SCAN TO OPEN MY ID',129,1547,545);
    drawQr(ctx);
  }
  function scheduleExport(seq,sprite,name,member,index,issuedAt){
    const task=async()=>{
      if(seq!==renderVersion||editing||!record||wallet)return;
      try{
        let exportFront=front,exportBack=back;
        if(previewScale<1){
          exportFront=document.createElement('canvas');exportBack=document.createElement('canvas');
          for(const canvas of [exportFront,exportBack]){canvas.width=W;canvas.height=H;}
          drawTemplate(exportFront.getContext('2d'),frontImage);
          drawBack(exportBack.getContext('2d'),sprite,name,member,index,issuedAt);
        }
        const base='GAMTTIZ-'+record.number.replace(/\s/g,'');
        const blobFor=canvas=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('PNG export failed')),'image/png'));
        const blobs=await Promise.all([blobFor(exportFront),blobFor(exportBack)]);
        if(seq!==renderVersion||editing||!record)return;
        exportFiles=blobs.map((blob,i)=>new File([blob],base+(i===0?'-front':'-back')+'.png',{type:'image/png'}));
        $('download-both').disabled=false;
      }catch{if(seq===renderVersion)status('카드 저장용 이미지를 준비하지 못했어요. 다시 접속해주세요.');}
    };
    if(typeof requestIdleCallback==='function')requestIdleCallback(task,{timeout:900});
    else setTimeout(task,80);
  }
  // Decode the replacement offscreen, then swap a fresh image plane. Safari
  // sometimes retains the previous raster when src changes inside a 3D layer.
  async function commitPreview(data,seq){
    if(!backArt)return;
    if(typeof backArt.replaceWith!=='function'){
      backArt.src=data;return;
    }
    const next=new Image();
    next.id='license-back-art';next.className='license-art license-art-composed';
    next.alt='라이센스 뒷면';next.width=back.width;next.height=back.height;
    await new Promise((resolve,reject)=>{
      next.onload=resolve;next.onerror=()=>reject(Error('Card preview decode failed'));
      next.src=data;
    });
    if(typeof next.decode==='function'){try{await next.decode();}catch{/* load already succeeded */}}
    if(seq!==renderVersion)return;
    backArt.replaceWith(next);backArt=next;
  }
  async function render() {
    const seq = ++renderVersion;
    exportFiles=null;$('download-both').disabled=true;
    const name = editing ? cleanName(input.value) : record?.name || '';
    const member = record?.number || '발급 후 생성';
    const index = editing ? selected : record?.character ?? selected;
    const issuedAt=record?.issuedAt;
    if (!ready) return;
    try {
      const sprite = await image(imagePath(index));
      if (seq !== renderVersion) return;
      $('license-card-details').textContent = `${name || '이름 미입력'}, ${names[index]}, ${member}, 발급일 ${issuedDate(issuedAt)}`;
      // The application no longer shows a live preview. Do not encode PNGs
      // for every typed letter or each profile swipe.
      if(editing)return;
      const key=JSON.stringify([name,member,index,issuedAt,fontRevision]);
      if(key!==previewKey){
        drawBack(bctx,sprite,name,member,index,issuedAt);
        await commitPreview(back.toDataURL('image/png'),seq);
        if(seq!==renderVersion)return;
        previewKey=key;
      }
      // Never encode full-size files during the forging/signing animation.
      if(!editing&&record&&!wallet&&$('license-issuing').hidden)scheduleExport(seq,sprite,name,member,index,issuedAt);
    } catch { if(seq === renderVersion) status('감띠 이미지를 불러오지 못했어요. 다시 시도해주세요.'); }
  }
  function setSide(value, target) {
    isBack = value; flip.classList.toggle('is-back',isBack);
    const half=Math.round(yaw/180);
    yaw=target ?? ((half%2!==0)===value?half*180:(half+1)*180);
    moveTo({yaw,pitch:0});
    flip.setAttribute('aria-pressed',String(isBack));
    flip.setAttribute('aria-label',isBack?'카드 앞면 보기':'카드 뒷면 보기');
    $('license-turn').textContent = isBack?'↻ 앞면 보기':'↻ 뒷면 보기';
  }
  function setSelected(index,scroll=true,smooth=false) {
    selected = Math.max(0,Math.min(names.length-1,index));
    const radio = friends.querySelector(`input[value="${selected}"]`); if(radio) radio.checked = true;
    $('license-profile-prev').disabled=selected===0;
    $('license-profile-next').disabled=selected===names.length-1;
    $('license-profile-count').textContent=`${String(selected+1).padStart(2,'0')} / ${names.length}`;
    if(scroll&&friends.clientWidth){
      const left=selected*friends.clientWidth;
      if(Math.abs(friends.scrollLeft-left)>1){
        if(friends.scrollTo)friends.scrollTo({left,behavior:smooth&&!reduced.matches?'smooth':'instant'});
        else friends.scrollLeft=left;
      }
    }
  }
  function chooseProfile(index,scroll=true,smooth=true){
    if(!editing||wallet||index<0||index>=names.length)return;
    const changed=index!==selected;
    setSelected(index,scroll,smooth);
    if(changed)render();
  }
  function viewEdit(value) {
    editing = value;
    document.body.classList.toggle('has-license',!!record&&!editing);
    $('license-heading-title').textContent=record&&!editing?'WELCOME':'MY ID';
    form.hidden = !editing; $('license-actions').hidden = editing;
    $('license-oath').hidden = !!record;
    oathChecks.forEach(check=>{check.disabled=!!record;});
    oathAll.disabled=!!record;syncOathAll();
    $('license-badge').textContent = record && !editing ? 'MY LICENSE' : record ? 'EDIT PREVIEW' : 'PREVIEW';
    $('license-panel-title').textContent = editing&&record?'라이센스 정보 수정':'라이센스 발급 신청서';
    $('license-submit').textContent = record?'수정 내용 저장':'라이센스 발급 신청';
    $('license-cancel').hidden = !record;
    const celebration=$('license-celebration');
    celebration.hidden=editing||!record||wallet;
    celebration.textContent=record?`이 브라우저에서 ${serial(record.number)}번째로 라이센스가 발급되었습니다!`:'';
    if(record){ input.value=record.name; setSelected(record.character); }else setSelected(selected);
    updateSubmit();
    return render();
  }
  function acceptedOath(){return !!record||oathChecks.every(check=>check.checked);}
  function updateSubmit(){$('license-submit').disabled=!ready||saving||!cleanName(input.value)||!acceptedOath();}
  function syncOathAll(){
    const count=oathChecks.filter(check=>check.checked).length;
    oathAll.checked=count===oathChecks.length;
    oathAll.indeterminate=count>0&&count<oathChecks.length;
    $('license-oath-count').textContent=count+' / '+oathChecks.length;
  }
  function resetOath(){oathChecks.forEach(check=>{check.checked=false;});syncOathAll();}
  if(!wallet)names.forEach((name,index)=>{
    const label=document.createElement('label'); label.className='license-friend';
    const radio=document.createElement('input'); radio.type='radio'; radio.name='character'; radio.value=String(index); radio.setAttribute('aria-label',name); radio.checked=index===0;
    const img=document.createElement('img'); img.src=imagePath(index); img.alt=''; img.loading='lazy'; img.decoding='async';
    const text=document.createElement('span'); text.textContent=name;
    label.append(radio,img,text); friends.append(label);
    radio.addEventListener('change',()=>chooseProfile(index));
  });
  if(!wallet){
    let scrollTimer;
    friends.addEventListener('scroll',()=>{
      clearTimeout(scrollTimer);
      scrollTimer=setTimeout(()=>{
        if(friends.clientWidth)chooseProfile(Math.round(friends.scrollLeft/friends.clientWidth),false);
      },110);
    },{passive:true});
    $('license-profile-prev').addEventListener('click',()=>chooseProfile(selected-1));
    $('license-profile-next').addEventListener('click',()=>chooseProfile(selected+1));
    friends.addEventListener('keydown',e=>{
      if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
        e.preventDefault();chooseProfile(selected+(e.key==='ArrowRight'?1:-1));
      }
    });
  }
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function pointerPosition(e){
    const r=flip.getBoundingClientRect(),x=clamp((e.clientX-r.left)/r.width,0,1),y=clamp((e.clientY-r.top)/r.height,0,1);
    return {x,y};
  }
  function resetPose(){flip.classList.remove('is-tracking','is-dragging');moveTo({pitch:0,yaw});}
  flip.addEventListener('pointerdown',e=>{
    if(e.button!==0||drag)return;
    ignoreClick=false;drag={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:pose.yaw,pitch:pose.pitch,moved:false};
    flip.setPointerCapture(e.pointerId);flip.classList.add('is-dragging','is-motion-light');
  });
  flip.addEventListener('pointermove',e=>{
    if(drag&&drag.id!==e.pointerId)return;
    if(drag){
      const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
      if(Math.hypot(dx,dy)>7)drag.moved=true;
      moveTo({yaw:drag.yaw+dx*1.12,pitch:clamp(drag.pitch-dy*.48,-33,33)});
    }else if(e.pointerType==='mouse'||e.pointerType==='pen'){
      const {x,y}=pointerPosition(e);
      flip.classList.add('is-tracking');moveTo({yaw:yaw+(x-.5)*30,pitch:(.5-y)*28});
    }
  });
  function finishDrag(e,cancel=false){
    if(!drag||drag.id!==e.pointerId)return;
    const d=drag;drag=null;ignoreClick=d.moved||cancel;
    if(d.moved&&!cancel){const target=Math.round((d.yaw+(e.clientX-d.x)*1.12)/180)*180;setSide(Math.abs(target/180)%2===1,target);}
    resetPose();
    if(flip.hasPointerCapture(e.pointerId))flip.releasePointerCapture(e.pointerId);
  }
  flip.addEventListener('pointerup',e=>finishDrag(e));flip.addEventListener('pointercancel',e=>finishDrag(e,true));flip.addEventListener('lostpointercapture',e=>finishDrag(e,true));
  flip.addEventListener('pointerleave',()=>{if(!drag)resetPose();});
  flip.addEventListener('click',e=>{if(ignoreClick&&e.detail!==0){ignoreClick=false;return;}ignoreClick=false;setSide(!isBack);}); $('license-turn').addEventListener('click',()=>setSide(!isBack));
  input.addEventListener('input',()=>{updateSubmit();render();});
  function oathChanged(){syncOathAll();updateSubmit();if(acceptedOath())status('');}
  oathChecks.forEach(check=>check.addEventListener('change',oathChanged));
  oathAll.addEventListener('change',()=>{oathChecks.forEach(check=>{check.checked=oathAll.checked;});oathChanged();});
  form.addEventListener('submit',async event=>{
    event.preventDefault(); if(!ready || saving) return;
    const name = cleanName(input.value); if(!name){status('이름을 입력해주세요.');input.focus();return;}
    if(!acceptedOath()){status('감자튀김 애호가 약관에 모두 동의해주세요.');oathChecks.find(check=>!check.checked)?.focus();return;}
    saving=true; $('license-submit').disabled=true;
    try {
      await image(imagePath(selected));
      const old=record||restore();
      const next={version:1,name,character:selected,number:old?.number||number(),issuedAt:old?.issuedAt||new Date().toISOString()};
      localStorage.setItem(KEY,JSON.stringify(next));record=next;
      let loading=null;
      const overlay=$('license-issuing');
      if(!old){
        overlay.classList.remove('is-signing');$('license-signature').setAttribute('aria-hidden','true');
        document.body.classList.add('license-animating');
        overlay.hidden=false;
        loading=new Promise(resolve=>setTimeout(resolve,reduced.matches?250:2350));
      }
      await viewEdit(false);setSide(!old?false:true);changed();
      if(!old){
        await loading;
        overlay.classList.add('is-signing');$('license-signature').setAttribute('aria-hidden','false');
        await new Promise(resolve=>setTimeout(resolve,reduced.matches?500:2650));
        // Finish the latest image decode before revealing the issued screen.
        await render();
        overlay.hidden=true;overlay.classList.remove('is-signing');$('license-signature').setAttribute('aria-hidden','true');$('license-celebration').hidden=false;
        document.body.classList.remove('license-animating');
        render();
        status('');
        if(typeof window.scrollTo==='function')window.scrollTo({top:0,behavior:'instant'});
        else document.querySelector('.license-heading').scrollIntoView({behavior:'auto',block:'start'});
      }else status('');
    }
    catch { document.body.classList.remove('license-animating');$('license-issuing').hidden=true;$('license-issuing').classList.remove('is-signing');$('license-signature').setAttribute('aria-hidden','true');status('저장하지 못했어요. 브라우저 저장 설정과 네트워크를 확인해주세요.');return; }
    finally {saving=false;updateSubmit();}
  });
  $('license-edit').addEventListener('click',()=>{viewEdit(true);setSide(true);status('');input.focus();});
  $('license-cancel').addEventListener('click',()=>{viewEdit(false);status('');});
  $('license-delete').addEventListener('click',()=>{
    if(!confirm('이 브라우저에 저장된 라이센스를 삭제할까요? 삭제하면 복구할 수 없어요.'))return;
    try {localStorage.removeItem(KEY);}catch{status('삭제하지 못했어요. 브라우저 저장 설정을 확인해주세요.');return;}
    record=null;input.value='';resetOath();setSelected(0);$('license-celebration').hidden=true;viewEdit(true);setSide(false);status('라이센스를 삭제했어요.');changed();
  });
  const saveDialog=$('license-save-dialog');
  let manualUrls=[];
  function clearManual(){manualUrls.forEach(url=>URL.revokeObjectURL(url));manualUrls=[];}
  function manualSave(files){
    if(!record||editing||files!==exportFiles)return;
    clearManual();
    files.forEach((file,i)=>{
      const side=i===0?'front':'back',url=URL.createObjectURL(file);
      manualUrls.push(url);$('license-save-'+side).src=url;
      const link=$('license-save-'+side+'-link');link.href=url;link.download=file.name;
    });
    $('license-save-help').textContent=mobile?'각 이미지를 길게 눌러 사진에 저장하세요.':'저장되지 않은 이미지를 선택하세요.';
    if(!saveDialog.open)saveDialog.showModal();
  }
  $('license-save-close').addEventListener('click',()=>saveDialog.close());
  saveDialog.addEventListener('close',clearManual);
  function download(){
    if(!record||editing||!ready||saving||!exportFiles)return;
    const files=exportFiles;status('');
    if(mobile){
      try{
        // Only file payloads: title/text may remove Save Images from the iOS sheet.
        if(navigator.share&&navigator.canShare&&navigator.canShare({files})){
          navigator.share({files}).catch(()=>manualSave(files));
          return;
        }
      }catch{}
      manualSave(files);return;
    }
    try{
      for(const file of files){
        const url=URL.createObjectURL(file),a=document.createElement('a');
        a.href=url;a.download=file.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
      }
      // A browser may block multiple automatic downloads; each individual PNG
      // remains available immediately in a simple recovery dialog.
      manualSave(files);
    }catch{manualSave(files);}
  }
  $('download-both').addEventListener('click',download);
  window.addEventListener('storage',event=>{if(event.key!==KEY)return;record=restore();if(!record){input.value='';resetOath();setSelected(0);}viewEdit(!record);setSide(false);});
  record=restore(); viewEdit(!record);
  if(wallet&&!record){
    const preview=document.querySelector('.license-preview');preview.hidden=true;
    const empty=document.createElement('a');empty.className='license-wallet-empty';empty.href='license.html';empty.target='_top';empty.textContent='아직 발급된 카드가 없어요. 나만의 라이센스 만들기 ↗';document.querySelector('.license-layout').append(empty);
    return;
  }
  Promise.all([image('assets/license/front.png'),image('assets/license/back.png')]).then(([f,b])=>{
    frontImage=f;backImage=b;
    drawTemplate(fctx,frontImage);drawTemplate(bctx,backImage);
    prepareFoil();commitFront();ready=true;viewEdit(!record);
    // Font fetching must never delay the artwork or prevent the card appearing.
    try{document.fonts.load('600 46px "Wanted Sans Variable"').then(()=>{fontRevision++;render();}).catch(()=>{});}catch{}
  }).catch(()=>status('카드 이미지를 불러오지 못했어요. 잠시 후 다시 접속해주세요.'));
})();





