import fs from 'node:fs';

const owner = 'fox475763';
const repo = 'gamttiz';
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('GITHUB_TOKEN is required');
const headers = {Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28'};
const section = (body,name) => body.split(/^### /m).slice(1).find(part=>part.startsWith(name+'\n'))?.slice(name.length).trim().replace(/^_No response_$/,'') || '';
const media = url => /^https:\/\/(?:github\.com\/user-attachments\/assets\/|user-images\.githubusercontent\.com\/)/i.test(url);
const posts=[];
for(let page=1;page<=10;page++){
  const response=await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=100&page=${page}`,{headers});
  if(!response.ok) throw new Error(`GitHub issues API: ${response.status}`);
  const issues=await response.json();
  for(const issue of issues){
    const raw=issue.body||'';
    if(issue.pull_request||issue.user?.login?.toLowerCase()!==owner||!/^### 게시자 이름\s*$/m.test(raw)||!/^### 본문\s*$/m.test(raw))continue;
    const images=[...new Set([...raw.matchAll(/!\[[^\]]*\]\((https:\/\/[^)]+)\)/g)].map(m=>m[1]).concat([...raw.matchAll(/<img\b[^>]*\bsrc=["'](https:\/\/[^"']+)["'][^>]*>/gi)].map(m=>m[1])))].filter(media).slice(0,6);
    const attachments=[...raw.matchAll(/(?<!!)\[([^\]]+)\]\((https:\/\/[^)]+)\)/g)].filter(m=>media(m[2])).map(m=>({name:m[1],path:m[2]})).slice(0,6);
    const body=section(raw,'본문').replace(/!\[[^\]]*\]\(https:\/\/[^)]+\)/g,'').replace(/<img\b[^>]*>/gi,'').replace(/\[([^\]]+)\]\(https:\/\/[^)]+\)/g,'$1').replace(/\*\*/g,'').trim();
    const excerpt=section(raw,'짧은 소개')||body.split(/\n\s*\n/).find(part=>part.length>35)||body.slice(0,180);
    posts.push({id:`issue-${issue.number}`,date:issue.created_at,author:section(raw,'게시자 이름')||'채민석',title:issue.title.replace(/^\[NEWS\]\s*/i,'').trim(),excerpt,body,images,attachments,source:'issue',url:issue.html_url});
  }
  if(issues.length<100)break;
}
posts.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
fs.writeFileSync('news/posts.json',JSON.stringify(posts,null,2)+'\n');
console.log(`Synced ${posts.length} news posts`);
