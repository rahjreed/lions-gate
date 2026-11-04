import {beforeMedalsFeature} from './mastery-medals-revision.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export const studyPathRevision=JSON.parse(await readFile(new URL('fixtures/study-path-revision.json',import.meta.url),'utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
export function beforeStudyPathFeature(path,text){text=beforeMedalsFeature(path,text);const r=studyPathRevision.files[path];if(!r)return text;assert.equal(sha(text),r.afterSha256,'Exact study-path additions only: '+path);for(const {from,to}of [...r.edits].reverse()){assert.equal(text.split(to).length-1,1);text=text.replace(to,from)}assert.equal(sha(text),r.beforeSha256,'Preserve historical gameplay: '+path);return text;}
