import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {gsap} from 'gsap';
import type {Line,SceneId} from './story';
import type {Performance} from './performance';
import {CastStage} from './CastStage';
import {assetUrl} from './assetUrl';
export type Settings={quality:'standard'|'low'|'reduced';speed:number;audio:boolean};
export const sceneAssets:Record<SceneId,string>=Object.fromEntries(['valley','river','zunyi','marsh','snow','dawn'].map(id=>[id,assetUrl('/assets/'+id+'.webp?v=shitou2')])) as Record<SceneId,string>;
export function preload(src:string){return new Promise<void>((resolve,reject)=>{const im=new Image();im.onload=()=>im.decode().then(()=>resolve()).catch(()=>resolve());im.onerror=()=>reject(new Error('画面暂时未能载入'));im.src=assetUrl(src);});}

function Weather({scene,low}:{scene:SceneId;low:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const el=canvas.current;if(!el)return;const ctx=el.getContext('2d');if(!ctx)return;
  let id=0,last=0,visible=!document.hidden;let w=0,h=0;
  const particles=Array.from({length:low?16:42},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.6+.6,s:Math.random()*.025+.014}));
  const resize=()=>{const b=el.getBoundingClientRect();w=b.width;h=b.height;const d=Math.min(window.devicePixelRatio||1,low?1:1.5);el.width=w*d;el.height=h*d;ctx.setTransform(d,0,0,d,0,0);};
  const draw=(now:number)=>{if(!visible){id=0;return;}const dt=Math.min((now-last)/1000,.04);last=now;ctx.clearRect(0,0,w,h);ctx.fillStyle=scene==='snow'?'rgba(250,251,248,.65)':'rgba(241,224,187,.28)';
   for(const p of particles){p.y=(p.y+dt*p.s*((scene==='marsh'||scene==='zunyi')?8:scene==='snow'?2.5:1))%1;p.x=(p.x+dt*(scene==='snow'?.012:.004))%1;ctx.beginPath();if(scene==='marsh'||scene==='zunyi'){ctx.strokeStyle='rgba(220,232,226,.28)';ctx.lineWidth=.7;ctx.moveTo(p.x*w,p.y*h);ctx.lineTo(p.x*w-2,p.y*h+9);ctx.stroke();}else{ctx.arc(p.x*w,p.y*h,p.r,0,Math.PI*2);ctx.fill();}}id=requestAnimationFrame(draw);};
  const visibility=()=>{visible=!document.hidden;if(visible&&!id){last=performance.now();id=requestAnimationFrame(draw);}else if(!visible){cancelAnimationFrame(id);id=0;}};
  const ro=new ResizeObserver(resize);ro.observe(el);resize();last=performance.now();id=requestAnimationFrame(draw);document.addEventListener('visibilitychange',visibility);
  return()=>{cancelAnimationFrame(id);ro.disconnect();document.removeEventListener('visibilitychange',visibility);};
 },[scene,low]);
 return <canvas aria-hidden="true" className="weather" ref={canvas}/>;
}

export function SceneDirector({scene,line,settings,hero=false,ending,performance}:{scene:SceneId;line?:Line;settings:Settings;hero?:boolean;ending?:string;performance?:Performance}){
 const root=useRef<HTMLDivElement>(null);const camera=useRef<HTMLDivElement>(null);const [visual,setVisual]=useState({now:scene,prev:scene});const [failure,setFailure]=useState(false);const [retry,setRetry]=useState(0);
 const reduced=settings.quality==='reduced';
 useEffect(()=>{let cancelled=false;setFailure(false);preload(sceneAssets[scene]).then(()=>{if(!cancelled)setVisual(v=>v.now===scene?v:{now:scene,prev:v.now});}).catch(()=>{if(!cancelled)setFailure(true);});return()=>{cancelled=true;};},[scene,retry]);
 useLayoutEffect(()=>{if(!root.current)return;const c=gsap.context(()=>{gsap.fromTo('.current-bg',{opacity:0},{opacity:1,duration:reduced?0:.55});},root);return()=>c.revert();},[visual.now,reduced]);
 useLayoutEffect(()=>{if(!camera.current)return;const c=gsap.context(()=>{gsap.to(camera.current,{scale:line?.shot==='close'?1.055:line?.shot==='wide'?1:1.018,xPercent:line?.shot==='close'?-1:0,duration:reduced?0:.95,ease:'power2.out',overwrite:true});},root);return()=>c.revert();},[line?.shot,reduced]);
 useLayoutEffect(()=>{const c=gsap.context(()=>{const active=root.current?.querySelector('.speaker-active');const prop=root.current?.querySelector('.scene-prop');if(active)gsap.fromTo(active,{y:7,opacity:.82},{y:0,opacity:1,duration:reduced?0:.35});if(prop)gsap.fromTo(prop,{opacity:0,y:6},{opacity:1,y:0,duration:reduced?0:.4});},root);return()=>c.revert();},[line?.who,line?.prop,reduced]);
 useEffect(()=>{
  const el=root.current;if(!el||reduced||settings.quality==='low'||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
  const layers=Array.from(el.querySelectorAll<HTMLElement>('[data-depth]'));let frame=0,x=0,y=0,cx=0,cy=0;
  const tick=()=>{cx+=(x-cx)*.08;cy+=(y-cy)*.08;for(const l of layers){const d=Number(l.dataset.depth);l.style.transform=`translate3d(${cx*d}px,${cy*d}px,0)`;}if(Math.abs(x-cx)+Math.abs(y-cy)>.002)frame=requestAnimationFrame(tick);else frame=0;};
  const move=(e:PointerEvent)=>{const b=el.getBoundingClientRect();x=((e.clientX-b.left)/b.width-.5)*2;y=((e.clientY-b.top)/b.height-.5)*2;if(!frame)frame=requestAnimationFrame(tick);};
  const leave=()=>{x=0;y=0;if(!frame)frame=requestAnimationFrame(tick);};el.addEventListener('pointermove',move);el.addEventListener('pointerleave',leave);
  return()=>{cancelAnimationFrame(frame);el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',leave);layers.forEach(l=>l.style.transform='');};
 },[reduced,settings.quality]);
 return <div ref={root} className={`scene scene-${visual.now} ${hero?'scene-hero':''} ${reduced?'still':''} ${ending?'scene-ending-'+ending:''}`} aria-label={{valley:'苏区的村舍与离乡小路',river:'湘江浮桥与远处烟云',zunyi:'遵义雨夜街巷',snow:'夹金山风雪与岩石',marsh:'草地雨幕与边缘村舍',dawn:'陕北晨光与窑洞'}[visual.now]+' · 插画情境复原'}>
  <div className="camera" ref={camera}>
   <div className="scene-image previous-bg" style={{backgroundImage:`url(${sceneAssets[visual.prev]})`}}/>
   <div className="scene-image current-bg" data-depth="3" style={{backgroundImage:`url(${sceneAssets[visual.now]})`}}/>
   <svg className="ridge-layer" data-depth="6" viewBox="0 0 1440 810" preserveAspectRatio="none" aria-hidden="true"><path d="M-30 730 95 669 201 712 326 646 397 707 472 689 556 740 660 710 759 761 918 724 1006 746 1161 687 1292 710 1464 638 1475 850-20 850Z" fill={visual.now==='snow'?'#ccd0ce':'#2d3b35'} opacity=".28"/></svg>
   <div className="mist-layer" data-depth="7"/>
   {!hero&&performance&&<CastStage performance={performance} quiet={reduced}/>}
   <svg className="foreground-layer" data-depth="12" viewBox="0 0 1440 810" preserveAspectRatio="none" aria-hidden="true"><g fill={visual.now==='snow'?'#25313b':'#26382e'} opacity=".8"><path d="M0 810V683L52 720 71 699 129 771 188 751 274 810Z M1440 810V648L1401 698 1358 682 1311 751 1260 735 1190 810Z"/><path d="m25 810 9-139 6 139m24 0 24-100-16 100m1271 0-10-121 20 121m26 0 31-126-19 126"/></g></svg>
  </div>
  <div className="scene-shade"/>
  {settings.quality!=='reduced'&&<Weather scene={visual.now} low={settings.quality==='low'}/>}
  {line?.prop&&!performance?.actors.some(c=>(line.prop==='letter'&&(c.pose==='soft'||c.id==='leader'&&c.pose==='act'))||(line.prop==='shoes'&&(c.id==='mother'||c.id==='shitou'&&c.pose==='act'))||(line.prop==='horn'&&c.pose==='grief'))&&<div className={`scene-prop prop-${line.prop}`} aria-hidden="true"><Prop kind={line.prop}/></div>}
  {ending&&<div className={'ending-object object-'+ending} aria-hidden="true">{ending==='lamplight'?<svg viewBox="0 0 200 240"><ellipse cx="100" cy="133" rx="90" ry="95" fill="#e8bb6520"/><path d="M78 62v-9a22 22 0 0 1 44 0v9" fill="none" stroke="#493d2c" strokeWidth="5"/><path d="m68 70 8 106h48l8-106Z" fill="#dcac55" stroke="#52402b" strokeWidth="5"/><path d="M65 65h70m-70 115h70m-62 8h54m-53-38h52" stroke="#52402b" strokeWidth="8"/><path d="M100 141c-21-17 1-29 0-45 22 21 25 35 0 45" fill="#fff4bd"/></svg>:ending==='relay'?<svg viewBox="0 0 200 240"><path d="M28 190C130 210 43 45 159 37" fill="none" stroke="#b5523c" strokeWidth="3" strokeDasharray="5 5"/><circle cx="29" cy="190" r="6" fill="#c27550"/><path d="m112 31 62 9-7 49-62-9Z" fill="#e9d8b5" stroke="#957851" strokeWidth="2"/><path d="m112 31 26 28 36-19" fill="none" stroke="#957851" strokeWidth="2"/></svg>:<svg viewBox="0 0 200 240"><path d="m40 75 121-17 15 106-121 17Z" fill="#e7d7b7" stroke="#967d56" strokeWidth="2"/><path d="m56 96 89-12m-86 28 89-12m-86 28 65-9" stroke="#a79776" strokeWidth="2"/><path d="m63 142 75-10 8 45-75 11Z" fill="#c8b58f" stroke="#96805c" strokeWidth="2"/>{ending==='recovery'&&<path d="m37 190 119-24" stroke="#ece6d4" strokeWidth="12"/>}</svg>}</div>}
  {failure&&<div className="asset-error" role="alert">场景载入失败，进度已保留。<button onClick={()=>setRetry(v=>v+1)}>重试画面</button></div>}
 </div>;
}

function Prop({kind}:{kind:NonNullable<Line['prop']>}){return <svg viewBox="0 0 180 130">{kind==='letter'?<g><path fill="#d3c09b" stroke="#6f5738" d="m18 24 138-8 4 89-140 5Z"/><path d="m18 24 73 44 65-52M20 110l50-54m90 49-50-51" stroke="#8c775a" fill="none"/><path d="m32 90 104-5" stroke="#7c5838" strokeWidth="3"/></g>:kind==='shoes'?<g fill="#9a7846" stroke="#d0b179" strokeWidth="3"><path d="M26 89Q8 55 43 31q31-10 40 25l-5 47Q45 121 26 89Zm70 0Q78 55 113 31q31-10 40 25l-5 47q-34 18-52-14Z"/><path d="m27 51 47 25m-53-9 56 25M40 33l25 72m36-54 47 25m-53-9 56 25m-37-59 25 72" fill="none"/></g>:kind==='belt'?<g><path d="M21 74q56-46 128-12v28Q70 56 30 100Z" fill="#58432c" stroke="#98764b" strokeWidth="3"/><rect x="130" y="57" width="33" height="38" rx="3" fill="none" stroke="#b89a5d" strokeWidth="7"/><path d="m131 75 25 2" stroke="#b89a5d" strokeWidth="4"/></g>:kind==='salt'?<g><path d="m47 42 13-19 51 4 18 20-1 64-86-3Z" fill="#aaa188" stroke="#726a54" strokeWidth="3"/><path d="m44 49 79 4m-70 34 62 3" stroke="#6f634b" strokeWidth="2"/><path d="m53 43 70 6" stroke="#c5b99c" strokeWidth="6"/></g>:<g fill="#bca066" stroke="#65543a" strokeWidth="3"><path d="m47 48 67 16v30L43 76Z"/><path d="m108 59 33-22v83l-33-21Z"/><ellipse cx="45" cy="62" rx="13" ry="21"/><path d="M40 88q-21 45 59 22" fill="none" stroke="#9b7c4e" strokeWidth="5"/></g>}</svg>;}
