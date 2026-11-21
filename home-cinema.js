/* Native scroll, reversible film chapters, and the original live content. */
(()=>{
  'use strict';
  const body=document.body,main=document.getElementById('main');
  const opening=main?.querySelector('.cinema-opening'),hero=opening?.querySelector('.hero');
  if(!body.classList.contains('home-cinema')||!opening||!hero)return;
  const header=document.querySelector('.header'),preference=matchMedia('(prefers-reduced-motion: reduce)');
  const nodes=[...main.querySelectorAll('#collection,.story-row,#holder,.home-package,#experiences,#fry-radar-preview,.home-news,#guide,#contact,.social')];
  const scenes=nodes.map(element=>{
    let chapter=null;
    if(element.matches('.story-row,#holder,.home-package')){
      chapter=document.createElement('div');chapter.className='cinema-chapter';
      element.before(chapter);chapter.append(element);element.classList.add('cinema-stage');
    }
    return {element,chapter,top:0,height:0,runway:0,key:'',near:false};
  });
  const clamp=x=>Math.min(1,Math.max(0,x));
  const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
  const px=n=>Math.round(n)+'px',num=n=>n.toFixed(3);
  const write=(el,props)=>{for(const [key,value] of Object.entries(props))el.style.setProperty(key,value);};
  let viewport=0,width=0,openingTop=0,heroHeight=0,runway=0,headerHeight=0,active=false,raf=0,needsMeasure=true,heroKey='',heroNear=false;
  function measure(){
    const y=window.scrollY;
    // A stable viewport avoids resizing the film when Safari's address bar moves.
    viewport=Math.min(window.innerHeight,document.documentElement.clientHeight||window.innerHeight);
    width=window.innerWidth;headerHeight=header?.offsetHeight||0;
    const available=viewport-headerHeight;
    write(opening,{'--cinema-header':px(headerHeight)});
    heroHeight=hero.offsetHeight;
    const pin=available>=470&&heroHeight<=available+5;
    runway=pin?Math.round(Math.min(820,available*(width<=700?.72:.95))):0;
    opening.classList.toggle('is-pinned',pin);
    write(opening,{'--cinema-hero-height':px(heroHeight),'--cinema-runway':px(runway)});
    openingTop=opening.getBoundingClientRect().top+y;
    for(const scene of scenes){
      if(scene.chapter){
        const {chapter,element}=scene;
        write(chapter,{'--cinema-header':px(headerHeight)});
        // A short screen uses a normal scrolling scene rather than cropping its text.
        const candidate=width>700&&available>=480;
        chapter.classList.toggle('is-pinned',candidate);
        const size=element.offsetHeight;
        const pinned=candidate&&size<=available+5;
        chapter.classList.toggle('is-pinned',pinned);
        scene.runway=pinned?Math.round(Math.min(530,available*.61)):0;
        write(chapter,{'--cinema-stage-height':px(element.offsetHeight),'--cinema-runway':px(scene.runway)});
      }
    }
    for(const scene of scenes){
      const rect=(scene.chapter||scene.element).getBoundingClientRect();
      scene.top=rect.top+y;scene.height=scene.element.offsetHeight;scene.key='';
    }
    heroKey='';needsMeasure=false;
  }
  function render(){
    raf=0;
    if(!active||document.hidden||document.documentElement.classList.contains('gtz-wallet-open'))return;
    if(needsMeasure)measure();
    const y=window.scrollY,mobile=width<=700,available=viewport-headerHeight;
    const nearOpening=y<=openingTop+heroHeight+runway&&y+viewport>=openingTop;
    if(nearOpening!==heroNear){heroNear=nearOpening;opening.classList.toggle('cinema-in-view',heroNear);}
    if(nearOpening||!heroKey){
      const raw=clamp((y+headerHeight-openingTop)/Math.max(1,runway||heroHeight*.9));
      const p=Math.round(raw*1000)/1000;
      if(String(p)!==heroKey){
        heroKey=String(p);
        const move=ease(p/.70),settle=ease((p-.70)/.30);
        // The existing keyring poster is the camera's subject. Shift it into
        // frame while the brand copy moves out, then ease into the next scene.
        write(hero,{
          '--cinema-hero-copy-x':px(mobile?0:-move*width*.16),
          '--cinema-hero-copy':px(-move*(mobile?44:70)),
          '--cinema-hero-opacity':num(1-move*(mobile?.55:.77)),
          '--cinema-hero-poster-x':px(mobile?0:-move*width*.195+settle*width*.025),
          '--cinema-hero-poster':px(-move*(mobile?28:10)-settle*(mobile?16:40)),
          '--cinema-hero-scale':num(1+move*(mobile?.075:.32)-settle*(mobile?.025:.045)),
          '--cinema-inner-scale':num(1+move*(mobile?.34:.16)),
          '--cinema-hero-tilt':num(mobile?0:-move*3+settle*3)+'deg',
          '--cinema-hero-pattern':px(move*92+settle*65)
        });
      }
    }
    for(const scene of scenes){
      const top=scene.top-y,bottom=top+scene.height+scene.runway;
      const near=top<viewport*1.12&&bottom>headerHeight;
      if(near!==scene.near){scene.near=near;scene.element.classList.toggle('cinema-in-view',near);}
      const entry=ease((viewport*.98-top)/Math.max(1,Math.min(scene.height*.78,available*.75)));
      const inScene=scene.runway?clamp((headerHeight-top)/scene.runway):clamp((viewport*.55-top)/(scene.height+available*.3));
      const e=Math.round(entry*200)/200,p=Math.round(ease(inScene)*200)/200;
      const key=e+'|'+p+'|'+mobile;
      if(key===scene.key)continue;
      scene.key=key;
      const delay=1-e,direction=scene.element.classList.contains('reverse')?-1:1;
      const product=!!scene.chapter;
      // Real entrance choreography, then a second push-in during each held
      // product scene. Separate transforms keep the gallery drag and hover intact.
      write(scene.element,{
        '--cinema-lift':px(delay*(mobile?48:95)-p*(product?(mobile?8:24):0)),
        '--cinema-deep-lift':px(delay*(mobile?78:140)),
        '--cinema-opacity':num(.20+.80*e),
        '--cinema-image-opacity':num(.24+.76*e),
        '--cinema-image-x':px(-delay*(mobile?0:115)*direction),
        '--cinema-copy-x':px(delay*(mobile?0:95)*direction),
        '--cinema-image-y':px(delay*(mobile?64:86)-p*(mobile?16:34)),
        '--cinema-image-scale':num(.79+.21*e+p*(mobile?.04:.095)),
        '--cinema-detail-scale':num(1+p*(mobile?.07:.15)),
        '--cinema-detail-y':px(p*(mobile?7:13)),
        '--cinema-stagger':px(delay*(mobile?22:34)),
        '--cinema-card-opacity':num(.58+.42*e)
      });
    }
  }
  function schedule(layout=false){
    if(layout)needsMeasure=true;
    if(active&&!raf)raf=requestAnimationFrame(render);
  }
  function sync(){
    active=!preference.matches;body.classList.toggle('is-cinematic',active);
    if(!active){
      if(raf)cancelAnimationFrame(raf);raf=0;opening.classList.remove('is-pinned','cinema-in-view');opening.removeAttribute('style');
      for(const scene of scenes){scene.element.classList.remove('cinema-in-view');scene.chapter?.classList.remove('is-pinned');scene.near=false;}
      heroNear=false;heroKey='';runway=0;return;
    }
    schedule(true);
  }
  window.addEventListener('scroll',()=>schedule(),{passive:true});
  window.addEventListener('resize',()=>schedule(true),{passive:true});
  window.addEventListener('pageshow',()=>schedule(true));
  document.addEventListener('visibilitychange',()=>schedule(true));
  document.addEventListener('focusin',()=>schedule());
  if(preference.addEventListener)preference.addEventListener('change',sync);
  else preference.addListener?.(sync);
  if('ResizeObserver' in window){
    const observer=new ResizeObserver(()=>schedule(true));
    [main,hero,header,...nodes].filter(Boolean).forEach(el=>observer.observe(el));
  }
  document.fonts?.ready.then(()=>schedule(true));
  sync();
})();
