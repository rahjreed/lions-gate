import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {files}=JSON.parse(await readFile(new URL('fixtures/header-settings-revision.json',import.meta.url),'utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
export function beforeHeaderSettings(path,text){const r=files[path];if(!r)return text;assert.equal(sha(text),r.afterSha256,'Exact header/settings changes only');assert.equal(text,r.after);assert.equal(sha(r.before),r.beforeSha256);return r.before;}
