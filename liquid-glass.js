/* One reference optical material for the dock and all opted-in site surfaces.
   Native SVG displacement on Chromium; a narrow sampled Canvas2D rim on Safari.
   Only visible surfaces are rendered. The menu's specialized animation is untouched. */
(()=>{
  'use strict';
  const selector=".control-trigger,.control-search,.control-search-results,.control-contact,.control-contact-links > :is(a,button),.control-result,.member-page .radar-tool .radar-glass-field,.member-page .radar-tool .radar-filter-panel,.license-page.has-license:not(.license-wallet-view) .license-member-link";
  const reduced=matchMedia('(prefers-reduced-transparency: reduce)');
  const standaloneIOS=(navigator.standalone===true||matchMedia('(display-mode: standalone)').matches)&&
    (/iPhone|iPad|iPod/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1));
  const native=/(?:Chrome|Chromium|Edg|OPR)\//.test(navigator.userAgent)&&!/Android|iPhone|iPad|iPod|Mobile/.test(navigator.userAgent)&&CSS.supports('backdrop-filter','url(#gtz-liquid-test)');
  const tracked=new Map(),visible=new Set(),filterCache=new Map(),ns='http://www.w3.org/2000/svg';
  let svg=null,source=null,ctx=null,frame=0,last=0,cursor=0,serial=0;
  const walletOpen=()=>!!document.documentElement?.classList?.contains('gtz-wallet-open');
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
    for(const entry of entries){const el=entry.target;el.classList.toggle('gtz-liquid-visible',entry.isIntersecting);if(entry.isIntersecting)visible.add(el);else visible.delete(el);}
    schedule();
  },{threshold:.01}):null;
  const resize='ResizeObserver' in window?new ResizeObserver(()=>schedule()):null;
  function add(el){
    // Keep the full optical glass face on iOS Home Screen Menu; only suppress
    // the fragile sampled canvas pass later. The real WebKit backdrop stays live.
    if(el.closest('.gtz-liquid-optics'))return;
    let state=tracked.get(el);
    if(state&&state.layer.isConnected)return;
    const layer=Array.from(el.children).find(child=>child.classList.contains('gtz-liquid-optics'))||document.createElement('span');layer.className='gtz-liquid-optics';layer.setAttribute('aria-hidden','true');
    el.classList.add('gtz-liquid-surface');
    if(getComputedStyle(el).position==='static')el.classList.add('gtz-liquid-relative');
    if(el.matches('button,a,.dex-search,.dex-sort,.radar-glass-field,.license-friend'))el.dataset.glassControl='';
    if(layer.parentNode!==el)el.prepend(layer);state={layer,canvas:null,key:''};tracked.set(el,state);
    if(observer)observer.observe(el);else{visible.add(el);el.classList.add('gtz-liquid-visible');}
    resize?.observe(el);
  }
  function scan(root){
    if(root.nodeType===1&&root.matches(selector))add(root);
    root.querySelectorAll?.(selector).forEach(add);
  }
  function scanRemoved(){
    for(const el of tracked.keys())if(!el.isConnected){observer?.unobserve(el);resize?.unobserve(el);visible.delete(el);tracked.delete(el);}
  }
  function radius(s,w,h){
    const v=s.borderTopLeftRadius.split(' ')[0];
    return Math.min(w/2,h/2,v.endsWith('%')?parseFloat(v)*Math.min(w,h)/100:parseFloat(v)||0);
  }
  function nativeFilter(el,state,r,style,optics){
    // Quantized element geometry keeps the optical rim ~9px thick on cards,
    // round buttons and large panels as well as the compact menu.
    const w=Math.max(4,Math.round(el.offsetWidth/4)*4),h=Math.max(4,Math.round(el.offsetHeight/4)*4),rad=Math.round(radius(style,w,h));
    const key=[w,h,rad].join(':');if(state.key===key)return;
    let id=filterCache.get(key);
    if(!id){
      const mapCanvas=document.createElement('canvas'),mw=Math.min(256,w),mh=Math.min(144,h);
      mapCanvas.width=mw;mapCanvas.height=mh;const c=mapCanvas.getContext('2d'),pixels=c.createImageData(mw,mh);
      const depth=Math.min(9.5,w*.25,h*.25);
      for(let y=0;y<mh;y++)for(let x=0;x<mw;x++){
        const [nx,ny]=optics.edgeVector((x+.5)*w/mw-w/2,(y+.5)*h/mh-h/2,w,h,rad,depth),i=4*(y*mw+x);
        pixels.data[i]=Math.max(0,Math.min(255,Math.round(128-nx*8*255/(.34*w))));
        pixels.data[i+1]=Math.max(0,Math.min(255,Math.round(128-ny*4.5*255/(.34*h))));
        pixels.data[i+2]=128;pixels.data[i+3]=255;
      }
      c.putImageData(pixels,0,0);
      if(!svg){svg=document.createElementNS(ns,'svg');svg.setAttribute('width','0');svg.setAttribute('height','0');svg.setAttribute('aria-hidden','true');svg.style.cssText='position:absolute;pointer-events:none;overflow:hidden';document.body.append(svg);}
      id='gtz-liquid-refraction-'+(++serial);
      const f=document.createElementNS(ns,'filter'),im=document.createElementNS(ns,'feImage'),disp=document.createElementNS(ns,'feDisplacementMap');
      const set=(e,o)=>Object.entries(o).forEach(([k,v])=>e.setAttribute(k,v));
      set(f,{id,filterUnits:'objectBoundingBox',primitiveUnits:'objectBoundingBox',x:'-.15',y:'-.25',width:'1.3',height:'1.5','color-interpolation-filters':'sRGB'});
      const href=mapCanvas.toDataURL('image/png');set(im,{x:0,y:0,width:1,height:1,preserveAspectRatio:'none',result:'lens',href});im.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href',href);
      set(disp,{in:'SourceGraphic',in2:'lens',scale:'.34',xChannelSelector:'R',yChannelSelector:'G',x:0,y:0,width:1,height:1});
      f.append(im,disp);svg.append(f);filterCache.set(key,id);
      // Only retire unused filters; animated transforms keep offset sizes stable.
      if(filterCache.size>90)for(const [k,oldId] of filterCache){if(k!==key&&![...tracked.values()].some(v=>v.key===k)){document.getElementById(oldId)?.remove();filterCache.delete(k);if(filterCache.size<=70)break;}}
    }
    state.layer.style.setProperty('--gtz-liquid-filter','url(#'+id+') blur(1.25px) saturate(1.04)');state.key=key;
  }
  // A native transparent backdrop remains live at display refresh rate.
  // Never translate an old DOM sample across scrolling content: WebKit's
  // asynchronously scrolled, fixed and transformed layers do not share one
  // scroll offset. Idle rim sampling is deliberately separate from scrolling.
  function snapshot(el,state,r,optics,now){
    const margin=12,left=Math.floor(r.left-margin),top=Math.floor(r.top-margin),right=Math.ceil(r.right+margin),bottom=Math.ceil(r.bottom+margin);
    const w=right-left,h=bottom-top;if(w<2||h<2||w*h>600000)return null;
    const b={left,top,right,bottom};
    if(!source){source=document.createElement('canvas');ctx=source.getContext('2d',{willReadFrequently:true});}
    if(!ctx)return null;
    if(source.width!==w||source.height!==h){source.width=w;source.height=h;}
    ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.setTransform(1,0,0,1,-left,-top);
    const root=getComputedStyle(document.documentElement).backgroundColor;if(root!=='rgba(0, 0, 0, 0)'&&root!=='transparent'){ctx.fillStyle=root;ctx.fillRect(left,top,w,h);}
    const dock=document.querySelector('.control-dock'),scrim=document.querySelector('.control-scrim'),inDock=!!el.closest('.control-dock');
    optics.paintBackdrop(ctx,b,node=>node===el||node===dock||node===scrim);
    if(inDock&&scrim?.classList.contains('is-open')){ctx.fillStyle=getComputedStyle(scrim).backgroundColor;ctx.fillRect(left,top,w,h);}
    return {data:ctx.getImageData(0,0,w,h).data,left,top,w,h,time:now,mode:dock?.dataset.mode||''};
  }
  function canvasFilter(el,state,r,style,optics,now){
    if(r.width*r.height>500000)return;
    const sample=snapshot(el,state,r,optics,now);if(!sample)return;
    const {data,w,h,left,top}=sample;
    const cw=Math.max(1,Math.ceil(r.width)),ch=Math.max(1,Math.ceil(r.height));
    if(!state.canvas){state.canvas=document.createElement('canvas');state.canvas.setAttribute('aria-hidden','true');state.layer.prepend(state.canvas);}
    const canvas=state.canvas,output=canvas.getContext('2d');if(!output)return;
    if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;state.output=null;}
    const img=state.output||(state.output=output.createImageData(cw,ch)),dst=img.data;dst.fill(0);
    const rad=radius(style,r.width,r.height),depth=Math.min(9.5,r.width*.25,r.height*.25);
    const trigger=el.classList.contains('control-trigger'),horizontal=trigger?3.8:6,vertical=trigger?2.2:3.4;
    for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
      const px=x+.5-r.width/2,py=y+.5-r.height/2;
      if(Math.abs(px)<r.width/2-rad&&Math.abs(py)<r.height/2-depth)continue;
      const [nx,ny]=optics.edgeVector(px,py,r.width,r.height,rad,depth),strength=Math.hypot(nx,ny);
      if(strength<.005)continue;
      const bx=x+r.left-left,by=y+r.top-top;
      if(bx<1||by<1||bx>=w-1||by>=h-1)continue;
      const sx=Math.max(0,Math.min(w-1.001,bx-nx*horizontal)),sy=Math.max(0,Math.min(h-1.001,by-ny*vertical));
      const ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy,a=4*(iy*w+ix),i=4*(y*cw+x),base=4*(Math.floor(by)*w+Math.floor(bx));let diff=0;
      for(let k=0;k<3;k++){const v=(data[a+k]*(1-fx)+data[a+4+k]*fx)*(1-fy)+(data[a+4*w+k]*(1-fx)+data[a+4*w+4+k]*fx)*fy;dst[i+k]=v;diff=Math.max(diff,Math.abs(v-data[base+k]));}
      dst[i+3]=Math.round((trigger?145:200)*Math.min(1,diff/8)*Math.min(1,strength*2.6));
    }
    output.putImageData(img,0,0);canvas.setAttribute('data-lens-ready','');
  }
  function isActive(el){
    if(!el.isConnected||!el.getClientRects().length)return false;
    const dock=el.closest('.control-dock');
    if(dock&&el!==dock.querySelector('.control-trigger')&&el.closest('[aria-hidden="true"]'))return false;
    if(!native&&document.querySelector('.control-dock[data-mode="menu"]')&&(!dock||el.classList.contains('control-trigger')))return false;
    return true;
  }
  let moving=false,settleTimer=0,idleTimer=0;
  function suspendRims(){
    if(native||reduced.matches)return;
    if(!moving){
      moving=true;document.documentElement.classList.add('gtz-liquid-scrolling');
      if(frame)cancelAnimationFrame(frame);frame=0;
      clearTimeout(idleTimer);idleTimer=0;
      for(const state of tracked.values())state.canvas?.removeAttribute('data-lens-ready');
    }
    clearTimeout(settleTimer);settleTimer=setTimeout(resumeRims,220);
  }
  function resumeRims(){
    if(document.body.classList.contains('home-native-moving')||window.GTZHomeMotion?.scrolling){
      settleTimer=setTimeout(resumeRims,100);return;
    }
    moving=false;settleTimer=0;
    // Each rim stays invisible until it receives a new complete pixel buffer.
    document.documentElement.classList.remove('gtz-liquid-scrolling');
    schedule();
  }
  function render(now){
    frame=0;if(document.hidden||walletOpen()||reduced.matches||!visible.size||moving)return;
    if(!native&&(document.body.classList.contains('home-native-moving')||window.GTZHomeMotion?.scrolling)){suspendRims();return;}
    const optics=window.GAMTTIZGlassOptics;if(!optics)return;
    const active=[...visible].filter(isActive);if(!active.length)return;
    // No DOM rasterization at 60Hz. Refresh just one visible idle rim per
    // timer tick, prioritizing the small floating Menu. Actual background
    // transparency and sheen are handled by the native compositor.
    const trigger=active.find(el=>el.classList.contains('control-trigger')),others=active.filter(el=>el!==trigger),turn=cursor++;
    const batch=native?active:active.length?[trigger&&(!others.length||turn%2===0)?trigger:others[(trigger?Math.floor(turn/2):turn)%others.length]]:[];
    const began=performance.now();
    for(const el of batch){
      const state=tracked.get(el),r=el.getBoundingClientRect(),style=getComputedStyle(el);
      if(!state||r.width<2||r.height<2||style.visibility==='hidden'||Number(style.opacity)<.05)continue;
      // iOS installed apps can evict sampled pixels after scene navigation.
      // Retain the canonical blur/sheen/rim on the trigger without Canvas2D.
      if(el.classList.contains('control-trigger')&&(standaloneIOS||(document.body.classList.contains('license-page')&&matchMedia('(pointer:coarse)').matches)))continue;
      try{if(native)nativeFilter(el,state,r,style,optics);else canvasFilter(el,state,r,style,optics,now);}catch{/* Native clear face stays visible. */}
    }
    if(!native&&!moving){
      clearTimeout(idleTimer);idleTimer=setTimeout(()=>{idleTimer=0;schedule();},Math.max(320,Math.min(950,(performance.now()-began)*16)));
    }
  }
  function schedule(){
    if(moving||frame||document.hidden||walletOpen()||reduced.matches)return;
    // Unrelated DOM edits must not bypass the mobile sampling budget.
    if(!native&&idleTimer)return;
    frame=requestAnimationFrame(render);
  }
  function syncVisibility(){
    if(document.hidden||walletOpen()){
      if(frame)cancelAnimationFrame(frame);frame=0;
      clearTimeout(idleTimer);idleTimer=0;
      for(const state of tracked.values())state.canvas?.removeAttribute('data-lens-ready');
    }else schedule();
  }
  function init(){
    scan(document);schedule();
    new MutationObserver(records=>{
      for(const record of records){for(const node of record.addedNodes)if(node.nodeType===1&&!node.matches('.gtz-liquid-optics,canvas'))scan(node);
        if(record.target.nodeType===1&&tracked.has(record.target)&&!tracked.get(record.target).layer.isConnected)add(record.target);}
      scanRemoved();schedule();
    }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-mode','aria-hidden']});
    addEventListener('resize',()=>{if(native)schedule();else suspendRims();},{passive:true});
    addEventListener('scroll',native?schedule:suspendRims,{passive:true,capture:true});
    // Touchmove is delivered before native inertial scrolling begins.
    // The home scroll-state signal also covers programmatic page transitions.
    if(!native){
      addEventListener('touchstart',event=>{if(document.body.classList.contains('home-native-touch')&&!event.target.closest?.('.control-dock'))suspendRims();},{passive:true,capture:true});
      addEventListener('touchmove',suspendRims,{passive:true,capture:true});
      document.addEventListener('gtz-home-scroll-state',()=>{if(document.body.classList.contains('home-native-moving')||window.GTZHomeMotion?.scrolling)suspendRims();else if(moving){clearTimeout(settleTimer);settleTimer=setTimeout(resumeRims,220);}});
      document.addEventListener('gtz-home-palette',()=>{if(moving)return;suspendRims();});
    }
    function releasePageFrame(){
      if(frame)cancelAnimationFrame(frame);frame=0;
      clearTimeout(idleTimer);idleTimer=0;clearTimeout(settleTimer);settleTimer=0;
      moving=false;document.documentElement.classList.remove('gtz-liquid-scrolling');
      for(const state of tracked.values())state.canvas?.removeAttribute('data-lens-ready');
    }
    addEventListener('pagehide',releasePageFrame);
    addEventListener('pageshow',()=>{releasePageFrame();scanRemoved();scan(document);syncVisibility();});

    document.addEventListener('visibilitychange',syncVisibility);document.addEventListener('gtz-wallet-visibility',syncVisibility);reduced.addEventListener?.('change',schedule);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else if(document.readyState==='interactive')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

