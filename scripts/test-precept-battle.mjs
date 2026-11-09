import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {PreceptAttempt} from '../dist/precept-battle.js';
import {sabbathBattle} from '../dist/precept-sabbath.js';

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
const readJSON = async path => JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const draft = await readJSON('../content/precept-sabbath-v2-draft.json');
const review = await readFile(new URL('../content/PRECEPT_BATTLE_SABBATH_V2_REVIEW.md',import.meta.url),'utf8');
assert.deepEqual(sabbathBattle,{...draft,status:'approved',chains:draft.chains.map(c=>({...c,exchanges:c.exchanges.map(e=>({...e,status:'approved'}))}))});
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
assert.equal(draft.rules,'precept-chain');
assert.deepEqual(draft.chains.map(chain=>chain.exchanges.length),[5,5]);
const proposed = draft.chains.flatMap(chain=>chain.exchanges);
assert.equal(new Set(proposed.map(exchange=>exchange.id)).size,10);
assert.equal(new Set(proposed.flatMap(exchange=>exchange.supports.map(round=>round.prompt))).size,20);
for(const stage of [0,1,2])assert.equal(proposed.filter(e=>(stage?e.supports[stage-1]:e).correct==='A').length,5);
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
 const section=review.split('### '+exchange.id)[1].split('\n### ')[0];
 for(const text of [exchange.romanScripture.quote,exchange.claim,exchange.editorialNotes])assert.ok(section.includes(text));
 for(const [stage,round] of [exchange,...exchange.supports].entries()){
  if(stage)assert.ok(section.includes(round.prompt));
  for(const c of round.choices){
   const label=c.id===round.correct?' · Proposed strongest':'';
   assert.ok(section.includes(`**${c.id}${label}**. ${stage?'“'+c.scripture.quote+'”':c.argument}`));
   assert.ok(section.includes(c.feedback));
  }
 }
 const {romanScripture,choices,correct} = exchange;
 verifyQuotation(romanScripture);
 assert.deepEqual(choices.map(choice=>choice.id),['A','B']);
 assert.equal(new Set(choices.map(choice=>choice.argument)).size,2);
 assert.equal(choices.filter(choice=>choice.id===correct).length,1);
 for(const choice of choices){
  const words = choice.argument.trim().split(/\s+/).length;
  assert.ok(words>=15 && words<=30,choice.argument);
  assert.ok(choice.feedback.trim(),exchange.id);
 }
 assert.equal(exchange.supports.length,2);
 const used = new Set();
 for(const round of exchange.supports){
  assert.ok(round.prompt.trim());
  assert.deepEqual(round.choices.map(choice=>choice.id),['A','B']);
  assert.equal(round.choices.filter(choice=>choice.id===round.correct).length,1);
  for(const choice of round.choices){
   verifyQuotation(choice.scripture);
   assert.ok(choice.feedback.trim());
   assert.ok(!used.has(choice.scripture.key),'Use a different passage for each supporting choice');
   used.add(choice.scripture.key);
  }
 }
 assert.ok(exchange.claim.trim() && exchange.explanation.trim() && exchange.editorialNotes.trim());
 assert.ok(exchange.citations.length);
 for(const {label,url} of exchange.citations)verifyLink(label,url);
}
const dist = new URL('../dist/',import.meta.url);
const publicFiles = await readdir(dist);
assert.ok(!publicFiles.some(name=>/precept.*(?:draft|evidence)/i.test(name)));
for(const name of publicFiles.filter(name=>name.endsWith('.js'))){
 const text=await readFile(new URL(name,dist),'utf8');
 if(name!=='precept-sabbath.js')assert.doesNotMatch(text,/precept-sabbath-v2|PB-SAB-\d+-V2/);
}
const forward=new PreceptAttempt(sabbathBattle,()=>.999),backward=new PreceptAttempt(sabbathBattle,()=>0);
for(const [i,e] of forward.exchanges.entries()){
 assert.equal(e.correct,backward.exchanges[i].correct);
 assert.deepEqual(e.choices.map(c=>c.id),backward.exchanges[i].choices.map(c=>c.id).reverse());
}
console.log('PASS chain draft: ten exact approved exchanges, 20 opening choices, 40 supporting choices, shuffled keys and exact pinned KJV excerpts.');

const hit = attempt => answer(attempt,attempt.round.correct);
const miss = attempt => answer(attempt,attempt.round.choices.find(choice=>choice.id!==attempt.round.correct).id);
const chain = new PreceptAttempt(sabbathBattle);
miss(chain);
assert.deepEqual([chain.index,chain.stage,chain.health.hero,chain.health.enemy,chain.score],[0,0,80,100,0]);
hit(chain);
assert.deepEqual([chain.index,chain.stage,chain.health.enemy,chain.score],[0,1,90,100]);
miss(chain);
assert.deepEqual([chain.index,chain.stage,chain.health.hero,chain.health.enemy,chain.score],[1,0,80,90,100]);
hit(chain);hit(chain);
assert.deepEqual([chain.index,chain.stage,chain.health.enemy,chain.score],[1,2,75,250]);
miss(chain);
assert.deepEqual([chain.index,chain.stage,chain.health.hero,chain.health.enemy,chain.score],[2,0,80,75,250]);
hit(chain);hit(chain);hit(chain);
assert.deepEqual([chain.index,chain.stage,chain.health.enemy,chain.score],[3,0,55,650]);
const perfect = new PreceptAttempt(sabbathBattle);
for(let i=0;i<15;i++)hit(perfect);
assert.deepEqual([perfect.phase,perfect.health.enemy,perfect.score],['victory',0,2000]);
const defeated = new PreceptAttempt(sabbathBattle);
for(let i=0;i<5;i++)miss(defeated);
assert.deepEqual([defeated.phase,defeated.health.hero,defeated.health.enemy],['defeat',0,100]);
const smallPool = new PreceptAttempt({...sabbathBattle,chains:[{exchanges:[proposed[0]]}]});
for(let i=0;i<9;i++){hit(smallPool);miss(smallPool);assert.equal(smallPool.index,0);}
hit(smallPool);
assert.deepEqual([smallPool.phase,smallPool.health.enemy,smallPool.score],['victory',0,1000]);
const supportFinish = new PreceptAttempt(sabbathBattle);
hit(supportFinish);hit(supportFinish);miss(supportFinish);
hit(supportFinish);miss(supportFinish);
for(let i=0;i<3;i++){hit(supportFinish);hit(supportFinish);hit(supportFinish);}
hit(supportFinish);hit(supportFinish);
assert.deepEqual([supportFinish.phase,supportFinish.health.enemy,supportFinish.score],['victory',0,1600]);
console.log('PASS chain combat: all stage outcomes, exact score/damage, repeat guards, exhaustion fallback, perfect and partial wins, and defeat.');

const longBattle=new PreceptAttempt(sabbathBattle);
for(const exchange of proposed){assert.equal(longBattle.exchange.id,exchange.id);hit(longBattle);if(longBattle.phase!=='victory')miss(longBattle);}
assert.equal(longBattle.phase,'victory');
console.log('PASS standalone selection reaches all ten approved challenges when support stages are missed.');
