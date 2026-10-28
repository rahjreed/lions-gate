// Explicit presentation-data build; does not review or publish questions.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {questions} from '../dist/questions.js';
import {contentFingerprint,prohibitedPersonalReferences} from '../dist/question-rules.js';
const read=path=>readFile(new URL('../'+path,import.meta.url));
const course=JSON.parse(await read('content/course-publication/lesson-drafts.json')),legacy=JSON.parse(await read('content/course-publication/legacy-lesson-drafts.json')),drafts=[...course,...legacy];
assert.equal(course.length,50);assert.equal(legacy.length,110);assert.equal(drafts.length,questions.length);assert.equal(new Set(drafts.map(d=>d[0])).size,160);
const lessons=Object.fromEntries(drafts.map(([id,title,context,objective])=>{
 const q=questions.find(q=>q.id===id);assert.ok(q?.review.status==='verified');assert.ok(!prohibitedPersonalReferences.test(JSON.stringify([title,context,objective])));
 return [id,{title,context,objective:q.knowledge?.learningObjective||objective,courseUnitId:q.editorial?.courseUnitId||null,courseUnitTitle:q.editorial?.courseUnitTitle||null,questionFingerprint:contentFingerprint(q)}];
}));
// Keep exact primary-source text behind the new legacy context, without changing
// the existing question's citations, excerpts, answers or review fingerprints.
const source=await read('.verification/launch/kjv-vpl/eng-kjv_vpl.txt'),sha=x=>createHash('sha256').update(x).digest('hex');assert.equal(sha(source),'fb7b8c10feb607c22b3461e837bfd267c09814f39ce23756a1928f7739a52b3c');
const books=(await import('../dist/question-rules.js'));
const codes=Object.fromEntries([...books.oldTestament,...books.newTestament,...books.apocrypha].map((book,i)=>[book,('GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SOL ISA JER LAM EZE DAN HOS JOE AMO OBA JON MIC NAH HAB ZEP HAG ZEC MAL MAT MAR LUK JOH ACT ROM 1CO 2CO GAL EPH PHI COL 1TH 2TH 1TI 2TI TIT PHM HEB JAM 1PE 2PE 1JO 2JO 3JO JUD REV 1ES 4ES TOB JDT ESG WIS SIR BAR PRA SUS BEL PRM 1MA 2MA').split(' ')[i]]));
const text=new Map(String(source).split(/\r?\n/).map(l=>{const m=l.match(/^(\S+) (\d+):(\d+) (.+)$/);return m?[`${m[1]} ${m[2]}:${m[3]}`,m[4]]:['','']}));
const sourcePassages=Object.fromEntries(legacy.map(([id])=>{const q=questions.find(q=>q.id===id);return [id,[q.scripture,...q.supportingScriptures||[]].map(s=>{
 const verses=[],context=[];for(let n=Math.max(1,s.verse-2);n<=(s.endVerse??s.verse)+2;n++){const value=text.get(`${codes[s.book]} ${s.chapter}:${n}`);if(value){context.push({verse:n,text:value});if(n>=s.verse&&n<=(s.endVerse??s.verse))verses.push({verse:n,text:value})}}
 assert.equal(verses.length,(s.endVerse??s.verse)-s.verse+1,`${id}: unresolved source passage`);return {book:s.book,chapter:s.chapter,verse:s.verse,...(s.endVerse?{endVerse:s.endVerse}:{}),verses,context};
})]}));
await writeFile(new URL('../content/course-publication/legacy-lesson-evidence.json',import.meta.url),JSON.stringify({sourceSha256:sha(source),sourceURL:'https://ebible.org/eng-kjv/',attribution:'Exact KJV extraction supporting AI-assisted lesson-context review; not independent human certification. Original question evidence remains unchanged.',questions:sourcePassages},null,2)+'\n');
const output='// Source-bound course lesson presentation; questions remain authoritative.\nexport const courseLessons='+JSON.stringify(lessons,null,2)+';\n';
await writeFile(new URL('../dist/course-lessons.js',import.meta.url),output);
await writeFile(new URL('../content/course-publication/lesson-review.json',import.meta.url),JSON.stringify({schemaVersion:1,reviewedOn:'2026-10-28',reviewedBy:'Codex — AI-assisted presentation/context review; not independent human certification',basis:'Contexts restate the evidenced passages and existing explanations. Legacy context has exact source ranges recorded separately. No new Scripture references or new interpretive framework introduced.',moduleSha256:sha(output),sourceSha256:sha(await read('content/course-publication/lesson-drafts.json')),legacySourceSha256:sha(await read('content/course-publication/legacy-lesson-drafts.json')),legacyEvidenceSha256:sha(await read('content/course-publication/legacy-lesson-evidence.json')),questionFingerprints:Object.fromEntries(Object.entries(lessons).map(([id,l])=>[id,l.questionFingerprint]))},null,2)+'\n');
console.log('Built 160 source-bound Scripture lesson profiles; no approvals or publication performed.');
