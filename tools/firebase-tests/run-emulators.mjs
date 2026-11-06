// Local-only harness. Never accepts a project ID or a deployment command.
import assert from 'node:assert/strict';
import {readdir,readFile,mkdir,stat} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync,spawn} from 'node:child_process';
const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../..'),runtime=join(root,'.verification/firebase-runtime');
const config=JSON.parse(await readFile(join(root,'firebase.json'),'utf8'));
assert.equal(config.emulators.firestore.host,'127.0.0.1');assert.equal(config.emulators.firestore.port,8080);
const candidates=[];
for(const entry of await readdir(runtime,{withFileTypes:true}).catch(()=>[]))if(entry.isDirectory())candidates.push(join(runtime,entry.name,'bin',process.platform==='win32'?'java.exe':'java'));
if(process.env.JAVA_HOME)candidates.push(join(process.env.JAVA_HOME,'bin',process.platform==='win32'?'java.exe':'java'));
candidates.push('java');let java;
for(const candidate of candidates){const check=spawnSync(candidate,['-version'],{encoding:'utf8'}),version=(check.stderr||'')+(check.stdout||'');if(check.status===0&&Number(version.match(/version "(\d+)/)?.[1])>=21){java=candidate;console.log(version.trim());break;}}
assert.ok(java,'Java 21+ is required. Use JAVA_HOME or extract a portable runtime in .verification/firebase-runtime/.');
const emulatorCache=join(runtime,'emulators');await mkdir(emulatorCache,{recursive:true});
const cli=join(here,'node_modules/firebase-tools/lib/bin/firebase.js');assert.ok((await stat(cli).catch(()=>null))?.isFile(),'Run npm ci --prefix tools/firebase-tests first.');
const env={...process.env,CI:'true',FIREBASE_CLI_DISABLE_UPDATE_CHECK:'true',FIREBASE_EMULATORS_PATH:emulatorCache,GCLOUD_PROJECT:'demo-kingdom-race',GOOGLE_CLOUD_PROJECT:'demo-kingdom-race'};
env.XDG_CONFIG_HOME=join(runtime,'cli-config');await mkdir(env.XDG_CONFIG_HOME,{recursive:true});
delete env.FIREBASE_TOKEN;delete env.GOOGLE_APPLICATION_CREDENTIALS;
// Only this child process receives the portable Java path; no system settings change.
env.PATH=java==='java'?process.env.PATH:dirname(java)+(process.platform==='win32'?';':':')+process.env.PATH;
if(java!=='java')env.JAVA_HOME=dirname(dirname(java));
env.NODE_OPTIONS=[process.env.NODE_OPTIONS||'','--use-system-ca'].join(' ').trim();
const args=[cli,'emulators:exec','--non-interactive','--project','demo-kingdom-race','--config',join(root,'firebase.json'),'--only','firestore','node test-all.mjs'];
const child=spawn(process.execPath,args,{cwd:here,env,stdio:'inherit'});
const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',code=>resolve(code));});process.exitCode=code??1;
