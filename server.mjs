import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'dist');
const port=Number(process.env.PORT||4179);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url||'/',`http://127.0.0.1:${port}`).pathname);const file=path.resolve(root,'.'+pathname);if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}let target=file;if((await stat(target).catch(()=>null))?.isDirectory())target=path.join(target,'index.html');const body=await readFile(target);res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':target.endsWith('index.html')?'no-cache':'public, max-age=3600'});res.end(body);}catch{res.writeHead(404);res.end('Not found');}});
server.on('error',e=>{console.error('Could not start local server:',e.message);process.exit(1);});server.listen(port,'127.0.0.1',()=>console.log(`Zhengtu Youguang is ready: http://127.0.0.1:${port}/\nPress Ctrl+C to stop.`));
