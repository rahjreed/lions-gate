import {beforeSupportFeature} from './support-ui-revision.mjs';
// Reverse only the exact read-only share UI additions for historical audits.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export const sharingRevision=JSON.parse(await readFile(new URL('fixtures/share-score-revision.json',import.meta.url),'utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
export function beforeSharingFeature(path,text){
 text=beforeSupportFeature(path,text);
 const record=sharingRevision.files[path];if(!record)return text;
 assert.equal(sha(text),record.afterSha256,'Only the exact read-only sharing additions are allowed: '+path);
 for(const {from,to}of [...record.edits].reverse()){assert.equal(text.split(to).length-1,1);text=text.replace(to,from);}
 assert.equal(sha(text),record.beforeSha256,'Preserve pre-sharing gameplay: '+path);return text;
}
