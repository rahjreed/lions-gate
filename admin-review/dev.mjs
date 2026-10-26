import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {createHandler} from './server/handler.mjs';
import {fixtureBackend} from './fixtures.mjs';
if(process.env.NODE_ENV==='production'||!process.argv.includes('--fixture'))throw Error('Local fixture preview only: node dev.mjs --fixture. No real credentials/data writes.');
const backend=await fixtureBackend(),port=4320;
const handler=createHandler({env:{REVIEW_ORIGIN:`http://127.0.0.1:${port}`,SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_PUBLISHABLE_KEY:'fixture-public',SUPABASE_SECRET_KEY:'fixture-secret'},fetcher:backend.fetcher,localFixture:true});
http.createServer(async(req,res)=>{if(req.url.startsWith('/api/'))return handler(req,res);const paths={'/':'index.html','/review.js':'review.js','/session.js':'session.js','/review.css':'review.css'};if(!paths[req.url]){res.writeHead(404);return res.end()}
 res.setHeader('Content-Type',req.url.endsWith('.js')?'text/javascript':req.url.endsWith('.css')?'text/css':'text/html');res.setHeader('Cache-Control','no-store');res.end(await readFile(new URL('./public/'+paths[req.url],import.meta.url)));
}).listen(port,'127.0.0.1',()=>console.log(`FIXTURE ONLY http://127.0.0.1:${port}/ — editor@example.test / fixture-password. Decisions exist in memory only; no cloud calls.`));
