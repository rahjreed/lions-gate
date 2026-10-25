// The game is already authored in dist/. Validate it in place; do not run Vite
// against dist/ (that would treat the checked-in game as disposable output).
import assert from 'node:assert/strict';
import {readFile,readdir,stat,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,relative,dirname,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {judah} from '../dist/mascot.js';
import {landscape,sword} from '../dist/art.js';
import {journeyLocations,symbolicGate} from '../dist/adventure.js';

const root=fileURLToPath(new URL('../',import.meta.url)),output=resolve(root,'dist');
const config=JSON.parse(await readFile(resolve(root,'vercel.json'),'utf8'));
assert.equal(config.framework,null,'Use the Other framework preset for this static game.');
assert.equal(config.outputDirectory,'dist');
assert.equal(config.buildCommand,'node scripts/build-site.mjs');
assert.equal(config.installCommand,'','This game needs no dependency installation.');
const pkg=JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));
const lock=JSON.parse(await readFile(resolve(root,'package-lock.json'),'utf8'));
assert.equal(pkg.name,lock.name);assert.equal(pkg.version,lock.version);
assert.deepEqual(pkg.engines,lock.packages[''].engines);
assert.equal(Object.keys(pkg.dependencies).length+Object.keys(pkg.devDependencies).length,0);
console.log(`Static production build on ${process.version}; no Vite or installed dependencies required.`);

const references=new Set();
async function checkReference(raw,from){
 if(!raw||/^(?:[a-z]+:|\/\/|#)/i.test(raw)||raw.includes('${'))return;
 const pathname=decodeURIComponent(raw.split(/[?#]/)[0]);
 if(!pathname)return;
 const target=resolve(raw.startsWith('/')?output:dirname(from),pathname.replace(/^\//,''));
 const rel=relative(output,target);
 assert.ok(!rel.startsWith(`..${sep}`)&&rel!=='..',`Reference escapes dist: ${raw}`);
 assert.ok((await stat(target).catch(()=>null))?.isFile(),`Missing static file: ${relative(root,from)} → ${raw}`);
 references.add(target);
}
async function checkText(text,from){
 const patterns=[/\b(?:src|href)=["']([^"']+)["']/g,/\burl\(\s*["']?([^\s"')]+)["']?\s*\)/g,/@import\s+["']([^"']+)["']/g,/\b(?:from|import)\s*["'](\.[^"']+)["']/g];
 for(const pattern of patterns)for(const match of text.matchAll(pattern))await checkReference(match[1],from);
}
async function walk(dir){let files=[];for(const item of await readdir(dir,{withFileTypes:true})){const path=resolve(dir,item.name);files.push(...item.isDirectory()?await walk(path):[path])}return files}
// Revision the entire offline shell, including every rank/arena/journey asset.
// A failed install never replaces the previous complete version.
const shell=(await walk(output)).filter(file=>file!==resolve(output,'sw.js')).sort();
const template=await readFile(resolve(root,'scripts/service-worker.template.js'),'utf8');
const digest=createHash('sha256').update(template);
for(const file of shell)digest.update(relative(output,file)).update(await readFile(file));
const revision=digest.digest('hex').slice(0,20);
const worker=template.replace('__REVISION__',revision).replace('__FILES__',JSON.stringify(shell.map(file=>'./'+relative(output,file).split(sep).join('/'))));
await writeFile(resolve(output,'sw.js'),worker);
const files=await walk(output);
assert.ok(files.includes(resolve(output,'index.html')),'dist/index.html is required.');
for(const file of files){
 if(['.html','.css','.js'].includes(extname(file)))await checkText(await readFile(file,'utf8'),file);
 if(extname(file)==='.js'){const checked=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});assert.equal(checked.status,0,checked.stderr)}
}
// Check generated URLs too: ranks/poses and journey themes use template strings.
const virtual=resolve(output,'index.html');
for(const completed of [0,5,15,30,50,60,10000])for(const pose of ['idle','ready','stance','slash','celebrate','recoil','walk','run','victory','transform'])for(const equipment of [[],['belt']])await checkText(judah(completed,pose,true,equipment),virtual);
for(let env=0;env<5;env++)await checkText(landscape(env),virtual);
await checkText(sword+symbolicGate({broken:5}),virtual);
for(const [slug] of journeyLocations)for(const plane of ['sky','far','near'])await checkReference(`assets/console/journey-${slug}-${plane}.png`,virtual);
for(const name of ['validate-content','test-engine','test-storage','test-audio','test-juice','test-judah-focus','test-adventure','test-answer-reveal','test-combat','test-opponents','test-pwa','test-retry','test-celebration','test-armor','test-pause']){
 const result=spawnSync(process.execPath,[`scripts/${name}.mjs`],{cwd:root,stdio:'inherit'});
 assert.equal(result.status,0,`${name} failed.`);
}
console.log(`Build ready: ${files.length} files in dist/, ${references.size} local asset/module references checked; offline revision ${revision}.`);

