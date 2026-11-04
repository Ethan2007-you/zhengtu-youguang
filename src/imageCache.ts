const loaded=new Map<string,Promise<void>>();
export function decodeImage(src:string):Promise<void>{
 const cached=loaded.get(src);if(cached)return cached;
 const promise=new Promise<void>((resolve,reject)=>{
  const im=new Image();im.onload=()=>im.decode().catch(()=>{}).then(()=>resolve());
  im.onerror=()=>{loaded.delete(src);reject(new Error('人物画面未能载入'));};im.src=src;
 });loaded.set(src,promise);return promise;
}
