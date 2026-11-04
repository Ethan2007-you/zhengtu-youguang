import assert from 'node:assert/strict';
import {nodes,sceneOrder,initialState,applyChoice,getEnding,endingDefinitions,linesFor,textOf,has,endingReflection,type State} from '../src/story.ts';
import {validSave,freshSave,type Save} from '../src/storage.ts';
const endings=new Map<string,number>();const reached=new Set<string>();let paths=0;const witnesses=new Map<string,State>();
function explore(id:string,s:State,depth=0){
 assert(nodes[id]);assert(depth<17,'Cycle');reached.add(id);const n=nodes[id];
 for(const k of ['faith','comrades','trust','health'] as const)assert(Number.isInteger(s[k])&&s[k]>=0&&s[k]<=10);
 for(const l of n.lines)assert(textOf(l,s));
 if(n.ending){
  assert.equal(s.choices.length,15);assert.equal(s.choices.filter(c=>c.key).length,5);
  const e=getEnding(s);endings.set(e.id,(endings.get(e.id)||0)+1);paths++;if(!witnesses.has(e.id))witnesses.set(e.id,s);
  assert(s.items.includes('letter'));assert(s.items.includes('shoes'));assert(s.items.includes('relic'));
  assert.equal(s.items.includes('belt'),!has(s,'belt_boiled'));assert(!s.items.includes('salt'));assert(has(s,'salt_traded')||has(s,'salt_shared'));
  assert(endingReflection(s).every(Boolean));return;
 }
 assert(n.choices&&n.choices.length>=2,'Dead end');
 const old=JSON.stringify(s);
 for(const c of n.choices){
  const result=applyChoice(s,id,c.id);assert.equal(JSON.stringify(s),old,'Mutated state');
  assert.throws(()=>applyChoice(result.state,id,c.id),'Duplicate decision');
  const fb=linesFor(n,result.state,'feedback');assert(fb.length>=2);assert(fb.every(l=>textOf(l,result.state)));
  if(['xiang_letter','grass_belt'].includes(id))assert(fb.every(l=>l.cast?.join()==='medic'),'Deceased character remains onscreen');
  explore(result.next,result.state,depth+1);
 }
}
assert.equal(sceneOrder.length,15);assert.equal(sceneOrder.filter(id=>nodes[id].key).length,5);
for(const id of sceneOrder){const n=nodes[id];assert(n.lines.length>=5);const size=n.lines.reduce((sum,l)=>sum+textOf(l,initialState()).length,0);assert(size>=200&&size<=300,`${id} length ${size}`);assert(n.choices!.every(c=>c.recall&&c.feedback.length&&c.detail&&c.effect));}
explore(sceneOrder[0],initialState());assert.equal(paths,49152);assert.equal(reached.size,Object.keys(nodes).length);assert.equal(endings.size,4);
assert(validSave(freshSave()));assert(!validSave({...freshSave(),node:'finale'}));assert(!validSave({...freshSave(),phase:'wrong'}));
// Replay one representative route to each ending, validating both sides of every choice.
let saves=0;
for(const target of witnesses.values()){
 let state=initialState();
 for(const c of target.choices){
  const n=nodes[c.node];const before:Save={...freshSave(),node:c.node,line:n.lines.length-1,state};assert(validSave(before));saves++;
  state=applyChoice(state,c.node,c.id).state;
  const after:Save={...before,state,phase:'feedback',line:linesFor(n,state,'feedback').length-1};assert(validSave(after));saves++;
  assert(!validSave({...after,state:{...state,health:99}}));assert(!validSave({...after,phase:'scene'}));
 }
 assert(validSave({...freshSave(),node:'finale',state}));
}
// Two early choice recalls really produce different later dialogue.
const runner=applyChoice(applyChoice(applyChoice(initialState(),sceneOrder[0],'wear').state,sceneOrder[1],'tell').state,sceneOrder[2],'runner').state;
const cook=applyChoice(applyChoice(applyChoice(initialState(),sceneOrder[0],'wear').state,sceneOrder[1],'keep').state,sceneOrder[2],'cook').state;
assert.notEqual(textOf(nodes.xiang_bridge.lines[2],runner),textOf(nodes.xiang_bridge.lines[2],cook));
assert.notEqual(textOf(nodes.zunyi_doubt.lines[4],runner),textOf(nodes.zunyi_doubt.lines[4],cook));
assert.equal(getEnding({...witnesses.get('relay')!,flags:[...witnesses.get('relay')!.flags.filter(f=>f!=='final_carry'),'final_heal']}).id,'lamplight');
console.log(JSON.stringify({nodes:reached.size,scenes:15,keyDecisions:5,completeRoutes:paths,endings:Object.fromEntries(endings),saveCheckpoints:saves,checks:'All options and four endings reachable; 200–300 characters per scene; state immutable; immediate feedback valid; delayed callbacks differ; physical risk explicit.'},null,2));


