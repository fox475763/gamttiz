/* GAMTTIZ home cinematic scroll. Progressive enhancement: all original sections,
   links, carousels and layout remain untouched. No forced scrolling. */
(()=>{
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 if(reduced.matches||!('requestAnimationFrame'in window))return;
 const start=()=>{
  const selectors=[
   ['.hero .hero-copy','heroText'],['.hero .hero-poster','heroImage'],
   ['#collection>.section-heading','text'],
   ['#about .story-row .story-image','image'],
   ['#about .story-row .story-copy','text'],
   ['#holder .holder-image','image'],['#holder .holder-copy','text'],
   ['.home-package .home-package-image','image'],['.home-package .home-package-copy','text'],
   ['#experiences .experience-intro','text'],
   ['#fry-radar-preview .radar-preview-heading','text'],
   ['.home-news','text'],['#guide>h2','text'],['#contact>div','text'],['.social>h2','text']
  ];
  const targets=selectors.flatMap(([selector,type])=>Array.from(document.querySelectorAll(selector),el=>({el,type})));
  if(!targets.length)return;
  let frame=0;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const update=()=>{
   frame=0;const h=innerHeight;const mobile=innerWidth<681;
   for(const {el,type} of targets){
    const r=el.getBoundingClientRect();
    if(r.bottom< -h*.3||r.top>h*1.5)continue;
    const t=clamp((h-r.top)/(h+r.height),0,1);
    const entrance=clamp(t/.36,0,1);
    const eased=entrance*entrance*(3-2*entrance);
    let y=0,scale=1,opacity=1;
    if(type==='heroText'){const p=clamp(-r.top/(h*.85),0,1);y=-p*(mobile?10:24);opacity=1-p*.08;}
    else if(type==='heroImage'){const p=clamp(-r.top/(h*.9),0,1);y=-p*(mobile?10:22);scale=1+p*(mobile?.015:.035);}
    else if(type==='image'){y=(.5-t)*(mobile?12:30);scale=mobile?1:1+(.5-t)*.035;}
    else{y=(1-eased)*(mobile?9:16);opacity=.87+.13*eased;}
    el.style.setProperty('--cinema-y',y.toFixed(2)+'px');
    el.style.setProperty('--cinema-scale',scale.toFixed(4));
    el.style.setProperty('--cinema-opacity',opacity.toFixed(3));
   }
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};
  document.documentElement.classList.add('gtz-cinema-ready');
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('pageshow',schedule);
  reduced.addEventListener?.('change',()=>{if(reduced.matches){document.documentElement.classList.remove('gtz-cinema-ready')}else{document.documentElement.classList.add('gtz-cinema-ready');schedule()}});
  schedule();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
