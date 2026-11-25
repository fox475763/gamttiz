/* Home MY ID uses the same local artwork coordinates and WebKit-safe
   single decoded image plane as the mobile wallet. Never writes a license. */
(()=>{
  'use strict';
  const section=document.getElementById('home-license'),M=window.GTZMemberModel;
  if(!section||!M)return;
  const card=section.querySelector('.home-license-card'),inner=section.querySelector('.home-license-card-inner');
  const plane=section.querySelector('.home-license-plane'),reflection=section.querySelector('.home-license-reflection');
  const caption=section.querySelector('#home-license-card-caption'),title=section.querySelector('#home-license-title');
  const description=section.querySelector('#home-license-description'),recordLine=section.querySelector('#home-license-record'),issue=section.querySelector('#home-license-issue');
  const benefit=section.querySelector('#home-license-benefit'),member=section.querySelector('.home-license-member'),actions=issue.parentElement;
  let frontArt=plane.querySelector('.home-license-front'),backArt=plane.querySelector('.home-license-back');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const friendNames=M.names;
  // QR destination: https://gamttiz.frenchfrys.workers.dev/license.html
  const qrMatrix=[
    '111111100100101010111101001111111',
    '100000100111100110101000101000001',
    '101110101101101010010110001011101',
    '101110101110100000100010001011101',
    '101110101101001111001001001011101',
    '100000101111010000110100101000001',
    '111111101010101010101010101111111',
    '000000001100100010111111000000000',
    '101111100110011001010011001111100',
    '100000000100110011111111001101111',
    '111000101100011111000110111010110',
    '001011010101010011111110011011101',
    '000100100100001110010000110111000',
    '001001011011000100100001001100111',
    '011100100101011111000000011111010',
    '111010010010101100101100011000100',
    '001001100001110111010000010110001',
    '100001000001100010011001001101111',
    '100111101100110100101010011110110',
    '011001011010111010001100000111110',
    '100110100010100000100011110011010',
    '100000000111011110011001001001001',
    '100110101000111001101010010000010',
    '100010001011001010101101111001111',
    '100000100001011001010010111110000',
    '000000001010100001011000100010101',
    '111111100101010111000101101010110',
    '100000101110000001110101100011111',
    '101110101101001110000010111111001',
    '101110101000100101111111110011111',
    '101110101010011110100010101100100',
    '100000100100010100001100001011100',
    '111111101111000111001011110100010',
  ];

  let data=null,key='',loadedKey='',loadingKey='',generation=0,raf=0,lastTime=0,angle=-12,ready=false;
  const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.decoding='async';image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});
  function active(){
    return !document.hidden&&!document.documentElement.classList.contains('gtz-wallet-open')&&section.dataset.scene!==undefined&&section.dataset.scene===document.body.dataset.homeScene;
  }
  function paint(){
    const half=Math.floor((angle+90)/180),back=Math.abs(half%2)===1&&ready,rotation=angle-half*180;
    if(card.dataset.side!==(back?'back':'front')){
      frontArt.hidden=back;backArt.hidden=!back;card.dataset.side=back?'back':'front';
    }
    const pitch=ready?Math.sin(angle*Math.PI/180)*8:0;
    inner.style.transform='rotateX('+pitch.toFixed(2)+'deg) rotateY('+rotation.toFixed(2)+'deg)';
    reflection.style.opacity=reduced.matches?'0':(.18+Math.min(.54,Math.abs(Math.sin(rotation*Math.PI/180))*.4+Math.abs(pitch)*.014)).toFixed(2);
  }
  function tick(time){
    raf=0;if(!active()||!ready||reduced.matches){lastTime=0;return;}
    const dt=lastTime?Math.min(42,time-lastTime):0;lastTime=time;
    angle=(angle+dt*.041)%360;paint();raf=requestAnimationFrame(tick);
  }
  function motion(){
    if(active()&&ready&&!reduced.matches){if(!raf){lastTime=0;raf=requestAnimationFrame(tick);}}
    else{if(raf)cancelAnimationFrame(raf);raf=0;lastTime=0;}
    if(reduced.matches){angle=ready?0:-12;paint();}
  }
  async function render(current,seq){
    const frontCanvas=document.createElement('canvas'),canvas=document.createElement('canvas');
    for(const c of [frontCanvas,canvas]){c.width=540;c.height=859;}
    const ctx=canvas.getContext('2d',{alpha:false}),index=current.character;
    // The existing MY ID art is cropped and personalized at the exact
    // same design coordinates as the original wallet.
    const data=current;
    const [frontTemplate,template,sprite]=await Promise.all([load('assets/license/front.png'),load('assets/license/back.png'),load('assets/illustrations-3d/friend-'+String(index+1).padStart(2,'0')+'.png')]);
    if(seq!==generation)return;
    if(document.fonts?.ready)await document.fonts.ready;
    if(seq!==generation)return;
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
    if(seq!==generation)return;
    frontImage.className='home-license-front home-license-composed';backImage.className='home-license-back home-license-composed';
    frontImage.hidden=false;backImage.hidden=true;
    frontArt.replaceWith(frontImage);backArt.replaceWith(backImage);frontArt=frontImage;backArt=backImage;
    loadedKey=key;ready=true;card.dataset.ready='true';angle=0;card.dataset.side='front';caption.textContent='MY LICENSE · '+data.number;
    paint();motion();
  }
  function prepare(){
    if(!data||!active()||key===loadedKey||key===loadingKey)return;
    const current=data,seq=generation;loadingKey=key;
    caption.textContent='MY LICENSE · '+data.number;
    render(current,seq).catch(()=>{if(seq===generation){caption.textContent='MY LICENSE · '+current.number;card.dataset.ready='error';}}).finally(()=>{if(seq===generation)loadingKey='';});
  }
  function sync(){
    const current=M.readLicense(localStorage),next=current?JSON.stringify(current):'';
    if(key!==next){
      key=next;data=current;generation++;ready=false;loadedKey='';loadingKey='';angle=-12;card.dataset.ready='false';
      if(raf)cancelAnimationFrame(raf);raf=0;lastTime=0;
      frontArt.hidden=false;backArt.hidden=true;card.dataset.side='front';
      if(frontArt.classList.contains('home-license-composed')){frontArt.src='assets/license/front.png';frontArt.classList.remove('home-license-composed');}
      if(backArt.hasAttribute('src'))backArt.removeAttribute('src');
    }else data=current;
    section.dataset.licenseState=data?'issued':'unissued';
    benefit.hidden=!!data;
    if(data){
      if(actions.firstElementChild!==member)actions.prepend(member);
      title.textContent=data.name+'님의 감띠즈 라이센스.';
      description.textContent='나의 라이센스로 감튀 레이더와 멤버 전용 콘텐츠를 만나보세요.';
      recordLine.textContent=M.names[data.character]+' · '+data.number;recordLine.hidden=false;
      caption.textContent='MY LICENSE · '+data.number;
      issue.replaceChildren(document.createTextNode('내 라이센스 확인 ↗'));
      card.setAttribute('aria-label',data.name+'님의 발급된 감띠즈 라이센스 카드');
    }else{
      if(actions.firstElementChild!==issue)actions.prepend(issue);
      title.textContent='감띠즈 애호가 라이센스';
      description.textContent='감자튀김과 감띠즈를 사랑하는 애호가임을 증명하고, 멤버 전용 콘텐츠를 즐길 수 있도록 도와주는 나만의 온라인 라이센스 카드예요.';
      recordLine.hidden=true;recordLine.textContent='';caption.textContent='LICENSE PREVIEW';
      issue.textContent='라이센스 발급하기 ↗';card.setAttribute('aria-label','감띠즈 라이센스 카드 미리보기');
    }
    paint();prepare();motion();
  }
  const scene=()=>{prepare();motion();};
  document.addEventListener('gtz-home-scene',scene);document.addEventListener('visibilitychange',scene);document.addEventListener('gtz-wallet-visibility',scene);
  window.addEventListener('storage',e=>{if(e.key===M.KEY||e.key===null)sync();});
  window.addEventListener('gamttiz:license-change',sync);window.addEventListener('pageshow',sync);
  reduced.addEventListener?.('change',motion);sync();
})();

