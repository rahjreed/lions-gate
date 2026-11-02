// Historical snapshots retain their original hashes. Reverse only the exact
// optional support UI additions, never any combat, score, save or timing edits.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export const supportRevision=JSON.parse(await readFile(new URL('fixtures/support-ui-revision.json',import.meta.url),'utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
export function beforeSupportFeature(path,text){
 const record=supportRevision.files[path];if(!record)return text;
 assert.equal(sha(text),record.afterSha256,'Only exact optional support UI additions: '+path);
 for(const {from,to}of [...record.edits].reverse()){assert.equal(text.split(to).length-1,1);text=text.replace(to,from);}
 assert.equal(sha(text),record.beforeSha256,'Preserve pre-support gameplay: '+path);return text;
}
