import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {direct,actorAsset,type Performance} from '../src/performance.ts';
import {nodes,sceneOrder,initialState,applyChoice,has} from '../src/story.ts';
import {freshSave,type Save} from '../src/storage.ts';
let beats=0;const used=new Set<string>();
function check(save:Save){
 const original=JSON.stringify(save);const p:Performance=direct(save);assert.equal(JSON.stringify(save),original,'Performance changed narrative state');
 assert(p.actors.length<=3);assert.equal(new Set(p.actors.map(c=>c.id)).size,p.actors.length);
 assert.equal(new Set(p.actors.map(c=>c.slot)).size,p.actors.length);
 for(const c of p.actors){
  assert(c.label);assert(existsSync(fileURLToPath(new URL('../public'+actorAsset(c.id,c.pose),import.meta.url))),`Missing ${c.id}/${c.pose}`);
  used.add(c.id+':'+c.pose);
  if(c.id==='shitou'&&c.pose==='grief')assert(has(save.state,'belt_boiled')||has(save.state,'last_ration_shared'),'Winter keepsake appeared too early');
  if(c.id==='shitou'&&c.pose==='act')assert.equal(save.node==='departure_shoes'||save.node==='snow_load',true,'Shoe pose used for unrelated action');
  if(c.id==='leader')assert(save.state.choices.length<=5,'Leader reappeared after death');
  if(c.id==='bugler')assert(save.state.choices.length<=10,'Bugler reappeared after death');
 }
 if(save.node==='xiang_letter'&&save.phase==='feedback')assert(!p.actors.some(c=>c.id==='leader'));
 if(save.node==='grass_belt'&&save.phase==='feedback')assert(!p.actors.some(c=>c.id==='bugler'));
 if(save.node==='grass_belt'&&save.phase==='feedback')assert.equal(p.actors.filter(c=>(c.id==='medic'||c.id==='shitou')&&c.pose==='grief').length,1,'One keepsake was drawn in two hands at once');
 beats++;
}
let state=initialState();
for(const id of sceneOrder){
 const n=nodes[id];for(let line=0;line<n.lines.length;line++)check({...freshSave(),node:id,line,state});
 for(const c of n.choices!){const next=applyChoice(state,id,c.id).state;for(let line=0;line<c.feedback.length;line++)check({...freshSave(),node:id,phase:'feedback',line,state:next});}
 state=applyChoice(state,id,n.choices![0].id).state;
}
assert.equal(direct({...freshSave(),node:'finale',state},'relay').actors.some(c=>c.id==='shitou'),false);
const soft=direct({...freshSave(),node:'zunyi_doubt',line:4,state});assert.equal(soft.actors.find(c=>c.id==='medic')?.pose,'talk');assert.equal(soft.actors.find(c=>c.id==='bugler')?.pose,'soft');
console.log(JSON.stringify({performanceBeats:beats,distinctCharacterPoses:used.size,checks:'Per-character acting; no premature keepsakes; no deceased cast revived; all pose resources local; stage direction leaves story state unchanged.'},null,2));
