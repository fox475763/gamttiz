const homeNews = document.querySelector('.home-news');
if (homeNews) {
  homeNews.className = 'home-news-feed';
  const create = (tag, className, content) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.textContent = content;
    return element;
  };
  const header = create('div', 'home-news-feed-head');
  const heading = create('div');
  heading.append(create('h2', '', '감띠즈 공식 공지.'));
  const allNews = create('a', 'home-news-all', '모든 공지 보기 ↗');
  allNews.href = 'news.html';
  header.append(heading, allNews);
  const list = create('div', 'home-news-feed-list');
  homeNews.replaceChildren(header, list);
  const showEmpty = () => {
    const note = create('p', 'home-news-feed-empty', '새로운 공지를 준비하고 있어요.');
    list.replaceChildren(note);
  };
  loadNewsPosts().then(posts => {
    if (!Array.isArray(posts)) throw new Error('Invalid news');
    const latest = posts.filter(post => post && typeof post.id === 'string' && typeof post.title === 'string')
      .sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 2);
    if (!latest.length) { showEmpty(); return; }
    list.replaceChildren();
    for (const post of latest) {
      const card = create('a', 'home-news-feed-card');
      card.href = `news.html?id=${encodeURIComponent(post.id)}`;
      const info = create('div', 'home-news-feed-copy');
      const date = new Date(post.date);
      const dateText = Number.isNaN(date.valueOf()) ? '공지' : new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
      info.append(create('small', '', dateText), create('h3', '', post.title), create('p', '', post.excerpt || post.body?.slice(0, 120) || ''));
      const arrow = create('b', 'home-news-feed-arrow', '↗');
      arrow.setAttribute('aria-hidden', 'true');
      card.append(info, arrow); list.append(card);
    }
  }).catch(showEmpty);
}
