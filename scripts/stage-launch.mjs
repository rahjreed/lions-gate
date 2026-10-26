// Run ONLY after explicit owner publication authorization. Never called by build/deploy.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {questions} from '../dist/questions.js';
import {digest,assertCurrentApprovals} from './editorial-core.mjs';
import {loadCandidates,loadLedger,atomicJson,withEditorialLock} from './editorial-store.mjs';
import {publicationBatch} from './question-batch.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
export async function checkLaunch(repo=root,live=questions){
 const plan=JSON.parse(await readFile(resolve(repo,'content/launch/release-plan.json'),'utf8')),batch=JSON.parse(await readFile(resolve(repo,'content/launch/reviewed-candidates.json'),'utf8')),sources=await loadCandidates(repo);
 if(plan.phase!=='prepared-only-awaiting-owner-release'||digest(batch)!==plan.reviewedDigest||digest(live)!==plan.liveDigest||sources.some(c=>digest(c.q)!==plan.candidateSources[c.q.id])||sources.length!==Object.keys(plan.candidateSources).length)throw Error('Stale launch package: re-audit changes before release.');
 const evidenceFiles=['content/launch/editorial-audit.json','content/launch/scripture-evidence.json','content/torah-everyday-life-50-validation.json'];
 if(JSON.stringify(Object.keys(plan.evidenceSources||{}).sort())!==JSON.stringify([...evidenceFiles].sort()))throw Error('Complete launch evidence bindings required.');
 for(const file of evidenceFiles)if(digest(JSON.parse(await readFile(resolve(repo,file),'utf8')))!==plan.evidenceSources[file])throw Error('Stale launch evidence: '+file);
 const selected=batch.map(q=>q.id),held=plan.quarantine.map(q=>q.id),deferred=(plan.deferredCandidates||[]).map(q=>q.id),classified=[...selected,...held,...deferred];
 if(plan.candidateCount!==sources.length||plan.existingLiveCount!==live.length||plan.preparedCount!==batch.length||plan.proposedTotal!==live.length+batch.length||classified.length!==sources.length||new Set(classified).size!==classified.length||classified.some(id=>!Object.hasOwn(plan.candidateSources,id))||digest(Object.keys(plan.decisions).sort())!==digest([...selected].sort())||plan.deferredCandidates.some(c=>c.sourceDigest!==plan.candidateSources[c.id]))throw Error('Inconsistent launch inventory classification.');
 if(batch.some(q=>plan.quarantine.some(r=>r.id===q.id)))throw Error('Quarantined question in launch bank.');
 assertCurrentApprovals(batch,sources,{decisions:plan.decisions},live);publicationBatch(live,batch);return {plan,batch};
}
export async function stageLaunch(repo=root,live=questions){return withEditorialLock(repo,async()=>{
 const {plan}=await checkLaunch(repo,live),ledger=await loadLedger(repo);
 for(const [id,d] of Object.entries(plan.decisions))if(ledger.decisions[id]&&digest(ledger.decisions[id])!==digest(d))throw Error('Existing editorial decision conflict; refusing overwrite: '+id);
 for(const [id,d] of Object.entries(plan.decisions))if(!ledger.decisions[id]){ledger.decisions[id]=d;ledger.events.push({id,...d,releaseStagedAt:new Date().toISOString(),releaseAuthorization:'Explicit operator release command; source review attributed to Codex, not owner.'});}
 await atomicJson(repo,'content/editorial/decisions.json',ledger);
 console.log('Staged audited decisions without publishing. Next authorized step: node scripts/question-batch.mjs publish content/launch/reviewed-candidates.json');
})}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.includes('--authorize-publication'))await stageLaunch();else{const {plan}=await checkLaunch();console.log(`READ ONLY: ${plan.candidateCount} candidates = ${plan.preparedCount} prepared + ${plan.quarantine.length} held + ${plan.deferredCandidates.length} deferred drafts. No approval/publication writes. --authorize-publication requires explicit owner release authorization.`);}
}
