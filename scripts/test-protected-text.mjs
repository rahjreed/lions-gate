import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {assertProtectedText} from './protected-text.mjs';
import {expectedStartFlowRevision} from './start-flow-revision.mjs';
const root=new URL('../',import.meta.url),json=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const bank=await json('content/banked-publication/baseline.json'),coverage=await json('content/curriculum-coverage.json');
const fixture=await json('scripts/fixtures/historical-line-endings.json');
assert.equal(Object.keys(fixture.files).length,5);
const snapshots=new Map([...Object.entries(bank.protectedHashes),...Object.entries(coverage.sourceHashes)]);
for(const [path,old]of snapshots){
 const expected=expectedStartFlowRevision(path,old),bytes=await readFile(new URL(path,root)),lf=bytes.toString('utf8').replace(/\r\n/g,'\n');
 for(const text of [bytes,Buffer.from(lf),Buffer.from(lf.replace(/\n/g,'\r\n')),Buffer.from(lf.split('\n').map((s,i)=>s+(i%2?'\r':'')).join('\n').replace(/\r$/,''))])assertProtectedText(path,text,expected);
 for(const text of [lf+' ',lf+'\n',lf.replace(/[A-Za-z]/,'!'),'\uFEFF'+lf])assert.throws(()=>assertProtectedText(path,Buffer.from(text),expected),undefined,'Content changes must fail: '+path);
 assert.throws(()=>assertProtectedText(path,bytes,'0'.repeat(64)),undefined,'Changed audit baselines must fail');
}
assert.throws(()=>assertProtectedText('invalid.txt',Buffer.from([0xff]),'0'.repeat(64)),/encoded data/);
console.log(`PASS protected text: ${snapshots.size} snapshots accept LF, CRLF and mixed checkouts; original audit hashes remain checked, including reconstructed historical bytes; code edits, whitespace, added lines, BOM, invalid UTF-8 and altered baselines rejected.`);
