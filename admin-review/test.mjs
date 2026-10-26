import assert from 'node:assert/strict';
import {readFile,readdir,mkdtemp,mkdir,writeFile,rm,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname,basename} from 'node:path';
import {Readable} from 'node:stream';
import {spawnSync} from 'node:child_process';
import {createHandler} from './server/handler.mjs';
import {fixtureBackend} from './fixtures.mjs';
import {makeDecision,viewState} from './server/model.mjs';
import {digest} from './generated/scripts/editorial-core.mjs';
import {qualityReport,editorialChecks} from './generated/scripts/question-quality.mjs';
import {verifyHostedApprovals} from '../scripts/hosted-review-client.mjs';
import {prepareImport,adoptSnapshot} from '../scripts/hosted-review.mjs';
const original=await readFile(new URL('../dist/published-questions.js',import.meta.url),'utf8');
const backend=await fixtureBackend(),env={REVIEW_ORIGIN:'https://questions.lionsgate.callistadigital.com',SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_PUBLISHABLE_KEY:'fixture-public',SUPABASE_SECRET_KEY:'fixture-secret',REVIEW_ACCESS_TOKEN:'fixture-admin'};
const handler=createHandler({env,fetcher:backend.fetcher});
async function call(path,{method='GET',cookie,body,headers={}}={}){
 const req=Readable.from(body===undefined?[]:[JSON.stringify(body)]);req.url='/api/'+path;req.method=method;req.headers={host:'questions.lionsgate.callistadigital.com',...(cookie?{cookie}:{}),...(method==='POST'?{origin:env.REVIEW_ORIGIN,'content-type':'application/json','x-review-request':'1'}:{}),...headers};
 let text='';const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v},end(s){text=s}};await handler(req,res);return {...res,data:JSON.parse(text)};
}
const admin='__Host-lg_access=fixture-admin',ordinary='__Host-lg_access=fixture-ordinary';
assert.equal((await call('state')).statusCode,401);assert.ok(!backend.calls.some(c=>c.secret));
assert.equal((await call('state',{cookie:ordinary})).statusCode,403);assert.ok(!backend.calls.some(c=>c.secret));
assert.equal((await call('state',{cookie:admin,headers:{host:'evil.test'}})).statusCode,403);
assert.equal((await call('state',{cookie:admin,headers:{'sec-fetch-site':'cross-site'}})).statusCode,403);
assert.equal((await call('decision',{method:'POST',cookie:admin,body:{},headers:{origin:'https://evil.test'}})).statusCode,403);
assert.equal((await call('decision',{method:'POST',cookie:admin,body:{},headers:{'x-review-request':''}})).statusCode,403);
assert.equal((await call('decision',{method:'POST',cookie:ordinary,body:{}})).statusCode,403);
assert.equal((await call('decision',{method:'POST',cookie:admin,body:{notes:'x'.repeat(140000)}})).statusCode,413);
assert.equal((await call('state',{method:'POST',cookie:admin,body:{}})).statusCode,405);
for(const action of ['publish','export','import','execute','file'])assert.equal((await call(action,{cookie:admin})).statusCode,404);
assert.equal((await call('login',{method:'POST',body:{email:'editor@example.test',password:'bad'}})).statusCode,401);
const login=await call('login',{method:'POST',body:{email:'editor@example.test',password:'fixture-password'}});assert.equal(login.statusCode,200);assert.ok(login.headers['set-cookie'].every(c=>/HttpOnly; Secure; SameSite=Strict; Path=\//.test(c)));assert.ok(!JSON.stringify(login.data).includes('fixture-admin'));
const state=await call('state',{cookie:admin});assert.equal(state.statusCode,200);assert.equal(state.data.records.length,100);assert.equal(state.data.liveCount,42);assert.equal(state.data.checks.length,7);
// All writes use a renamed synthetic fixture, never a real candidate ID/ledger/cloud.
const row=backend.snapshot.sources[0],q=JSON.parse(row.payload);q.id='hosted-test-fixture';q.q='Isolated hosted test: select the fixture response.';row.question_id=q.id;row.payload=JSON.stringify(q);row.source_hash=digest(q);
const input={id:q.id,action:'approve',notes:'Synthetic fixture review only.',expectedRevision:0,sourceDigest:row.source_hash,citations:[q.scripture,...(q.supportingScriptures||[])].map(s=>({key:`${s.book} ${s.chapter}:${s.verse}${s.endVerse?'-'+s.endVerse:''}`,excerpt:s.excerpt})),checks:Object.fromEntries(editorialChecks.map(k=>[k,true])),optionRationales:['Fixture A','Fixture B','Fixture C','Fixture D'],resolvedWarnings:qualityReport([q],backend.snapshot.sources.filter(s=>s!==row).map(s=>JSON.parse(s.payload))).warnings};
assert.equal((await call('decision',{method:'POST',cookie:admin,body:{...input,checks:{}}})).statusCode,400);
assert.equal((await call('decision',{method:'POST',cookie:admin,body:{...input,citations:input.citations.map(c=>({...c,excerpt:'[PENDING evidence]'}))}})).statusCode,400);
assert.equal((await call('decision',{method:'POST',cookie:admin,body:{...input,sourceDigest:'stale'}})).statusCode,409);
assert.equal((await call('decision',{method:'POST',cookie:admin,body:{...input,curriculumDifficulty:10}})).statusCode,200);
let decision=JSON.parse(backend.snapshot.decisions[0].payload);assert.equal(decision.reviewer,backend.user.email);assert.equal(decision.hosted.actorId,backend.user.id);
await verifyHostedApprovals([decision],{env,fetcher:backend.fetcher});
assert.equal((await call('decision',{method:'POST',cookie:admin,body:input})).statusCode,409);
assert.equal((await call('decision',{method:'POST',cookie:admin,body:{...input,action:'reject',expectedRevision:1}})).statusCode,200);
await assert.rejects(verifyHostedApprovals([decision],{env,fetcher:backend.fetcher}),/stale/);
assert.equal(viewState(backend.snapshot).history.length,2);assert.equal(viewState(backend.snapshot).records[0].status,'reject');
const concurrent=await Promise.all(['revise','reject'].map(action=>call('decision',{method:'POST',cookie:admin,body:{...input,action,expectedRevision:2}})));assert.deepEqual(concurrent.map(r=>r.statusCode).sort(),[200,409]);
const freshHandler=createHandler({env,fetcher:backend.fetcher});assert.ok(freshHandler);assert.equal(viewState(backend.snapshot).records[0].revision,3,'State is in transport storage, not a server instance');
backend.setEnabled(false);assert.equal((await call('state',{cookie:admin})).statusCode,403);assert.equal((await call('refresh',{method:'POST',cookie:'__Host-lg_refresh=fixture-refresh',body:{}})).statusCode,401);backend.setEnabled(true);
const before=row.payload;row.payload=JSON.stringify({...q,explain:q.explain+' altered fixture'});assert.throws(()=>viewState(backend.snapshot),/integrity/);row.payload=before;
const bundle=await prepareImport();assert.equal(bundle.sources.length,142);assert.equal(bundle.sources.filter(s=>!s.is_live).length,100);assert.equal(bundle.decisions.length,0);assert.equal(bundle.allowNewVersions,false);
const temp=await mkdtemp(join(tmpdir(),'lions-gate-hosted-fixture-'));
try{
 await mkdir(join(temp,'content/candidates'),{recursive:true});await mkdir(join(temp,'content/editorial'));
 await writeFile(join(temp,'content/candidates/test.json'),JSON.stringify([q]));
 const rejected=JSON.parse(backend.snapshot.decisions[0].payload),snapshot={...backend.snapshot,projectUrl:env.SUPABASE_URL,events:[]};
 await adoptSnapshot(snapshot,temp,[]);const first=await readFile(join(temp,'content/editorial/decisions.json'),'utf8');assert.ok(['revise','reject'].includes(JSON.parse(first).decisions[q.id].action));
 snapshot.decisions=[{question_id:q.id,revision:4,payload:JSON.stringify({...rejected,notes:'Conflicting later decision',revision:4})}];await assert.rejects(adoptSnapshot(snapshot,temp,[]),/refusing overwrite/);assert.equal(await readFile(join(temp,'content/editorial/decisions.json'),'utf8'),first);
 // Import preparation retains existing local decisions and complete historical events.
 await writeFile(join(temp,'content/curriculum-coverage.json'),bundle.coverage);const preserved=await prepareImport(temp,[]);assert.equal(preserved.decisions.length,1);assert.equal(preserved.events.length,1);
}finally{const actual=await realpath(temp);assert.equal(dirname(actual),await realpath(tmpdir()));assert.ok(basename(actual).startsWith('lions-gate-hosted-fixture-'));await rm(actual,{recursive:true,force:true});}
const sql=await readFile(new URL('./sql/setup.sql',import.meta.url),'utf8');assert.ok(!/security\s+definer/i.test(sql));for(const fn of ['lg_review_snapshot(uuid)','lg_review_save(uuid,text,text,integer,text)','lg_review_import(jsonb)'])assert.ok(sql.includes('revoke all on function public.'+fn+' from public,anon,authenticated'));
assert.match(sql,/Existing editorial decision conflict; refusing overwrite/);assert.match(sql,/for update/);assert.match(sql,/Seven explicit confirmations required/);assert.match(sql,/Evidence required for all citations/);assert.match(sql,/enable row level security/);
for(const f of await readdir(new URL('./public/',import.meta.url))){assert.ok(['index.html','review.js','review.css','session.js'].includes(f));const text=await readFile(new URL('./public/'+f,import.meta.url),'utf8');assert.ok(!/SUPABASE_SECRET|service_role|fixture-admin|fixture-password|"source_hash"|"kr-101"/.test(text));if(f.endsWith('.js'))assert.equal(spawnSync(process.execPath,['--check',new URL('./public/'+f,import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')]).status,0)}
assert.equal(await readFile(new URL('../dist/published-questions.js',import.meta.url),'utf8'),original);
console.log('PASS hosted portal: mocked Auth/admin authorization, cookie/CSRF/isolation, 100 candidates + 42 live, synthetic approval/rejection, evidence/checklist, stale revisions, remote revocation, source integrity, import preservation, public bundle isolation. SQL policies inspected statically only; live Auth/Postgres/RLS/Vercel require dedicated staging verification.');
