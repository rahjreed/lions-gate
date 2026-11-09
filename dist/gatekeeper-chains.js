import {levelConfig, masteryCompleted, rankFor, rankLabel} from './engine.js';
import {studyPathFor} from './study-paths.js';
import {collectionFor} from './scripture-collections.js';
import {clearBattleDialogue} from './battle-dialogue.js';
import {breakFlawless} from './flawless.js';

export function gatekeeperBattle(run, pool) {
 if (!run || run.status!=='playing' || run.completed>=run.level || !levelConfig(run.level).boss
     || run.index!==0 || run.answers.length) return null;
 const path=studyPathFor(run), collection=collectionFor(run);
 const eligible=pool.filter(item=>item.status==='approved' && item.paths.includes(path)
  && item.collections.includes(collection)).sort((a,b)=>a.difficulty-b.difficulty || a.id.localeCompare(b.id));
 // Two disjoint starting groups ensure neighboring milestones never open with
 // the same debate. Later levels draw from progressively deeper in each group.
 if(eligible.length<2)return null;
 const milestone=run.level/5-1;
 const group=eligible.filter((_,i)=>i%2===milestone%2);
 const start=group[Math.min(group.length-1,Math.floor(milestone/2))];
 const index=eligible.indexOf(start);
 return {id:'story-gatekeeper-'+run.level,title:'Gatekeeper · Level '+run.level,rules:'precept-chain',
  chains:[{exchanges:[...eligible.slice(index),...eligible.slice(0,index)]}]};
}

export function settleGatekeeper(run,level,result){
 const {phase:outcome,score:points,health,chainCombat}=result;
 if(!run || run.level!==level || !levelConfig(level).boss || run.status!=='playing'
    || run.completed>=level || run.index!==0 || run.answers.length
    || !chainCombat || !Number.isSafeInteger(points) || points<0
    || !(outcome==='victory' && health.enemy===0 && health.hero>0
      || outcome==='defeat' && health.hero===0 && health.enemy>0))return false;
 clearBattleDialogue(run);
 breakFlawless(run);
 run.streak=0;
 if(outcome==='defeat'){
  run.lives=0;
  run.status='gameover';
  run.endedAt=new Date().toISOString();
  return true;
 }
 const previous=rankLabel(rankFor(masteryCompleted(run)));
 run.completed=level;
 run.rankHighWater=masteryCompleted(run);
 run.bosses++;
 run.score+=points+levelConfig(level).bonus;
 const current=rankLabel(rankFor(masteryCompleted(run)));
 run.lastPromotion=current===previous?null:current;
 run.status='levelup';
 return true;
}
