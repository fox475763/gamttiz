const newsIssueEndpoint = 'https://api.github.com/repos/fox475763/gamttiz/issues?state=open&per_page=100&sort=created&direction=desc';
const newsCacheKey = 'gamttiz_issue_news_v2';
const issueMedia = url => /^https:\/\/(?:github\.com\/user-attachments\/assets\/|user-images\.githubusercontent\.com\/)/i.test(url);
function issueSection(body, name) {
  const value = body.split(/^### /m).slice(1).find(section => section.startsWith(name + '\n'))?.slice(name.length).trim() || '';
  return value === '_No response_' ? '' : value;
}
function issueToPost(issue) {
  const raw = issue.body || '';
  const markdownImages = [...raw.matchAll(/!\[[^\]]*\]\((https:\/\/[^)]+)\)/g)].map(match => match[1]);
  const htmlImages = [...raw.matchAll(/<img\b[^>]*\bsrc=["'](https:\/\/[^"']+)["'][^>]*>/gi)].map(match => match[1]);
  const images = [...new Set([...markdownImages, ...htmlImages])].filter(issueMedia).slice(0,6);
  const attachments = [...raw.matchAll(/(?<!!)\[([^\]]+)\]\((https:\/\/[^)]+)\)/g)]
    .filter(match => issueMedia(match[2])).map(match => ({name:match[1],path:match[2]})).slice(0,6);
  const body = issueSection(raw,'본문') || raw;
  const cleanBody = body.replace(/!\[[^\]]*\]\(https:\/\/[^)]+\)/g,'').replace(/<img\b[^>]*>/gi,'').replace(/\[([^\]]+)\]\(https:\/\/[^)]+\)/g,'$1').replace(/\*\*/g,'').trim();
  return {
    id:'issue-' + issue.number, date:issue.created_at, author:issueSection(raw,'게시자 이름') || '채민석',
    title:issue.title.replace(/^\[NEWS\]\s*/i,'').trim(),
    excerpt:issueSection(raw,'짧은 소개') || cleanBody.split(/\n\s*\n/).find(part=>part.length>35) || cleanBody.slice(0,180),
    body:cleanBody, images, attachments, source:'issue', url:issue.html_url
  };
}
window.gamttizNewsState = {source:'loading', time:null};
async function loadNewsPosts({force=false}={}) {
  try {
    const cached = JSON.parse(sessionStorage.getItem(newsCacheKey) || 'null');
    if (!force && cached && Date.now() - cached.time < 15 * 1000) {
      window.gamttizNewsState = {source:'cached', time:cached.time};
      return cached.posts;
    }
  } catch {}
  try {
    const response = await fetch(newsIssueEndpoint + '&_=' + Date.now(), {cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
    if (!response.ok) throw new Error('GitHub news unavailable');
    const issues = await response.json();
    const fromIssues = issues.filter(issue => !issue.pull_request && issue.user?.login?.toLowerCase() === 'fox475763' && /^### 게시자 이름\s*$/m.test(issue.body || '') && /^### 본문\s*$/m.test(issue.body || ''))
      .map(issueToPost);
    const staticResponse = await fetch('news/posts.json', {cache:'no-store'});
    const staticPosts = staticResponse.ok ? await staticResponse.json() : [];
    const posts = [...new Map([...(Array.isArray(staticPosts) ? staticPosts : []),...fromIssues].map(post=>[post.id,post])).values()]
      .sort((a,b) => String(b.date).localeCompare(String(a.date)));
    try { sessionStorage.setItem(newsCacheKey, JSON.stringify({time:Date.now(), posts})); } catch {}
    window.gamttizNewsState = {source:'live', time:Date.now()};
    return posts;
  } catch {
    const response = await fetch('news/posts.json', {cache:'no-store'});
    if (!response.ok) { window.gamttizNewsState={source:'offline',time:Date.now()}; return []; }
    const posts = await response.json();
    window.gamttizNewsState = {source:'fallback', time:Date.now()};
    return Array.isArray(posts) ? posts : [];
  }
}
