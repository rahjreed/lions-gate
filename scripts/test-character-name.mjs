import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {nameRevision,beforeCharacterRename} from './character-name-revision.mjs';
import {judah,judahJourney} from '../dist/mascot.js';
import {EncounterDialogue,dialogueMarkup} from '../dist/encounter-dialogue.js';
import {combatHealthMarkup} from '../dist/combat.js';
import {armorItems,armorRevealMarkup} from '../dist/armor.js';
import {questions} from '../dist/questions.js';
import {createRun} from '../dist/engine.js';
import {emptyProfile,saveProfile,loadProfile} from '../dist/storage.js';
const read=async p=>(await readFile(new URL('../'+p,import.meta.url),'utf8')).replace(/\r\n/g,'\n'),sha=s=>createHash('sha256').update(s).digest('hex');
assert.equal(Object.keys(nameRevision.files).length,5);
assert.equal(Object.values(nameRevision.files).flatMap(f=>f.replacements).length,11);
for(const [path,record]of Object.entries(nameRevision.files)){
 const source=await read(path);assert.equal(sha(beforeCharacterRename(path,source)),record.beforeSha256);
 assert.throws(()=>beforeCharacterRename(path,source+' '),'No unrelated edits may hide behind the rename');
}
for(const [path,expected]of Object.entries(nameRevision.preserved))assert.equal(sha(await read(path)),expected,'Question, explanation, dialogue, engine or save source changed: '+path);
const markup=[];
for(const completed of [0,35,110,185,260,335])for(const pose of ['idle','ready','slash','recoil','victory','transform']){
 const html=judah(completed,pose,true,['belt']);assert.match(html,/aria-label="Akobi/);assert.match(html,/<b>AKOBI<\/b>/);assert.match(html,/class="judah /);assert.match(html,/assets\/console\/judah-/);markup.push(html);
}
markup.push(judahJourney(335,['belt'],35),combatHealthMarkup(createRun(questions)),armorRevealMarkup(armorItems[0]));
for(const level of [1,5])for(const kind of [null,'enemy-low','one-life','knockout'])for(const step of [0,1]){
 const session=new EncounterDialogue(level);session.kind=kind;session.step=step;const html=dialogueMarkup(session,'Marcus');assert.match(html,/speaker">AKOBI</);if(!step)assert.match(html,/AKOBI’S REPLY/);markup.push(html);
}
for(const html of markup)assert.doesNotMatch(html,/Judah|JUDAH/,'Outdated player-facing label');
const app=await read('dist/app.js');assert.match(app,/Help Akobi take the Kingdom\.<\/span>/);assert.match(app,/aria-label="Akobi journeys/);assert.match(app,/Kingdom Race The Lion’s Gate/);
assert.ok(questions.some(q=>/\bJudah\b/.test(JSON.stringify(q))),'Biblical Judah remains in the unmodified bank');assert.equal(questions.length,260);
// A user's chosen name is data, not the warrior label. Old saves keep it intact.
const profile=emptyProfile();profile.nickname='Judah';profile.run=createRun(questions,'Judah');const storage={value:null,getItem(){return this.value},setItem(_,s){this.value=s}};
saveProfile(storage,profile);const loaded=loadProfile(storage,questions);assert.equal(loaded.nickname,'Judah');assert.equal(loaded.run.nickname,'Judah');assert.equal(loaded.run.id,profile.run.id);
console.log('PASS Akobi: exact eleven display-only edits across five modules; all ranks/poses, health, armor, pre-battle/Gatekeeper/low-health/last-life/knockout labels; exact tagline/title; unchanged dialogue voices, 260 questions and biblical Judah, engine/save code, identifiers/assets and existing player names.');
