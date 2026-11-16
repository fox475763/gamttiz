import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export function collectionDue(schedule,lastCompletedAt,now=Date.now()){
  if(schedule!=='47 * * * *')return true;
  const age=now-Date.parse(lastCompletedAt||'');
  return !Number.isFinite(age)||age<0||age>=75*60*1000;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  let health={};try{health=JSON.parse(await fs.readFile(new URL('../data/fry-radar-health.json',import.meta.url),'utf8'));}catch{}
  console.log('run='+collectionDue(process.env.RADAR_SCHEDULE,health.lastCompletedAt));
}
