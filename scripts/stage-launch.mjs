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
 if(process.argv.includes('--authorize-publication'))await stageLaunch();else{const {plan}=await checkLaunch();console.log(`READ ONLY: ${plan.preparedCount} additions ready, ${plan.quarantine.length} quarantined. No approval/publication writes. --authorize-publication requires explicit owner release authorization.`);}
}
