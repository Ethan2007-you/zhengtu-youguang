import {has,linesFor,nodes,type ActorId,type State} from './story';
import type {Save} from './storage';
import {assetUrl} from './assetUrl';

export type Pose='idle'|'talk'|'act'|'soft'|'hurt'|'grief';
export type Action='still'|'step'|'offer'|'brace'|'kneel'|'withdraw';
export type ActorCue={id:ActorId;pose:Pose;action:Action;slot:'left'|'center'|'right';label:string};
export type Performance={beat:string;actors:ActorCue[];focus?:ActorId};
export const actorNames:Record<ActorId,string>={shitou:'石头',leader:'罗守田',medic:'陈杏',bugler:'冬生',mother:'母亲',ama:'央金阿妈',aunt:'刘婶'};
export const actorDescriptions:Record<ActorId,string>={shitou:'宽袖短身，护着挎包的十六岁少年',leader:'方脸浓眉，肩背宽厚的老班长',medic:'布巾低辫，带着绷带的卫生员',bugler:'雀斑翘发，号绳打着补结的小号手',mother:'穿旧蓝布衣，手上编着草鞋的母亲',ama:'裹着朴素衣袍，护着自家粮袋的央金',aunt:'围着旧围裙，端着小碗的刘婶'};
export const poseLabels:Record<ActorId,Record<Pose,string>>={
 shitou:{idle:'攥住挎包带，肩膀有些收紧',talk:'手按胸前，迟疑地说出害怕',act:'蹲下整理草鞋，低头认真用力',soft:'稳住双手递出家书',hurt:'撑住膝盖，脚伤使步子变重',grief:'捧着冬生的号嘴，低头忍住眼泪'},
 leader:{idle:'双臂收在胸前，眉头严厉',talk:'伸手指明要核对的背带与去向',act:'靠坐着把未写完的家书递出',soft:'垂下手，神情难得缓和',hurt:'靠坐着按住包扎处，力气已很弱',grief:'垂下眼，握着的手渐渐松开'},
 medic:{idle:'手放在医药袋旁，留意同伴脸色',talk:'俯身伸出手，等对方把话说完',act:'跪下整理绷带，手上没有停',soft:'伸手扶向同伴，神情温和坚定',hurt:'护住布袋，在风里收紧肩膀',grief:'蹲着收好号嘴，低头压住悲痛'},
 bugler:{idle:'抱着碗侧身站，眉眼里带着机灵',talk:'露出小虎牙似的缺口笑意，把碗向前举',act:'举起小号，眼神亮起来',soft:'低头摆弄号绳，笑得有些得意',hurt:'坐下捂住嘴咳嗽，号搁在身旁',grief:'蜷着身子护住碗，眼皮沉重'},
 mother:{idle:'低头收紧新草鞋的草绳',talk:'扶着鞋底，抬头看向孩子',act:'双手递出刚编好的草鞋',soft:'手停在鞋上，想嘱咐又收住',hurt:'低头收好草鞋',grief:'看着孩子离开的方向'},
 ama:{idle:'守着粮袋，先看清来人',talk:'伸出手说明能匀的分量',act:'把商量好的一小份粮递出去',soft:'神情缓和，接住盐包',hurt:'护住家里的粮袋',grief:'低头看自己的粮袋'},
 aunt:{idle:'端着小粮碗，留意来客的伤脚',talk:'端稳碗，等石头说出那些名字',act:'把可以匀出的那碗粮递近',soft:'侧身让出屋里歇脚的位置',hurt:'把小碗护在手里',grief:'停下手，安静听完没回来的人名'}
};
export function actorAsset(id:ActorId,pose:Pose='idle'){
 const support=['mother','ama','aunt'].includes(id);
 const frame=support?(pose==='act'||pose==='soft'?'act':'idle'):pose;
 return assetUrl(`/assets/cast/${id}-${frame}.webp`);
}

function stage(beat:string,entries:[ActorId,Pose,Action?][],focus?:ActorId):Performance{
 const slots:ActorCue['slot'][]=entries.length===1?['center']:entries.length===2?['left','right']:['left','center','right'];
 return {beat,focus:entries.some(([id])=>id===focus)?focus:undefined,actors:entries.map(([id,pose,action='still'],i)=>({id,pose,action,slot:slots[i],label:poseLabels[id][pose]}))};
}

/** Explicit stage directions live beside, rather than inside, the story engine.
 * No animation completion callback can change a choice or an outcome. */
export function direct(save:Pick<Save,'node'|'line'|'phase'|'state'>,ending?:string):Performance{
 const {node:id,line:i,phase,state:s}=save;const fb=phase==='feedback';
 const line=linesFor(nodes[id],s,phase)[i];const who=line?.who;
 const focus:ActorId|undefined=who==='你'?'shitou':who==='老班长'?'leader':who==='阿姐'?'medic':who==='小号手'?'bugler':who==='母亲'?'mother':who==='央金阿妈'?'ama':who==='刘婶'?'aunt':undefined;
 const beat=`${id}:${phase}:${i}`;
 if(ending==='relay')return stage(beat,[['medic','grief','withdraw']], 'medic');
 if(ending==='lamplight')return stage(beat,[['shitou','hurt'],['aunt','soft','offer']], 'shitou');
 if(ending==='recovery')return stage(beat,[['shitou','hurt'],['medic','soft','brace']], 'shitou');
 if(ending)return stage(beat,[['shitou','soft','offer'],['medic','soft']], 'shitou');
 switch(id){
  case 'departure_shoes':
   if(fb)return stage(beat,[['shitou',has(s,'shoes_worn')?'act':'idle',has(s,'shoes_worn')?'kneel':'step']],focus);
   return stage(beat,[['mother',i===1||i===2?'act':'idle',i===1?'offer':'still'],['shitou',i===2?'talk':'idle']],focus);
  case 'departure_message':
   if(fb)return has(s,'message_sent')?stage(beat,[['shitou','talk'],['bugler','soft','step']],focus):stage(beat,[['shitou','idle'],['medic','talk','offer']],focus);
   return i===3?stage(beat,[['leader','talk','step'],['bugler','idle']],focus):stage(beat,[['shitou',i===4?'talk':'idle'],['bugler',i===1?'talk':i===2?'act':i>=5?'idle':'soft',i===2?'brace':'still']],focus);
  case 'departure_role':
   if(fb)return has(s,'runner')?stage(beat,[['leader','talk','offer'],['shitou','idle','step']],focus):stage(beat,[['shitou','idle','brace'],['bugler','talk','offer']],focus);
   if(i===3)return stage(beat,[['medic','soft','offer'],['shitou','idle'],['bugler','talk']],focus);
   if(i===4)return stage(beat,[['shitou','talk'],['leader','soft']],focus);
   return stage(beat,[['leader',i===1?'talk':'idle'],['medic',i===2?'talk':'idle'],['bugler','idle']],focus);
  case 'xiang_bridge':
   if(fb)return stage(beat,[['shitou','hurt','brace'],['medic','act','kneel']],focus);
   return stage(beat,[['shitou',i>=3?'talk':'idle',i===0?'brace':'still'],['medic',i===1||i>=4?'act':'talk',i===1?'kneel':'still']],focus);
  case 'xiang_wounded':
   if(fb)return has(s,'staff_given')?stage(beat,[['shitou','hurt'],['bugler','soft','brace']],focus):stage(beat,[['shitou','idle'],['medic','act','kneel']],focus);
   return stage(beat,[['medic','act',i===0?'kneel':'still'],['bugler',i>=2?'idle':'soft']],focus);
  case 'xiang_letter':
   if(fb)return stage(beat,[['shitou','talk'],['medic','soft','brace']],focus);
   if(i===0)return stage(beat,[['leader','hurt'],['medic','act','kneel']], 'leader');
   return stage(beat,[['leader',i===1||i===2?'act':i>=4?'grief':'hurt',i===1||i===2?'offer':'still'],['shitou',i>=3?'talk':'idle']],focus||'leader');
  case 'zunyi_message':
   if(fb)return has(s,'walked_with_bugler')?stage(beat,[['shitou','idle','step'],['bugler','soft','step']],focus):stage(beat,[['shitou','talk','step'],['medic','soft']],focus);
   return stage(beat,[['medic',i===1||i===4?'talk':'idle'],['bugler',i===2?'hurt':'idle',i===2?'brace':'still']],focus);
  case 'zunyi_doubt':
   if(fb)return has(s,'fear_spoken')?stage(beat,[['shitou','talk'],['medic','talk','offer']],focus):stage(beat,[['shitou','idle'],['bugler','soft']],focus);
   if(i===1||i===5)return stage(beat,[['shitou','talk'],['medic','talk']],focus);
   return stage(beat,[['medic',i===3?'act':'talk'],['bugler',i===3?'hurt':'soft']],focus);
  case 'zunyi_letter':
   return stage(beat,[['shitou',fb?'soft':i>=3?'talk':'idle',fb?'offer':'still'],['medic',fb||i===1?'talk':'idle']],focus);
  case 'snow_load':
   if(fb&&has(s,'shoes_used'))return stage(beat,[['shitou','act','kneel'],['medic','soft','brace']],focus);
   return stage(beat,[['shitou',fb?(has(s,'shoes_used')?'act':'hurt'):i>=3?'talk':'hurt',fb&&has(s,'shoes_used')?'kneel':'brace'],['medic',fb?'soft':'hurt',fb?'brace':'still'],['bugler','hurt']],focus);
  case 'grass_belt':
   if(fb)return i===0?stage(beat,[['shitou','talk'],['medic','grief','offer']],focus):stage(beat,[['shitou','grief','kneel'],['medic','soft','brace']],focus);
   return stage(beat,[['shitou',i===3?'talk':'hurt'],['bugler',i>=1?'grief':'hurt']],focus);
  case 'grass_salt':
   return stage(beat,[['shitou',i===3&&!fb?'talk':'idle'],['ama',fb?'act':i===1?'talk':'idle',fb?'offer':'still']],focus);
  case 'north_trace':
   return stage(beat,[['shitou',s.health<=2?'hurt':fb?'idle':'grief',fb?'step':'still'],['medic',fb?'soft':'talk',fb?'brace':'still']],focus);
  case 'north_names':
   if(fb&&has(s,'remember_names'))return stage(beat,[['medic','talk'],['aunt','talk','offer']],focus);
   return stage(beat,[['shitou',i===2||fb?'grief':'hurt'],['aunt',i===1||fb?'talk':'idle',i===0?'offer':'still']],focus);
  case 'north_delivery':
   if(fb&&has(s,'final_heal'))return stage(beat,[['shitou','hurt'],['aunt','soft','offer']],focus);
   if(fb)return stage(beat,[['shitou',has(s,'final_handoff')?'soft':s.health<=2?'hurt':'idle',has(s,'final_handoff')?'offer':'still'],['medic','soft']],focus);
   return stage(beat,[['shitou',i>=4?'grief':s.health<=2?'hurt':i===1?'talk':'idle'],['medic',i===2?'talk':'soft',i===2?'offer':'still']],focus);
  default:return stage(beat,[],focus);
 }
}

export function requiredCastAssets(save:Pick<Save,'node'|'line'|'phase'|'state'>){return direct(save).actors.map(c=>actorAsset(c.id,c.pose));}
