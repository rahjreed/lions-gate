import assert from 'node:assert/strict';
import {questions} from '../dist/questions.js';
import {createRun,beginLevel,submit,advance,nextLevel,retryLevel,canRetryLevel,rankFor,levelConfig,usePower,validRun} from '../dist/engine.js';
import {emptyProfile,captureProgress,saveProfile,loadProfile} from '../dist/storage.js';
import {combatHealth} from '../dist/combat.js';
import {answerRevealMarkup} from '../dist/answer-reveal.js';
const answer=(r,correct)=>{const q=questions.find(q=>q.id===r.queue[r.index].id);assert.equal(submit(r,questions,correct?q.answer:-1),true);advance(r,questions)};
const stored=()=>({data:null,getItem(){return this.data},setItem(key,value){this.data=value}});
for(const level of [1,5,75,120]){
 const run=createRun(questions,'RETRY TEST');run.level=level;run.completed=level-1;run.score=9000;run.powers={fifty:1,time:1,shield:1};beginLevel(run,questions);
 const identity={id:run.id,completed:run.completed,rank:rankFor(run.completed)},profile=emptyProfile(),storage=stored(),boss=levelConfig(level).boss;
 assert.equal(retryLevel(run,questions),false);
 answer(run,true);answer(run,true);const banked=run.score;
 usePower(run,questions,'fifty');usePower(run,questions,'time');usePower(run,questions,'shield');
 answer(run,false);assert.equal(run.lives,3);for(let i=0;i<3;i++)answer(run,false);
 assert.equal(canRetryLevel(run),true);assert.equal(run.status,'gameover');
 captureProgress(profile,run);saveProfile(storage,profile);let loaded=loadProfile(storage,questions).run;
 assert.equal(canRetryLevel(loaded),true);assert.equal(loaded.level,level);assert.equal(loaded.score,banked);
 const previousQueue=run.queue.map(q=>q.id);assert.equal(retryLevel(run,questions),true);
 assert.equal(retryLevel(run,questions),false,'Double retry cannot reset an active attempt');
 assert.equal(run.level,level);assert.equal(run.completed,identity.completed);assert.equal(run.id,identity.id);assert.deepEqual(rankFor(run.completed),identity.rank);
 assert.equal(run.score,banked);assert.equal(run.lives,3);assert.equal(run.index,0);assert.deepEqual(run.answers,[]);assert.equal(run.remaining,levelConfig(level).seconds);
 assert.deepEqual(run.powers,{fifty:1,time:1,shield:1});assert.equal(run.shielded,false);assert.deepEqual(run.eliminated,[]);assert.equal(run.streak,0);assert.equal(run.lastPromotion,null);assert.equal(run.endedAt,undefined);
 assert.deepEqual(combatHealth(run),{hits:0,enemy:100,lives:3});assert.ok(run.queue.some(q=>!previousQueue.includes(q.id)),'Prefer fresh questions when possible');
 captureProgress(profile,run);assert.equal(profile.records.length,0,'An active retried run is not a completed leaderboard entry');saveProfile(storage,profile);
 assert.deepEqual(loadProfile(storage,questions).run,run,'Active checkpoint and reward ledger survive reopening');
 answer(run,true);answer(run,true);assert.equal(run.score,banked,'Repeated failed-attempt points are not paid twice');
 assert.ok(answerRevealMarkup({q:questions[0],last:{correct:true,earned:0},streak:2}).includes('POINTS ALREADY BANKED'));
 for(let attempt=0;attempt<3;attempt++){
  if(attempt>0){answer(run,true);answer(run,true)}
  for(let i=0;i<3;i++)answer(run,false);
  assert.equal(run.score,banked);assert.equal(retryLevel(run,questions),true);
 }
 // A better attempt earns only the difference; clearing awards the normal bonus once.
 for(let i=0;i<10;i++)answer(run,true);
 assert.equal(run.status,'levelup');assert.equal(run.completed,level);
 assert.equal(run.score,9000+2500*(boss?2:1)+levelConfig(level).bonus);
 assert.equal(run.perfects,1);assert.equal(run.bosses,boss?1:0);
 const cleared=structuredClone(run);assert.equal(advance(run,questions),false);assert.equal(retryLevel(run,questions),false);assert.deepEqual(run,cleared);
 nextLevel(run,questions);assert.equal(run.levelRewards.highWater,0);assert.equal(run.levelRewards.attempt,0);
 const before=run.score;answer(run,true);assert.ok(run.score>before,'The next level can earn new points normally');
 assert.equal(validRun(run,questions),true);
}
// Older version-3 saves can retry without losing their previous score or inventory.
const legacy=createRun(questions);answer(legacy,true);for(let i=0;i<3;i++)answer(legacy,false);delete legacy.levelRewards;
assert.equal(validRun(legacy,questions),true);const oldScore=legacy.score;retryLevel(legacy,questions);answer(legacy,true);assert.equal(legacy.score,oldScore);
const corrupt=structuredClone(legacy);corrupt.levelRewards.attempt=-1;assert.equal(validRun(corrupt,questions),false);
// Raise the attempt watermark, fail, reload, then prove the same improvement cannot be paid again.
const improved=createRun(questions),improvedStore=stored(),improvedProfile=emptyProfile();
answer(improved,true);for(let i=0;i<3;i++)answer(improved,false);retryLevel(improved,questions);
answer(improved,true);assert.equal(improved.score,100);answer(improved,true);assert.equal(improved.score,200);answer(improved,true);assert.equal(improved.score,400);
for(let i=0;i<3;i++)answer(improved,false);captureProgress(improvedProfile,improved);saveProfile(improvedStore,improvedProfile);
const again=loadProfile(improvedStore,questions).run;retryLevel(again,questions);for(let i=0;i<3;i++)answer(again,true);assert.equal(again.score,400);
// First-attempt incoming streak rewards stay banked even if a fresh retry cannot beat them.
const streaked=createRun(questions);streaked.streak=30;for(let i=0;i<7;i++)answer(streaked,true);for(let i=0;i<3;i++)answer(streaked,false);
assert.equal(streaked.score,3500);retryLevel(streaked,questions);for(let i=0;i<10;i++)answer(streaked,true);assert.equal(streaked.score,3500+levelConfig(1).bonus);
const retired=createRun(questions);retired.status='gameover';assert.equal(canRetryLevel(retired),false,'Deliberately ending a live run is not a defeat checkpoint');
console.log('PASS retry: regular/Gatekeeper/Master degrees, fresh queues, life/timer/shield/power reset, saved checkpoints, legacy saves, bounded rewards, single bonuses, next-level scoring and leaderboard deduplication.');
