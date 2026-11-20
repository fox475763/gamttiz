/* GAMTTIZ Royal finish. Original artwork geometry and personal data are preserved. */
(() => {
  'use strict';
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const mix=(a,b,t)=>a+(b-a)*t;
  // Stable, deterministic micro-grain. No random flicker between renders or exports.
  const grain=(x,y)=>{
    let h=Math.imul(x+1,374761393)^Math.imul(y+1,668265263);
    h=Math.imul(h^(h>>>13),1274126177);
    return ((h^(h>>>16))>>>0)/4294967295-.5;
  };
  // The source is burgundy and gold. Soft classification preserves antialiased
  // artwork edges; white/transparent outside corners never become reflective.
  const foilAmount=(r,g,b,a=255)=>a===0||r<g*.94?0:clamp((g-4)/72)*clamp((g-b-2)/35)*clamp((r-b-4)/30);
  function finishPixels(data,width,height){
    const count=width*height,mask=new Uint8ClampedArray(count),scale=1080/width;
    for(let i=0,p=0;i<count;i++,p+=4)mask[i]=Math.round(data[p+3]*foilAmount(data[p],data[p+1],data[p+2],data[p+3]));
    const step=Math.max(1,Math.round(width/760));
    for(let y=0;y<height;y++){
      const v=y/Math.max(1,height-1);
      for(let x=0;x<width;x++){
        const i=y*width+x,p=i*4,r=data[p],g=data[p+1],b=data[p+2];
        if(!data[p+3]||(r>225&&Math.max(r,g,b)-Math.min(r,g,b)<18))continue;
        const u=x/Math.max(1,width-1),m=mask[i]/255;
        // Broad studio illumination + an extremely fine woven/soft-touch grain.
        const key=Math.exp(-((u-.29)**2*2.5+(v-.30)**2*2.3));
        const vignette=Math.min(1,((u-.5)**2+(v-.5)**2)*1.25);
        const noise=grain(Math.floor(x*scale),Math.floor(y*scale));
        const fibers=grain(Math.floor(x*scale*.47),Math.floor(y*scale*2.1));
        const velvet=noise*5.8+fibers*2.4;
        const upper=mask[Math.max(0,y-step)*width+Math.max(0,x-step)]/255;
        const lower=mask[Math.min(height-1,y+step)*width+Math.min(width-1,x+step)]/255;
        const pressShadow=Math.max(0,upper-m)*10;
        const red=100+key*36-vignette*13+velvet-pressShadow;
        const green=7+key*12-vignette*3+velvet*.42-pressShadow*.48;
        const blue=15+key*14-vignette*5+velvet*.55-pressShadow*.48;
        // Foil has a directional softbox reflection, champagne undertones,
        // and an imprint highlight/shadow at the actual original gold contours.
        const axis=u*.82+v*.46;
        const band=Math.exp(-(((axis-.50)/.20)**2));
        const sheen=Math.exp(-(((axis-.83)/.079)**2));
        const sourceTone=clamp((g-95)/155);
        const tone=clamp(.27+.49*band+.25*sheen+.20*sourceTone+noise*.028);
        const bevel=(m-upper)*23-(m-lower)*27;
        const fr=mix(142,255,tone)+bevel+noise*1.7;
        const fg=mix(91,239,tone)+bevel*.84+noise*1.4;
        const fb=mix(37,188,tone)+bevel*.62+noise*1.2;
        data[p]=mix(red,fr,m);data[p+1]=mix(green,fg,m);data[p+2]=mix(blue,fb,m);
      }
    }
    return mask;
  }
  // Render once per artwork size; canvas composition for personalised back
  // remains separate, keeping the QR, character and name crisp and readable.
  function prepare(img,width,height,cropY,logicalWidth,logicalHeight,withMask=true){
    const art=document.createElement('canvas');art.width=width;art.height=height;
    const ctx=art.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(img,0,cropY,logicalWidth,logicalHeight,0,0,width,height);
    const pixels=ctx.getImageData(0,0,width,height);
    const alpha=finishPixels(pixels.data,width,height);
    ctx.putImageData(pixels,0,0);
    let mask=null;
    if(withMask){
      mask=document.createElement('canvas');mask.width=width;mask.height=height;
      const mc=mask.getContext('2d'),image=mc.createImageData(width,height);
      for(let i=0,p=0;i<alpha.length;i++,p+=4){image.data[p]=255;image.data[p+1]=255;image.data[p+2]=255;image.data[p+3]=alpha[i];}
      mc.putImageData(image,0,0);
    }
    return {art,mask};
  }
  globalThis.GTZLicenseMaterial=Object.freeze({foilAmount,finishPixels,prepare});
})();
