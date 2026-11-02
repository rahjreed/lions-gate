import {beforeSharingFeature} from './share-score-revision.mjs';
// Retain historical audit snapshots while allowing this exact, requested feature.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export const collectionRevision=JSON.parse(await readFile(new URL('fixtures/collection-flow-revision.json',import.meta.url),'utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
export function beforeCollectionFeature(path,text){
 text=beforeSharingFeature(path,text);
 const record=collectionRevision.files[path];if(!record)return text;
 assert.equal(sha(text),record.afterSha256,'Only the exact authorized collection feature is allowed: '+path);
 for(const {from,to}of [...record.edits].reverse()){assert.equal(text.split(to).length-1,1);text=text.replace(to,from);}
 assert.equal(sha(text),record.beforeSha256,'Preserve the pre-feature implementation: '+path);
 return text;
}
