// Run-local, saved achievement ledger. Question streaks/scoring are independent.
export const powerStocks=Object.freeze({fifty:3,time:2,shield:1});
export const powerLabels=Object.freeze({fifty:'50:50',time:'+15s',shield:'Shield'});
export function flawlessState(run){return run.flawless??=( {count:0,lastLevel:0,highWater:Math.max(run.completed||0,run.rankHighWater||0),reward:null} )}
export function breakFlawless(run){const f=flawlessState(run);f.count=0;f.lastLevel=0;f.reward=null;return f}
export function restoredPower(powers){
 // Greatest proportional deficit from the existing starting stocks; stable ties.
 return Object.keys(powerStocks).filter(k=>powers[k]<powerStocks[k]).sort((a,b)=>(powerStocks[b]-powers[b])/powerStocks[b]-(powerStocks[a]-powers[a])/powerStocks[a])[0]||null;
}
export function completeFlawlessLevel(run){
 const f=flawlessState(run),floor=Math.max(f.highWater,run.completed,run.rankHighWater||0);f.reward=null;
 if(run.level<=floor){breakFlawless(run);f.highWater=floor;return}
 f.highWater=run.level;
 if(run.answers.length!==10||!run.answers.every(a=>a.correct)){breakFlawless(run);return}
 f.count=f.count===1&&f.lastLevel===run.level-1?2:1;f.lastLevel=run.level;
 if(f.count===2){const type=restoredPower(run.powers);if(type)run.powers[type]++;f.reward={level:run.level,type};f.count=0;f.lastLevel=0;}
}
export function validFlawless(f){return f===undefined||!!f&&[0,1].includes(f.count)&&['lastLevel','highWater'].every(k=>Number.isSafeInteger(f[k])&&f[k]>=0)&&f.lastLevel<=f.highWater&&(f.count===1?f.lastLevel>=1:f.lastLevel===0)&&(f.reward===null||!!f.reward&&Number.isSafeInteger(f.reward.level)&&f.reward.level>=1&&f.reward.level<=f.highWater&&(f.reward.type===null||Object.hasOwn(powerStocks,f.reward.type)))}
export function flawlessMarkup(run){return `<span class="flawless-streak" aria-label="Flawless Streak: ${run.flawless?.count||0}/2">Flawless Streak: ${run.flawless?.count||0}/2</span>`}
export function flawlessRewardMarkup(run){const r=run.status==='levelup'&&run.flawless?.reward;if(!r||r.level!==run.level)return '';return `<p class="flawless-reward ${r.type?'restored':''}" role="status">${r.type?'✦ POWER-UP RESTORED!':'POWER-UPS FULL'}<small>${r.type?powerLabels[r.type]+' +1':'Two flawless levels · inventory already full'}</small></p>`}
