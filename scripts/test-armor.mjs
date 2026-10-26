import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {armorItems,armorCatalog,reconcileArmor,acknowledgeArmor,armorRevealMarkup,armorCollectionMarkup} from '../dist/armor.js';
import {createRun,submit,advance,nextLevel,retryLevel,rankFor} from '../dist/engine.js';
import {emptyProfile,captureProgress,saveProfile,loadProfile} from '../dist/storage.js';
import {judah} from '../dist/mascot.js';
import {questions} from '../dist/questions.js';
const p=emptyProfile(),r=createRun(questions),storage={data:null,getItem(){return this.data},setItem(key,value){this.data=value}};
const answer=(correct=true)=>{const q=questions.find(q=>q.id===r.queue[r.index].id);submit(r,questions,correct?q.answer:-1);advance(r,questions);captureProgress(p,r)};
while(r.level<75){for(let i=0;i<10;i++)answer();nextLevel(r,questions)}
captureProgress(p,r);assert.deepEqual(p.armor.unlocked,[],'Entering Level 75 does not unlock armor');
for(let i=0;i<3;i++)answer(false);assert.equal(r.status,'gameover');assert.deepEqual(p.armor.unlocked,[],'Defeat at the milestone does not unlock it');
retryLevel(r,questions);captureProgress(p,r);for(let i=0;i<9;i++)answer();
const q=questions.find(q=>q.id===r.queue[9].id);submit(r,questions,q.answer);captureProgress(p,r);assert.deepEqual(p.armor.unlocked,[],'Final answer feedback is not a successful clear');
advance(r,questions);const snapshot=structuredClone(r);captureProgress(p,r);
assert.deepEqual(p.armor,{unlocked:['belt'],pending:['belt']});assert.deepEqual(r,snapshot,'Cosmetics do not mutate gameplay');
const rank=rankFor(r.completed),score=r.score;captureProgress(p,r);captureProgress(p,r);assert.equal(r.score,score);assert.deepEqual(p.armor.pending,['belt']);
saveProfile(storage,p);const restored=loadProfile(storage,questions);assert.deepEqual(restored.armor,p.armor);assert.equal(acknowledgeArmor(restored,'belt'),true);assert.equal(acknowledgeArmor(restored,'belt'),false);
saveProfile(storage,restored);assert.deepEqual(loadProfile(storage,questions).armor,{unlocked:['belt'],pending:[]});
nextLevel(r,questions);for(let i=0;i<3;i++)answer(false);retryLevel(r,questions);captureProgress(restored,r);assert.deepEqual(restored.armor.unlocked,['belt']);assert.deepEqual(rankFor(r.completed),rank);
captureProgress(restored,createRun(questions));assert.deepEqual(restored.armor.unlocked,['belt'],'A deliberate new run keeps permanent equipment');
const legacy=emptyProfile();delete legacy.armor;legacy.bestCompleted=450;reconcileArmor(legacy);assert.deepEqual(legacy.armor.unlocked,['belt'],'Only the reviewed Belt milestone is enabled in this phase');
legacy.armor={unlocked:['belt','helmet','belt'],pending:['helmet']};reconcileArmor(legacy);assert.deepEqual(legacy.armor,{unlocked:['belt'],pending:[]});
for(const completed of [0,5,15,30,50,75,450])for(const pose of ['idle','success','reflection','advance','stance','ready','slash','recoil','walk','run','victory','celebrate','transform']){
 const html=judah(completed,pose,true,['belt']);assert.ok(html.includes('data-armor="belt"'));assert.ok(html.includes('Belt of Truth'));assert.ok(html.includes('--armor-sheet:'));
 assert.ok(!judah(completed,pose).includes('data-armor='),'No cosmetic layer before earning it');
 if(pose==='transform')assert.match(html,/class="rank-before" data-armor="belt"/);
}
const reveal=armorRevealMarkup(armorItems[0]);for(const fragment of ['Ephesians 6:14','aria-modal="true"','Belt of Truth','data-action="claim-armor"','does not change combat'])assert.ok(reveal.includes(fragment));
assert.deepEqual(armorCatalog.map(i=>[i.id,i.level]),[['belt',75],['breastplate',225],['shoes',150],['shield',300],['helmet',375],['sword',450]],'Passage order preserves the revised milestone levels');
assert.deepEqual(armorItems.map(i=>i.id),['belt'],'Display-only roadmap must not activate unfinished equipment');
const fresh={unlocked:[],pending:[]},owned={unlocked:['belt'],pending:[]};
for(const armor of [undefined,{},fresh,owned]){
 const before=JSON.stringify(armor),collection=armorCollectionMarkup(armor);assert.equal(JSON.stringify(armor),before,'Rendering cannot modify saved equipment');
 assert.equal((collection.match(/data-equipment=/g)||[]).length,6);
 for(const item of armorCatalog){assert.ok(collection.includes(item.name));assert.ok(collection.includes(item.reference));assert.ok(collection.includes(`Complete Level ${item.level}`));assert.ok(collection.includes(item.icon));}
 assert.equal((collection.match(/PLANNED · LOCKED/g)||[]).length,5);
 assert.equal((collection.match(/PERMANENTLY EQUIPPED/g)||[]).length,armor===owned?1:0);
}
assert.ok(!armorCollectionMarkup({unlocked:['helmet']}).includes('PERMANENTLY EQUIPPED'),'Unimplemented equipment cannot appear earned from arbitrary save data');
for(const item of armorCatalog){const icon=await readFile(new URL('../dist/'+item.icon,import.meta.url));if(item.icon.endsWith('.svg')){assert.ok(icon.toString().includes('shape-rendering="crispEdges"'));assert.ok(!/<script|<image|https?:\/\//.test(icon.toString().replace('http://www.w3.org/2000/svg','')),'Icons are self-contained original artwork');}}
// Every shipped frame has a fitted layer, outside face/hair, with unchanged base art.
const fit=JSON.parse(await readFile(new URL('../art/judah/belt-fit.json',import.meta.url),'utf8'));let frames=0,bytes=0;
for(const [file,info] of Object.entries(fit)){
 const base=await readFile(new URL('../dist/assets/console/'+file,import.meta.url));assert.equal(createHash('sha256').update(base).digest('hex'),info.sourceHash,'Base art changed: review/refit belt');
 const action=file.includes('adventure'),count=action?54:16,layer=await readFile(new URL('../dist/assets/armor/'+file.replace('judah-','belt-'),import.meta.url));
 assert.equal(layer.readUInt32BE(16),(action?256:192)*count);assert.equal(layer.readUInt32BE(20),action?352:320);assert.equal(info.frames.length,count);
 for(const frame of info.frames){frames++;assert.ok(frame.bounds[0]>=0&&frame.bounds[2]<=(action?256:192));assert.ok(frame.bounds[1]>=(action?200:140),'Layer must stay away from face/hair');assert.ok(frame.bounds[3]<(action?300:230))}
 if(action){assert.equal(info.frames[6].hash,info.frames[17].hash);assert.equal(info.frames[6].hash,info.frames[29].hash,'Recovery belt must match guard');}
 bytes+=layer.length;
}
assert.equal(frames,350);assert.ok(bytes<100000,'Sparse layers must not duplicate large character atlases');
console.log(`PASS Belt of Truth: completed-75 boundary, defeat/retry, permanent/legacy saves, single reveal, cosmetic-only state, all rank/pose markup, ${frames} fitted frames and ${bytes} layer bytes.`);
