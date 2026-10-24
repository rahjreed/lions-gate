import {rankFor,rankLabel} from './engine.js';
// Original 96×160 raster sprite, 16 authored frames per rank. No runtime canvas.
export function judah(completed=0,pose='idle',caption=true){
 const rank=rankFor(completed),stage=['Novice','Student','Scholar','Scribe','Master'].indexOf(rank.name);
 const safePose=['idle','success','reflection','advance'].includes(pose)?pose:'idle';
 return `<figure class="judah judah-${safePose} judah-stage-${stage}" data-rank="${rank.name}" data-degree="${rank.degree}"><span class="judah-sprite" role="img" aria-label="Judah · ${rankLabel(rank)}" style="--sheet:url('assets/console/judah-${rank.name.toLowerCase()}.png')"></span>${rank.degree?`<span class="judah-degree" aria-hidden="true">${'◆'.repeat(Math.min(8,rank.degree))}</span>`:''}${caption?`<figcaption><b>JUDAH</b><span>${rankLabel(rank)}</span></figcaption>`:''}</figure>`;
}
export function judahJourney(completed){return `<section class="judah-journey"><h2>Judah’s journey</h2><p>An original companion who advances with your earned rank. Clothing previews below unlock through cleared levels.</p><div class="judah-ranks">${[0,5,15,30,50].map(n=>`<article class="${completed>=n?'earned':'unearned'}">${judah(n)}<small>${completed>=n?'EARNED':`PREVIEW · CLEAR ${n} LEVELS`}</small></article>`).join('')}</div><p>Master degrees retain the honorable mantle, add an insignia of up to eight diamonds, and display the earned degree.</p></section>`}
