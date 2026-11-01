// Compare text snapshots across Git checkout platforms without changing the
// original audit hashes. Only CRLF/LF translation is permitted; no trim,
// whitespace, JSON reserialization, BOM removal or content fallback.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {beforeCharacterRename} from './character-name-revision.mjs';
const {files}=JSON.parse(await readFile(new URL('fixtures/historical-line-endings.json',import.meta.url),'utf8'));
const sha=value=>createHash('sha256').update(value).digest('hex');
export function assertProtectedText(path,bytes,expected,message=`Protected text unchanged: ${path}`){
 const text=beforeCharacterRename(path,new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes).replace(/\r\n/g,'\n'));
 const legacy=files[path];let historical=text;
 if(legacy){
  assert.equal(expected,legacy.historicalSha256,'Historical audit hash must remain intact: '+path);
  assert.equal(sha(text),legacy.lfSha256,message);
  const pattern=legacy.historicalNewlines;
  if(pattern==='CRLF')historical=text.replace(/\n/g,'\r\n');
  else{const crlf=new Set(pattern),lines=text.split('\n');historical=lines.map((line,i)=>line+(i===lines.length-1?'':crlf.has(i+1)?'\r\n':'\n')).join('');}
 }
 assert.equal(sha(historical),expected,message);
}
