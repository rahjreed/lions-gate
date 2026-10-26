// Read-only loopback preview of the actual static production files.
import http from 'node:http';
import {readFile,stat,realpath} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=await realpath(process.argv[2]||fileURLToPath(new URL('../dist',import.meta.url))),port=Number(process.env.PREVIEW_PORT||4340);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{try{if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end()}
 const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));let file=await realpath((await stat(path)).isDirectory()?resolve(path,'index.html'):path);if(relative(root,file).startsWith('..'))throw Error('Outside preview');
 res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:await readFile(file));
}catch{res.writeHead(404);res.end('Not found')}}).listen(port,'127.0.0.1',()=>console.log(`Production files: ${root}\nhttp://127.0.0.1:${port}/`));
