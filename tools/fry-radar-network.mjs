import {setTimeout as sleep} from 'node:timers/promises';

// Keep a response's body under the same deadline as its headers.
export async function fetchText(url, {timeout=10000, attempts=3, fetcher=fetch, wait=sleep}={}) {
  let last;
  for(let attempt=0;attempt<attempts;attempt++){
    let retry=true, delay=600*2**attempt;
    try{
      const r=await fetcher(url,{signal:AbortSignal.timeout(timeout),redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; GAMTTIZ-Fry-Radar/2.0)'}});
      if(!r.ok){
        retry=r.status===408||r.status===429||r.status>=500;
        const after=r.headers.get('retry-after');
        const seconds=Number(after);
        if(after)delay=Math.min(10000,Math.max(delay,Number.isFinite(seconds)?seconds*1000:Date.parse(after)-Date.now()||0));
        await r.body?.cancel();
        throw Error('HTTP '+r.status);
      }
      const text=await r.text();
      if(text.length>3_000_000){retry=false;throw Error('oversized response');}
      return {text,url:r.url||String(url),type:r.headers.get('content-type')||''};
    }catch(e){last=e;if(!retry||attempt===attempts-1)throw e;}
    await wait(delay);
  }
  throw last;
}

export async function mapLimit(values,limit,fn){
  const result=new Array(values.length);let next=0;
  await Promise.all(Array.from({length:Math.min(limit,values.length)},async()=>{
    while(next<values.length){const i=next++;result[i]=await fn(values[i],i);}
  }));
  return result;
}
