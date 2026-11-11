import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root=process.cwd();
const errors=[];
const htmlFiles=fs.readdirSync(root).filter(name=>name.endsWith('.html'));
for(const file of htmlFiles){
  const html=fs.readFileSync(file,'utf8');
  for(const [,attr,target] of html.matchAll(/\b(src|href)=["']([^"']+)["']/g)){
    if(target.startsWith('#')||/^(?:https?:|mailto:|data:|javascript:|\/)/i.test(target))continue;
    const local=decodeURIComponent(target.split(/[?#]/)[0]);
    if(!local)continue;
    if(!fs.existsSync(path.join(root,local)))errors.push(`${file}: missing ${attr} ${local}`);
  }
}
for(const file of fs.readdirSync(root).filter(name=>name.endsWith('.js'))){
  try{execFileSync(process.execPath,['--check',path.join(root,file)],{stdio:'pipe'});}catch(error){errors.push(`${file}: JavaScript syntax error\n${error.stderr?.toString()||''}`);}
}
for(const file of ['tools/check-site.mjs','tools/sync-news.mjs','tools/collect-fry-radar.mjs','tools/collect-official-fry-radar.mjs']){
  try{execFileSync(process.execPath,['--check',path.join(root,file)],{stdio:'pipe'});}catch(error){errors.push(`${file}: JavaScript syntax error\n${error.stderr?.toString()||''}`);}
}
try{const posts=JSON.parse(fs.readFileSync('news/posts.json','utf8'));if(!Array.isArray(posts))errors.push('news/posts.json: expected an array');}catch{errors.push('news/posts.json: invalid JSON');}
const quiz=fs.readFileSync('quiz.js','utf8');
const count=(quiz.match(/\{title:/g)||[]).length;
if(count<30)errors.push(`quiz.js: expected 30 questions, found ${count}`);
// Image links must be HTTPS URLs with supported raster extensions, or HTTPS image endpoints.
try{
  const d=JSON.parse(fs.readFileSync('data/fry-radar.json','utf8'));
  for(const item of d.items||[]){
    if(!item.imageUrl)continue;
    try{
      const u=new URL(item.imageUrl);
      if(u.protocol!=='https:'||/\.(?:svg|ico)$/i.test(u.pathname))errors.push('Invalid image URL in fry-radar.json: '+item.id);
    }catch{errors.push('Malformed image URL in fry-radar.json: '+item.id);}
  }
}catch(e){errors.push('data/fry-radar.json: invalid JSON');}
// Validate collector status and avoid silently claiming that blocked sources were checked.
try{
  const state=JSON.parse(fs.readFileSync('data/fry-radar-health.json','utf8'));
  if(!Array.isArray(state.sources)||state.sources.length<8)errors.push('fry-radar-health.json: official source status missing');
  if(!state.news||!Number.isInteger(state.news.feedsSucceeded))errors.push('fry-radar-health.json: RSS status missing');
  if(!Number.isFinite(Date.parse(state.checkedAt)))errors.push('fry-radar-health.json: checkedAt missing');
}catch{errors.push('data/fry-radar-health.json: missing or invalid JSON');}
if(!fs.existsSync('404.html'))errors.push('Missing 404.html');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`Site check passed: ${htmlFiles.length} pages, ${count} quiz questions, local assets and JavaScript syntax`);
