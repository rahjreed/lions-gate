import {CloudProgress,publicSummary,validPublicRow,friendlyError,decodeProfile,stable} from './cloud-progress.js';
import {cleanNickname} from './storage.js';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(text,id,disabled=false)=>`<button type="button" class="button" data-cloud="${id}" ${disabled?'disabled':''}>${text}</button>`;
export function accountState(cloud,online=globalThis.navigator?.onLine!==false){
 if(!cloud.user)return {id:'guest',label:'Play as Guest'};
 if(!online)return {id:'action',label:'Action required — offline'};
 if(cloud.issue)return {id:'action',label:cloud.issue==='conflict'?'Action required — choose progress':'Action required — check connection'};
 if(cloud.settingUp)return {id:'pending',label:'Finishing setup'};
 if(cloud.bound&&cloud.revision>=1&&cloud.remote)return {id:'connected',label:'Connected to Cloud'};
 if(cloud.remote&&!cloud.busy&&!cloud.signingIn)return {id:'action',label:'Action required — choose progress'};
 return {id:'pending',label:'Finishing setup'};
}
export const googleButtonMarkup=(title=false,disabled=false)=>`<button type="button" class="google-signin" ${title?'data-cloud-open="account" data-cloud-google':'data-cloud="signin"'} ${disabled?'disabled':''}><img src="assets/account/google-g.png" width="20" height="20" alt="" aria-hidden="true"><span>Sign in with Google</span></button>`;
export function accountButtonMarkup(state={id:'guest'}){
 if(state.id==='connected')return '';
 return `<div class="cloud-account-entry" data-mode="${state.id==='guest'?'guest':'setup'}">${state.id==='guest'?googleButtonMarkup(true):'<button type="button" class="button cloud-setup-button" data-cloud-open="account">Finish account setup</button>'}<small>Keep your progress and medals across devices</small></div>`;
}
export function syncAccountButton(root,cloud){
 const title=root.querySelector('.title-menu'),start=title?.querySelector('[data-action="start"]');if(!start)return;
 title.querySelectorAll('.menu-links [data-cloud-open="account"],.cloud-account-button').forEach(old=>old.remove());
 const state=accountState(cloud),mode=state.id==='guest'?'guest':'setup';let entry=title.querySelector('.cloud-account-entry');
 if(state.id==='connected'){entry?.remove();return;}
 if(!entry||entry.dataset.mode!==mode){entry?.remove();start.insertAdjacentHTML('beforebegin',accountButtonMarkup(state));entry=title.querySelector('.cloud-account-entry');}
 const google=entry?.querySelector('.google-signin');if(google)google.disabled=!!(cloud.busy||cloud.signingIn);
}
export function embeddedSignInBrowser(userAgent=''){return /\bwv\b|FBAN|FBAV|FB_IAB|Instagram|\bLine\/|TikTok|BytedanceWebview/i.test(userAgent);}
export async function startGoogleSignIn(cloud,userAgent=globalThis.navigator?.userAgent||''){
 if(cloud.busy||cloud.signingIn)return;
 if(embeddedSignInBrowser(userAgent)){cloud.notify('Google sign-in is unavailable in this in-app browser. Open the game directly in Chrome (Android) or Safari (iPhone). Your local progress here is unchanged.');return;}
 // A cold SDK load must not launch a popup after the original tap has expired.
 if(!cloud.api){
  cloud.busy=true;cloud.notify('Preparing Google sign-in…');
  try{await cloud.connect();if(!cloud.user)cloud.notify('Ready. Choose Sign in with Google to continue.');}
  catch(err){cloud.issue='authentication';cloud.notify(googleSignInError(err));}
  finally{cloud.busy=false;cloud.notify();}
  if(cloud.user&&cloud.remote===undefined&&!cloud.issue)await cloud.inspect();
  return;
 }
 cloud.signingIn=true;cloud.issue=null;cloud.notify('Opening Google sign-in…');
 try{
  cloud.prefs.resume=true;cloud.preferences();
  // Invoke inside the tap/click stack; do not await before opening the popup.
  const result=await cloud.api.signIn();
  if(!result?.user?.uid)throw Error('Sign-in did not return an account.');
  if(cloud.user?.uid!==result.user.uid)await cloud.authChanged({uid:result.user.uid});else if(cloud.remote===undefined&&!cloud.busy)await cloud.inspect();
 }catch(err){cloud.issue='authentication';cloud.notify(googleSignInError(err));}
 finally{cloud.signingIn=false;cloud.notify();}
}
function googleSignInError(error){return typeof error?.code==='string'&&error.code.startsWith('auth/')?friendlyError(error):'Google sign-in could not start. Check your connection, popup and browser-storage permissions in Chrome or Safari. Your local progress is unchanged.';}
const summary=(p,title)=>{const s=publicSummary(p);return `<section class="cloud-summary"><b>${esc(title)}</b><span>${esc(s.name)} · Level ${s.level} · ${s.souls.toLocaleString('en-US')} souls</span><small>${esc(p.run?.scriptureCollection||'kjv80')} / ${esc(p.run?.studyPath||'complete')} · Lives ${p.run?.lives??'—'} · ${Object.values(p.medals?.identities||{}).reduce((n,o)=>n+Object.values(o.categories||{}).reduce((a,c)=>a+Object.keys(c.earned||{}).length,0),0)} permanent medals</small></section>`;};
export function accountMarkup(cloud,local){
 const state=accountState(cloud);let remote='';try{if(cloud.remote)remote=summary(JSON.parse(cloud.remote.payload),'IN YOUR ACCOUNT');}catch{}
 let status=cloud.status;
 if(state.id==='connected'&&!cloud.busy)status='Your progress and medals are connected to your account.';
 if(state.id==='pending'&&cloud.remote===null&&!cloud.busy)status='Connect this device’s progress to your account. Nothing is uploaded until you confirm.';
 if(globalThis.navigator?.onLine===false)status='You’re offline. Your progress stays on this device. Reconnect and check your account.';
 return `<div class="cloud-modal-heading"><h1 id="cloud-title">PLAYER ACCOUNT</h1><button type="button" class="cloud-close" data-cloud="close" aria-label="Close account menu">✕ Close</button></div><p>One account for your adventure and medals. Guest play is always available.</p><p class="cloud-status" role="status">${esc(status)}</p>${summary(local,'ON THIS DEVICE')}${remote}${cloud.user?`${button('Check saved progress','compare',cloud.busy)}${button(cloud.remote?'Use this device’s progress':'Connect this progress','upload',cloud.busy||cloud.revision===null)}${cloud.remote?button('Use progress from my account','restore',cloud.busy):''}<p class="fine-print">Choose which journey to continue. Changes require your confirmation; both versions are backed up here first. Earned medals from both are kept. Current streaks follow the selected save.</p>${cloud.remote?`<label class="cloud-public"><input type="checkbox" data-cloud-public ${cloud.public?'checked':''} ${cloud.busy?'disabled':''}> List my arcade name, level, souls and top medals in the global Hall of Masters</label>`:''}${button('Sign out · keep local progress','signout',cloud.busy)}`:googleButtonMarkup(false,cloud.busy||cloud.signingIn)+button('Play as Guest','close')}<p class="fine-print">Offline play keeps saving on this device. Public scores are player-reported.</p>`;
}
export function bindCloud({root,storage,bank,getProfile,applyProfile,ownerDocument=document}){
 let panel=null,mode='account',cursor=null,more=false,rows=[],loading=false,error='',focus=null,autoCloseArmed=false,actions=0,toast=null,toastTimer=null;
 const cloud=new CloudProgress({storage,bank,getProfile,applyProfile,onChange:changed});
 const bar=ownerDocument.createElement('div');bar.className='cloud-account-bar';bar.hidden=true;bar.innerHTML='<button type="button" class="cloud-account-indicator" data-cloud-open="account"><span class="cloud-arcade-name"></span><span class="cloud-connection-label"></span></button>';
 ownerDocument.querySelector('body>header')?.insertAdjacentElement('afterend',bar);
 function updateControls(){
  syncAccountButton(root,cloud);bar.hidden=!cloud.user;if(!cloud.user)return;
  const profile=getProfile(),state=accountState(cloud),name=cleanNickname(profile.run?.nickname||profile.nickname),nameEl=bar.querySelector('.cloud-arcade-name'),statusEl=bar.querySelector('.cloud-connection-label');
  if(nameEl.textContent!==name)nameEl.textContent=name;if(statusEl.textContent!==state.label)statusEl.textContent=state.label;bar.dataset.state=state.id;
 }
 function success(){
  toast?.remove();globalThis.clearTimeout(toastTimer);toast=ownerDocument.createElement('div');toast.className='cloud-account-toast';toast.setAttribute('role','status');toast.textContent='Connected to Cloud — your progress and medals are ready.';ownerDocument.body.append(toast);toastTimer=globalThis.setTimeout(()=>{toast?.remove();toast=null;},4000);
 }
 function changed(){
  updateControls();
  if(toast&&accountState(cloud).id!=='connected'){toast.remove();toast=null;globalThis.clearTimeout(toastTimer);}
  if(panel?.open&&mode==='account'){
   if(autoCloseArmed&&!actions&&!cloud.busy&&!cloud.signingIn&&accountState(cloud).id==='connected'){autoCloseArmed=false;panel.close();success();}
   else draw();
  }
 }
 function draw(){if(!panel)return;const active=ownerDocument.activeElement?.dataset?.cloud;
  panel.innerHTML=mode==='account'?accountMarkup(cloud,getProfile()):`<h1 id="cloud-title">GLOBAL HALL OF MASTERS</h1><p>Player-reported records · Highest souls first · 20 per page</p><p role="status">${esc(error|| (loading?'Loading…':''))}</p><div class="cloud-leaderboard">${rows.filter(validPublicRow).map((r,i)=>`<article><b>${i+1}. ${esc(r.name)}</b><span>Level ${r.level} · ${r.souls.toLocaleString('en-US')} souls</span><small>${r.medals.map(m=>esc(m.replace(':',' · '))).join(' / ')||'No mastery medals yet'}</small></article>`).join('')||(!loading&&!error?'<p>No public records yet.</p>':'')}</div>${button('REFRESH','refresh',loading)}${more?button('LOAD NEXT 20','more',loading):''}${button('CLOSE','close')}`;
  panel.querySelector(`[data-cloud="${active||'close'}"]`)?.focus({preventScroll:true});
 }
 function restoreFocus(){
  if(focus?.isConnected&&focus.getClientRects().length)focus.focus({preventScroll:true});
  else (bar.hidden?root.querySelector('.google-signin,[data-action="start"],#resume-button'):bar.querySelector('button'))?.focus({preventScroll:true});
 }
 function open(next,trigger){
  if(panel?.open)return;mode=next;focus=trigger;autoCloseArmed=next==='account'&&accountState(cloud).id!=='connected';
  // Reuse the game's existing pause path before opening account tools in battle.
  const pause=ownerDocument.querySelector('#pause-control');if(pause&&!pause.hidden&&!ownerDocument.body.classList.contains('app-paused'))pause.click();
  const current=ownerDocument.createElement('dialog');panel=current;current.className='cloud-modal';current.setAttribute('aria-labelledby','cloud-title');
  current.addEventListener('cancel',e=>{e.preventDefault();current.close();});current.addEventListener('close',()=>{current.remove();if(panel===current){panel=null;autoCloseArmed=false;restoreFocus();}},{once:true});
  ownerDocument.body.append(current);draw();current.showModal();current.querySelector('[data-cloud="close"]')?.focus();if(mode==='hall')void page(true);
 }
 async function setup(work,arm=true){actions++;if(arm){autoCloseArmed=true;cloud.settingUp=true;}try{return await work();}catch(err){cloud.bound=false;cloud.issue='connection';throw err;}finally{actions--;if(!actions)cloud.settingUp=false;changed();}}
 async function page(reset){if(loading)return;loading=true;error='';if(reset){cursor=null;rows=[];more=false;}draw();
  try{await cloud.connect();const result=await cloud.api.page(cursor);rows.push(...result.rows);cursor=result.cursor;more=result.more;}catch(e){error=friendlyError(e);}finally{loading=false;if(panel?.open&&mode==='hall')draw();}
 }
 const observer=new MutationObserver(()=>{
  updateControls();
  const old=root.querySelector('.online-panel');if(old&&!old.querySelector('[data-cloud-open]'))old.innerHTML='<span>ONLINE RANKINGS</span><h2>Global Hall of Masters</h2><p>Optional Google sign-in and cloud progress. Only opted-in arcade records are public.</p><button class="button" data-cloud-open="hall">VIEW GLOBAL HALL</button><button class="button" data-cloud-open="account">ACCOUNT / CLOUD SAVE</button>';
 });observer.observe(root,{childList:true,subtree:true});updateControls();
 ownerDocument.addEventListener('click',event=>{const trigger=event.target.closest?.('[data-cloud-open]');if(!trigger||!(root.contains(trigger)||bar.contains(trigger)))return;open(trigger.dataset.cloudOpen,trigger);if(trigger.hasAttribute('data-cloud-google'))void setup(()=>startGoogleSignIn(cloud));});
 ownerDocument.addEventListener('keydown',e=>{if(!panel?.open)return;e.stopImmediatePropagation();if(e.key==='Escape'){e.preventDefault();panel.close();}},true);
 ownerDocument.addEventListener('click',e=>{if(!panel?.open||!panel.contains(e.target))return;const action=e.target.closest?.('[data-cloud]')?.dataset.cloud;if(!action)return;
  void (async()=>{try{
   if(action==='close')return panel.close();
   if(action==='signin')return await setup(()=>startGoogleSignIn(cloud));
   if(action==='compare')await setup(()=>cloud.inspect(),!cloud.bound);
   if(action==='upload'&&confirm('Connect this device’s progress to your account? This will replace the account’s saved journey after checking for newer changes. Both versions are backed up on this device.'))await setup(()=>cloud.upload(true));
   if(action==='restore'&&confirm('Continue with the progress in your account? This device’s current journey will be backed up before it is replaced.'))await setup(async()=>{
    await cloud.restore();
    // Finish publishing retained permanent medals before declaring setup complete.
    if(cloud.bound&&cloud.remote&&stable(getProfile())!==stable(decodeProfile(cloud.remote.payload,bank)))await cloud.upload();
   });
   if(action==='signout')await cloud.signOut();
   if(action==='refresh'||action==='more')await page(action==='refresh');
  }catch(err){cloud.busy=false;cloud.issue='connection';cloud.notify(friendlyError(err));}finally{if(panel?.open&&mode==='account')draw();}})();
 });
 ownerDocument.addEventListener('change',e=>{if(!panel?.open||!e.target.matches('[data-cloud-public]'))return;void cloud.visibility(e.target.checked).catch(err=>cloud.notify(friendlyError(err)));});
 ownerDocument.defaultView?.addEventListener('offline',changed);
 ownerDocument.defaultView?.addEventListener('online',()=>{if(cloud.user&&!cloud.busy)void cloud.inspect();changed();});
 if(cloud.prefs.resume)void cloud.connect().catch(e=>{cloud.issue='connection';cloud.notify(friendlyError(e));});
 return cloud;
}
