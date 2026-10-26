import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {contentFingerprint,validateQuestions} from '../dist/question-rules.js';
import {questions} from '../dist/questions.js';
import {publishedQuestions} from '../dist/published-questions.js';
import {qualityReport,editorialChecks} from './question-quality.mjs';
import {approvedCopy,assertEvidence} from './editorial-core.mjs';
import {publishReviewed} from './editorial-store.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=async path=>JSON.parse(await readFile(path,'utf8'));
export function reviewBatch(batch,evidence){
 validateQuestions(batch,{allowCandidates:true});
 return batch.map(q=>{
  const e=evidence[q.id];if(!e)return q;
  if(!e.reviewedBy?.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(e.reviewedOn)||!e.rationale?.trim()||!editorialChecks.every(k=>e.checks?.[k]===true)||!Array.isArray(e.optionRationales)||e.optionRationales.length!==4||e.optionRationales.some(s=>typeof s!=='string'||!s.trim())||!Array.isArray(e.resolvedWarnings))throw Error(`${q.id}: incomplete human review evidence`);
  const approved=approvedCopy(q,e);
  validateQuestions([approved]);return approved;
 });
}
export function publicationBatch(live,batch){
 validateQuestions(batch);if(batch.some(q=>!q.knowledge))throw Error('New publication requires knowledge metadata.');
 for(const q of batch){assertEvidence(q);if(q.review.decision!=='approved')throw Error('Explicit approval decision required.');}
 const report=qualityReport(batch,live);if(report.errors.length)throw Error(report.errors.join('\n'));
 for(const q of batch){const warnings=report.warnings.filter(w=>w.startsWith(q.id+':')||w.startsWith(q.id+' / '));if(warnings.some(w=>!q.review.resolvedWarnings?.includes(w)))throw Error(`${q.id}: editorial warnings need explicit resolution in review.resolvedWarnings`)}
 validateQuestions([...live,...batch]);return batch;
}
async function main(){
 const [command,input,extra,output]=process.argv.slice(2);
 if(!input||!['import','validate','template','review','publish'].includes(command))throw Error('Usage: question-batch.mjs import input.json name | validate batch.json | template batch.json evidence.json | publish reviewed.json. For review use scripts/review-server.mjs.');
 const batch=await read(resolve(input));
 if(command==='validate'){const report=qualityReport(batch,questions);console.log(JSON.stringify(report,null,2));if(report.errors.length)process.exitCode=1;return}
 if(command==='import'){
  if(!/^[a-z0-9-]+$/.test(extra||''))throw Error('Safe batch name required.');
  const drafts=batch.map(q=>({...q,review:{status:'candidate'}})),report=qualityReport(drafts,questions);if(report.errors.length)throw Error(report.errors.join('\n'));
  const target=resolve(root,'content/candidates',`${extra}.json`);await mkdir(dirname(target),{recursive:true});await writeFile(target,JSON.stringify(drafts,null,2)+'\n',{flag:'wx'});console.log(`Imported ${drafts.length} candidates: ${target}`);return;
 }
 if(command==='template'){if(!extra)throw Error('Evidence output path required.');validateQuestions(batch,{allowCandidates:true});await writeFile(resolve(extra),JSON.stringify(Object.fromEntries(batch.map(q=>[q.id,{reviewedBy:'',reviewedOn:'',rationale:'',checks:Object.fromEntries(editorialChecks.map(key=>[key,false])),optionRationales:['','','',''],resolvedWarnings:[]} ])),null,2)+'\n',{flag:'wx'});console.log('Unchecked review template created. No questions approved.');return}
 if(command==='review'){
  throw Error('Raw checklist approval is retired. Use node scripts/review-server.mjs, then node scripts/editorial.mjs export <new-output.json>.');
 }
 // Explicit publication only; never invoked by build, import or review.
 publicationBatch(questions,batch);
 await publishReviewed(root,questions,publishedQuestions,batch);
 console.log(`Published ${batch.length} current ledger-approved questions. Run the full build and tests before deployment.`);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1});
