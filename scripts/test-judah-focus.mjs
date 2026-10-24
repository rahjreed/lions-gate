import assert from 'node:assert/strict';
import {questions} from '../dist/questions.js';
import {selectQuestions} from '../dist/engine.js';
import {focusTags} from '../dist/focus-questions.js';
import {validateQuestions} from '../dist/question-rules.js';
import {judah} from '../dist/mascot.js';
for(const [n,name,degree] of [[0,'Novice',0],[5,'Student',0],[15,'Scholar',0],[30,'Scribe',0],[50,'Master',1],[60,'Master',2],[10000,'Master',996]]){const svg=judah(n);assert.ok(svg.includes(`data-rank="${name}"`));assert.ok(svg.includes(`data-degree="${degree}"`));assert.ok(svg.includes('aria-label="Judah'));}
for(let level=1;level<=100;level++){
 const result=selectQuestions(questions,{level,history:{}}).map(e=>questions.find(q=>q.id===e.id));
 assert.equal(result.filter(q=>q.tags.some(t=>focusTags.includes(t))).length,7);
 if(level>=5)for(const type of ['tradition','context','misquote']){if(level%5===0)assert.ok(result.some(q=>q.trapType===type));}
 const draft={...questions[0],id:'unreviewed',review:{status:'draft'}};
 assert.ok(selectQuestions([...questions,draft],{level,history:{}}).every(q=>q.id!=='unreviewed'));
}
for(const change of [q=>q.tags=[],q=>q.tags=['unknown'],q=>q.trapType='guess',q=>q.review.status='draft',q=>q.tags=['general']]){const q=structuredClone(questions[0]);change(q);assert.throws(()=>validateQuestions([q]));}
console.log('PASS Judah rank/degree art; 7:3 focus balance across 100 levels; all three Gatekeeper trap types; draft, tag, and stale-review rejection.');
