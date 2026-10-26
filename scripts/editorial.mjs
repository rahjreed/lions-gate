import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {questions} from '../dist/questions.js';
import {createStore,safePath} from './editorial-store.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
try{
 const [command,path]=process.argv.slice(2);if(command!=='export'||!path)throw Error('Usage: node scripts/editorial.mjs export content/reviewed/new-batch.json');
 const target=await safePath(root,path);
 const rel=path.replaceAll('\\','/');if(!/^content\/reviewed\/[a-z0-9-]+\.json$/.test(rel))throw Error('Export to a new content/reviewed/<safe-name>.json file.');
 const {mkdir}=await import('node:fs/promises');await mkdir(resolve(root,'content/reviewed'),{recursive:true});
 const batch=await createStore(root,questions).export();await safePath(root,path);await writeFile(target,JSON.stringify(batch,null,2)+'\n',{flag:'wx'});console.log(`Exported ${batch.length} approved records. No publication or candidate changes.`);
}catch(e){console.error(e.message);process.exitCode=1}
