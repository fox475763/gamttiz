const form = document.getElementById('news-form');
const statusLine = document.getElementById('admin-status');
const publishButton = document.getElementById('publish-button');
const value = id => document.getElementById(id).value.trim();
const encodeBytes = bytes => {
  let binary = '';
  for (let start = 0; start < bytes.length; start += 8192) binary += String.fromCharCode(...bytes.subarray(start, start + 8192));
  return btoa(binary);
};
const encodeText = text => encodeBytes(new TextEncoder().encode(text));
const apiRequest = async (url, token, options = {}) => {
  const response = await fetch(url, { ...options, headers: {
    Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28', ...(options.body ? {'Content-Type':'application/json'} : {})
  }});
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(`${response.status}: ${detail.message || 'GitHub 요청 실패'}`);
  }
  return response.json();
};
form.addEventListener('submit', async event => {
  event.preventDefault();
  const owner = value('repo-owner'), repo = value('repo-name'), token = value('github-token');
  if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) { statusLine.textContent = '저장소 주소를 확인해 주세요.'; return; }
  const files = [...document.getElementById('post-images').files];
  if (files.length > 6 || files.some(file => file.size > 8 * 1024 * 1024)) { statusLine.textContent = '사진은 최대 6장, 각 8MB 이하로 올려 주세요.'; return; }
  const allowed = new Set(['image/png','image/jpeg','image/webp','image/gif']);
  if (files.some(file => !allowed.has(file.type))) { statusLine.textContent = 'PNG, JPG, WEBP, GIF 사진만 사용할 수 있어요.'; return; }
  publishButton.disabled = true;
  const base = `https://api.github.com/repos/${owner}/${repo}/contents/`;
  try {
    statusLine.textContent = '기존 소식을 확인하고 있어요…';
    const existing = await apiRequest(`${base}news/posts.json`, token);
    const decoded = new TextDecoder().decode(Uint8Array.from(atob(existing.content.replace(/\s/g, '')), char => char.charCodeAt(0)));
    const posts = JSON.parse(decoded);
    if (!Array.isArray(posts)) throw new Error('소식 목록 파일 형식이 올바르지 않습니다.');
    const id = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const images = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
      const path = `assets/news/${id}-${i + 1}.${ext}`;
      statusLine.textContent = `사진 ${i + 1}/${files.length}장을 올리고 있어요…`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      await apiRequest(`${base}${path}`, token, { method:'PUT', body: JSON.stringify({ message:`Add GAMTTIZ news image ${id}`, content: encodeBytes(bytes) }) });
      images.push(path);
    }
    const post = { id, date: new Date().toISOString(), title: value('post-title'), excerpt: value('post-excerpt'), body: value('post-body'), images };
    posts.unshift(post);
    statusLine.textContent = '글을 게시하고 있어요…';
    await apiRequest(`${base}news/posts.json`, token, { method:'PUT', body: JSON.stringify({ message:`Publish GAMTTIZ news: ${post.title}`, content: encodeText(JSON.stringify(posts, null, 2) + '\n'), sha: existing.sha }) });
    statusLine.replaceChildren(document.createTextNode('게시 완료! GitHub Pages 반영에는 잠시 걸릴 수 있어요. '));
    const link = document.createElement('a'); link.href = `news.html?id=${encodeURIComponent(id)}`; link.textContent = '게시한 글 보기 ↗'; statusLine.append(link);
    document.getElementById('github-token').value = '';
    form.reset();
  } catch (error) { statusLine.textContent = `게시하지 못했어요. ${error.message}`; }
  finally { publishButton.disabled = false; }
});
