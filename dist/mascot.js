import {rankFor,rankLabel} from './engine.js';
// Original 96×160 raster sprite, 16 authored frames per rank. No runtime canvas.
export function judah(completed=0,pose='idle',caption=true){
 const rank=rankFor(completed),stage=['Novice','Student','Scholar','Scribe','Master'].indexOf(rank.name);
 const action=['stance','ready','slash','celebrate','recoil','walk','run','victory','transform'].includes(pose);
 const safePose=action||['idle','success','reflection','advance'].includes(pose)?pose:'idle';
 const sheet=`assets/console/judah-${rank.name.toLowerCase()}${action?'-adventure':''}.png`;
 const before=rank.degree>1?'master':['Novice','Student','Scholar','Scribe','Master'][Math.max(0,stage-1)].toLowerCase();
 return `<figure class="judah judah-${safePose} judah-stage-${stage} ${action?'judah-adventure':''}" data-pose="${safePose}" data-rank="${rank.name}" data-degree="${rank.degree}" style="--master-glow:${Math.min(10,rank.degree)+3}px">${action?'<span class="judah-art-frame">':''}<span class="judah-sprite" role="img" aria-label="Judah · ${rankLabel(rank)}" style="--sheet:url('${sheet}')"></span>${safePose==='transform'?`<span class="rank-before" style="--sheet:url('assets/console/judah-${before}-adventure.png')" aria-hidden="true"></span>`:''}${action?'</span>':''}${safePose==='slash'?'<span class="hero-slash" aria-hidden="true"></span>':''}${rank.degree?`<span class="judah-degree" aria-hidden="true">${'◆'.repeat(Math.min(8,rank.degree))}</span>`:''}${caption?`<figcaption><b>JUDAH</b><span>${rankLabel(rank)}</span></figcaption>`:''}</figure>`;
}
export function judahJourney(completed){return `<section class="judah-journey"><h2>Judah’s journey</h2><p>An original companion who advances with your earned rank. Clothing previews below unlock through cleared levels.</p><div class="judah-ranks">${[0,5,15,30,50].map(n=>`<article class="${completed>=n?'earned':'unearned'}">${judah(n)}<small>${completed>=n?'EARNED':`PREVIEW · CLEAR ${n} LEVELS`}</small></article>`).join('')}</div><p>Master degrees retain the honorable mantle, add an insignia of up to eight diamonds, and display the earned degree.</p></section>`}
