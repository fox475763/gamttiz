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
for(const engine of [chromium,webkit])test('Fry Rader search-anchored glass overlay and headline-only feed: '+engine.name(),{timeout:45000},async()=>{
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
     await page.waitForFunction(()=>Array.from(document.querySelectorAll('#radar-list img.radar-thumb-fallback')).every(img=>img.complete&&img.naturalWidth>0&&img.naturalHeight>0));
     assert.equal(await page.locator('#radar-list img.radar-thumb-fallback').count(),3);
     const toggle=page.locator('#radar-search'),panel=page.locator('#radar-filter-panel'),scrim=page.locator('#radar-search-scrim');
     assert.equal(await page.locator('#radar-filter-toggle').count(),0);
     assert.equal(await toggle.getAttribute('aria-expanded'),'false');
     assert.equal(await panel.evaluate(el=>el.inert),true);
     assert.equal(await panel.evaluate(el=>getComputedStyle(el).visibility),'hidden');
     assert.equal(await scrim.evaluate(el=>getComputedStyle(el).visibility),'hidden');
     await page.emulateMedia({reducedMotion:'no-preference'});
     assert.equal(await page.locator('.radar-masthead-sweep').evaluate(el=>getComputedStyle(el).animationName),'radar-masthead-turn');
     await page.emulateMedia({reducedMotion:'reduce'});
     await toggle.click();
     assert.equal(await toggle.getAttribute('aria-expanded'),'true');
     assert.equal(await panel.evaluate(el=>el.inert),false);
     assert.equal(await scrim.evaluate(el=>getComputedStyle(el).visibility),'visible');
     const overlay=await page.evaluate(()=>{
       const input=document.querySelector('#radar-search'),p=document.querySelector('#radar-filter-panel').getBoundingClientRect(),s=input.getBoundingClientRect();
       return {gap:p.top-s.bottom,searchHit:document.elementFromPoint(s.left+s.width/2,s.top+s.height/2)===input,dimHit:document.elementFromPoint(3,3)?.id==='radar-search-scrim',width:Math.abs(p.width-s.width)};
     });
     assert.ok(overlay.gap>=7&&overlay.gap<=15&&overlay.searchHit&&overlay.dimHit&&overlay.width<=2,JSON.stringify(overlay));
     const layout=await page.evaluate(()=>{
       const q=s=>document.querySelector(s),style=s=>getComputedStyle(q(s)),rect=s=>q(s).getBoundingClientRect();
       const list=rect('#radar-list'),photo=rect('#radar-list .radar-card-photo');
       return {overflow:document.documentElement.scrollWidth-innerWidth,hero:style('.radar-masthead').backgroundImage,toolbar:style('.radar-toolbar').backgroundColor,
         columns:style('#radar-list').gridTemplateColumns.split(' ').length,rowGap:parseFloat(style('#radar-list').rowGap),left:list.left,right:innerWidth-list.right,
         photoWidth:photo.width,listWidth:list.width,selectFont:parseFloat(style('#radar-category').fontSize),selectWeight:style('#radar-category').fontWeight,
         controls:document.querySelectorAll('.radar-controls label').length,brand:!!q('#radar-brand'),filterColumns:style('.radar-filter-fields').gridTemplateColumns.split(' ').length,
         summaries:document.querySelectorAll('#radar-list .radar-card p').length};
     });
     assert.ok(layout.overflow<=2&&layout.left>=19&&layout.right>=19,JSON.stringify(layout));
     assert.ok(layout.hero.includes('linear-gradient')&&layout.toolbar==='rgb(243, 242, 239)',JSON.stringify(layout));
     assert.equal(layout.columns,viewport.width<600?1:2);
     assert.ok(layout.rowGap>=30&&layout.photoWidth>=layout.listWidth*(viewport.width<600?.95:.43),JSON.stringify(layout));
     assert.ok(layout.selectFont<=13&&Number(layout.selectWeight)<=550,JSON.stringify(layout));
     assert.equal(layout.summaries,0);
     assert.equal(layout.brand,false);
     assert.equal(layout.controls,3);
     assert.equal(layout.filterColumns,2);
     await toggle.press('Escape');
     assert.equal(await toggle.getAttribute('aria-expanded'),'false');
     assert.equal(await panel.evaluate(el=>el.inert),true);
     await toggle.click();
     await page.locator('#radar-search').fill('테스트 2');
     assert.equal(await page.locator('#radar-list .radar-entry').count(),1);
     await page.locator('#radar-search').fill('');
     await page.locator('#radar-category').selectOption('discount');
     assert.equal(await page.locator('#radar-list .radar-entry').count(),0);
     await page.locator('#radar-category').selectOption('all');
     assert.equal(await page.locator('#radar-list .radar-entry').count(),3);
     await page.locator('#radar-sort').selectOption('oldest');
     assert.equal(await page.locator('#radar-list .radar-entry').count(),3);
     await page.locator('#radar-sort').selectOption('newest');
     await toggle.press('Escape');
     assert.equal(await toggle.getAttribute('aria-expanded'),'false');
     const save=page.locator('#radar-list .radar-action').first();await save.click();
     assert.equal(await save.getAttribute('aria-pressed'),'true');
     if(await toggle.getAttribute('aria-expanded')==='false')await toggle.click();
     await page.locator('[data-radar-view="saved"]').click();
     assert.equal(await page.locator('#radar-list .radar-entry').count(),1);
     await page.locator('[data-radar-view="all"]').click();
     await scrim.click({position:{x:3,y:3}});
     assert.equal(await toggle.getAttribute('aria-expanded'),'false');
     assert.equal(await page.locator('.radar-back-link').getAttribute('href'),'#hub');
     assert.equal(await page.locator('.radar-tool h1').evaluate(el=>{el.focus({preventScroll:true});return getComputedStyle(el).outlineStyle;}),'none');
     assert.equal(await page.locator('#radar-admin').evaluate(el=>el.open),false);
     await page.evaluate(()=>window.scrollTo(0,200));
     await page.waitForFunction(()=>scrollY>0);
     await context.close();
   }
 }finally{await browser.close();}
});

// The large menu shell is intentionally invisible; each item has its own glass.
for(const engine of [chromium,webkit])test('Independent liquid glass menu droplets, stagger and sliding hover/touch: '+engine.name(),{timeout:45000},async()=>{
 const browser=await engine.launch();
 try{
  for(const [viewport,mobile] of [[{width:390,height:844},true],[{width:1100,height:800},false]]){
   const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,serviceWorkers:'block',reducedMotion:'no-preference'});
   await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
   const page=await context.newPage();
   await page.goto(base+'index.html',{waitUntil:'load'});
   const trigger=page.locator('.control-trigger'),menu=page.locator('.control-menu'),items=menu.locator('.control-menu-links > :is(a,button)');
   await page.waitForFunction(()=>document.querySelector('.control-trigger > .gtz-liquid-optics'));
   const triggerMaterial=await trigger.evaluate(el=>({color:getComputedStyle(el).backgroundColor,shadow:getComputedStyle(el).boxShadow,blur:getComputedStyle(el.querySelector('.gtz-liquid-optics')).backdropFilter}));
   assert.ok(triggerMaterial.color.startsWith('rgba(20, 12, 18, 0.1')&&triggerMaterial.shadow==='none'&&triggerMaterial.blur.includes('blur(1.25px)'),JSON.stringify(triggerMaterial));
   await trigger.click();
   await page.waitForFunction(()=>Array.from(document.querySelectorAll('.control-menu-links > :is(a,button)')).every(el=>Number(getComputedStyle(el).opacity)>.995&&Math.abs(parseFloat(getComputedStyle(el).scale)-1)<.001));
   await page.waitForTimeout(180);
   await page.waitForFunction(expected=>document.querySelector('.control-dock').dataset.menuRefraction===expected,engine===chromium?'ready':'canvas');
   const material=await menu.evaluate(el=>{
     const list=[...el.querySelectorAll('.control-menu-links > :is(a,button)')],root=getComputedStyle(el),row=getComputedStyle(list[1]),optics=list[1].querySelector('.control-menu-optics'),lens=getComputedStyle(optics),edge=getComputedStyle(list[1],'::before'),box=list[1].getBoundingClientRect();
     return {shell:root.backgroundImage,shadow:root.boxShadow,border:root.borderTopWidth,blur:root.backdropFilter,edge:getComputedStyle(el,'::before').display,
        row:row.backdropFilter,baseColor:row.backgroundColor,gradient:lens.backgroundImage,rim:edge.backgroundImage,rimWidth:edge.borderTopWidth,lens:lens.backdropFilter,bevel:getComputedStyle(optics,'::before').boxShadow,rowShadow:row.boxShadow,light:lens.animationName,sheen:getComputedStyle(optics,'::before').animationName,glint:getComputedStyle(optics,'::after').backgroundImage,
        actual:!!document.querySelector('#gtz-menu-refraction feDisplacementMap'),mirror:!!document.querySelector('.control-menu-edge-canvas'),label:getComputedStyle(list[1].querySelector('.control-menu-text')).zIndex,
        width:box.width,height:box.height,first:getComputedStyle(list[0]).transitionDelay,last:getComputedStyle(list.at(-1)).transitionDelay,
        selected:getComputedStyle(list[0]).color,selectedBackground:getComputedStyle(list[0]).backgroundColor};
   });
   assert.equal(material.shell,'none');assert.equal(material.shadow,'none');assert.equal(material.border,'0px');assert.equal(material.blur,'none');assert.equal(material.edge,'none');
   assert.ok(material.row==='none'&&material.gradient.includes('linear-gradient')&&material.rim.includes('linear-gradient')&&material.bevel==='none'&&material.rowShadow==='none'&&material.sheen==='menu-light-slide'&&material.label==='2',JSON.stringify(material));
   assert.ok(material.baseColor.startsWith('rgba(20, 12, 18, 0.1')&&parseFloat(material.rimWidth)<=1&&material.glint.includes('radial-gradient'),JSON.stringify(material));
   assert.equal(material.actual,engine===chromium);
   assert.equal(material.mirror,engine===webkit);
   assert.equal(material.lens.includes('url('),engine===chromium);
   if(engine===webkit){
     await page.evaluate(()=>{const layer=document.createElement('div');layer.id='lens-test-stripes';layer.style.cssText='position:fixed;inset:0;background:#123;z-index:1189;pointer-events:none';for(let x=0;x<innerWidth;x+=14){const bar=document.createElement('div');bar.style.cssText='position:absolute;top:0;bottom:0;width:7px;left:'+x+'px;background:#f84';layer.append(bar);}document.body.append(layer);});
     const read=()=>page.evaluate(()=>{const c=document.querySelector('.control-menu-edge-canvas'),p=c.getBoundingClientRect(),r=document.querySelectorAll('.control-menu-links > :is(a,button)')[1].getBoundingClientRect(),ctx=c.getContext('2d'),d=ctx.getImageData(0,0,c.width,c.height).data;let count=0,hash=0;for(let i=3;i<d.length;i+=4){if(d[i]>0){count++;hash=(hash+Math.imul(i,d[i]))|0;}}const center=ctx.getImageData(Math.floor(r.x+r.width/2-p.x),Math.floor(r.y+r.height/2-p.y),1,1).data[3];return {count,hash,center};});
     await page.waitForTimeout(350);const first=await read();assert.ok(first.count>30&&first.center===0,JSON.stringify(first));
     await page.evaluate(()=>{document.querySelector('#lens-test-stripes').style.transform='translateX(3px)';});
     let moved=await read();for(let retry=0;retry<14&&moved.hash===first.hash;retry++){await page.waitForTimeout(150);moved=await read();}assert.ok(moved.count>30&&moved.hash!==first.hash,JSON.stringify({first,moved}));
     await page.evaluate(()=>document.querySelector('#lens-test-stripes').remove());
   }else{
     const pixels=await page.evaluate(async()=>{const f=document.querySelector('#gtz-menu-refraction feImage'),image=new Image();image.src=f.getAttribute('href');await image.decode();const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const read=(x,y)=>Array.from(ctx.getImageData(Math.floor(x),Math.floor(y),1,1).data).slice(0,2);return {center:read(c.width/2,c.height/2),left:read(2,c.height/2),top:read(c.width/2,2)};});
     assert.deepEqual(pixels.center,[128,128]);assert.ok(pixels.left[0]>140&&pixels.left[0]<155&&pixels.top[1]>148,JSON.stringify(pixels));
   }
   const driftBefore=await items.nth(1).locator('.control-menu-optics').evaluate(el=>getComputedStyle(el,'::before').transform);
   await page.waitForFunction(previous=>getComputedStyle(document.querySelectorAll('.control-menu-optics')[1],'::before').transform!==previous,driftBefore,{timeout:8000});
   assert.ok(material.width<255&&material.height>=29&&material.height<=36,JSON.stringify(material));
   assert.notEqual(material.first,material.last);assert.equal(material.selected,'rgb(233, 54, 54)');
   const target=items.nth(2),neighbor=items.nth(3),far=items.nth(5),a=await target.boundingBox(),b=await neighbor.boundingBox(),f=await far.boundingBox();
   const point=box=>({clientX:box.x+box.width/2,clientY:box.y+box.height/2});
   if(mobile)await target.dispatchEvent('pointerdown',{pointerType:'touch',pointerId:7,bubbles:true,...point(a)});
   else await page.mouse.move(a.x+a.width/2,a.y+a.height/2);
   await page.waitForTimeout(520);
   assert.ok(await target.evaluate(el=>el.classList.contains('menu-guide-active')&&el.style.getPropertyValue('--menu-light-x').endsWith('%')));
   const enlarged=await target.boundingBox(),middle=await neighbor.boundingBox(),still=await far.boundingBox();
   assert.ok(enlarged.width>middle.width*1.10&&middle.width>still.width*1.08&&Math.abs(still.width-f.width)<1.5,JSON.stringify({enlarged,middle,still}));
   await page.evaluate(()=>{window.__menuCommits=[];document.querySelector('.control-menu-links').addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();window.__menuCommits.push(e.target.closest('a,button')?.textContent);},true);});
   if(mobile){
     await target.dispatchEvent('pointermove',{pointerType:'touch',pointerId:7,bubbles:true,...point(f)});
   }else await page.mouse.move(f.x+f.width/2,f.y+f.height/2,{steps:5});
   await page.waitForFunction(()=>document.querySelector('.control-menu-links').children[5].classList.contains('menu-guide-active'));
   assert.deepEqual(await page.evaluate(()=>window.__menuCommits),[]);
   if(mobile)await target.dispatchEvent('pointerup',{pointerType:'touch',pointerId:7,bubbles:true,...point(f)});
   else await page.mouse.click(f.x+f.width/2,f.y+f.height/2);
   assert.equal(await page.evaluate(()=>window.__menuCommits.length),1);
   assert.equal(await page.evaluate(()=>window.__menuCommits[0]),await far.textContent());
   if(!mobile)await page.mouse.move(0,0);
   await page.waitForTimeout(450);
   assert.equal(await menu.locator('.menu-guide-active').count(),0);
   const scroll=menu.locator('.control-panel-scroll');await scroll.evaluate(el=>{el.scrollTop=el.scrollHeight});
   assert.ok(await scroll.evaluate(el=>el.scrollHeight-el.clientHeight-el.scrollTop<=3));
   const bounds=await menu.boundingBox(),btn=await trigger.boundingBox();
   assert.ok(bounds.x>=-1&&bounds.y>=-2&&bounds.x+bounds.width<=viewport.width+1&&bounds.y+bounds.height<=btn.y+3);
   const retiring=items.last(),before=await retiring.boundingBox();
   await trigger.click();
   assert.equal(await page.locator('.control-dock').getAttribute('data-menu-closing'),'');
   await page.waitForTimeout(210);
   const transit=await retiring.boundingBox();
   assert.ok(transit&&transit.y>before.y&&transit.width<before.width,JSON.stringify({before,transit}));
   await page.waitForFunction(()=>document.querySelector('.control-menu').getAttribute('aria-hidden')==='true'&&getComputedStyle(document.querySelector('.control-menu')).visibility==='hidden');
   assert.equal(await page.locator('.control-menu-edge-canvas').count(),0);
   await context.close();
  }
 }finally{await browser.close();}
});

// The mobile home scroll compositor must never drag a stale sampled rim.
test('WebKit home scroll keeps actual transparent backdrop and suspends sampled pixels', {timeout:30000}, async()=>{
 const browser=await webkit.launch();
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block',reducedMotion:'no-preference'});
  await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  const page=await context.newPage();await page.goto(base+'index.html',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('.control-trigger .gtz-liquid-optics canvas[data-lens-ready]')&&!document.body.classList.contains('home-native-moving'));
  await page.evaluate(()=>{const v=document.querySelector('.home-scroll-viewport');v.scrollTo({top:v.clientHeight*1.8,behavior:'smooth'});});
  await page.waitForFunction(()=>document.body.classList.contains('home-native-moving'));
  const buttonState=await page.locator('.control-trigger').evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {visibility:s.visibility,opacity:s.opacity,hit:el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),label:el.querySelector('.control-trigger-label')?.textContent}});
  assert.deepEqual(buttonState,{visibility:'visible',opacity:'1',hit:true,label:'Menu'});
  const moving=await page.evaluate(()=>{const glass=document.querySelector('.control-trigger .gtz-liquid-optics'),canvas=glass.querySelector('canvas');return {blur:getComputedStyle(glass).backdropFilter,visibility:getComputedStyle(canvas).visibility,ready:canvas.hasAttribute('data-lens-ready')};});
  assert.ok(moving.blur.includes('blur(1.25px)')&&moving.visibility==='hidden'&&!moving.ready,JSON.stringify(moving));
  await page.waitForFunction(()=>!document.body.classList.contains('home-native-moving')&&!!document.querySelector('.control-trigger .gtz-liquid-optics canvas[data-lens-ready]'));
  assert.equal(await page.locator('.control-trigger .gtz-liquid-optics canvas').evaluate(el=>getComputedStyle(el).visibility),'visible');
  await context.close();
 }finally{await browser.close();}
});

// Home entry should reset the real stage, not only the outer document.
for(const engine of [chromium,webkit])test('Home always opens on the first scene with mobile breathing room: '+engine.name(),{timeout:45000},async()=>{
 const browser=await engine.launch();
 try{
   for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
     const mobile=viewport.width<700;
     const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,serviceWorkers:'block',reducedMotion:'reduce'});
     await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
     const page=await context.newPage();
     await page.addInitScript(()=>{window.__firstHomeVisible=null;const check=()=>{const v=document.querySelector('.home-scroll-viewport');if(v&&!document.documentElement.classList.contains('gtz-home-boot')){window.__firstHomeVisible={scene:document.body.dataset.homeScene,scroll:v.scrollTop};return;}requestAnimationFrame(check);};requestAnimationFrame(check);});
     await page.goto(base+'index.html',{waitUntil:'load'});
     await page.waitForFunction(()=>document.body.dataset.homeScene==='0');
     assert.equal(await page.getByRole('link',{name:'나의 감띠 찾기'}).count(),0);
     assert.equal(await page.evaluate(()=>history.scrollRestoration),'manual');
     await page.waitForFunction(()=>window.__firstHomeVisible!==null);
     assert.equal(await page.evaluate(()=>window.__firstHomeVisible.scene),'0');
     assert.ok(await page.evaluate(()=>window.__firstHomeVisible.scroll<2));
     if(mobile){
       assert.ok(await page.locator('.hero-copy').evaluate(el=>parseFloat(getComputedStyle(el).paddingTop)>=24));
       assert.ok(await page.locator('.hero-poster .poster-viewport').evaluate(el=>el.getBoundingClientRect().height<=190));
       await page.evaluate(()=>{const v=document.querySelector('.home-scroll-viewport');v.scrollTop=v.clientHeight;});
     }else{await page.keyboard.press('PageDown');}
     await page.waitForFunction(()=>Number(document.body.dataset.homeScene)>0);
     await page.reload({waitUntil:'load'});
     await page.waitForFunction(()=>document.body.dataset.homeScene==='0');
     assert.ok(await page.locator('.home-scroll-viewport').evaluate(el=>el.scrollTop<2));
     await page.goto(base+'index.html#collection',{waitUntil:'load'});
     await page.waitForFunction(()=>Number(document.body.dataset.homeScene)>0);
     await page.locator('.wordmark').click();
     await page.waitForFunction(()=>document.body.dataset.homeScene==='0');
     await context.close();
   }
 }finally{await browser.close();}
});

// License is read locally; the two real personalized faces must be ready
// before the continuous rotation begins.
for(const engine of [chromium,webkit])test('Home MY ID shows issuance state and rotates actual card artwork: '+engine.name(),{timeout:45000},async()=>{
 const browser=await engine.launch();
 try{
   for(const [viewport,issued] of [[{width:390,height:844},true],[{width:1440,height:900},false]]){
     const mobile=viewport.width<700;
     const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,serviceWorkers:'block',reducedMotion:'no-preference'});
     if(issued)await context.addInitScript(({license})=>localStorage.setItem('gamttiz-my-license-v1',JSON.stringify(license)),{license});
     await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
     const page=await context.newPage();
     await page.goto(base+'index.html#home-license',{waitUntil:'load'});
     const section=page.locator('#home-license'),card=section.locator('.home-license-card');
     await page.waitForFunction(()=>document.body.dataset.homeScene===document.querySelector('#home-license').dataset.scene);
     assert.equal(await section.getAttribute('data-license-state'),issued?'issued':'unissued');
     assert.equal(await section.locator('.home-license-member').getAttribute('href'),'member.html');
     assert.equal(await section.locator('#home-license-issue').getAttribute('href'),'license.html');
     const neighbors=await section.evaluate(el=>[el.previousElementSibling.classList.contains('home-package'),el.nextElementSibling.id]);
     assert.deepEqual(neighbors,[true,'experiences']);
     if(issued){
       await page.waitForFunction(()=>document.querySelector('.home-license-card').dataset.ready==='true');
       assert.ok((await section.locator('#home-license-record').textContent()).includes(license.number));
       assert.ok((await section.locator('.home-license-back').getAttribute('src')).startsWith('data:image/png'));
       await page.waitForFunction(()=>document.querySelector('.home-license-card').dataset.side==='back');
       assert.ok(await section.locator('.home-license-back').isVisible());
       assert.ok(await section.locator('#home-license-benefit').isHidden());
       assert.doesNotMatch(await section.locator('#home-license-issue').innerText(),/무료/);
     }else{
       assert.ok((await section.locator('#home-license-description').textContent()).includes('멤버 전용 콘텐츠'));
       assert.ok(await section.locator('#home-license-record').isHidden());
       assert.ok(await section.locator('#home-license-benefit').isVisible());
       assert.equal(await section.locator('#home-license-title').innerText(),'감띠즈 애호가 라이센스');
       assert.match(await section.locator('.home-license-free').innerText(),/무료 발급/);
       assert.match(await section.locator('#home-license-description').innerText(),/감자튀김과 감띠즈를 사랑하는 애호가/);
       assert.match(await section.locator('#home-license-description').innerText(),/온라인 라이센스 카드/);
       assert.match(await section.locator('#home-license-issue').innerText(),/^라이센스 발급하기/);
       assert.doesNotMatch(await section.locator('#home-license-issue').innerText(),/무료/);
       assert.equal(await section.locator('.home-license-actions a').first().getAttribute('href'),'license.html');
     }
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=2));
     await context.close();
   }
 }finally{await browser.close();}
});

for(const engine of [chromium,webkit])test('Home highlights all three compact Play links and uses the branded radar fallback: '+engine.name(),{timeout:45000},async()=>{
 const browser=await engine.launch();
 try{
  for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
   const mobile=viewport.width<700,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,serviceWorkers:'block',reducedMotion:'reduce'});
   await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
   const today=new Date().toISOString(),items=[{id:'home-qa',title:'감튀 소식',summary:'소식',category:'event',source:'QA',url:'https://example.com/story',publishedAt:today,collectedAt:today}];
   await context.route('**/data/fry-radar.json',route=>route.fulfill({json:{updatedAt:today,items}}));
   const page=await context.newPage();
   await page.goto(base+'index.html#experiences',{waitUntil:'load'});
   await page.waitForFunction(()=>document.body.dataset.homeScene===document.querySelector('#experiences').dataset.scene);
   const games=page.locator('#experiences .experience-links>a');
   assert.equal(await games.count(),3);
   assert.deepEqual(await games.evaluateAll(els=>els.map(el=>el.getAttribute('href'))),['quiz.html','combo.html','draw.html']);
   assert.equal(await page.locator('#experiences .home-game-icon svg').count(),3);
   assert.ok(await games.evaluateAll(els=>els.every(el=>el.getBoundingClientRect().height<115)));
   assert.equal(await page.locator('#collection-dex').getAttribute('href'),'collection.html');
   assert.equal(await page.locator('#collection a[href="draw.html"]').count(),0);
   const preview=page.locator('.radar-preview-item img.radar-thumb-fallback');
   await page.waitForFunction(()=>document.querySelector('.radar-preview-item img.radar-thumb-fallback'));
   assert.ok(await preview.count()>0);
   assert.match(await preview.first().getAttribute('src'),/fry-radar-thumbnail\.png\?v=20261122radarred1$/);
   assert.equal((await page.locator('.radar-preview-title-row .radar-member-badge').textContent()).trim(),'멤버 전용');
   assert.equal(await page.locator('.radar-member-badge svg').count(),1);
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
     await page.waitForFunction(()=>window.GTZHomeMotion&&document.querySelectorAll('#friends-dots button').length===16);
     assert.equal(await page.locator('#main section').count(),11);
     assert.equal(await page.locator('.story-row').count(),2);
     assert.equal(await page.locator('#gallery .friend-carousel-card:not([aria-hidden])').count(),16);
     assert.equal(await page.locator('#friends-dots button').count(),16);
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
     assert.equal(catalog.photos,16);
     assert.ok(catalog.borders.every(r=>r==='0px'),'editorial content must not revert to a rounded card grid');
     assert.equal(await page.locator('#friends-count,#friends-prev,#friends-next,#friends-pause,.home-friend-index,.home-friend-arrow').count(),0);
     // Fixed-width indicator slots must not wrap or shift as any item is selected.
     if(mobile)for(const width of [320,375,390,430]){
       await page.setViewportSize({width,height:844});
       await page.waitForFunction(()=>document.querySelector('#gallery').getAnimations().length>0);
       const dots=page.locator('#friends-dots button');
       for(let i=0;i<16;i++){
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
   assert.equal(await page.locator('.gtz-wallet-shine').evaluate(el=>getComputedStyle(el,'::before').animationName),'gtz-wallet-reflection');
   assert.equal(await page.locator('.gtz-wallet-content').evaluate(el=>getComputedStyle(el).backdropFilter),'none');
   assert.equal(await page.locator('.gtz-wallet-sheet').evaluate(el=>document.documentElement.classList.contains('gtz-wallet-open')),true);
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

// Keep MY ID navigation independent of the animated card on touch browsers.
for(const engine of [chromium,webkit])test('Mobile MY ID Menu stays painted and clickable: '+engine.name(),{timeout:45000},async()=>{
 const browser=await engine.launch();
 try{
  for(const issued of [false,true]){
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   if(issued)await context.addInitScript(license=>localStorage.setItem('gamttiz-my-license-v1',JSON.stringify(license)),license);
   await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
   const page=await context.newPage();await page.goto(base+'license.html'+(issued?'?wallet=1':''),{waitUntil:'load'});
   if(issued)await page.waitForFunction(()=>document.body.classList.contains('has-license'));
   const trigger=page.locator('.control-trigger');
   const check=async()=>{
    await trigger.waitFor({state:'visible'});
    const s=await trigger.evaluate(el=>{const r=el.getBoundingClientRect(),c=getComputedStyle(el);return {visible:c.visibility,opacity:c.opacity,position:getComputedStyle(el.parentElement).position,hit:el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),optics:!!el.querySelector('.gtz-liquid-optics'),fill:c.backgroundImage,blur:c.backdropFilter};});
    assert.ok(s.visible==='visible'&&s.opacity==='1'&&s.position==='fixed'&&s.hit&&!s.optics&&s.fill.includes('linear-gradient')&&s.blur==='none',JSON.stringify(s));
   };
   await check();
   await page.locator('#license-flip').tap();await page.waitForTimeout(160);await check();
   await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'}));await page.waitForTimeout(180);await check();
   await trigger.tap();await page.waitForFunction(()=>document.querySelector('.control-dock').dataset.mode==='menu');
   await trigger.tap();await page.waitForFunction(()=>document.querySelector('.control-dock').dataset.mode==='closed');
   await context.close();
  }
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
       return icons.length===1&&icons[0].getAttribute('aria-hidden')==='true'&&Math.abs(box.width-16)<.6&&box.right<=text.left;
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
         return {frame:getComputedStyle(contact,'::before').backgroundImage.includes('linear-gradient'),
           border:getComputedStyle(contact).borderTopWidth,button:b.backgroundImage==='none'&&a.borderRadius===b.borderRadius&&getComputedStyle(copy.querySelector('.gtz-liquid-optics')).backdropFilter.includes('blur(1.25px)'),
           sweep:getComputedStyle(copy.querySelector('.gtz-liquid-optics'),'::before').animationName==='gtz-liquid-sweep',height:copy.getBoundingClientRect().height};
       });
       assert.ok(material.frame&&material.border==='0px'&&material.button&&material.sweep&&material.height>=44,'Contact liquid glass material mismatch');
       await contact.locator('.contact-copy').click();
       await page.waitForFunction(()=>document.querySelector('.contact-copy-status').textContent.length>0);
     }
     if(filename==='member.html')assert.equal(await page.evaluate(()=>document.querySelectorAll('.member-tile').length),1);
     if(filename==='member.html#radar')assert.equal(await page.getByRole('button',{name:'캘린더 추가'}).count(),0);
     await trigger.click();
     const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
     assert.ok(overflow<=2,filename+' horizontal overflow '+overflow+'px at '+viewport.width);
     if(['play.html','collection.html','draw.html','member.html#radar'].includes(filename)){
       const target=filename==='play.html'?'.hub-grid>a':filename==='collection.html'?'.dex-toolbar':filename==='draw.html'?'.draw-machine':'.radar-glass-field';
       const material=await page.locator(target).first().evaluate(el=>{
         const optics=el.querySelector(':scope > .gtz-liquid-optics'),style=getComputedStyle(el);
         return {glass:!!optics,blur:optics?getComputedStyle(optics).backdropFilter:style.backdropFilter,background:style.backgroundColor,shadow:style.boxShadow};
       });
       if(filename==='member.html#radar')assert.ok(material.glass&&material.blur.includes('blur(1.25px)'),filename+' search lens');
       else assert.ok(!material.glass&&material.blur==='none'&&material.background!=='rgba(0, 0, 0, 0)',filename+' solid paper card '+JSON.stringify(material));
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
         return {href:card.getAttribute('href'),aligned:ib.width>=50&&ib.right<=tb.left&&tb.right<=cb.right,material:!card.querySelector(':scope > .gtz-liquid-optics')&&getComputedStyle(card).backdropFilter==='none'};
       }));
       assert.deepEqual(layout.map(c=>c.href),['quiz.html','combo.html','draw.html']);
       assert.ok(layout.every(c=>c.aligned&&c.material),'Play paper and icon alignment at '+viewport.width);
     }
     if(filename==='license.html'){
       await page.locator('#license-edit').click();
       const rail=page.locator('#license-friends');
       await rail.waitFor({state:'visible'});
       assert.equal(await rail.locator('.license-friend').count(),16);
       assert.equal(await rail.evaluate(el=>getComputedStyle(el).scrollSnapType),'x mandatory');
       const square=await rail.locator('.license-friend.is-profile-current').boundingBox();
       assert.ok(square&&Math.abs(square.width-square.height)<2,'favorite profile card must be square');
       const previous=await rail.locator('input:checked').getAttribute('value');
       assert.equal(await page.locator('.license-profile-controls').count(),0);
       assert.equal(await rail.locator('.gtz-liquid-optics').count(),0);
       await rail.focus();await page.keyboard.press('ArrowRight');
       await page.waitForFunction(n=>document.querySelector('#license-friends input:checked').value!==n,previous);
       await rail.focus();
       await page.keyboard.press('End');
       await page.waitForFunction(()=>document.querySelector('#license-friends input:checked').value==='13');
       assert.equal(await rail.locator('input:checked').getAttribute('value'),'13');
       await page.locator('#license-cancel').click();
     }
     if(filename==='collection.html'){
       assert.equal(await page.locator('.dex-tile').count(),20);
       assert.equal(await page.locator('.dex-unknown').count(),4);
       assert.equal(await page.locator('.dex-tile .dex-new-badge').count(),2);
       for(const id of [15,16])assert.equal(await page.locator('[data-friend-id="'+id+'"] .dex-new-badge').textContent(),'NEW');
       assert.equal(await page.locator('.dex-tile .dex-face').count(),17);
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
       await page.goto(base+'collection.html#friend-15');
       assert.equal(await page.locator('#dex-profile h2').textContent(),'버터갈릭감띠');
       await page.locator('#dex-next').click();
       assert.equal(await page.locator('#dex-profile h2').textContent(),'매콤감띠');
       await page.locator('#dex-close').click();
     }
     if(filename==='products.html'){
       const cards=page.locator('#catalog-grid .catalog-card');assert.equal(await cards.count(),16);
       for(const n of [15,16]){const image=cards.nth(n-1).locator('img');assert.match(await image.getAttribute('src'),new RegExp('keyring-'+n+'\\.png'));}
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

