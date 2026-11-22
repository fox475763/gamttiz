import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root=process.cwd();
const errors=[];
const htmlFiles=fs.readdirSync(root).filter(name=>name.endsWith('.html'));
for(const file of htmlFiles){
  const html=fs.readFileSync(file,'utf8');
  const ids=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
  for(const id of new Set(ids))if(ids.filter(value=>value===id).length>1)errors.push(`${file}: duplicate id ${id}`);
  if(!/<meta\s+name=["']viewport["']/i.test(html))errors.push(`${file}: missing responsive viewport`);
  for(const [,attr,target] of html.matchAll(/\b(src|href)=["']([^"']+)["']/g)){
    if(target.startsWith('#')||/^(?:https?:|mailto:|data:|javascript:|\/)/i.test(target))continue;
    const local=decodeURIComponent(target.split(/[?#]/)[0]);
    if(!local)continue;
    if(!fs.existsSync(path.join(root,local)))errors.push(`${file}: missing ${attr} ${local}`);
  }
}
for(const file of fs.readdirSync(root).filter(name=>name.endsWith('.css'))){
  const css=fs.readFileSync(file,'utf8');
  for(const [,target] of css.matchAll(/url\(\s*["']?([^"'()]+)["']?\s*\)/g)){
    const local=target.trim().split(/[?#]/)[0];
    if(!local||/^(?:https?:|data:|\/)/i.test(local))continue;
    if(!fs.existsSync(path.join(root,decodeURIComponent(local))))errors.push(`${file}: missing CSS asset ${local}`);
  }
}
// These paths are generated at runtime rather than listed directly in HTML.
for(let i=1;i<=16;i++){
  const n=String(i).padStart(2,'0');
  for(const asset of [`assets/keyring-${n}.png`,`assets/illustrations/friend-${n}.svg`,`assets/illustrations-3d/friend-${n}.png`])if(!fs.existsSync(path.join(root,asset)))errors.push(`Missing character asset ${asset}`);
}
for(const file of fs.readdirSync(root).filter(name=>name.endsWith('.js'))){
  try{execFileSync(process.execPath,['--check',path.join(root,file)],{stdio:'pipe'});}catch(error){errors.push(`${file}: JavaScript syntax error\n${error.stderr?.toString()||''}`);}
}
for(const file of fs.readdirSync(path.join(root,'tools')).filter(name=>name.endsWith('.mjs')).map(name=>'tools/'+name)){
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
try{execFileSync(process.execPath,['--test',path.join(root,'tools/check-member.mjs')],{stdio:'inherit'});}catch{errors.push('Member feature tests failed');}
try{execFileSync(process.execPath,['--test',path.join(root,'tools/check-shake.mjs')],{stdio:'inherit'});}catch{errors.push('Shake preference tests failed');}
try{execFileSync(process.execPath,['--test',path.join(root,'tools/check-license.mjs')],{stdio:'inherit'});}catch{errors.push('License image rendering tests failed');}
try{execFileSync(process.execPath,['--test',path.join(root,'tools/check-radar-ui.mjs')],{stdio:'inherit'});}catch{errors.push('Radar UI tests failed');}
try{execFileSync(process.execPath,['--test',path.join(root,'tools/check-friends.mjs')],{stdio:'inherit'});}catch{errors.push('Friends experience tests failed');}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`Site check passed: ${htmlFiles.length} pages, ${count} quiz questions, local assets and JavaScript syntax`);
