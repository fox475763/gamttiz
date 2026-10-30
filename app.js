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
].map(([name,english,description],i)=>({name,english,description,image:`assets/keyring-${String(i+1).padStart(2,'0')}.png`,illustration:`assets/illustrations/friend-${String(i+1).padStart(2,'0')}.svg`}));
const holder={name:'감띠즈 홀더',english:'GAMTTIZ HOLDER',description:'수집한 감띠즈 키링을 보관할 수 있는 보관통이자 직접 키링을 원하는 대로 걸 수 있는 키링입니다.',image:'assets/holder.png'};
// 원본 제품 설명을 바탕으로 쓴 사이트용 상상 이야기입니다.
const stories=[
  ['180°C에서 딱 알맞게 나온 감띠. 친구들이 늦잠을 자는 동안 혼자 먼저 바삭한 아침을 준비했대요.','“오늘도 기분 좋게 바삭!”'],
  ['조금 더 듬직한 뚱감띠는 좁은 자리에도 친구가 오면 꼭 한 칸을 내줘요. 마음만큼은 누구보다 넉넉하거든요.','“여기, 내 옆에 앉아!”'],
  ['케이준 시즈닝을 입은 케이준띠가 지나가면 공기까지 살짝 매콤해져요. 평범한 산책도 작은 모험으로 만드는 친구예요.','“오늘은 조금 맵게 놀아볼까?”'],
  ['200°C에 들어간 날, 탄감띠는 잠깐 깜짝 놀랐어요. 지금은 그날을 누구보다 씩씩하게 이야기하는 중이에요.','“앗, 뜨거! 그래도 나답지?”'],
  ['약속을 지키려고 조금 일찍 나온 덜감띠. 친구가 오기 전까지 기다리는 시간도 즐거운 추억으로 바꿔요.','“내가 먼저 와서 기다릴게!”'],
  ['케찹을 머리에 돌돌 바르고 나온 감띠는 거울 앞에서 한참을 보냈대요. 오늘의 포인트가 마음에 꼭 들었거든요.','“머리 어때? 꽤 멋지지?”'],
  ['꽁꽁 얼어 있던 빙빙이가 밖으로 나오자 세상이 반짝였어요. 따뜻한 친구들 옆에서 천천히 긴장을 풀고 있답니다.','“잠깐만, 아직 좀 차가워!”'],
  ['휜감띠는 길을 걷다가도 자꾸 엉뚱한 쪽으로 기울어요. 덕분에 친구들이 못 보던 풍경을 가장 먼저 발견해요.','“어? 이쪽에도 길이 있었네!”'],
  ['한 감자에서 나뉜 감감이와 띠띠는 서로의 말을 끝까지 듣지 않아도 알아요. 가끔은 같은 말을 동시에 해서 둘 다 깜짝 놀란답니다.','“나도 그 말 하려고 했어!”'],
  ['울룩불룩띠는 어디서든 한눈에 알아볼 수 있어요. 굴곡 하나하나에 하루 동안의 재미있는 이야기가 숨어 있대요.','“내 모양이 내 매력이야!”'],
  ['옆으로 누운 웨지감띠는 하늘 구경을 좋아해요. 친구들이 바쁠 때도 구름 하나를 발견하면 꼭 알려줘요.','“저 구름, 감자처럼 보이지 않아?”'],
  ['부스러끼가 안 보인다면 너무 걱정하지 마세요. 조용한 구석에서 용기를 모으고 있을지도 몰라요.','“나 여기 있어… 찾았어?”'],
  ['등을 딱 붙이고 사는 두리감띠는 서로 다른 방향을 바라봐요. 그래서 둘이 함께면 놓치는 장면이 없답니다.','“뒤쪽은 내가 볼게!”'],
  ['촉촉감띠는 느긋하게 움직이는 걸 좋아해요. 친구들이 서두를 때면 한 번 쉬어 가자고 이야기해요.','“조금 천천히 가도 괜찮아.”']
];
const gallery=document.querySelector('#gallery');
const dialog=document.querySelector('#detail');
let current=0;
products.forEach((p,i)=>{
  const card=document.createElement('button');card.type='button';card.className='card';card.setAttribute('aria-label',`${p.name} 상세 보기`);
  const img=document.createElement('img');img.src=p.image;img.alt=`${p.name} — ${p.description}`;img.width=1080;img.height=1350;img.loading='lazy';
  const label=document.createElement('span');label.className='card-label';
  const name=document.createElement('span');name.textContent=p.name;
  const arrow=document.createElement('b');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');
  label.append(name,arrow);card.append(img,label);card.addEventListener('click',()=>showDetail(i));gallery?.append(card);
});
function showDetail(index){
  current=index;const p=index===-1?holder:products[index];
  document.querySelector('#detail-image').src=p.image;
  document.querySelector('#detail-image').alt=`${p.name} 원본 제품 소개`;
  document.querySelector('#detail-title').textContent=p.name;
  document.querySelector('#detail-english').textContent=p.english;
  document.querySelector('#detail-description').textContent=p.description;
  const story=document.querySelector('#detail-story');story.hidden=index===-1;
  if(index!==-1){document.querySelector('#detail-story-text').textContent=stories[index][0];document.querySelector('#detail-quote').textContent=stories[index][1];}
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
document.querySelector('#random')?.addEventListener('click',()=>showDetail(Math.floor(Math.random()*14)));
document.querySelector('.holder-open')?.addEventListener('click',()=>showDetail(-1));
