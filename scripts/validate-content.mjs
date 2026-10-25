import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {legacyKnowledge} from '../dist/knowledge.js';
import {questions} from '../dist/questions.js';
import {canon,oldTestament,newTestament,apocrypha,validateQuestions,prohibitedPersonalReferences} from '../dist/question-rules.js';
assert.equal(oldTestament.length,39);assert.equal(newTestament.length,27);assert.equal(apocrypha.length,14);assert.equal(new Set(canon).size,80);
assert.ok(questions.length>=42);assert.equal(Object.keys(legacyKnowledge).length,42);assert.ok(Object.keys(legacyKnowledge).every(id=>questions.some(q=>q.id===id))); assert.equal(validateQuestions(questions),true);
function reject(change,pattern){const q=structuredClone(questions[0]);change(q);assert.throws(()=>validateQuestions([q]),pattern)}
for(const text of ['Where in your notes is this?','According to my study documents, who?','What does the study assignment say?','See Google Drive','What do the personal notes say?'])reject(q=>q.q=text,/Personal research/);
reject(q=>delete q.scripture,/citation/);reject(q=>q.scripture.verse=0,/citation/);
for(const book of ['Enoch','Jubilees','Jasher','Cepher'])reject(q=>q.scripture.book=book,/Excluded|citation/);
for(const title of ['Myles Awakens','Becoming Solomon','Yahweh Strickster','Yahweh Trickster','short stories'])reject(q=>q.explain=title,/Excluded/);
reject(q=>q.answer=0,/Correct answer/);reject(q=>q.scripture.url='https://docs.google.com/document/private',/Personal research/);
reject(q=>q.scripture.url='https://www.kingjamesbibleonline.org/Exodus-20-9/',/matching|match/i);
reject(q=>q.review.status='pending',/review/);reject(q=>q.q+=' Changed',/Content changed/);
reject(q=>q.options[0]=q.options[1],/distinct/);
for(const name of ['app.js','index.html']){const text=readFileSync(new URL(`../dist/${name}`,import.meta.url),'utf8');assert.equal(prohibitedPersonalReferences.test(text),false,`${name}: private research reference`);assert.equal(/docs\.google|drive\.google|sources\[q\.source\]|\bq\.ref\b/.test(text),false,`${name}: stale private source rendering`)}
console.log('PASS: 42 reviewed questions; 80-book canon; personal-reference, excluded-content, citation, answer, and stale-review rejection checks.');
