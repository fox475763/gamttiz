(() => {
'use strict';
// Native swiping and keyboard scrolling; desktop mouse drag only when the
// responsive gallery actually overflows. No frame loop or scroll interception.
for(const track of document.querySelectorAll('.clean-gallery')){
 let gesture=null, suppress=false;
 track.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='mouse'||e.button!==0||track.scrollWidth<=track.clientWidth+2)return;
  gesture={id:e.pointerId,x:e.clientX,left:track.scrollLeft,drag:false};
 });
 track.addEventListener('pointermove',e=>{
  if(!gesture||gesture.id!==e.pointerId)return;
  if(!gesture.drag&&Math.abs(e.clientX-gesture.x)<7)return;
  if(!gesture.drag){gesture.drag=true;track.setPointerCapture(e.pointerId);}
  track.scrollLeft=gesture.left+gesture.x-e.clientX;e.preventDefault();
 });
 const end=e=>{if(!gesture||gesture.id!==e.pointerId)return;suppress=gesture.drag;gesture=null;if(suppress)setTimeout(()=>suppress=false,0);};
 track.addEventListener('pointerup',end);track.addEventListener('pointercancel',end);
 track.addEventListener('click',e=>{if(suppress){e.preventDefault();e.stopImmediatePropagation();}},true);
 track.addEventListener('dragstart',e=>e.preventDefault());
 track.addEventListener('keydown',e=>{if(e.target!==track||!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();track.scrollBy({left:(e.key==='ArrowRight'?1:-1)*track.clientWidth*.65,behavior:'smooth'});});
}
})();