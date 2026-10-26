// Editorial-source adapter only. Never reviews, approves or publishes records.
import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,mkdtemp,unlink,rmdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {questions} from '../dist/questions.js';
import {qualityReport} from './question-quality.mjs';

export const pendingExcerpt='[PENDING: editor supplied the citation; KJV passage excerpt and context have not yet been independently checked.]';
const categories={torah:'Commandments, Torah, and biblical law',people:'Biblical people, places, and events',yeshua:'Teachings of Yeshua',connections:'New Testament connections to the Old Testament',context:'Difficult and commonly misunderstood passages',kingdom:'Prophecy, judgment, and the Kingdom',discernment:'Complex Scripture interpretation, discernment, and leadership'};
const special={102:'torah',105:'yeshua',108:'connections',109:'context',110:'discernment',115:'yeshua',117:'kingdom',123:'context',124:'context',126:'discernment',127:'people',128:'context',129:'yeshua',130:'kingdom',131:'context',137:'connections',142:'context',143:'kingdom',144:'context',145:'connections',146:'connections',147:'connections',148:'connections',149:'discernment',150:'discernment'};
const concepts={101:'commandment-integrity',102:'teach-children',103:'fringes-remembrance',107:'commandment-integrity',109:'establish-law',110:'commandment-integrity',111:'creation-rest',112:'sabbath-creation-rationale',119:'fringes-garment-command',120:'fringes-garment-command',126:'fringes-remembrance',138:'land-animals',140:'water-creatures',142:'peter-vision',144:'hands-complaint',147:'mercy-hosea',148:'law-prophets-psalms',149:'berean-examination'};
export function citation(text){
 const m=text.match(/^(.*?) (\d+):(\d+)(?:[–-](\d+))?$/);assert.ok(m,`Unsupported citation: ${text}`);
 const book=m[1]==='Psalm'?'Psalms':m[1],chapter=Number(m[2]),verse=Number(m[3]),end=m[4]?Number(m[4]):undefined;
 return {book,chapter,verse,...(end!==undefined?{endVerse:end}:{}),translation:'KJV',excerpt:pendingExcerpt,url:`https://www.kingjamesbibleonline.org/${book.replaceAll(' ','-')}-${end!==undefined?`Chapter-${chapter}`:`${chapter}-${verse}`}/`};
}
export function parseEditorial(text){
 const sections=[...text.matchAll(/^# SECTION (\d+): (.+)\r?$/gm)];
 const headings=[...text.matchAll(/^### (KR-(\d+)) \| Difficulty (\d+)\r?$/gm)];
 assert.equal(headings.length,50,'Exactly 50 source records required');
 return headings.map((h,i)=>{
  const body=text.slice(h.index+h[0].length,headings[i+1]?.index??text.indexOf('# FINAL IMPLEMENTATION CHECKLIST'));
  const field=name=>{const match=body.match(new RegExp(`^\\*\\*${name}:\\*\\* (.+)\\r?$`,'m'));assert.ok(match,`${h[1]} missing ${name}`);return match[1].trim()};
  const options=[...body.matchAll(/^([A-D])\. (.+?)\s*\r?$/gm)];assert.deepEqual(options.map(m=>m[1]),['A','B','C','D']);
  const correct=body.match(/^\*\*Correct: ([A-D])\*\*\r?$/m);assert.ok(correct);
  const section=sections.filter(s=>s.index<h.index).at(-1);assert.ok(section);
  return {sourceId:h[1],number:Number(h[2]),difficulty:Number(h[3]),section:Number(section[1]),sectionTitle:section[2].trim(),q:field('Question'),options:options.map(m=>m[2].trim()),answer:'ABCD'.indexOf(correct[1]),scriptureText:field('Scripture'),explain:field('Explanation')};
 });
}
export function adaptEditorial(text){
 const sourceHash=createHash('sha256').update(text).digest('hex');
 return parseEditorial(text).map(s=>{
  assert.ok(s.difficulty>=1&&s.difficulty<=7,'This batch fits the existing 1–7 complexity scale. Do not silently compress higher values.');
  const refs=s.scriptureText.split(/;\s*/),knowledgeCategory=special[s.number]||'torah';
  const tags=s.section===2?['commandments','torah','sabbath']:s.section===6?['commandments','torah','clean-unclean']:s.section===7?['torah','yeshua-context']:['commandments','torah'];
  if([105,115,123,124,129,137,142,144,149].includes(s.number))tags.push(s.number===149?'scripture-tradition':'yeshua-context');
  if(s.number===109)tags.push('paul-context');
  return {id:s.sourceId.toLowerCase(),topic:s.sectionTitle,category:categories[knowledgeCategory],difficulty:s.difficulty<=3?1:s.difficulty<=5?2:3,q:s.q,options:s.options,answer:s.answer,correctAnswer:s.options[s.answer],scripture:citation(refs[0]),supportingScriptures:refs.slice(1).map(citation),explain:s.explain,tags:[...new Set(tags)],trapType:null,trap:null,knowledge:{category:knowledgeCategory,complexity:s.difficulty,concept:concepts[s.number]||s.sourceId.toLowerCase(),mode:refs.length>1?'multi-passage':'explicit'},review:{status:'candidate'},editorial:{sourceId:s.sourceId,sourceDifficulty:s.difficulty,sourceDifficultyScale:'1–10',sourceSection:s.sectionTitle,sourceScripture:s.scriptureText,sourceFile:'content/sources/kr-101-150.md',sourceSha256:sourceHash,evidenceStatus:'pending',manualReviewRequired:true}};
 });
}
const root=fileURLToPath(new URL('../',import.meta.url));
export async function snapshotExisting(){
 const files=[];
 async function walk(dir){for(const e of await readdir(join(root,dir),{withFileTypes:true})){const name=`${dir}/${e.name}`;if(e.isDirectory())await walk(name);else files.push(name)}}
 await walk('dist');await walk('content/candidates');
 return Object.fromEntries(await Promise.all(files.sort().map(async name=>[name,createHash('sha256').update(await readFile(join(root,name))).digest('hex')])));
}
async function main(){
 const source=await readFile(join(root,'content/sources/kr-101-150.md'),'utf8'),batch=adaptEditorial(source),before=await snapshotExisting();
 const previous=JSON.parse(await readFile(join(root,'content/candidates/initial-50.json'),'utf8'));
 const report=qualityReport(batch,[...questions,...previous]);assert.deepEqual(report.errors,[]);
 const temp=await mkdtemp(join(tmpdir(),'lions-gate-editorial-')),incoming=join(temp,'incoming.json');
 try{
  await writeFile(incoming,JSON.stringify(batch));
  const result=spawnSync(process.execPath,[join(root,'scripts/question-batch.mjs'),'import',incoming,'kr-101-150'],{cwd:root,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);process.stdout.write(result.stdout);
 }finally{await unlink(incoming);await rmdir(temp)}
 const after=await snapshotExisting();for(const [name,hash] of Object.entries(before))assert.equal(after[name],hash,`${name} changed`);
 const overlaps=[];
 for(const q of batch)for(const prior of [...questions,...previous,...batch]){
  if(q.id===prior.id)continue;
  const shared=[q.scripture,...q.supportingScriptures].some(a=>[prior.scripture,...(prior.supportingScriptures||[])].some(b=>a.book===b.book&&a.chapter===b.chapter&&a.verse<=(b.endVerse??b.verse)&&b.verse<=(a.endVerse??a.verse)));
  if(shared)overlaps.push({candidate:q.id,other:prior.id,reason:'Overlapping cited passage; inspect conceptual duplication, not necessarily a duplicate question.'});
 }
 await writeFile(join(root,'content/kr-101-150-validation.json'),JSON.stringify({...report,liveCount:questions.length,previousCandidates:previous.length,sourceSha256:batch[0].editorial.sourceSha256,evidenceStatus:'pending for all 50',citationOverlaps:overlaps,preservedFiles:before},null,2)+'\n',{flag:'wx'});
 console.log(`PASS: ${batch.length} candidates, no existing content changed; ${report.warnings.length} automated warnings, ${overlaps.length} citation-overlap pairs for manual review. No publication performed.`);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error);process.exitCode=1});
