/* Cinematic scroll chapter, confined to the homepage; no scroll hijacking. */
(()=>{
 'use strict';
 const init=()=>{
  const hero=document.querySelector('main .hero');if(!hero||document.querySelector('.gtz-cinema-chapter'))return;
  const chapter=document.createElement('section');chapter.className='gtz-cinema-chapter';chapter.setAttribute('aria-label','감띠즈 시네마틱 브랜드 이야기');
  chapter.innerHTML='<div class="gtz-cinema-sticky"><div class="gtz-cinema-orbit" aria-hidden="true"></div><div class="gtz-cinema-content"><p class="gtz-cinema-kicker">GAMTTIZ · FRENCH FRY LOVERS</p><h2 class="gtz-cinema-title">SMALL FRIES.<span>BIG STORIES.</span></h2><p class="gtz-cinema-subtitle">작은 감자튀김에서 시작된, 저마다 다른 14가지 이야기.</p></div><span class="gtz-cinema-counter" aria-hidden="true">01 — 14</span><span class="gtz-cinema-hint" aria-hidden="true">SCROLL TO EXPLORE ↓</span><div class="gtz-cinema-progress" aria-hidden="true"><span></span></div></div>';
  hero.insertAdjacentElement('afterend',chapter);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');let raf=0;
  const clamp=n=>Math.min(1,Math.max(0,n));
  const update=()=>{
   raf=0;if(reduce.matches)return;
   const rect=chapter.getBoundingClientRect();const range=Math.max(1,chapter.offsetHeight-innerHeight);
   const p=clamp(-rect.top/range);
   chapter.style.setProperty('--gtz-progress',p.toFixed(4));
   chapter.style.setProperty('--gtz-orbit-scale',(0.62+p*.85).toFixed(3));
   chapter.style.setProperty('--gtz-orbit-turn',(p*80).toFixed(1)+'deg');
   chapter.style.setProperty('--gtz-orbit-opacity',(0.28+p*.6).toFixed(3));
   chapter.style.setProperty('--gtz-glow',(0.7+p*.9).toFixed(3));
   chapter.style.setProperty('--gtz-title-scale',(0.83+p*.28).toFixed(3));
   chapter.style.setProperty('--gtz-title-y',((.5-p)*44).toFixed(1)+'px');
   chapter.style.setProperty('--gtz-title-opacity',(p<.12?.65+p/.12*.35:p>.82?1-(p-.82)/.18*.3:1).toFixed(3));
  };
  const schedule=()=>{if(!raf)raf=requestAnimationFrame(update)};
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});addEventListener('pageshow',schedule);schedule();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
