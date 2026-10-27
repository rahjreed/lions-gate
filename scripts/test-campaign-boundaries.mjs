// Preservation tests for the existing runtime, not a Kingdom feature implementation.
import assert from 'node:assert/strict';
import {questions} from '../dist/questions.js';
import {createRun,beginLevel,submit,advance,nextLevel,retryLevel,validRun,levelConfig,rankFor} from '../dist/engine.js';
import {knowledgeStage} from '../dist/knowledge.js';
import {armorCatalog,armorItems} from '../dist/armor.js';
import {emptyProfile,captureProgress,saveProfile,loadProfile} from '../dist/storage.js';

assert.deepEqual([...armorCatalog].sort((a,b)=>a.level-b.level).map(i=>[i.id,i.level]),[['belt',75],['shoes',150],['breastplate',225],['sword',300],['shield',375],['helmet',450]]);
assert.deepEqual(armorItems.map(i=>i.id),['belt'],'Planned campaign must not silently enable unfinished equipment');
const fixture=level=>{const r=createRun(questions,'BOUNDARY TEST',()=>.42);r.level=level;r.completed=level-1;return beginLevel(r,questions,()=>.42)};
const storage=()=>({data:null,getItem(){return this.data},setItem(key,value){this.data=value}});
for(const level of [449,450,451,525,526,699,700,701]){
 const run=fixture(level),profile=emptyProfile(),saved=storage();
 captureProgress(profile,run);saveProfile(saved,profile);
 assert.deepEqual(loadProfile(saved,questions).run,run,'High-level active checkpoint survives loading');
 assert.deepEqual(profile.armor.unlocked,['belt']);
 for(let i=0;i<10;i++){
  const q=questions.find(q=>q.id===run.queue[run.index].id);assert.equal(submit(run,questions,level===700&&i===0?-1:q.answer),true);
  assert.equal(run.completed,level-1,'Feedback alone is not successful completion');
  assert.equal(run.status,'feedback');assert.equal(advance(run,questions),true);
 }
 assert.equal(run.completed,level);assert.equal(run.status,'levelup');
 if(level===700){assert.equal(run.lives,4);assert.equal(run.perfects,0,'Successful Level 700 completion does not require a perfect level');}
 captureProgress(profile,run);saveProfile(saved,profile);assert.deepEqual(loadProfile(saved,questions).run,run);
 assert.equal(validRun(run,questions),true);assert.deepEqual(profile.armor.unlocked,['belt'],'Existing equipment survives all boundaries');
 assert.equal(nextLevel(run,questions,()=>.42),true);assert.equal(run.level,level+1);assert.equal(run.status,'playing');
 assert.equal(validRun(run,questions),true,'No new ending or save phase is introduced at 450 or 700');
}
assert.equal(levelConfig(700).boss,true);assert.equal(levelConfig(701).boss,false);
assert.equal(knowledgeStage(525).target,knowledgeStage(700).target,'Existing target saturation remains unchanged pending campaign approval');
const defeated=fixture(700),profile=emptyProfile(),saved=storage(),rank=rankFor(defeated.completed);
for(let i=0;i<5;i++){submit(defeated,questions,-1);advance(defeated,questions);}
captureProgress(profile,defeated);saveProfile(saved,profile);const loaded=loadProfile(saved,questions);
assert.equal(loaded.run.status,'gameover');assert.equal(loaded.run.completed,699);
assert.equal(retryLevel(loaded.run,questions,()=>.42),true);assert.equal(loaded.run.level,700);assert.equal(loaded.run.lives,5);
assert.deepEqual(rankFor(loaded.run.completed),rank);assert.deepEqual(loaded.armor.unlocked,['belt']);
console.log('PASS campaign boundaries: unchanged armor schedule; 449/450/451, 525/526, 699/700/701 clears, saves, ranks, retained belt, Level 700 defeat/retry and existing endless continuation. Kingdom entry remains design-only.');
