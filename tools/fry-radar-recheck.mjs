import {cleanText,dateRange,dateOnly} from './fry-radar-common.mjs';

function anchoredRange(text,priorStart){
  if(!dateOnly(priorStart))return null;
  const year=Number(priorStart.slice(0,4)),ranges=[];
  for(const m of text.matchAll(/(?<![\d.])(\d{1,2})[/.](\d{1,2})(?:\s*\([월화수목금토일]\))?\s*[~～]\s*(\d{1,2})[/.](\d{1,2})(?:\s*\([월화수목금토일]\))?/g)){
    const endYear=year+(Number(m[3])<Number(m[1])?1:0);
    const start=dateOnly(`${year}.${m[1]}.${m[2]}`),end=dateOnly(`${endYear}.${m[3]}.${m[4]}`);
    // A yearless range can revise an already-known event, never invent a new one.
    if(start===priorStart&&end&&start<=end)ranges.push({eventStart:start,eventEnd:end});
  }
  const unique=[...new Map(ranges.map(r=>[JSON.stringify(r),r])).values()];
  return unique.length===1?unique[0]:null;
}

// Only a clearly scoped article may change a stored event. Access failures and
// generic shell pages must never be interpreted as a campaign's termination.
export function eventEvidence(html,url=''){
  const safe=String(html).replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,' ');
  let scoped=safe.match(/<(article|main)\b[^>]*>([\s\S]*?)<\/\1>/i)?.[2];
  // Older official templates use div containers rather than article/main.
  // Parse balanced divs, restricted to the known detail template and host.
  const host=(()=>{try{return new URL(url).hostname;}catch{return '';}})();
  const detailClass=/(^|\.)lotteeatz\.com$/.test(host)?'board-detail-wrap':/(^|\.)kfckorea\.com$/.test(host)?'contents':null;
  if(!scoped&&detailClass){
    const tags=/<\/?div\b[^>]*>/gi;let start=-1,depth=0;
    for(const tag of safe.matchAll(tags)){
      if(start<0){
        const classes=tag[0].match(/\bclass=["']([^"']*)["']/i)?.[1]?.split(/\s+/)||[];
        if(!tag[0].startsWith('</')&&classes.includes(detailClass)){start=tag.index+tag[0].length;depth=1;}
      }else{
        depth+=tag[0].startsWith('</')?-1:1;
        if(depth===0){scoped=safe.slice(start,tag.index);break;}
      }
    }
  }
  if(!scoped)return null;
  const text=cleanText(scoped.replace(/<(script|style|nav|footer|header)\b[^>]*>[\s\S]*?<\/\1>/gi,' '));
  const ranges=[...text.matchAll(/20\d{2}[-./년]\s*\d{1,2}[-./월]\s*\d{1,2}(?:일)?\s*(?:~|～|–|—|부터|\s-\s)\s*20\d{2}[-./년]\s*\d{1,2}[-./월]\s*\d{1,2}(?:일)?/g)].map(m=>dateRange(m[0])).filter(Boolean);
  const unique=[...new Map(ranges.map(r=>[JSON.stringify(r),r])).values()];
  const ended=/(?:본|해당|이번)\s*(?:행사|이벤트|프로모션)[은는이가]?\s*(?:조기\s*)?종료(?:되었습니다|됐습니다|되었음을)|(?:조기\s*종료|행사\s*종료)\s*(?:안내|공지)/.test(text);
  return {text,range:unique.length===1?unique[0]:null,ended};
}

export function reconcileEvent(item,evidence,checkedAt){
  item.lastCheckedAt=checkedAt;
  if(!evidence){item.recheckStatus='unconfirmed';return false;}
  // Require the event's own title in the scoped content, excluding appended
  // editorial date notes. Unrelated redirects cannot revise another event.
  const title=cleanText(item.sourceTitle||item.title).split(/\s*[—|｜]|\s*\(/)[0];
  const tokens=[...new Set(title.match(/[가-힣a-zA-Z]{3,}/g)||[])].filter(t=>!['감자튀김','이벤트','프로모션','콜라보','공식','할인','출시'].includes(t));
  const identity=evidence.text.includes(title)||(tokens.length>=2&&tokens.filter(t=>evidence.text.includes(t)).length>=2);
  if(title.length<6||!identity){item.recheckStatus='unconfirmed';return false;}
  const range=evidence.range||anchoredRange(evidence.text,item.eventStart);
  item.recheckStatus=range||evidence.ended?'verified':'identity-only';
  const before={eventStart:item.eventStart||null,eventEnd:item.eventEnd||null,eventStatus:item.eventStatus||null};
  if(range)Object.assign(item,range);
  if(evidence.ended)item.eventStatus='ended-early';
  const after={eventStart:item.eventStart||null,eventEnd:item.eventEnd||null,eventStatus:item.eventStatus||null};
  if(JSON.stringify(before)===JSON.stringify(after))return false;
  item.eventUpdatedAt=checkedAt;
  item.eventChanges=[...(item.eventChanges||[]),{at:checkedAt,before,after,source:item.url}].slice(-12);
  return true;
}
