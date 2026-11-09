import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRun,beginLevel,nextLevel,retryLevel,validRun,submit,advance} from '../dist/engine.js';
import {PreceptAttempt} from '../dist/precept-battle.js';
import {gatekeeperBattle,settleGatekeeper} from '../dist/gatekeeper-chains.js';
import {approvedGatekeeperChallenges} from '../dist/gatekeeper-approved.js';
import {questions} from '../dist/questions.js';
import {booksForStudy} from '../dist/study-paths.js';
import {emptyProfile,loadProfile,captureProgress} from '../dist/storage.js';
import {encodeProfile,decodeProfile} from '../dist/cloud-progress.js';

const read = path => readFile(new URL(path,import.meta.url));
const draft = JSON.parse(await read('../content/gatekeeper-chains-draft.json'));
const review = (await read('../content/GATEKEEPER_CHAINS_REVIEW.md')).toString('utf8');
const approvedSource = JSON.parse(await read('../content/launch/scripture-evidence.json')).source;
assert.deepEqual(draft.source,approvedSource);
assert.equal(draft.status,'pending-editorial-review');
assert.equal(draft.challenges.length,8);
assert.equal(new Set(draft.challenges.map(c=>c.id)).size,8);
assert.deepEqual(approvedGatekeeperChallenges,draft.challenges.map(c=>({...c,status:'approved'})),'Published records must exactly match the reviewed source except approval status');
assert.ok(!questions.some(q=>q.id.startsWith('GK-CHAIN-')));
for(const stage of [0,1,2]){
 const keys=draft.challenges.map(c=>stage?c.supports[stage-1].correct:c.correct);
 assert.equal(keys.filter(key=>key==='A').length,4,'Editorial keys must be balanced at every stage');
}
const full = await read('../.verification/launch/kjv-vpl/eng-kjv_vpl.txt').catch(error=>{
 if(error.code!=='ENOENT')throw error;
 return null;
});
if(full){
 assert.equal(createHash('sha256').update(full).digest('hex'),draft.source.textSha256);
 const lines=new Set(full.toString('utf8').split(/\r?\n/));
 for(const [key,{verse}] of Object.entries(draft.evidence))assert.ok(lines.has(`${key} ${verse}`),key);
}
for(const challenge of draft.challenges){
 assert.equal(challenge.status,'pending-editorial-review');
 assert.ok(challenge.claim.endsWith('?') && challenge.editorialNotes);
 assert.ok(review.includes(challenge.claim) && review.includes(challenge.editorialNotes));
 const lengths=challenge.choices.map(choice=>choice.argument.trim().split(/\s+/).length);
 assert.ok(lengths.every(length=>length>=15 && length<=30));
 assert.ok(Math.abs(lengths[0]-lengths[1])<=5);
 assert.equal(challenge.supports.length,2);
 for(const [i,round] of [challenge,...challenge.supports].entries()){
  assert.deepEqual(round.choices.map(c=>c.id),['A','B']);
  assert.equal(round.choices.filter(c=>c.id===round.correct).length,1);
  assert.ok(round.choices.every(c=>c.feedback && (i?c.scripture:c.argument)));
  for(const choice of round.choices){
   const keyLabel=choice.id===round.correct?' · Proposed strongest':'';
   assert.ok(review.includes(`**${choice.id}${keyLabel}**. ${i?'“'+choice.scripture.quote+'”':choice.argument}`));
   assert.ok(review.includes(choice.feedback));
  }
 }
 const support=challenge.supports.flatMap(r=>r.choices.map(c=>c.scripture));
 assert.equal(new Set(support.map(s=>s.key)).size,4);
 assert.deepEqual(challenge.citations,challenge.supports.map(round=>{
  const {reference:label,url}=round.choices.find(choice=>choice.id===round.correct).scripture;
  return {label,url};
 }));
 for(const scripture of [challenge.romanScripture,...support]){
  const evidence=draft.evidence[scripture.key];
  assert.equal(evidence.reference,scripture.reference);
  assert.equal(evidence.url,scripture.url);
  assert.ok(evidence.verse.replace(/[\[\]¶]/g,'').includes(scripture.quote),scripture.reference);
  const [,book,chapter]=scripture.reference.match(/^(.+) (\d+):\d+$/);
  assert.equal(scripture.url,`https://www.kingjamesbibleonline.org/${book.replaceAll(' ','-')}-Chapter-${chapter}/`);
  for(const path of challenge.paths)for(const collection of challenge.collections)assert.ok(booksForStudy(collection,path).has(book));
 }
}
const pool=approvedGatekeeperChallenges;
function runAt(level,path='complete',collection='kjv80'){
 const run=createRun(questions,'GATEKEEPER QA',()=>.42,collection,path);
 run.level=level;run.completed=level-1;
 beginLevel(run,questions,()=>.42);
 return run;
}
for(const collection of ['kjv66','kjv80'])for(const path of ['complete','ot','nt']){
 let last=null,firstDifficulty;
 for(const level of [5,10,15,20,25,30,35]){
  const run=runAt(level,path,collection);
  assert.equal(gatekeeperBattle(run,draft.challenges),null);
  const first=gatekeeperBattle(run,pool).chains[0].exchanges[0];
  assert.notEqual(first.id,last);
  assert.ok(first.paths.includes(path));
  firstDifficulty??=first.difficulty;
  if(level===35)assert.ok(first.difficulty>firstDifficulty);
  last=first.id;
 }
}
const ordinary=runAt(4);
assert.equal(gatekeeperBattle(ordinary,pool),null);
const legacy=runAt(5);
submit(legacy,questions,questions.find(q=>q.id===legacy.queue[0].id).answer);
advance(legacy,questions);
assert.equal(gatekeeperBattle(legacy,pool),null,'An in-progress legacy quiz finishes using its original queue');
const profile=emptyProfile(),run=profile.run=runAt(75);
run.score=24000;
const battle=gatekeeperBattle(run,pool);
const attempt=new PreceptAttempt(battle);
const answer=(arena,id)=>{assert.ok(arena.select(id));assert.equal(arena.select(id),false);assert.ok(arena.impact());assert.equal(arena.impact(),false);arena.finish();arena.proceed();};
assert.equal(settleGatekeeper(run,75,attempt),false);
for(let i=0;i<5;i++)answer(attempt,attempt.round.choices.find(c=>c.id!==attempt.round.correct).id);
assert.ok(settleGatekeeper(run,75,attempt));
assert.deepEqual([run.completed,run.level,run.lives,run.score,run.status],[74,75,0,24000,'gameover']);
const restored=decodeProfile(encodeProfile(profile),questions);
assert.equal(restored.run.status,'gameover');
assert.ok(retryLevel(restored.run,questions,()=>.42));
const retry=new PreceptAttempt(gatekeeperBattle(restored.run,pool));
assert.deepEqual(retry.health,{hero:100,enemy:100});
for(let i=0;i<15;i++)answer(retry,retry.round.correct);
assert.ok(settleGatekeeper(restored.run,75,retry));
assert.equal(settleGatekeeper(restored.run,75,retry),false);
assert.deepEqual([restored.run.completed,restored.run.bosses,restored.run.score,restored.run.status],[75,1,30250,'levelup']);
captureProgress(restored,restored.run);
assert.ok(restored.armor.unlocked.includes('belt'),'The existing Level 75 armor reward is recorded');
const local=loadProfile({getItem:()=>encodeProfile(restored)},questions);
const cloud=decodeProfile(encodeProfile(restored),questions);
assert.deepEqual(local.run,cloud.run);
assert.ok(validRun(local.run,questions));
assert.ok(nextLevel(local.run,questions,()=>.42));
assert.equal(local.run.level,76);
assert.equal(gatekeeperBattle(local.run,pool),null);
const promotionRun=runAt(35);
const promotion=new PreceptAttempt(gatekeeperBattle(promotionRun,pool));
for(let i=0;i<15;i++)answer(promotion,promotion.round.correct);
assert.ok(settleGatekeeper(promotionRun,35,promotion));
assert.equal(promotionRun.lastPromotion,'Student');
console.log('PASS Gatekeeper chains: verified drafts, approval isolation, paths and rotation, legacy restore, terminal-only rewards, failed cloud restore/retry, milestone persistence and regular-level return.');
