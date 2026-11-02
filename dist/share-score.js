// Sharing is read-only: Facebook receives only the public game URL.
import {cleanNickname} from './storage.js';
export const GAME_URL='https://lionsgate.callistadigital.com/';
export const FACEBOOK_URL='https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(GAME_URL);
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const count=value=>Number.isSafeInteger(value)&&value>=0?value:0;
export function challengeText(record){
 const level=count(record.level)||count(record.completed)+1;
 return `Kingdom Race The Lion's Gate\n${cleanNickname(record.nickname)}\nHighest level reached: ${level.toLocaleString('en-US')}\nSouls earned (score): ${count(record.score).toLocaleString('en-US')}\nCan you beat my score?\n${GAME_URL}`;
}
export function shareScoreMarkup(record){return `<div class="score-share" aria-label="Share achievement"><div class="score-share-actions"><a class="button share-facebook" href="${FACEBOOK_URL}" target="_blank" rel="noopener noreferrer">SHARE ON FACEBOOK</a><button class="button share-copy" type="button" data-copy-challenge>Copy Challenge</button></div><span class="share-status" role="status" aria-live="polite"></span><textarea class="challenge-text" aria-label="Challenge message — select and copy" readonly hidden>${esc(challengeText(record))}</textarea></div>`;}
export async function copyChallenge(button,clipboard=globalThis.navigator?.clipboard){
 const group=button.closest('.score-share'),text=group?.querySelector('.challenge-text'),status=group?.querySelector('.share-status');
 if(!text||!status||button.disabled)return;
 button.disabled=true;
 try{if(!clipboard?.writeText)throw Error('Clipboard unavailable');await clipboard.writeText(text.value);status.textContent='CHALLENGE COPIED!';text.hidden=true;}
 catch{text.hidden=false;text.focus();text.select();status.textContent='Select and copy the challenge below.';}
 finally{button.disabled=false;}
}
export function bindChallengeCopy(root){root.addEventListener('click',event=>{const button=event.target.closest?.('[data-copy-challenge]');if(button&&root.contains(button))void copyChallenge(button);});}
