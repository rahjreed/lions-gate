import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const css=await read('dist/title-branding.css'),index=await read('dist/index.html'),app=await read('dist/app.js');
// Title styling must never leak into a battle, modal, or another menu.
for(const [,raw] of css.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{/g)){
 const selector=raw.trim();if(selector.startsWith('@')||/^(?:\d+%|from|to)/.test(selector))continue;
 for(const part of selector.split(','))assert.match(part.trim(),/^(?:body\.opening|\.opening )/,'Non-title selector: '+part);
}
assert.ok(index.indexOf('href="title-branding.css"')>index.indexOf('href="viewport.css"'),'Title presentation loads after shared layout');
assert.doesNotMatch(await read('dist/style.css'),/@import[^;]*title-branding/,'No duplicate early load');
const png=await readFile(new URL('../dist/assets/console/title-gate-reference.png',import.meta.url));
assert.equal(png.subarray(1,4).toString(),'PNG');const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
assert.ok(width>=1000&&height>=750);assert.ok(Math.abs(width/height-1.3)<.02,'Scenery preserves reference composition');assert.ok(png.length<2500000,'Bounded offline title asset');
assert.match(css,/prefers-reduced-motion/);assert.match(css,/aspect-ratio:1\.3/);assert.match(css,/min-height:44px/);
const title=app.match(/function titleScreen\(\)[^\n]*/)[0];
for(const action of ['start','continue','hall','guide','armory','settings'])assert.ok(title.includes("'"+action+"'"));
assert.doesNotMatch(title,/<input|<canvas|<iframe|The Lion[’']s:/);
assert.match(title,/Kingdom Race The Lion’s Gate/);assert.match(title,/Help Akobi take the Kingdom\./);assert.match(title,/Daniel 7:18/);
assert.match(title,/judah\(profile\.bestCompleted\)/);assert.match(title,/floating-sword/);
assert.match(await read('dist/art.js'),/assets\/console\/sword\.png/);
console.log('PASS title reference: detailed scenery asset, preserved 1.3 composition; title-only CSS, late stylesheet ordering, live unchanged menu/name/Continue routes, original Judah/sword layers, touch targets and reduced motion.');
