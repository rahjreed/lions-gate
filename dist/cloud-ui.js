import {CloudProgress,publicSummary,validPublicRow,friendlyError} from './cloud-progress.js';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(text,id,disabled=false)=>`<button type="button" class="button" data-cloud="${id}" ${disabled?'disabled':''}>${text}</button>`;
export const accountButtonMarkup=signedIn=>`<button type="button" class="button cloud-account-button" data-cloud-open="account"><span class="cloud-account-label">${signedIn?'MY ACCOUNT / CLOUD SAVE':'SIGN IN / CLOUD SAVE'}</span><small>Keep your progress and medals across devices</small></button>`;
export function syncAccountButton(root,signedIn){
 const title=root.querySelector('.title-menu'),start=title?.querySelector('[data-action="start"]');if(!start)return;
 title.querySelectorAll('.menu-links [data-cloud-open="account"]').forEach(old=>old.remove());
 if(!title.querySelector('.cloud-account-button'))start.insertAdjacentHTML('beforebegin',accountButtonMarkup(signedIn));
 const label=title.querySelector('.cloud-account-label'),text=signedIn?'MY ACCOUNT / CLOUD SAVE':'SIGN IN / CLOUD SAVE';
 if(label&&label.textContent!==text)label.textContent=text;
}
export function embeddedSignInBrowser(userAgent=''){
 return /\bwv\b|FBAN|FBAV|FB_IAB|Instagram|\bLine\/|TikTok|BytedanceWebview/i.test(userAgent);
}
export async function startGoogleSignIn(cloud,userAgent=globalThis.navigator?.userAgent||''){
 if(cloud.busy||cloud.signingIn)return;
 if(embeddedSignInBrowser(userAgent)){cloud.notify('Google sign-in is unavailable in this in-app browser. Open the game directly in Chrome (Android) or Safari (iPhone). Your local progress here is unchanged.');return;}
 // Load once; the next deliberate tap opens the popup inside a fresh user gesture.
 if(!cloud.api){cloud.busy=true;cloud.notify('Loading Google sign-in…');try{await cloud.connect();cloud.notify('Ready. Press SIGN IN WITH GOOGLE to continue.');}catch(err){cloud.notify(googleSignInError(err));}finally{cloud.busy=false;cloud.notify();}return;}
 cloud.signingIn=true;cloud.notify('Opening Google sign-in…');
 try{
  cloud.prefs.resume=true;cloud.preferences();
  // No await precedes this invocation: retain Android Chrome's user activation.
  const result=await cloud.api.signIn();
  if(!result?.user?.uid)throw Error('Sign-in did not return an account.');
  if(cloud.user?.uid!==result.user.uid)await cloud.authChanged({uid:result.user.uid});else if(cloud.remote===undefined&&!cloud.busy)await cloud.inspect();
 }catch(err){cloud.notify(googleSignInError(err));}
 finally{cloud.signingIn=false;cloud.notify();}
}
function googleSignInError(error){return typeof error?.code==='string'&&error.code.startsWith('auth/')?friendlyError(error):'Google sign-in could not start. Check your connection, popup and browser-storage permissions in Chrome or Safari. Your local progress is unchanged.';}
const summary=(p,title)=>{const s=publicSummary(p);return `<section class="cloud-summary"><b>${esc(title)}</b><span>${esc(s.name)} · Level ${s.level} · ${s.souls.toLocaleString('en-US')} souls</span><small>${esc(p.run?.scriptureCollection||'kjv80')} / ${esc(p.run?.studyPath||'complete')} · Lives ${p.run?.lives??'—'} · ${Object.values(p.medals?.identities||{}).reduce((n,o)=>n+Object.values(o.categories||{}).reduce((a,c)=>a+Object.keys(c.earned||{}).length,0),0)} permanent medals</small></section>`;};
export function accountMarkup(cloud,local){
 let remote='';try{if(cloud.remote)remote=summary(JSON.parse(cloud.remote.payload),'CLOUD SAVE')+`<p class="fine-print">Revision ${cloud.remote.revision} · ${esc(cloud.remote.updatedAt?.toDate?.().toISOString()||'Saved on server')}</p>`;}catch{}
 return `<h1 id="cloud-title">PLAYER ACCOUNT</h1><p>Google sign-in is optional. Your arcade name stays separate from your Google name.</p><p class="cloud-status" role="status">${esc(cloud.status)}</p>${summary(local,'THIS DEVICE')}${remote}${cloud.user?`${button('COMPARE / RECONNECT','compare',cloud.busy)}${button(cloud.remote?'KEEP LOCAL · UPLOAD TO CLOUD':'UPLOAD LOCAL PROGRESS','upload',cloud.busy||cloud.revision===null)}${cloud.remote?button('USE CLOUD · RESTORE HERE','restore',cloud.busy):''}<p class="fine-print">Choosing a save replaces the other run only after confirmation. Both versions are backed up locally first. Earned medals from both are retained; active streaks follow the selected save.</p><label class="cloud-public"><input type="checkbox" data-cloud-public ${cloud.public?'checked':''} ${cloud.busy?'disabled':''}> List my arcade name, level, souls and top medals in the global Hall of Masters</label>${button('SIGN OUT · KEEP LOCAL PROGRESS','signout',cloud.busy)}`:button('SIGN IN WITH GOOGLE','signin',cloud.busy||cloud.signingIn)}${button('PLAY AS GUEST / CLOSE','close')}<p class="fine-print">Guest play always works offline. Cloud sync requires a connection. Public scores are player-reported, not independently verified.</p>`;
}
export function bindCloud({root,storage,bank,getProfile,applyProfile,ownerDocument=document}){
 let panel=null,mode='account',cursor=null,more=false,rows=[],loading=false,error='',focus=null;
 const cloud=new CloudProgress({storage,bank,getProfile,applyProfile,onChange:()=>{syncAccountButton(root,!!cloud.user);if(panel?.open&&mode==='account')draw();}});
 function draw(){if(!panel)return;const active=ownerDocument.activeElement?.dataset?.cloud;
  panel.innerHTML=mode==='account'?accountMarkup(cloud,getProfile()):`<h1 id="cloud-title">GLOBAL HALL OF MASTERS</h1><p>Player-reported records · Highest souls first · 20 per page</p><p role="status">${esc(error|| (loading?'Loading…':''))}</p><div class="cloud-leaderboard">${rows.filter(validPublicRow).map((r,i)=>`<article><b>${i+1}. ${esc(r.name)}</b><span>Level ${r.level} · ${r.souls.toLocaleString('en-US')} souls</span><small>${r.medals.map(m=>esc(m.replace(':',' · '))).join(' / ')||'No mastery medals yet'}</small></article>`).join('')||(!loading&&!error?'<p>No public records yet.</p>':'')}</div>${button('REFRESH','refresh',loading)}${more?button('LOAD NEXT 20','more',loading):''}${button('CLOSE','close')}`;
  panel.querySelector(`[data-cloud="${active||'close'}"]`)?.focus({preventScroll:true});
 }
 function open(next,trigger){if(panel?.open)return;mode=next;focus=trigger;panel=ownerDocument.createElement('dialog');panel.className='cloud-modal';panel.setAttribute('aria-labelledby','cloud-title');
  panel.addEventListener('cancel',e=>{e.preventDefault();panel.close();});panel.addEventListener('close',()=>{panel.remove();panel=null;if(focus?.isConnected)focus.focus({preventScroll:true});},{once:true});
  ownerDocument.body.append(panel);draw();panel.showModal();panel.querySelector('[data-cloud="close"]')?.focus();
  if(mode==='hall')void page(true);
 }
 async function page(reset){if(loading)return;loading=true;error='';if(reset){cursor=null;rows=[];more=false;}draw();
  try{await cloud.connect();const result=await cloud.api.page(cursor);rows.push(...result.rows);cursor=result.cursor;more=result.more;}catch(e){error=friendlyError(e);}finally{loading=false;if(panel?.open&&mode==='hall')draw();}
 }
 // Buttons only on non-playing screens; opening account tools cannot advance a run.
 const observer=new MutationObserver(()=>{
  syncAccountButton(root,!!cloud.user);
  const old=root.querySelector('.online-panel');if(old&&!old.querySelector('[data-cloud-open]'))old.innerHTML='<span>ONLINE RANKINGS</span><h2>Global Hall of Masters</h2><p>Optional Google sign-in and cloud progress. Only opted-in arcade records are public.</p><button class="button" data-cloud-open="hall">VIEW GLOBAL HALL</button><button class="button" data-cloud-open="account">ACCOUNT / CLOUD SAVE</button>';
 });observer.observe(root,{childList:true,subtree:true});
 syncAccountButton(root,!!cloud.user);
 ownerDocument.addEventListener('click',e=>{const trigger=e.target.closest?.('[data-cloud-open]');if(trigger&&root.contains(trigger))open(trigger.dataset.cloudOpen,trigger);});
 ownerDocument.addEventListener('keydown',e=>{if(!panel?.open)return;e.stopImmediatePropagation();if(e.key==='Escape'){e.preventDefault();panel.close();}},true);
 ownerDocument.addEventListener('click',e=>{if(!panel?.open||!panel.contains(e.target))return;const action=e.target.closest?.('[data-cloud]')?.dataset.cloud;if(!action)return;
  void (async()=>{try{
   if(action==='close')return panel.close();
   if(action==='signin')return await startGoogleSignIn(cloud);
   if(action==='compare')await cloud.inspect();
   if(action==='upload'&&confirm('Upload this device’s progress to your account? This replaces the cloud save after a revision check. Both versions are backed up locally.'))await cloud.upload(true);
   if(action==='restore'&&confirm('Restore cloud progress on this device? The previous local version will be backed up first.'))await cloud.restore();
   if(action==='signout')await cloud.signOut();
   if(action==='refresh'||action==='more')await page(action==='refresh');
  }catch(err){cloud.busy=false;cloud.notify(friendlyError(err));}finally{if(panel?.open&&mode==='account')draw();}})();
 });
 ownerDocument.addEventListener('change',e=>{if(!panel?.open||!e.target.matches('[data-cloud-public]'))return;void cloud.visibility(e.target.checked).catch(err=>cloud.notify(friendlyError(err)));});
 // Resume Auth only after the player opted in previously. Never auto-sign-in a guest.
 if(cloud.prefs.resume)void cloud.connect().catch(e=>cloud.notify(friendlyError(e)));
 return cloud;
}
