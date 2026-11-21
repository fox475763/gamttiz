/* Scroll-linked home choreography; no scroll hijacking, no cloned content. */
(()=>{
  'use strict';
  const body=document.body,main=document.getElementById('main');
  const opening=main?.querySelector('.cinema-opening'),hero=opening?.querySelector('.hero');
  if(!body.classList.contains('home-cinema')||!opening||!hero)return;
  const header=document.querySelector('.header');
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const nodes=[...main.querySelectorAll('#collection,.story-row,#holder,.home-package,#experiences,#fry-radar-preview,.home-news,#guide,#contact,.social')];
  const scenes=nodes.map(element=>({element,top:0,height:0,key:'',near:false}));
  let viewport=0,openingTop=0,heroHeight=0,runway=0,headerHeight=0,active=false,raf=0,needsMeasure=true,heroKey='',heroNear=false;
  const clamp=(x)=>Math.min(1,Math.max(0,x));
  const ease=(x)=>{x=clamp(x);return x*x*(3-2*x);};
  const write=(el,props)=>{for(const [key,value] of Object.entries(props))el.style.setProperty(key,value);};
  function measure(){
    const y=window.scrollY;
    viewport=window.innerHeight;headerHeight=header?.offsetHeight||0;
    openingTop=opening.getBoundingClientRect().top+y;
    heroHeight=hero.offsetHeight;
    // Pin only if BOTH columns fit under the existing header. Small/mobile
    // screens never pin a tall image/text stack or hide a navigation link.
    const pin=window.innerWidth>900&&heroHeight<=viewport-headerHeight+3;
    const nextRunway=pin?Math.round(Math.min(300,Math.max(150,viewport*.31))):0;
    if(nextRunway!==runway||opening.classList.contains('is-pinned')!==pin){
      runway=nextRunway;opening.classList.toggle('is-pinned',pin);
      // The wrapper's additional runway shifts later scenes, so measure
      // their normal document geometry only after this single layout change.
    }
    write(opening,{'--cinema-header':headerHeight+'px','--cinema-hero-height':heroHeight+'px','--cinema-runway':runway+'px'});
    for(const scene of scenes){
      const rect=scene.element.getBoundingClientRect();
      scene.top=rect.top+y;scene.height=rect.height;scene.key='';
    }
    heroKey='';needsMeasure=false;
  }
  function render(){
    raf=0;
    if(!active||document.hidden||document.documentElement.classList.contains('gtz-wallet-open'))return;
    if(needsMeasure)measure();
    const y=window.scrollY,mobile=window.innerWidth<=600;
    const nearOpening=y<=openingTop+heroHeight+runway&&y+viewport>=openingTop;
    if(nearOpening!==heroNear){heroNear=nearOpening;opening.classList.toggle('cinema-in-view',heroNear);}
    if(nearOpening){
      const progress=ease((y+headerHeight-openingTop)/Math.max(1,runway||heroHeight*.7));
      const p=Math.round(progress*1000)/1000;
      const key=String(p);
      if(key!==heroKey){
        heroKey=key;
        write(hero,{'--cinema-hero-copy':Math.round(-p*(mobile?10:36))+'px','--cinema-hero-poster':Math.round(p*(mobile?6:16))+'px','--cinema-hero-scale':(1+p*(mobile?.025:.065)).toFixed(3),'--cinema-hero-opacity':(1-p*.12).toFixed(3),'--cinema-hero-pattern':Math.round(p*38)+'px'});
      }
    }
    for(const scene of scenes){
      const top=scene.top-y,bottom=top+scene.height;
      const near=top<viewport*1.1&&bottom>0;
      if(near!==scene.near){scene.near=near;scene.element.classList.toggle('cinema-in-view',near);}
      // Resolve offscreen scenes to their proper entry/exit states too,
      // so returning up the page feels exactly like reversing the film.
      const entry=ease((viewport*.94-top)/Math.max(1,Math.min(scene.height*.65,viewport*.55)));
      const center=clamp((viewport-top)/(viewport+scene.height));
      const e=Math.round(entry*100)/100,c=Math.round(center*100)/100;
      const key=e+'|'+c+'|'+mobile;
      if(key===scene.key)continue;
      scene.key=key;
      const delay=1-e,depth=(.5-c)*(mobile?18:34);
      const direction=scene.element.classList.contains('reverse')?-1:1;
      const imageX=Math.round(-delay*(mobile?0:22)*direction),copyX=Math.round(delay*(mobile?0:15)*direction);
      write(scene.element,{
        '--cinema-lift':Math.round(delay*(mobile?14:30))+'px',
        '--cinema-deep-lift':Math.round(delay*(mobile?23:49))+'px',
        '--cinema-opacity':(.80+.20*e).toFixed(2),
        '--cinema-image-opacity':(.86+.14*e).toFixed(2),
        '--cinema-image-y':Math.round(delay*(mobile?13:22)+depth)+'px',
        '--cinema-image-x':imageX+'px','--cinema-copy-x':copyX+'px',
        '--cinema-image-scale':(.955+.045*e).toFixed(3)
      });
    }
  }
  function schedule(layout=false){
    if(layout)needsMeasure=true;
    if(active&&!raf)raf=requestAnimationFrame(render);
  }
  function sync(){
    active=!preference.matches;
    body.classList.toggle('is-cinematic',active);
    if(!active){
      if(raf)cancelAnimationFrame(raf);raf=0;opening.classList.remove('is-pinned','cinema-in-view');opening.removeAttribute('style');
      for(const scene of scenes){scene.element.classList.remove('cinema-in-view');scene.near=false;}
      heroNear=false;heroKey='';runway=0;return;
    }
    schedule(true);
  }
  window.addEventListener('scroll',()=>schedule(),{passive:true});
  window.addEventListener('resize',()=>schedule(true),{passive:true});
  window.addEventListener('pageshow',()=>schedule(true));
  document.addEventListener('visibilitychange',()=>schedule(true));
  if(preference.addEventListener)preference.addEventListener('change',sync);
  else preference.addListener?.(sync);
  if('ResizeObserver' in window){
    const observer=new ResizeObserver(()=>schedule(true));
    [main,hero,header,...nodes].filter(Boolean).forEach(el=>observer.observe(el));
  }
  document.fonts?.ready.then(()=>schedule(true));
  sync();
})();