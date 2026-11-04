import {useEffect,useState} from 'react';
import {CHAPTERS,nodes,linesFor,getEnding,endingReflection,endingText,informationOf} from './story';
import type {Save} from './storage';
import {direct} from './performance';
import {SceneDirector,type Settings} from './Scene';

type Props={save:Save;settings:Settings;revealed:number;segments:string[];full:string;decisionOpen:boolean;showInfo:boolean;unlockedCount:number;advance:()=>void;choose:(id:string)=>void;setShowInfo:(v:boolean)=>void;onPause:()=>void;onHistory:()=>void;onEndings:()=>void;onRestart:()=>void};
const itemNames={shoes:'母亲的草鞋',letter:'未写完的家书',belt:'半截皮带',salt:'一小包盐',relic:'冬生的号嘴'};
export function PlayView(p:Props){
 const node=nodes[p.save.node];const ls=linesFor(node,p.save.state,p.save.phase);const line=ls[p.save.line];
 const chapter=CHAPTERS[node.chapter-1];const ending=node.ending?getEnding(p.save.state):null;
 const last=p.save.line>=ls.length-1;const complete=p.revealed>=p.segments.length;const feedback=p.save.phase==='feedback';
 const [arrival,setArrival]=useState(true);
 useEffect(()=>{setArrival(true);const t=setTimeout(()=>setArrival(false),4200);return()=>clearTimeout(t);},[node.chapter,node.scene]);
 const health=p.save.state.health;const strength=health<=2?'伤痛很重':health<=5?'有些疲惫':'尚能前行';
 const performance=direct(p.save,ending?.id);
 return <main className={`play-main ${p.decisionOpen?'making-choice':''} ${ending?'at-ending':''} ${performance.actors.some(c=>c.id==='shitou'&&c.pose==='act'||c.id==='mother'&&c.pose==='idle')?'hands-scene':''} ${performance.actors.some(c=>c.id==='bugler'&&c.pose==='grief')?'bowl-scene':''}`} aria-label={`第${chapter.number}章，${chapter.title}`}>
  <section className="story-stage" onClick={e=>{if(!(e.target as HTMLElement).closest('button'))p.advance();}} aria-label="点击场景继续故事">
   <SceneDirector scene={node.scene} line={line} performance={performance} settings={p.settings} ending={ending?.id}/>
  </section><div className="cinema-vignette" aria-hidden="true"/>
  {arrival&&!ending&&<div className="chapter-arrival" aria-hidden="true"><span>{node.location}</span><strong>{chapter.title}</strong><small>{chapter.subtitle}</small></div>}
  {ending?<section className={`ending-panel ending-${ending.id}`} aria-label="个人结局">
   <span className="ending-kicker">{ending.code} · 一段个人经历</span><h2>{ending.title}</h2><p className="ending-eyebrow">{ending.eyebrow}</p><p className="ending-story">{endingText(p.save.state)}</p>
   <details className="ending-summary"><summary>你带走的，留下的，记住的</summary><div className="ending-reflection">{endingReflection(p.save.state).map(t=><p key={t}>{t}</p>)}</div></details>
   <details className="ending-summary"><summary>回看走过的路 · 五次重要抉择</summary>{p.save.state.choices.map((c,i)=><div className="choice-record" key={c.node}><b>{String(i+1).padStart(2,'0')}</b><div><strong>{c.key?'◆ ':''}{c.label}</strong><small>{c.effect}</small></div></div>)}</details>
   <div className="ending-actions"><button className="primary-button" onClick={p.onRestart}>再走一程</button><button className="text-button" onClick={p.onEndings}>回看经历 · {p.unlockedCount}/4</button><button className="field-pause" onClick={p.onPause}>暂歇</button></div>
  </section>:p.decisionOpen&&node.choices?<section className="decision-panel" aria-label="在场景中作出选择">
   <div className="decision-top"><div><span className="decision-kicker">{node.key?'这一次，要认真想一想。':'先做好眼前这一件事。'}</span><h2>{node.title}</h2></div><button className="field-pause" onClick={p.onPause}>暂歇</button></div>
   <p className="decision-condition">{strength}<span>·</span>体力 {health} / 10<span>·</span>第{chapter.number}章</p>
   {node.id==='north_delivery'&&health<=2&&<p className="physical-warning" role="status">你的脚伤与衰弱已很重。若坚持亲送，会在途中牺牲；托人或养伤仍可选择。</p>}
   <div className="decision-tools"><button className="field-recall" onClick={()=>p.setShowInfo(!p.showInfo)} aria-expanded={p.showInfo}>{p.showInfo?'收起这页记忆':'回想眼前的处境'}</button></div>
   {p.showInfo&&<div className="information"><ul>{informationOf(node,p.save.state).map(t=><li key={t}>{t}</li>)}</ul><p>行囊：{p.save.state.items.map(i=>itemNames[i]).join('、')||'已交接'}。</p></div>}
   <div className="choices">{node.choices.map(c=><div className="choice-wrap" key={c.id}><button className="choice-button" onClick={()=>p.choose(c.id)}><span><strong>{c.label}</strong><small>{c.detail}</small></span></button></div>)}</div>
  </section>:<section className={`dialogue-panel ${line?.who==='旁白'?'narrator-dialogue':''} ${feedback?'action-feedback':''}`} aria-label={feedback?'选择后的即时反馈':'故事对白'}>
   <div className="dialogue-heading"><span className="speaker-name">{line?.who==='你'?'石头':line?.who==='旁白'?'行路手记':line?.who}</span></div>
   <button className="dialogue-text" onClick={p.advance} aria-describedby="current-line" aria-label={!complete?'显示完整对白':last&&!feedback&&node.choices?'作出决定':'下一句对白'}><span aria-hidden="true">{p.segments.slice(0,p.revealed).join('')}<span className="unrevealed">{p.segments.slice(p.revealed).join('')}</span></span><span className="sr-only" id="current-line">{p.full}</span></button>
   <div className="dialogue-bottom"><span className="field-hint">{p.save.node==='departure_shoes'&&p.save.line===0&&!feedback?'轻触画面，或按空格继续':feedback?'这一刻，事情有了变化。':last&&complete?'想好了，就继续。':''}</span><div className="field-actions">{node.review&&feedback&&last&&complete&&<button className="field-recall" onClick={p.onHistory}>翻一页史料</button>}<button className="field-pause" onClick={p.onPause} aria-label="暂歇，打开存档与设置">暂歇</button><span className="advance-cue" aria-hidden="true">{last&&!feedback&&node.choices?'◇':'▾'}</span></div></div>
  </section>}
 </main>;
}

