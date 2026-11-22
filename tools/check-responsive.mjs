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

// Isolated radar regression: validate the actual cascade and layout independently
// of the Home/Dex scrolling assertions and of live stories aging into the archive.
for(const engine of [chromium,webkit])test('Fry Rader brand layout and headline-only feed: '+engine.name(),{timeout:45000},async()=>{
 const browser=await engine.launch();
 try{
   for(const viewport of [{width:320,height:640},{width:390,height:844},{width:1440,height:900}]){
     const context=await browser.newContext({viewport,serviceWorkers:'block',reducedMotion:'reduce'});
     await context.addInitScript(({license})=>localStorage.setItem('gamttiz-my-license-v1',JSON.stringify(license)),{license});
     await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
     const today=new Date().toISOString();
     const items=Array.from({length:3},(_,i)=>({id:'qa-radar-'+i,title:'감자튀김 소식 테스트 '+(i+1),summary:'화면에 나오면 안 되는 기사 요약',url:'https://example.com/fries/'+i,source:'QA',category:'event',publishedAt:today,collectedAt:today}));
     await context.route('**/data/fry-radar.json',route=>route.fulfill({json:{updatedAt:today,items}}));
     const page=await context.newPage();
     await page.goto(base+'member.html#radar',{waitUntil:'domcontentloaded'});
     await page.waitForFunction(()=>document.querySelectorAll('#radar-list .radar-entry').length===3);
     const layout=await page.evaluate(()=>{
       const q=s=>document.querySelector(s),style=s=>getComputedStyle(q(s)),rect=s=>q(s).getBoundingClientRect();
       const list=rect('#radar-list'),photo=rect('#radar-list .radar-card-photo');
       return {overflow:document.documentElement.scrollWidth-innerWidth,hero:style('.radar-masthead').backgroundImage,toolbar:style('.radar-toolbar').backgroundColor,
         columns:style('#radar-list').gridTemplateColumns.split(' ').length,rowGap:parseFloat(style('#radar-list').rowGap),left:list.left,right:innerWidth-list.right,
         photoWidth:photo.width,listWidth:list.width,selectFont:parseFloat(style('#radar-brand').fontSize),selectWeight:style('#radar-brand').fontWeight,
         summaries:document.querySelectorAll('#radar-list .radar-card p').length};
     });
     assert.ok(layout.overflow<=2&&layout.left>=19&&layout.right>=19,JSON.stringify(layout));
     assert.ok(layout.hero.includes('linear-gradient')&&layout.toolbar==='rgb(255, 240, 201)',JSON.stringify(layout));
     assert.equal(layout.columns,viewport.width<600?1:2);
     assert.ok(layout.rowGap>=30&&layout.photoWidth>=layout.listWidth*(viewport.width<600?.95:.43),JSON.stringify(layout));
     assert.ok(layout.selectFont<=13&&Number(layout.selectWeight)<=550,JSON.stringify(layout));
     assert.equal(layout.summaries,0);
     const save=page.locator('#radar-list .radar-action').first();await save.click();
     assert.equal(await save.getAttribute('aria-pressed'),'true');
     await page.locator('[data-radar-view="saved"]').click();
     assert.equal(await page.locator('#radar-list .radar-entry').count(),1);
     await page.locator('[data-radar-view="all"]').click();
     await page.evaluate(()=>window.scrollTo(0,200));
     await page.waitForFunction(()=>scrollY>0);
     await context.close();
   }
 }finally{await browser.close();}
});

for(const engine of [chromium,webkit])test('Home scroll is native, stable and readable: '+engine.name(),{timeout:45000},async()=>{
 const browser=await engine.launch();
 try{
   for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
     const mobile=viewport.width<700;
     const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,serviceWorkers:'block',reducedMotion:'no-preference'});
     await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
     const page=await context.newPage();
     await page.goto(base+'index.html',{waitUntil:'domcontentloaded'});
     await page.waitForFunction(()=>window.GTZHomeMotion&&document.querySelectorAll('#friends-dots button').length===14);
     assert.equal(await page.locator('#main section').count(),11);
     assert.equal(await page.locator('.story-row').count(),2);
     assert.equal(await page.locator('#gallery .friend-carousel-card:not([aria-hidden])').count(),14);
     assert.equal(await page.locator('#friends-dots button').count(),14);
     assert.equal(await page.locator('.control-trigger').count(),1);
     assert.equal(await page.locator('.cinema-opening,.cinema-chapter,.is-pinned').count(),0);
     const ambient=await page.evaluate(async()=>{
       const layer=document.querySelector('.home-ambient');
       const rect=()=>{const r=layer.getBoundingClientRect();return [r.x,r.y,r.width,r.height]};
       const frames=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
       const first=rect(),at=scrollY;
       document.documentElement.style.scrollBehavior='auto';
       window.scrollTo(0,at+240);await frames();
       const second=rect(),style=getComputedStyle(layer,'::before');
       return {first,second,delta:scrollY-at,position:getComputedStyle(layer).position,
         pointer:getComputedStyle(layer).pointerEvents,animation:style.animationName,playing:style.animationPlayState,
         live:layer.classList.contains('is-live'),hasRenderer:!!layer.querySelector('canvas,video'),
         backgrounds:[...document.querySelectorAll('#main>:is(.collection,.stories,.holder,.home-package,.experience-teaser,.radar-preview,.home-news-feed,.guide,.home-contact,.social),.story-row,.experience-links>a,.guide-grid article,.collection-carousel-window,.friend-photo')].map(el=>getComputedStyle(el).backgroundColor)};
     });
     assert.deepEqual(ambient.first,ambient.second,'background stays at the same viewport coordinates during scroll');
     assert.ok(ambient.delta>=200);
     assert.equal(ambient.position,'fixed');
     assert.equal(ambient.pointer,'none');
     assert.equal(ambient.animation,'gtz-ambient-drift');
     assert.equal(ambient.playing,ambient.live?'paused':'running');
     if(ambient.live)assert.ok(ambient.hasRenderer,'active motion has a real canvas or video renderer');
     assert.ok(ambient.backgrounds.every(color=>color==='rgba(0, 0, 0, 0)'||color==='transparent'),'content sections must be transparent over the fixed canvas');
     const top=await page.evaluate(()=>{
       document.documentElement.style.scrollBehavior='auto';
       const snapshot=()=>['.hero','.hero-copy','.hero-film','.hero-description','.hero .button','.hero-foot','.hero-poster','.poster-viewport'].map(selector=>{
         const el=document.querySelector(selector),s=getComputedStyle(el);return [selector,el.offsetWidth,el.offsetHeight,s.textAlign,s.fontSize,s.lineHeight,s.padding,s.margin,s.gap,s.borderWidth];
       });
       const actual=snapshot();document.body.classList.remove('home-cinema');const original=snapshot();document.body.classList.add('home-cinema');
       return {actual,original};
     });
     assert.deepEqual(top.actual,top.original,'original first-screen sizing and typography must remain unchanged');
     if(mobile)assert.notEqual(top.actual.find(x=>x[0]==='.hero-description')[3],'center');
     const stable=await page.evaluate(async()=>{
       const selectors=['.hero','.hero-copy','.hero-poster','.story-row:not(.reverse)','.story-row:not(.reverse) .story-image','.story-row:not(.reverse) .story-copy','.story-row.reverse','.story-row.reverse .story-image','.story-row.reverse .story-copy'];
       const frames=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
       const styles=()=>selectors.map(s=>{const e=document.querySelector(s),c=getComputedStyle(e);return {s,top:e.getBoundingClientRect().top,opacity:c.opacity,transform:c.transform,scale:c.scale,translate:c.translate,rotate:c.rotate,position:c.position}});
       const result=[];
       for(const scene of ['.hero','.story-row:not(.reverse)','.story-row.reverse']){
         const start=Math.max(0,scrollY+document.querySelector(scene).getBoundingClientRect().top-innerHeight*.22);
         window.scrollTo(0,start);await frames();
         const before=styles(),y=scrollY;
         window.scrollTo(0,y+120);await frames();
         const after=styles(),delta=scrollY-y;
         result.push({scene,delta,before,after});
       }
       return result;
     });
     for(const {scene,delta,before,after} of stable){
       assert.ok(delta>=100,scene+' accepts native scroll rather than pinning');
       for(let i=0;i<before.length;i++){
         const a=before[i],b=after[i];
         assert.ok(Math.abs(a.top-b.top-delta)<3,a.s+' moves only with the page');
         assert.equal(b.opacity,'1',b.s+' remains fully readable');
         assert.equal(b.transform,'none');
         assert.equal(b.scale,'none');assert.equal(b.translate,'none');assert.equal(b.rotate,'none');
         assert.notEqual(b.position,'sticky');
       }
     }
     await page.evaluate(()=>document.querySelector('#collection').scrollIntoView({block:'start'}));
     await page.waitForFunction(()=>window.GTZHomeMotion.scrolling);
     await page.waitForFunction(()=>document.querySelector('#gallery').getAnimations().some(a=>a.playState==='paused'));
     await page.waitForFunction(()=>!window.GTZHomeMotion.scrolling);
     await page.waitForFunction(()=>document.querySelector('#gallery').getAnimations().some(a=>a.playState==='running'));
     const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
     assert.ok(overflow<=2,'native home must not cause horizontal overflow');
     const catalog=await page.evaluate(()=>{
       const sections=[...document.querySelectorAll('#main>:is(.collection,.stories,.holder,.home-package,.experience-teaser,.radar-preview,.home-news-feed,.guide,.home-contact,.social)')];
       const edges=sections.map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return [e.className,r.left+parseFloat(s.paddingLeft),r.right-parseFloat(s.paddingRight)]});
       const label=getComputedStyle(document.querySelector('.friend-carousel-card .card-label'));
       return {edges,labelPosition:label.position,photos:document.querySelectorAll('#gallery .card:not([aria-hidden]) .friend-photo').length,borders:[...document.querySelectorAll('.friend-carousel-card,.story-image,.holder-image,.experience-links>a,.guide-grid article,.home-news-feed-card')].map(e=>getComputedStyle(e).borderRadius)};
     });
     assert.equal(catalog.edges.length,10);
     for(const [name,left,right] of catalog.edges){assert.ok(Math.abs(left-catalog.edges[0][1])<=2&&Math.abs(right-catalog.edges[0][2])<=2,name+' follows the shared catalog grid');}
     assert.equal(catalog.labelPosition,'static','card captions must be separate from product art');
     assert.equal(catalog.photos,14);
     assert.ok(catalog.borders.every(r=>r==='0px'),'editorial content must not revert to a rounded card grid');
     assert.equal(await page.locator('#friends-count,#friends-prev,#friends-next,#friends-pause,.home-friend-index,.home-friend-arrow').count(),0);
     // Fixed-width indicator slots must not wrap or shift as any item is selected.
     if(mobile)for(const width of [320,375,390,430]){
       await page.setViewportSize({width,height:844});
       await page.waitForFunction(()=>document.querySelector('#gallery').getAnimations().length>0);
       const dots=page.locator('#friends-dots button');
       for(let i=0;i<14;i++){
         await dots.nth(i).click();
         assert.equal(await dots.nth(i).getAttribute('aria-pressed'),'true');
         const bounds=await page.locator('#friends-dots').evaluate(el=>{
           const b=el.getBoundingClientRect(),r=[...el.children].map(d=>d.getBoundingClientRect());
           return {fits:r.every(d=>d.left>=b.left-1&&d.right<=b.right+1&&Math.abs(d.top-r[0].top)<1),active:el.querySelectorAll('.is-active').length,overflow:document.documentElement.scrollWidth-innerWidth};
         });
         assert.ok(bounds.fits&&bounds.active===1&&bounds.overflow<=2,'dots stay in one row at '+width+'px, item '+i);
       }
     }
     await page.locator('#friends-dots button').nth(6).click();
     assert.equal(await page.locator('#friends-dots button').nth(6).getAttribute('aria-pressed'),'true');
     await page.waitForFunction(()=>document.querySelector('#gallery').getAnimations().some(a=>a.playState==='paused'));
     await page.emulateMedia({reducedMotion:'reduce'});
     assert.equal(await page.locator('.home-ambient').evaluate(el=>getComputedStyle(el,'::before').animationName),'none');
     assert.equal(await page.locator('.is-pinned').count(),0);
     await context.close();
   }
 }finally{await browser.close();}
});
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
