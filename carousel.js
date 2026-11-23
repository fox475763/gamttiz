// Rotate the original character art on the home hero; product imagery stays in product sections.
const carouselMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const walletOpen=()=>document.documentElement.classList.contains('gtz-wallet-open');
const posterViewport=document.querySelector('.poster-viewport');
let posterIndex=0;
// Avoid starting image decoding/animation while the touch scroll is in motion.
// A single timer marks the resting state; never changes layout during scrolling.
let lastPageScroll=-Infinity,scrollIdleTimer=0;
const homeMotion=window.GTZHomeMotion={scrolling:false};
const syncIdle=()=>{
  const remaining=550-(performance.now()-lastPageScroll);
  if(remaining>0){scrollIdleTimer=setTimeout(syncIdle,remaining);return;}
  scrollIdleTimer=0;homeMotion.scrolling=false;
  document.dispatchEvent(new Event('gtz-home-scroll-state'));
};
(document.querySelector('.home-scroll-viewport')||window).addEventListener('scroll',()=>{
  if(document.body.classList.contains('home-native-touch'))return;
  lastPageScroll=performance.now();
  if(homeMotion.scrolling)return;
  homeMotion.scrolling=true;
  scrollIdleTimer=setTimeout(syncIdle,550);
  document.dispatchEvent(new Event('gtz-home-scroll-state'));
},{passive:true});
const visible=el=>{const r=el.getBoundingClientRect();return r.bottom>0&&r.top<window.innerHeight&&r.right>0&&r.left<window.innerWidth;};
function slideProduct(viewport,nextIndex,onComplete){
  const oldImage=viewport.querySelector('img');
  if(!oldImage||viewport.dataset.sliding==='true')return;
  const product=products[nextIndex];
  const illustration=viewport.dataset.artwork==="illustration";
  const asset=illustration?product.illustration:product.image;
  const nextImage=oldImage.cloneNode(false);
  nextImage.removeAttribute('src');
  nextImage.removeAttribute('srcset');
  nextImage.alt=illustration?`${product.name} 캐릭터 일러스트`:`${product.name} 원본 제품 소개`;
  nextImage.removeAttribute('fetchpriority');
  nextImage.loading='eager';
  nextImage.classList.add('carousel-incoming');
  viewport.dataset.sliding='true';
  const release=()=>{viewport.dataset.sliding='false';};
  const finish=()=>{oldImage.remove();nextImage.classList.remove('carousel-incoming');release();onComplete?.();};
  const start=async()=>{
    try{await nextImage.decode?.();}catch{}
    if(!nextImage.naturalWidth){release();return;}
    if(walletOpen()||homeMotion.scrolling||!visible(viewport)||document.hidden){release();return;}
    viewport.append(nextImage);
    if(typeof oldImage.animate!=='function'||carouselMotion.matches){finish();return;}
    const oldMotion=oldImage.animate(illustration?[{opacity:1},{opacity:0}]:[{transform:'translateX(0)'},{transform:'translateX(-100%)'}],{duration:500,easing:'ease-in-out'});
    const newMotion=nextImage.animate(illustration?[{opacity:0},{opacity:1}]:[{transform:'translateX(100%)'},{transform:'translateX(0)'}],{duration:500,easing:'ease-in-out'});
    // If scrolling starts mid-slide, commit the already decoded image, with
    // no concurrent moving layers left behind.
    const onScroll=()=>{if(walletOpen()||homeMotion.scrolling){oldMotion.cancel();newMotion.cancel();}};
    document.addEventListener('gtz-home-scroll-state',onScroll);
    document.addEventListener('gtz-wallet-visibility',onScroll);
    Promise.all([oldMotion.finished,newMotion.finished]).catch(()=>{}).then(()=>{
      document.removeEventListener('gtz-home-scroll-state',onScroll);finish();
      document.removeEventListener('gtz-wallet-visibility',onScroll);
    });
  };
  nextImage.addEventListener('load',start,{once:true});
  nextImage.addEventListener('error',release,{once:true});
  const variants=illustration?null:window.GTZDisplayAssets?.[asset];
  if(variants?.length)nextImage.srcset=variants.map(([url,w])=>url+' '+w+'w').join(', ');
  nextImage.src=asset;
}
if(posterViewport){
  setInterval(()=>{if(walletOpen()||homeMotion.scrolling||document.hidden||carouselMotion.matches||!visible(posterViewport)||posterViewport.closest('.hero-poster:hover'))return;const next=(posterIndex+1)%products.length;slideProduct(posterViewport,next,()=>{posterIndex=next;});},5200);
}
const storyGroups=[
  {element:document.querySelector('.story-row:not(.reverse) .story-image'),indexes:[7,13]},
  {element:document.querySelector('.story-row.reverse .story-image'),indexes:[5,8]}
];
storyGroups.forEach((group,groupIndex)=>{
  if(!group.element||group.element.hasAttribute('data-static-photo'))return;
  const images=[...group.element.querySelectorAll('img')];
  images.forEach(img=>{const slot=document.createElement('div');slot.className='story-slot';img.before(slot);slot.append(img);});
  let turn=0;
  setInterval(()=>{
    if(walletOpen()||homeMotion.scrolling||document.hidden||carouselMotion.matches||!visible(group.element)||group.element.matches(':hover'))return;
    const slotIndex=turn%2,slot=group.element.querySelectorAll('.story-slot')[slotIndex];
    const next=(group.indexes[slotIndex]+2)%products.length;
    slideProduct(slot,next,()=>{group.indexes[slotIndex]=next;turn++;});
  },groupIndex===0?4600:5300);
});

