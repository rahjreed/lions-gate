// Original fictional banter, never Scripture/question content.
export const battlePools=Object.freeze({
 'enemy-low':Object.freeze([
  ['You think this is over? I am still standing!','Then stand aside.'],
  ['My shield has one more answer for you!','I prefer answers that hold up.'],
  ['Rome does not yield at the last moment!','There is still time to learn.'],
  ['One good strike is all I need!','Then stop spending them on speeches.'],
  ['You have not passed me yet, Judah!','I am working on the final detail.'],
  ['I will guard this road to my last breath!','Your threats will not change the truth.'],
  ['This gate will remember my name!','I will remember to keep moving.'],
  ['You have only cracked the surface!','Your shield seems to disagree.']
 ]),
 'one-life':Object.freeze([
  ['One chance left, Judah. One!','One is all I need.'],
  ['Your next mistake will be your last!','Then I will read the next question carefully.'],
  ['You are barely standing!','Standing is enough to take the next step.'],
  ['You should have turned back!','I am still facing the right direction.'],
  ['I can see your courage fading!','You may need a better view.'],
  ['There is nowhere left to hide!','Good. I came here to stand firm.'],
  ['Will you finally admit defeat?','I have an answer left to give.'],
  ['Your journey hangs by a thread!','Then I will hold fast.']
 ])
});
export const newBattleDialogue=level=>({level,seen:[],queue:[],active:null});
export function queueBattleDialogue(run,beforeLives){
 const d=run.battleDialogue?.level===run.level?run.battleDialogue:(run.battleDialogue=newBattleDialogue(run.level));
 const kinds=[];if(beforeLives>1&&run.lives===1)kinds.push('one-life');
 if(run.answers.at(-1)?.correct&&run.answers.filter(a=>a.correct).length===9)kinds.push('enemy-low');
 for(const kind of kinds)if(!d.seen.includes(kind)){d.seen.push(kind);if(run.index<9&&run.lives>0)d.queue.push(kind)}
 d.queue.sort((a,b)=>(a==='one-life'?0:1)-(b==='one-life'?0:1));
}
export const pendingBattleDialogue=run=>run?.status==='playing'&&run.battleDialogue?.level===run.level&&!!(run.battleDialogue.active||run.battleDialogue.queue.length);
export function battleExchange(level,kind){const pool=battlePools[kind];if(!pool)throw Error('Unknown battle exchange');const pair=pool[((level-1)%pool.length*3)%pool.length];return {id:`${kind}-${level}`,kind,boss:level%5===0,opponent:pair[0],judah:pair[1]}}
export function claimBattleDialogue(run){const d=run.battleDialogue;if(!pendingBattleDialogue(run))return null;if(!d.active)d.active={kind:d.queue.shift(),step:0};return d.active}
export function clearBattleDialogue(run){if(run.battleDialogue){run.battleDialogue.queue=[];run.battleDialogue.active=null}}
export function validBattleDialogue(d){const kind=k=>Object.hasOwn(battlePools,k);return d===undefined||!!d&&Number.isSafeInteger(d.level)&&d.level>=1&&Array.isArray(d.seen)&&d.seen.length<=2&&new Set(d.seen).size===d.seen.length&&d.seen.every(kind)&&Array.isArray(d.queue)&&d.queue.length<=2&&new Set(d.queue).size===d.queue.length&&d.queue.every(k=>kind(k)&&d.seen.includes(k))&&(d.active===null||!!d.active&&kind(d.active.kind)&&[0,1].includes(d.active.step)&&d.seen.includes(d.active.kind)&&!d.queue.includes(d.active.kind))}
