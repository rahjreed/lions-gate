import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
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
const reversed = new PreceptAttempt(sabbathBattle,()=>.999);
for (const [index,exchange] of arena.exchanges.entries()) {
 assert.equal(exchange.choices.length,2);
 assert.equal(exchange.choices.filter(option=>option.id===exchange.correct).length,1);
 for (const choice of exchange.choices) assert.ok(exchanges[index].choices.includes(choice));
 assert.deepEqual(exchange.choices.map(choice=>choice.id),reversed.exchanges[index].choices.map(choice=>choice.id).reverse());
}
assert.deepEqual(arena.health,{enemy:100,hero:100});
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
 assert.deepEqual(arena.health,{enemy:100,hero:80-miss*20});
}
for (let index=0;index<10;index++) {
 assert.equal(arena.exchange.id,exchanges[index].id);
 answer(arena,arena.exchange.correct);
 assert.deepEqual(arena.health,{enemy:90-index*10,hero:20});
 assert.equal(arena.phase,index===9?'victory':'answering');
}
assert.equal(arena.select(arena.exchange.correct),false);
const retry = new PreceptAttempt(sabbathBattle);
for (let miss=0;miss<5;miss++) answer(retry,retry.exchange.choices.find(option=>option.id!==retry.exchange.correct).id);
assert.equal(retry.phase,'defeat');
assert.deepEqual(retry.health,{enemy:100,hero:0});
assert.equal(retry.index,0);
assert.deepEqual(new PreceptAttempt(sabbathBattle).health,{enemy:100,hero:100});
const closeWin = new PreceptAttempt(sabbathBattle);
for (let i=0;i<3;i++) answer(closeWin,closeWin.exchange.choices.find(option=>option.id!==closeWin.exchange.correct).id);
for (let i=0;i<10;i++) answer(closeWin,closeWin.exchange.correct);
assert.equal(closeWin.phase,'victory');
assert.deepEqual(closeWin.health,{enemy:0,hero:40});
const closeLoss = new PreceptAttempt(sabbathBattle);
for (let i=0;i<4;i++) answer(closeLoss,closeLoss.exchange.correct);
for (let i=0;i<5;i++) answer(closeLoss,closeLoss.exchange.choices.find(option=>option.id!==closeLoss.exchange.correct).id);
assert.equal(closeLoss.phase,'defeat');
assert.deepEqual(closeLoss.health,{enemy:60,hero:0});
console.log('PASS Precept Battle: exact Sabbath pilot, two ordered chains, ten hits, percentage health, retries, defeat and duplicate-input guards.');

const readJSON = async path => JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const draft = await readJSON('../content/precept-sabbath-v2-draft.json');
const {source:kjv,evidence} = await readJSON('../content/precept-sabbath-v2-kjv-evidence.json');
const {source:approvedKjv} = await readJSON('../content/launch/scripture-evidence.json');
assert.deepEqual(kjv,approvedKjv);
// The checked-in verse subset supports offline CI. Verify it against the full
// pinned edition whenever the editorial source archive has been extracted.
const fullSource = await readFile(new URL('../.verification/launch/kjv-vpl/eng-kjv_vpl.txt',import.meta.url))
 .catch(error=>{if(error.code!=='ENOENT')throw error;return null;});
if(fullSource){
 assert.equal(createHash('sha256').update(fullSource).digest('hex'),kjv.textSha256);
 const lines = new Set(fullSource.toString('utf8').split(/\r?\n/));
 for(const [key,{verse}] of Object.entries(evidence))assert.ok(lines.has(`${key} ${verse}`),key);
}
assert.equal(draft.status,'pending-editorial-review');
assert.deepEqual(draft.chains.map(chain=>chain.exchanges.length),[5,5]);
const proposed = draft.chains.flatMap(chain=>chain.exchanges);
assert.equal(new Set(proposed.map(exchange=>exchange.id)).size,10);
function verifyLink(reference,url){
 const match = reference.match(/^((?:[1-3] )?[A-Za-z]+(?: [A-Za-z]+)*) ([1-9]\d*):[1-9]\d*(?:[–-][1-9]\d*)?(?:, [1-9]\d*[–-][1-9]\d*)?$/);
 assert.ok(match,reference);
 assert.equal(url,`https://www.kingjamesbibleonline.org/${match[1].replaceAll(' ','-')}-Chapter-${match[2]}/`);
}
function verifyQuotation(scripture){
 const verse = evidence[scripture.key];
 assert.ok(verse && scripture.quote.trim());
 assert.equal(scripture.reference,verse.reference);
 assert.equal(scripture.url,verse.url);
 assert.ok(verse.verse.replace(/[\[\]¶]/g,'').includes(scripture.quote),scripture.reference);
 verifyLink(scripture.reference,scripture.url);
}
for(const [index,exchange] of proposed.entries()){
 const {romanScripture,choices,correct} = exchange;
 verifyQuotation(romanScripture);
 assert.deepEqual(choices.map(choice=>choice.id),['A','B']);
 assert.equal(new Set(choices.map(choice=>choice.argument)).size,2);
 assert.equal(choices.filter(choice=>choice.id===correct).length,1);
 for(const choice of choices){
  const words = choice.argument.trim().split(/\s+/).length;
  assert.ok(words>=12 && words<=22,choice.argument);
  assert.ok(choice.feedback.trim(),exchange.id);
  verifyQuotation(choice.scripture);
 }
 assert.ok(exchange.claim.trim() && exchange.explanation.trim() && exchange.editorialNotes.trim());
 assert.deepEqual(exchange.citations,exchanges[index].citations,'Retain the pilot evidence trail');
 for(const {label,url} of exchange.citations)verifyLink(label,url);
}
const dist = new URL('../dist/',import.meta.url);
const publicFiles = await readdir(dist);
assert.ok(!publicFiles.some(name=>/precept.*(?:draft|evidence)/i.test(name)));
for(const name of publicFiles.filter(name=>name.endsWith('.js'))){
 const text=await readFile(new URL(name,dist),'utf8');
 assert.doesNotMatch(text,/precept-sabbath-v2|PB-SAB-\d+-V2/);
}
for(const random of [()=>0,()=>.999]){
 const attempt=new PreceptAttempt(draft,random);
 assert.equal(attempt.exchange.choices[random()===0?0:1].id,attempt.exchange.correct);
}
console.log('PASS V2 draft: ten excluded exchanges, 20 argument-first choices, shuffled keys, individual feedback and exact pinned KJV excerpts.');
