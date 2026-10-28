import {dialogueBank} from './dialogue-bank.js';
import {approvedDialogue,rotatedDialogue} from './dialogue-catalog.js';
export const battlePools=Object.freeze(Object.fromEntries(['enemy-low','one-life','knockout'].map(kind=>[kind,Object.freeze(approvedDialogue(dialogueBank,kind).map(e=>Object.freeze([e.opponent,e.judah])))])));
export const knockoutDialogueLevel=level=>(level-1)%3===0;
export const newBattleDialogue=level=>({level,seen:[],queue:[],active:null});
export function queueBattleDialogue(run,beforeLives){
 const d=run.battleDialogue?.level===run.level?run.battleDialogue:(run.battleDialogue=newBattleDialogue(run.level)),hits=run.answers.filter(a=>a.correct).length;
 if(run.lives<=0){d.queue=[];d.active=null;return}
 if(hits===10){
  // Supersede stale side exchanges. The final word precedes the finishing move,
  // never its unconscious opponent, and occurs in only one of every three levels.
  d.queue=[];d.active=null;
  if(run.answers.at(-1)?.correct&&knockoutDialogueLevel(run.level)&&!d.seen.includes('knockout')){d.seen.push('knockout');d.queue.push('knockout')}
  return;
 }
 const kinds=[];if(beforeLives>1&&run.lives===1)kinds.push('one-life');
 if(run.answers.at(-1)?.correct&&hits===9)kinds.push('enemy-low');
 for(const kind of kinds)if(!d.seen.includes(kind)){d.seen.push(kind);d.queue.push(kind)}
 d.queue.sort((a,b)=>(a==='one-life'?0:1)-(b==='one-life'?0:1));
}
export const pendingBattleDialogue=run=>!!run&&run.lives>0&&run.battleDialogue?.level===run.level&&!!(run.battleDialogue.active||run.battleDialogue.queue.length)&&(run.status==='playing'||run.status==='feedback'&&run.answers.filter(a=>a.correct).length===10&&(run.battleDialogue.active?.kind||run.battleDialogue.queue[0])==='knockout');
export function battleExchange(level,kind,exchangeId,run){
 let records=dialogueBank;
 // The exact approved four-blow boast is truthful only after four life-losing
 // hits in this encounter. Carry-over lives and shield blocks do not count.
 if(kind==='one-life'&&run&&run.answers.filter(a=>!a.correct&&!a.shielded).length!==4)records=records.filter(e=>e.id!=='L02');
 const ordinal=kind==='knockout'?Math.floor((level-1)/3):level-1,entry=rotatedDialogue(records,kind,ordinal,exchangeId);
 return {id:entry.id,kind,boss:level%5===0,opponent:entry.opponent,judah:entry.judah};
}
export function claimBattleDialogue(run){const d=run.battleDialogue;if(!pendingBattleDialogue(run))return null;if(!d.active){const kind=d.queue.shift();d.active={kind,step:0,exchangeId:battleExchange(run.level,kind,null,run).id}}return d.active}
export function clearBattleDialogue(run){if(run.battleDialogue){run.battleDialogue.queue=[];run.battleDialogue.active=null}}
export function validBattleDialogue(d){const kind=k=>Object.hasOwn(battlePools,k);return d===undefined||!!d&&Number.isSafeInteger(d.level)&&d.level>=1&&Array.isArray(d.seen)&&d.seen.length<=3&&new Set(d.seen).size===d.seen.length&&d.seen.every(kind)&&Array.isArray(d.queue)&&d.queue.length<=3&&new Set(d.queue).size===d.queue.length&&d.queue.every(k=>kind(k)&&d.seen.includes(k))&&(d.active===null||!!d.active&&kind(d.active.kind)&&[0,1].includes(d.active.step)&&d.seen.includes(d.active.kind)&&!d.queue.includes(d.active.kind)&&(d.active.exchangeId===undefined||approvedDialogue(dialogueBank,d.active.kind).some(e=>e.id===d.active.exchangeId)))}
