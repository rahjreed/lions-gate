// Original fictional encounter banter. Never used as Scripture or quiz content.
const regular=[
 ['You will never make it to the Kingdom!','Then you will have a very long wait here.'],
 ['Turn back. This road belongs to Rome.','Roads change hands. My purpose does not.'],
 ['That sword looks heavy.','So does all that boasting.'],
 ['I have stopped stronger men than you.','You have not stopped this one.'],
 ['Your journey ends at my shield.','Then move it. I have a long way to go.'],
 ['Are you lost, traveler?','No. You are standing on my route.'],
 ['I hope you brought an army.','I brought discipline. Let us start there.'],
 ['You should have stayed in the village.','And miss your welcoming speech?'],
 ['You cannot pass on courage alone.','Good. I have been studying too.'],
 ['One more step and you face me.','At last, clear directions.'],
 ['This gate has never welcomed you.','I did not come for its hospitality.'],
 ['You look tired, Judah.','Tired is not the same as finished.'],
 ['My armor cost a fortune.','I hope your judgment came with it.'],
 ['Rome does not fear your resolve.','My resolve does not need an audience.'],
 ['You think you know the way?','Enough to recognize an obstacle.'],
 ['I have guarded this path for years.','Then you know which way I am going.'],
 ['Your confidence will fail you.','That is why I practice obedience.'],
 ['You are outmatched.','You have not asked a question yet.'],
 ['The wilderness will wear you down.','It has been teaching me to stand.'],
 ['I do not move for travelers.','You may want to reconsider your policy.'],
 ['Do you always walk toward trouble?','Only when it stands across the path.'],
 ['You carry more hope than supplies.','I travel light. I do not travel aimlessly.'],
 ['I expected someone more impressive.','Keep watching.'],
 ['You will remember this checkpoint.','I intend to remember the way past it.']
];
const gatekeepers=[
 ['Beyond this gate, careless answers fall silent.','Then I will read carefully and stand firm.'],
 ['I weigh every word you bring before me.','Good. I do not intend to waste them.'],
 ['Many have mistaken confidence for wisdom.','I will bring more than confidence.'],
 ['Your easy victories carry no weight here.','Then let this trial speak for itself.'],
 ['This gate opens for neither pride nor haste.','I can leave both outside.'],
 ['I will test the foundations beneath your feet.','That is why I have been building carefully.'],
 ['A missing detail can end your advance.','Then no detail is beneath my attention.'],
 ['I guard the difference between knowing and guessing.','Then we agree that the difference matters.'],
 ['Your next step demands discernment.','I did not come this far to stop thinking.'],
 ['The path narrows. Your excuses will not fit.','I have no plans to carry any.'],
 ['Listen closely. Certainty can conceal error.','Then I will test what I hear.'],
 ['You have reached a harder gate, Judah.','Then it is time for a steadier answer.']
];
export const dialoguePools=Object.freeze({regular:Object.freeze(regular.map(Object.freeze)),gatekeeper:Object.freeze(gatekeepers.map(Object.freeze))});
export function dialogueFor(level){
 if(!Number.isSafeInteger(level)||level<1)throw new RangeError('Dialogue level must be a positive safe integer');
 const boss=level%5===0,pool=boss?dialoguePools.gatekeeper:dialoguePools.regular;
 const ordinal=boss?level/5-1:level-Math.floor(level/5)-1;
 // Coprime stride visits every entry before rotating the next cycle's start.
 const index=((ordinal%pool.length)*7+(Math.floor(ordinal/pool.length)%pool.length)*3)%pool.length;
 return Object.freeze({id:`${boss?'gatekeeper':'roman'}-${index+1}`,boss,opponent:pool[index][0],judah:pool[index][1]});
}
export function pendingDialogue(run){const d=run?.dialogue;return run?.status==='playing'&&run.index===0&&d?.level===run.level&&d.done===false&&(d.step===0||d.step===1)}
export class EncounterDialogue{
 constructor(level,checkpoint){this.level=level;this.exchange=dialogueFor(level);this.step=checkpoint?.level===level&&checkpoint?.step===1?1:0;this.done=false}
 next(){if(this.done)return false;if(this.step===0)this.step=1;else this.done=true;return true}
 skip(){if(this.done)return false;this.done=true;return true}
 checkpoint(){return {level:this.level,step:this.step,done:this.done}}
}
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function dialogueMarkup(session,name){const reply=session.step===1;return `<section class="encounter-panel" aria-labelledby="screen-title"><h1 id="screen-title" tabindex="-1">${session.exchange.boss?'GATEKEEPER ENCOUNTER':'BEFORE THE BATTLE'}</h1><div class="dialogue-lines" aria-live="polite" aria-atomic="true"><button class="speech-bubble opponent-speech" data-action="dialogue-next"><span class="speaker">${esc(name)}</span><span>${esc(session.exchange.opponent)}</span></button><button class="speech-bubble judah-speech ${reply?'':'unspoken'}" data-action="dialogue-next" ${reply?'':'disabled aria-hidden="true"'}><span class="speaker">JUDAH</span><span>${reply?esc(session.exchange.judah):'…'}</span></button></div><div class="dialogue-controls"><button id="dialogue-next" class="button primary" data-action="dialogue-next">${reply?'BEGIN BATTLE →':'JUDAH’S REPLY →'}</button><button class="button" data-action="dialogue-skip">SKIP »</button><button class="menu-link dialogue-disable" data-action="dialogue-disable">SKIP & TURN OFF FUTURE DIALOGUE</button></div></section>`}
