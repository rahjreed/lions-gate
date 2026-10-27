import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {releaseLabel,planRelease} from './release-version.mjs';
import {gameVersion} from '../dist/release.js';
const first='a'.repeat(64),changed='b'.repeat(64);
let state={series:'1',update:'1',contentDigest:null};
const before=structuredClone(state);state=planRelease(state,first);
assert.equal(releaseLabel(state),'1.1');assert.deepEqual(before,{series:'1',update:'1',contentDigest:null});
assert.deepEqual(planRelease(state,first),state,'Repeat builds do not consume update numbers');
assert.equal(releaseLabel(planRelease(state,changed)),'1.2');
for(const [current,next] of [['9','10'],['28','29'],['99','100'],['100','101'],['9007199254740992','9007199254740993']]){
 const saved={series:'1',update:current,contentDigest:first};const planned=planRelease(saved,changed);
 assert.equal(releaseLabel(planned),`1.${next}`);assert.deepEqual(planRelease(planned,changed),planned);
 assert.equal(saved.update,current,'A failed/uncommitted plan cannot advance the persisted counter');
}
for(const update of ['0','01','1.2','-1','NaN',1])assert.throws(()=>releaseLabel({series:'1',update,contentDigest:first}));
const root=new URL('../',import.meta.url),html=await readFile(new URL('dist/index.html',root),'utf8'),app=await readFile(new URL('dist/app.js',root),'utf8');
assert.match(gameVersion,/^1\.[1-9]\d*$/);assert.match(html,/id="game-version"/);assert.match(html,/href="release.css"/);
assert.ok(app.includes("import {gameVersion} from './release.js'"));assert.ok(app.includes("$('#game-version').textContent=`VERSION ${gameVersion}`"));
assert.ok(app.includes('CURRENT VERSION ${gameVersion}'),'How to Play uses the same version source');
console.log('PASS release version: shared footer/manual source; exact 1.N counters through 1.101 and beyond safe integers; initial/repeat/changed builds; rejected corrupt records and non-mutating release plans.');
