const homeNews = document.querySelector('.home-news');
const collection = document.getElementById('collection');
if (homeNews && collection) {
  collection.insertAdjacentElement('beforebegin', homeNews);
  homeNews.className = 'home-news-feed';
  const create = (tag, className, content) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.textContent = content;
    return element;
  };
  const header = create('div', 'home-news-feed-head');
  const heading = create('div');
  heading.append(create('p', 'eyebrow', 'GAMTTIZ / LATEST NEWS'), create('h2', '', '감띠즈의 새로운 이야기.'));
  const allNews = create('a', 'home-news-all', '모든 소식 보기 ↗');
  allNews.href = 'news.html';
  header.append(heading, allNews);
  const list = create('div', 'home-news-feed-list');
  homeNews.replaceChildren(header, list);
  const showEmpty = () => {
    const note = create('p', 'home-news-feed-empty', '새로운 소식을 준비하고 있어요. 다음 이야기를 기대해 주세요.');
    list.replaceChildren(note);
  };
  fetch('news/posts.json', { cache: 'no-store' }).then(response => {
    if (!response.ok) throw new Error('News unavailable');
    return response.json();
  }).then(posts => {
    if (!Array.isArray(posts)) throw new Error('Invalid news');
    const latest = posts.filter(post => post && typeof post.id === 'string' && typeof post.title === 'string')
      .sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 2);
    if (!latest.length) { showEmpty(); return; }
    list.replaceChildren();
    for (const post of latest) {
      const card = create('a', 'home-news-feed-card');
      card.href = `news.html?id=${encodeURIComponent(post.id)}`;
      const imagePath = Array.isArray(post.images) ? post.images[0] : '';
      const imageWrap = create('div', 'home-news-feed-media');
      if (typeof imagePath === 'string' && /^assets\/news\/[a-zA-Z0-9._-]+\.(png|jpe?g|webp|gif)$/i.test(imagePath)) {
        const image = create('img'); image.src = imagePath; image.alt = `${post.title} 사진`; image.loading = 'lazy';
        imageWrap.append(image);
      } else imageWrap.append(create('span', '', 'GAMTTIZ'));
      const info = create('div', 'home-news-feed-copy');
      const date = new Date(post.date);
      const dateText = Number.isNaN(date.valueOf()) ? 'NEWS' : new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
      info.append(create('small', '', dateText), create('h3', '', post.title), create('p', '', post.excerpt || post.body?.slice(0, 120) || ''), create('b', '', '자세히 보기 ↗'));
      card.append(imageWrap, info); list.append(card);
    }
  }).catch(showEmpty);
}
