import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../dist/',import.meta.url),manifest=JSON.parse(await readFile(new URL('manifest.webmanifest',root),'utf8'));
assert.equal(manifest.name,'Lions Gate Sword Sharpener');assert.equal(manifest.display,'standalone');
assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./');assert.equal(manifest.id,'./');
for(const icon of [...manifest.icons,{src:'assets/icons/apple-touch-icon.png',sizes:'180x180'}]){
 const bytes=await readFile(new URL(icon.src,root));assert.equal(bytes.subarray(1,4).toString(),'PNG');
 const size=Number(icon.sizes.split('x')[0]);assert.equal(bytes.readUInt32BE(16),size);assert.equal(bytes.readUInt32BE(20),size);
}
assert.ok(manifest.icons.some(i=>i.purpose==='maskable'&&i.sizes==='512x512'));
const html=await readFile(new URL('index.html',root),'utf8');
for(const fragment of ['rel="manifest"','viewport-fit=cover','apple-mobile-web-app-capable','rel="apple-touch-icon"','src="pwa.js"','href="mobile-game.css"'])assert.ok(html.includes(fragment));
const worker=await readFile(new URL('sw.js',root),'utf8'),store=new Map();let failInstall=false,fetches=0;
const scope='https://example.test/game/';
const caches={
 async open(name){if(!store.has(name))store.set(name,new Map());const data=store.get(name);return {
  async addAll(requests){for(const request of requests){if(failInstall)throw Error('Network unavailable');const rel=new URL(request.url).pathname.slice('/game/'.length);data.set(request.url,new Response(await readFile(new URL(rel,root))))}},
  async match(key){return data.get(key)?.clone()}
 }},async keys(){return [...store.keys()]},async delete(key){return store.delete(key)}
};
function boot(source,activation={}){const events={};vm.runInNewContext(source,{URL,Request,caches,fetch:()=>{fetches++;throw Error('Offline')},self:{registration:{scope},addEventListener:(type,fn)=>events[type]=fn,skipWaiting:activation.skipWaiting??(()=>assert.fail('Must not replace active game')),clients:{matchAll:()=>activation.windows,claim:()=>assert.fail('No mid-session takeover')}}});return events}
async function lifecycle(fn){let work;fn({waitUntil:p=>work=p});await work}
const events=boot(worker);await lifecycle(events.install);
assert.equal(store.size,1);const oldCache=[...store.keys()][0],entries=store.get(oldCache);
for(const file of ['index.html','manifest.webmanifest','app.js','release.js','release.css','questions.js','engine.js','storage.js','assets/icons/icon-192.png','assets/console/judah-master-adventure.png','assets/console/roman-soldier.png'])assert.ok(entries.has(scope+file));
async function offline(url,mode='cors',method='GET'){let work;events.fetch({request:{url,mode,method},respondWith:p=>work=p});return work?await work:null}
assert.equal((await offline(scope+'?launch=home','navigate')).status,200);
assert.equal(await (await offline(scope+'release.js')).text(),await readFile(new URL('release.js',root),'utf8'),'Offline shell retains its matching displayed version');
assert.equal(await (await offline(scope+'questions.js')).text(),await readFile(new URL('questions.js',root),'utf8'));
assert.equal(await offline('https://fonts.googleapis.com/test'),null);
assert.equal(await offline(scope+'api/save','cors','POST'),null);assert.equal(fetches,0);
// Failed updates discard only the new partial shell, retaining the working cache.
const revision=worker.match(/PREFIX\+'([^']+)'/)[1],updated=boot(worker.replace(revision,'update-test'));
failInstall=true;await assert.rejects(()=>lifecycle(updated.install));assert.ok(store.has(oldCache));assert.equal(store.size,1);
failInstall=false;await lifecycle(updated.install);assert.equal(store.size,2);
store.set('unrelated-app-cache',new Map());await lifecycle(updated.activate);
assert.ok(!store.has(oldCache));assert.ok(store.has('unrelated-app-cache'));assert.equal(store.size,2);
assert.ok(!/localStorage|indexedDB|Clear-Site-Data/.test(worker));
const windows=[{id:'title',url:scope},{id:'battle',url:scope}];
let activated=0,reply;
const waiting=boot(worker,{windows,skipWaiting:()=>{activated++}});
const request=(id,data='apply-title-update')=>{
 let work;
 waiting.message({data,source:{id},ports:[{postMessage:message=>{reply=message}}],waitUntil:promise=>{work=promise}});
 return work;
};
await request('title');
assert.equal(reply,'close-other-windows');
assert.equal(activated,0);
windows.pop();
await request('title','unrelated');
assert.equal(activated,0);
await request('title');
assert.equal(activated,1,'Only an explicit request from the sole game window activates the update');

// Supported install prompt only; dismiss/re-enable, installed and unsupported UI.
const pwa=(await readFile(new URL('pwa.js',root),'utf8')).replace("new URL('sw.js',import.meta.url)","'sw.js'");
const nodes=Object.fromEntries(['#install-game','#ios-install','#offline-status'].map(id=>[id,{hidden:true,textContent:'',addEventListener(type,fn){this[type]=fn}}]));
const uiEvents={},media={matches:false,addEventListener(){}};
vm.runInNewContext(pwa,{document:{querySelector:id=>nodes[id]},matchMedia:()=>media,navigator:{userAgent:'test',platform:'test',maxTouchPoints:0},window:{addEventListener:(type,fn)=>uiEvents[type]=fn}});
assert.equal(nodes['#install-game'].hidden,true);assert.equal(nodes['#ios-install'].hidden,true);
let prompts=0;uiEvents.beforeinstallprompt({preventDefault(){},async prompt(){prompts++},userChoice:Promise.resolve({outcome:'dismissed'})});
assert.equal(nodes['#install-game'].hidden,false);await nodes['#install-game'].click();assert.equal(prompts,1);assert.equal(nodes['#install-game'].hidden,true);
uiEvents.appinstalled();assert.equal(nodes['#install-game'].hidden,true);
console.log('PASS PWA: manifest, PNG dimensions, full offline shell, navigation, external/API exclusion, atomic failed update, scoped cleanup, unchanged saves, supported install UI.');
