import {focusTags} from './focus-questions.js';
import {contentFingerprint} from './question-rules.js';
export const VERSION=3;
export function rankFor(completed=0){
 const level=completed+1;
 if(level<=5)return {name:'Novice',degree:0,next:6,start:1};
 if(level<=15)return {name:'Student',degree:0,next:16,start:6};
 if(level<=30)return {name:'Scholar',degree:0,next:31,start:16};
 if(level<=50)return {name:'Scribe',degree:0,next:51,start:31};
 const degree=Math.floor((level-51)/10)+1;
 return {name:'Master',degree,next:51+degree*10,start:51+(degree-1)*10};
}
export function ordinal(n){const mod=n%100;return `${n}${mod>=11&&mod<=13?'th':{1:'st',2:'nd',3:'rd'}[n%10]||'th'}`}
export const rankLabel=r=>r.degree?`Master · ${ordinal(r.degree)} Degree`:r.name;
export function levelConfig(level){const difficulty=level<2?1:level<5?2:3;return {difficulty,boss:level%5===0,seconds:level%5===0?45:[0,35,40,45][difficulty],bonus:500+level*50};}
export function shuffled(items,random=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export function selectQuestions(bank,run,random=Math.random,avoid=[]){
 const config=levelConfig(run.level),used=run.history||{};
 const approved=bank.filter(q=>q.review?.status==='verified'&&q.review.contentFingerprint===contentFingerprint(q));
 const eligible=approved.filter(q=>q.difficulty<=config.difficulty);
 const pool=shuffled(eligible.length>=10?eligible:approved,random).sort((a,b)=>{
  const x=used[a.id]||{count:0,last:-1},y=used[b.id]||{count:0,last:-1};
  return Number(avoid.includes(a.id))-Number(avoid.includes(b.id)) || x.count-y.count || (x.count?x.last-y.last:0) ||
   Math.abs(a.difficulty-config.difficulty)-Math.abs(b.difficulty-config.difficulty);
 });
 if(pool.length<10)throw Error('At least ten passage-approved questions are required.');
 const selected=[],focus=q=>q.tags.some(t=>focusTags.includes(t));
 const take=(predicate,n)=>{for(const q of pool){if(n<=0)break;if(!selected.includes(q)&&predicate(q)){selected.push(q);n--}}};
 // Trap quota is part of the seven focus slots, never an additional score rule.
 const types=shuffled(['tradition','context','misquote'],random),target=config.boss?3:2;
 for(const type of types.slice(0,target))take(q=>focus(q)&&q.trapType===type,1);
 take(q=>focus(q)&&q.trapType,target-selected.length);
 take(focus,7-selected.filter(focus).length);
 take(q=>!focus(q),10-selected.length);
 take(()=>true,10-selected.length);
 return shuffled(selected,random).map(q=>({id:q.id,order:shuffled([0,1,2,3],random)}));
}
export function createRun(bank,nickname='PLAYER 1',random=Math.random){
 const run={version:VERSION,id:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${random()}`,nickname,level:1,completed:0,score:0,lives:3,streak:0,bestStreak:0,history:{},asked:0,correct:0,perfects:0,bosses:0,powers:{fifty:3,time:2,shield:1},status:'playing',index:0,answers:[],remaining:35,eliminated:[],shielded:false,startedAt:new Date().toISOString()};
 return beginLevel(run,bank,random);
}
function resetLevel(run,bank,random,avoid=[]){const c=levelConfig(run.level);run.queue=selectQuestions(bank,run,random,avoid);run.index=0;run.answers=[];run.status='playing';run.remaining=c.seconds;run.eliminated=[];run.shielded=false;run.lastPromotion=null;return run}
export function beginLevel(run,bank,random=Math.random){run.levelRewards={level:run.level,highWater:0,attempt:0,startPowers:{...run.powers}};return resetLevel(run,bank,random)}
function levelRewards(run){
 // Version-3 saves from before retries have no ledger. Preserve their awarded
 // points and current inventory; earlier power usage cannot be reconstructed.
 if(!run.levelRewards){const awarded=run.answers.reduce((sum,a)=>sum+a.earned,0);run.levelRewards={level:run.level,highWater:awarded,attempt:awarded,startPowers:{...run.powers}}}
 return run.levelRewards;
}
export const canRetryLevel=run=>!!run&&run.status==='gameover'&&run.lives===0&&run.completed<run.level;
export function retryLevel(run,bank,random=Math.random){
 if(!canRetryLevel(run))return false;
 const rewards=levelRewards(run),avoid=run.queue.map(q=>q.id);
 run.lives=3;run.streak=0;run.powers={...rewards.startPowers};rewards.attempt=0;delete run.endedAt;
 resetLevel(run,bank,random,avoid);return true;
}
export function submit(run,bank,choice){
 if(run.status!=='playing')return false;
 const q=bank.find(q=>q.id===run.queue[run.index].id);if(!q||![-1,0,1,2,3].includes(choice))return false;
 const correct=choice===q.answer,c=levelConfig(run.level),rewards=levelRewards(run);let earned=0;
 if(correct){run.streak++;run.correct++;run.bestStreak=Math.max(run.bestStreak,run.streak);rewards.attempt+=100*Math.min(5,1+Math.floor(run.streak/3))*(c.boss?2:1);earned=Math.max(0,rewards.attempt-rewards.highWater);rewards.highWater=Math.max(rewards.highWater,rewards.attempt);run.score+=earned}
 else{run.streak=0;if(!run.shielded)run.lives--}
 run.asked++;const prev=run.history[q.id]||{count:0};run.history[q.id]={count:prev.count+1,last:run.asked};
 run.answers.push({id:q.id,choice,correct,earned,shielded:run.shielded&&!correct});run.status='feedback';return true;
}
export function advance(run,bank,random=Math.random){
 if(run.status!=='feedback')return false;
 if(run.lives<=0){run.status='gameover';run.endedAt=new Date().toISOString();return true}
 if(run.index===9){const previous=rankLabel(rankFor(run.completed));run.completed=run.level;
  if(run.answers.every(a=>a.correct)){run.score+=levelConfig(run.level).bonus;run.perfects++}
  if(levelConfig(run.level).boss)run.bosses++;
  run.lastPromotion=previous!==rankLabel(rankFor(run.completed))?rankLabel(rankFor(run.completed)):null;
  run.status='levelup';return true;
 }
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
 if(!run||!Number.isInteger(run.streak)||run.streak<0||!Number.isInteger(run.bestStreak)||run.bestStreak<0||!Number.isInteger(run.asked)||run.asked<0||!Number.isInteger(run.correct)||run.correct<0||!Number.isInteger(run.perfects)||run.perfects<0||!Number.isInteger(run.bosses)||run.bosses<0)return false;
 if(!run.history||typeof run.history!=='object'||!Object.values(run.history).every(h=>Number.isInteger(h.count)&&h.count>=0&&Number.isInteger(h.last)&&h.last>=0))return false;
 if(!Array.isArray(run.answers)||!run.answers.every(a=>bank.some(q=>q.id===a.id)&&[-1,0,1,2,3].includes(a.choice)&&typeof a.correct==='boolean'&&Number.isInteger(a.earned)&&a.earned>=0))return false;
 if(run.levelRewards){const r=run.levelRewards;if(r.level!==run.level||!Number.isSafeInteger(r.highWater)||!Number.isSafeInteger(r.attempt)||r.attempt<0||r.highWater<r.attempt||r.highWater>run.score||r.highWater>5000*(levelConfig(run.level).boss?2:1)||!r.startPowers||!['fifty','time','shield'].every(k=>Number.isInteger(r.startPowers[k])&&r.startPowers[k]>=0&&r.startPowers[k]<=3))return false}
 const ids=new Set(bank.map(q=>q.id));return !!run&&run.version===VERSION&&Number.isSafeInteger(run.level)&&run.level>=1&&Number.isSafeInteger(run.completed)&&run.completed>=0&&run.completed<=run.level&&Number.isSafeInteger(run.score)&&run.score>=0&&Number.isInteger(run.lives)&&run.lives>=0&&run.lives<=3&&Number.isInteger(run.index)&&run.index>=0&&run.index<10&&Array.isArray(run.queue)&&run.queue.length===10&&new Set(run.queue.map(q=>q.id)).size===10&&run.queue.every(q=>ids.has(q.id)&&q.order?.length===4&&new Set(q.order).size===4&&q.order.every(i=>[0,1,2,3].includes(i)))&&['playing','feedback','levelup','gameover'].includes(run.status)&&Number.isFinite(run.remaining)&&run.remaining>=0&&run.remaining<=100&&Array.isArray(run.answers)&&run.answers.length<=10&&!!run.history&&!!run.powers&&['fifty','time','shield'].every(k=>Number.isInteger(run.powers[k])&&run.powers[k]>=0&&run.powers[k]<=3)&&Array.isArray(run.eliminated)&&typeof run.nickname==='string';
}
export function achievements(run){return [run.correct>=1&&'First Strike',run.bestStreak>=5&&'On Fire',run.perfects>=1&&'Flawless',run.bosses>=1&&'Gatekeeper',run.completed>=5&&'Student',run.completed>=50&&'Master'].filter(Boolean)}
export function leaderboardSort(a,b){return b.score-a.score||b.completed-a.completed||a.endedAt.localeCompare(b.endedAt)||a.id.localeCompare(b.id)}
export function weekStart(now=new Date()){const date=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));date.setUTCDate(date.getUTCDate()-((date.getUTCDay()+6)%7));return date.toISOString()}
