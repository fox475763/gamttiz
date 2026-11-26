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
// Fetch both independent sources concurrently. An unavailable API must
// never erase locally published announcements, and vice versa.
let newsInFlight=null;
async function newsJSON(url,options={}){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),8000);
  try{
    const response=await fetch(url,{...options,cache:'no-store',signal:controller.signal});
    if(!response.ok)throw Error('News HTTP '+response.status);
    const value=await response.json();
    if(!Array.isArray(value))throw Error('Invalid news list');
    return value;
  }finally{clearTimeout(timeout);}
}
async function loadNewsPosts({force=false}={}) {
  let cached=null;
  try{cached=JSON.parse(sessionStorage.getItem(newsCacheKey)||'null');}catch{}
  if(!force&&Array.isArray(cached?.posts)&&Date.now()-cached.time<15000){
    window.gamttizNewsState={source:'cached',time:cached.time};return cached.posts;
  }
  if(newsInFlight)return newsInFlight;
  newsInFlight=(async()=>{
    const [remote,local]=await Promise.allSettled([
      newsJSON(newsIssueEndpoint,{headers:{Accept:'application/vnd.github+json'}}),
      newsJSON('news/posts.json')
    ]);
    const staticPosts=local.status==='fulfilled'?local.value:[];
    const fromIssues=remote.status==='fulfilled'?remote.value.filter(issue=>!issue.pull_request&&issue.user?.login?.toLowerCase()==='fox475763'&&/^### 게시자 이름\s*$/m.test(issue.body||'')&&/^### 본문\s*$/m.test(issue.body||'')).map(issueToPost):[];
    if(remote.status==='rejected'&&local.status==='rejected'){
      window.gamttizNewsState={source:'offline',time:Date.now()};
      if(Array.isArray(cached?.posts))return cached.posts;
      throw Error('Both news sources unavailable');
    }
    const posts=[...new Map([...staticPosts,...fromIssues].filter(post=>post&&typeof post.id==='string'&&typeof post.title==='string').map(post=>[post.id,post])).values()].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    const time=Date.now();
    try{sessionStorage.setItem(newsCacheKey,JSON.stringify({time,posts}));}catch{}
    window.gamttizNewsState={source:remote.status==='fulfilled'?'live':'fallback',time};
    return posts;
  })();
  try{return await newsInFlight;}finally{newsInFlight=null;}
}
