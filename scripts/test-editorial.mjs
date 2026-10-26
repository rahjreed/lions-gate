import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname,basename} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createReviewServer} from './review-server.mjs';
import {createStore,loadLedger,publishReviewed,safePath,withEditorialLock} from './editorial-store.mjs';
import {digest,approvedCopy,assertEvidence} from './editorial-core.mjs';
import {publicationBatch} from './question-batch.mjs';
import {qualityReport,editorialChecks} from './question-quality.mjs';
import {mappedDifficulty,calibrateForExport} from './difficulty-map.mjs';
import {questions} from '../dist/questions.js';
import {selectQuestions} from '../dist/engine.js';
import {knowledgeStage} from '../dist/knowledge.js';
import {get} from 'node:http';
const rawStatus=(url,headers)=>new Promise((resolve,reject)=>get(url,{headers},res=>{res.resume();res.on('end',()=>resolve(res.statusCode))}).on('error',reject));
const source=JSON.parse(await readFile(new URL('../content/candidates/initial-50.json',import.meta.url),'utf8'));
const existing=await readFile(new URL('../dist/published-questions.js',import.meta.url),'utf8');
const root=await mkdtemp(join(tmpdir(),'lions-gate-review-fixture-'));
let server;
try{
 await mkdir(join(root,'content/candidates'),{recursive:true});await mkdir(join(root,'dist'));
 const candidates=source.slice(0,2).map((q,i)=>({...structuredClone(q),id:`fixture-${i}`,q:`Isolated review fixture ${i}: select a response.`,knowledge:{...q.knowledge,concept:`fixture-${i}`}}));
 candidates[1].scripture.excerpt='[PENDING passage evidence]';
 await writeFile(join(root,'content/candidates/fixtures.json'),JSON.stringify(candidates));await writeFile(join(root,'dist/published-questions.js'),'export const publishedQuestions=[];\n');
 server=createReviewServer({root,live:[]});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${server.address().port}`;
 let response=await fetch(url);assert.equal(response.status,200);const cookie=response.headers.get('set-cookie').split(';')[0];assert.match(response.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);assert.match(response.headers.get('content-security-policy'),/frame-ancestors 'none'/);
 assert.equal((await fetch(url+'/api/state')).status,403);
 assert.equal((await fetch(url+'/api/state',{headers:{cookie,origin:'https://evil.example'}})).status,403);
 assert.equal(await rawStatus(url,{host:'evil.example'}),403);
 assert.equal(await rawStatus(url,{'sec-fetch-site':'cross-site'}),403);
 assert.equal((await fetch(url+'/api/publish',{headers:{cookie}})).status,404);
 assert.equal((await fetch(url+'/content/candidates/fixtures.json',{headers:{cookie}})).status,404);
 assert.equal((await fetch(url+'/api/decision',{method:'POST',headers:{cookie,'Content-Type':'application/json'},body:'{}'})).status,403);
 const request=body=>fetch(url+'/api/decision',{method:'POST',headers:{cookie,origin:url,'Content-Type':'application/json','X-Review-Request':'1'},body:JSON.stringify(body)});
 const state=await(await fetch(url+'/api/state',{headers:{cookie}})).json();assert.equal(state.records.length,2);assert.equal(state.records[0].status,'unreviewed');assert.equal(state.simpleLocalApproval,true);
 const checks=Object.fromEntries(editorialChecks.map(k=>[k,true]));
 const input=(i,action,revision=0)=>({id:candidates[i].id,sourceDigest:digest(candidates[i]),expectedRevision:revision,action,reviewer:'TEST FIXTURE ONLY',notes:'Isolated harness evidence; synthetic overlap accepted only for this test, never real editorial approval.',checks,optionRationales:['Fixture A','Fixture B','Fixture C','Fixture D'],resolvedWarnings:qualityReport([candidates[i]],candidates.filter((_,j)=>j!==i)).warnings,curriculumDifficulty:null});
 assert.equal((await request({...input(0,'approve'),checks:{}})).status,400,'Cannot approve without confirmations');
 assert.equal((await request(input(1,'approve'))).status,400,'Pending Scripture blocks approval');
 assert.equal((await request({...input(0,'approve'),sourceDigest:'stale'})).status,400);
 assert.equal((await request({...input(0,'approve'),id:'../published'})).status,400);
 assert.equal((await request(input(0,'revise'))).status,200);assert.equal((await request(input(0,'approve'))).status,400,'Stale revision rejected');
 let store=createStore(root,[]);await assert.rejects(store.export(),/No current approved/);
 assert.equal((await request({...input(0,'approve',1),notes:'',optionRationales:['','','',''],curriculumDifficulty:10})).status,200,'Local approval needs no written reasons');
 store=createStore(root,[]);const exported=await store.export();assert.equal(exported.length,1);assert.equal(exported[0].review.decision,'approved');
 assert.equal(exported[0].knowledge.complexity,7);assert.equal(exported[0].knowledge.editorialDifficulty,10);assert.equal(exported[0].difficulty,3);
 assert.equal(exported[0].review.reviewMode,'checklist-only-v1');assert.match(exported[0].review.rationale,/no written rationale supplied/);assert.ok(exported[0].review.optionRationales.every(r=>/no written rationale supplied/.test(r)));
 assert.equal((await loadLedger(root)).decisions['fixture-0'].notes,'','Never fabricate reviewer prose in the ledger');
 const changed=structuredClone(candidates);changed[0].q+=' changed draft';await writeFile(join(root,'content/candidates/fixtures.json'),JSON.stringify(changed));
 await assert.rejects(store.export(),/approval/,'Changed source invalidates approval');await writeFile(join(root,'content/candidates/fixtures.json'),JSON.stringify(candidates));
 const tampered=structuredClone(exported);tampered[0].explain+=' changed';await assert.rejects(publishReviewed(root,[],[],tampered));
 assert.equal((await request(input(0,'reject',2))).status,200);await assert.rejects(publishReviewed(root,[],[],exported),/approval/,'Rejected old export must fail');
 assert.equal((await readFile(join(root,'dist/published-questions.js'),'utf8')),'export const publishedQuestions=[];\n');
 assert.equal((await request(input(0,'approve',3))).status,200);const current=await store.export();
 await withEditorialLock(root,async()=>{await assert.rejects(store.save(input(0,'reject',4)),/write/)});
 await assert.rejects(publishReviewed(root,[],[],[...current,...current]),/Unique/);
 await publishReviewed(root,[],[],current);
 const published=(await import(pathToFileURL(join(root,'dist/published-questions.js')).href)).publishedQuestions;assert.deepEqual(published.map(q=>q.id),['fixture-0']);
 await assert.rejects(publishReviewed(root,published,published,current));
 const ledger=await loadLedger(root);assert.equal(ledger.events.length,4);assert.equal(ledger.decisions['fixture-0'].revision,4);
 const ledgerText=await readFile(join(root,'content/editorial/decisions.json'),'utf8');await writeFile(join(root,'content/editorial/decisions.json'),'{broken');await assert.rejects(loadLedger(root));await assert.rejects(store.save(input(0,'reject',4)));assert.equal(await readFile(join(root,'content/editorial/decisions.json'),'utf8'),'{broken','Corrupt ledger must not be replaced');await writeFile(join(root,'content/editorial/decisions.json'),ledgerText);
 await assert.rejects(safePath(root,'../escape.json'),/outside/);
 assert.equal(JSON.parse(await readFile(join(root,'content/candidates/fixtures.json'),'utf8'))[0].review.status,'candidate','Source candidate is never rewritten');
 // Mapping is opt-in and does not silently reinterpret legacy source ratings.
 for(const q of source)assert.deepEqual(calibrateForExport(q,null),q);
 let prior=0;for(let n=1;n<=10;n++){const m=mappedDifficulty(n);assert.ok(m.complexity>=prior&&m.complexity<=7);assert.ok([1,2,3].includes(m.difficulty));prior=m.complexity}
 for(const n of [0,11,2.5,'8'])assert.throws(()=>mappedDifficulty(n));
 assert.deepEqual(mappedDifficulty(8),{complexity:6,difficulty:3});assert.deepEqual(mappedDifficulty(10),{complexity:7,difficulty:3});
 for(const marker of ['', '[PENDING]', 'Missing evidence', 'Quotation not yet checked', 'TODO passage']){const q=structuredClone(source[0]);q.supportingScriptures=[{...q.scripture,excerpt:marker}];assert.throws(()=>assertEvidence(q));}
 const evidence={reviewedBy:'TEST ONLY',reviewedOn:'2026-10-25',rationale:'Synthetic test',checks,optionRationales:['A','B','C','D'],resolvedWarnings:[]};
 // Related records acknowledge their own directional warnings, not reverse pair strings.
 const related=source.slice(0,2).map((q,i)=>({...structuredClone(q),id:`related-fixture-${i}`,q:`Related fixture ${i}: select a response.`,knowledge:{...q.knowledge,concept:'shared-test-concept'}}));
 const approvedRelated=related.map(q=>approvedCopy(q,{...evidence,resolvedWarnings:qualityReport([q],related.filter(p=>p!==q)).warnings}));
 assert.equal(publicationBatch([],approvedRelated).length,2);
 assert.throws(()=>publicationBatch([],related));
 assert.throws(()=>publicationBatch([],[{...approvedRelated[0],review:{...approvedRelated[0].review,decision:'rejected'}}]));
 assert.equal(calibrateForExport(source[0],10).knowledge.difficultyMapping,'editorial-1-10-v1');
 const bank=Array.from({length:140},(_,i)=>{const q=structuredClone(source[0]);q.id=`mapping-fixture-${i}`;q.q=`Mapping harness item ${i}: select a response.`;q.knowledge.complexity=i%7+1;return approvedCopy(q,evidence)});
 const byId=new Map(bank.map(q=>[q.id,q]));
 for(const level of [1,76,151,226,301,376,451,525]){const selected=selectQuestions(bank,{level,history:{}},()=>.4);assert.equal(selected.length,10);assert.ok(selected.every(e=>byId.get(e.id).knowledge.complexity<=Math.ceil(knowledgeStage(level).target)))}
 const master=selectQuestions(bank,{level:525,history:{}},()=>.4);assert.ok(master.some(e=>byId.get(e.id).knowledge.complexity===7));
 for(const [complexity,firstLevel] of [[6,351],[7,438]]){assert.ok(Math.ceil(knowledgeStage(firstLevel-1).target)<complexity);assert.equal(Math.ceil(knowledgeStage(firstLevel).target),complexity);}
 assert.equal(await readFile(new URL('../dist/published-questions.js',import.meta.url),'utf8'),existing,'Real live module untouched');
 console.log('PASS editorial: isolated fixture only; localhost/cookie/Host/Origin/CSRF protections; persistent revise/approve/reject; seven confirmations; pending evidence; stale revisions/exports; duplicate publication; process lock; atomic file publication of explicitly approved fixture only; real candidates untouched; opt-in 1–10 mapping and unchanged stage selection.');
}finally{
 if(server)await new Promise(resolve=>server.close(resolve));
 const actual=await realpath(root),base=await realpath(tmpdir());assert.equal(dirname(actual),base);assert.ok(basename(actual).startsWith('lions-gate-review-fixture-'));await rm(actual,{recursive:true,force:true});
}
