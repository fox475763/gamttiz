const newsIssueEndpoint = 'https://api.github.com/repos/fox475763/gamttiz/issues?state=open&per_page=100&sort=created&direction=desc';
const newsCacheKey = 'gamttiz_issue_news_v1';
const issueMedia = url => /^https:\/\/(?:github\.com\/user-attachments\/assets\/|user-images\.githubusercontent\.com\/)/i.test(url);
function issueSection(body, name) {
  return body.split(/^### /m).slice(1).find(section => section.startsWith(name + '\n'))?.slice(name.length).trim() || '';
}
function issueToPost(issue) {
  const raw = issue.body || '';
  const images = [...raw.matchAll(/!\[[^\]]*\]\((https:\/\/[^)]+)\)/g)].map(match => match[1]).filter(issueMedia).slice(0,6);
  const attachments = [...raw.matchAll(/(?<!!)\[([^\]]+)\]\((https:\/\/[^)]+)\)/g)]
    .filter(match => issueMedia(match[2])).map(match => ({name:match[1],path:match[2]})).slice(0,6);
  const body = issueSection(raw,'본문') || raw;
  const cleanBody = body.replace(/!\[[^\]]*\]\(https:\/\/[^)]+\)/g,'').replace(/\[([^\]]+)\]\(https:\/\/[^)]+\)/g,'$1').trim();
  return {
    id:'issue-' + issue.number, date:issue.created_at, author:issueSection(raw,'게시자 이름') || '채민석',
    title:issue.title.replace(/^\[NEWS\]\s*/i,'').trim(),
    excerpt:issueSection(raw,'짧은 소개') || cleanBody.slice(0,180),
    body:cleanBody, images, attachments, source:'issue', url:issue.html_url
  };
}
async function loadNewsPosts() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(newsCacheKey) || 'null');
    if (cached && Date.now() - cached.time < 5 * 60 * 1000) return cached.posts;
  } catch {}
  try {
    const response = await fetch(newsIssueEndpoint, {headers:{Accept:'application/vnd.github+json'}});
    if (!response.ok) throw new Error('GitHub news unavailable');
    const issues = await response.json();
    const fromIssues = issues.filter(issue => !issue.pull_request && issue.user?.login?.toLowerCase() === 'fox475763' && /^\[NEWS\]/i.test(issue.title || ''))
      .map(issueToPost);
    const staticResponse = await fetch('news/posts.json', {cache:'no-store'});
    const staticPosts = staticResponse.ok ? await staticResponse.json() : [];
    const posts = [...fromIssues, ...(Array.isArray(staticPosts) ? staticPosts : [])]
      .sort((a,b) => String(b.date).localeCompare(String(a.date)));
    try { sessionStorage.setItem(newsCacheKey, JSON.stringify({time:Date.now(), posts})); } catch {}
    return posts;
  } catch {
    const response = await fetch('news/posts.json', {cache:'no-store'});
    if (!response.ok) return [];
    const posts = await response.json();
    return Array.isArray(posts) ? posts : [];
  }
}

