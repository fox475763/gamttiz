const products = [
  ['감띠 키링','Gamtti','180°C 기름에서 깔끔하게 튀겨진 감자튀김'],
  ['뚱감띠','Ttung Gamtti','기존 감띠보다 조금 더 듬직한 모습의 감자튀김'],
  ['케이준띠','Cajuntti','케이준 시즈닝을 입고 있는 기다란 감자튀김'],
  ['탄감띠','Tan Gamtti','실수로 200°C 기름에 들어간 감자튀김'],
  ['덜감띠','Deol Gamtti','약속이 있어서 조금 일찍 밖으로 나온 감자튀김'],
  ['(케찹 발린) 감띠','Ketchup Gamtti','머리에 케찹을 돌돌 바른 조금 특별한 감자튀김'],
  ['빙빙이','BingBingi','꽁꽁냉동실에서 이제 막 나온 감자튀김'],
  ['휜감띠','Hwin Gamtti','그냥 휘었다.'],
  ['감감이와 띠띠','GamGami & TtiTti','한 감자에서 나뉜 쌍둥이 남매 감자튀김'],
  ['울룩불룩띠','Ulluk Bulluk tti','형태가 아주 그냥 울룩이불룩이한 감자튀김'],
  ['웨지감띠','Weji Gamtti','조각 사과처럼 옆으로 누운 감자튀김'],
  ['부스러끼','Bueureokki','겁이 많아서 어딘가에 숨어있는 감자튀김'],
  ['두리감띠','Duri Gamtti','서로 등 부분이 딱 붙어사는 감자튀김'],
  ['촉촉감띠','Chokchok Gamtti','기름이 흥건해 촉촉흐물흐물한 감자튀김']
].map(([name,english,description],i)=>({name,english,description,image:`assets/keyring-${String(i+1).padStart(2,'0')}.png`}));
const holder={name:'감띠즈 홀더',english:'GAMTTIZ HOLDER',description:'수집한 감띠즈 키링을 보관할 수 있는 보관통이자 직접 키링을 원하는 대로 걸 수 있는 키링입니다.',image:'assets/holder.png'};
const gallery=document.querySelector('#gallery');
const dialog=document.querySelector('#detail');
let current=0;
products.forEach((p,i)=>{
  const card=document.createElement('button');card.type='button';card.className='card';card.setAttribute('aria-label',`${p.name} 상세 보기`);
  const img=document.createElement('img');img.src=p.image;img.alt=`${p.name} — ${p.description}`;img.width=1080;img.height=1350;img.loading='lazy';
  const label=document.createElement('span');label.className='card-label';
  const name=document.createElement('span');name.textContent=p.name;
  const arrow=document.createElement('b');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');
  label.append(name,arrow);card.append(img,label);card.addEventListener('click',()=>showDetail(i));gallery.append(card);
});
function showDetail(index){
  current=index;const p=index===-1?holder:products[index];
  document.querySelector('#detail-image').src=p.image;
  document.querySelector('#detail-image').alt=`${p.name} 원본 제품 소개`;
  document.querySelector('#detail-title').textContent=p.name;
  document.querySelector('#detail-english').textContent=p.english;
  document.querySelector('#detail-description').textContent=p.description;
  document.querySelector('#detail-count').textContent=index===-1?'GAMTTIZ HOLDER':`${String(index+1).padStart(2,'0')} / 14`;
  document.querySelector('#original').href=p.image;
  document.querySelector('.dialog-nav').hidden=index===-1;
  document.querySelector('.dialog-nav').style.display=index===-1?'none':'flex';
  if(!dialog.open)dialog.showModal();dialog.scrollTop=0;
}
document.querySelector('#close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
document.querySelector('#previous').addEventListener('click',()=>showDetail((current+13)%14));
document.querySelector('#next').addEventListener('click',()=>showDetail((current+1)%14));
dialog.addEventListener('keydown',e=>{if(current<0)return;if(e.key==='ArrowRight'){e.preventDefault();showDetail((current+1)%14);}if(e.key==='ArrowLeft'){e.preventDefault();showDetail((current+13)%14);}});
document.querySelector('#random').addEventListener('click',()=>showDetail(Math.floor(Math.random()*14)));
document.querySelector('.holder-open').addEventListener('click',()=>showDetail(-1));
