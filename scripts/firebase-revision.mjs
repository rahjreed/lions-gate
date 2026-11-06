import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export const firebaseRevision=JSON.parse(await readFile(new URL('fixtures/firebase-revision.json',import.meta.url),'utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
export function beforeFirebaseFeature(path,text){const r=firebaseRevision.files[path];if(!r)return text;assert.equal(sha(text),r.afterSha256,'Exact Firebase integration only: '+path);for(const {from,to}of [...r.edits].reverse()){assert.equal(text.split(to).length-1,1);text=text.replace(to,from)}assert.equal(sha(text),r.beforeSha256,'Preserve pre-Firebase gameplay/save format: '+path);return text;}
