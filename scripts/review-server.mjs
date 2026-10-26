import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {questions} from '../dist/questions.js';
import {createStore,loadCandidates,loadLedger,safePath} from './editorial-store.mjs';
import {digest,referenceKey,reviewProjection,assertEvidence} from './editorial-core.mjs';
import {qualityReport,editorialChecks} from './question-quality.mjs';
import {mappedDifficulty} from './difficulty-map.mjs';
const ui=new URL('../tools/question-review/',import.meta.url);
export function createReviewServer({root=fileURLToPath(new URL('../',import.meta.url)),live=questions}={}){
 const session=randomBytes(32).toString('hex'),store=createStore(root,live);
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'none'; base-uri 'none'");
  const origin=`http://127.0.0.1:${server.address().port}`;
  const send=(status,data,type='application/json')=>{res.writeHead(status,{'Content-Type':type+'; charset=utf-8'});res.end(type==='application/json'?JSON.stringify(data):data)};
  try{
   if(req.headers.host!==`127.0.0.1:${server.address().port}`)return send(403,{error:'Untrusted Host.'});
   if(req.headers['sec-fetch-site']&& !['same-origin','none'].includes(req.headers['sec-fetch-site']))return send(403,{error:'Cross-site access denied.'});
   if(req.headers.origin&&req.headers.origin!==origin)return send(403,{error:'Untrusted Origin.'});
   const routes={'/':'index.html','/review.js':'review.js','/review.css':'review.css'};
   if(req.method==='GET'&&routes[req.url]){
    if(req.url==='/')res.setHeader('Set-Cookie',`review_session=${session}; HttpOnly; SameSite=Strict; Path=/`);
    const type=req.url.endsWith('.js')?'text/javascript':req.url.endsWith('.css')?'text/css':'text/html';return send(200,await readFile(new URL(routes[req.url],ui),'utf8'),type);
   }
   const cookie=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('review_session='))?.slice(15)||'';
   if(cookie.length!==session.length||!timingSafeEqual(Buffer.from(cookie),Buffer.from(session)))return send(403,{error:'Open the local review page first.'});
   if(req.method==='GET'&&req.url==='/api/state'){
    const candidates=await loadCandidates(root),ledger=await loadLedger(root),publishedIds=new Set(live.map(q=>q.id));
    let coverage=null;try{coverage=JSON.parse(await readFile(await safePath(root,'content/curriculum-coverage.json'),'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
    const all=[...live,...candidates.filter(c=>!publishedIds.has(c.q.id)).map(c=>c.q)];
    const records=candidates.map(c=>{
     const decision=ledger.decisions[c.q.id],peers=all.filter(q=>q.id!==c.q.id),report=qualityReport([c.q],peers),sourceDigest=digest(c.q);
     let evidenceError='';try{assertEvidence(reviewProjection(c.q,decision??{}))}catch(e){evidenceError=e.message}
     return {...c,sourceDigest,revision:decision?.revision??0,decision,status:publishedIds.has(c.q.id)?'published':decision&&decision.sourceDigest!==sourceDigest?'stale':decision?.action??'unreviewed',warnings:report.warnings,errors:report.errors,evidenceError};
    });
    return send(200,{records,simpleLocalApproval:true,checks:editorialChecks,difficultyMapping:Array.from({length:10},(_,i)=>({rating:i+1,...mappedDifficulty(i+1)})),liveCount:live.length,coverage:coverage?{summary:coverage.summary,categories:coverage.categories,topics:coverage.categories.map(category=>({id:category.id,name:category.name,live:coverage.questionInventory.filter(q=>q.publicationState==='live-reviewed'&&q.curriculumCategories.includes(category.id)).length,candidates:coverage.questionInventory.filter(q=>q.publicationState==='candidate-not-live'&&q.curriculumCategories.includes(category.id)).length})),limitations:coverage.limitations}:null});
   }
   if(req.method==='POST'&&req.url==='/api/decision'){
    if(req.headers.origin!==origin||req.headers['x-review-request']!=='1'||req.headers['content-type']!=='application/json')return send(403,{error:'Same-origin JSON request required.'});
    let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>128*1024)return send(413,{error:'Request too large.'})}
    const input=JSON.parse(text);return send(200,{decision:await store.save(input)});
   }
   return send(404,{error:'Not found. No publishing or general file-writing endpoint exists.'});
  }catch(e){return send(400,{error:e.message})}
 });
 return server;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.env.NODE_ENV==='production')throw Error('The review server is development-only; do not run it in production.');
 const port=Number(process.env.REVIEW_PORT||4310);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Use REVIEW_PORT 1024–65535.');
 const server=createReviewServer();server.on('error',e=>{console.error(e.message);process.exitCode=1});server.listen(port,'127.0.0.1',()=>console.log(`Local review only: http://127.0.0.1:${port}\nNo decisions are saved until an explicit action. Ctrl+C stops the server.`));
}
