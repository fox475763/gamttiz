import fs from 'node:fs/promises';
import {canonical} from './fry-radar-common.mjs';

const repo=process.env.GITHUB_REPOSITORY||'';
const actor=process.env.REQUEST_ACTOR||'';
const author=process.env.REQUEST_AUTHOR||'';
const title=process.env.REQUEST_TITLE||'';
const body=process.env.REQUEST_BODY||'';
if(repo!=='fox475763/gamttiz'||actor!=='fox475763'||author!=='fox475763')throw Error('Only the verified repository owner may delete Fry Radar posts.');
if(!title.startsWith('[FRY DELETE]'))throw Error('Unexpected issue title');
const id=body.match(/^POST_ID:\s*([a-zA-Z0-9_-]{5,100})\s*$/m)?.[1];
if(!id)throw Error('Missing or invalid POST_ID.');
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
