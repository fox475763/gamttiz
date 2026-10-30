// Rotate only the supplied, unaltered product photographs.
const carouselMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const posterViewport=document.querySelector('.poster-viewport');
let posterIndex=0;
function slideProduct(viewport,nextIndex){
  const oldImage=viewport.querySelector('img');
  if(!oldImage||viewport.dataset.sliding==='true')return;
  const product=products[nextIndex];
  const nextImage=oldImage.cloneNode(false);
  nextImage.src=product.image;
  nextImage.alt=`${product.name} 원본 제품 소개`;
  nextImage.removeAttribute('fetchpriority');
  nextImage.loading='eager';
  nextImage.classList.add('carousel-incoming');
  viewport.dataset.sliding='true';
  viewport.append(nextImage);
  const start=()=>{
    const oldMotion=oldImage.animate([{transform:'translateX(0)'},{transform:'translateX(-100%)'}],{duration:700,easing:'cubic-bezier(.32,.02,.2,1)'});
    const newMotion=nextImage.animate([{transform:'translateX(100%)'},{transform:'translateX(0)'}],{duration:700,easing:'cubic-bezier(.32,.02,.2,1)'});
    Promise.all([oldMotion.finished,newMotion.finished]).then(()=>{oldImage.remove();nextImage.classList.remove('carousel-incoming');viewport.dataset.sliding='false';}).catch(()=>{oldImage.remove();nextImage.classList.remove('carousel-incoming');viewport.dataset.sliding='false';});
  };
  if(nextImage.complete)start();else nextImage.addEventListener('load',start,{once:true});
}
if(posterViewport){
  setInterval(()=>{if(document.hidden||carouselMotion.matches||posterViewport.closest('.hero-poster:hover'))return;posterIndex=(posterIndex+1)%products.length;slideProduct(posterViewport,posterIndex);},4200);
}
const storyGroups=[
  {element:document.querySelector('.story-row:not(.reverse) .story-image'),indexes:[7,13]},
  {element:document.querySelector('.story-row.reverse .story-image'),indexes:[5,8]}
];
storyGroups.forEach((group,groupIndex)=>{
  if(!group.element)return;
  const images=[...group.element.querySelectorAll('img')];
  images.forEach(img=>{const slot=document.createElement('div');slot.className='story-slot';img.before(slot);slot.append(img);});
  let turn=0;
  setInterval(()=>{
    if(document.hidden||carouselMotion.matches||group.element.matches(':hover'))return;
    const slot=group.element.querySelectorAll('.story-slot')[turn%2];
    const next=(group.indexes[turn%2]+2)%products.length;
    group.indexes[turn%2]=next;
    slideProduct(slot,next);
    turn++;
  },groupIndex===0?4600:5300);
});
