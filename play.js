const picked=[];
const picker=document.querySelector('#picker');
const tray=document.querySelector('#tray');
const status=document.querySelector('#tray-status');
const friendLayer=document.querySelector('#combo-friends');
const nameLayer=document.querySelector('#combo-names');
const downloadButton=document.querySelector('#download-combo');
const maxFriends=5;
function togglePick(index){
  const found=picked.indexOf(index);
  if(found>=0){picked.splice(found,1);status.textContent=products[index].name+'를 홀더에서 꺼냈어요.';}
  else if(picked.length<maxFriends){picked.push(index);status.textContent=picked.length===maxFriends?'다섯 감띠가 모두 모였어요. PNG로 저장해보세요.':'홀더에 '+products[index].name+' 담았어요. '+(maxFriends-picked.length)+'명 더 고를 수 있어요.';}
  else{status.textContent='홀더가 가득 찼어요. 담긴 감띠를 먼저 꺼내주세요.';return;}
  renderTray();
}
function positions(count){return Array.from({length:count},(_,i)=>50+(i-(count-1)/2)*(count===1?0:count===2?30:count===3?25:count===4?20:17));}
function renderTray(){
  friendLayer.replaceChildren();nameLayer.replaceChildren();
  const points=positions(picked.length);
  picked.forEach((index,i)=>{
    const art=document.createElement('img');art.className='combo-friend';art.src=products[index].illustration;art.alt='';art.draggable=false;art.style.left=(50+(points[i]-50)*.5)+'%';art.style.zIndex=String(i+1);friendLayer.append(art);
    const chip=document.createElement('button');chip.type='button';chip.textContent=products[index].name+' ×';chip.setAttribute('aria-label',products[index].name+' 홀더에서 빼기');chip.addEventListener('click',()=>togglePick(index));nameLayer.append(chip);
  });
  tray.setAttribute('aria-label',picked.length?'빨간 홀더에 '+picked.map(i=>products[i].name).join(', ')+' 담긴 모습':'비어 있는 빨간 감띠즈 홀더');
  document.querySelector('#tray-count').textContent=picked.length+' / '+maxFriends;
  downloadButton.disabled=picked.length===0;
  picker.querySelectorAll('button').forEach((button,i)=>button.setAttribute('aria-pressed',String(picked.includes(i))));
  renderNotes();
}
products.forEach((p,index)=>{
  const button=document.createElement('button');button.type='button';button.className='pick-card';button.setAttribute('aria-label',p.name+' 홀더 선택');button.setAttribute('aria-pressed','false');
  const img=document.createElement('img');img.src=p.illustration;img.alt='';img.loading='lazy';img.draggable=false;
  const name=document.createElement('span');name.textContent=p.name;button.append(img,name);picker.append(button);
  let start=null,dragging=false,label=null,suppressClick=false;
  button.addEventListener('click',()=>{if(suppressClick){suppressClick=false;return;}togglePick(index);});
  button.addEventListener('pointerdown',e=>{if(e.button!==0||e.pointerType==='touch')return;start={x:e.clientX,y:e.clientY};suppressClick=false;button.setPointerCapture(e.pointerId);});
  button.addEventListener('pointermove',e=>{if(!start)return;if(!dragging&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>7){dragging=true;button.classList.add('is-dragging');label=document.createElement('span');label.className='drag-label';label.textContent=p.name;label.setAttribute('aria-hidden','true');document.body.append(label);}if(dragging){label.style.left=(e.clientX+15)+'px';label.style.top=(e.clientY+12)+'px';const r=tray.getBoundingClientRect();tray.classList.toggle('drop-ready',e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom);}});
  function clearDrag(){start=null;dragging=false;label?.remove();label=null;button.classList.remove('is-dragging');tray.classList.remove('drop-ready');}
  button.addEventListener('pointerup',e=>{if(!start)return;if(dragging){suppressClick=true;const r=tray.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom){if(!picked.includes(index))togglePick(index);else status.textContent='이미 홀더에 담긴 감띠예요.';}}clearDrag();});
  button.addEventListener('pointercancel',clearDrag);button.addEventListener('lostpointercapture',clearDrag);
});
document.querySelector('#clear-tray').addEventListener('click',()=>{picked.length=0;renderTray();status.textContent='홀더를 비웠어요. 새로운 조합을 만들어보세요.';});
function renderNotes(){
  const container=document.querySelector('#story-notes');container.replaceChildren();
  if(!picked.length){const empty=document.createElement('p');empty.className='notes-empty';empty.textContent='아직 홀더가 비어 있어요. 위에서 마음에 드는 감띠를 담으면 이름과 이야기가 여기에 나타나요.';container.append(empty);return;}
  picked.forEach(index=>{
    const p=products[index],card=document.createElement('article');card.className='note-card selected-note';
    const art=document.createElement('img');art.className='note-art';art.src=p.illustration;art.alt='';art.loading='lazy';
    const label=document.createElement('p');label.className='note-english';label.textContent=p.english;
    const name=document.createElement('h3');name.textContent=p.name;
    const description=document.createElement('p');description.textContent=p.description;
    const button=document.createElement('button');button.type='button';button.textContent=p.name+' 자세히 보기 ↗';button.addEventListener('click',()=>showDetail(index));
    card.append(art,label,name,description,button);container.append(card);
  });
}
function roundedRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function drawHolderShape(ctx){
  ctx.beginPath();ctx.moveTo(180,520);ctx.bezierCurveTo(185,445,250,423,300,420);ctx.bezierCurveTo(400,290,495,220,600,220);ctx.bezierCurveTo(705,220,800,290,900,420);ctx.bezierCurveTo(950,423,1015,445,1020,520);ctx.lineTo(1000,1215);ctx.quadraticCurveTo(997,1310,900,1310);ctx.lineTo(300,1310);ctx.quadraticCurveTo(203,1310,200,1215);ctx.closePath();
}
function drawFront(ctx){
  ctx.beginPath();ctx.moveTo(202,760);ctx.quadraticCurveTo(600,720,998,760);ctx.lineTo(986,1210);ctx.quadraticCurveTo(984,1285,902,1285);ctx.lineTo(298,1285);ctx.quadraticCurveTo(216,1285,214,1210);ctx.closePath();
}
function loadArt(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});}
async function saveCombo(){
  if(!picked.length)return;
  downloadButton.disabled=true;downloadButton.textContent='이미지 만드는 중…';
  try{
    await document.fonts.ready;
    const [holder,...arts]=await Promise.all([loadArt('assets/holder-fbx-render.png'),...picked.map(i=>loadArt(products[i].illustration))]);
    const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1450;const ctx=canvas.getContext('2d');
    const backdrop=ctx.createLinearGradient(0,0,1200,1450);backdrop.addColorStop(0,'#fffaf0');backdrop.addColorStop(1,'#ffe9bf');ctx.fillStyle=backdrop;ctx.fillRect(0,0,1200,1450);
    ctx.fillStyle='#bd2d27';ctx.font='700 39px GamttizEN,sans-serif';ctx.fillText('GAMTTIZ / MY HOLDER',88,110);ctx.font='600 24px GamttizEN,sans-serif';ctx.fillText(picked.length+' / 5 FRIENDS',890,110);
    const x=90,y=180,w=1020,h=1020;
    ctx.fillStyle='#f9ebcb';ctx.beginPath();ctx.roundRect(58,150,1084,1090,35);ctx.fill();
    ctx.save();ctx.fillStyle='#63221133';ctx.beginPath();ctx.ellipse(600,1170,380,50,0,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.save();ctx.shadowColor='#5c191840';ctx.shadowBlur=28;ctx.shadowOffsetY=15;ctx.drawImage(holder,x,y,w,h);ctx.restore();
    const points=positions(arts.length);
    arts.forEach((img,i)=>{
      const maxW=arts.length===1?230:arts.length===2?195:150,maxH=arts.length===1?570:arts.length===2?545:500;
      const scale=Math.min(maxW/img.naturalWidth,maxH/img.naturalHeight),aw=img.naturalWidth*scale,ah=img.naturalHeight*scale;
      const center=x+w*(50+(points[i]-50)*.5)/100;
      ctx.save();ctx.shadowColor='#51200980';ctx.shadowBlur=12;ctx.shadowOffsetX=5;ctx.shadowOffsetY=10;ctx.drawImage(img,center-aw/2,855-ah,aw,ah);ctx.restore();
    });
    ctx.save();ctx.beginPath();const line=[[0,1],[0,.44],[.2,.44],[.25,.42],[.33,.44],[.42,.46],[.5,.47],[.58,.46],[.67,.44],[.75,.42],[.8,.44],[1,.44],[1,1]];line.forEach(([px,py],i)=>i?ctx.lineTo(x+px*w,y+py*h):ctx.moveTo(x+px*w,y+py*h));ctx.closePath();ctx.clip();ctx.drawImage(holder,x,y,w,h);ctx.restore();
    ctx.fillStyle='#8d3928';ctx.font='700 24px "Wanted Sans Variable",sans-serif';ctx.fillText('나의 감띠 친구들',90,1303);ctx.font='500 23px "Wanted Sans Variable",sans-serif';ctx.fillText(picked.map(i=>products[i].name).join('  ·  '),90,1351,1000);
    ctx.fillStyle='#b62924';ctx.font='700 19px GamttizEN,sans-serif';ctx.fillText('FRENCH FRY LOVERS',90,1410);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG 생성 실패');
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='gamttiz-my-holder.png';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);status.textContent='3D 모델 홀더 PNG 이미지를 저장했어요.';
  }catch(error){status.textContent='이미지를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.';console.error(error);}
  finally{downloadButton.disabled=picked.length===0;downloadButton.textContent='내 감띠 홀더 PNG 저장 ↓';}
}downloadButton.addEventListener('click',saveCombo);
renderTray();

