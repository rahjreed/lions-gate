import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PreceptAttempt} from '../dist/precept-battle.js';
import {sabbathBattle} from '../dist/precept-sabbath.js';

const source = await readFile(new URL('../content/PRECEPT_BATTLE_SABBATH_PILOT.md',import.meta.url),'utf8');
assert.deepEqual(sabbathBattle.chains.map(chain=>chain.exchanges.length),[5,5]);
const blocks = source.split(/^### /m).slice(1);
const exchanges = sabbathBattle.chains.flatMap(chain=>chain.exchanges);
assert.equal(new Set(exchanges.map(exchange=>exchange.id)).size,10);
for (const [index,exchange] of exchanges.entries()) {
 const block = blocks[index];
 assert.ok(block.startsWith(exchange.id));
 assert.ok(block.includes(`**Roman:** “${exchange.claim}”`));
 assert.equal(new Set(exchange.choices.map(option=>option.text)).size,4);
 for (const {id,text} of exchange.choices) assert.ok(block.includes(`- ${id}. ${text}`));
 assert.ok(block.includes(`**Key ${exchange.correct}.** ${exchange.explanation}`));
 assert.ok(exchange.citations.length);
 for (const {label,url} of exchange.citations) assert.ok(block.includes(`[${label}](${url})`));
}
const arena = new PreceptAttempt(sabbathBattle,()=>.2);
assert.deepEqual(arena.health,{enemy:100,lives:5});
function answer(attempt,id) {
 assert.equal(attempt.select(id),true);
 assert.equal(attempt.select(id),false);
 attempt.proceed();
 assert.equal(attempt.phase,'animating');
 assert.equal(attempt.impact(),true);
 assert.equal(attempt.impact(),false);
 attempt.finish();
 assert.equal(attempt.phase,'feedback');
 attempt.proceed();
}
for(let miss=0;miss<4;miss++) {
 answer(arena,arena.exchange.choices.find(option=>option.id!==arena.exchange.correct).id);
 assert.equal(arena.index,0);
 assert.deepEqual(arena.health,{enemy:100,lives:4-miss});
}
for (let index=0;index<10;index++) {
 assert.equal(arena.exchange.id,exchanges[index].id);
 answer(arena,arena.exchange.correct);
 assert.deepEqual(arena.health,{enemy:90-index*10,lives:1});
 assert.equal(arena.phase,index===9?'victory':'answering');
}
assert.equal(arena.select(arena.exchange.correct),false);
const retry = new PreceptAttempt(sabbathBattle);
for (let miss=0;miss<5;miss++) answer(retry,retry.exchange.choices.find(option=>option.id!==retry.exchange.correct).id);
assert.equal(retry.phase,'defeat');
assert.deepEqual(retry.health,{enemy:100,lives:0});
assert.equal(retry.index,0);
assert.deepEqual(new PreceptAttempt(sabbathBattle).health,{enemy:100,lives:5});
console.log('PASS Precept Battle: exact Sabbath pilot, two ordered chains, ten hits, five lives, retries, defeat and duplicate-input guards.');
