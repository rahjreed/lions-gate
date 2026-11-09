import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {files}=JSON.parse(await readFile(new URL('fixtures/header-settings-revision.json',import.meta.url),'utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
const musicStartup=JSON.parse(await readFile(new URL('fixtures/music-startup-revision.json',import.meta.url),'utf8'));
const precept=JSON.parse(await readFile(new URL('fixtures/precept-revision.json',import.meta.url),'utf8'));
export function beforeHeaderSettings(path,text){
 const r=files[path];if(!r)return text;
 const arena=precept[path];
 if(arena){
  assert.equal(sha(text),arena.sha256,'Exact Precept Battle integration only: '+path);
  for(const [before,after] of [...arena.edits].reverse()){
   assert.equal(text.split(after).length,2);
   text=text.replace(after,()=>before);
  }
 }
 const fix=musicStartup[path];
 if(fix){
  assert.equal(sha(text),fix.sha256,'Exact music startup changes only: '+path);
  assert.equal(text.split(fix.after).length,2);
  text=text.replace(fix.after,()=>fix.before);
 }
 assert.equal(sha(text),r.afterSha256,'Exact header/settings changes only');
 assert.equal(text,r.after);assert.equal(sha(r.before),r.beforeSha256);return r.before;
}
