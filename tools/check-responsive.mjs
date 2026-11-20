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
const pages=['index.html','member.html','license.html','play.html','products.html','project.html','quiz.html','combo.html','news.html','member.html#radar','member.html#level'];
const license={version:1,name:'테스트 감띠',number:'GTZ - 0001',issuedAt:'2026-11-20T00:00:00Z',character:0};
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
         return {frame:getComputedStyle(menu,'::before').backgroundImage===getComputedStyle(contact,'::before').backgroundImage,
           border:getComputedStyle(contact).borderTopWidth,button:a.backgroundColor===b.backgroundColor&&a.borderRadius===b.borderRadius&&a.boxShadow===b.boxShadow,
           sweep:getComputedStyle(copy,'::before').backgroundImage.includes('conic-gradient'),height:copy.getBoundingClientRect().height};
       });
       assert.ok(material.frame&&material.border==='0px'&&material.button&&material.sweep&&material.height>=44,'Contact liquid glass material mismatch');
       await contact.locator('.contact-copy').click();
       await page.waitForFunction(()=>document.querySelector('.contact-copy-status').textContent.length>0);
     }
     await trigger.click();
     const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
     assert.ok(overflow<=2,filename+' horizontal overflow '+overflow+'px at '+viewport.width);
   }
   await context.close();
 }
 }finally{await browser.close();}
});
test.after(()=>new Promise(resolve=>server.close(resolve)));
