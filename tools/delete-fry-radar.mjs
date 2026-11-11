import fs from 'node:fs/promises';
import {canonical} from './fry-radar-common.mjs';
import {approvedDeletionRequest} from './fry-delete-common.mjs';

const repo=process.env.GITHUB_REPOSITORY||'';
const actor=process.env.REQUEST_ACTOR||'';
const author=process.env.REQUEST_AUTHOR||'';
const title=process.env.REQUEST_TITLE||'';
const body=process.env.REQUEST_BODY||'';
const id=approvedDeletionRequest({repo,actor,author,title,body});
if(!id)throw Error('An authorized GitHub repository owner and a valid selection are required.');
const dataPath=new URL('../data/fry-radar.json',import.meta.url);
const blockedPath=new URL('../data/fry-radar-blocked.json',import.meta.url);
const data=JSON.parse(await fs.readFile(dataPath,'utf8'));
const posts=Array.isArray(data.items)?data.items:[];
const post=posts.find(p=>p.id===id);
if(!post)throw Error('Post not found: '+id);
let blocked={items:[]};
try{blocked=JSON.parse(await fs.readFile(blockedPath,'utf8'));}catch{}
if(!Array.isArray(blocked.items))blocked.items=[];
const url=canonical(post.url);
if(!blocked.items.some(x=>x.id===id||x.url===url)){
  blocked.items.push({id,url,removedAt:new Date().toISOString(),title:post.title});
}
data.items=posts.filter(p=>p.id!==id);
data.updatedAt=new Date().toISOString();
await fs.writeFile(dataPath,JSON.stringify(data,null,2)+'\n');
await fs.writeFile(blockedPath,JSON.stringify(blocked,null,2)+'\n');
console.log('Removed and permanently suppressed post id '+id);
