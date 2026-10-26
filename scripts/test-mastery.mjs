import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {questions} from '../dist/questions.js';
import {rankFor,rankLabel,rankProgress,legacyRankFor,wardrobeFor,masteryCompleted,rankMilestones,createRun,beginLevel,submit,advance,nextLevel,retryLevel,validRun} from '../dist/engine.js';
import {emptyProfile,captureProgress,loadProfile,saveProfile,localScores} from '../dist/storage.js';
import {judah,judahJourney} from '../dist/mascot.js';
import {armorCatalog,reconcileArmor} from '../dist/armor.js';
const store=()=>({data:null,getItem(){return this.data},setItem(key,value){this.data=value}});
const at=level=>{const run=createRun(questions,'MASTERY');run.level=level;run.completed=level-1;return beginLevel(run,questions,()=>.42)};
const finish=run=>{for(let n=0;n<10;n++){const q=questions.find(q=>q.id===run.queue[run.index].id);submit(run,questions,q.answer);advance(run,questions)}};
assert.deepEqual(rankMilestones,[0,35,110,185,260]);
for(const [level,name,degree] of [[35,'Student',0],[110,'Scholar',0],[185,'Scribe',0],[260,'Master',1],[335,'Master',2],[410,'Master',3],[485,'Master',4],[560,'Master',5]]){
 const run=at(level),p=emptyProfile(),s=store();captureProgress(p,run);
 assert.equal(rankProgress(level-1).remaining,1);assert.notEqual(rankLabel(rankFor(level-1)),rankLabel({name,degree}));
 for(let n=0;n<9;n++){const q=questions.find(q=>q.id===run.queue[run.index].id);submit(run,questions,q.answer);advance(run,questions);}
 const q=questions.find(q=>q.id===run.queue[9].id);submit(run,questions,q.answer);assert.equal(run.completed,level-1);assert.equal(run.lastPromotion,null,'Answer feedback alone cannot promote');
 advance(run,questions);captureProgress(p,run);assert.equal(run.lastPromotion,rankLabel({name,degree}));assert.equal(rankProgress(level).remaining,75);
 saveProfile(s,p);assert.deepEqual(loadProfile(s,questions).run,run);assert.equal(advance(run,questions),false,'Repeated clear does not replay promotion');
 const badges=[...p.badges],score=run.score;captureProgress(p,run);assert.deepEqual(p.badges,badges);assert.equal(run.score,score);
 const replay=at(level);captureProgress(p,replay);finish(replay);assert.equal(replay.lastPromotion,null,'Replaying a milestone below the saved high-water mark cannot re-promote');
 const failed=at(level);for(let n=0;n<3;n++){submit(failed,questions,-1);advance(failed,questions);}assert.equal(failed.lastPromotion,null);assert.equal(failed.completed,level-1);assert.equal(retryLevel(failed,questions),true);finish(failed);assert.equal(failed.lastPromotion,rankLabel({name,degree}));
}
const old=emptyProfile();delete old.mastery;old.bestCompleted=61;old.bestScore=9000;old.badges=['Student','Master','Flawless'];old.run=at(62);old.run.score=9000;old.run.lastPromotion='Master · 2nd Degree';delete old.run.rankHighWater;
old.records=[{id:'old-record',nickname:'OLD',score:8000,completed:50,level:51,endedAt:'2026-10-25T00:00:00Z'}];
const s=store();saveProfile(s,old);const migrated=loadProfile(s,questions);
assert.deepEqual(migrated.badges,old.badges);assert.deepEqual(migrated.records,old.records);assert.equal(migrated.bestScore,9000);assert.equal(migrated.bestCompleted,61);assert.equal(migrated.run.lastPromotion,null);
assert.deepEqual(migrated.mastery,{version:2,legacyCompleted:61,legacyRecords:[{id:'old-record',completed:50}]});assert.equal(rankFor(61).name,'Student');assert.equal(legacyRankFor(61).degree,2);assert.equal(wardrobeFor(61,61),'Master');
saveProfile(s,migrated);assert.deepEqual(loadProfile(s,questions),migrated,'Migration is stable and does not reinterpret new progress as legacy');
const newRun=createRun(questions);captureProgress(migrated,newRun);assert.equal(masteryCompleted(newRun),61);assert.equal(wardrobeFor(migrated.bestCompleted,migrated.mastery.legacyCompleted),'Master');
const modern=emptyProfile();modern.bestCompleted=61;saveProfile(s,modern);assert.equal(loadProfile(s,questions).mastery.legacyCompleted,0,'New-policy progress must not acquire old Master honors');
const recovered=emptyProfile();recovered.run=createRun(questions);recovered.run.rankHighWater=260;saveProfile(s,recovered);assert.equal(loadProfile(s,questions).bestCompleted,260,'A valid saved high-water checkpoint keeps profile rank and wardrobe consistent');
for(const completed of [260,335,10000,1000000,Number.MAX_SAFE_INTEGER]){const degree=Number((BigInt(completed)-260n)/75n+1n);assert.equal(rankFor(completed).degree,degree);const progress=rankProgress(completed);assert.ok(progress.remaining>=1&&progress.remaining<=75);assert.equal(progress.max,75);assert.ok(rankLabel(rankFor(completed)).includes(String(degree)));}
for(const pose of ['idle','ready','slash','recoil','victory','walk','run','transform']){const art=judah(61,pose,true,['belt'],wardrobeFor(61,61));assert.ok(art.includes('judah-master'));assert.ok(art.includes('Legacy Master wardrobe'));assert.ok(art.includes('Belt of Truth'));}
const collection=judahJourney(61,['belt'],61);assert.ok(collection.includes('LEGACY UNLOCK'));for(const n of [110,185,260])assert.ok(judahJourney(0).includes(`CLEAR ${n} LEVELS`));
assert.deepEqual([...armorCatalog].sort((a,b)=>a.level-b.level).map(i=>[i.id,i.level]),[['belt',75],['shoes',150],['breastplate',225],['sword',300],['shield',375],['helmet',450]]);
for(const completed of [74,75,149,150,224,225,299,300,374,375,449,450]){const p=emptyProfile();p.bestCompleted=completed;reconcileArmor(p);assert.deepEqual(p.armor.unlocked,completed>=75?['belt']:[],'Unimplemented armor remains planned');}
const ordering=emptyProfile();ordering.records=[{id:'a',score:100,completed:35,endedAt:'2026-10-25T00:00:00Z'},{id:'b',score:100,completed:335,endedAt:'2026-10-25T00:00:00Z'}];assert.deepEqual(localScores(ordering).map(r=>r.id),['b','a']);
const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');for(const obsolete of ['Each further ten levels','Clear five levels','Clear fifty levels','Novice: levels 1–5'])assert.ok(!app.includes(obsolete));assert.ok(app.includes('legacyRecords'));assert.ok(app.includes('rankProgress(masteryCompleted(run))'));
console.log('PASS mastery: all promotion boundaries and feedback/defeat/retry gates; no repeated promotions; stable version-3 migration with legacy wardrobe/honors; unchanged scores/records/armor; current Hall ordering; all poses and unlimited safe-integer degrees.');
