import React,{useCallback,useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {CHAPTERS,nodes,characters,linesFor,selectedChoice,textOf,applyChoice,getEnding,endingDefinitions,reviews,sources,type State} from './story';
import {freshSave,loadSave,writeSave,getStored,setStored,type Save} from './storage';
import {SceneDirector,preload,sceneAssets,type Settings} from './Scene';
import './style.css';
import './immersive.css';
import {PlayView} from './PlayView';
import {actorAsset,requiredCastAssets} from './performance';
import {decodeImage} from './imageCache';
import {audioBeat} from './audioScore';
import {Soundscape} from './soundscape';
import './cast.css';

type Panel='pause'|'map'|'people'|'history'|'log'|'settings'|'saves'|'endings'|null;
function Logo({onClick}:{onClick:()=>void}){return <button className="wordmark" onClick={onClick} aria-label="返回征途有光首页"><span className="brand-mark"><svg viewBox="0 0 42 42" aria-hidden="true"><circle cx="29" cy="12" r="4"/><path d="m4 32 12-20 11 20m-17-8h23m-15 9 7-14 13 14"/></svg></span><span>征途有光<small>把 信 送 到 的 人</small></span></button>;}
function RouteMap({chapter}:{chapter:number}){const points=[[65,200,'苏区'],[210,225,'湘江'],[340,145,'遵义'],[480,65,'雪山 · 草地'],[640,85,'陕北']];return <div className="route-map"><svg viewBox="0 0 760 300" role="img" aria-label="五章时间顺序示意，不是地理路线图"><path d="M65 200Q140 260 210 225T340 145T480 65T640 85" fill="none" stroke="#736d56" strokeWidth="2"/><path className="route-line" d="M65 200Q140 260 210 225T340 145T480 65T640 85" fill="none" stroke="#ad674e" strokeWidth="3" pathLength="1" style={{strokeDasharray:1,strokeDashoffset:1-chapter/5}}/>{points.map(([x,y,t],i)=><g key={t}><circle cx={x} cy={y} r="8" fill={chapter>=i+1?'#ad674e':'#736d56'}/><text x={Number(x)-18} y={Number(y)+32} fill="#c4b795" fontSize="16">{t}</text></g>)}</svg><p className="map-disclaimer">章节时间顺序示意 · 非地理地图，省略途中其他重大行程</p></div>;}

function Modal({title,children,onClose}:{title:string;children:React.ReactNode;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);const close=useRef<HTMLButtonElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const d=ref.current;d?.showModal();close.current?.focus();return()=>{d?.close();previous?.focus();};},[]);
 return <dialog ref={ref} className="modal" onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===ref.current)onClose();}} aria-labelledby="modal-title"><div className="modal-top"><span className="eyebrow">征途有光 / 行路手记</span><button ref={close} className="icon-button" aria-label="关闭面板" onClick={onClose}>×</button></div><h2 id="modal-title">{title}</h2><div className="modal-content">{children}</div></dialog>;
}

function savedVolume(value: unknown, fallback: number) {
 return typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(1,value)):fallback;
}

function App(){
 const [save,setSave]=useState<Save>(()=>loadSave('auto')||freshSave());
 const [playing,setPlaying]=useState(false);const [panel,setPanel]=useState<Panel>(null);const [toast,setToast]=useState('');
 const [settings,setSettings]=useState<Settings>(()=>{const v=getStored<Partial<Settings>>('settings',{});return{quality:matchMedia('(prefers-reduced-motion:reduce)').matches?'reduced':['standard','low','reduced'].includes(v.quality||'')?v.quality!:'standard',speed:[0,22,40,65].includes(v.speed??40)?v.speed??40:40,audio:typeof v.music!=='number'||v.audio!==false,music:savedVolume(v.music,.42),effects:savedVolume(v.effects,.55)};});
 const [unlocked,setUnlocked]=useState<string[]>(()=>{const r=getStored<unknown>('endings',[]);return Array.isArray(r)?r.filter(x=>typeof x==='string'&&endingDefinitions.some(e=>e.id===x)):[];});
 const [seenChoices,setSeenChoices]=useState<string[]>(()=>{const v=getStored<unknown>('seenChoices',[]);return Array.isArray(v)?v.filter(x=>typeof x==='string'):[];});const [revealed,setRevealed]=useState(0);const [loading,setLoading]=useState(false);const [loadError,setLoadError]=useState('');const [showInfo,setShowInfo]=useState(false);const [decisionOpen,setDecisionOpen]=useState(false);
 const [visited,setVisited]=useState<number[]>(()=>{const v=getStored<unknown>('chapters',[1]);return Array.isArray(v)?v.filter(x=>[1,2,3,4,5].includes(x)):[1];});
 const node=nodes[save.node];const activeLines=linesFor(node,save.state,save.phase);const line=activeLines[save.line];const full=line?textOf(line,save.state):'';const segments=typeof Intl.Segmenter==='function'?Array.from(new Intl.Segmenter('zh',{granularity:'grapheme'}).segment(full),x=>x.segment):Array.from(full);const last=save.line>=activeLines.length-1;const ending=node.ending?getEnding(save.state):null;
 const audioRef=useRef<Soundscape|null>(null);
 const lastAudioBeat=useRef('');
 const {track,ambience,cues,hushed,key:beatKey}=audioBeat(save,ending?.id);
 const paused=panel!==null;const typingTimer=useRef<ReturnType<typeof setInterval>|null>(null);
 const stopTyping=useCallback(()=>{if(typingTimer.current!==null){clearInterval(typingTimer.current);typingTimer.current=null;}},[]);
 const notify=(t:string)=>setToast(t);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),3400);return()=>clearTimeout(t);},[toast]);
 useEffect(()=>{if(playing&&!writeSave('auto',save))notify('此浏览器未能保存进度，请保持页面打开。');},[save,playing]);
 useEffect(()=>{setStored('settings',settings);},[settings]);
 useEffect(()=>{if(!playing)return;setVisited(v=>{const n=Array.from(new Set([...v,node.chapter]));setStored('chapters',n);return n;});},[node.chapter,playing]);
 useEffect(()=>{if(!ending||!playing)return;setUnlocked(old=>{const list=Array.from(new Set([...old,ending.id]));setStored('endings',list);return list;});},[ending?.id,playing]);
 useEffect(()=>{stopTyping();setRevealed(settings.speed===0?segments.length:0);if(settings.speed===0||!playing||!line)return;let value=0;typingTimer.current=setInterval(()=>{value+=1;setRevealed(value);if(value>=segments.length)stopTyping();},settings.speed);return stopTyping;},[save.node,save.line,save.phase,full,settings.speed,playing,stopTyping]);
 useEffect(()=>{setShowInfo(false);setDecisionOpen(false);},[save.node]);
 useEffect(()=>{if(!playing)return;const next=node.next||node.choices?.[0]?.next;if(next)preload(sceneAssets[nodes[next].scene]).catch(()=>{});},[save.node,playing]);
 const logCurrent=useCallback((s:Save)=>{const l=linesFor(nodes[s.node],s.state,s.phase)[s.line];if(!l)return s.log;const text=textOf(l,s.state);if(s.log.at(-1)?.text===text)return s.log;return [...s.log,{who:l.who,text,chapter:nodes[s.node].chapter}];},[]);
 const advance=useCallback(()=>{
  if(panel||!playing||node.ending||loading)return;
  if(revealed<segments.length){stopTyping();setRevealed(segments.length);return;}
  if(last&&node.choices&&save.phase==='scene'){setDecisionOpen(true);return;}
  setSave(s=>{const n=nodes[s.node];const log=logCurrent(s);const ls=linesFor(n,s.state,s.phase);const next=s.phase==='feedback'?selectedChoice(n,s.state)?.next:n.next;return s.line<ls.length-1?{...s,line:s.line+1,log}:next?{...s,node:next,line:0,phase:'scene',log}:s;});
 },[panel,playing,node,loading,revealed,segments.length,last,logCurrent,stopTyping,save.phase]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(panel||!playing)return;if(e.key==='Escape'){e.preventDefault();setPanel('pause');return;}if(e.key.toLowerCase()==='l'){e.preventDefault();setPanel('log');return;}const t=e.target as HTMLElement;if(['BUTTON','INPUT','SELECT','TEXTAREA','A','SUMMARY'].includes(t.tagName))return;if(e.code==='Space'||e.code==='Enter'){e.preventDefault();advance();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[advance,panel,playing]);
 const prepareSound=async()=>{
  try{
   audioRef.current??=new Soundscape();
   await audioRef.current.resume();
   return true;
  }catch{
   notify('此浏览器未能开启声音，故事可以继续。');
   return false;
  }
 };
 const start=async(resume:boolean)=>{
  if(loading)return;if(settings.audio)void prepareSound();setLoading(true);setLoadError('');const candidate=resume?(loadSave('auto')||save):freshSave();
  try{await Promise.all([preload(sceneAssets[nodes[candidate.node].scene]),...requiredCastAssets(candidate).map(decodeImage),preload('/assets/field-cloth.webp')]);setSave(candidate);setDecisionOpen(false);setPlaying(true);setPanel(null);window.scrollTo({top:0,behavior:'instant'});}
  catch{setLoadError('必要画面未能载入。请检查网络后再次点击开始，现有存档不会丢失。');}finally{setLoading(false);}
 };
 const choose=(id:string)=>{if(!last||revealed<segments.length||save.phase!=='scene')return;try{const {state}=applyChoice(save.state,save.node,id);setDecisionOpen(false);const c=node.choices!.find(x=>x.id===id)!;const key=save.node+':'+id;const seen=Array.from(new Set([...seenChoices,key]));setSeenChoices(seen);setStored('seenChoices',seen);setSave({...save,state,line:0,phase:'feedback',log:[...logCurrent(save),{who:'你的选择',text:c.label,chapter:node.chapter}]});}catch(e){notify((e as Error).message);}};
 const restore=(slot:'auto'|'manual')=>{const s=loadSave(slot);if(!s){notify('这个位置还没有有效存档。');return;}if(settings.audio)void prepareSound();setSave(s);setDecisionOpen(false);setPlaying(true);setPanel(null);};
 const toggleAudio=async()=>{
  if(settings.audio){setSettings(s=>({...s,audio:false}));return;}
  if(await prepareSound())setSettings(s=>({...s,audio:true}));
 };
 useEffect(()=>{
  const sound=audioRef.current;
  if(!sound)return;
  const active=playing&&settings.audio;
  sound.mix({audio:active,music:settings.music,effects:settings.effects,paused,hushed});
  sound.setScene(active&&settings.music>0?track:null,active&&settings.effects>0?ambience:null);
  if(!playing){
   lastAudioBeat.current='';
   return;
  }
  if(lastAudioBeat.current===beatKey)return;
  lastAudioBeat.current=beatKey;
  if(active&&!paused&&settings.effects>0)sound.playCues(cues);
 },[playing,settings.audio,settings.music,settings.effects,paused,hushed,track,ambience,beatKey,cues]);
 useEffect(()=>{
  const visibility=()=>audioRef.current?.setVisibility(document.hidden);
  document.addEventListener('visibilitychange',visibility);
  return ()=>{
   document.removeEventListener('visibilitychange',visibility);
   audioRef.current?.close();
   audioRef.current=null;
  };
 },[]);
 const historyPanel=<><p className="intro-text">真实的时代背景，虚构的普通人物。我们希望记住历史，也说清楚创作的边界。</p>{reviews.map((r,i)=><article className="history-entry" key={r.title}><span className="eyebrow">第{CHAPTERS[i].number}章 · 历史回望</span><h3>{r.title}</h3><p>{r.body}</p><p className="muted">{r.reflection}</p></article>)}<h3>资料来源</h3>{sources.map(s=><a className="source-link" key={s.url} href={s.url} target="_blank" rel="noreferrer"><span>{s.publisher} ↗</span><strong>{s.title}</strong><small>{s.note}</small></a>)}<p className="fine-print">人物对白均为原创虚构；插画为AI生成的情境复原，不是历史照片。地图为叙事示意。查阅日期：2026年11月3日。</p></>;

 return <div className={`app ${playing?'is-playing':''}`}>
  {!playing&&<header className="site-header"><Logo onClick={()=>{setPlaying(false);setPanel(null);}}/><nav aria-label="主要导航"><button className={!playing?'nav-active':''} onClick={()=>setPlaying(false)}>序章</button><button onClick={()=>setPanel('map')}>行路地图</button><button onClick={()=>setPanel('people')}>同行的人</button><button onClick={()=>setPanel('history')}>历史回望</button></nav><button className="header-action" onClick={()=>playing?setPanel('saves'):start(true)}>{playing?'存档与读档':'继续旅程'} <span>↗</span></button></header>}
  {!playing?<main className="home">
   <section className="hero-section"><div className="hero-copy"><div className="eyebrow"><span className="red-rule"/>1934—1936 · 一封信与一双草鞋</div><h1>征途<span>有光<span className="title-dot">。</span></span></h1><p className="hero-poem">山河很远，<br/>你我同行。</p><p className="hero-description">十六岁的石头，带着母亲的草鞋和班长的信。<br/>以一名普通战士的视角，走进长征路上的选择。</p><div className="hero-actions"><button className="primary-button" onClick={()=>start(false)} disabled={loading}>{loading?'正在准备画面…':'开始这段路'}<span>↗</span></button><button className="text-button" onClick={()=>setPanel('people')}>先认识同行的人 <span>→</span></button></div>{loadError&&<p className="error" role="alert">{loadError}</p>}<p className="hero-meta">五章故事 <i/> 四种个人结局 <i/> 短篇互动叙事</p></div>
   <div className="hero-art"><SceneDirector scene="valley" settings={settings} hero/><div className="hero-art-top"><span>门槛上的新鞋</span><span>01 / 05</span></div><div className="red-seal">故人<br/>来信</div><div className="hero-art-bottom"><span>路的尽头，仍有人在等。</span><small>虚构人物 · 历史情境复原</small></div><span className="art-coordinate">苏区 / 出发</span></div></section>
   <section className="chapters-section" aria-labelledby="chapter-heading"><div className="section-intro"><h2 id="chapter-heading">沿着一段路，认识几个普通的人。</h2><p>选择留下痕迹，故事继续向前。</p></div><div className="chapter-grid">{CHAPTERS.map((ch,i)=><button className="chapter-card" key={ch.number} onClick={()=>{setPanel('map');}}><div className={`chapter-thumb thumb-${ch.scene}`} style={{backgroundImage:`url(${sceneAssets[ch.scene]})`}}/><span className="chapter-number">0{i+1}</span><div><span className="eyebrow">第{ch.number}章</span><h3>{ch.title}</h3><p>{ch.subtitle}</p></div><span className="chapter-arrow">↗</span></button>)}</div></section>
   <footer className="home-footer"><span>长征万里，薪火千秋</span><p>中央红军长征历史背景下的原创互动叙事 <span>·</span> 主角与同伴均为虚构</p><button onClick={()=>setPanel('history')}>史料与创作说明 ↗</button></footer>
  </main>:<PlayView save={save} settings={settings} revealed={revealed} segments={segments} full={full} decisionOpen={decisionOpen} showInfo={showInfo} unlockedCount={unlocked.length} advance={advance} choose={choose} setShowInfo={setShowInfo} onPause={()=>setPanel('pause')} onHistory={()=>setPanel('history')} onEndings={()=>setPanel('endings')} onRestart={()=>start(false)}/>}

  {panel&&<Modal title={{pause:'暂歇片刻',map:'走过的路',people:'同行的人',history:'历史与创作',log:'对白记录',settings:'阅读、画面与声音',saves:'存档与读档',endings:'那些不同的经历'}[panel]} onClose={()=>setPanel(null)}>
   {panel==='pause'&&<div className="pause-menu"><p className="pause-location">第{CHAPTERS[node.chapter-1].number}章 · {CHAPTERS[node.chapter-1].title}</p><button className="pause-resume" onClick={()=>setPanel(null)}>继续上路</button><div className="pause-options"><button onClick={()=>setPanel('saves')}>存档与读档</button><button onClick={()=>setPanel('log')}>听过的话</button><button onClick={()=>setPanel('settings')}>阅读、画面与声音</button><button onClick={()=>setPanel('history')}>史料与来路</button></div><button className="pause-home" onClick={()=>{setPlaying(false);setPanel(null);}}>回到序章</button><p className="fine-print">脚步已自动记下。按 Esc 回到路上。</p></div>}
   {panel==='history'&&historyPanel}
   {panel==='map'&&<><p className="intro-text">从苏区出发，到陕北回望。章节可以回顾，新的选择需要从一段完整经历开始。</p><RouteMap chapter={playing?node.chapter:1}/><div className="map-chapters">{CHAPTERS.map((ch,i)=><div className="map-chapter" key={ch.number}><b>{ch.number}</b><div><h3>{ch.title}</h3><p>{ch.subtitle}</p><span className="eyebrow">{visited.includes(i+1)?'已抵达 · 可查看历史回望':'尚未抵达'}</span></div><button className="text-button" onClick={()=>setPanel('history')}>回望 ↗</button></div>)}</div><button className="primary-button" onClick={()=>playing?setPanel(null):start(true)}>{playing?'回到当前故事':'开始 / 继续旅程'} ↗</button></>}
   {panel==='people'&&<><p className="intro-text">他们是为这个故事创作的普通人，没有历史人物原型。每个人都带着自己的牵挂上路。</p><div className="people-list">{characters.map(p=><article className="person-card" key={p.name}><div className="person-portrait" style={{backgroundImage:`url(${actorAsset(p.id)})`,backgroundSize:'contain',backgroundPosition:'center',backgroundRepeat:'no-repeat'}}/><div><span className="eyebrow">虚构人物</span><h3>{p.name}</h3><small>{p.age}</small><p>{p.text}</p></div></article>)}</div></>}
   {panel==='log'&&<><p className="muted">按阅读顺序保留对白与选择，读档后恢复到对应记录。</p><div className="log-list">{[...save.log,...(line?[{who:line.who,text:full,chapter:node.chapter}]:[])].map((l,i)=><article key={i} className={l.who==='你的选择'?'log-choice':''}><span>{l.who==='你'?'石头':l.who} · 第{CHAPTERS[l.chapter-1]?.number}章</span><p>{l.text}</p></article>)}</div></>}
   {panel==='settings'&&<><p className="intro-text">让画面安静一点，也可以完整地走过这段路。</p><fieldset><legend>画面效果</legend>{([{id:'standard',label:'标准',detail:'轻微视差、环境粒子与剧情镜头'},{id:'low',label:'低特效',detail:'减少粒子，关闭指针视差'},{id:'reduced',label:'减少动态',detail:'关闭持续运动，保留全部故事与操作'}] as const).map(v=><label className="setting-option" key={v.id}><input type="radio" name="quality" checked={settings.quality===v.id} onChange={()=>setSettings(s=>({...s,quality:v.id}))}/><span><strong>{v.label}</strong><small>{v.detail}</small></span></label>)}</fieldset><label className="select-setting">文字显示<select aria-label="文字显示" value={settings.speed} onChange={e=>setSettings(s=>({...s,speed:Number(e.target.value)}))}><option value={22}>较快</option><option value={40}>适中</option><option value={65}>缓慢</option><option value={0}>直接显示全文</option></select></label><div className="select-setting"><span>旅程声音<small>进入旅程后播放，暂歇时自动放轻</small></span><button className="secondary-button" onClick={toggleAudio}>{settings.audio?'关闭声音':'开启声音'}</button></div>
   {([{id:'music',label:'配乐'},{id:'effects',label:'环境与动作音效'}] as const).map(({id,label})=><label key={id} className="select-setting sound-level"><span>{label}<small>{Math.round(settings[id]*100)}%</small></span><input type="range" aria-label={label+'音量'} min={0} max={100} value={Math.round(settings[id]*100)} disabled={!settings.audio} onChange={e=>setSettings(s=>({...s,[id]:Number(e.target.value)/100}))}/></label>)}<p className="fine-print">空格 / Enter：推进对白；L：打开记录；Esc：暂歇或关闭面板。系统减少动态偏好在首次进入时生效。</p></>}
   {panel==='saves'&&<><p className="intro-text">进度保存在当前浏览器，不上传个人信息。新旅程会覆盖自动存档；手动存档保留到你再次保存。</p>{(['auto','manual'] as const).map(slot=>{const s=loadSave(slot);return <article className="save-card" key={slot}><span className="eyebrow">{slot==='auto'?'自动存档':'手动存档'}</span><h3>{s?`第${CHAPTERS[nodes[s.node].chapter-1].number}章 · ${nodes[s.node].title}`:'尚无存档'}</h3><p>{s?new Date(s.savedAt).toLocaleString('zh-CN'):'开始旅程后，可以在此保存当前进度。'}</p><div>{slot==='manual'&&<button className="secondary-button" disabled={!playing} onClick={()=>{if(writeSave('manual',save)){notify('手动存档已保存。');setPanel(null);}else notify('未能写入存档，浏览器存储可能不可用。');}}>保存到此处</button>}<button className="text-button" disabled={!s} onClick={()=>restore(slot)}>读取进度 ↗</button></div></article>})}</>}
   {panel==='endings'&&<><p className="intro-text">每种经历都有它的重量。收藏记录不同的故事，不给人物评定等级。</p>{endingDefinitions.map((e,i)=><article className={`collected-ending ${unlocked.includes(e.id)?'unlocked':''}`} key={e.id}><span className="eyebrow">经历 {String(i+1).padStart(2,'0')} / {unlocked.includes(e.id)?'已读':'尚未经历'}</span><h3>{unlocked.includes(e.id)?e.title:'另一段尚未走过的路'}</h3><p>{unlocked.includes(e.id)?e.text:'身体状况、寻人线索与交接安排，会留下不同的个人经历。'}</p></article>)}<p className="fine-print">已读选择记录：{seenChoices.length} 个。收集进度保存在当前浏览器。</p></>}
  </Modal>}
  {toast&&<div className="toast" role="status">{toast}</div>}
 </div>;
}
createRoot(document.getElementById('root')!).render(<App/>);

