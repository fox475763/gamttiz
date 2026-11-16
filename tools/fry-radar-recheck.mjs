import {cleanText,dateRange} from './fry-radar-common.mjs';

// Only a clearly scoped article may change a stored event. Access failures and
// generic shell pages must never be interpreted as a campaign's termination.
export function eventEvidence(html){
  const scoped=String(html).match(/<(article|main)\b[^>]*>([\s\S]*?)<\/\1>/i)?.[2];
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
  item.recheckStatus='verified';
  const before={eventStart:item.eventStart||null,eventEnd:item.eventEnd||null,eventStatus:item.eventStatus||null};
  if(evidence.range)Object.assign(item,evidence.range);
  if(evidence.ended)item.eventStatus='ended-early';
  const after={eventStart:item.eventStart||null,eventEnd:item.eventEnd||null,eventStatus:item.eventStatus||null};
  if(JSON.stringify(before)===JSON.stringify(after))return false;
  item.eventUpdatedAt=checkedAt;
  item.eventChanges=[...(item.eventChanges||[]),{at:checkedAt,before,after,source:item.url}].slice(-12);
  return true;
}
