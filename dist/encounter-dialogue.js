// Presentation and saved phases are shared by all curated dialogue triggers.
import {dialogueBank} from './dialogue-bank.js';
import {approvedDialogue,rotatedDialogue} from './dialogue-catalog.js';
export const dialoguePools=Object.freeze({regular:Object.freeze(approvedDialogue(dialogueBank,'pre-battle').map(e=>Object.freeze([e.opponent,e.judah]))),gatekeeper:Object.freeze(approvedDialogue(dialogueBank,'gatekeeper').map(e=>Object.freeze([e.opponent,e.judah])))});
export function dialogueFor(level,exchangeId){
 if(!Number.isSafeInteger(level)||level<1)throw new RangeError('Dialogue level must be a positive safe integer');
 const boss=level%5===0,category=boss?'gatekeeper':'pre-battle';
 const ordinal=boss?level/5-1:level-Math.floor(level/5)-1;
 const entry=rotatedDialogue(dialogueBank,category,ordinal,exchangeId);
 return Object.freeze({id:entry.id,boss,opponent:entry.opponent,judah:entry.judah});
}
export function pendingDialogue(run){const d=run?.dialogue;return run?.status==='playing'&&run.index===0&&d?.level===run.level&&d.done===false&&(d.step===0||d.step===1)}
export class EncounterDialogue{
 constructor(level,checkpoint,exchange=dialogueFor(level,checkpoint?.exchangeId)){this.level=level;this.exchange=exchange;this.kind=exchange.kind||null;this.step=checkpoint?.level===level&&checkpoint?.step===1?1:0;this.done=false}
 next(){if(this.done)return false;if(this.step===0)this.step=1;else this.done=true;return true}
 skip(){if(this.done)return false;this.done=true;return true}
 checkpoint(){return {level:this.level,step:this.step,done:this.done,exchangeId:this.exchange.id}}
}
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function dialogueMarkup(session,name){const reply=session.step===1;return `<section class="encounter-panel" aria-labelledby="screen-title"><h1 id="screen-title" tabindex="-1">${session.kind?(session.kind==='one-life'?'STAND FIRM, JUDAH':session.kind==='knockout'?'THE FINAL WORD':'THE LAST DEFENSE'):session.exchange.boss?'GATEKEEPER ENCOUNTER':'BEFORE THE BATTLE'}</h1><div class="dialogue-lines" aria-live="polite" aria-atomic="true"><button class="speech-bubble opponent-speech" data-action="dialogue-next"><span class="speaker">${esc(name)}</span><span>${esc(session.exchange.opponent)}</span></button><button class="speech-bubble judah-speech ${reply?'':'unspoken'}" data-action="dialogue-next" ${reply?'':'disabled aria-hidden="true"'}><span class="speaker">JUDAH</span><span>${reply?esc(session.exchange.judah):'…'}</span></button></div><div class="dialogue-controls"><button id="dialogue-next" class="button primary" data-action="dialogue-next">${reply?(session.kind==='knockout'?'FINISH THE BATTLE →':session.kind?'CONTINUE BATTLE →':'BEGIN BATTLE →'):'JUDAH’S REPLY →'}</button><button class="button" data-action="dialogue-skip">SKIP »</button><button class="menu-link dialogue-disable" data-action="dialogue-disable">SKIP & TURN OFF FUTURE DIALOGUE</button></div></section>`}
