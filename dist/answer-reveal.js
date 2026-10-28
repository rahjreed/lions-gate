import {scriptureReference} from './questions.js';
import {lessonFor} from './lessons.js';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function answerRevealMarkup({q,last,streak,continuation='NEXT QUESTION'}){
 const title=last.correct?'Correct!':last.choice===-1?'Incorrect · Time’s up':'Incorrect answer';
 const reward=last.correct?last.earned?`+${last.earned.toLocaleString('en-US')} POINTS${streak>=3?` · ${streak} IN A ROW`:''}`:'POINTS ALREADY BANKED · BEAT YOUR LEVEL BEST TO EARN MORE':last.shielded?'SHIELD USED · LIFE PROTECTED':'ONE LIFE LOST · KEEP SHARPENING';
 const lesson=lessonFor(q);
 const link=scripture=>`<a class="scripture-confirmation" href="${esc(scripture.url)}" target="_blank" rel="noopener noreferrer">${esc(scriptureReference({scripture}))} ↗</a>`;
 const citations=`<p class="lesson-primary"><small>PRIMARY SCRIPTURE</small>${link(lesson.primary)}</p>${lesson.related.length?`<nav class="lesson-related" aria-label="Related Scriptures"><small>RELATED STUDY</small>${lesson.related.map(link).join(' · ')}</nav>`:''}`;
 const passageStudy=`<details class="lesson-passages"><summary>READ THE KJV PASSAGE${lesson.related.length?'S':''}</summary>${[lesson.primary,...lesson.related].map(s=>`<blockquote><cite>${esc(scriptureReference({scripture:s}))}</cite><p>${esc(s.excerpt)}</p></blockquote>`).join('')}</details>`;
 return `<dialog id="answer-reveal" class="answer-reveal ${last.correct?'reveal-correct':'reveal-incorrect'}" aria-modal="true" aria-labelledby="reveal-title" aria-describedby="reveal-answer"><header class="reveal-heading"><span class="feedback-icon" aria-hidden="true">${last.correct?'✦':last.shielded?'◈':'×'}</span><div><h2 id="reveal-title">${title}</h2><p class="reveal-reward">${esc(reward)}</p></div></header><div class="reveal-copy" tabindex="0" role="region" aria-label="Answer and Scripture explanation"><section class="scripture-lesson" aria-labelledby="lesson-title"><p class="lesson-kicker">SCRIPTURE LESSON${lesson.courseUnitId?` · UNIT ${esc(lesson.courseUnitId)}`:''}</p><h3 id="lesson-title">${esc(lesson.title)}</h3>${lesson.courseUnitTitle?`<p class="lesson-unit">${esc(lesson.courseUnitTitle)}</p>`:''}<p id="reveal-answer"><small>CORRECT ANSWER</small><strong>${esc(q.correctAnswer)}</strong></p>${citations}<p class="reveal-explanation">${esc(lesson.explanation)}</p>${lesson.context?`<p class="lesson-context"><strong>IN CONTEXT</strong> ${esc(lesson.context)}</p>`:''}${q.trap?`<p class="trap-check"><strong>${esc(q.trapType.toUpperCase())} CHECK:</strong> ${esc(q.trap.correction)}</p>`:''}<p class="lesson-objective"><strong>LESSON OBJECTIVE</strong> ${esc(lesson.objective)}</p>${passageStudy}</section></div><footer class="reveal-footer"><span>${esc(continuation)}</span><button id="next" class="button primary" data-action="next" autofocus>CONTINUE →</button></footer></dialog>`;
}

// Native modal dialogs supply top-layer placement, background inertness and
// focus containment. Keep scroll locking separate from gameplay state.
export class AnswerReveal{
 constructor(document){this.document=document;this.dialog=null}
 open(dialog,onContinue){
  this.close();this.dialog=dialog;
  this.onCancel=event=>{event.preventDefault();onContinue()};dialog.addEventListener('cancel',this.onCancel);
  this.onKey=event=>{
   if(event.key!=='Tab')return;
   const controls=[...dialog.querySelectorAll('a[href], button:not([disabled]), summary, [tabindex="0"]')];
   const at=controls.indexOf(this.document.activeElement);
   event.preventDefault();
   controls[at<0?(event.shiftKey?controls.length-1:0):(at+(event.shiftKey?-1:1)+controls.length)%controls.length]?.focus({preventScroll:true});
  };dialog.addEventListener('keydown',this.onKey);
  this.document.documentElement.classList.add('answer-reveal-open');
  dialog.showModal();
  dialog.querySelector('#next').focus({preventScroll:true});
 }
 close(){
  this.dialog?.removeEventListener('cancel',this.onCancel);this.dialog?.removeEventListener('keydown',this.onKey);
  if(this.dialog?.open)this.dialog.close();
  this.dialog=null;
  this.document.documentElement.classList.remove('answer-reveal-open');
 }
}
