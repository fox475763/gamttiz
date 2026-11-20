/* Natural touch/wheel inertia + native snap; scrolling never opens a profile. */
(()=>{
 'use strict';
 const grid=document.querySelector('#dex-grid'),shell=document.querySelector('.dex-dial');
 const up=document.querySelector('#dex-dial-up'),down=document.querySelector('#dex-dial-down'),label=document.querySelector('#dex-dial-number'),detail=document.querySelector('#dex-detail');
 const {number}=GTZFriends,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let active=null,frame=0;
 const rows=()=>[...grid.children].filter(b=>!b.hidden);
 function centerOf(el){const r=el.getBoundingClientRect();return r.top+r.height/2;}
 function nearest(list,center){
   let best=null,distance=Infinity;
   for(const b of list){const d=Math.abs(centerOf(b)-center);if(d<distance){best=b;distance=d;}}
   return best;
 }
 function sync(){
   frame=0;
   const list=rows(),center=centerOf(grid);shell.hidden=list.length===0;
   const picked=nearest(list,center),index=list.indexOf(picked);
   if(picked!==active){if(active){active.classList.remove('is-dial-current');active.removeAttribute('aria-current');}active=picked;if(active){active.classList.add('is-dial-current');active.setAttribute('aria-current','true');}}
   list.forEach((b,i)=>{b.classList.toggle('is-dial-near',Math.abs(i-index)===1);b.classList.toggle('is-dial-far',Math.abs(i-index)>1);});
   label.textContent=active?'NO. '+number(Number(active.dataset.friendId)):'—';
   up.disabled=index<=0;down.disabled=index<0||index>=list.length-1;
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(sync);}
 function centerRow(b,behavior='smooth'){
   if(!b||b.hidden)return;
   const top=grid.scrollTop+centerOf(b)-centerOf(grid);
   grid.scrollTo({top,behavior:reduced.matches?'instant':behavior});
   schedule();
 }
 function reset(){
   const list=rows();shell.hidden=list.length===0;
   if(list.length){
     // The first and last rows have matching spacer padding so either can sit at the center.
     grid.scrollTo({top:0,behavior:'instant'});
   }
   schedule();
 }
 function step(delta,focus=false){
   const list=rows();if(!list.length)return;
   const origin=focus&&list.includes(document.activeElement)?document.activeElement:nearest(list,centerOf(grid));
   const idx=Math.max(0,list.indexOf(origin)),target=list[Math.max(0,Math.min(list.length-1,idx+delta))];
   if(focus)target.focus({preventScroll:true});
   centerRow(target);
 }
 grid.addEventListener('scroll',schedule,{passive:true});
 up.addEventListener('click',()=>step(-1));
 down.addEventListener('click',()=>step(1));
 grid.addEventListener('keydown',e=>{
   if(!['ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
   e.preventDefault();
   if(e.key==='ArrowUp'||e.key==='ArrowDown')step(e.key==='ArrowUp'?-1:1,true);
   else{const list=rows(),target=e.key==='Home'?list[0]:list[list.length-1];if(target){target.focus({preventScroll:true});centerRow(target);}}
 });
 document.querySelector('#dex-search').addEventListener('input',reset);
 document.querySelector('#dex-sort').addEventListener('change',reset);
 document.querySelectorAll('[data-dex-filter]').forEach(b=>b.addEventListener('click',reset));
 detail.addEventListener('close',()=>{const selected=grid.querySelector('.is-selected:not([hidden])');if(selected)centerRow(selected,'instant');else schedule();});
 if('ResizeObserver' in window){const ro=new ResizeObserver(()=>{if(active&&!active.hidden)centerRow(active,'instant');else schedule();});ro.observe(grid);}
 reset();
})();
