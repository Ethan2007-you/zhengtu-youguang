import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const out=path.join(root,'双击即玩');
const standalone=path.join(root,'..','征途有光-双击即玩版');
let html=await readFile(path.join(dist,'index.html'),'utf8');

function distFile(url){
 const target=path.resolve(dist,'.'+url.split(/[?#]/)[0]);
 if(!target.startsWith(dist+path.sep))throw new Error('Asset path escapes dist: '+url);
 return target;
}
const scripts=Array.from(html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi));
if(scripts.length!==1)throw new Error('Standalone packaging requires exactly one entry bundle.');
const code=await readFile(distFile(scripts[0][1]),'utf8');
// Refuse a future module/chunk split rather than silently ship a broken file page.
new Script('(()=>{"use strict";\n'+code+'\n})();',{filename:'standalone-entry.js'});
if(/\bimport\s*\(/.test(code))throw new Error('Dynamic chunks need explicit standalone packaging.');

const assets={};
const mime={'.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.avif':'image/avif','.woff2':'font/woff2','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
async function collect(dir){
 for(const item of await readdir(dir,{withFileTypes:true})){
  const file=path.join(dir,item.name);if(item.isDirectory()){await collect(file);continue;}
  const type=mime[path.extname(item.name).toLowerCase()];if(!type)continue;
  const key='/'+path.relative(dist,file).split(path.sep).join('/');
  assets[key]='data:'+type+';base64,'+(await readFile(file)).toString('base64');
 }
}
await collect(path.join(dist,'assets'));
const variables={};
const links=Array.from(html.matchAll(/<link\b[^>]*\bhref=["']([^"']+\.css(?:\?[^"']*)?)["'][^>]*>/gi));
let css='';
for(const link of links){
 css+='\n'+await readFile(distFile(link[1]),'utf8');html=html.replace(link[0],'');
}
css=css.replace(/url\(\s*(["']?)(\/assets\/[^\s)"']+)\1\s*\)/g,(_,q,url)=>{
 const key=url.split(/[?#]/)[0];if(!assets[key])throw new Error('CSS asset missing: '+key);
 const name=variables[key]??=('--zt-embedded-'+Object.keys(variables).length);
 return 'var('+name+')';
});
if(/url\(\s*["']?\//.test(css))throw new Error('An absolute CSS URL remains.');
html=html.replace(scripts[0][0],'');
html=html.replace('</head>','<style>'+css.replace(/<\/style/gi,'<\\/style')+'</style></head>');
const assetJson=JSON.stringify(assets).replace(/</g,'\\u003c');
const bootstrap='window.__ZHENGTU_ASSETS__=JSON.parse(document.getElementById("zt-embedded-assets").textContent);'+
 'for(const [file,name] of Object.entries('+JSON.stringify(variables)+'))document.documentElement.style.setProperty(name,\'url("\'+window.__ZHENGTU_ASSETS__[file]+\'")\');';
const inlineCode='(()=>{"use strict";\n'+code+'\n})();';
new Script(bootstrap+'\n'+inlineCode,{filename:'offline-index.js'});
html=html.replace('</body>','<script id="zt-embedded-assets" type="application/json">'+assetJson+'</script><script>'+bootstrap+'\n'+inlineCode.replace(/<\/script/gi,'<\\/script')+'</script></body>');
if(/<script\b[^>]*\bsrc=|<link\b[^>]*rel=["'](?:stylesheet|modulepreload)/i.test(html))throw new Error('External entry resource remains.');
const help='征途有光 · 双击即玩版\r\n\r\n双击 index.html，用 Edge 或 Chrome 打开即可。\r\n不需要 Node.js、CMD、本地服务器或安装依赖；游戏图片、人物、脚本和样式均在这个HTML中。\r\n可以把 index.html 单独复制到其他文件夹或U盘使用。史料链接需联网查看。\r\n\r\n进度保存在当前浏览器。文件版与原来的 localhost 版存档分开；移动或重命名HTML后，浏览器也可能把它视为另一个存档位置。\r\n若打开后看到代码，请右键该文件，选择“打开方式 → Microsoft Edge / Google Chrome”。\r\n\r\n本文件是打包成品；开发源码的 index.html 是Vite开发入口，两者用途不同。\r\n';
for(const directory of [out,standalone]){
 await mkdir(directory,{recursive:true});await writeFile(path.join(directory,'index.html'),html,'utf8');
 await writeFile(path.join(directory,'打开说明.txt'),help,'utf8');
}
console.log(JSON.stringify({file:path.join(standalone,'index.html'),bytes:Buffer.byteLength(html),embeddedAssets:Object.keys(assets).length,externalRuntimeFiles:0},null,2));
