import {initialState,nodes,sceneOrder,linesFor,applyChoice,type State} from './story';
export type Save={version:2;node:string;line:number;phase:'scene'|'feedback';state:State;log:{who:string;text:string;chapter:number}[];savedAt:number};
// New story has a separate namespace. Earlier three-chapter saves remain untouched.
export const prefix='zhengtu.shitou.v2.';
export const freshSave=():Save=>({version:2,node:sceneOrder[0],line:0,phase:'scene',state:initialState(),log:[],savedAt:Date.now()});
export function validSave(raw:unknown):raw is Save {
 try{
  const s=raw as Save;const n=nodes[s.node];
  if(s.version!==2||!n||!['scene','feedback'].includes(s.phase)||!Number.isFinite(s.savedAt)||!Array.isArray(s.log)||s.log.length>500||!Array.isArray(s.state.choices))return false;
  const index=n.ending?sceneOrder.length:sceneOrder.indexOf(s.node);
  const count=index+(s.phase==='feedback'?1:0);
  if(n.ending&&s.phase==='feedback'||count!==s.state.choices.length)return false;
  let rebuilt=initialState();
  for(let i=0;i<count;i++){
   const c=s.state.choices[i];if(!c||c.node!==sceneOrder[i])return false;
   rebuilt=applyChoice(rebuilt,c.node,c.id).state;
  }
  for(const k of ['faith','comrades','trust','health'] as const)if(rebuilt[k]!==s.state[k])return false;
  for(const k of ['flags','items','choices'] as const)if(JSON.stringify(rebuilt[k])!==JSON.stringify(s.state[k]))return false;
  if(!Number.isInteger(s.line)||s.line<0||s.line>Math.max(0,linesFor(n,s.state,s.phase).length-1))return false;
  return s.log.every(l=>typeof l.who==='string'&&typeof l.text==='string'&&l.text.length<2000&&Number.isInteger(l.chapter)&&l.chapter>=1&&l.chapter<=5);
 }catch{return false;}
}
export function loadSave(slot:'auto'|'manual'):Save|null{try{const x=JSON.parse(localStorage.getItem(prefix+slot)||'null');return validSave(x)?x:null;}catch{return null;}}
export function writeSave(slot:'auto'|'manual',s:Save):boolean{try{if(!validSave(s))return false;localStorage.setItem(prefix+slot,JSON.stringify({...s,savedAt:Date.now()}));return true;}catch{return false;}}
export function getStored<T>(key:string,fallback:T):T{try{return JSON.parse(localStorage.getItem(prefix+key)||'null')??fallback;}catch{return fallback;}}
export function setStored(key:string,value:unknown):boolean{try{localStorage.setItem(prefix+key,JSON.stringify(value));return true;}catch{return false;}}
