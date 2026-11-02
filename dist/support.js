// Optional outbound links only. This component has no game/save/payment API access.
export const CASH_HANDLE='$rahjreed',CASH_URL='https://cash.app/$rahjreed';
export const REFERRAL_CODE='BZFNTVD',REFERRAL_URL='https://cash.app/refer/BZFNTVD';
export function supportMarkup(){return `<div class="support-heading"><span class="support-coin" aria-hidden="true">✦</span><h2 id="support-title">INSERT COIN — SUPPORT R2G2</h2><button type="button" class="button support-close" data-support-close aria-label="Close support">✕ CLOSE</button></div><p class="support-intro">Enjoying Kingdom Race? Help us create more free educational games, improve the arcade, and bring new adventures to life!</p><section class="support-direct" aria-label="Voluntary support"><p class="support-handle">Cash App: <strong>${CASH_HANDLE}</strong> <button type="button" class="button support-copy" data-copy-cash>Copy</button></p><span class="support-copy-status" role="status" aria-live="polite"></span><input class="support-copy-value" aria-label="Cash App handle — select and copy" value="${CASH_HANDLE}" readonly hidden><a class="button support-primary" href="${CASH_URL}" target="_blank" rel="noopener noreferrer">SUPPORT WITH CASH APP</a></section><section class="support-referral" aria-labelledby="support-referral-title"><h3 id="support-referral-title">NEW TO CASH APP?</h3><p>Sign up using our referral link. Eligible new users may receive a $5 bonus after completing their first qualifying $5 payment.</p><a class="button support-referral-link" href="${REFERRAL_URL}" target="_blank" rel="noopener noreferrer">GET CASH APP — REFERRAL OFFER</a><p class="support-code">Referral code: <strong>${REFERRAL_CODE}</strong></p><p class="support-disclosure">Cash App referral eligibility and terms apply. Bonus availability and timing may vary. R2G2 may receive a referral reward.</p></section><p class="support-brand">R2G2 — Rahj Reed Golden Games<br>A Callista Digital gaming brand</p><p class="support-optional">Support is voluntary. The full game is playable without contributing.</p>`;}
// Reserved for the future Kingdom finale; never displayed on ordinary level clears.
export function kingdomSupportThanks(){return '<section class="support-thanks"><p>Thank you for playing Kingdom Race and being part of the R2G2 adventure!</p><button type="button" class="menu-link support-link" data-support-open>SUPPORT R2G2</button></section>';}
export async function copyCashHandle(dialog,clipboard=globalThis.navigator?.clipboard){
 const button=dialog.querySelector('[data-copy-cash]'),status=dialog.querySelector('.support-copy-status'),input=dialog.querySelector('.support-copy-value');if(button.disabled)return;button.disabled=true;
 try{if(!clipboard?.writeText)throw Error('Clipboard unavailable');await clipboard.writeText(CASH_HANDLE);status.textContent='COPIED $rahjreed';input.hidden=true;}
 catch{input.hidden=false;input.focus();input.select();status.textContent='Select and copy $rahjreed below.';}
 finally{button.disabled=false;}
}
export function bindSupport(root,ownerDocument=root.ownerDocument){
 let dialog=null;
 function close(){dialog?.close();}
 function open(trigger){
  if(dialog?.open)return;const panel=ownerDocument.createElement('dialog');dialog=panel;panel.className='support-modal';panel.setAttribute('aria-labelledby','support-title');panel.innerHTML=supportMarkup();
  panel.querySelector('[data-support-close]').onclick=()=>panel.close();
  panel.querySelector('[data-copy-cash]').onclick=()=>void copyCashHandle(panel);
  panel.addEventListener('cancel',event=>{event.preventDefault();panel.close();});
  panel.addEventListener('close',()=>{panel.remove();if(dialog===panel)dialog=null;if(!dialog?.open&&trigger?.isConnected)trigger.focus({preventScroll:true});},{once:true});
  ownerDocument.body.append(panel);panel.showModal();panel.querySelector('[data-support-close]').focus();
 }
 root.addEventListener('click',event=>{const trigger=event.target.closest?.('[data-support-open]');if(trigger&&root.contains(trigger))open(trigger);});
 // Stop the game's P/Escape/answer shortcuts and its pause Tab handler. Native
 // dialog behavior still handles Tab/Shift+Tab, Enter and external link clicks.
 ownerDocument.addEventListener('keydown',event=>{if(!dialog?.open)return;event.stopImmediatePropagation();if(event.key==='Escape'){event.preventDefault();close();}},true);
 return {open,close};
}
