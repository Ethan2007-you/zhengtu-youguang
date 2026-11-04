import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {gsap} from 'gsap';
import {actorAsset,actorNames,type ActorCue,type Performance,type Pose} from './performance';
import {decodeImage} from './imageCache';

type VisibleCue=ActorCue&{present:boolean};
const poseIds:Pose[]=['idle','talk','act','soft','hurt','grief'];

function Character({cue,beat,focused,quiet}:{cue:VisibleCue;beat:string;focused:boolean;quiet:boolean}){
 const presence=useRef<HTMLDivElement>(null);const action=useRef<HTMLDivElement>(null);
 const [retry,setRetry]=useState(0);const [error,setError]=useState(false);
 const [display,setDisplay]=useState<{url:string;pose:Pose;previous?:string}|null>(null);
 const target=actorAsset(cue.id,cue.pose);
 useEffect(()=>{let cancelled=false;setError(false);decodeImage(target).then(()=>{if(!cancelled)setDisplay(old=>old?.url===target?old:{url:target,pose:cue.pose,previous:old?.url});}).catch(()=>{if(!cancelled)setError(true);});return()=>{cancelled=true;};},[target,retry,cue.pose]);
 useLayoutEffect(()=>{
  if(!presence.current)return;
  const ctx=gsap.context(()=>{
   if(quiet)gsap.set(presence.current,{opacity:cue.present?1:0,x:0});
   else if(cue.present)gsap.fromTo(presence.current,{opacity:0,x:cue.slot==='left'?-13:13},{opacity:1,x:0,duration:.38,ease:'power2.out'});
   else gsap.to(presence.current,{opacity:0,x:cue.slot==='left'?-8:8,duration:.24,ease:'power1.in'});
  },presence);return()=>ctx.revert();
 },[cue.present,quiet]);
 useLayoutEffect(()=>{
  if(!action.current)return;const ctx=gsap.context(()=>{
   gsap.set(action.current,{x:0,y:0,rotation:0});
   if(quiet||!cue.present||cue.action==='still')return;
   const tl=gsap.timeline();
   if(cue.action==='offer')tl.fromTo(action.current,{x:-6,y:2},{x:5,y:0,duration:.65,ease:'power2.out'});
   if(cue.action==='step')tl.fromTo(action.current,{x:-16,y:2},{x:0,y:0,duration:.65,ease:'power2.out'});
   if(cue.action==='brace')tl.fromTo(action.current,{rotation:-.7,y:3},{rotation:0,y:0,duration:.65,ease:'sine.out'});
   if(cue.action==='kneel')tl.fromTo(action.current,{y:-7},{y:0,duration:.65,ease:'power2.out'});
   if(cue.action==='withdraw')tl.to(action.current,{x:-6,y:2,duration:.9,ease:'sine.inOut'});
  },action);return()=>ctx.revert();
 },[beat,cue.action,cue.present,quiet]);
 return <div className={`cast-slot cast-${cue.id} slot-${cue.slot} ${focused?'cast-speaking':''} ${!cue.present?'cast-leaving':''} ${quiet?'cast-quiet':''}`} data-actor={cue.id} data-pose={cue.pose} data-displayed-pose={display?.pose??'loading'} role="img" aria-hidden={!cue.present||undefined} aria-label={`${actorNames[cue.id]}：${cue.label}`}>
  <div className="cast-presence" ref={presence}><div className="cast-action" ref={action}><div className="cast-breath">
   <div className="cast-ground" aria-hidden="true"/>
   {display?.previous&&!quiet&&<img key={'previous:'+display.url} className="cast-frame frame-previous" src={display.previous} alt="" aria-hidden="true"/>}
   {display&&<img key={display.url} className="cast-frame frame-current" src={display.url} alt="" aria-hidden="true" draggable={false}/>}
  </div></div></div>
  {error&&<button className="cast-retry" onClick={()=>setRetry(v=>v+1)}>重试{actorNames[cue.id]}的画面</button>}
 </div>;
}

export function CastStage({performance,quiet}:{performance:Performance;quiet:boolean}){
 const [visible,setVisible]=useState<VisibleCue[]>(()=>performance.actors.map(c=>({...c,present:true})));
 const [paused,setPaused]=useState(document.hidden);
 useEffect(()=>{const changed=()=>setPaused(document.hidden);document.addEventListener('visibilitychange',changed);return()=>document.removeEventListener('visibilitychange',changed);},[]);
 const currentIds=performance.actors.map(c=>c.id).join(',');
 // Removed cast members fade out briefly; a new beat cannot revive a dead character.
 useEffect(()=>{
  const next=performance.actors.map(c=>({...c,present:true}));
  if(quiet){setVisible(next);return;}
  setVisible(old=>[...next,...old.filter(c=>!performance.actors.some(n=>n.id===c.id)).map(c=>({...c,present:false}))]);
  const t=setTimeout(()=>setVisible(old=>old.filter(c=>c.present)),400);return()=>clearTimeout(t);
 },[currentIds,performance.beat,quiet]);
 useEffect(()=>{for(const c of performance.actors)for(const p of poseIds)decodeImage(actorAsset(c.id,p)).catch(()=>{});},[currentIds]);
 // Updated cues render immediately; the retained entries above exist only for exit animation.
 const live=visible.map(v=>{const latest=performance.actors.find(c=>c.id===v.id);return latest?{...latest,present:true}:v;});
 return <div className={`cast-stage ${quiet?'cast-still':''} ${paused?'cast-paused':''}`} data-depth="9" data-count={performance.actors.length} data-focus={performance.focus??''}>{live.map(c=><Character key={c.id} cue={c} beat={performance.beat} focused={performance.focus===c.id} quiet={quiet}/>)}</div>;
}
