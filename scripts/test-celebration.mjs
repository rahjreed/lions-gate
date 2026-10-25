import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const classes=new Set(),events={},frames=new Map();let id=0,mobile=true;
const app={scrollHeight:700,clientHeight:700},html={scrollHeight:800,clientHeight:800};
const document={body:{classList:{remove:name=>classes.delete(name),toggle(name,value){value?classes.add(name):classes.delete(name)}}},documentElement:html,querySelector:()=>app,addEventListener:(name,fn)=>events[name]=fn};
const context={document,matchMedia:()=>({matches:mobile}),requestAnimationFrame:fn=>{frames.set(++id,fn);return id},cancelAnimationFrame:key=>frames.delete(key),ResizeObserver:class{observe(){}},window:{addEventListener:(name,fn)=>events[name]=fn}};
vm.runInNewContext((await readFile(new URL('../dist/mobile-game.js',import.meta.url),'utf8')).replace('export function','function'),context);
const flush=()=>{const work=[...frames.values()];frames.clear();work.forEach(fn=>fn())};
context.setGameLayout(false,true);flush();assert.ok(classes.has('celebrating'));assert.ok(classes.has('game-fit'));assert.ok(!classes.has('gameplay'));
app.scrollHeight=1400;html.scrollHeight=1500;
events.toggle({target:{matches:selector=>selector==='.review-list'}});flush();assert.ok(!classes.has('game-fit'),'Expanded review must unlock scrolling');
app.scrollHeight=700;html.scrollHeight=800;events.toggle({target:{matches:()=>true}});flush();assert.ok(classes.has('game-fit'),'Closing review restores fit');
html.scrollHeight=900;events.resize();flush();assert.ok(!classes.has('game-fit'),'Small windows retain an accessible fallback');
html.scrollHeight=800;context.setGameLayout(true);flush();assert.ok(!classes.has('celebrating'));assert.ok(classes.has('gameplay'));assert.ok(classes.has('game-fit'),'Existing active gameplay still fits');
context.setGameLayout(false);flush();assert.equal(classes.size,0,'Menus and Game Over do not inherit celebration layout');
mobile=false;context.setGameLayout(false,true);flush();assert.ok(!classes.has('game-fit'),'Desktop is not scroll locked');
console.log('PASS celebration layout: scoped state, review expand/collapse, small-screen fallback, resize, gameplay/menu cleanup and desktop scroll behavior.');
// The same fit measurement now covers only the requested opening/retry/journey screens.
mobile=true;html.scrollHeight=800;app.scrollHeight=700;
for(const screen of ['opening','game-over','transition-view']){context.setGameLayout(false,false,screen);flush();assert.ok(classes.has(screen));assert.ok(classes.has('game-fit'));for(const other of ['opening','game-over','transition-view'].filter(s=>s!==screen))assert.ok(!classes.has(other))}
context.setGameLayout(false,false,'game-over');app.scrollHeight=1100;events.toggle({target:{matches:()=>true}});flush();assert.ok(!classes.has('game-fit'),'Game Over review can expand and scroll');context.setGameLayout(false);flush();assert.equal(classes.size,0);
console.log('PASS usability fit: opening, Game Over and journey scoping, expanded review fallback and menu cleanup.');
