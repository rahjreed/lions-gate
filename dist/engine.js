import {flawlessState,breakFlawless,completeFlawlessLevel,validFlawless} from './flawless.js';
import {newBattleDialogue,queueBattleDialogue,validBattleDialogue,clearBattleDialogue} from './battle-dialogue.js';
import {selectKnowledgeQuestions} from './question-selection.js';
export const VERSION=3;
export const MAX_LIVES=5;
export const HITS_TO_WIN=10;
export const successfulHits=run=>run.answers.filter(a=>a.correct).length;
export const validCombatPresentation=(p,answers=[])=>p===undefined||!!p&&Number.isInteger(p.answer)&&p.answer>=1&&p.answer<=answers.length&&typeof p.complete==='boolean';
export const rankMilestones=Object.freeze([0,35,110,185,260]);
export const rankNames=Object.freeze(['Novice','Student','Scholar','Scribe','Master']);
export function rankFor(completed=0){
 if(completed<35)return {name:'Novice',degree:0,next:36,start:1};
 if(completed<110)return {name:'Student',degree:0,next:111,start:36};
 if(completed<185)return {name:'Scholar',degree:0,next:186,start:111};
 if(completed<260)return {name:'Scribe',degree:0,next:261,start:186};
 const degree=Number((BigInt(completed)-260n)/75n+1n),start=260+75*(degree-1);
 return {name:'Master',degree,next:start+76,start:start+1};
}
// Historical honors are migration/display data, never current rank awards.
export function legacyRankFor(completed=0){
 const stage=completed<5?0:completed<15?1:completed<30?2:completed<50?3:4;
 return {name:rankNames[stage],degree:stage===4?Math.floor((completed-50)/10)+1:0};
}
export const masteryCompleted=run=>Math.max(run.completed,run.rankHighWater||0);
export function wardrobeFor(completed=0,legacyCompleted=0){return rankNames[Math.max(rankNames.indexOf(rankFor(completed).name),rankNames.indexOf(legacyRankFor(legacyCompleted).name))]}
export function rankProgress(completed=0){const rank=rankFor(completed),span=completed<35?35:75,remaining=completed<260?rank.next-completed-1:75-Number((BigInt(completed)-260n)%75n);return {remaining,value:span-remaining,max:span};}
export function ordinal(n){const mod=n%100;return `${n}${mod>=11&&mod<=13?'th':{1:'st',2:'nd',3:'rd'}[n%10]||'th'}`}
export const rankLabel=r=>r.degree?`Master · ${ordinal(r.degree)} Degree`:r.name;
export function levelConfig(level){const difficulty=level<2?1:level<5?2:3;return {difficulty,boss:level%5===0,seconds:level%5===0?45:[0,35,40,45][difficulty],bonus:500+level*50};}
export function shuffled(items,random=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
// Keep the public API and saved queue shape stable.
export const selectQuestions=selectKnowledgeQuestions;
export function createRun(bank,nickname='PLAYER 1',random=Math.random){
 const run={version:VERSION,id:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${random()}`,nickname,level:1,completed:0,score:0,lives:MAX_LIVES,streak:0,bestStreak:0,history:{},asked:0,correct:0,perfects:0,bosses:0,powers:{fifty:3,time:2,shield:1},status:'playing',index:0,answers:[],remaining:35,eliminated:[],shielded:false,startedAt:new Date().toISOString()};
 run.rankHighWater=0;flawlessState(run);return beginLevel(run,bank,random);
}
function resetLevel(run,bank,random,avoid=[]){const c=levelConfig(run.level);run.queue=selectQuestions(bank,run,random,avoid);run.index=0;run.answers=[];delete run.combatPresentation;run.status='playing';run.remaining=c.seconds;run.eliminated=[];run.shielded=false;run.lastPromotion=null;run.battleDialogue=newBattleDialogue(run.level);return run}
export function beginLevel(run,bank,random=Math.random){if(run.levelRewards?.level===run.level&&run.status!=='levelup')breakFlawless(run);run.levelRewards={level:run.level,highWater:0,attempt:0,startPowers:{...run.powers}};return resetLevel(run,bank,random)}
function levelRewards(run){
 // Version-3 saves from before retries have no ledger. Preserve their awarded
 // points and current inventory; earlier power usage cannot be reconstructed.
 if(!run.levelRewards){const awarded=run.answers.reduce((sum,a)=>sum+a.earned,0);run.levelRewards={level:run.level,highWater:awarded,attempt:awarded,startPowers:{...run.powers}}}
 return run.levelRewards;
}
export const canRetryLevel=run=>!!run&&run.status==='gameover'&&run.lives===0&&run.completed<run.level;
export function retryLevel(run,bank,random=Math.random){
 if(!canRetryLevel(run))return false;
 const rewards=levelRewards(run),avoid=run.queue.map(q=>q.id);breakFlawless(run);
 run.lives=MAX_LIVES;run.streak=0;run.powers={...rewards.startPowers};rewards.attempt=0;delete run.endedAt;
 resetLevel(run,bank,random,avoid);return true;
}
export function submit(run,bank,choice){
 if(run.status!=='playing')return false;
 const q=bank.find(q=>q.id===run.queue[run.index].id);if(!q||![-1,0,1,2,3].includes(choice))return false;
 const beforeLives=run.lives,correct=choice===q.answer,c=levelConfig(run.level),rewards=levelRewards(run);let earned=0;
 if(correct){run.streak++;run.correct++;run.bestStreak=Math.max(run.bestStreak,run.streak);rewards.attempt+=100*Math.min(5,1+Math.floor(run.streak/3))*(c.boss?2:1);earned=Math.max(0,rewards.attempt-rewards.highWater);rewards.highWater=Math.max(rewards.highWater,rewards.attempt);run.score+=earned}
 else{run.streak=0;breakFlawless(run);if(!run.shielded)run.lives--}
 run.asked++;const prev=run.history[q.id]||{count:0};run.history[q.id]={count:prev.count+1,last:run.asked,misses:(prev.misses||0)+(correct?0:1),lastCorrect:correct};
 run.answers.push({id:q.id,choice,correct,earned,shielded:run.shielded&&!correct});run.status='feedback';queueBattleDialogue(run,beforeLives);return true;
}
export function advance(run,bank,random=Math.random){
 if(run.status!=='feedback')return false;
 if(run.lives<=0){breakFlawless(run);run.status='gameover';run.endedAt=new Date().toISOString();return true}
 if(successfulHits(run)>=HITS_TO_WIN){clearBattleDialogue(run);completeFlawlessLevel(run);const previous=rankLabel(rankFor(masteryCompleted(run)));run.completed=run.level;run.rankHighWater=masteryCompleted(run);
  if(run.answers.every(a=>a.correct)){run.score+=levelConfig(run.level).bonus;run.perfects++}
  if(levelConfig(run.level).boss)run.bosses++;
  run.lastPromotion=previous!==rankLabel(rankFor(masteryCompleted(run)))?rankLabel(rankFor(masteryCompleted(run))):null;
  run.status='levelup';return true;
 }
 // Extend only when needed, through the same approved, difficulty-aware selector.
 // Avoid every question in this encounter where the eligible pool permits it.
 if(run.index+1>=run.queue.length){const seen=new Set(run.queue.map(q=>q.id)),batch=selectQuestions(bank,run,random,[...seen],[...seen]);run.queue.push(batch.find(q=>!seen.has(q.id))||batch.find(q=>q.id!==run.queue.at(-1).id)||batch[0])}
 run.index++;run.status='playing';run.remaining=levelConfig(run.level).seconds;run.eliminated=[];run.shielded=false;return true;
}
export function nextLevel(run,bank,random=Math.random){if(run.status!=='levelup')return false;run.level++;beginLevel(run,bank,random);return true}
export function usePower(run,bank,power){
 if(run.status!=='playing'||!(run.powers[power]>0))return false;
 if(power==='time')run.remaining+=15;
 else if(power==='shield'){if(run.shielded)return false;run.shielded=true}
 else if(power==='fifty'){if(run.eliminated.length)return false;const q=bank.find(q=>q.id===run.queue[run.index].id);run.eliminated=run.queue[run.index].order.filter(i=>i!==q.answer).slice(0,2)}else return false;
 levelRewards(run);run.powers[power]--;return true;
}
export function validRun(run,bank){
 if(!validCombatPresentation(run?.combatPresentation,run?.answers))return false;
 if(!validFlawless(run?.flawless)||!validBattleDialogue(run?.battleDialogue))return false;
 if(run?.rankHighWater!==undefined&&(!Number.isSafeInteger(run.rankHighWater)||run.rankHighWater<0))return false;
 if(!run||!Number.isInteger(run.streak)||run.streak<0||!Number.isInteger(run.bestStreak)||run.bestStreak<0||!Number.isInteger(run.asked)||run.asked<0||!Number.isInteger(run.correct)||run.correct<0||!Number.isInteger(run.perfects)||run.perfects<0||!Number.isInteger(run.bosses)||run.bosses<0)return false;
 if(!run.history||typeof run.history!=='object'||!Object.values(run.history).every(h=>Number.isInteger(h.count)&&h.count>=0&&Number.isInteger(h.last)&&h.last>=0&&(h.misses===undefined||Number.isInteger(h.misses)&&h.misses>=0&&h.misses<=h.count)&&(h.lastCorrect===undefined||typeof h.lastCorrect==='boolean')))return false;
 if(!Array.isArray(run.answers)||!run.answers.every(a=>bank.some(q=>q.id===a.id)&&[-1,0,1,2,3].includes(a.choice)&&typeof a.correct==='boolean'&&Number.isInteger(a.earned)&&a.earned>=0))return false;
 if(run.levelRewards){const r=run.levelRewards;if(r.level!==run.level||!Number.isSafeInteger(r.highWater)||!Number.isSafeInteger(r.attempt)||r.attempt<0||r.highWater<r.attempt||r.highWater>run.score||r.highWater>5000*(levelConfig(run.level).boss?2:1)||!r.startPowers||!['fifty','time','shield'].every(k=>Number.isInteger(r.startPowers[k])&&r.startPowers[k]>=0&&r.startPowers[k]<=3))return false}
 const ids=new Set(bank.map(q=>q.id));return !!run&&run.version===VERSION&&Number.isSafeInteger(run.level)&&run.level>=1&&Number.isSafeInteger(run.completed)&&run.completed>=0&&run.completed<=run.level&&Number.isSafeInteger(run.score)&&run.score>=0&&Number.isInteger(run.lives)&&run.lives>=0&&run.lives<=MAX_LIVES&&Number.isInteger(run.index)&&run.index>=0&&Array.isArray(run.queue)&&run.queue.length>=10&&run.queue.length<=20&&run.index<run.queue.length&&new Set(run.queue.slice(0,10).map(q=>q.id)).size===10&&run.queue.every(q=>ids.has(q.id)&&q.order?.length===4&&new Set(q.order).size===4&&q.order.every(i=>[0,1,2,3].includes(i)))&&['playing','feedback','levelup','gameover'].includes(run.status)&&Number.isFinite(run.remaining)&&run.remaining>=0&&run.remaining<=100&&Array.isArray(run.answers)&&run.answers.length<=run.queue.length&&successfulHits(run)<=HITS_TO_WIN&&!!run.history&&!!run.powers&&['fifty','time','shield'].every(k=>Number.isInteger(run.powers[k])&&run.powers[k]>=0&&run.powers[k]<=3)&&Array.isArray(run.eliminated)&&typeof run.nickname==='string';
}
export function achievements(run){const completed=masteryCompleted(run);return [run.correct>=1&&'First Strike',run.bestStreak>=5&&'On Fire',run.perfects>=1&&'Flawless',run.bosses>=1&&'Gatekeeper',completed>=35&&'Student',completed>=110&&'Scholar',completed>=185&&'Scribe',completed>=260&&'Master'].filter(Boolean)}
export function leaderboardSort(a,b){return b.score-a.score||b.completed-a.completed||a.endedAt.localeCompare(b.endedAt)||a.id.localeCompare(b.id)}
export function weekStart(now=new Date()){const date=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));date.setUTCDate(date.getUTCDate()-((date.getUTCDay()+6)%7));return date.toISOString()}
