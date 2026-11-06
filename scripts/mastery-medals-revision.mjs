import assert from 'node:assert/strict';
import {beforeFirebaseFeature} from './firebase-revision.mjs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export const medalsRevision=JSON.parse(await readFile(new URL('fixtures/mastery-medals-revision.json',import.meta.url),'utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
export function beforeMedalsFeature(path,text){text=beforeFirebaseFeature(path,text);const r=medalsRevision.files[path];if(!r)return text;assert.equal(sha(text),r.afterSha256,'Exact cosmetic medal integration only: '+path);for(const {from,to}of [...r.edits].reverse()){assert.equal(text.split(to).length-1,1);text=text.replace(to,from)}assert.equal(sha(text),r.beforeSha256,'Preserve pre-medal gameplay/save structure: '+path);return text;}
