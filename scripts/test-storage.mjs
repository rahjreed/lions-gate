import assert from 'node:assert/strict';
import {questions} from '../dist/questions.js';
import {createRun,submit,advance,nextLevel,rankFor,validRun,levelConfig,selectQuestions} from '../dist/engine.js';
import {loadProfile,saveProfile,captureProgress,emptyProfile,localScores,cleanNickname} from '../dist/storage.js';
const fake={data:null,getItem(){return this.data},setItem(k,v){this.data=v}};
let p=emptyProfile(),r=createRun(questions,'TEST');assert.equal(validRun(r,questions),true);
captureProgress(p,r);assert.equal(saveProfile(fake,p),true);assert.deepEqual(loadProfile(fake,questions).run,r);
assert.equal(saveProfile({setItem(){throw Error()}},p),false);
assert.equal(loadProfile({getItem:()=>'{bad'},questions).run,null);
assert.equal(cleanNickname('<script>bad</script>'),'scriptbadscript');
const seen=new Set();let promotions=[];
for(let level=1;level<=61;level++){
 assert.equal(r.level,level);assert.equal(new Set(r.queue.map(q=>q.id)).size,10);
 if(level===1)assert.ok(r.queue.every(entry=>questions.find(q=>q.id===entry.id).difficulty===1));
 for(let i=0;i<10;i++){const q=questions.find(q=>q.id===r.queue[r.index].id);seen.add(q.id);submit(r,questions,q.answer);advance(r,questions)}
 if(r.lastPromotion)promotions.push([r.completed,r.lastPromotion]);
 captureProgress(p,r);saveProfile(fake,p);assert.deepEqual(loadProfile(fake,questions).run,r);
 nextLevel(r,questions);
}
assert.equal(seen.size,30);assert.equal(r.completed,61);assert.equal(rankFor(r.completed).degree,2);assert.equal(r.bosses,12);assert.equal(r.perfects,61);
assert.ok(promotions.some(([n])=>n===5));assert.ok(promotions.some(([n])=>n===50));assert.ok(promotions.some(([n])=>n===60));
assert.ok(p.badges.includes('Master'));assert.equal(p.bestCompleted,61);
for(let i=0;i<3;i++){submit(r,questions,-1);advance(r,questions)}captureProgress(p,r);captureProgress(p,r);assert.equal(p.records.length,1);assert.equal(r.status,'gameover');assert.equal(localScores(p).length,1);
p.records.push({id:'old',nickname:'OLD',score:10,completed:0,endedAt:'2000-01-01T00:00:00.000Z'});assert.equal(localScores(p,'week',new Date(r.endedAt)).length,1);
const malformed=structuredClone(r);malformed.answers=[{id:'missing'}];assert.equal(validRun(malformed,questions),false);
assert.equal(levelConfig(100000).boss,true);assert.equal(levelConfig(100001).difficulty,3);
const used=Object.fromEntries(questions.map((q,i)=>[q.id,{count:2,last:i}]));assert.equal(selectQuestions(questions,{level:101,history:used})[0].id,questions[0].id);
console.log('PASS Phase 4: 61 perfect levels, all 30 questions seen, 12 bosses, promotions at 5/50/60, degree 2, saved-run roundtrips, corrupt-save fallback, blocked storage, badge persistence, score deduplication, UTC weekly filter, spaced repetition.');
