import assert from 'node:assert/strict';
import {opponentFor} from '../dist/opponents.js';
import {combatHealthMarkup} from '../dist/combat.js';
import {createRun,submit,advance,nextLevel} from '../dist/engine.js';
import {emptyProfile,captureProgress,saveProfile,loadProfile} from '../dist/storage.js';
import {questions} from '../dist/questions.js';

assert.equal(opponentFor(1).name,'Marcus the Proud');
assert.equal(opponentFor(2).name,'Titus the Deceiver');
assert.equal(opponentFor(5).name,'The Iron Gatekeeper');
assert.equal(opponentFor(10).name,'The Crimson Guardian');
const regular=new Set(),bosses=new Set();let previousRegular,previousBoss;
for(let level=1;level<=100000;level++){
 const opponent=opponentFor(level);
 assert.deepEqual(opponentFor(level),opponent);
 assert.equal(opponent.boss,level%5===0);
 assert.ok(opponent.name.length<=32);
 if(opponent.boss){assert.notEqual(opponent.name,previousBoss);previousBoss=opponent.name;bosses.add(opponent.name)}
 else{assert.notEqual(opponent.name,previousRegular);previousRegular=opponent.name;regular.add(opponent.name)}
}
assert.equal(regular.size,1024);assert.equal(bosses.size,64);
for(const name of bosses)assert.ok(!regular.has(name));
for(const level of [Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER-1,10**12,10**12+1])assert.equal(opponentFor(level).boss,level%5===0);
for(const level of [0,-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>opponentFor(level),RangeError);

const run=createRun(questions),profile=emptyProfile(),storage={data:null,getItem(){return this.data},setItem(key,value){this.data=value}};
for(let level=1;level<=6;level++){
 const before=structuredClone(run),name=opponentFor(run.level).name;
 assert.ok(combatHealthMarkup(run).includes(`aria-label="${name} health"`));
 assert.deepEqual(run,before,'Naming/rendering cannot mutate gameplay');
 captureProgress(profile,run);saveProfile(storage,profile);
 const restored=loadProfile(storage,questions).run;
 assert.deepEqual(restored,run);assert.equal(opponentFor(restored.level).name,name);
 for(let i=0;i<10;i++){const q=questions.find(q=>q.id===run.queue[run.index].id);submit(run,questions,q.answer);advance(run,questions)}
 assert.equal(opponentFor(run.level).name,name,'Name stays fixed through answer/reveal/clear');
 nextLevel(run,questions);assert.notEqual(opponentFor(run.level).name,name);
}
console.log('PASS opponents: 1024 regular names, 64 separate boss titles, 100000 levels, no adjacent repeats, safe-integer extremes, save/restore, transitions and immutable gameplay.');
