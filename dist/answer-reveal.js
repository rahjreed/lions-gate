import {scriptureReference} from './questions.js';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function answerRevealMarkup({q,last,streak,continuation='NEXT QUESTION'}){
 const title=last.correct?'Correct!':last.choice===-1?'Incorrect · Time’s up':'Incorrect answer';
 const reward=last.correct?`+${last.earned.toLocaleString('en-US')} POINTS${streak>=3?` · ${streak} IN A ROW`:''}`:last.shielded?'SHIELD USED · LIFE PROTECTED':'ONE LIFE LOST · KEEP SHARPENING';
 return `<dialog id="answer-reveal" class="answer-reveal ${last.correct?'reveal-correct':'reveal-incorrect'}" aria-modal="true" aria-labelledby="reveal-title" aria-describedby="reveal-answer"><header class="reveal-heading"><span class="feedback-icon" aria-hidden="true">${last.correct?'✦':last.shielded?'◈':'×'}</span><div><h2 id="reveal-title">${title}</h2><p class="reveal-reward">${esc(reward)}</p></div></header><div class="reveal-copy" tabindex="0" role="region" aria-label="Answer and Scripture explanation"><p id="reveal-answer"><small>CORRECT ANSWER</small><strong>${esc(q.correctAnswer)}</strong></p><a class="scripture-confirmation" href="${q.scripture.url}" target="_blank" rel="noopener noreferrer">${esc(scriptureReference(q))} ↗</a><p class="reveal-explanation">${esc(q.explain)}</p>${q.trap?`<p class="trap-check"><strong>${esc(q.trapType.toUpperCase())} CHECK:</strong> ${esc(q.trap.correction)}</p>`:''}</div><footer class="reveal-footer"><span>${esc(continuation)}</span><button id="next" class="button primary" data-action="next" autofocus>CONTINUE →</button></footer></dialog>`;
}

// Native modal dialogs supply top-layer placement, background inertness and
// focus containment. Keep scroll locking separate from gameplay state.
export class AnswerReveal{
 constructor(document){this.document=document;this.dialog=null}
 open(dialog,onContinue){
  this.close();this.dialog=dialog;
  dialog.addEventListener('cancel',event=>{event.preventDefault();onContinue()});
  dialog.addEventListener('keydown',event=>{
   if(event.key!=='Tab')return;
   const controls=[...dialog.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]')];
   const at=controls.indexOf(this.document.activeElement);
   event.preventDefault();
   controls[at<0?(event.shiftKey?controls.length-1:0):(at+(event.shiftKey?-1:1)+controls.length)%controls.length]?.focus({preventScroll:true});
  });
  this.document.documentElement.classList.add('answer-reveal-open');
  dialog.showModal();
  dialog.querySelector('#next').focus({preventScroll:true});
 }
 close(){
  if(this.dialog?.open)this.dialog.close();
  this.dialog=null;
  this.document.documentElement.classList.remove('answer-reveal-open');
 }
}
