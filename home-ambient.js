/* Kinetic silk is rendered offline. A single muted, hardware-decoded
   loop keeps the background fixed and scrolling independent of rendering. */
(() => {
  'use strict';
  const host=document.querySelector('.home-ambient');
  if(!host)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const portrait=matchMedia('(orientation: portrait)');
  const video=document.createElement('video');
  video.defaultMuted=video.muted=true;video.playsInline=true;
  video.loop=true;video.preload='none';video.disablePictureInPicture=true;
  video.setAttribute('muted','');video.setAttribute('playsinline','');
  video.setAttribute('aria-hidden','true');
  host.append(video);
  let source='';
  const sync=()=>{
    if(document.hidden||reduced.matches){
      video.pause();
      if(reduced.matches)host.classList.remove('is-live');
      return;
    }
    const next='assets/home-silk-motion'+(portrait.matches?'-portrait':'')+'.mp4?v=20261121silk1';
    if(source!==next){
      source=next;host.classList.remove('is-live');video.src=next;
    }
    video.play().catch(()=>{/* The poster motion stays active until autoplay is allowed. */});
  };
  video.addEventListener('playing',()=>{if(!reduced.matches)host.classList.add('is-live')});
  video.addEventListener('error',()=>host.classList.remove('is-live'));
  document.addEventListener('visibilitychange',sync);
  for(const query of [reduced,portrait]){
    if(query.addEventListener)query.addEventListener('change',sync);else query.addListener(sync);
  }
  // iOS low-power/autoplay restrictions: retry once at the first real gesture.
  addEventListener('pointerdown',sync,{once:true,passive:true});
  sync();
})();
