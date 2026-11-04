import raw from './story-data.json';
export type SceneId='valley'|'river'|'zunyi'|'snow'|'marsh'|'dawn';
export type ActorId='shitou'|'leader'|'medic'|'bugler'|'mother'|'ama'|'aunt';
export type Person='你'|'旁白'|'母亲'|'老班长'|'阿姐'|'小号手'|'老兵'|'央金阿妈'|'刘婶'|'罗春生';
export type Item='shoes'|'letter'|'belt'|'salt'|'relic';
export type State={faith:number;comrades:number;trust:number;health:number;items:Item[];flags:string[];choices:{node:string;id:string;label:string;effect:string;key:boolean}[]};
export type Line={who:Person;text:string|((s:State)=>string);variant?:{flag:string;yes:string;no:string};mood?:'calm'|'tired'|'hope';shot?:'wide'|'medium'|'close';prop?:'letter'|'shoes'|'belt'|'salt'|'horn';cast?:ActorId[]};
export type Choice={id:string;label:string;detail:string;effect:string;feedback:Line[];recall:string;delta?:Partial<Pick<State,'faith'|'comrades'|'trust'|'health'>>;flag:string;addItems?:Item[];removeItems?:Item[];next:string;when?:(s:State)=>boolean;locked?:string};
export type StoryNode={id:string;chapter:number;scene:SceneId;title:string;location:string;hook?:string;key?:boolean;cast:ActorId[];lines:Line[];information?:string[];choices?:Choice[];review?:boolean;next?:string;ending?:boolean};
export const nodes=Object.fromEntries((raw as StoryNode[]).map(n=>[n.id,n]));
export const sceneOrder=(raw as StoryNode[]).filter(n=>!n.ending).map(n=>n.id);
export const initialState=():State=>({faith:3,comrades:3,trust:3,health:7,items:['shoes'],flags:[],choices:[]});
export const has=(s:State,f:string)=>s.flags.includes(f);
export const textOf=(l:Line,s:State)=>l.variant?(has(s,l.variant.flag)?l.variant.yes:l.variant.no):typeof l.text==='function'?l.text(s):l.text;
export const selectedChoice=(n:StoryNode,s:State)=>n.choices?.find(c=>c.id===s.choices.find(r=>r.node===n.id)?.id);
export const linesFor=(n:StoryNode,s:State,phase:'scene'|'feedback')=>phase==='feedback'?(selectedChoice(n,s)?.feedback??[]):n.lines;
export function applyChoice(s:State,nodeId:string,choiceId:string){
 const node=nodes[nodeId];const c=node?.choices?.find(c=>c.id===choiceId);
 if(!c||sceneOrder[s.choices.length]!==nodeId||s.choices.some(r=>r.node===nodeId))throw new Error('当前行动与剧情进度不符，请读取有效存档。');
 const state:State={...s,items:[...s.items],flags:[...s.flags],choices:[...s.choices]};
 for(const k of ['faith','comrades','trust','health'] as const)state[k]=Math.max(0,Math.min(10,state[k]+(c.delta?.[k]??0)));
 if(c.flag&&!state.flags.includes(c.flag))state.flags.push(c.flag);
 state.items=Array.from(new Set([...state.items.filter(i=>!c.removeItems?.includes(i)),...(c.addItems??[])]));
 // The retained salt has an announced, delayed material use, independent of animation.
 const saltShared=nodeId==='north_trace'&&state.items.includes('salt');
 if(saltShared){state.health=Math.min(10,state.health+2);state.items=state.items.filter(i=>i!=='salt');state.flags.push('salt_shared');}
 state.choices.push({node:nodeId,id:c.id,label:c.label,effect:c.effect+(saltShared?' 随后盐包登记入队里的粥，体力额外恢复2。':''),key:!!node.key});
 return {state,next:c.next};
}
export const CHAPTERS=[
 {number:'壹',title:'出发',subtitle:'门槛很高，路还很长。',date:'1934年10月',scene:'valley' as SceneId},
 {number:'贰',title:'湘江',subtitle:'有人没写完，等着你接下去。',date:'1934年11月底至12月初',scene:'river' as SceneId},
 {number:'叁',title:'遵义',subtitle:'不知道往哪走，也可以先问眼前。',date:'1935年1月',scene:'zunyi' as SceneId},
 {number:'肆',title:'雪山草地',subtitle:'东西在变少，人要相互撑住。',date:'1935年6月 → 8月',scene:'snow' as SceneId},
 {number:'伍',title:'会师',subtitle:'到达，不只有一双脚。',date:'1935年秋 · 尾声至1936年',scene:'dawn' as SceneId}
];
export const characters=[
 {name:'石头',age:'十六岁 / 你的视角',text:'通信员或炊事班帮手。文化不高，认路，胆小但倔强。想把人和信带到该到的地方，也想给母亲捎一次真平安。',col:0,id:'shitou' as ActorId},
 {name:'罗守田',age:'三十八岁 / 老班长',text:'少话、严厉，总要人复述交接。他也怕弟弟记住自己时，只剩别人替他添的大话。湘江后留下未写完的家书。',col:1,id:'leader' as ActorId},
 {name:'陈杏 · 阿姐',age:'二十四岁 / 卫生员',text:'手上做事，口中不许诺奇迹。她会记住谁少一块里布，也允许别人承认害怕；照护别人时同样需要帮手。',col:2,id:'medic' as ActorId},
 {name:'冬生',age:'十五岁 / 小号手',text:'爱说“开席”，盼着长高后放低号绳。他能替石头挡住催行的人，自己的病却慢慢重起来。留下号嘴和名字。',col:3,id:'bugler' as ActorId}
];
export const sources=[
 {title:'遵义会议和红军长征的胜利',publisher:'工业和信息化部 · 转载共产党员网，2021',url:'https://www.miit.gov.cn/ztzl/rdzt/dsxxjyzl/xxzl/art/2021/art_a43d76bc5e694806889c07fc36ec6adc.html',note:'核对1934年出发、湘江、1935年1月遵义会议、6月雪山、8月草地、10月到达陕北及1936年三大主力会师的时序。本作未复刻高层会议或真实个体对白。'},
 {title:'红四方面军战士周广才在长征途中吃剩的皮带',publisher:'中国国家博物馆，2021',url:'https://www.chnmuseum.cn/zp/zpml/gmww/202105/t20210531_250098.shtml',note:'用于了解极端缺粮与皮带这一历史记忆。真实文物关联红四方面军战士周广才；本作班长与其皮带另为虚构，不冒用文物故事。'},
 {title:'长征精神',publisher:'国家发展改革委，2021',url:'https://www.ndrc.gov.cn/fggz/fgjh/djzc/202104/t20210429_1278648_ext.html',note:'核对理想信念、实事求是、团结守纪、不畏艰险和依靠群众的主题内涵。无直接历史引语用于人物台词。'}
];
export const reviews=[
 {title:'从中央苏区出发',body:'1934年10月，中央红军开始长征。第一章压缩呈现普通战士的离家与工作分配。石头、母亲、罗守田、陈杏、冬生均为虚构人物，草鞋和母亲口信为原创情感线索，不能作为某位真实人物的经历引用。',reflection:'选通信或跟锅，不决定战略。穿鞋、捎话与担责，是一个孩子最初能理解的选择。'},
 {title:'湘江的代价',body:'1934年11月底至12月初的湘江战役使中央红军遭受重大损失。游戏浮桥、伤员交接、班长托信为合成情境创作，不对应某座确定浮桥或真实部队个案。班长固定牺牲，玩家只决定怎样接下承诺。',reflection:'半截皮带在本作属于虚构班长。历史上的真实皮带文物另有主人与部队，二者不能混同。'},
 {title:'遵义之后的路',body:'遵义会议于1935年1月15日至17日召开，是党的历史上生死攸关的转折点。石头没有进入会议，不知悉高层决策全貌。街巷、普通消息、檐下争论与辨认家书均为虚构，台词不是历史引语。',reflection:'不把“信任”写成知道一切。核实一条消息、说出害怕、尊重私人话语，都从角色当时能知道的事出发。'},
 {title:'雪山与草地不是一天',body:'中央红军于1935年6月翻越夹金山，北上右路军于8月过草地。本章以明确字幕跨越两个月份，不能理解为一座山后马上就是同一日的草地。冬生重病、号嘴、煮皮料、盐包、央金家交易均为虚构；不提供医疗或生存操作指引。',reflection:'央金有自己的孩子、粮食和同意的边界。她与红军之间的帮助包含沟通、交换、劳动与登记，不是无限取用。'},
 {title:'1935年的抵达，1936年的会师',body:'1935年10月19日，陕甘支队到达陕北吴起镇，中央红军主力长征胜利结束。1936年10月，红一、二、四方面军先后在会宁、将台堡地区会师。两者不是同一天同一地点。本章个人行程止于陕北，1936年会师通过共同历史尾声呈现。',reflection:'四种结局不改写会师。罗春生在另一支红军队伍中寻得，刘婶是陕北另一位群众；送达不等于突然返回苏区家乡。'}
];
export const endingDefinitions=[
 {id:'together',code:'A',title:'到灯下去',eyebrow:'到达陕北 · 信交到了人手里',text:'罗春生读到“阿弟”时停了一下，问他哥还说过什么。你把“别替我添大话”原样交代，没有替班长补落款。他抬手擦铜扣，你才发现，那只手同班长一样粗。你还活着，母亲要的平安终于可以往回捎。'},
 {id:'relay',code:'B',title:'替你走完',eyebrow:'石头牺牲 · 信与草鞋由战友带走',text:'伤痛已经被说清，陪行的人也没有走开。可你的身体还是在最后这程耗尽了。阿姐接过信，连草鞋和号嘴一同收好。后来罗春生问送信的人叫什么，她先说“石头”，又把母亲那句口信说了一遍。没有人替你改成一句从未说过的豪言。'},
 {id:'recovery',code:'C',title:'迟到的平安',eyebrow:'失散或寻人延误 · 归队后信终于送达',text:'接头错过，或者名字还得辗转打听，你比约定晚了些。罗春生把信捧平时，没有问为什么这么迟。他先让你坐下，听完那些不能写成一行的路。你重新找到了队伍，也懂得晚到的平安，仍然值得一字不漏地送出去。'},
 {id:'lamplight',code:'D',title:'借来的屋檐',eyebrow:'暂留群众家养伤 · 后来追队',text:'信随联络的人先走了。你留下换药、养伤，照登记的去向等待下一次联系。刘婶没有每天多出来的粮，你能动时便帮她做些力所能及的活。后来伤稳，你重新上路。离开前，你认真问了一遍她的名字，怕多年以后，只记得自己曾被一户人家救过。'}
];
export function getEnding(s:State){
 const id=has(s,'final_heal')?'lamplight':has(s,'final_carry')&&s.health<=2?'relay':has(s,'lost_trace')||(!has(s,'address_read')&&s.comrades<6)?'recovery':'together';
 return endingDefinitions.find(e=>e.id===id)!;
}
export function endingText(s:State){
 const end=getEnding(s);
 if(end.id==='recovery')return (has(s,'lost_trace')?'那次岔路等候后，接头改了地方。你辗转数日才归队，信因此晚了些。':'你没有拆信，帮着问路的人又有限。罗春生的去向一处处打听过来，信因此晚了些。')+'罗春生把纸捧平时，没有问为什么这么迟。他先让你坐下，听完那些不能写成一行的路。你重新找到了队伍，也懂得晚到的平安，仍值得一字不漏地送出去。';
 if(end.id==='together'&&has(s,'final_handoff'))return '接信的战友先走一步，后来带回罗春生的回话：“阿弟”两个字后，他读了很久。你把班长说过的话原样托过去，没有替他补落款。阿姐说，人和信都还在往前走。你还活着，母亲要的平安终于可以往回捎。';
 return end.text;
}
export function endingReflection(s:State){return [
 has(s,'shoes_used')?'你带走的是草鞋残底，护脚和捆信的绳已经换了用处。母亲那句“别怕鞋坏”终于落在一双还要走路的脚上。':'草鞋还在，或磨旧，或包得更仔细；它和脚上的伤一起留下来。母亲没有要求你用受苦证明想念。',
 has(s,'belt_boiled')?'半截皮带用尽了，铜扣没有丢。它提醒你记住班长如何活着，而不是证明自己守住了多少遗物。':'半截皮带继续束着行李。你也记得自己为留下它，曾分出最后的干粮。',
 has(s,'salt_traded')?'盐换成了经同意匀出的粮，空袋里留着央金补的布。你后来借刘婶的粮，先问她能匀多少。':'盐包后来登记交入队里的稀粥。央金家能匀多少、借条写多少，你一直记得。',
 has(s,'remember_words')?'记下的有“别替我添大话”和“开席”。他们怕过、盼过，也曾开过并不高明的玩笑。':'罗守田、冬生，名字写得很慢。你把认识的字交给纸，把不会写的交给阿姐，没让谁只剩一个数。',
 has(s,'horn_mended')?'号绳上还留着歪斜的针脚。冬生没等到再长高，你没有替他把这个愿望删掉。':has(s,'walked_with_bugler')?'你记得遵义的路口，一人认这边，一人记那边。后来你学着把两边都报清。':'号嘴留了下来。你记得冬生借过的肩，和他没有等到的那一顿饭。',
 s.faith>=6?'你继续走，不是因为再也不怕，而是有了可以说清的牵挂：把人照应好，把信交稳；不只让母亲，也让沿路的人能守着自己的灶火，听见平安的消息。':'你没有忽然懂得所有的事。路仍长，害怕仍在；但下一道弯找谁，谁需要扶一把，你开始肯问、肯答。',
 s.comrades>=6?'有些去向是同伴一起问来的，有些重量也换过肩。承诺因此有了不止一双手。':'你习惯自己扛着，后来才学着报出限度。没有被说出的难处，也在这封信迟来的回声里。',
 s.trust>=6?'你后来借过粮、接过信，总先报清数目与去向。你记得央金说过的界限，也记得刘婶锅里还有她家人的饭。':'后来再借粮、托信，你仍会停一下，问清人家的难处和自己该交代的事。路还没有把每一道题教完。',
 '共同的历史尾声：1935年10月中央红军主力到达陕北；1936年10月红军三大主力会师。个人的抵达方式不同，历史进程没有被选择改写。'
];}
export function informationOf(n:StoryNode,s:State){
 const info=[...(n.information??[])];
 if(n.id==='north_delivery')info.unshift(s.health<=2?'眼前可见：脚伤与衰弱已经很重。若坚持亲送（体力≤2），石头会在陪行途中牺牲；托付或养伤可避免这次额外消耗。':'眼前可见：伤痛尚能支撑最后一程，可以亲送，也可托付或留下恢复。');
 return info;
}

