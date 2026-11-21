/* GAMTTIZ / living light. A real, continuously deformed optical field, not a
   translated illustration. Fixed, low-resolution, independent of scrolling. */
(() => {
  'use strict';
  const host = document.querySelector('.home-ambient');
  if (!host) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // A small, pre-rendered version of the same continuous field for browsers
  // without a fast WebGL context. It is muted, inline, and hardware-decodable.
  const startVideo=()=>{
    const video=document.createElement('video');
    video.defaultMuted=video.muted=true;video.playsInline=true;
    video.loop=true;video.preload='none';video.disablePictureInPicture=true;
    video.setAttribute('muted','');video.setAttribute('playsinline','');
    video.src='assets/home-ambient-motion.mp4?v=20261121brandlight1';
    host.append(video);
    const sync=()=>{
      if(document.hidden||reduced.matches){video.pause();return;}
      video.play().catch(()=>{});
    };
    video.addEventListener('playing',()=>host.classList.add('is-live'));
    video.addEventListener('error',()=>host.classList.remove('is-live'));
    document.addEventListener('visibilitychange',sync);
    if(reduced.addEventListener)reduced.addEventListener('change',sync);
    else reduced.addListener(sync);
    sync();
  };
  const canvas = document.createElement('canvas');
  host.append(canvas);
  let gl;
  try { gl = canvas.getContext('webgl', {
    alpha: false, antialias: false, depth: false, stencil: false,
    preserveDrawingBuffer: false, powerPreference: 'low-power',
    failIfMajorPerformanceCaveat: true
  }); } catch (_) { /* use the CSS motion fallback */ }
  if (!gl) { canvas.remove(); startVideo(); return; }
  const vert = `attribute vec2 a; void main(){gl_Position=vec4(a,0.,1.);}`;
  const frag = `
    precision mediump float;
    uniform vec2 resolution;
    uniform float angle;
    const float PI=3.14159265;
    float bloom(vec2 p, vec2 center, vec2 size){
      vec2 q=(p-center)/size;
      return exp(-dot(q,q)*1.7);
    }
    void main(){
      vec2 uv=gl_FragCoord.xy/resolution;
      float a=angle;
      // Two slow, opposing currents deform independently through space.
      vec2 p=uv;
      p.x+=.16*sin(uv.y*5.4+a)+.065*sin(uv.y*11.0-2.0*a);
      p.y+=.14*sin(uv.x*5.0-a)+.06*cos(uv.x*9.0+2.0*a);
      vec2 q=uv;
      q.x+=.12*sin(uv.y*6.2-2.0*a);
      q.y+=.12*cos(uv.x*5.8+a);
      float r=bloom(p,vec2(.78+.23*cos(a),.75+.18*sin(a)),vec2(.55,.49));
      float r2=bloom(q,vec2(.15+.18*sin(a),.12+.12*cos(2.0*a)),vec2(.48,.37));
      float shade=bloom(q,vec2(.25+.20*cos(a+2.0),.73+.19*sin(a+1.0)),vec2(.56,.55));
      float shade2=bloom(p,vec2(.86+.13*sin(a),.19+.10*cos(a)),vec2(.44,.42));
      float light=bloom(q,vec2(.44+.24*sin(a),.47+.33*cos(a)),vec2(.54,.48));
      // Interference of traveling light waves: soft specular concentrations
      // continuously split, merge and refract instead of moving as a picture.
      float interference=sin(8.0*p.x+5.0*p.y+2.0*a)+
        .75*sin(6.5*q.x-7.5*q.y-a)+.44*cos(11.0*p.y-9.0*p.x+2.0*a);
      float g=(interference-.58)*1.8, f=(interference+.5)*1.6;
      float glow=exp(-g*g);
      float fold=exp(-f*f);
      float envelope=.3+.7*max(r,shade);
      // Clean paper white, neutral shadow and a restrained golden fry tint.
      // Red belongs to the brand content, not a pink wash behind it.
      vec3 c=vec3(.987,.985,.980);
      c=mix(c,vec3(.81,.805,.79),shade*.58+shade2*.38);
      c=mix(c,vec3(.875,.827,.735),r*.54);
      c=mix(c,vec3(.94,.89,.78),r2*.50);
      c=mix(c,vec3(.82,.81,.785),fold*.19*envelope);
      c=mix(c,vec3(1.0),glow*.44*envelope);
      c=mix(c,vec3(1.0),light*.65);
      // Preserve a bright reading area and suppress overly chromatic edges.
      c=mix(c,vec3(.995,.993,.988),.14);
      float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;
      gl_FragColor=vec4(c+grain*.003,1.0);
    }`;
  const compile=(type,source)=>{
    const s=gl.createShader(type);
    gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);return null;}
    return s;
  };
  const vs=compile(gl.VERTEX_SHADER,vert), fs=compile(gl.FRAGMENT_SHADER,frag);
  if(!vs||!fs){canvas.remove();startVideo();return;}
  const program=gl.createProgram();
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){canvas.remove();startVideo();return;}
  gl.deleteShader(vs);gl.deleteShader(fs);
  gl.useProgram(program);
  const buffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const a=gl.getAttribLocation(program,'a');
  gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
  const size=gl.getUniformLocation(program,'resolution'), phase=gl.getUniformLocation(program,'angle');
  let raf=0,last=0,elapsed=0,dead=false,dirty=true;
  const draw=()=>{
    if(dirty){
      const w=host.clientWidth,h=host.clientHeight;
      if(!w||!h)return false;
      // Limit fill-rate on phones (normally <160k pixels), independent of DPR.
      const k=Math.min(1,640/Math.max(w,h),Math.sqrt(180000/(w*h)));
      canvas.width=Math.max(2,Math.round(w*k));canvas.height=Math.max(2,Math.round(h*k));
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.uniform2f(size,canvas.width,canvas.height);dirty=false;
    }
    gl.uniform1f(phase,(elapsed%14000)/14000*Math.PI*2);
    gl.drawArrays(gl.TRIANGLES,0,3);
    host.classList.add('is-live');
    return true;
  };
  const frame=(now)=>{
    raf=0;
    if(dead||document.hidden||reduced.matches)return;
    if(!last||now-last>=32){
      if(last)elapsed+=Math.min(now-last,80);
      last=now;draw();
    }
    raf=requestAnimationFrame(frame);
  };
  const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=0;last=0;};
  const sync=()=>{
    stop();if(dead||document.hidden)return;
    if(reduced.matches){draw();return;}
    raf=requestAnimationFrame(frame);
  };
  const resize=()=>{dirty=true;if(reduced.matches&&!dead&&!document.hidden)draw();};
  window.addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',sync);
  if(reduced.addEventListener)reduced.addEventListener('change',sync);
  else reduced.addListener(sync);
  canvas.addEventListener('webglcontextlost',()=>{
    dead=true;stop();host.classList.remove('is-live');canvas.remove();
    window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',sync);
    if(reduced.removeEventListener)reduced.removeEventListener('change',sync);
    else reduced.removeListener(sync);
    startVideo();
  },{once:true});
  draw();sync();
})();
