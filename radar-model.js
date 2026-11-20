(()=>{
  'use strict';
  const brands={'맥도날드':/맥도날드|맥런치|mcdonald/i,'롯데리아':/롯데리아|롯데잇츠|lotteria/i,'버거킹':/버거킹|burger king/i,'맘스터치':/맘스터치|mom.?s touch/i,'KFC':/\bKFC\b|케이에프씨/i,'프랭크버거':/프랭크버거|frank burger/i,'노브랜드버거':/노브랜드\s*버거|no brand burger/i,'쉐이크쉑':/쉐이크쉑|shake shack/i,'파이브가이즈':/파이브\s*가이즈|five guys/i,'파파이스':/파파이스|popeyes/i,'다운타우너':/다운타우너|downtowner/i,'바스버거':/바스버거|bas burger/i};
  const brandNames=item=>Object.entries(brands).filter(([,re])=>re.test([item.source,item.title,item.brand].join(' '))).map(([name])=>name);
  const day=value=>{
    if(!value)return null;
    if(/^\d{4}-\d{2}-\d{2}$/.test(value)){
      const t=Date.parse(value+'T00:00:00Z');return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===value?value:null;
    }
    const d=new Date(value);return Number.isFinite(d.getTime())?new Date(d.getTime()+9*3600000).toISOString().slice(0,10):null;
  };
  const daysLeft=(item,now=Date.now())=>{
    const end=day(item.eventEnd),today=day(new Date(now).toISOString());
    return end&&today&&item.eventStatus!=='ended-early'?(Date.parse(end)-Date.parse(today))/86400000:null;
  };
  const offer=item=>{
    if(item.category!=='discount')return null;
    const matches=[...String(item.summary||'').matchAll(/(\d[\d,]*)\s*원\s*(?:→|에서|->)\s*(\d[\d,]*)\s*원/g)];
    if(matches.length!==1)return null;
    const [,a,b]=matches[0],original=Number(a.replace(/,/g,'')),sale=Number(b.replace(/,/g,''));
    if(!Number.isSafeInteger(original)||!Number.isSafeInteger(sale)||original<=sale||sale<0)return null;
    return {original,sale,saving:original-sale,percent:Math.round((original-sale)*100/original)};
  };
  const isNew=(item,since)=>Number.isFinite(since)&&since>0&&Date.parse(item.collectedAt||'')>since;
  const escape=value=>String(value??'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
  const nextDay=d=>new Date(Date.parse(d)+86400000).toISOString().slice(0,10);
  const fold=line=>{let result='',bytes=0;for(const char of line){const n=new TextEncoder().encode(char).length;if(bytes+n>75){result+='\r\n ';bytes=1;}result+=char;bytes+=n;}return result;};
  const calendar=(item,now=Date.now())=>{
    const end=day(item.eventEnd),start=day(item.eventStart)||end;
    if(!start||!end||start>end||item.eventStatus==='ended-early'||daysLeft(item,now)<0)return null;
    const compact=x=>x.replace(/-/g,'');
    return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//GAMTTIZ//Fry Rader//KO','CALSCALE:GREGORIAN','BEGIN:VEVENT',
      'UID:'+escape(String(item.id).replace(/[^a-zA-Z0-9_-]/g,''))+'@gamttiz',
      'DTSTAMP:'+new Date(now).toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z'),
      'DTSTART;VALUE=DATE:'+compact(start),'DTEND;VALUE=DATE:'+compact(nextDay(end)),
      'SUMMARY:'+escape(item.title),'DESCRIPTION:'+escape('공식 원문에서 행사 조건을 확인하세요. '+item.url),'END:VEVENT','END:VCALENDAR'].map(fold).join('\r\n')+'\r\n';
  };
  globalThis.GTZRadarModel=Object.freeze({brands:Object.keys(brands),brandNames,day,daysLeft,offer,isNew,calendar});
})();