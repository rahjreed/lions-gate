import assert from 'node:assert/strict';
import {questions} from '../dist/questions.js';
import {createRun,submit,advance,nextLevel,rankFor,levelConfig,selectQuestions,usePower,validRun,leaderboardSort,weekStart} from '../dist/engine.js';
const bank=questions;
const random=()=>.42;
let r=createRun(bank,'TEST',random);assert.equal(r.lives,3);assert.equal(validRun(JSON.parse(JSON.stringify(r)),bank),true);
for(let i=0;i<10;i++){const q=bank.find(q=>q.id===r.queue[r.index].id);assert.equal(submit(r,bank,q.answer),true);assert.equal(submit(r,bank,q.answer),false);advance(r,bank)}
assert.equal(r.status,'levelup');assert.equal(r.completed,1);assert.equal(r.perfects,1);assert.ok(r.score>1550);assert.equal(nextLevel(r,bank,random),true);assert.equal(r.level,2);
assert.equal(new Set(r.queue.map(q=>q.id)).size,10);
assert.equal(usePower(r,bank,'fifty'),true);assert.equal(r.eliminated.length,2);assert.equal(usePower(r,bank,'fifty'),false);
assert.equal(usePower(r,bank,'time'),true);assert.equal(r.remaining,55);
assert.equal(usePower(r,bank,'shield'),true);submit(r,bank,-1);assert.equal(r.lives,3);advance(r,bank);
for(let i=0;i<3;i++){submit(r,bank,-1);advance(r,bank)}assert.equal(r.status,'gameover');assert.equal(r.lives,0);assert.equal(nextLevel(r,bank),false);
for(const [completed,name,degree] of [[0,'Novice',0],[34,'Novice',0],[35,'Student',0],[110,'Scholar',0],[185,'Scribe',0],[260,'Master',1],[335,'Master',2],[410,'Master',3],[485,'Master',4],[560,'Master',5],[10000,'Master',130]]){assert.equal(rankFor(completed).name,name);assert.equal(rankFor(completed).degree,degree)}
assert.equal(levelConfig(5).boss,true);assert.equal(levelConfig(1000).boss,true);assert.equal(levelConfig(1001).difficulty,3);assert.ok(levelConfig(1001).seconds>=35);
for(let level=1;level<=2000;level++){const q=selectQuestions(bank,{level,history:{}});assert.equal(q.length,10);assert.equal(new Set(q.map(x=>x.id)).size,10)}
assert.equal(weekStart(new Date('2026-10-25T12:00:00Z')),'2026-10-19T00:00:00.000Z');
assert.ok(leaderboardSort({id:'a',score:100,completed:2,endedAt:'2026-01-01'},{id:'b',score:100,completed:1,endedAt:'2026-01-01'})<0);
console.log('PASS Phase 1: lives, timeout, multipliers, perfect bonus, level transitions, double-answer guard, powers, persistence shape, ranks through level 10001, 2000 generated stages, leaderboard ties.');
