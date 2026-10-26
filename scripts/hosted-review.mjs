import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadCandidates,loadLedger,safePath,withEditorialLock,atomicJson} from './editorial-store.mjs';
import {digest,approvalFor} from './editorial-core.mjs';
import {questions} from '../dist/questions.js';
import {validateQuestions} from '../dist/question-rules.js';
import {configuration,supabaseClient} from '../admin-review/server/supabase.mjs';
import {hostedSnapshot,verifyHostedApprovals} from './hosted-review-client.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
export async function prepareImport(repo=root,live=questions){
 const candidates=await loadCandidates(repo),ledger=await loadLedger(repo),records=[...live.map(q=>({q,batch:'live-reviewed',is_live:true})),...candidates.filter(c=>!live.some(q=>q.id===c.q.id)).map(c=>({...c,is_live:false}))];
 validateQuestions(records.map(c=>c.q),{allowCandidates:true});
 return {schemaVersion:1,allowNewVersions:false,sources:records.map(c=>({question_id:c.q.id,source_hash:digest(c.q),payload:JSON.stringify(c.q),batch:c.batch,is_live:c.is_live})),decisions:Object.entries(ledger.decisions).map(([id,d])=>({question_id:id,revision:d.revision,payload:JSON.stringify({...d,id})})),events:ledger.events.map(e=>({question_id:e.id,event_key:'local:'+digest(e),payload:JSON.stringify(e)})),coverage:await readFile(await safePath(repo,'content/curriculum-coverage.json'),'utf8')};
}
export async function adoptSnapshot(snapshot,repo=root,live=questions){
 // Never replace an existing local decision, even when the remote revision is newer.
 return withEditorialLock(repo,async()=>{
  const sources=await loadCandidates(repo),ledger=await loadLedger(repo),incoming=[];
  for(const row of snapshot.decisions){const d=JSON.parse(row.payload),source=sources.find(s=>s.q.id===row.question_id);if(!source||d.id!==row.question_id||d.sourceDigest!==digest(source.q))throw Error('Repository source mismatch; adoption blocked.');
   if(!d.hosted){const legacy={...d};if(!Object.hasOwn(ledger.decisions[d.id]??{},'id'))delete legacy.id;if(ledger.decisions[d.id]&&digest(legacy)===digest(ledger.decisions[d.id]))continue;throw Error('Imported legacy decision must match the original local ledger; restore/reconcile it explicitly.');}
   if(d.hosted.projectUrl!==snapshot.projectUrl)throw Error('Hosted decision project mismatch.');
   if(ledger.decisions[d.id]&&digest(ledger.decisions[d.id])!==digest(d))throw Error('Existing local decision conflict; refusing overwrite: '+d.id);
   if(d.action==='approve')approvalFor(source.q,d,[...live,...sources.filter(s=>s.q.id!==d.id).map(s=>s.q)]);
   incoming.push(d);
  }
  await verifyHostedApprovals(incoming.filter(d=>d.action==='approve'));
  for(const d of incoming)if(!ledger.decisions[d.id]){ledger.decisions[d.id]=d;ledger.events.push({id:d.id,...d,importOrigin:'hosted-snapshot'});}
  for(const e of snapshot.events)if(!ledger.events.some(l=>l.hostedEventKey===e.event_key))ledger.events.push({id:e.question_id,hostedEventKey:e.event_key,origin:e.origin,snapshot:JSON.parse(e.payload)});
  await atomicJson(repo,'content/editorial/decisions.json',ledger);
 });
}
async function main(){
 const [command,path,flag]=process.argv.slice(2);if(!path)throw Error('Usage: prepare new.json | import bundle.json --apply [--allow-new-versions] | pull new.json | adopt snapshot.json --apply');
 const target=await safePath(root,path);
 if(command==='prepare'){const bundle=await prepareImport();await writeFile(target,JSON.stringify(bundle,null,2)+'\n',{flag:'wx'});console.log(`Prepared ${bundle.sources.length} source records and ${bundle.decisions.length} existing decisions. No remote changes.`);return;}
 if(command==='pull'){const snapshot=await hostedSnapshot();await writeFile(target,JSON.stringify(snapshot,null,2)+'\n',{flag:'wx'});console.log('Downloaded review snapshot. Local decisions/publication unchanged.');return;}
 if(command==='import'){
  const bundle=JSON.parse(await readFile(target,'utf8'));const prepared=await prepareImport();
  if(digest({...bundle,allowNewVersions:false})!==digest(prepared))throw Error('Import bundle differs from current repository/ledger; prepare a new bundle.');
  if(flag!=='--apply'){console.log(`Dry run: ${bundle.sources.length} source records, ${bundle.decisions.length} decisions. Use --apply only after owner authorization.`);return;}
  bundle.allowNewVersions=process.argv.includes('--allow-new-versions');const db=supabaseClient(configuration());await db.request('/rest/v1/rpc/lg_review_import',{secret:true,method:'POST',body:{p_bundle:bundle}});console.log('Transactional import complete; existing decisions were not overwritten.');return;
 }
 if(command==='adopt'&&flag==='--apply'){await adoptSnapshot(JSON.parse(await readFile(target,'utf8')));console.log('Adopted non-conflicting hosted decisions. No questions published.');return;}
 throw Error('Unknown command or missing explicit --apply.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.message);process.exitCode=1});
