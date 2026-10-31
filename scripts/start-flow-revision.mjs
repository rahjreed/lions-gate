// Preserve old publication audit snapshots while allowing this exact,
// owner-requested navigation revision. No question/save/engine hashes change.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const revision=JSON.parse(await readFile(new URL('fixtures/start-flow-revision.json',import.meta.url),'utf8'));
export function expectedStartFlowRevision(path,previous){
 const item=revision.files.find(f=>f.path===path);if(!item)return previous;
 assert.equal(path,'dist/app.js');assert.equal(item.before,previous,'Preserve historical navigation hash');assert.ok(item.reason);return item.after;
}
