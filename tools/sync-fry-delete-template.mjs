import fs from 'node:fs/promises';
import {renderDeleteForm} from './fry-delete-common.mjs';
const file=new URL('../data/fry-radar.json',import.meta.url);
const template=new URL('../.github/ISSUE_TEMPLATE/fry-delete.yml',import.meta.url);
const raw=JSON.parse(await fs.readFile(file,'utf8'));
const next=renderDeleteForm(raw.items||[]);
let previous='';try{previous=await fs.readFile(template,'utf8')}catch{}
if(previous!==next){await fs.writeFile(template,next);console.log('[FRY RADAR] Delete form updated for '+(raw.items||[]).length+' posts');}
else console.log('[FRY RADAR] Delete form already up to date');
