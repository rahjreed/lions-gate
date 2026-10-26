import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=fileURLToPath(new URL('./',import.meta.url)),repo=resolve(root,'..');
// Copy only shared validation code into the private function bundle, never question data.
for(const relative of ['scripts/editorial-core.mjs','scripts/question-quality.mjs','scripts/difficulty-map.mjs','dist/question-rules.js','dist/knowledge.js']){
 const to=resolve(root,'generated',relative);await mkdir(dirname(to),{recursive:true});await copyFile(resolve(repo,relative),to);
}
await mkdir(resolve(root,'public'),{recursive:true});
let html=await readFile(resolve(repo,'tools/question-review/index.html'),'utf8');
html=html.replace('Biblical Question Review — Local editor',"Lion's Gate — Question Review").replace('LOCAL EDITOR · NOT PART OF THE PUBLIC GAME','LION’S GATE · PROTECTED EDITORIAL PORTAL').replace('<h1>Biblical Question Review</h1>',"<h1>Lion’s Gate Question Review</h1><button id=\"logout\" hidden>Sign out</button>").replace('<main>','<section id="login"><h2>Administrator sign in</h2><p>Access is limited to explicitly authorized editors.</p><form id="login-form"><label>Email<input id="email" type="email" autocomplete="username" required></label><label>Password<input id="password" type="password" autocomplete="current-password" required></label><button id="sign-in" type="submit">Sign in securely</button></form><p id="login-message" role="status" aria-live="polite"></p></section><main id="editor" hidden>');
html=html.replace('Loading candidates…','Administrator authentication required.');
let js=await readFile(resolve(repo,'tools/question-review/review.js'),'utf8');
js="import {portalFetch,startSession,renderHistory} from '/session.js';\n"+js.replaceAll("fetch('/api/","portalFetch('/api/");
js=js.replace('decisions remain local; approval does not publish.','decisions are saved securely; approval does not publish.');
js=js.replace('renderList();renderCoverage()}','renderList();renderCoverage();const counts={};for(const r of state.records)counts[r.status]=(counts[r.status]||0)+1;$(\'#summary\').textContent+=\' \'+Object.entries(counts).map(([k,v])=>v+\' \'+k).join(\' · \')}');
js=js.replace('const reviewer=field(p,\'Reviewer name\',\'text\',d?.reviewer??\'\')','const reviewer=field(p,\'Reviewer name (signed-in administrator)\',\'text\',state.reviewer)');
js=js.replace("const ratingLabel=node('label'", "reviewer.readOnly=true;const ratingLabel=node('label'");
js=js.replace("p.append(actions,node('p'", "renderHistory(p,state.history,q.id);p.append(actions,node('p'");
js=js.replace("load().catch(e=>{$('#message').textContent=e.message});","startSession(load);");
await writeFile(resolve(root,'public/index.html'),html);await writeFile(resolve(root,'public/review.js'),js);
await copyFile(resolve(root,'ui/session.js'),resolve(root,'public/session.js'));
await writeFile(resolve(root,'public/review.css'),await readFile(resolve(repo,'tools/question-review/review.css'),'utf8')+'\n[hidden]{display:none!important}#login{max-width:500px;margin:30px auto;padding:24px}#login input{width:100%}details{margin:12px 0}summary{cursor:pointer;overflow-wrap:anywhere}pre{max-height:320px;overflow:auto}button:disabled{opacity:.55}\n');
console.log('Hosted portal built: four public UI files; shared validators private; no candidates, credentials or publishing functions in public output.');
