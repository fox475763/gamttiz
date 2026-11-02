const form = document.getElementById('news-form');
const statusLine = document.getElementById('admin-status');
const publishButton = document.getElementById('publish-button');
const loginView = document.getElementById('login-view');
const editorView = document.getElementById('editor-view');
const settingsView = document.getElementById('settings-view');
const loginStatus = document.getElementById('login-status');
let activeToken = '';
let accountName = '';
let authorName = '채민석';
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
function showView(view) {
  loginView.hidden = view !== loginView;
  editorView.hidden = view !== editorView;
  settingsView.hidden = view !== settingsView;
}
function logout() {
  activeToken = '';
  accountName = '';
  authorName = '채민석';
  document.getElementById('login-token').value = '';
  form.reset();
  showView(loginView);
}
document.getElementById('login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const token = value('login-token');
  const button = document.getElementById('login-button');
  button.disabled = true;
  loginStatus.textContent = 'GitHub 계정과 저장소 권한을 확인하고 있어요…';
  try {
    const user = await apiRequest('https://api.github.com/user', token);
    if (user.login?.toLowerCase() !== 'fox475763') throw new Error('감띠즈 제작자 GitHub 계정으로 로그인해 주세요.');
    const repository = await apiRequest('https://api.github.com/repos/fox475763/gamttiz', token);
    if (!repository.permissions?.push) throw new Error('이 계정에 감띠즈 저장소 게시 권한이 없습니다.');
    activeToken = token;
    accountName = user.login;
    try {
      const settings = await apiRequest('https://api.github.com/repos/fox475763/gamttiz/contents/news/settings.json', token);
      const data = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(settings.content.replace(/\s/g, '')), char => char.charCodeAt(0))));
      if (typeof data.author === 'string' && data.author.trim()) authorName = data.author.trim();
    } catch (error) { if (!String(error.message).startsWith('404:')) throw error; }
    document.getElementById('login-token').value = '';
    document.getElementById('signed-in-name').textContent = `${accountName} 계정으로 로그인됨`;
    document.getElementById('author-name').value = authorName;
    loginStatus.textContent = '';
    showView(editorView);
  } catch (error) { loginStatus.textContent = `로그인하지 못했어요. ${error.message}`; }
  finally { button.disabled = false; }
});
document.getElementById('logout-button').addEventListener('click', logout);
document.getElementById('settings-logout').addEventListener('click', logout);
document.getElementById('settings-button').addEventListener('click', () => showView(settingsView));
document.getElementById('back-to-editor').addEventListener('click', () => showView(editorView));
document.getElementById('settings-form').addEventListener('submit', async event => {
  event.preventDefault();
  const nextName = value('author-name');
  const line = document.getElementById('settings-status');
  const button = event.currentTarget.querySelector('button[type=submit]');
  button.disabled = true;
  line.textContent = '게시자 이름을 저장하고 있어요…';
  try {
    const url = 'https://api.github.com/repos/fox475763/gamttiz/contents/news/settings.json';
    let sha;
    try { sha = (await apiRequest(url, activeToken)).sha; }
    catch (error) { if (!String(error.message).startsWith('404:')) throw error; }
    await apiRequest(url, activeToken, {method:'PUT', body: JSON.stringify({message:'Update GAMTTIZ news author', content: encodeText(JSON.stringify({author:nextName}, null, 2) + '\n'), ...(sha ? {sha} : {})})});
    authorName = nextName;
    line.textContent = '게시자 이름을 저장했어요. 이후 소식부터 적용됩니다.';
  } catch (error) { line.textContent = `저장하지 못했어요. ${error.message}`; }
  finally { button.disabled = false; }
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!activeToken) { showView(loginView); return; }
  const owner = 'fox475763', repo = 'gamttiz', token = activeToken;
  const files = [...document.getElementById('post-images').files];
  const documents = [...document.getElementById('post-files').files];
  if (files.length > 6 || files.some(file => file.size > 8 * 1024 * 1024)) { statusLine.textContent = '사진은 최대 6장, 각 8MB 이하로 올려 주세요.'; return; }
  const allowed = new Set(['image/png','image/jpeg','image/webp','image/gif']);
  if (files.some(file => !allowed.has(file.type))) { statusLine.textContent = 'PNG, JPG, WEBP, GIF 사진만 사용할 수 있어요.'; return; }
  const allowedFiles = new Set(['pdf','txt','docx','xlsx','zip']);
  if (documents.length > 6 || documents.some(file => file.size > 10 * 1024 * 1024)) { statusLine.textContent = '첨부 파일은 최대 6개, 각 10MB 이하로 올려 주세요.'; return; }
  if (documents.some(file => !allowedFiles.has(file.name.split('.').pop().toLowerCase()))) { statusLine.textContent = 'PDF, TXT, DOCX, XLSX, ZIP 파일만 첨부할 수 있어요.'; return; }
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
    const attachments = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
      const path = `assets/news/${id}-${i + 1}.${ext}`;
      statusLine.textContent = `사진 ${i + 1}/${files.length}장을 올리고 있어요…`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      await apiRequest(`${base}${path}`, token, { method:'PUT', body: JSON.stringify({ message:`Add GAMTTIZ news image ${id}`, content: encodeBytes(bytes) }) });
      images.push(path);
    }
    for (let i = 0; i < documents.length; i++) {
      const file = documents[i];
      const ext = file.name.split('.').pop().toLowerCase();
      const path = `assets/news/${id}-file-${i + 1}.${ext}`;
      statusLine.textContent = `첨부 파일 ${i + 1}/${documents.length}개를 올리고 있어요…`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      await apiRequest(`${base}${path}`, token, { method:'PUT', body: JSON.stringify({ message:`Add GAMTTIZ news attachment ${id}`, content: encodeBytes(bytes) }) });
      attachments.push({ path, name: file.name });
    }
    const body = value('post-body');
    const post = { id, date: new Date().toISOString(), author: authorName, title: value('post-title'), excerpt: value('post-excerpt') || body.slice(0, 180), body, images, attachments };
    posts.unshift(post);
    statusLine.textContent = '글을 게시하고 있어요…';
    await apiRequest(`${base}news/posts.json`, token, { method:'PUT', body: JSON.stringify({ message:`Publish GAMTTIZ news: ${post.title}`, content: encodeText(JSON.stringify(posts, null, 2) + '\n'), sha: existing.sha }) });
    statusLine.replaceChildren(document.createTextNode('게시 완료! GitHub Pages 반영에는 잠시 걸릴 수 있어요. '));
    const link = document.createElement('a'); link.href = `news.html?id=${encodeURIComponent(id)}`; link.textContent = '게시한 글 보기 ↗'; statusLine.append(link);
    form.reset();
  } catch (error) { statusLine.textContent = `게시하지 못했어요. ${error.message}`; }
  finally { publishButton.disabled = false; }
});
