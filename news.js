const newsRoot = document.getElementById('news-root');
const safeImage = path => typeof path === 'string' && (/^assets\/news\/[a-zA-Z0-9._-]+\.(png|jpe?g|webp|gif)$/i.test(path) || issueMedia(path));
const safeAttachment = path => typeof path === 'string' && (/^assets\/news\/[a-zA-Z0-9._-]+\.(pdf|txt|docx|xlsx|zip)$/i.test(path) || issueMedia(path));
const prettyDate = value => {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '' : new Intl.DateTimeFormat('ko-KR', {year:'numeric', month:'long', day:'numeric'}).format(date);
};
function emptyState(message) {
  const box = document.createElement('div'); box.className = 'news-empty';
  const badge = document.createElement('span'); badge.textContent = 'GAMTTIZ NOTICE';
  const title = document.createElement('h3'); title.textContent = message;
  const text = document.createElement('p'); text.textContent = '새 소식은 공식 인스타그램에서도 만나볼 수 있어요.';
  const link = document.createElement('a'); link.href = 'https://www.instagram.com/gamttiz_official/'; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = '@gamttiz_official ↗';
  box.append(badge, title, text, link); newsRoot.replaceChildren(box);
}
function articleNode(post, index) {
  const article = document.createElement('article'); article.className = 'news-card';
  const link = document.createElement('a'); link.href = `news.html?id=${encodeURIComponent(post.id)}`;
  const media = document.createElement('div'); media.className = 'news-card-media';
  if (safeImage(post.images?.[0])) {
    const image = document.createElement('img'); image.src = post.images[0]; image.alt = `${post.title} 사진`; image.loading = 'lazy'; image.decoding = 'async'; media.append(image);
  } else { const monogram = document.createElement('span'); monogram.textContent = 'GAMTTIZ'; media.append(monogram); }
  const info = document.createElement('div'); info.className = 'news-card-info';
  const meta = document.createElement('small'); meta.textContent = `${String(index + 1).padStart(2, '0')} / ${prettyDate(post.date)}${post.author ? ` · ${post.author}` : ''}`;
  const title = document.createElement('h3'); title.textContent = post.title;
  const excerpt = document.createElement('p'); excerpt.textContent = post.excerpt || post.body?.slice(0, 100) || '';
  const more = document.createElement('b'); more.textContent = '자세히 보기 ↗';
  info.append(meta, title, excerpt, more); link.append(media, info); article.append(link); return article;
}
function renderDetail(post) {
  const wrap = document.createElement('article'); wrap.className = 'news-detail';
  const back = document.createElement('a'); back.href = 'news.html'; back.className = 'news-back'; back.textContent = '← 공지 목록';
  const meta = document.createElement('p'); meta.className = 'eyebrow'; meta.textContent = `GAMTTIZ / ${prettyDate(post.date)}${post.author ? ` · ${post.author}` : ''}`;
  const title = document.createElement('h2'); title.textContent = post.title;
  const body = document.createElement('p'); body.className = 'news-body'; body.textContent = post.body || '';
  wrap.append(back, meta, title);
  for (const path of post.images || []) {
    if (!safeImage(path)) continue;
    const image = document.createElement('img'); image.src = path; image.alt = `${post.title} 사진`; image.loading = 'lazy'; image.decoding = 'async'; wrap.append(image);
  }
  wrap.append(body);
  if (Array.isArray(post.attachments) && post.attachments.length) {
    const files = document.createElement('div'); files.className = 'news-attachments';
    const heading = document.createElement('h3'); heading.textContent = '첨부 파일'; files.append(heading);
    for (const item of post.attachments) {
      if (!item || !safeAttachment(item.path)) continue;
      const link = document.createElement('a'); link.href = item.path;
      if (item.path.startsWith('assets/')) link.download = '';
      else { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      link.textContent = `${typeof item.name === 'string' ? item.name : '파일 받기'} ↘`;
      files.append(link);
    }
    if (files.children.length > 1) wrap.append(files);
  }
  newsRoot.replaceChildren(wrap);
  document.title = `${post.title} — GAMTTIZ 공지`;
}
async function renderNews(force = false) {
  try {
const posts = await loadNewsPosts({force});
  if (!Array.isArray(posts)) throw new Error('Invalid news');
  const valid = posts.filter(post => post && typeof post.id === 'string' && typeof post.title === 'string');
  const wanted = new URLSearchParams(location.search).get('id');
  if (wanted) { const post = valid.find(item => item.id === wanted); post ? renderDetail(post) : emptyState('해당 소식을 찾을 수 없어요.'); return; }
  if (!valid.length) { emptyState('곧 새로운 소식을 전해드릴게요.'); return; }
  const list = document.createElement('div'); list.className = 'news-grid';
  valid.sort((a,b) => String(b.date).localeCompare(String(a.date))).forEach((post, i) => list.append(articleNode(post, i)));
  newsRoot.replaceChildren(list);
  } catch {
    emptyState('소식을 불러오지 못했어요.');
  }
}
renderNews(new URLSearchParams(location.search).has('refresh'));

