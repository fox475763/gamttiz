const catalogProducts = [
  ['감띠 키링','Gamtti','180°C 기름에서 깔끔하게 튀겨진 감자튀김'],
  ['뚱감띠','Ttung Gamtti','기존 감띠보다 조금 더 듬직한 모습의 감자튀김'],
  ['케이준띠','Cajuntti','케이준 시즈닝을 입고 있는 기다란 감자튀김'],
  ['탄감띠','Tan Gamtti','실수로 200°C 기름에 들어간 감자튀김'],
  ['덜감띠','Deol Gamtti','약속이 있어서 조금 일찍 밖으로 나온 감자튀김'],
  ['(케찹 발린) 감띠','Ketchup Gamtti','머리에 케찹을 돌돌 바른 조금 특별한 감자튀김'],
  ['빙빙이','BingBingi','꽁꽁 냉동실에서 이제 막 나온 감자튀김'],
  ['휜감띠','Hwin Gamtti','그냥 휘었다.'],
  ['감감이와 띠띠','GamGami & TtiTti','한 감자에서 나뉜 쌍둥이 남매 감자튀김'],
  ['울룩불룩띠','Ulluk Bulluk tti','형태가 울룩불룩한 감자튀김'],
  ['웨지감띠','Weji Gamtti','조각 사과처럼 옆으로 누운 감자튀김'],
  ['부스러끼','Bueureokki','겁이 많아서 어딘가에 숨어있는 감자튀김'],
  ['두리감띠','Duri Gamtti','서로 등 부분이 딱 붙어사는 감자튀김'],
  ['촉촉감띠','Chokchok Gamtti','기름이 흥건해 촉촉하고 흐물흐물한 감자튀김']
];
const catalogGrid = document.getElementById('catalog-grid');
const catalogDialog = document.getElementById('catalog-dialog');
catalogProducts.forEach(([name, english, description], index) => {
  const number = String(index + 1).padStart(2, '0');
  const image = `assets/keyring-${number}.png`;
  const card = document.createElement('button');
  card.type = 'button'; card.className = 'catalog-card';
  card.setAttribute('aria-label', `${name} 제품 정보 보기`);
  const img = document.createElement('img');
  img.src = image; img.alt = `${name} 키링 제품 사진`; img.loading = 'lazy';
  const text = document.createElement('span'); text.className = 'catalog-card-text';
  const num = document.createElement('small'); num.textContent = `No. ${number}`;
  const title = document.createElement('strong'); title.textContent = name;
  const arrow = document.createElement('b'); arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
  text.append(num, title, arrow); card.append(img, text);
  card.addEventListener('click', () => {
    document.getElementById('catalog-dialog-image').src = image;
    document.getElementById('catalog-dialog-image').alt = `${name} 키링 제품 소개 이미지`;
    document.getElementById('catalog-dialog-number').textContent = `KEYRING / No. ${number}`;
    document.getElementById('catalog-dialog-title').textContent = name;
    document.getElementById('catalog-dialog-english').textContent = english;
    document.getElementById('catalog-dialog-description').textContent = description;
    document.getElementById('catalog-original').href = image;
    catalogDialog.showModal(); catalogDialog.scrollTop = 0;
  });
  catalogGrid.append(card);
});
document.getElementById('catalog-close').addEventListener('click', () => catalogDialog.close());
catalogDialog.addEventListener('click', event => { if (event.target === catalogDialog) catalogDialog.close(); });
