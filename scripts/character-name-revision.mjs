// Keep historical publication snapshots intact while authorizing only the
// owner's exact player-facing rename. No general name/identifier replacement.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {beforeCollectionFeature} from './collection-flow-revision.mjs';
export const nameRevision=JSON.parse(await readFile(new URL('fixtures/akobi-name-revision.json',import.meta.url),'utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
export function beforeCharacterRename(path,text){
 text=beforeCollectionFeature(path,text);
 const record=nameRevision.files[path];if(!record)return text;
 assert.equal(sha(text),record.afterSha256,'Only the exact authorized name edit is allowed: '+path);
 for(const {from,to,count}of record.replacements){assert.equal(text.split(to).length-1,count);text=text.replace(to,from);}
 assert.equal(sha(text),record.beforeSha256,'Preserve the complete pre-rename implementation: '+path);
 return text;
}
