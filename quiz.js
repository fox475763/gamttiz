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
  ]},
  {title:'갓 나온 감튀가 너무 뜨거울 때는?',options:[
    ['후후 불어 바로 한 입',{0:5,2:2}],['조금 식혀 속까지 맛본다',{4:5,10:2}],['친구에게 먼저 먹어 보라고 한다',{8:5,12:2}],['소스에 찍어 온도부터 낮춘다',{5:5,13:2}]
  ]},
  {title:'포장 감튀를 집에 가져오면 가장 신경 쓰이는 것은?',options:[
    ['봉지 안 수증기 때문에 눅눅해질까 봐',{6:5,13:3}],['따뜻한 온기가 남아 있을까 봐',{4:4,1:3}],['소스가 새지 않았을까 봐',{5:5,11:2}],['친구 몫이 충분할까 봐',{8:5,12:3}]
  ]},
  {title:'감튀를 먹기 전 소금이 한쪽에 몰려 있다면?',options:[
    ['봉지를 흔들어 고르게 섞는다',{0:5,2:2}],['짭짤한 조각부터 골라 먹는다',{3:5,9:2}],['소금 적은 쪽이 오히려 좋다',{4:5,10:2}],['친구와 각자 취향대로 나눈다',{8:5,12:2}]
  ]},
  {title:'어떤 감튀 식감에 손이 계속 가나요?',options:[
    ['깨질 듯 바삭한 얇은 감튀',{0:4,11:4}],['두껍고 속이 폭신한 감튀',{1:5,10:4}],['겉은 바삭하고 가운데는 쫀득한 감튀',{9:5,12:2}],['조금 부드럽고 촉촉해진 감튀',{13:6,6:2}]
  ]},
  {title:'접시에서 유난히 휘어진 감튀를 발견하면?',options:[
    ['제일 먼저 집어 모양을 감상한다',{7:6,13:2}],['소스가 잘 묻을 것 같아 찍는다',{5:4,9:3}],['친구에게 보여주며 웃는다',{8:5,12:3}],['반듯한 조각을 먼저 고른다',{0:5,2:2}]
  ]},
  {title:'감튀 두 개가 붙어서 나왔다면?',options:[
    ['붙은 채로 한 입에 먹는다',{12:6,8:3}],['반으로 나눠 친구와 먹는다',{8:6,12:2}],['하나씩 떼어 바삭함을 본다',{0:4,11:3}],['특이한 모양이라 마지막까지 남긴다',{7:4,10:2}]
  ]},
  {title:'시즈닝 감튀를 먹는다면 어떤 방식이 좋아요?',options:[
    ['양념을 흔들어 골고루 묻힌다',{2:6,0:2}],['가루가 많이 묻은 조각을 찾는다',{2:5,3:3}],['기본 감튀와 번갈아 먹는다',{4:4,8:3}],['다 먹고 남은 가루까지 찍어 먹는다',{11:4,5:3}]
  ]},
  {title:'감튀 한 상자를 먹을 때 순서는?',options:[
    ['길고 예쁜 조각부터',{0:5,7:2}],['작은 조각부터 모아 먹기',{11:5,6:2}],['두툼한 조각을 아껴 두기',{1:5,10:3}],['친구와 고르면서 섞어 먹기',{8:5,12:3}]
  ]},
  {title:'감튀 옆에 소스가 딱 하나만 있다면?',options:[
    ['케첩을 고른다',{5:6,0:2}],['매콤한 소스를 고른다',{2:6,3:2}],['크리미한 소스를 고른다',{1:4,13:4}],['소스 없이 먹는다',{4:5,11:2}]
  ]},
  {title:'감튀를 집었는데 끝이 살짝 탔다면?',options:[
    ['고소해서 오히려 반갑다',{3:7}],['탄 부분만 떼고 먹는다',{0:4,4:3}],['친구에게 이 모양을 보여준다',{8:4,7:3}],['소스를 찍어 색다르게 먹는다',{5:4,2:2}]
  ]},
  {title:'남은 감튀를 다시 데울 때 가장 원하는 것은?',options:[
    ['처음처럼 바삭한 겉면',{0:5,11:3}],['속의 포슬한 온기',{1:5,10:3}],['살짝 눅눅해도 촉촉한 맛',{13:6,6:3}],['진해진 갈색 모서리',{3:5,9:2}]
  ]},
  {title:'감튀 상자 맨 아래에서 발견하면 반가운 것은?',options:[
    ['짧고 바삭한 부스러기',{11:7}],['소금이 많이 묻은 조각',{3:4,2:3}],['두 조각이 붙은 감튀',{12:5,8:3}],['소스가 묻어 촉촉해진 한 조각',{13:5,5:3}]
  ]},
  {title:'웨지 감튀가 나오면 어떻게 먹고 싶나요?',options:[
    ['두툼한 속을 먼저 맛본다',{10:7,1:2}],['껍질 부분의 고소함을 즐긴다',{10:5,3:3}],['소스에 넓게 찍어 먹는다',{5:4,10:3}],['친구와 반씩 나눈다',{8:4,12:3}]
  ]},
  {title:'감튀를 들고 걷다가 조금 휘어졌다면?',options:[
    ['모양이 더 재미있어졌다',{7:7}],['바로 먹어 바삭함을 지킨다',{0:4,11:3}],['친구에게 보여주며 사진을 찍는다',{8:4,12:3}],['느긋하게 한 입씩 먹는다',{13:5,4:2}]
  ]},
  {title:'감튀를 친구와 먹을 때 소스 접시는?',options:[
    ['각자 하나씩 쓰는 편이 편하다',{0:4,4:3}],['가운데 두고 함께 찍는다',{8:6,12:3}],['여러 맛을 늘어놓고 비교한다',{2:4,5:4}],['남은 소스는 감튀 끝으로 싹 닦는다',{11:4,13:3}]
  ]},
  {title:'감튀가 한 조각만 남으면 제일 먼저 드는 생각은?',options:[
    ['가장 바삭할 때 먹을걸',{0:4,11:3}],['반으로 나눌 수 있을까',{8:5,12:4}],['소스를 넉넉히 묻혀 마무리하자',{5:5,2:2}],['모양이 특별하니 천천히 보자',{7:4,10:3}]
  ]}
];
const fryProfiles=[
  {type:'갓 튀긴 정석파',traits:['바삭함에 진심','첫입을 중요하게 생각함','기본의 매력을 발견함'],similar:'감띠는 갓 튀긴 한 조각의 온도와 바삭함을 놓치지 않아요. 당신도 감튀를 먹을 때 가장 기본적인 맛부터 살피는 편이에요.',habit:'소스 없이 첫입을 먹고, 겉면의 바삭함과 속의 온도를 차례로 느껴요.',shine:'익숙한 맛에서도 작은 차이를 찾는 관찰력이 있어요.',pair:4,pairWhy:'덜감띠와 함께라면 빠른 첫입과 느긋한 두 번째 한입이 균형을 이뤄요.',helper:13,helperWhy:'촉촉감띠는 조금 식은 감튀도 괜찮다며 여유를 더해줘요.'},
  {type:'포슬포슬 든든파',traits:['두툼한 식감 선호','넉넉한 한입','함께 먹는 즐거움'],similar:'뚱감띠는 겉보다 속의 포슬한 맛이 먼저 기억에 남아요. 당신도 작은 조각보다 든든한 한입에서 만족을 찾는 편이에요.',habit:'두꺼운 감튀를 골라 반으로 베어 물고 속의 따뜻함을 확인해요.',shine:'한 상자를 여럿이 나눌 때 넉넉하고 편안한 분위기를 만들어요.',pair:10,pairWhy:'웨지감띠와는 두툼한 감자의 식감을 끝까지 즐길 수 있어요.',helper:11,helperWhy:'부스러끼가 놓치기 쉬운 작은 바삭함을 발견해줘요.'},
  {type:'시즈닝 탐험파',traits:['새로운 맛에 호기심','양념의 균형 감각','한입의 변화를 좋아함'],similar:'케이준띠는 한 조각의 향까지 챙기는 친구예요. 당신도 소금 한 꼬집이나 시즈닝의 차이를 즐겁게 구별하는 편이에요.',habit:'감튀를 가볍게 흔들어 양념을 골고루 묻히고 맛의 차이를 비교해요.',shine:'평범한 감튀 시간에 새로운 소스와 조합을 제안해요.',pair:5,pairWhy:'케찹 감띠와 만나면 매콤함과 새콤함의 조합이 완성돼요.',helper:0,helperWhy:'감띠가 기본 감자 맛을 다시 떠올리게 해줘요.'},
  {type:'진한 모서리 수집가',traits:['고소한 풍미 선호','색의 차이에 민감','남다른 한 조각 발견'],similar:'탄감띠는 남들보다 조금 더 진하게 익은 모서리가 개성이에요. 당신도 다른 사람이 지나친 갈색 조각의 고소함을 알아보는 편이에요.',habit:'살짝 진하게 익은 끝이나 바삭한 모서리를 먼저 찾아요.',shine:'예상 밖의 맛에서 재미를 발견하고 친구에게 알려줘요.',pair:9,pairWhy:'울룩불룩띠와는 울퉁불퉁한 바삭한 면을 함께 찾아요.',helper:4,helperWhy:'덜감띠가 부드러운 감자 맛으로 강한 풍미를 쉬게 해줘요.'},
  {type:'담백한 천천히파',traits:['감자 본연의 맛','속도보다 여유','은은한 식감 선호'],similar:'덜감띠는 조금 일찍 나온 덕분에 부드러운 매력이 있어요. 당신도 강한 양념보다 감자 자체의 맛을 천천히 느끼는 편이에요.',habit:'소스를 조금만 찍거나 생략하고, 한 조각씩 느긋하게 먹어요.',shine:'빠르게 사라지는 감튀 한 상자에 잠깐의 쉼표를 만들어요.',pair:13,pairWhy:'촉촉감띠와는 부드러운 식감의 다른 얼굴을 즐길 수 있어요.',helper:2,helperWhy:'케이준띠가 가끔은 새로운 자극을 건네줘요.'},
  {type:'소스 조합 연구가',traits:['찍는 방식에도 취향','새콤한 한입','재미있는 조합'],similar:'케찹 감띠는 소스를 단순한 곁들이가 아니라 자기만의 스타일로 만들어요. 당신도 얼마나, 어디에 찍을지까지 나름의 방식이 있어요.',habit:'케첩을 넉넉히 준비하고 마지막 한 조각까지 소스를 남김없이 즐겨요.',shine:'친구들이 새로운 소스 조합을 시도하게 만드는 아이디어가 있어요.',pair:2,pairWhy:'케이준띠의 양념과 케첩이 만나면 풍미가 더 커져요.',helper:0,helperWhy:'감띠가 소스를 빼고도 맛있는 첫입을 알려줘요.'},
  {type:'차가운 감튀도 발견파',traits:['온도에 민감','의외의 식감 수용','자기만의 속도'],similar:'빙빙이는 차가운 곳에서 막 나왔지만 아직 모험이 시작되지 않았어요. 당신도 감튀의 온도와 상태 변화를 세심하게 느끼는 편이에요.',habit:'따뜻할 때와 식었을 때의 차이를 알아보고, 다시 데우는 방법도 궁리해요.',shine:'남들이 놓치는 작은 온도 차이를 이야기로 바꿔요.',pair:13,pairWhy:'촉촉감띠와는 식감이 변한 감튀도 즐겨 보는 동료예요.',helper:0,helperWhy:'감띠가 갓 튀긴 바삭함으로 출발점을 다시 보여줘요.'},
  {type:'모양부터 즐기는 곡선파',traits:['독특한 모양 선호','유쾌한 발견','틀에 얽매이지 않음'],similar:'휜감띠는 반듯하지 않은 모양 자체가 매력이에요. 당신도 휘어진 감튀를 보면 먼저 웃고 한 번 더 살펴보는 편이에요.',habit:'특이하게 휘어진 조각을 집어 사진을 찍거나 소스에 푹 담가요.',shine:'감튀 한 상자에서도 예상 밖의 재미를 발견해요.',pair:9,pairWhy:'울룩불룩띠와 만나면 모양이 다른 친구들끼리 더 즐거워져요.',helper:0,helperWhy:'감띠가 익숙한 기준점을 잡아줘서 차이가 더 선명해져요.'},
  {type:'함께 먹는 나눔파',traits:['친구와 나누기','마지막 조각 양보','대화가 곁들여진 감튀'],similar:'감감이와 띠띠는 한 감자에서 시작한 두 친구예요. 당신도 감튀가 맛있는 순간을 혼자보다 누군가와 나누는 편이에요.',habit:'친구가 좋아하는 조각을 남겨두고 소스도 가운데 두고 함께 찍어요.',shine:'마지막 조각을 두고 웃을 수 있는 분위기를 만들어요.',pair:12,pairWhy:'두리감띠와는 서로 다른 취향을 딱 맞게 나눌 수 있어요.',helper:11,helperWhy:'부스러끼가 당신 몫의 작은 조각도 챙겨줘요.'},
  {type:'바삭한 굴곡 애호가',traits:['표면의 바삭함','굴곡 많은 조각','식감의 리듬'],similar:'울룩불룩띠는 굴곡마다 바삭한 면이 숨어 있어요. 당신도 한 입 안에서 여러 식감이 차례로 느껴지는 감튀를 좋아해요.',habit:'주름 사이에 소스가 머무는 크링클 감튀를 골라 먹어요.',shine:'같은 감튀라도 면마다 다른 맛을 찾아내요.',pair:7,pairWhy:'휜감띠와는 모양이 주는 재미를 마음껏 이야기해요.',helper:1,helperWhy:'뚱감띠의 포슬한 속이 바삭한 자극을 부드럽게 이어줘요.'},
  {type:'포슬한 웨지 탐험가',traits:['두툼한 한 조각','껍질의 고소함','느긋한 한입'],similar:'웨지감띠는 옆으로 누워 넓은 면과 두툼한 속을 보여줘요. 당신도 감자의 결을 천천히 느낄 수 있는 감튀에 손이 가요.',habit:'웨지를 크게 베어 물고 껍질과 속의 맛을 따로 살펴요.',shine:'서둘러 먹기보다 한 조각의 여러 면을 즐겨요.',pair:1,pairWhy:'뚱감띠와는 포슬포슬한 속맛을 함께 이야기해요.',helper:11,helperWhy:'부스러끼가 바삭한 작은 끝을 더해줘요.'},
  {type:'끝까지 찾는 부스러기파',traits:['작은 디테일 발견','마지막까지 바삭','남김없는 즐거움'],similar:'부스러끼는 봉지 바닥에 숨어 있어도 빛나는 친구예요. 당신도 작은 조각 하나를 그냥 넘기지 않는 편이에요.',habit:'봉지 맨 아래까지 살펴 바삭한 끝과 소금 묻은 부스러기를 모아요.',shine:'남들이 지나친 작은 맛을 찾아내어 한 상자를 알차게 즐겨요.',pair:0,pairWhy:'감띠의 정석 바삭함과 부스러끼의 작은 바삭함이 잘 맞아요.',helper:1,helperWhy:'뚱감띠가 든든한 한입도 잊지 않게 해줘요.'},
  {type:'둘이서 더 맛있는 짝꿍파',traits:['붙은 조각 선호','함께하는 감튀','두 가지 시선'],similar:'두리감띠는 서로 등을 붙이고 다른 방향을 봐요. 당신도 감튀 두 조각이 붙어 나온 순간이나 친구와 나눈 한입을 특별하게 여겨요.',habit:'두 조각을 함께 찍거나 하나를 떼어 친구와 나눠요.',shine:'서로 다른 취향을 한 상자 안에서 자연스럽게 이어줘요.',pair:8,pairWhy:'감감이와 띠띠는 함께 있을 때 더 즐거운 마음을 잘 알아요.',helper:2,helperWhy:'케이준띠가 새로운 맛으로 둘의 대화를 넓혀줘요.'},
  {type:'촉촉한 여유파',traits:['부드러운 식감','기다림에도 편안함','느긋한 마무리'],similar:'촉촉감띠는 조금 식어도 자기만의 매력이 남아 있어요. 당신도 바삭함만이 정답은 아니라고 느끼는 편이에요.',habit:'소스를 곁들이고 조금 부드러워진 감튀도 끝까지 즐겨요.',shine:'감튀가 식어 가는 시간까지 여유로운 순간으로 만들어요.',pair:4,pairWhy:'덜감띠와는 담백하고 부드러운 한입을 나눌 수 있어요.',helper:0,helperWhy:'감띠가 가끔은 뜨겁고 바삭한 첫입을 선물해줘요.'}
];
const quizRoot=document.querySelector('#quiz-root');
const quizAnswers=[];
const quizLength=10;
function chooseQuestions(){const shuffled=[...fryQuestions];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}return shuffled.slice(0,quizLength);}
let activeQuestions=chooseQuestions();
const sharedParams=new URLSearchParams(location.search);
const sharedQuestionIds=(sharedParams.get('q')||'').split(',').map(Number);
const sharedAnswerIds=(sharedParams.get('a')||'').split('').map(Number);
if(sharedQuestionIds.length===quizLength&&new Set(sharedQuestionIds).size===quizLength&&sharedAnswerIds.length===quizLength&&sharedQuestionIds.every(id=>Number.isInteger(id)&&id>=0&&id<fryQuestions.length)&&sharedAnswerIds.every(id=>Number.isInteger(id)&&id>=0&&id<4)){
  activeQuestions=sharedQuestionIds.map(id=>fryQuestions[id]);
  quizAnswers.push(...sharedAnswerIds);
}
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
  const opportunities=new Array(products.length).fill(0);
  activeQuestions.forEach(question=>question.options.forEach(([,weights])=>Object.entries(weights).forEach(([index,score])=>{opportunities[Number(index)]+=score;})));
  quizAnswers.forEach((choice,step)=>{const weights=activeQuestions[step].options[choice][1];Object.entries(weights).forEach(([index,score])=>{scores[Number(index)]+=score;});});
  const adjusted=scores.map((score,index)=>score/Math.pow(opportunities[index]||1,.7));
  const best=Math.max(...adjusted);const ties=adjusted.map((score,index)=>score===best?index:-1).filter(index=>index>=0);
  return ties[quizAnswers.reduce((value,answer,step)=>value*5+answer+step,0)%ties.length];
}
function renderQuizResult(){
  const index=matchFriend(),friend=products[index],profile=fryProfiles[index];
  const panel=quizElement('div','quiz-result');
  const art=quizElement('img','quiz-art');art.src=friend.illustration;art.alt=`${friend.name} 원본 일러스트`;art.loading='lazy';
  const copy=quizElement('div','quiz-result-copy');copy.append(quizElement('p','quiz-kicker','YOUR FRY FRIEND'),quizElement('h3','',friend.name),quizElement('p','quiz-english',friend.english),quizElement('p','quiz-type',profile.type),quizElement('p','quiz-story',stories[index][0]));
  const extras=quizElement('div','quiz-extras');
  const intro=quizElement('section','quiz-insight-main');intro.append(quizElement('p','quiz-kicker','WHY THIS FRIEND?'),quizElement('h4','',`당신과 ${friend.name}의 닮은 점`),quizElement('p','',profile.similar));
  const traits=quizElement('div','quiz-traits');profile.traits.forEach(trait=>traits.append(quizElement('span','',trait)));intro.append(traits);extras.append(intro);
  const facts=quizElement('div','quiz-facts');[['감튀를 먹는 방식',profile.habit],['당신의 좋은 점',profile.shine]].forEach(([title,body])=>{const card=quizElement('section','quiz-fact');card.append(quizElement('h4','',title),quizElement('p','',body));facts.append(card);});extras.append(facts);
  const matched=quizAnswers.map((choice,step)=>({label:activeQuestions[step].options[choice][0],score:activeQuestions[step].options[choice][1][index]||0})).filter(item=>item.score>0).sort((a,b)=>b.score-a.score).slice(0,3);
  const evidence=quizElement('section','quiz-evidence');evidence.append(quizElement('p','quiz-kicker','YOUR ANSWERS'),quizElement('h4','','이 답변들이 힌트였어요'));const list=document.createElement('ul');matched.forEach(item=>list.append(quizElement('li','',item.label)));evidence.append(list);extras.append(evidence);
  const companions=quizElement('section','quiz-companions');companions.append(quizElement('p','quiz-kicker','FRY FRIENDS'),quizElement('h4','','함께하면 더 맛있는 감띠들'));const companionGrid=quizElement('div','quiz-companion-grid');[[profile.pair,'가장 잘 어울리는 감띠',profile.pairWhy],[profile.helper,'도움이 되는 감띠',profile.helperWhy]].forEach(([other,label,why])=>{const card=quizElement('button','quiz-companion');card.type='button';const image=quizElement('img','');image.src=products[other].illustration;image.alt='';const words=quizElement('span','');words.append(quizElement('small','',label),quizElement('strong','',products[other].name),quizElement('span','',why));card.append(image,words);card.addEventListener('click',()=>showDetail(other));companionGrid.append(card);});companions.append(companionGrid);extras.append(companions);
  const actions=quizElement('div','quiz-result-actions');const save=quizElement('button','quiz-save','결과 이미지 저장 ↓');save.type='button';save.addEventListener('click',()=>saveQuizImage(index,save));const share=quizElement('button','quiz-share','SNS에 공유 ↗');share.type='button';share.addEventListener('click',()=>shareQuizResult(index,share));const copyLink=quizElement('button','quiz-copy','결과 링크 복사');copyLink.type='button';copyLink.addEventListener('click',()=>copyQuizLink(copyLink));const detail=quizElement('button','quiz-detail','이 친구 자세히 보기 ↗');detail.type='button';detail.addEventListener('click',()=>showDetail(index));const reset=quizElement('button','quiz-reset','다시 해보기 ↺');reset.type='button';reset.addEventListener('click',()=>{quizAnswers.length=0;activeQuestions=chooseQuestions();history.replaceState(null,'',location.pathname);renderQuiz();});actions.append(save,share,copyLink,detail,reset);extras.append(actions,quizElement('p','quiz-share-note','인스타그램에는 저장한 이미지를 올릴 수 있어요. 이 결과는 감튀 취향으로 즐기는 놀이입니다.'));
  panel.append(art,copy,extras);quizRoot.append(panel);
}
function quizShareUrl(){const url=new URL(location.href);url.search='';url.hash='';url.searchParams.set('q',activeQuestions.map(q=>fryQuestions.indexOf(q)).join(','));url.searchParams.set('a',quizAnswers.join(''));return url.href;}
function quizShareText(index){return `내 감튀 취향은 ${fryProfiles[index].type}! 감띠즈의 ${products[index].name}와 닮았대요. 당신의 감띠도 찾아봐요.`;}
function quizLoadArt(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});}
function quizWrap(ctx,text,x,y,maxWidth,lineHeight,maxLines=5){let line='',drawn=0;for(const word of text.split(' ')){const next=line?line+' '+word:word;if(ctx.measureText(next).width>maxWidth&&line){ctx.fillText(line,x,y+drawn*lineHeight);drawn++;line=word;if(drawn>=maxLines)return y+drawn*lineHeight;}else line=next;}if(line){ctx.fillText(line,x,y+drawn*lineHeight);drawn++;}return y+drawn*lineHeight;}
async function quizImageBlob(index){
  await document.fonts.ready;const art=await quizLoadArt(products[index].illustration),profile=fryProfiles[index];const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff9ed';ctx.fillRect(0,0,1080,1350);ctx.fillStyle='#e93636';ctx.fillRect(0,0,1080,755);ctx.fillStyle='#ffb511';ctx.fillRect(0,0,1080,22);
  ctx.fillStyle='#fff';ctx.font='700 52px GamttizEN,sans-serif';ctx.fillText('GAMTTIZ',72,105);ctx.font='700 21px GamttizEN,sans-serif';ctx.fillStyle='#ffd45c';ctx.fillText('French Fry Lovers',74,137);
  ctx.fillStyle='#fff1d2';ctx.font='700 25px "Wanted Sans Variable",sans-serif';ctx.fillText('나의 감튀 취향 친구는',72,225);
  ctx.fillStyle='#fff';ctx.font=`800 ${products[index].name.length>8?58:76}px "Wanted Sans Variable",sans-serif`;ctx.fillText(products[index].name,70,315);
  ctx.fillStyle='#ffca47';ctx.font='700 34px GamttizEN,sans-serif';ctx.fillText(profile.type,72,365);
  ctx.fillStyle='#fff3dc';ctx.font='500 28px "Wanted Sans Variable",sans-serif';quizWrap(ctx,profile.similar,72,445,570,45,5);
  ctx.fillStyle='#fff8ec';ctx.beginPath();ctx.roundRect(690,210,310,475,28);ctx.fill();const scale=Math.min(260/art.naturalWidth,410/art.naturalHeight);const w=art.naturalWidth*scale,h=art.naturalHeight*scale;ctx.drawImage(art,845-w/2,435-h/2,w,h);
  ctx.fillStyle='#a92a24';ctx.font='800 27px "Wanted Sans Variable",sans-serif';ctx.fillText('당신의 감튀 취향',72,830);ctx.fillStyle='#352821';ctx.font='500 26px "Wanted Sans Variable",sans-serif';quizWrap(ctx,profile.habit,72,885,930,43,3);
  ctx.fillStyle='#fff0c9';ctx.beginPath();ctx.roundRect(60,1010,960,220,24);ctx.fill();ctx.fillStyle='#b52923';ctx.font='800 24px "Wanted Sans Variable",sans-serif';ctx.fillText('함께하면 더 맛있는 감띠',88,1058);ctx.fillStyle='#30261e';ctx.font='700 26px "Wanted Sans Variable",sans-serif';ctx.fillText('잘 어울리는 '+products[profile.pair].name,88,1115);ctx.fillText('도움이 되는 '+products[profile.helper].name,88,1163);
  ctx.fillStyle='#a94430';ctx.font='600 19px "Wanted Sans Variable",sans-serif';ctx.fillText('30가지 질문 중 10가지 답변으로 찾은 나의 감띠',72,1300);
  return new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
}
function quizDownloadBlob(blob){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='gamttiz-fry-result.png';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
async function saveQuizImage(index,button){const original=button.textContent;button.disabled=true;button.textContent='이미지 만드는 중…';try{const blob=await quizImageBlob(index);if(!blob)throw Error('PNG');quizDownloadBlob(blob);button.textContent='이미지 저장 완료 ✓';}catch(error){button.textContent='저장 실패 · 다시 시도';console.error(error);}finally{button.disabled=false;setTimeout(()=>{button.textContent=original;},3000);}}
async function shareQuizResult(index,button){const original=button.textContent;button.disabled=true;try{const text=quizShareText(index),url=quizShareUrl(),blob=await quizImageBlob(index);const file=new File([blob],'gamttiz-fry-result.png',{type:'image/png'});if(navigator.share){if(navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:'나의 감띠즈 감튀 취향',text,...(location.hostname==='localhost'||location.hostname==='127.0.0.1'?{}:{url})});else await navigator.share({title:'나의 감띠즈 감튀 취향',text,url});button.textContent='공유했어요 ✓';}else{await navigator.clipboard.writeText(text+' '+url);button.textContent='결과 문구 복사 완료 ✓';}}catch(error){if(error.name!=='AbortError'){button.textContent='공유할 수 없어 링크를 복사해 주세요';console.error(error);}}finally{button.disabled=false;setTimeout(()=>{button.textContent=original;},4000);}}
async function copyQuizLink(button){try{await navigator.clipboard.writeText(quizShareText(matchFriend())+' '+quizShareUrl());button.textContent='복사 완료 ✓';}catch(error){button.textContent='복사 실패';}setTimeout(()=>{button.textContent='결과 링크 복사';},3000);}
renderQuiz();
