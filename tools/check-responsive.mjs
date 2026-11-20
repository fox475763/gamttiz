import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{const url=new URL(req.url,'http://localhost');const p=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!p.startsWith(root+'/'))throw Error();const body=await readFile(p);res.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+'/';
const pages=['index.html','member.html','license.html','play.html','collection.html','draw.html','products.html','project.html','quiz.html','combo.html','news.html','member.html#radar'];
const license={version:1,name:'테스트 감띠',number:'GTZ - 0001',issuedAt:'2026-11-20T00:00:00Z',character:0};
for(const engine of [chromium,webkit])test('Shake opens a mobile 3D license with working face changes: '+engine.name(),{timeout:45000},async()=>{
 const browser=await engine.launch();
 try{
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   await context.addInitScript(({license})=>{
     localStorage.setItem('gamttiz-my-license-v1',JSON.stringify(license));
     localStorage.setItem('gamttiz-license-shake-enabled-v1','1');
   },{license});
   await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
   const page=await context.newPage();
   await page.goto(base+'index.html',{waitUntil:'domcontentloaded'});
   const card=page.locator('.gtz-wallet-rotator');
   const assertFace=async side=>{
     try{await page.waitForFunction(side=>{
       const card=document.querySelector('.gtz-wallet-rotator');if(!card||card.dataset.side!==side)return false;
       const imgs=[...card.querySelectorAll('img')];
       return imgs.length===2&&imgs.every(i=>i.complete&&i.naturalWidth>0)&&imgs.filter(i=>getComputedStyle(i).display!=='none').length===1&&
         getComputedStyle(imgs[side==='front'?0:1]).display!=='none'&&new DOMMatrixReadOnly(getComputedStyle(card.querySelector('.gtz-wallet-rotator-inner')).transform).isIdentity;
     },side,{timeout:10000});}catch(error){console.log('wallet diagnostics',await page.locator('.gtz-wallet-frame').evaluate(el=>({text:el.textContent,side:el.querySelector('.gtz-wallet-rotator')?.dataset.side,transform:el.querySelector('.gtz-wallet-rotator-inner')?.style.transform,images:[...el.querySelectorAll('img')].map(i=>({complete:i.complete,width:i.naturalWidth,display:getComputedStyle(i).display,hidden:i.hidden}))})));throw error;}
   };
   const fire=async x=>page.evaluate(x=>{
     const e=new Event('devicemotion');Object.defineProperty(e,'acceleration',{value:{x,y:0,z:0}});window.dispatchEvent(e);
   },x);
   const shake=async()=>{
     await fire(18);await page.waitForTimeout(150);await fire(-18);
     await card.waitFor({state:'visible'});
     await assertFace('front');
     await page.waitForTimeout(450);
   };
   await shake();
   assert.equal(await page.locator('.gtz-wallet-turn').count(),0);
   assert.equal(await page.locator('.gtz-wallet-shine').evaluate(el=>getComputedStyle(el).mixBlendMode),'normal');
   assert.equal(await page.locator('.gtz-wallet-shine').evaluate(el=>getComputedStyle(el).animationName),'none');
   await page.evaluate(()=>{window.walletFaceMutations=0;new MutationObserver(records=>window.walletFaceMutations+=records.length).observe(document.querySelector('.gtz-wallet-plane'),{subtree:true,attributes:true,attributeFilter:['hidden']});});
   assert.equal(await page.locator('.gtz-wallet-sheet').getAttribute('aria-hidden'),'false');
   const b=await card.boundingBox();assert.ok(b&&b.height>200&&b.y>=0&&b.y+b.height<844);
   let x=b.x+b.width/2,y=b.y+b.height/2;
   assert.equal(await page.evaluate(({x,y})=>document.elementFromPoint(x,y).className,{x,y}),'gtz-wallet-rotator');
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+45,y-25,{steps:5});
   await page.waitForFunction(()=>!new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.gtz-wallet-rotator-inner')).transform).isIdentity);
   assert.equal(await page.evaluate(()=>window.walletFaceMutations),0,'face visibility must stay stable during same-side rotation');
   await page.mouse.move(x+110,y-25,{steps:5});await page.mouse.up();
   await assertFace('back');
   assert.equal(await page.evaluate(()=>window.walletFaceMutations),2,'face visibility changes once on crossover');
   await card.tap();await assertFace('front');
   await card.tap();await assertFace('back');
   await card.tap();await assertFace('front');
   await page.locator('.gtz-wallet-close').tap();
   await page.waitForFunction(()=>!document.querySelector('.gtz-wallet-sheet').classList.contains('is-visible'));
   await page.waitForTimeout(2250);await shake();
   await context.close();
 }finally{await browser.close();}
});

for(const engine of [chromium,webkit])test('Responsive menu, page widths and member paths: '+engine.name(),{timeout:180000},async()=>{
 const browser=await engine.launch();
 try{
 for(const viewport of [{width:320,height:568},{width:390,height:844},{width:768,height:768},{width:1440,height:900}]){
   const context=await browser.newContext({viewport,serviceWorkers:'block',reducedMotion:'reduce'});
   await context.addInitScript(({license})=>localStorage.setItem("gamttiz-my-license-v1",JSON.stringify(license)),{license});
   // No external tracking/media requests during tests; local application assets are checked.
   await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
   const page=await context.newPage();
   for(const filename of pages){
     await page.goto(base+filename,{waitUntil:'domcontentloaded'});
     const trigger=page.locator('.control-trigger').first();
     await trigger.waitFor({state:'visible',timeout:5000});
     await trigger.click();
     const shell=page.locator('.control-menu').first();
     const iconLayout=await shell.locator('.control-menu-links > :is(a,button)').evaluateAll(items=>items.map(item=>{
       const icons=item.querySelectorAll('svg.control-menu-icon'),label=item.querySelector('.control-menu-text');
       const box=icons[0]?.getBoundingClientRect(),text=label?.getBoundingClientRect();
       return icons.length===1&&icons[0].getAttribute('aria-hidden')==='true'&&box.width===18&&box.right<=text.left;
     }));
     assert.ok(iconLayout.length>=11&&iconLayout.every(Boolean),filename+' menu icon layout');
     const bounds=await shell.boundingBox(),t=await trigger.boundingBox();
     assert.ok(bounds && t,filename+' menu bounds');
     assert.ok(bounds.x>=-1&&bounds.y>=-2&&bounds.x+bounds.width<=viewport.width+1,filename+' menu clipped at '+viewport.width);
     assert.ok(bounds.y+bounds.height<=t.y+3,filename+' menu overlaps trigger');
     const scroll=page.locator('.control-menu .control-panel-scroll');
     await scroll.evaluate(el=>{el.scrollTop=el.scrollHeight;});
     const reachable=await scroll.evaluate(el=>el.scrollHeight-el.clientHeight-el.scrollTop<=3);
     assert.ok(reachable,filename+' last menu item unreachable');
     if(filename==='index.html'){
       await page.locator('.control-menu-links button').filter({hasText:'Contact'}).click();
       const contact=page.locator('.control-contact');
       await contact.locator('.contact-copy').waitFor({state:'visible'});
       await page.mouse.move(0,0);
       const material=await page.evaluate(()=>{
         const menu=document.querySelector('.control-menu'),contact=document.querySelector('.control-contact');
         const link=contact.querySelector('.control-contact-links a'),copy=contact.querySelector('.contact-copy');
         const a=getComputedStyle(link),b=getComputedStyle(copy);
         return {frame:getComputedStyle(contact,'::before').backgroundImage.includes('conic-gradient'),
           border:getComputedStyle(contact).borderTopWidth,button:b.backgroundImage.includes('linear-gradient')&&a.borderRadius===b.borderRadius&&b.backdropFilter!=='none',
           sweep:getComputedStyle(copy,'::before').backgroundImage.includes('conic-gradient'),height:copy.getBoundingClientRect().height};
       });
       assert.ok(material.frame&&material.border==='0px'&&material.button&&material.sweep&&material.height>=44,'Contact liquid glass material mismatch');
       await contact.locator('.contact-copy').click();
       await page.waitForFunction(()=>document.querySelector('.contact-copy-status').textContent.length>0);
     }
     if(filename==='member.html')assert.equal(await page.locator('.member-tile').count(),1);
     if(filename==='member.html#radar')assert.equal(await page.getByRole('button',{name:'캘린더 추가'}).count(),0);
     await trigger.click();
     const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
     assert.ok(overflow<=2,filename+' horizontal overflow '+overflow+'px at '+viewport.width);
     if(['play.html','collection.html','draw.html','member.html#radar'].includes(filename)){
       const target=filename==='play.html'?'.hub-grid>a':filename==='collection.html'?'.dex-toolbar':filename==='draw.html'?'.draw-machine':'.radar-glass-field';
       const material=await page.locator(target).first().evaluate(el=>({
         blur:getComputedStyle(el).backdropFilter,
         edge:getComputedStyle(el,'::before').backgroundImage,
         animation:getComputedStyle(el,'::before').animationName,
         border:getComputedStyle(el).borderTopWidth
       }));
       assert.ok(material.blur.includes('blur(5px)')&&material.edge.includes('conic-gradient')&&material.animation==='none'&&material.border==='0px',filename+' canonical glass');
     }
     if(filename==='play.html'){
       const cards=page.locator('.hub-grid>a');
       assert.equal(await cards.count(),3);
       assert.equal(await page.locator('.hub-grid img').count(),0);
       assert.equal(await page.locator('.hub-symbol').count(),3);
       assert.equal(await page.locator('.play-geometry .play-geo').count(),3);
       assert.equal(await page.locator('.play-geo-contours').evaluate(el=>getComputedStyle(el).animationName),'none');
       assert.equal(await page.locator('.hub-icon').first().evaluate(el=>getComputedStyle(el).boxShadow),'none');
       const layout=await cards.evaluateAll(items=>items.map(card=>{
         const icon=card.querySelector('.hub-icon'),title=card.querySelector('h2'),ib=icon.getBoundingClientRect(),tb=title.getBoundingClientRect(),cb=card.getBoundingClientRect();
         return {href:card.getAttribute('href'),aligned:ib.width>=50&&ib.right<=tb.left&&tb.right<=cb.right,material:getComputedStyle(card,'::before').backgroundImage.includes('conic-gradient')&&getComputedStyle(card).backdropFilter!=='none'};
       }));
       assert.deepEqual(layout.map(c=>c.href),['quiz.html','combo.html','draw.html']);
       assert.ok(layout.every(c=>c.aligned&&c.material),'Play glass and icon alignment at '+viewport.width);
     }
     if(filename==='license.html'){
       await page.locator('#license-edit').click();
       const rail=page.locator('#license-friends');
       await rail.waitFor({state:'visible'});
       assert.equal(await rail.locator('.license-friend').count(),14);
       assert.equal(await rail.evaluate(el=>getComputedStyle(el).scrollSnapType),'x mandatory');
       const square=await rail.locator('.license-friend.is-profile-current').boundingBox();
       assert.ok(square&&Math.abs(square.width-square.height)<2,'favorite profile card must be square');
       const previous=await rail.locator('input:checked').getAttribute('value');
       await page.locator('#license-profile-next').click();
       await page.waitForFunction(n=>document.querySelector('#license-friends input:checked').value!==n,previous);
       await rail.focus();
       await page.keyboard.press('End');
       await page.waitForFunction(()=>document.querySelector('#license-profile-count').textContent==='14 / 14');
       assert.equal(await rail.locator('input:checked').getAttribute('value'),'13');
       await page.locator('#license-cancel').click();
     }
     if(filename==='collection.html'){
       assert.equal(await page.locator('.dex-tile').count(),20);
       assert.equal(await page.locator('.dex-unknown').count(),6);
       assert.equal(await page.locator('.dex-tile .dex-face').count(),15);
       assert.equal(await page.locator('.dex-dual-face .dex-face').count(),2);
       const dial=page.locator('#dex-grid');
       assert.equal(await dial.evaluate(el=>getComputedStyle(el).scrollSnapType),'y mandatory');
       await page.locator('#dex-dial-down').click();
       await page.waitForFunction(()=>document.querySelector('#dex-dial-number').textContent==='NO. 02');
       assert.equal(await page.locator('.is-dial-current').count(),1);
       assert.equal(await page.locator('#dex-detail').evaluate(el=>el.open),false);
       await page.locator('#dex-dial-up').click();
       await page.waitForFunction(()=>document.querySelector('#dex-dial-number').textContent==='NO. 01');
       await page.locator('.dex-unknown').first().click();
       assert.equal(await page.locator('#dex-profile h2').textContent(),'???');
       assert.equal(await page.locator('#dex-detail').evaluate(el=>el.open),true);
       await page.locator('#dex-close').click();
       await page.locator('[data-dex-filter="unknown"]').click();
       assert.equal(await page.locator('.dex-tile:visible').count(),6);
       await page.locator('[data-dex-filter="all"]').click();
       await page.locator('#dex-sort').selectOption('desc');
       assert.match(await page.locator('.dex-tile').first().getAttribute('aria-label'),/No\. 20/);
       await page.locator('#dex-search').fill('빙빙이');
       assert.equal(await page.locator('.dex-tile:visible').count(),1);
       await page.locator('.dex-tile:visible').click();
       assert.equal(await page.locator('#dex-profile h2').textContent(),'빙빙이');
       assert.equal(await page.locator('#dex-profile .profile-face-inset .dex-face').count(),1);
       assert.equal(await page.locator('#dex-profile .profile-episode').count(),1);
       await page.locator('#dex-next').click();
       assert.equal(await page.locator('#dex-current').textContent(),'NO. 08 / 20');
       await page.keyboard.press('Escape');
       assert.equal(await page.locator('#dex-detail').evaluate(el=>el.open),false);
       await page.goto(base+'collection.html#friend-14');
       assert.match(await page.locator('#dex-current').textContent(),/NO\. 14/);
       await page.locator('#dex-close').click();
     }
     if(filename==='draw.html'){
       assert.equal(await page.locator('.fry-choice').count(),5);
       assert.equal(await page.locator('.fry-holder-vector').count(),2);
       const fry=page.locator('.fry-choice').nth(2);
       await fry.scrollIntoViewIfNeeded();
       const dragFry=async()=>{const b=await fry.boundingBox();assert.ok(b);const x=b.x+b.width/2,y=b.y+Math.min(22,b.height*.15);await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y-105,{steps:7});await page.mouse.up();};
       await fry.click({position:{x:10,y:16}});
       assert.equal(await page.locator('#draw-profile').evaluate(el=>el.hidden),true);
       await dragFry();
       await page.locator('#draw-profile h2').waitFor({state:'visible'});
       const picked=await page.locator('#draw-profile h2').textContent();
       await page.reload();
       assert.equal(await page.locator('.fry-choice.is-picked').count(),0);
       assert.equal(await page.locator('#fry-reveal-name').textContent(),'');
       assert.equal(await page.locator('#draw-replay').evaluate(el=>el.hidden),true);
       assert.equal(await page.locator('#draw-profile').evaluate(el=>el.hidden),true);
       await fry.scrollIntoViewIfNeeded();await dragFry();
       await page.locator('#draw-profile h2').waitFor({state:'visible'});
       assert.notEqual(await page.locator('#draw-profile h2').textContent(),picked);
       await page.goto(base+'play.html');await page.goBack();
       assert.equal(await page.locator('#draw-profile').evaluate(el=>el.hidden),true);
       assert.equal(await page.locator('.fry-choice.is-picked').count(),0);
     }
   }
   await context.close();
 }
 }finally{await browser.close();}
});

test.after(()=>new Promise(resolve=>server.close(resolve)));
