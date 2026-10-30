// A playful match based on fry preferences, not a personality assessment.
const fryQuestions=[
  {title:'감자튀김이 나오면 소스는 어떻게 먹나요?',options:[
    ['먼저 아무것도 찍지 않고 감튀 맛부터 본다',{0:4,4:2,3:1}],
    ['케첩을 한 번에 듬뿍 찍는다',{5:5,13:2}],
    ['매콤한 시즈닝이나 색다른 맛을 찾는다',{2:5,9:2}],
    ['여러 소스를 주문해 친구와 바꿔 찍는다',{8:4,12:3,1:1}]
  ]},
  {title:'접시에서 제일 먼저 집는 한 조각은?',options:[
    ['길고 반듯한 한 조각',{0:2,2:2,4:2}],
    ['두툼하고 포슬포슬한 한 조각',{1:5,10:3,12:2}],
    ['끝까지 바삭한 조각이나 작은 부스러기',{11:5,3:3,9:4}],
    ['재미있게 휘어진 한 조각',{7:5,13:2,10:1}]
  ]},
  {title:'마지막 감튀 한 조각은 어떻게 하나요?',options:[
    ['가장 마음에 드는 걸 남겨뒀다가 천천히 먹는다',{4:4,10:3,7:2}],
    ['친구에게 양보하거나 반으로 나눈다',{8:4,12:4,1:2}],
    ['남은 소스까지 싹 묻혀서 먹는다',{5:3,13:4,2:2}],
    ['조금 식었어도 끝까지 맛있게 먹는다',{6:6,11:1,3:2}]
  ]},
  {title:'감튀를 주문할 때 굵기는 어떤 쪽이 좋나요?',options:[
    ['얇고 길어 바삭한 타입',{0:4,2:3,7:2}],['두툼해서 속이 포슬한 타입',{1:5,10:4}],['구불구불한 크링클 컷',{9:5,12:2}],['그날 기분 따라 매번 다르게',{8:4,13:3}]
  ]},
  {title:'받자마자 가장 먼저 확인하는 것은?',options:[
    ['갓 튀긴 뜨거운 온도',{0:4,3:3}],['소금이 얼마나 골고루 묻었는지',{2:4,4:3}],['봉지 바닥에 숨은 작은 조각',{11:5,6:2}],['친구와 나눠 먹기 좋은 양',{1:4,8:4}]
  ]},
  {title:'감튀가 조금 식었다면 어떻게 하나요?',options:[
    ['에어프라이어에 다시 바삭하게 데운다',{0:4,3:3}],['소스를 곁들여 그대로 즐긴다',{5:4,13:3}],['부드러워진 식감도 좋아한다',{4:4,13:4}],['친구와 수다 떨며 금세 먹는다',{8:5,12:3}]
  ]},
  {title:'케첩을 찍을 때 나만의 방식은?',options:[
    ['끝에 살짝만 찍는다',{0:3,4:4}],['감튀 위에 크게 한 바퀴 짜 넣는다',{5:6}],['찍지 않고 짭짤함을 즐긴다',{2:3,3:3}],['두 개를 겹쳐서 같이 찍는다',{8:5,12:3}]
  ]},
  {title:'감튀를 먹는 가장 좋은 순간은?',options:[
    ['상자를 열자마자 나는 따뜻한 향',{0:4,1:2}],['영화 보면서 한 조각씩',{4:3,7:3}],['친구들과 마지막 조각을 두고 웃을 때',{8:4,12:3}],['집에 와서 혼자 조용히 먹을 때',{11:4,13:3}]
  ]},
  {title:'봉지 바닥에 작은 부스러기가 남았다면?',options:[
    ['손끝으로 끝까지 찾아 먹는다',{11:6}],['소스에 모아 찍어 먹는다',{5:3,9:3}],['친구에게 건네준다',{8:4,12:3}],['괜히 귀여워서 잠깐 구경한다',{6:3,7:3}]
  ]},
  {title:'감튀의 소금 간은 어느 정도가 좋나요?',options:[
    ['소금 없이 감자 본연의 맛',{4:4,0:2}],['한 입마다 짭짤하게',{3:4,1:3}],['허브나 케이준 시즈닝이 좋다',{2:6}],['소금보단 소스가 더 중요하다',{5:5,13:2}]
  ]},
  {title:'튀김 봉지에서 집을 때 습관은?',options:[
    ['가장 길고 곧은 것부터 고른다',{0:4,2:3}],['휘어진 모양을 찾아본다',{7:6}],['두 개가 붙은 조각을 찾는다',{8:5,12:3}],['손에 잡히는 대로 먹는다',{1:3,9:3}]
  ]},
  {title:'감튀와 가장 잘 어울리는 음료는?',options:[
    ['탄산음료의 시원한 한 모금',{0:3,6:4}],['매콤한 맛을 식혀줄 차가운 음료',{2:4,5:2}],['따뜻한 커피와 느긋하게',{13:4,10:2}],['음료 없이 감튀에만 집중',{3:3,4:3}]
  ]},
  {title:'감튀를 나눠 먹을 때 나는?',options:[
    ['친구가 좋아하는 모양을 먼저 남겨둔다',{8:4,12:4}],['제일 바삭한 걸 같이 찾는다',{0:3,11:3}],['소스를 새로 조합해 보자고 한다',{2:3,5:4}],['내 몫을 천천히 아껴 먹는다',{4:3,13:4}]
  ]},
  {title:'감튀의 어느 부분이 제일 좋나요?',options:[
    ['끝까지 바삭한 가느다란 끝',{2:3,11:4}],['속이 부드러운 통통한 가운데',{1:5,10:2}],['살짝 진하게 익은 모서리',{3:5,9:2}],['구부러진 재미있는 실루엣',{7:4,13:3}]
  ]}
];
const quizRoot=document.querySelector('#quiz-root');
const quizAnswers=[];
const quizLength=3;
function chooseQuestions(){return [...fryQuestions].sort(()=>Math.random()-.5).slice(0,quizLength);}
let activeQuestions=chooseQuestions();
function quizElement(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
function renderQuiz(){
  quizRoot.replaceChildren();
  if(quizAnswers.length===quizLength){renderQuizResult();return;}
  const step=quizAnswers.length;const question=activeQuestions[step];
  const panel=quizElement('div','quiz-panel');
  const top=quizElement('div','quiz-top');top.append(quizElement('span','quiz-kicker',`QUESTION ${String(step+1).padStart(2,'0')}`),quizElement('span','quiz-count',`${step+1} / ${quizLength}`));
  const bar=quizElement('div','quiz-progress');bar.setAttribute('aria-hidden','true');bar.style.setProperty('--progress',`${(step+1)/quizLength*100}%`);
  const title=quizElement('h3','quiz-question',question.title);const options=quizElement('div','quiz-options');
  question.options.forEach(([label],choice)=>{const button=quizElement('button','quiz-option',label);button.type='button';button.addEventListener('click',()=>{quizAnswers.push(choice);renderQuiz();});options.append(button);});
  panel.append(top,bar,title,options);
  if(step){const back=quizElement('button','quiz-back','← 이전 질문');back.type='button';back.addEventListener('click',()=>{quizAnswers.pop();renderQuiz();});panel.append(back);}
  quizRoot.append(panel);
}
function matchFriend(){
  const scores=new Array(products.length).fill(0);
  quizAnswers.forEach((choice,step)=>{const weights=activeQuestions[step].options[choice][1];Object.entries(weights).forEach(([index,score])=>{scores[Number(index)]+=score;});});
  const best=Math.max(...scores);const ties=scores.map((score,index)=>score===best?index:-1).filter(index=>index>=0);
  return ties[(quizAnswers[0]*5+quizAnswers[1]*3+quizAnswers[2])%ties.length];
}
function renderQuizResult(){
  const index=matchFriend();const friend=products[index];
  const panel=quizElement('div','quiz-result');
  const art=quizElement('img','quiz-art');art.src=friend.illustration;art.alt=`${friend.name} 원본 일러스트`;art.loading='lazy';
  const copy=quizElement('div','quiz-result-copy');copy.append(quizElement('p','quiz-kicker','YOUR FRY FRIEND'),quizElement('h3','',friend.name),quizElement('p','quiz-english',friend.english),quizElement('p','quiz-story',stories[index][0]));
  const actions=quizElement('div','quiz-result-actions');const detail=quizElement('button','quiz-detail','이 친구 자세히 보기 ↗');detail.type='button';detail.addEventListener('click',()=>showDetail(index));const reset=quizElement('button','quiz-reset','다시 해보기 ↺');reset.type='button';reset.addEventListener('click',()=>{quizAnswers.length=0;activeQuestions=chooseQuestions();renderQuiz();});actions.append(detail,reset);copy.append(actions);
  panel.append(art,copy);quizRoot.append(panel);
}
renderQuiz();
