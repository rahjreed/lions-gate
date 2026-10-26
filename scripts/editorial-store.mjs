import {readFile,writeFile,mkdir,rename,lstat,realpath,readdir,open,unlink} from 'node:fs/promises';
import {resolve,dirname,relative,isAbsolute,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {digest,approvalFor,assertCurrentApprovals} from './editorial-core.mjs';
import {validateQuestions} from '../dist/question-rules.js';
import {verifyHostedApprovals} from './hosted-review-client.mjs';
export async function safePath(root,path){
 const base=await realpath(root),target=resolve(base,path),rel=relative(base,target);
 if(rel.startsWith('..')||isAbsolute(rel))throw Error('Path outside repository.');
 let current=base;for(const part of rel.split(/[\\/]/)){current=join(current,part);const stat=await lstat(current).catch(e=>{if(e.code==='ENOENT')return null;throw e});if(stat?.isSymbolicLink())throw Error('Symlink/junction paths are not allowed.');}
 return target;
}
export async function atomicJson(root,path,value){
 const target=await safePath(root,path);await mkdir(dirname(target),{recursive:true});await safePath(root,path);
 const temp=target+'.'+randomUUID()+'.tmp';
 try{const file=await open(temp,'wx');try{await file.writeFile(JSON.stringify(value,null,2)+'\n');await file.sync()}finally{await file.close()}await rename(temp,target)}finally{await unlink(temp).catch(e=>{if(e.code!=='ENOENT')throw e})}
}
export async function loadCandidates(root){
 const dir=await safePath(root,'content/candidates'),result=[];
 for(const file of (await readdir(dir)).filter(f=>f.endsWith('.json')).sort()){
  const data=JSON.parse(await readFile(await safePath(root,'content/candidates/'+file),'utf8'));
  if(!Array.isArray(data))throw Error('Candidate batch must be an array.');
  for(const q of data){if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(q.id)||['constructor','prototype'].includes(q.id))throw Error('Unsafe candidate id.');if(result.some(c=>c.q.id===q.id))throw Error('Duplicate candidate id: '+q.id);result.push({batch:file,q});}
 }return result;
}
export async function loadLedger(root){
 const file=await safePath(root,'content/editorial/decisions.json');
 try{const data=JSON.parse(await readFile(file,'utf8'));if(data.schemaVersion!==1||!data.decisions||!Array.isArray(data.events))throw Error('Invalid decision ledger; refusing to overwrite it.');return data}catch(e){if(e.code==='ENOENT')return {schemaVersion:1,decisions:{},events:[]};throw e}
}
export async function withEditorialLock(root,work){
 const lock=await safePath(root,'content/editorial/write.lock');await mkdir(dirname(lock),{recursive:true});await safePath(root,'content/editorial/write.lock');
 let handle;try{handle=await open(lock,'wx')}catch(e){if(e.code==='EEXIST')throw Error('Another editorial write is active (or a stale write.lock needs inspection).');throw e}
 try{await handle.writeFile(JSON.stringify({pid:process.pid,started:new Date().toISOString()}));return await work()}finally{await handle.close();await unlink(lock)}
}
export function createStore(root,live){
 let queue=Promise.resolve();const locked=fn=>{const work=queue.then(()=>withEditorialLock(root,fn));queue=work.catch(()=>{});return work};
 return {save:input=>locked(async()=>{
  const candidates=await loadCandidates(root),source=candidates.find(c=>c.q.id===input.id);if(!source)throw Error('Unknown question id.');
  if(live.some(q=>q.id===input.id))throw Error('Already live: edit publication requires a separate workflow.');
  if(!['approve','revise','reject'].includes(input.action)||typeof input.reviewer!=='string'||!input.reviewer.trim()||typeof input.notes!=='string'||input.action!=='approve'&&!input.notes.trim())throw Error('Reviewer and decision required; revision/rejection needs a note.');
  if(input.optionRationales!==undefined&&(!Array.isArray(input.optionRationales)||input.optionRationales.length!==4||input.optionRationales.some(v=>typeof v!=='string')))throw Error('Optional choice notes must be four text values.');
  const ledger=await loadLedger(root),previous=ledger.decisions[input.id];
  if(input.sourceDigest!==digest(source.q)||input.expectedRevision!==(previous?.revision??0))throw Error('Stale review: reload before saving.');
  const decision={action:input.action,reviewer:input.reviewer.trim(),notes:input.notes.trim(),sourceDigest:input.sourceDigest,revision:(previous?.revision??0)+1,savedAt:new Date().toISOString(),checks:input.checks??{},optionRationales:input.optionRationales??[],resolvedWarnings:input.resolvedWarnings??[],citations:input.citations,curriculumDifficulty:input.curriculumDifficulty??null};
  if(input.action==='approve')decision.reviewMode='checklist-only-v1';
  if(decision.action==='approve')approvalFor(source.q,decision,[...live,...candidates.filter(c=>c.q.id!==input.id&&!live.some(l=>l.id===c.q.id)).map(c=>c.q)]);
  ledger.decisions[input.id]=decision;ledger.events.push({id:input.id,...decision});await atomicJson(root,'content/editorial/decisions.json',ledger);return decision;
 }),export:()=>locked(async()=>{
  const candidates=await loadCandidates(root),ledger=await loadLedger(root),batch=[];
  for(const c of candidates)if(ledger.decisions[c.q.id]?.action==='approve'&&!live.some(q=>q.id===c.q.id))batch.push(approvalFor(c.q,ledger.decisions[c.q.id],[...live,...candidates.filter(p=>p.q.id!==c.q.id&&!live.some(l=>l.id===p.q.id)).map(p=>p.q)]));
  if(!batch.length)throw Error('No current approved questions to export.');return batch;
 })};
}
export async function publishReviewed(root,live,published,batch){return withEditorialLock(root,async()=>{
 validateQuestions([...live,...batch]);
 const ledger=await loadLedger(root),candidates=await loadCandidates(root);assertCurrentApprovals(batch,candidates,ledger,live);
 // Caller also performs schema/duplicate/warning validation before invoking this writer.
 const file=await safePath(root,'dist/published-questions.js'),previous=await readFile(file,'utf8');
 const match=previous.match(/export const publishedQuestions\s*=([\s\S]*);\s*$/);if(!match||digest(JSON.parse(match[1]))!==digest(published))throw Error('Published bank changed; restart the command to reload it.');
 const backup=await safePath(root,`content/reviewed/published-${randomUUID()}.js.backup`);await mkdir(dirname(backup),{recursive:true});await writeFile(backup,previous,{flag:'wx'});
 const next=`// Explicitly approved published additions.\nexport const publishedQuestions=${JSON.stringify([...published,...batch],null,2)};\n`;
 const temp=file+'.'+randomUUID()+'.tmp';try{await writeFile(temp,next,{flag:'wx'});const currentLedger=await loadLedger(root);assertCurrentApprovals(batch,await loadCandidates(root),currentLedger,live);await verifyHostedApprovals(batch.map(q=>currentLedger.decisions[q.id]));await rename(temp,file)}finally{await unlink(temp).catch(e=>{if(e.code!=='ENOENT')throw e})}
})}
