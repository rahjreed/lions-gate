import assert from 'node:assert/strict';
import {AnswerReveal,answerRevealMarkup} from '../dist/answer-reveal.js';
import {questions,scriptureReference} from '../dist/questions.js';
import {createRun,submit} from '../dist/engine.js';

for(const choice of ['correct','wrong','timeout','shield']){
 const run=createRun(questions),q=questions.find(q=>q.id===run.queue[0].id);
 if(choice==='shield')run.shielded=true;
 submit(run,questions,choice==='correct'?q.answer:choice==='timeout'?-1:(q.answer+1)%4);
 const snapshot=structuredClone(run),source=structuredClone(q);
 const html=answerRevealMarkup({q,last:run.answers.at(-1),streak:run.streak});
 assert.match(html,/<dialog[^>]+aria-modal="true"[^>]+aria-labelledby="reveal-title"/);
 assert.ok(html.includes(scriptureReference(q)));assert.ok(html.includes(q.scripture.url));
 assert.match(html,/id="next"[^>]+data-action="next"[^>]*>CONTINUE/);
 assert.match(html,choice==='correct'?/Correct!/:/Incorrect/);
 if(choice==='shield')assert.ok(html.includes('LIFE PROTECTED')&&!html.includes('ONE LIFE LOST'));
 assert.deepEqual(run,snapshot);assert.deepEqual(q,source);
}
const q=structuredClone(questions[0]);q.explain=('Long Scripture explanation.\n\n').repeat(200)+'<script>unsafe()</script>';
const long=answerRevealMarkup({q,last:{correct:true,earned:100},streak:1});
assert.ok(long.includes(q.explain.slice(0,200)));assert.ok(long.includes('&lt;script&gt;'));assert.ok(!long.includes('<script>'));
assert.ok(long.includes('tabindex="0" role="region"'));
const classes=new Set(),document={documentElement:{classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)}}};
function dialog(){return {open:false,listeners:{},addEventListener(name,fn){this.listeners[name]=fn},removeEventListener(name,fn){if(this.listeners[name]===fn)delete this.listeners[name]},showModal(){this.open=true},close(){this.open=false},querySelector(){return {focus:options=>this.focusOptions=options}}}}
const reveal=new AnswerReveal(document),first=dialog(),second=dialog();let continued=0;
reveal.open(first,()=>continued++);assert.equal(first.open,true);assert.deepEqual(first.focusOptions,{preventScroll:true});assert.ok(classes.has('answer-reveal-open'));
reveal.open(second,()=>continued++);assert.equal(first.open,false);let prevented=false;second.listeners.cancel({preventDefault(){prevented=true}});assert.equal(prevented,true);assert.equal(continued,1);
const controls=Array.from({length:3},()=>({focus(){document.activeElement=this}}));second.querySelectorAll=()=>controls;
document.activeElement=controls[2];second.listeners.keydown({key:'Tab',preventDefault(){}});assert.equal(document.activeElement,controls[0]);
second.listeners.keydown({key:'Tab',shiftKey:true,preventDefault(){}});assert.equal(document.activeElement,controls[2]);
reveal.close();assert.equal(second.open,false);assert.equal(classes.size,0);assert.equal(continued,1);
assert.deepEqual(second.listeners,{});reveal.open(second,()=>continued++);reveal.close();assert.deepEqual(second.listeners,{},'Pause/reopen leaves no duplicate focus or cancel handlers');
console.log('PASS answer reveal: correct/wrong/timeout/shield display, source/state immutability, long text escaping, labelled scroll region, modal lifecycle, focus, scroll-lock cleanup and cancel callback.');
