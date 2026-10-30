const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused=false;
function applyMotion(){
  motionPaused=reducedMotion.matches||document.hidden;
  document.body.classList.toggle('motion-off',motionPaused);
}
reducedMotion.addEventListener('change',applyMotion);
document.addEventListener('visibilitychange',applyMotion);applyMotion();
document.addEventListener('pointerdown',e=>{
  if(motionPaused||e.button!==0||!e.target.closest('button,.button,summary'))return;
  for(let n=0;n<5;n++){const spark=document.createElement('span');spark.className='click-spark';spark.setAttribute('aria-hidden','true');spark.style.left=e.clientX+'px';spark.style.top=e.clientY+'px';const angle=n*Math.PI*2/5;spark.style.setProperty('--dx',`${Math.cos(angle)*35}px`);spark.style.setProperty('--dy',`${Math.sin(angle)*35}px`);document.body.append(spark);spark.addEventListener('animationend',()=>spark.remove(),{once:true});setTimeout(()=>spark.remove(),900);}
});
const picked=[];
const picker=document.querySelector('#picker');const tray=document.querySelector('#tray');const status=document.querySelector('#tray-status');
function togglePick(index){
  const found=picked.indexOf(index);
  if(found>=0){picked.splice(found,1);status.textContent=`${products[index].name}를 트레이에서 꺼냈어요.`;}
  else if(picked.length<3){picked.push(index);status.textContent=picked.length===3?'나만의 감띠 조합 완성! 다른 친구로 바꿔볼 수도 있어요.':`${products[index].name}를 담았어요. ${3-picked.length}개 더 고를 수 있어요.`;}
  else{status.textContent='트레이가 가득 찼어요. 담긴 감띠를 먼저 꺼내주세요.';return;}
  renderTray();
}
function renderTray(){
  const slots=document.querySelector('#tray-slots');slots.replaceChildren();
  for(let i=0;i<3;i++){const slot=document.createElement('div');slot.className='tray-slot '+(picked[i]!==undefined?'filled':'empty');if(picked[i]!==undefined){const index=picked[i];const img=document.createElement('img');img.src=products[index].illustration;img.alt=products[index].name+' 원본 일러스트';const remove=document.createElement('button');remove.type='button';remove.textContent=products[index].name+' ×';remove.setAttribute('aria-label',products[index].name+' 트레이에서 빼기');remove.addEventListener('click',()=>togglePick(index));slot.append(img,remove);}else{const empty=document.createElement('span');empty.textContent='+';empty.setAttribute('aria-label',`빈 자리 ${i+1}`);slot.append(empty);}slots.append(slot);}
  renderNotes();
  document.querySelector('#tray-count').textContent=picked.length+' / 3';
  picker.querySelectorAll('button').forEach((button,i)=>button.setAttribute('aria-pressed',String(picked.includes(i))));
}
products.forEach((p,index)=>{
  const button=document.createElement('button');button.type='button';button.className='pick-card';button.setAttribute('aria-label',p.name+' 트레이 선택');button.setAttribute('aria-pressed','false');
  const img=document.createElement('img');img.src=p.illustration;img.alt='';img.loading='lazy';img.draggable=false;const name=document.createElement('span');name.textContent=p.name;button.append(img,name);picker.append(button);
  let start=null,dragging=false,label=null,suppressClick=false;
  button.addEventListener('click',()=>{if(suppressClick){suppressClick=false;return;}togglePick(index);});
  button.addEventListener('pointerdown',e=>{if(e.button!==0||e.pointerType==='touch')return;start={x:e.clientX,y:e.clientY,id:e.pointerId};suppressClick=false;button.setPointerCapture(e.pointerId);});
  button.addEventListener('pointermove',e=>{if(!start)return;if(!dragging&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>7){dragging=true;button.classList.add('is-dragging');label=document.createElement('span');label.className='drag-label';label.textContent=p.name;label.setAttribute('aria-hidden','true');document.body.append(label);}if(dragging){label.style.left=(e.clientX+15)+'px';label.style.top=(e.clientY+12)+'px';const r=tray.getBoundingClientRect();tray.classList.toggle('drop-ready',e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom);}});
  function clearDrag(){start=null;dragging=false;label?.remove();label=null;button.classList.remove('is-dragging');tray.classList.remove('drop-ready');}
  button.addEventListener('pointerup',e=>{if(!start)return;if(dragging){suppressClick=true;const r=tray.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom){if(!picked.includes(index))togglePick(index);else status.textContent='이미 트레이에 담긴 감띠예요.';}}clearDrag();});
  button.addEventListener('pointercancel',clearDrag);button.addEventListener('lostpointercapture',clearDrag);
});
document.querySelector('#clear-tray').addEventListener('click',()=>{picked.length=0;renderTray();status.textContent='트레이를 비웠어요. 새로운 조합을 만들어보세요.';});renderTray();
function renderNotes(){
  const container=document.querySelector('#story-notes');
  container.replaceChildren();
  if(!picked.length){
    const empty=document.createElement('p');empty.className='notes-empty';
    empty.textContent='아직 트레이가 비어 있어요. 위에서 마음에 드는 감띠를 담으면 이름과 이야기가 여기에 나타나요.';
    container.append(empty);return;
  }
  picked.forEach(index=>{
    const p=products[index];const card=document.createElement('article');card.className='note-card selected-note';
    const art=document.createElement('img');art.className='note-art';art.src=p.illustration;art.alt='';art.loading='lazy';
    const label=document.createElement('p');label.className='note-english';label.textContent=p.english;
    const name=document.createElement('h3');name.textContent=p.name;
    const description=document.createElement('p');description.textContent=p.description;
    const button=document.createElement('button');button.type='button';button.textContent=p.name+' 자세히 보기 ↗';button.addEventListener('click',()=>showDetail(index));
    card.append(art,label,name,description,button);container.append(card);
  });
}
