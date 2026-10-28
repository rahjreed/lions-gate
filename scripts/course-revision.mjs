// Exact revisions for this authorized task; historical audit hashes stay intact.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const allowed=new Set(['dist/answer-reveal.js','dist/answer-reveal.css','dist/question-selection.js','dist/engine.js','dist/published-questions.js','dist/sw.js','dist/release.js','game-release.json']);
const changes=await readFile(new URL('../content/course-publication/runtime-changes.json',import.meta.url),'utf8').then(JSON.parse).catch(e=>{if(e.code==='ENOENT')return {files:[]};throw e});
export function expectedCourseRevision(path,previous){
 const change=changes.files.find(f=>f.path===path);if(!change)return previous;
 assert.ok(allowed.has(path),'Unrelated revision outside course/lesson scope: '+path);assert.equal(change.before,previous,'Preserve historical starting hash: '+path);assert.ok(change.reason?.trim());return change.after;
}
