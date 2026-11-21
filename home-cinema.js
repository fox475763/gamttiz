/* Native scroll, reversible film chapters, and the original live content. */
(()=>{
  'use strict';
  const body=document.body,main=document.getElementById('main');
  const opening=main?.querySelector('.cinema-opening'),hero=opening?.querySelector('.hero');
  if(!body.classList.contains('home-cinema')||!opening||!hero)return;
  const header=document.querySelector('.header'),poster=hero.querySelector('.hero-poster'),preference=matchMedia('(prefers-reduced-motion: reduce)');
  const nodes=[...main.querySelectorAll('#collection,.story-row,#holder,.home-package,#experiences,#fry-radar-preview,.home-news,#guide,#contact,.social')];
  const scenes=nodes.map(element=>{
    let chapter=null;
    if(element.matches('.story-row,#holder,.home-package')){
      chapter=document.createElement('div');chapter.className='cinema-chapter';
      element.before(chapter);chapter.append(element);element.classList.add('cinema-stage');
    }
    return {element,chapter,top:0,height:0,runway:0,pinTop:0,marginTop:0,key:'',near:false};
  });
  const clamp=x=>Math.min(1,Math.max(0,x));
  const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
  const px=n=>Math.round(n)+'px',num=n=>n.toFixed(3);
  const write=(el,props)=>{for(const [key,value] of Object.entries(props))el.style.setProperty(key,value);};
  let viewport=0,width=0,openingTop=0,heroHeight=0,heroOverflow=0,runway=0,headerHeight=0,centerX=0,centerY=0,active=false,raf=0,needsMeasure=true,heroKey='',heroNear=false;
  function measure(){
    const y=window.scrollY;
    // A stable viewport avoids resizing the film when Safari's address bar moves.
    viewport=Math.min(window.innerHeight,document.documentElement.clientHeight||window.innerHeight);
    width=window.innerWidth;headerHeight=header?.offsetHeight||0;
    const available=Math.max(1,viewport-headerHeight);
    heroHeight=hero.offsetHeight;
    heroOverflow=Math.max(0,heroHeight-available);
    centerX=hero.clientWidth/2-(poster.offsetLeft+poster.offsetWidth/2);
    centerY=heroOverflow+Math.min(available,heroHeight)/2-(poster.offsetTop+poster.offsetHeight/2);
    // Keep the original tall mobile composition: scroll through the copy
    // normally, then hold the bottom of the hero for the product closeup.
    const pin=available>=350&&poster.offsetHeight<=available*1.25;
    runway=pin?Math.round(Math.min(980,available*(width<=700?.94:1.14))):0;
    opening.classList.toggle('is-pinned',pin);
    write(opening,{
      '--cinema-hero-height':px(heroHeight),'--cinema-stage-height':px(heroHeight),
      '--cinema-pin-top':px(headerHeight-heroOverflow),'--cinema-runway':px(runway),
      '--cinema-pin-offset':px(heroOverflow)
    });
    openingTop=opening.getBoundingClientRect().top+y;
    for(const scene of scenes){
      if(scene.chapter){
        const {chapter,element}=scene;
        const size=element.offsetHeight;
        const style=getComputedStyle(element);
        scene.marginTop=parseFloat(style.marginTop)||0;
        const marginBottom=parseFloat(style.marginBottom)||0;
        // No reflow of the content itself. Only the wrapper adds the hold.
        const pinned=available>=380&&size<=available+5;
        chapter.classList.toggle('is-pinned',pinned);
        scene.pinTop=headerHeight+Math.max(0,(available-size)*.32);
        scene.runway=pinned?Math.round(Math.min(700,available*.82)):0;
        write(chapter,{'--cinema-pin-top':px(scene.pinTop),'--cinema-stage-height':px(size),'--cinema-stage-margins':px(scene.marginTop+marginBottom),'--cinema-runway':px(scene.runway)});
      }
    }
    for(const scene of scenes){
      const rect=(scene.chapter||scene.element).getBoundingClientRect();
      scene.top=rect.top+y+scene.marginTop;scene.height=scene.element.offsetHeight;scene.key='';
    }
    heroKey='';needsMeasure=false;
  }
  function render(){
    raf=0;
    if(!active||document.hidden||document.documentElement.classList.contains('gtz-wallet-open'))return;
    if(needsMeasure)measure();
    const y=window.scrollY,mobile=width<=700,available=Math.max(1,viewport-headerHeight);
    const nearOpening=y<=openingTop+heroHeight+runway&&y+viewport>=openingTop;
    if(nearOpening!==heroNear){heroNear=nearOpening;opening.classList.toggle('cinema-in-view',heroNear);}
    if(nearOpening||!heroKey){
      const travel=Math.max(0,y+headerHeight-openingTop);
      const raw=clamp((travel-(runway?heroOverflow:0))/Math.max(1,runway||heroHeight*.8));
      const p=Math.round(raw*1000)/1000;
      const copy=ease(Math.max(0,travel-12)/Math.max(150,heroOverflow+runway*.46));
      const approach=runway&&heroOverflow?ease(travel/heroOverflow):0;
      const k=p+'|'+Math.round(copy*250)+'|'+Math.round(approach*250);
      if(k!==heroKey){
        heroKey=k;
        const move=ease(p/.58),settle=ease((p-.72)/.28);
        // The existing keyring poster is the camera's subject. Shift it into
        // frame while the brand copy moves out, then ease into the next scene.
        write(hero,{
          '--cinema-hero-copy-x':px(mobile?0:-copy*width*.23),
          '--cinema-hero-copy':px(-copy*(mobile?95:105)),
          '--cinema-hero-opacity':num(1-copy),
          '--cinema-copy-events':copy>.96?'none':'auto',
          '--cinema-hero-poster-x':px(move*centerX),
          '--cinema-hero-poster':px(move*centerY-approach*10*(1-move)-settle*(mobile?72:105)),
          '--cinema-hero-scale':num(1+approach*.025*(1-move)+move*(mobile?.12:.41)+settle*(mobile?.035:.04)),
          '--cinema-inner-scale':num(1+move*(mobile?.53:.30)+settle*(mobile?.14:.13)),
          '--cinema-inner-y':px(-settle*(mobile?13:20)),
          '--cinema-hero-tilt':num(-move*(mobile?3.5:5)+settle*(mobile?3.5:5))+'deg',
          '--cinema-hero-pattern':px(move*145+settle*90),
          '--cinema-poster-opacity':num(1-settle*.24)
        });
      }
    }
    for(const scene of scenes){
      const top=scene.top-y,bottom=top+scene.height+scene.runway;
      const near=top<viewport*1.12&&bottom>headerHeight;
      if(near!==scene.near){scene.near=near;scene.element.classList.toggle('cinema-in-view',near);}
      const entry=ease((viewport*.99-top)/Math.max(1,Math.min(scene.height*.72,available*.66)));
      const inScene=scene.runway?clamp((scene.pinTop-top)/scene.runway):clamp((viewport*.73-top)/(scene.height+available*.42));
      const e=Math.round(entry*200)/200,p=Math.round(ease(inScene)*200)/200;
      const key=e+'|'+p+'|'+mobile;
      if(key===scene.key)continue;
      scene.key=key;
      const delay=1-e,direction=scene.element.classList.contains('reverse')?-1:1,closeup=Math.sin(p*Math.PI);
      const product=!!scene.chapter;
      // Real entrance choreography, then a second push-in during each held
      // product scene. Separate transforms keep the gallery drag and hover intact.
      write(scene.element,{
        '--cinema-lift':px(delay*(mobile?84:150)-closeup*(product?(mobile?20:42):0)),
        '--cinema-deep-lift':px(delay*(mobile?125:210)),
        '--cinema-opacity':num(.10+.90*e),
        '--cinema-image-opacity':num(.13+.87*e),
        '--cinema-image-x':px(-delay*(mobile?35:180)*direction),
        '--cinema-copy-x':px(delay*(mobile?24:158)*direction),
        '--cinema-image-y':px(delay*(mobile?100:130)-closeup*(mobile?35:55)),
        '--cinema-image-scale':num(.66+.34*e+closeup*(mobile?.055:.10)),
        '--cinema-image-roll':num(-delay*(mobile?3:5)*direction)+'deg',
        '--cinema-detail-scale':num(1+closeup*(mobile?.14:.24)),
        '--cinema-detail-x':px(closeup*(mobile?7:16)),
        '--cinema-detail-y':px(closeup*(mobile?15:25)),
        '--cinema-stagger':px(delay*(mobile?38:60)),
        '--cinema-card-opacity':num(.38+.62*e)
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
