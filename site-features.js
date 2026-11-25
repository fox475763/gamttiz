(() => {
  const page = location.pathname.split('/').pop() || 'index.html';
  // iOS Home Screen apps use a separate WebKit compositor and page cache.
  // Preserve a reliable native CSS Menu control instead of canvas refraction.
  const iosStandalone = (navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches) &&
    (/iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1));
  document.documentElement.classList.toggle('gtz-ios-standalone', iosStandalone);

  if(page==='license.html'&&window.parent!==window&&new URLSearchParams(location.search).get('wallet')==='1')return;
  const pages = [
    {title:'홈', description:'감띠즈를 처음부터 둘러보기', url:'index.html', keys:'home gamttiz 감띠즈'},
    {title:'감띠즈 도감', description:'16종의 감띠와 미공개 친구들의 도감', url:'collection.html', keys:'collection dex 도감 캐릭터 키링 감띠'},
    {title:'제품 정보', description:'랜덤박스, 키링, 홀더', url:'products.html', keys:'products 랜덤박스 굿즈 제품'},
    {title:'공지', description:'감띠즈의 공식 공지와 제작·운영 소식', url:'news.html', keys:'notice news 공지 소식 게시글'},
    {title:'Fry Rader (감튀 레이더)', description:'감자튀김 할인·이벤트·굿즈 등 외부 소식', url:'member.html#radar', keys:'fry radar rader 레이더 감튀 소식 할인 이벤트'},
    {title:'감튀 취향 테스트', description:'10개의 질문으로 나의 감띠 찾기', url:'quiz.html', keys:'quiz 테스트 성향'},
    {title:'나만의 감띠 홀더', description:'감띠를 담고 3D 홀더를 돌려보기', url:'combo.html', keys:'combo 체험 3d'},
    {title:'나의 라이센스 (MY ID)', description:'나만의 감띠즈 애호가 라이센스를 발급하고 열람하기', url:'license.html', keys:'my id license 라이센스 라이선스 회원증 카드 발급'},
    {title:'오늘의 감띠 뽑기', description:'감튀 하나를 골라 오늘 함께할 감띠 만나기', url:'draw.html', keys:'daily draw 감튀 감자튀김 랜덤 뽑기 게임'},
    {title:'체험 모아보기', description:'감띠즈의 세 가지 체험', url:'play.html', keys:'play 게임'},
    {title:'Member · 멤버 전용', description:'라이센스 보유자의 감튀 레이더', url:'member.html', keys:'member 멤버 회원 감튀 레이더 웹앱'},
    {title:'프로젝트 정보', description:'기획 의도, 제작자, 디자인 정보', url:'project.html', keys:'project info 포트폴리오'}
  ];
  const names = ['감띠','뚱감띠','케이준띠','탄감띠','덜감띠','케찹 감띠','빙빙이','휜감띠','감감이와 띠띠','울룩불룩띠','웨지감띠','부스러끼','두리감띠','촉촉감띠','버터갈릭감띠','매콤감띠'];
  names.forEach((name,index) => pages.push({title:name, description:`감띠즈 ${String(index+1).padStart(2,'0')}번 친구 자세히 보기`, url:`collection.html#friend-${String(index+1).padStart(2,'0')}`, keys:`감자튀김 캐릭터 ${name}`}));
  const make = (tag, className, value) => { const el=document.createElement(tag); if(className)el.className=className; if(value)el.textContent=value; return el; };
  const header = document.querySelector('.header');
  const nav = header?.querySelector('nav[aria-label="주 메뉴"]');
  if(nav && !nav.querySelector('a[href="license.html"]')) {
    const link=make('a','','MY ID');link.href='license.html';
    const play=nav.querySelector('a[href="play.html"]');if(play)play.after(link);else nav.append(link);
  }
  if(nav && !nav.querySelector('a[href="member.html"]')) {
    const link=make('a','','Member');link.href='member.html';
    const play=nav.querySelector('a[href="play.html"]');if(play)play.after(link);else nav.append(link);
  }
  const scrim = make('div','control-scrim');
  scrim.setAttribute('aria-hidden','true');
  document.body.append(scrim);

  const dock = make('div','control-dock');
  dock.dataset.mode = 'closed';
  const trigger = make('button','control-trigger');
  trigger.type = 'button';
  trigger.setAttribute('aria-label','컨트롤 버튼: 누르면 메뉴, 길게 누르면 검색');
  trigger.setAttribute('aria-expanded','false');
  trigger.setAttribute('aria-controls','control-search control-menu control-contact');
  trigger.append(make('span','control-trigger-label','Menu'));
  // Mount the persistent navigation button before optional glass/menu effects initialize.
  // On slower mobile browsers, those effects must never delay the primary control.
  dock.append(trigger);
  document.body.append(dock);
  const search = make('section','control-search'); search.id='control-search'; search.setAttribute('aria-label','사이트 검색'); search.setAttribute('aria-hidden','true'); search.inert=true;
  const searchInput=make('input','control-search-input'); searchInput.type='search'; searchInput.placeholder='감띠즈 검색'; searchInput.autocomplete='off'; searchInput.setAttribute('aria-label','검색어');
  const searchResults=make('div','control-search-results'); searchResults.setAttribute('aria-live','polite');
  search.append(searchInput,searchResults);
  const menu=make('nav','control-menu'); menu.id='control-menu'; menu.setAttribute('aria-label','컨트롤 메뉴'); menu.setAttribute('aria-hidden','true'); menu.inert=true;
  // The invisible navigation shell is just a scrollable layout; the links are the glass.
  const menuScroll=make('div','control-panel-scroll');
  menuScroll.append(make('span','control-panel-label','GAMTTIZ / MENU'));
  menu.append(menuScroll);
  const menuLinks=make('div','control-menu-links');
  const menuTranslations={Home:'홈',Collection:'감띠즈 도감',Play:'체험',Member:'멤버 전용','MY ID':'나의 라이센스',Products:'제품',Notice:'브랜드 공지',News:'브랜드 공지','공지':'브랜드 공지','Fry Rader':'감튀 레이더','Fry Radar':'감튀 레이더','Project Info':'프로젝트 정보',Instagram:'인스타그램',Contact:'문의',Search:'검색'};
  // Decorative outline icons are embedded locally, so no icon font or extra request is needed.
  const menuIcons={
    Home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    Collection:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    Play:'<path d="M7 7h10c2 0 3.3 1.2 3.8 3.1l1 4.7a2.6 2.6 0 0 1-4.5 2.2L15 14H9l-2.3 3A2.6 2.6 0 0 1 2.2 14.8l1-4.7A3.8 3.8 0 0 1 7 7Z"/><path d="M8 9v5m-2.5-2.5h5M16 10v.1M19 12.5v.1"/>',
    Member:'<circle cx="10" cy="8" r="3.5"/><path d="M3 20v-2a7 7 0 0 1 14 0v2H3Zm14-15a3.5 3.5 0 0 1 0 7m2 2a5 5 0 0 1 2 4v2"/>',
    'MY ID':'<rect x="2.5" y="5" width="19" height="14" rx="2"/><circle cx="8" cy="10" r="2"/><path d="M4.5 16a3.5 3.5 0 0 1 7 0M14 10h4.5M14 14h4.5"/>',
    Products:'<path d="m3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v10M7.5 5 16.5 9"/>',
    Notice:'<path d="M4 10h5l10-5v14L9 14H4a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2Zm2 4 2 6h3l-2-6M21 10v4"/>',
    'Project Info':'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    Instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    Contact:'<path d="M20 16a2 2 0 0 1-2 2H9l-5 3V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/><path d="M8 9h8m-8 4h5"/>',
    Search:'<circle cx="10.8" cy="10.8" r="6.2"/><path d="m15.5 15.5 5 5"/>',
    'Fry Rader':'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12 18.4 5.6M12 12h.01"/>'
  };
  const addMenuSubtitle=(item)=>{
    const label=item.textContent.trim();
    const translation=menuTranslations[label];
    const iconName=({News:'Notice','공지':'Notice','Fry Radar':'Fry Rader'})[label]||label;
    const artwork=menuIcons[iconName]||menuIcons['Project Info'];
    const text=make('span','control-menu-text');
    text.append(make('span','control-menu-title',label));
    if(translation)text.append(make('small','control-menu-subtitle',translation));
    const optics=make('span','control-menu-optics');optics.setAttribute('aria-hidden','true');
    item.replaceChildren(optics,text);
    item.insertAdjacentHTML('afterbegin','<svg class="control-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+artwork+'</svg>');
    return item;
  };
  const home=make('a','','Home');home.href='index.html';menuLinks.append(addMenuSubtitle(home));
  nav?.querySelectorAll('a').forEach(link=>{const item=link.cloneNode(true);item.removeAttribute('class');item.textContent=item.textContent.replace(/\s*↗\s*$/u,'');menuLinks.append(addMenuSubtitle(item));});
  const menuContact=make('button','','Contact');menuContact.type='button';menuContact.addEventListener('click',()=>setMode('contact'));
  const menuSearch=make('button','control-menu-search','Search');menuSearch.type='button';menuSearch.addEventListener('click',()=>setMode('search'));
  menuLinks.append(addMenuSubtitle(menuContact),addMenuSubtitle(menuSearch));menuScroll.append(menuLinks);
  // Build an optical displacement texture locally; no page screenshot or
  // personal content is sampled. The rounded-rectangle distance field bends
  // only the pixels near its beveled edge, leaving the center undistorted.
  let opticsPrepared=false,refractionTimer=0,lightFrame=0,lightTarget=null,lightPoint=null;
  const motionReduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const transparencyReduced=window.matchMedia('(prefers-reduced-transparency: reduce)');
  // A clear, flat center with an optically curved perimeter. Both renderer
  // paths use the same rounded-rectangle surface-normal and smooth rim falloff.
  const MENU_EDGE_DEPTH=9.5;
  function menuEdgeVector(px,py,w,h,r,depth){
    const qx=Math.abs(px)-(w/2-r),qy=Math.abs(py)-(h/2-r);
    const ox=Math.max(qx,0),oy=Math.max(qy,0),outer=Math.hypot(ox,oy);
    const distance=outer+Math.min(Math.max(qx,qy),0)-r;
    // Outside the lens and deeper than the narrow optical rim: zero distortion.
    if(distance>0||distance<=-depth)return [0,0];
    let nx=0,ny=0;
    if(outer>0){nx=Math.sign(px)*ox/outer;ny=Math.sign(py)*oy/outer;}
    else if(qx>qy)nx=Math.sign(px);else ny=Math.sign(py);
    const t=Math.max(0,Math.min(1,-distance/depth));
    const falloff=1-t*t*t*(t*(t*6-15)+10);
    // Give rounded corners a little more optical power, like a liquid-glass
    // capsule: the background line curves into the clear central face.
    const corner=1+.10*Math.abs(nx*ny)*2;
    return [nx*falloff*corner,ny*falloff*corner];
  }
  function prepareMenuRefraction(){
    if(opticsPrepared)return !!document.getElementById('gtz-menu-refraction');
    opticsPrepared=true;
    // WebKit can parse URL backdrops but not render them safely, so use the
    // CSS lens there. Chromium's accelerated reference filters do support it.
    if(!/(?:Chrome|Chromium|Edg|OPR)\//.test(navigator.userAgent)||/Android|iPhone|iPad|iPod|Mobile/.test(navigator.userAgent)||!window.CSS?.supports('backdrop-filter','url(#gtz-menu-refraction)'))return false;
    try{
      const w=256,h=44,r=21,depth=10.5,canvas=document.createElement('canvas');
      canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext('2d');if(!ctx)return false;
      const pixels=ctx.createImageData(w,h);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const [nx,ny]=menuEdgeVector(x+.5-w/2,y+.5-h/2,w,h,r,depth);
        const i=4*(y*w+x);
        pixels.data[i]=Math.round(128-nx*23);
        pixels.data[i+1]=Math.round(128-ny*65);
        pixels.data[i+2]=128;pixels.data[i+3]=255;
      }
      ctx.putImageData(pixels,0,0);
      const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
      svg.setAttribute('width','0');svg.setAttribute('height','0');svg.setAttribute('aria-hidden','true');
      svg.style.cssText='position:absolute;overflow:hidden;pointer-events:none';
      const filter=document.createElementNS(ns,'filter');
      const attrs={id:'gtz-menu-refraction',filterUnits:'objectBoundingBox',primitiveUnits:'objectBoundingBox',x:'-.08',y:'-.25',width:'1.16',height:'1.5','color-interpolation-filters':'sRGB'};
      Object.entries(attrs).forEach(([k,v])=>filter.setAttribute(k,v));
      const map=document.createElementNS(ns,'feImage'),href=canvas.toDataURL('image/png');
      Object.entries({x:'0',y:'0',width:'1',height:'1',preserveAspectRatio:'none',result:'menuLensMap',href}).forEach(([k,v])=>map.setAttribute(k,v));
      map.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href',href);
      const distort=document.createElementNS(ns,'feDisplacementMap');
      Object.entries({in:'SourceGraphic',in2:'menuLensMap',scale:'.34',xChannelSelector:'R',yChannelSelector:'G',x:'0',y:'0',width:'1',height:'1'}).forEach(([k,v])=>distort.setAttribute(k,v));
      filter.append(map,distort);svg.append(filter);document.body.append(svg);
      canvas.width=canvas.height=0;
      return true;
    }catch{return false;}
  }
  // Safari uses a single Canvas2D rim, not a cloned document or a GPU SVG filter.
  let mobileLens=null;
  function stopMobileLens(){
    if(!mobileLens)return;
    cancelAnimationFrame(mobileLens.frame);clearTimeout(mobileLens.timer);mobileLens.canvas.remove();mobileLens=null;
    if(dock.dataset.menuRefraction==='canvas')delete dock.dataset.menuRefraction;
  }
  function paintGlassBackdrop(ctx,b,skip){
    const overlaps=(r,b)=>r.right>b.left&&r.left<b.right&&r.bottom>b.top&&r.top<b.bottom;
    const visibleColor=c=>c&&c!=='transparent'&&c!=='rgba(0, 0, 0, 0)';
    function shape(r,s){
      const radius=Math.min(r.width/2,r.height/2,parseFloat(s.borderTopLeftRadius)||0);
      ctx.beginPath();if(ctx.roundRect)ctx.roundRect(r.left,r.top,r.width,r.height,radius);else ctx.rect(r.left,r.top,r.width,r.height);
    }
    function paint(el,b){
      if(skip(el)||el.matches('script,style,link,meta,svg,iframe,template,audio,video,canvas'))return;
      const r=el.getBoundingClientRect(),s=getComputedStyle(el);
      if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)<.025)return;
      const inside=overlaps(r,b),clip=/hidden|clip|scroll|auto/.test(s.overflow+s.overflowX+s.overflowY);
      if(!inside&&(clip||el.classList.contains('home-scene')||el.matches('section,article,figure,aside,header,footer')&&r.width>0&&r.height>0))return;
      ctx.save();ctx.globalAlpha*=Number(s.opacity);
      if(inside&&r.width>0&&r.height>0){
        if(visibleColor(s.backgroundColor)){shape(r,s);ctx.fillStyle=s.backgroundColor;ctx.fill();}
        if(parseFloat(s.borderTopWidth)>0&&visibleColor(s.borderTopColor)){shape(r,s);ctx.lineWidth=parseFloat(s.borderTopWidth);ctx.strokeStyle=s.borderTopColor;ctx.stroke();}
        if(clip){shape(r,s);ctx.clip();}
        if(el.tagName==='IMG'&&el.complete&&el.naturalWidth){
          try{
            const u=new URL(el.currentSrc||el.src,location.href);
            if(u.origin===location.origin||u.protocol==='data:'||u.protocol==='blob:'){
              let w=r.width,h=r.height;
              if(s.objectFit==='contain'||s.objectFit==='cover'){
                const f=Math[s.objectFit==='contain'?'min':'max'](w/el.naturalWidth,h/el.naturalHeight);
                w=el.naturalWidth*f;h=el.naturalHeight*f;
              }
              ctx.save();shape(r,s);ctx.clip();ctx.drawImage(el,r.left+(r.width-w)/2,r.top+(r.height-h)/2,w,h);ctx.restore();
            }
          }catch{}
        }
      }
      for(const node of el.childNodes){
        if(node.nodeType===1){paint(node,b);continue;}
        if(node.nodeType!==3||!node.data.trim()||!inside)continue;
        const range=document.createRange();range.selectNodeContents(node);
        const rects=[...range.getClientRects()];if(!rects.some(t=>overlaps(t,b)))continue;
        ctx.font=s.fontStyle+' '+s.fontWeight+' '+s.fontSize+' '+s.fontFamily;ctx.fillStyle=s.color;ctx.textBaseline='middle';
        if('letterSpacing' in ctx)ctx.letterSpacing=s.letterSpacing==='normal'?'0px':s.letterSpacing;
        if(rects.length===1){const t=rects[0];ctx.fillText(node.data.trim(),t.left,t.top+t.height/2,t.width);}
        else if(node.length<600){
          for(let k=0;k<node.length;k++){if(!node.data[k].trim())continue;range.setStart(node,k);range.setEnd(node,k+1);const t=range.getBoundingClientRect();if(overlaps(t,b))ctx.fillText(node.data[k],t.left,t.top+t.height/2,t.width);}
        }
      }
      ctx.restore();
    }
    paint(document.body,b);
  }
  window.GAMTTIZGlassOptics={edgeVector:menuEdgeVector,paintBackdrop:paintGlassBackdrop};
  function startMobileLens(){
    if(iosStandalone){stopMobileLens();return;}
    stopMobileLens();
    const canvas=make('canvas','control-menu-edge-canvas'),source=document.createElement('canvas');
    canvas.setAttribute('aria-hidden','true');
    const out=canvas.getContext('2d'),ctx=source.getContext('2d',{willReadFrequently:true});
    if(!out||!ctx)return;
    const m={canvas,frame:0,timer:0,last:0,interval:84};mobileLens=m;document.body.append(canvas);
    const overlaps=(r,b)=>r.right>b.left&&r.left<b.right&&r.bottom>b.top&&r.top<b.bottom;
    const visibleColor=c=>c&&c!=='transparent'&&c!=='rgba(0, 0, 0, 0)';
    let cachedScene=null,sceneTime=0,sceneKey='';
    const queue=()=>{m.timer=setTimeout(()=>{m.timer=0;if(mobileLens===m)m.frame=requestAnimationFrame(render);},document.hidden?1000:m.interval);};
    function render(now){
      if(mobileLens!==m||dock.dataset.mode!=='menu')return;
      m.frame=0;queue();
      if(document.hidden||document.documentElement.classList.contains('gtz-wallet-open')){canvas.removeAttribute('data-lens-ready');cachedScene=null;return;}
      if(document.documentElement.classList.contains('gtz-liquid-scrolling')||document.body.classList.contains('home-native-moving')){
        canvas.removeAttribute('data-lens-ready');cachedScene=null;return;
      }
      m.last=now;const started=performance.now();
      try{
        const clip=menuScroll.getBoundingClientRect(),left=Math.max(0,Math.floor(clip.left-14)),top=Math.max(0,Math.floor(clip.top-14));
        const w=Math.min(innerWidth-left,Math.ceil(clip.right-left+14)),h=Math.min(innerHeight-top,Math.ceil(clip.bottom-top+14));
        if(w<1||h<1)return;
        const b={left,top,right:left+w,bottom:top+h};
        if(canvas.width!==w||canvas.height!==h){canvas.width=source.width=w;canvas.height=source.height=h;m.pixels=null;}
        canvas.style.left=left+'px';canvas.style.top=top+'px';canvas.style.width=w+'px';canvas.style.height=h+'px';
        const key=[left,top,w,h].join(',');
        if(!cachedScene||now-sceneTime>170||key!==sceneKey){
        ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
        ctx.setTransform(1,0,0,1,-left,-top);
        const root=getComputedStyle(document.documentElement).backgroundColor;
        if(visibleColor(root)){ctx.fillStyle=root;ctx.fillRect(left,top,w,h);}
        paintGlassBackdrop(ctx,b,el=>el===dock||el===scrim||el===canvas);
        ctx.fillStyle=getComputedStyle(scrim).backgroundColor;ctx.fillRect(left,top,w,h);
        cachedScene=ctx.getImageData(0,0,w,h).data;sceneTime=now;sceneKey=key;
        }
        const data=cachedScene,pixels=m.pixels||(m.pixels=out.createImageData(w,h)),dst=pixels.data;dst.fill(0);
        for(const el of menuLinks.children){
          const r=el.getBoundingClientRect(),s=getComputedStyle(el);
          if(Number(s.opacity)<.97||!overlaps(r,clip))continue;
          const radius=Math.min(parseFloat(s.borderTopLeftRadius)||20,r.width/2,r.height/2),depth=Math.min(MENU_EDGE_DEPTH,r.height*.25);
          for(let y=Math.max(0,Math.ceil(r.top-top),Math.ceil(clip.top-top));y<Math.min(h,r.bottom-top,clip.bottom-top);y++)
          for(let x=Math.max(0,Math.ceil(r.left-left),Math.ceil(clip.left-left));x<Math.min(w,r.right-left,clip.right-left);x++){
            const px=x+.5+left-r.left-r.width/2,py=y+.5+top-r.top-r.height/2;
            if(Math.abs(px)<r.width/2-radius&&Math.abs(py)<r.height/2-depth)continue;
            const [nx,ny]=menuEdgeVector(px,py,r.width,r.height,radius,depth);
            const strength=Math.hypot(nx,ny);if(strength<.005)continue;
            const sx=Math.max(0,Math.min(w-1.001,x-nx*8)),sy=Math.max(0,Math.min(h-1.001,y-ny*4.5));
            const ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy,i=4*(y*w+x),a=4*(iy*w+ix);
            let delta=0;
            for(let c=0;c<3;c++){
              const v=(data[a+c]*(1-fx)+data[a+4+c]*fx)*(1-fy)+(data[a+w*4+c]*(1-fx)+data[a+w*4+4+c]*fx)*fy;
              dst[i+c]=v;delta=Math.max(delta,Math.abs(v-data[i+c]));
            }
            dst[i+3]=Math.round(235*Math.min(1,delta/8)*Math.min(1,strength*2.6));
          }
        }
        out.putImageData(pixels,0,0);canvas.setAttribute('data-lens-ready','');if(dock.dataset.menuRefraction!=='canvas')dock.dataset.menuRefraction='canvas';
        m.interval=Math.max(84,Math.min(240,(performance.now()-started)*5));
      }catch{/* Keep the previous complete frame; never flash a cleared layer. */}
    }
    m.frame=requestAnimationFrame(render);
  }
  function resetMenuLight(){
    if(lightFrame)cancelAnimationFrame(lightFrame);
    lightFrame=0;lightPoint=null;
    if(lightTarget){lightTarget.style.removeProperty('--menu-light-x');lightTarget.style.removeProperty('--menu-light-y');lightTarget=null;}
  }
  // Stable row centers are independent of visual scale, so the cursor and
  // captured touch can glide across the whole dock without hover oscillation.
  const guideItems=[...menuLinks.children];
  menuLinks.dataset.guided='';
  let guideIndex=-1,guideTouch=null,blockTouchClickUntil=0,guideScrollFrame=0;
  // Integrate a damped spring on the display's animation clock. Retargeting
  // preserves velocity rather than restarting a CSS easing on every move.
  const guideMotion=guideItems.map(()=>({size:.8,velocity:0,target:.8}));
  let guideFrame=0,guideTime=0;
  function guideTarget(i,index){
    const distance=Math.abs(i-index);
    return index<0?.8:distance===0?1.04:distance===1?.9:.8;
  }
  function currentGuideIndex(){return guideIndex>=0?guideIndex:guideItems.findIndex(item=>item.hasAttribute('aria-current'));}
  function stopGuideSpring(){
    if(guideFrame)cancelAnimationFrame(guideFrame);guideFrame=0;guideTime=0;
  }
  function resetGuideSpring(){
    stopGuideSpring();
    const index=currentGuideIndex();
    guideMotion.forEach((motion,i)=>{
      motion.size=motion.target=guideTarget(i,index);motion.velocity=0;
      guideItems[i].style.setProperty('--guide-live-size',motion.size);
    });
  }
  function guideSpring(now){
    guideFrame=0;
    if(dock.dataset.mode!=='menu')return;
    const dt=Math.min(.05,Math.max(.001,(now-guideTime)/1000));guideTime=now;
    let busy=false;
    for(let i=0;i<guideMotion.length;i++){
      const m=guideMotion[i],previous=m.size;
      // Closed-form underdamped solution, stable even at 120Hz or dropped frames.
      const displacement=m.size-m.target,omega=21,zeta=.84,decay=omega*zeta,wd=omega*Math.sqrt(1-zeta*zeta);
      const b=(m.velocity+decay*displacement)/wd,angle=wd*dt,cos=Math.cos(angle),sin=Math.sin(angle),env=Math.exp(-decay*dt);
      m.size=m.target+env*(displacement*cos+b*sin);
      m.velocity=env*((-decay*displacement+b*wd)*cos+(-decay*b-displacement*wd)*sin);
      if(Math.abs(m.size-m.target)<.0003&&Math.abs(m.velocity)<.005){m.size=m.target;m.velocity=0;}else busy=true;
      if(Math.abs(m.size-previous)>.00001)guideItems[i].style.setProperty('--guide-live-size',m.size.toFixed(5));
    }
    if(busy)guideFrame=requestAnimationFrame(guideSpring);else guideTime=0;
  }
  function retargetGuide(){
    const index=currentGuideIndex();
    guideMotion.forEach((m,i)=>{m.target=guideTarget(i,index);});
    if(motionReduced.matches){resetGuideSpring();return;}
    if(!guideFrame){guideTime=performance.now();guideFrame=requestAnimationFrame(guideSpring);}
  }
  function guideSelection(index){
    if(index===guideIndex)return;
    guideIndex=index;
    menuLinks.toggleAttribute('data-following',index>=0);
    guideItems.forEach((item,i)=>{
      const distance=Math.abs(i-index);
      item.classList.toggle('menu-guide-active',index>=0&&distance===0);
      item.classList.toggle('menu-guide-near',index>=0&&distance===1);
    });
    retargetGuide();
  }
  function guideAt(x,y){
    const box=menuLinks.getBoundingClientRect(),clip=menuScroll.getBoundingClientRect();
    if(x<box.left-8||x>box.right+8||y<Math.max(box.top,clip.top)-5||y>Math.min(box.bottom,clip.bottom)+5)return -1;
    let best=-1,minimum=Infinity;
    guideItems.forEach((item,i)=>{
      const r=item.getBoundingClientRect(),center=(r.top+r.bottom)/2;
      if(center<clip.top||center>clip.bottom)return;
      const distance=Math.abs(center-y);
      if(distance<minimum){minimum=distance;best=i;}
    });
    return best;
  }
  function menuLight(event,item){
    if(motionReduced.matches||dock.dataset.mode!=='menu'||!item)return;
    if(lightTarget!==item){resetMenuLight();lightTarget=item;}
    lightPoint={x:event.clientX,y:event.clientY};if(lightFrame)return;
    lightFrame=requestAnimationFrame(()=>{
      lightFrame=0;if(!lightTarget||!lightPoint)return;
      const rect=lightTarget.getBoundingClientRect(),clamp=n=>Math.max(8,Math.min(92,n));
      lightTarget.style.setProperty('--menu-light-x',clamp((lightPoint.x-rect.left)/Math.max(1,rect.width)*100).toFixed(1)+'%');
      lightTarget.style.setProperty('--menu-light-y',clamp((lightPoint.y-rect.top)/Math.max(1,rect.height)*100).toFixed(1)+'%');
    });
  }
  function followGuide(event){
    if(dock.dataset.mode!=='menu')return -1;
    const index=guideAt(event.clientX,event.clientY);
    guideSelection(index);
    if(index>=0)menuLight(event,guideItems[index]);else resetMenuLight();
    return index;
  }
  function clearGuide(){
    if(dock.hasAttribute('data-menu-closing'))return;
    guideSelection(-1);resetMenuLight();
  }
  function stopGuideTouch(preserve=false){
    if(guideScrollFrame)cancelAnimationFrame(guideScrollFrame);guideScrollFrame=0;
    const touch=guideTouch;guideTouch=null;
    if(touch&&menuLinks.hasPointerCapture?.(touch.id))menuLinks.releasePointerCapture(touch.id);
    if(preserve===true){stopGuideSpring();resetMenuLight();}else clearGuide();
  }
  function scrollGuide(){
    if(!guideTouch){guideScrollFrame=0;return;}
    const r=menuScroll.getBoundingClientRect(),y=guideTouch.y;
    const speed=y<r.top+30?-Math.min(7,(r.top+30-y)*.22):y>r.bottom-30?Math.min(7,(y-r.bottom+30)*.22):0;
    if(speed){menuScroll.scrollTop+=speed;followGuide({clientX:guideTouch.x,clientY:y});}
    guideScrollFrame=requestAnimationFrame(scrollGuide);
  }
  menuLinks.addEventListener('pointerover',event=>{if(event.pointerType!=='touch')followGuide(event);},{passive:true});
  menuLinks.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch'){
      if(guideTouch?.id!==event.pointerId)return;
      guideTouch.x=event.clientX;guideTouch.y=event.clientY;
    }
    followGuide(event);
  },{passive:true});
  menuLinks.addEventListener('pointerdown',event=>{
    if(event.pointerType==='touch'){
      if(guideTouch)return;
      guideTouch={id:event.pointerId,x:event.clientX,y:event.clientY};
      try{menuLinks.setPointerCapture(event.pointerId);}catch{}
      guideScrollFrame=requestAnimationFrame(scrollGuide);
    }
    followGuide(event);
  },{passive:true});
  menuLinks.addEventListener('pointerup',event=>{
    if(event.pointerType!=='touch'||guideTouch?.id!==event.pointerId)return;
    const index=followGuide(event),target=guideItems[index];
    blockTouchClickUntil=performance.now()+700;
    stopGuideTouch();
    // A single deliberate release commits the item under the finger.
    // The original link/button handler still owns navigation and actions.
    if(target&&dock.dataset.mode==='menu')target.click();
  });
  menuLinks.addEventListener('click',event=>{
    if(event.isTrusted&&event.detail>0&&performance.now()<blockTouchClickUntil){
      event.preventDefault();event.stopImmediatePropagation();return;
    }
    if(event.isTrusted&&event.detail>0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){
      const index=guideAt(event.clientX,event.clientY),chosen=guideItems[index];
      if(chosen&&!chosen.contains(event.target)){event.preventDefault();event.stopImmediatePropagation();chosen.click();}
    }
  },true);
  menuLinks.addEventListener('pointerleave',()=>{if(!guideTouch)clearGuide();},{passive:true});
  menuLinks.addEventListener('pointercancel',stopGuideTouch,{passive:true});
  menuLinks.addEventListener('lostpointercapture',()=>{if(guideTouch)stopGuideTouch();});
  menuLinks.addEventListener('focusin',event=>{if(event.target.matches(':focus-visible'))guideSelection(guideItems.indexOf(event.target));});
  menuLinks.addEventListener('focusout',event=>{if(!menuLinks.contains(event.relatedTarget)&&!guideTouch)clearGuide();});
  function toggleMenuRefraction(active){
    if(iosStandalone){clearTimeout(refractionTimer);stopMobileLens();delete dock.dataset.menuRefraction;return;}
    clearTimeout(refractionTimer);
    if(!active){stopGuideTouch(dock.hasAttribute('data-menu-closing'));stopMobileLens();if(!dock.hasAttribute('data-menu-closing'))delete dock.dataset.menuRefraction;return;}
    delete dock.dataset.menuRefraction;
    if(transparencyReduced.matches)return;
    // Enable the more expensive optical pass only once the entry springs settle.
    refractionTimer=window.setTimeout(()=>{if(dock.dataset.mode==='menu'){if(prepareMenuRefraction())dock.dataset.menuRefraction='ready';else startMobileLens();}},motionReduced.matches?0:820);
  }
  // A bottom-up stagger gives each droplet its own spring trajectory from Menu.
  [...menuLinks.children].forEach((item,index,items)=>{
    item.style.setProperty('--menu-index',index);
    item.style.setProperty('--menu-reverse',items.length-1-index);
  });
  function syncCurrentMenuLink(){
    const current=new URL(location.href),normalized=url=>url.pathname.replace(/\/$/,'/index.html');
    const links=[...menuLinks.querySelectorAll('a')];
    const matching=links.filter(link=>{const url=new URL(link.href,current);return url.origin===current.origin&&normalized(url)===normalized(current).replace(/\/draw\.html$/,'/play.html');});
    const selected=matching.find(link=>{const url=new URL(link.href,current);return url.hash&&url.hash===current.hash;})||matching.find(link=>!new URL(link.href,current).hash);
    for(const link of links){if(link===selected)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}
  }
  syncCurrentMenuLink();
  window.addEventListener('hashchange',syncCurrentMenuLink);
  const contact=make('section','control-contact');contact.id='control-contact';contact.setAttribute('aria-label','문의 방법 선택');contact.setAttribute('aria-hidden','true');contact.inert=true;
  const contactScroll=make('div','control-panel-scroll');
  contactScroll.append(make('span','control-panel-label','CONTACT GAMTTIZ'));contact.append(contactScroll);
  const contactLinks=make('div','control-contact-links');
  const dm=make('a','','Instagram DM ↗');dm.href='https://ig.me/m/gamttiz_official';dm.target='_blank';dm.rel='noopener noreferrer';dm.append(make('small','','@gamttiz_official'));
  const mail=make('a','','Gmail에서 작성 ↗');
  mail.href='https://mail.google.com/mail/?view=cm&fs=1&to=fox475763%40gmail.com&su=GAMTTIZ%20%EB%AC%B8%EC%9D%98';
  mail.target='_blank';mail.rel='noopener noreferrer';mail.append(make('small','','fox475763@gmail.com'));
  const mailApp=make('a','','메일 앱으로 열기 ↗');mailApp.href='mailto:fox475763@gmail.com?subject=GAMTTIZ%20%EB%AC%B8%EC%9D%98';
  mailApp.append(make('small','','기본 메일 앱 사용'));
  const copy=make('button','contact-copy','이메일 주소 복사');copy.type='button';
  const copyStatus=make('p','contact-copy-status');copyStatus.setAttribute('role','status');
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText('fox475763@gmail.com');copyStatus.textContent='이메일 주소를 복사했어요.';}catch{copyStatus.textContent='fox475763@gmail.com — 주소를 선택해 복사해 주세요.';}});
  contactLinks.append(dm,mail,mailApp,copy);contactScroll.append(contactLinks,copyStatus);
  dock.append(search,menu,contact,trigger);document.body.append(dock);
  // Recover the same dock if a mobile browser restores a cached page or a
  // page transition unexpectedly detaches a body-level overlay.
  const keepDockMounted=()=>{
    if(!document.body)return;
    if(dock.parentNode!==document.body)document.body.append(dock);
    if(trigger.parentNode!==dock)dock.append(trigger);
  };
  new MutationObserver(()=>{if(!dock.isConnected)keepDockMounted();}).observe(document.body,{childList:true});
  window.addEventListener('pageshow',keepDockMounted);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)keepDockMounted();});
  // Restart one complete light sweep for every touch or mouse press.
  const glassPressTimers=new WeakMap();
  dock.addEventListener('pointerdown',event=>{
    const target=event.target.closest('button,a');
    if(!target || !dock.contains(target)||menuLinks.contains(target))return;
    clearTimeout(glassPressTimers.get(target));
    target.classList.remove('glass-pressed');
    void target.offsetWidth;
    target.classList.add('glass-pressed');
    glassPressTimers.set(target,window.setTimeout(()=>target.classList.remove('glass-pressed'),900));
  });

  const normalize=value=>String(value||'').toLocaleLowerCase('ko').replace(/\s+/g,'');
  let newsLoaded=false;
  async function loadSearchNews(){
    if(newsLoaded)return; newsLoaded=true;
    try { const posts=typeof loadNewsPosts==='function' ? await loadNewsPosts({force:true}) : await fetch('news/posts.json',{cache:'no-store'}).then(r=>r.json()); if(Array.isArray(posts))posts.forEach(post=>{if(post?.id&&post?.title)pages.push({title:post.title,description:post.excerpt||'소식 보기',url:`news.html?id=${encodeURIComponent(post.id)}`,keys:`notice news 공지 소식 ${post.body||''}`});}); renderResults(); } catch {}
  }
  function renderResults(){
    const query=normalize(searchInput.value);
    searchResults.replaceChildren();
    searchResults.hidden=!query;
    if(!query)return;
    const results=pages.filter(item=>normalize(`${item.title} ${item.description} ${item.keys}`).includes(query)).slice(0,8);
    if(!results.length){searchResults.append(make('p','control-no-results','검색 결과가 없어요. 다른 단어로 찾아보세요.'));return;}
    results.forEach(item=>{const link=make('a','control-result');link.href=item.url;link.append(make('strong','',item.title),make('span','',item.description),make('b','','↗'));searchResults.append(link);});
  }
  // Hold the visible scale and scroll offset during collapse; calculate
  // the actual trigger center for each row, including a scrolled menu.
  let menuCloseTimer=0;
  function finishMenuClose(){
    clearTimeout(menuCloseTimer);menuCloseTimer=0;delete dock.dataset.menuClosing;
    menuLinks.style.removeProperty('--menu-close-scroll');
    for(const item of guideItems){
      item.removeAttribute('data-close-offscreen');
      item.style.removeProperty('--menu-close-x');item.style.removeProperty('--menu-close-y');
    }
    if(dock.dataset.mode!=='menu'){delete dock.dataset.menuRefraction;clearGuide();stopGuideSpring();}
  }
  function beginMenuClose(){
    if(motionReduced.matches)return;
    const button=trigger.getBoundingClientRect(),viewport=menuScroll.getBoundingClientRect();
    const tx=button.left+button.width/2,ty=button.top+button.height/2;
    for(const item of guideItems){
      const r=item.getBoundingClientRect();
      item.style.setProperty('--menu-close-x',(tx-r.right+17).toFixed(2)+'px');
      item.style.setProperty('--menu-close-y',(ty-(r.top+r.bottom)/2).toFixed(2)+'px');
      item.toggleAttribute('data-close-offscreen',r.bottom<viewport.top||r.top>viewport.bottom);
    }
    menuLinks.style.setProperty('--menu-close-scroll',-menuScroll.scrollTop+'px');
    dock.dataset.menuClosing='';
    stopGuideSpring();
    // Small settling pulse synchronized with returning droplets.
    trigger.animate?.([{scale:'1',offset:0},{scale:'.955',offset:.53},{scale:'1.035',offset:.79},{scale:'1',offset:1}],{duration:690,easing:'cubic-bezier(.3,.7,.23,1)'});
    menuCloseTimer=window.setTimeout(finishMenuClose,870);
  }
  // Commit the interactive state before any optional optical animation.
  // A compositor or animation failure must never disable navigation.
  function setMode(mode){
    if(mode==='closed'&&dock.dataset.mode==='closed')return;
    const next=dock.dataset.mode===mode?'closed':mode;
    const wasMenu=dock.dataset.mode==='menu';
    try{
      if(dock.hasAttribute('data-menu-closing'))finishMenuClose();
      if(wasMenu&&next==='closed')beginMenuClose();
    }catch{delete dock.dataset.menuClosing;}
    dock.dataset.mode=next;
    scrim.classList.toggle('is-open',next!=='closed');
    trigger.setAttribute('aria-expanded',String(next!=='closed'));
    for(const [name,panel] of [['search',search],['menu',menu],['contact',contact]]){
      const active=next===name;panel.inert=!active;panel.setAttribute('aria-hidden',String(!active));
    }
    trigger.setAttribute('aria-label',next==='closed'?'컨트롤 버튼: 누르면 메뉴, 길게 누르면 검색':`${next==='search'?'검색':next==='menu'?'메뉴':'문의'} 닫기`);
    try{toggleMenuRefraction(next==='menu');}catch{delete dock.dataset.menuRefraction;}
    if(next==='menu'){
      try{syncCurrentMenuLink();clearGuide();resetGuideSpring();}catch{}
      menuScroll.scrollTop=0;
    }
    if(next==='contact')contactScroll.scrollTop=0;
    try{updateMenuTextColor();}catch{}
    if(next==='search'){try{renderResults();loadSearchNews();window.setTimeout(()=>searchInput.focus({preventScroll:true}),180);}catch{}}
    else if(document.activeElement===searchInput)try{trigger.focus({preventScroll:true});}catch{}
  }
  let start=null, holdTimer=0, gestureHandled=false,lastTouchRelease=-Infinity;
  trigger.addEventListener('pointerdown',event=>{
    start={x:event.clientX,y:event.clientY};gestureHandled=false;
    clearTimeout(holdTimer);
    holdTimer=window.setTimeout(()=>{gestureHandled=true;setMode('search');try{navigator.vibrate?.(12);}catch{}},540);
  });
  trigger.addEventListener('pointermove',event=>{if(start && (Math.abs(event.clientX-start.x)>12||Math.abs(event.clientY-start.y)>12))clearTimeout(holdTimer);});
  trigger.addEventListener('pointerup',event=>{
    clearTimeout(holdTimer);
    if(!start)return;
    const dx=event.clientX-start.x,dy=event.clientY-start.y;start=null;
    if(gestureHandled){if(event.pointerType==='touch')lastTouchRelease=performance.now();return;}
    if(dx < -34 && Math.abs(dx)>Math.abs(dy)){gestureHandled=true;setMode('search');}
    else if(dy < -34 && Math.abs(dy)>Math.abs(dx)){gestureHandled=true;setMode('menu');}
    // Do not depend on WebKit dispatching a synthetic click after touch.
    if(event.pointerType==='touch'){
      lastTouchRelease=performance.now();
      if(!gestureHandled&&Math.hypot(dx,dy)<18){gestureHandled=true;setMode('menu');}
    }
  });
  trigger.addEventListener('pointercancel',()=>{clearTimeout(holdTimer);start=null;gestureHandled=false;});
  trigger.addEventListener('contextmenu',event=>event.preventDefault());
  trigger.addEventListener('click',event=>{
    if(event.detail!==0&&performance.now()-lastTouchRelease<750){gestureHandled=false;return;}
    if(gestureHandled){gestureHandled=false;return;}
    setMode('menu');
  });
  dock.dataset.menuWired='true';
  let menuSwipeX=null;
  menu.addEventListener('pointerdown',event=>{if(!menuLinks.contains(event.target))menuSwipeX=event.clientX;});
  menu.addEventListener('pointerup',event=>{if(menuSwipeX!==null && event.clientX-menuSwipeX < -45)setMode('search');menuSwipeX=null;});
  menu.addEventListener('pointercancel',event=>{
    menuSwipeX=null;
    const target=event.target.closest('.control-menu-links > :is(a,button)');
    if(target){clearTimeout(glassPressTimers.get(target));target.classList.remove('glass-pressed');}
  });
  scrim.addEventListener('click',()=>setMode('closed'));
  searchInput.addEventListener('input',renderResults);
  document.addEventListener('pointerdown',event=>{if(dock.dataset.mode!=='closed'&&!dock.contains(event.target))setMode('closed');});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&dock.dataset.mode!=='closed'){event.preventDefault();setMode('closed');trigger.focus({preventScroll:true});}
    if((event.key==='/'&&!/input|textarea/i.test(document.activeElement?.tagName||''))||(event.key.toLowerCase()==='k'&&(event.ctrlKey||event.metaKey))){event.preventDefault();if(dock.dataset.mode!=='search')setMode('search');}
  });
  const footer=document.querySelector('footer');if(footer){const link=make('button','site-footer-contact','문의하기 ↗');link.type='button';link.addEventListener('click',()=>setMode('contact'));footer.append(link);}

  let dismissed=false;try{dismissed=sessionStorage.getItem('gamttiz-entry-dismissed')==='1';}catch{}
  let externalReferrer=false;try{externalReferrer=!!document.referrer && new URL(document.referrer).host!==location.host;}catch{}
  const externalEntry=page!=='index.html' && (externalReferrer || new URLSearchParams(location.search).has('utm_source'));
  if(externalEntry && !dismissed){
    const guide=make('aside','site-entry-guide');guide.setAttribute('aria-label','방문 안내');
    guide.append(make('strong','','감띠즈에 오신 걸 환영해요.'),make('span','','이 페이지를 즐긴 뒤 홈에서 16명의 친구도 만나보세요.'));
    const homeLink=make('a','','홈 둘러보기 ↗');homeLink.href='index.html';guide.append(homeLink);
    const dismiss=make('button','','닫기 ✕');dismiss.type='button';dismiss.addEventListener('click',()=>{guide.remove();try{sessionStorage.setItem('gamttiz-entry-dismissed','1');}catch{}});guide.append(dismiss);
    header?.after(guide);
  }
  
let colorFrame = 0;
let lastButtonColor = '';
const homeColorTracking = document.body.classList.contains('home-cinema');

function setButtonColor(color) {
  if (color === lastButtonColor) return;
  trigger.style.setProperty('color', color, 'important');
  trigger.dataset.ink=color==='#ffffff'?'light':'red';
  lastButtonColor = color;
}

function updateMenuTextColor() {
  if (dock.dataset.mode !== 'closed') {
    setButtonColor('#e93636');
    return;
  }

  if(document.body.classList.contains('home-native-touch')){
    setButtonColor(document.body.dataset.homeInk==='white'?'#ffffff':'#e93636');
    return;
  }
  const rect = trigger.getBoundingClientRect();
  let behind;
  const x=rect.left+rect.width/2,y=rect.top+rect.height/2;
  // Never hide the fixed dock for a hit test: mobile WebKit can retain a
  // hidden compositor layer during asynchronous scrolling.
  if(typeof document.elementsFromPoint==='function'){
    behind=document.elementsFromPoint(x,y).find(el=>!dock.contains(el)&&!scrim.contains(el));
  }

  let isRed = homeColorTracking&&document.body.dataset.homeInk==='white';
  for (let el = behind; el; el = el.parentElement) {
    if(homeColorTracking&&document.body.dataset.homeInk&&(el===document.body||el===document.documentElement))break;
    const rgb = getComputedStyle(el).backgroundColor.match(/[\d.]+/g)?.map(Number);
    if (!rgb || (rgb[3] ?? 1) < 0.8) continue;
    const [r, g, b] = rgb;
    isRed = r > 140 && r > g * 1.45 && r > b * 1.45;
    break;
  }
  setButtonColor(isRed ? '#ffffff' : '#e93636');
}

function scheduleMenuTextColorUpdate() {
  if (colorFrame) return;
  if(homeColorTracking){
    colorFrame=setTimeout(()=>{colorFrame=0;updateMenuTextColor();},110);
    return;
  }
  colorFrame = requestAnimationFrame(() => {
    colorFrame = 0;
    updateMenuTextColor();
  });
}

(document.querySelector('.home-scroll-viewport')||window).addEventListener('scroll', () => {if(!document.body.classList.contains('home-native-touch'))scheduleMenuTextColorUpdate();}, { passive: true });
document.addEventListener('gtz-home-palette',scheduleMenuTextColorUpdate);
window.addEventListener('resize', scheduleMenuTextColorUpdate);
window.addEventListener('load', scheduleMenuTextColorUpdate);
window.addEventListener('pageshow', scheduleMenuTextColorUpdate);
window.visualViewport?.addEventListener('resize',scheduleMenuTextColorUpdate,{passive:true});
updateMenuTextColor();

// Only suppress the static, no-script navigation fallback once the complete
// interactive menu is mounted and visibly inside the viewport.
function syncPersistentMenu(){
  keepDockMounted();
  const r=trigger.getBoundingClientRect(),style=getComputedStyle(trigger);
  const visible=dock.dataset.menuWired==='true'&&trigger.isConnected&&r.width>=40&&r.height>=40&&
    r.right>0&&r.bottom>0&&r.left<window.innerWidth&&r.top<window.innerHeight&&
    style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)>.1;
  document.documentElement.classList.toggle('gtz-menu-ready',visible);
}
syncPersistentMenu();
window.addEventListener('pageshow',event=>{
  clearTimeout(holdTimer);start=null;gestureHandled=false;lastTouchRelease=-Infinity;
  if(event.persisted&&dock.dataset.mode!=='closed')setMode('closed');
  syncPersistentMenu();
});
window.addEventListener('orientationchange',syncPersistentMenu);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncPersistentMenu();});
if(iosStandalone)window.setInterval(syncPersistentMenu,2600);

// Shake-to-open is a mobile-only wallet and uses explicit sensor consent.
const walletMedia=matchMedia('(max-width: 900px)');
{
  const sheet=make('section','gtz-wallet-sheet');sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-label','나의 라이센스');sheet.hidden=true;
  const backdrop=make('button','gtz-wallet-backdrop');backdrop.type='button';backdrop.setAttribute('aria-label','라이센스 닫기');
  const content=make('div','gtz-wallet-content'),title=make('p','gtz-wallet-title','MY LICENSE');
  const close=make('button','gtz-wallet-close','×');close.type='button';close.setAttribute('aria-label','닫기');
  const frame=make('div','gtz-wallet-frame gtz-wallet-lite');frame.setAttribute('aria-label','나의 감띠즈 라이센스 카드');
  const detail=make('a','gtz-wallet-detail','MY ID 페이지 ↗');detail.href='license.html';
  content.append(title,close,frame,detail);sheet.append(backdrop,content);document.body.append(sheet);
  const shakeSettings=make('div','gtz-shake-setting');shakeSettings.hidden=true;
  const shakeButton=make('button','gtz-shake-button','흔들어 카드 열기 켜기');shakeButton.type='button';
  const shakeReconnect=make('button','gtz-shake-reconnect','센서 권한 다시 연결');shakeReconnect.type='button';shakeReconnect.hidden=true;
  const shakeStatus=make('p','gtz-shake-status');shakeStatus.setAttribute('role','status');
  shakeSettings.append(shakeButton,shakeReconnect,shakeStatus);
  const shakeMount=document.getElementById('license-shake-setting-mount');
  if(shakeMount)shakeMount.append(shakeSettings);
  const shakeKey='gamttiz-license-shake-enabled-v1';
  let enabled=false,sensorSeen=false,sessionAllowed=false,requesting=false,open=false,presented=false,sheetTimer=0,frameStarted=false,lastExists=null;
  let recoveryTimer=0,recoveryNeeded=false,silentAttempted=false,silentPending=false,recoveryEpoch=0;
  let gravity=null,firstHit=null,lastHit=-Infinity,lastOpened=-Infinity;
  try{enabled=localStorage.getItem(shakeKey)==='1';}catch{}
  const reducedWallet=matchMedia('(prefers-reduced-motion: reduce)');
  function mobile(){return walletMedia.matches&&(matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0);}
  function canMotion(){return typeof window.DeviceMotionEvent!=='undefined';}
  function needsPermission(){return typeof window.DeviceMotionEvent?.requestPermission==='function';}
  function hasCard(){try{const r=JSON.parse(localStorage.getItem('gamttiz-my-license-v1')||'null');return !!(r?.name&&r?.number);}catch{return false;}}
  function remember(value){enabled=value;try{localStorage.setItem(shakeKey,value?'1':'0');}catch{}}
  function clearRecovery(){clearTimeout(recoveryTimer);recoveryTimer=0;recoveryNeeded=false;recoveryEpoch++;silentPending=false;}
  function resetSensor(){clearRecovery();silentAttempted=false;sensorSeen=false;sessionAllowed=false;firstHit=null;gravity=null;shakeStatus.textContent='';}
  function restorePreference(){try{const saved=localStorage.getItem(shakeKey)==='1';if(saved!==enabled){enabled=saved;resetSensor();}}catch{}}
  function mayRecover(){return enabled&&mobile()&&hasCard()&&canMotion()&&needsPermission()&&!document.hidden&&!document.body.classList.contains('license-animating');}
  function updateSetting(){
    shakeSettings.hidden=!mobile()||!hasCard();
    shakeButton.disabled=requesting||!canMotion();
    // A saved preference is independent of whether the new document has received sensor data.
    shakeButton.textContent=requesting?'센서 권한 확인 중…':enabled?'흔들어 카드 열기 끄기':'흔들어 카드 열기 켜기';
    shakeButton.setAttribute('aria-pressed',String(enabled));
    shakeReconnect.hidden=!enabled||sensorSeen||(!recoveryNeeded&&sessionAllowed)||!needsPermission();
    shakeReconnect.disabled=requesting;
    if(!canMotion())shakeStatus.textContent='이 브라우저는 움직임 센서를 지원하지 않아요. MY ID 메뉴를 이용해주세요.';
    else if(enabled&&!sensorSeen&&!sessionAllowed&&!requesting&&!shakeStatus.textContent)shakeStatus.textContent=needsPermission()?'활성화 설정이 저장되어 있어요. 연결이 필요하면 센서 권한 다시 연결을 눌러주세요.':'휴대폰을 좌우로 두 번 가볍게 흔들어 카드를 열어보세요.';
  }
  async function connectSensor(){
    if(requesting||!mobile()||!hasCard()||!canMotion()||document.body.classList.contains('license-animating'))return;
    const wasEnabled=enabled;clearRecovery();silentAttempted=true;
    requesting=true;updateSetting();
    try{
      // Permission is requested exclusively from explicit shake controls,
      // never during rendering, card issuance, navigation or other gestures.
      const permission=needsPermission()?await window.DeviceMotionEvent.requestPermission():'granted';
      if(permission!=='granted')throw new Error('sensor permission not granted');
      if(wasEnabled&&!enabled)return;
      remember(true);sessionAllowed=true;gravity=null;firstHit=null;
      watchSensor();
      shakeStatus.textContent='휴대폰을 좌우로 두 번 가볍게 흔들어 카드를 열어보세요.';
    }catch{
      if(!wasEnabled)remember(false);
      sessionAllowed=false;recoveryNeeded=enabled;
      shakeStatus.textContent=enabled?'흔들기 설정은 켜져 있어요. 센서 권한을 다시 연결해주세요.':'동작 센서 권한을 허용해야 흔들기 기능을 사용할 수 있어요.';
    }
    finally{requesting=false;updateSetting();if(sessionAllowed&&!sensorSeen)watchSensor();}
  }
  function watchSensor(){
    if(recoveryTimer||requesting||silentPending||sensorSeen||!mayRecover())return;
    recoveryTimer=setTimeout(async()=>{
      recoveryTimer=0;
      if(sensorSeen||requesting||!mayRecover())return;
      // Only check an existing grant WITHOUT transient activation. A new
      // permission prompt is forbidden without that activation by WebKit.
      // If Safari discarded the grant the call rejects; retain the setting
      // and offer manual reconnection only on the issued MY ID page.
      if(!silentAttempted&&navigator.userActivation?.isActive===false){
        silentAttempted=true;silentPending=true;
        const epoch=recoveryEpoch;
        try{
          const result=await window.DeviceMotionEvent.requestPermission();
          if(epoch!==recoveryEpoch||!mayRecover())return;
          if(result==='granted'){sessionAllowed=true;silentPending=false;watchSensor();return;}
        }catch{}
        finally{if(epoch===recoveryEpoch)silentPending=false;}
        if(epoch!==recoveryEpoch)return;
      }
      if(!mayRecover()||sensorSeen)return;
      recoveryNeeded=true;sessionAllowed=false;
      shakeStatus.textContent='흔들기 설정은 유지됐어요. Safari 센서 권한을 다시 연결해주세요.';
      updateSetting();
    },1200);
  }
  shakeButton.addEventListener('click',()=>{
    if(!mobile()||!hasCard()||!canMotion()||requesting||document.body.classList.contains('license-animating'))return;
    if(enabled){
      remember(false);resetSensor();
      shakeStatus.textContent='흔들기 기능을 껐어요.';updateSetting();return;
    }
    return connectSensor();
  });
  shakeReconnect.addEventListener('click',()=>{if(enabled&&!requesting)return connectSensor();});
  // Presentation styles live in license-wallet.css; only decoded card art
  // and the touch/sensor lifecycle belong here.
  let disposeWallet=()=>{};
  const friendNames=['감띠','뚱감띠','케이준띠','탄감띠','덜감띠','케찹 감띠','빙빙이','휜감띠','감감이와 띠띠','울룩불룩띠','웨지감띠','부스러끼','두리감띠','촉촉감띠','버터갈릭감띠','매콤감띠'];
  const qrMatrix=[
    '111111100101010011111011101111111',
    '100000100111011111000100001000001',
    '101110101001010011101101001011101',
    '101110101001101110001010101011101',
    '101110101111100101100111001011101',
    '100000101010100110101110101000001',
    '111111101010101010101010101111111',
    '000000001101101100100111000000000',
    '101111100100011101001001001111100',
    '011110011000000010011111101101101',
    '101100101100000110101110100010110',
    '001010011111001010000100011011100',
    '111101110111100000110010110111010',
    '111011000011111110001101101000011',
    '100100110110011000010010011001110',
    '111100010101110010011110011111100',
    '000111100011100001010000010111001',
    '001111001011011001111011101101111',
    '000110111111101111001110110110110',
    '101100011000110011111110110111100',
    '101110101010100010001011110111010',
    '110111000100011100100101001000001',
    '100110110001100111101010010100010',
    '100001000001110100100101101010100',
    '100011111000110101100000111110000',
    '000000001111001010111011100010111',
    '111111100110100110100111101010110',
    '100000101001101100011101100011110',
    '101110101011110000110100111111011',
    '101110101101000111001101010011011',
    '101110101010011001010001001101000',
    '100000100010101010111111011011100',
    '111111101111101001010001101100010',
  ];
  function notifyFrame(){document.dispatchEvent?.(new Event('gtz-wallet-visibility'));}
  function startFrame(){
    if(!mobile())return;
    let data;try{data=JSON.parse(localStorage.getItem('gamttiz-my-license-v1')||'null')}catch{}
    disposeWallet();frame.replaceChildren();frameStarted=true;
    if(!data||!Number.isInteger(data.character)||data.character<0||data.character>=friendNames.length)return;
    const rotator=make('div','gtz-wallet-rotator');
    const inner=make('div','gtz-wallet-rotator-inner'),plane=make('div','gtz-wallet-plane');
    const shine=make('div','gtz-wallet-shine');
    const loading=make('p','gtz-wallet-loading','라이센스 준비 중…');
    rotator.setAttribute('role','button');rotator.tabIndex=0;rotator.setAttribute('aria-label','라이센스 카드 뒷면 보기');
    rotator.setAttribute('aria-pressed','false');rotator.setAttribute('aria-busy','true');
    inner.append(plane);rotator.append(inner);frame.append(rotator,loading,make('p','gtz-wallet-hint','카드를 좌우로 드래그하거나 탭해서 돌려보세요.'));
    // Canvases only compose the artwork OFFSCREEN. Decoded images are the
    // actual card faces, so GPU backface bugs cannot obscure the other face.
    const frontCanvas=document.createElement('canvas'),canvas=document.createElement('canvas');
    for(const c of [frontCanvas,canvas]){c.width=540;c.height=859;}
    let yaw=0,pitch=0,targetYaw=0,targetPitch=0,raf=0,lastFrame=0,drag=null,ready=false,frontArt,backArt,lastGestureAt=-Infinity;
    let paintedSide=null,paintedTransform='',paintedLight='';
    const events=new AbortController();
    const on=(el,type,fn,options={})=>el.addEventListener(type,fn,{...options,signal:events.signal});
    disposeWallet=()=>{events.abort();if(raf)cancelAnimationFrame(raf);raf=0;drag=null;ready=false;frontCanvas.width=frontCanvas.height=canvas.width=canvas.height=0;};
    function paintPose(time){
      raf=0;
      const dt=lastFrame?Math.min(42,time-lastFrame):16.7;
      lastFrame=time;const weight=reducedWallet.matches?1:1-Math.exp(-dt/(drag?25:62));
      yaw+=(targetYaw-yaw)*weight;pitch+=(targetPitch-pitch)*weight;
      if(Math.abs(targetYaw-yaw)<.12)yaw=targetYaw;
      if(Math.abs(targetPitch-pitch)<.12)pitch=targetPitch;
      // Normalize each half-turn exactly like license.js on mobile WebKit.
      const half=Math.floor((yaw+90)/180),back=Math.abs(half%2)===1,angle=yaw-half*180;
      // Only change faces at the edge-on crossover. Everything else in the
      // animation is a compositor-friendly transform/opacity; no layout or
      // expensive SVG/background-position repaint is performed on each frame.
      if(paintedSide!==back){
        paintedSide=back;rotator.dataset.side=back?'back':'front';
        if(frontArt&&backArt){frontArt.hidden=back;backArt.hidden=!back;}
        rotator.setAttribute('aria-pressed',String(back));
        rotator.setAttribute('aria-label',back?'라이센스 카드 앞면 보기':'라이센스 카드 뒷면 보기');
      }
      const transform='rotateX('+pitch.toFixed(3)+'deg) rotateY('+angle.toFixed(3)+'deg)';
      if(transform!==paintedTransform){paintedTransform=transform;inner.style.transform=transform;}
      const dx=Math.sin(angle*Math.PI/180),dy=Math.sin(pitch*Math.PI/180);
      const light=reducedWallet.matches?'0':(.42+Math.min(.44,Math.abs(dx)*.35+Math.abs(dy)*.72)).toFixed(2);
      if(light!==paintedLight){paintedLight=light;shine.style.opacity=light;}
      if(yaw!==targetYaw||pitch!==targetPitch)raf=requestAnimationFrame(paintPose);else lastFrame=0;
    }
    function setTarget(y,p=0){
      targetYaw=y;targetPitch=p;
      if(!raf)raf=requestAnimationFrame(paintPose);
    }
    function flipCard(){if(ready)setTarget(Math.round(targetYaw/180)*180+180,0);}
    function begin(id,x,y){
      if(!ready||drag)return false;
      drag={id,x,y,yaw:targetYaw,pitch:targetPitch,moved:false};return true;
    }
    function move(id,x,y){
      if(!drag||drag.id!==id)return false;
      const dx=x-drag.x,dy=y-drag.y;
      if(Math.abs(dx)>6||Math.abs(dy)>6)drag.moved=true;
      if(drag.moved)setTarget(drag.yaw+dx*1.12,Math.max(-18,Math.min(18,drag.pitch-dy*.16)));
      return true;
    }
    function finish(id,x,y,cancel=false){
      if(!drag||drag.id!==id)return;
      const d=drag;drag=null;lastGestureAt=performance.now();
      const moved=d.moved||Math.abs(x-d.x)>6||Math.abs(y-d.y)>6;
      const end=cancel?Math.round(d.yaw/180)*180:moved?Math.round((d.yaw+(x-d.x)*1.12)/180)*180:Math.round(d.yaw/180)*180+180;
      setTarget(end,0);
    }
    // A stationary hit target owns the entire gesture, not the rotating plane.
    if(window.PointerEvent){
      on(rotator,'pointerdown',e=>{
        if(e.button!==0||!begin(e.pointerId,e.clientX,e.clientY))return;
        if(e.cancelable)e.preventDefault();
        try{rotator.setPointerCapture(e.pointerId)}catch{}
      });
      on(window,'pointermove',e=>{if(move(e.pointerId,e.clientX,e.clientY)&&e.cancelable)e.preventDefault();},{passive:false});
      on(window,'pointerup',e=>finish(e.pointerId,e.clientX,e.clientY));
      on(window,'pointercancel',e=>finish(e.pointerId,e.clientX,e.clientY,true));
      on(rotator,'lostpointercapture',e=>finish(e.pointerId,e.clientX,e.clientY,true));
    }else{
      // Fallback for older iOS WebKit, which has no PointerEvent.
      on(rotator,'touchstart',e=>{const t=e.changedTouches[0];if(t&&begin(t.identifier,t.clientX,t.clientY)&&e.cancelable)e.preventDefault();},{passive:false});
      on(window,'touchmove',e=>{for(const t of e.changedTouches)if(move(t.identifier,t.clientX,t.clientY)&&e.cancelable)e.preventDefault();},{passive:false});
      for(const type of ['touchend','touchcancel'])on(window,type,e=>{for(const t of e.changedTouches)finish(t.identifier,t.clientX,t.clientY,type==='touchcancel');});
      on(rotator,'mousedown',e=>{if(e.button===0)begin('mouse',e.clientX,e.clientY);});
      on(window,'mousemove',e=>move('mouse',e.clientX,e.clientY));
      on(window,'mouseup',e=>finish('mouse',e.clientX,e.clientY));
    }
    on(rotator,'keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flipCard();}});
    on(rotator,'click',e=>{if(e.detail===0&&performance.now()-lastGestureAt>350)flipCard();});
    paintPose(performance.now());
    const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return;
    const load=src=>new Promise((resolve,reject)=>{const img=new Image();img.decoding='async';img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});
    const index=data.character;
    Promise.all([load('assets/license/front.png'),load('assets/license/back.png'),load('assets/illustrations-3d/friend-'+String(index+1).padStart(2,'0')+'.png')]).then(async ([frontTemplate,template,sprite])=>{
      if(!rotator.isConnected||events.signal.aborted)return;
      const fctx=frontCanvas.getContext('2d',{alpha:false});if(fctx){fctx.setTransform(.5,0,0,.5,0,0);fctx.drawImage(frontTemplate,0,101,1080,1718,0,0,1080,1718)}
      ctx.setTransform(.5,0,0,.5,0,0);
      const W=1080,H=1718,CROP_Y=101;
      ctx.drawImage(template,0,CROP_Y,W,H,0,0,W,H);
      const max=376,scale=Math.min(max/sprite.naturalWidth,max/sprite.naturalHeight);
      const w=sprite.naturalWidth*scale,h=sprite.naturalHeight*scale;
      ctx.drawImage(sprite,540-w/2,704-CROP_Y-h/2,w,h);
      function value(text,x,y,maxWidth,size){
        ctx.fillStyle='#ffe09a';ctx.textAlign='right';ctx.textBaseline='alphabetic';
        text=String(text||'');let fontSize=size;
        do{ctx.font='600 '+fontSize+'px "Wanted Sans Variable","Noto Sans CJK KR","Noto Sans KR","Malgun Gothic",Arial,sans-serif';fontSize--;}while(fontSize>20&&ctx.measureText(text).width>maxWidth);
        ctx.fillText(text,x,y,maxWidth);
      }
      value(data.name,950,1071-CROP_Y,633,46);
      value(friendNames[index],950,1233-CROP_Y,510,40);
      value(data.number,950,1400-CROP_Y,530,34);
      const issued=new Date(data.issuedAt);
      let date='발급 후 표시';
      if(Number.isFinite(issued.getTime())){
        const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(issued);
        date=['year','month','day'].map(type=>parts.find(p=>p.type===type)?.value||'').join('.');
      }
      ctx.fillStyle='#ffe09a';ctx.textAlign='left';ctx.textBaseline='alphabetic';
      ctx.font='42px Georgia,"Times New Roman",serif';ctx.fillText('Date of Issue:',129,1401);
      ctx.font='600 39px "Wanted Sans Variable",Arial,sans-serif';ctx.fillText(date,129,1460,545);
      ctx.font='500 23px Arial,sans-serif';ctx.fillText('SCAN TO OPEN MY ID',129,1547,545);
      const module=6,quiet=4,x=704,y=1340,size=(qrMatrix.length+quiet*2)*module;
      ctx.fillStyle='#f5d578';ctx.fillRect(x,y,size,size);ctx.fillStyle='#780708';
      qrMatrix.forEach((row,j)=>{for(let i=0;i<row.length;i++)if(row[i]==='1')ctx.fillRect(x+(i+quiet)*module,y+(j+quiet)*module,module,module)});
      const decoded=async(c,alt)=>{
        const img=new Image();img.alt=alt;img.width=c.width;img.height=c.height;img.draggable=false;
        // Keep the proven WebKit-safe decoded data image path, then release
        // the temporary canvas backing store as soon as loading finishes.
        await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=c.toDataURL('image/png');});
        c.width=c.height=0;
        if(typeof img.decode==='function'){try{await img.decode()}catch{}}
        return img;
      };
      const [frontImage,backImage]=await Promise.all([decoded(frontCanvas,'라이센스 앞면'),decoded(canvas,'라이센스 뒷면 '+data.name)]);
      if(!rotator.isConnected||events.signal.aborted)return;
      frontArt=frontImage;backArt=backImage;frontArt.hidden=false;backArt.hidden=true;plane.append(frontArt,backArt,shine);
      ready=true;rotator.removeAttribute('aria-busy');loading.remove();
      paintPose(performance.now());
    }).catch(()=>{if(rotator.isConnected&&!events.signal.aborted){loading.textContent='라이센스 이미지를 불러오지 못했어요. MY ID 페이지에서 확인해주세요.';rotator.removeAttribute('aria-busy');}});
  }
  function sync(){
    const exists=hasCard();
    if(lastExists!==null&&lastExists!==exists&&frameStarted){
      frameStarted=false;if(presented)startFrame();else frame.replaceChildren();
    }
    lastExists=exists;updateSetting();
    if(!mobile()||!exists||!enabled){clearRecovery();updateSetting();if(presented&&(!exists||!mobile()))settle(false);return;}
    if(exists){watchSensor();}
  }
  function present(){
    clearTimeout(sheetTimer);sheetTimer=0;if(presented)return;
    presented=true;sheet.classList.add('is-visible');
    document.documentElement.classList.add('gtz-wallet-open');notifyFrame();startFrame();
  }
  function settle(next){
    if(next&&(!mobile()||!hasCard()))return;
    if(next&&!presented){present();content.getBoundingClientRect();}
    if(!presented)return;
    open=next;sheet.classList.toggle('is-open',next);
    sheet.setAttribute('aria-hidden',String(!next));sheet.inert=!next;
    clearTimeout(sheetTimer);
    if(next){if(dock.dataset.mode!=='closed')setMode(dock.dataset.mode);return;}
    lastOpened=performance.now();firstHit=null;
    sheetTimer=setTimeout(()=>{
      if(!open){presented=false;disposeWallet();frame.replaceChildren();frameStarted=false;sheet.classList.remove('is-visible');document.documentElement.classList.remove('gtz-wallet-open');notifyFrame();}
      sheetTimer=0;
    },reducedWallet.matches?0:440);
  }
  function vector(v){return v&&[v.x,v.y,v.z].every(Number.isFinite)?[v.x,v.y,v.z]:null;}
  function motion(e){
    if(!enabled||!mobile()||document.hidden||presented||open)return;
    let a=vector(e.acceleration);
    if(!a){
      const raw=vector(e.accelerationIncludingGravity);if(!raw)return;
      if(!gravity){gravity=raw.slice();return;}
      a=raw.map((x,i)=>x-gravity[i]);gravity=gravity.map((x,i)=>x*.88+raw[i]*.12);
    }
    if(!sensorSeen){sensorSeen=true;sessionAllowed=true;clearRecovery();shakeStatus.textContent='휴대폰을 좌우로 두 번 가볍게 흔들어 카드를 열어보세요.';updateSetting();}
    if(!lastExists||document.body.classList.contains('license-animating'))return;
    const now=performance.now(),power=Math.hypot(...a);
    if(now-lastOpened<2200||power<11||now-lastHit<85)return;
    lastHit=now;
    if(firstHit&&now-firstHit.time>1000)firstHit=null;
    if(!firstHit){firstHit={a,power,time:now};return;}
    const similarity=a.reduce((sum,x,i)=>sum+x*firstHit.a[i],0)/(power*firstHit.power);
    if(similarity<-.35&&now-firstHit.time>=85){
      firstHit=null;lastOpened=now;settle(true);
    }else if(now-firstHit.time>450)firstHit={a,power,time:now};
  }
  window.addEventListener('devicemotion',motion,{passive:true});
  function resumeSensors(){
    restorePreference();resetSensor();
    window.removeEventListener?.('devicemotion',motion);
    window.addEventListener('devicemotion',motion,{passive:true});sync();
  }
  document.addEventListener('visibilitychange',()=>{firstHit=null;gravity=null;if(document.hidden){clearRecovery();updateSetting();}else resumeSensors();});
  close.addEventListener('click',()=>settle(false));backdrop.addEventListener('click',()=>settle(false));
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&presented)settle(false);});
  window.addEventListener('storage',e=>{if(e.key===shakeKey||e.key===null)restorePreference();if(e.key==='gamttiz-my-license-v1'||e.key===shakeKey||e.key===null)sync();});
  window.addEventListener('gamttiz:license-change',sync);window.addEventListener('pageshow',e=>{if(e.persisted)resumeSensors();else{restorePreference();sync();}});
  window.addEventListener('hashchange',sync);
  sheet.hidden=false;sheet.inert=true;sheet.setAttribute('aria-hidden','true');
  if(walletMedia.addEventListener)walletMedia.addEventListener('change',sync);
  else if(walletMedia.addListener)walletMedia.addListener(sync);
  sync();
}

})();

