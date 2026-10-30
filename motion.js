const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused=false;
function applyMotion(){
  motionPaused=reducedMotion.matches||document.hidden;
  document.body.classList.toggle('motion-off',motionPaused);
}
reducedMotion.addEventListener('change',applyMotion);
document.addEventListener('visibilitychange',applyMotion);applyMotion();
document.addEventListener('pointerdown',e=>{
  if(motionPaused||e.button!==0||!e.target.closest('button,.button,summary'))return;
  for(let n=0;n<5;n++){const spark=document.createElement('span');spark.className='click-spark';spark.setAttribute('aria-hidden','true');spark.style.left=e.clientX+'px';spark.style.top=e.clientY+'px';const angle=n*Math.PI*2/5;spark.style.setProperty('--dx',`${Math.cos(angle)*35}px`);spark.style.setProperty('--dy',`${Math.sin(angle)*35}px`);document.body.append(spark);spark.addEventListener('animationend',()=>spark.remove(),{once:true});setTimeout(()=>spark.remove(),900);}
});
