// Original owner-supplied Roman guard dialogue. Presentation only; never saved
// into the run, and never advances a clock or changes gameplay state.
export const pauseTaunts=Object.freeze([
 'Hast thou fled to consult Google? Even the search engine cannot save thee!',
 'Another tab, perhaps? Shall I wait whilst thou seekest thy answers?',
 'Behold! The mighty warrior hath discovered the pause button!',
 'Dost thou seek assistance from ChatGPT? Tell it I send my regards!',
 'Hast thou gone to consult Google? Ask it how to defeat me whilst thou art there!',
 'Dost thou await an answer from the internet? I assure thee, thy defeat requireth no research!',
 'Shall I summon a physician, or merely a tutor?',
 'Hast thou forgotten the answer, or didst thou never know it?',
 'Perhaps thy sword is sharper than thy understanding. Though I doubt even that!',
 'Art thou searching for wisdom? Alas, thou shouldst have begun yesterday!',
 'I have seen sharper minds upon the dullest of blades!',
 'Take thy time. Defeat is patient.',
 'Pause as thou wilt. Thy fate remaineth unchanged.',
 'I shall be here when thy courage returneth. Should it ever.',
 'The battle may pause, but thy downfall awaiteth.',
 'Art thou weary already? I have scarcely begun!',
 'Shall I fight with one hand, that thou mightest stand a chance?',
 'I have conquered armies in less time than thou hast spent pondering!',
 'Shall I fetch thee a chair? Perhaps a pillow as well?',
 'Dost thou require more time? I can have my servants prepare supper.'
]);
export class PauseTauntRotation{
 constructor(random=Math.random){this.random=random;this.bag=[];this.previous=null;this.current=null}
 read(){
  if(this.current!==null)return this.current;
  if(!this.bag.length){
   this.bag=[...pauseTaunts];
   for(let i=this.bag.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]]}
   // Also avoid a repeat across the shuffled-cycle boundary.
   const last=this.bag.length-1;if(this.bag[last]===this.previous)[this.bag[last],this.bag[0]]=[this.bag[0],this.bag[last]];
  }
  this.current=this.bag.pop();this.previous=this.current;return this.current;
 }
 close(){this.current=null}
}
const rotation=new PauseTauntRotation();
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function pauseGuardMarkup(name='ROMAN GUARD'){
 return `<div class="pause-villain"><figure class="pause-portrait"><img src="assets/console/roman-portrait.png" width="1254" height="1254" alt="Roman guard with a shadowed face inside his gold-trimmed helmet and red crest" decoding="async"></figure><header class="pause-villain-heading"><p class="kicker">ROMAN GUARD</p><h1 class="pause-guard-name">${esc(name)}</h1></header><aside class="pause-guard" aria-label="Roman guard taunt"><p>“${esc(rotation.read())}”</p></aside></div>`;
}
export function closeGuardPause(){rotation.close()}
