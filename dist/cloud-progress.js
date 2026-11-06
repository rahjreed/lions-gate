import {loadProfile,cleanNickname} from './storage.js';
import {validRun} from './engine.js';
import {loadMedals,topMasteryMedals,medalCategories,medalTiers} from './mastery-medals.js';
export const SAVE_KEY='lions-gate-arcade-v3',CLOUD_KEY='lions-gate-cloud-v1',MAX_PAYLOAD_BYTES=700000;
export const stable=value=>JSON.stringify(sortObject(value));
function sortObject(v){return Array.isArray(v)?v.map(sortObject):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sortObject(v[k])])):v;}
export function encodeProfile(profile){const payload=JSON.stringify(profile);if(new TextEncoder().encode(payload).length>MAX_PAYLOAD_BYTES)throw Error('This save is too large for cloud sync. Your local progress is safe.');return payload;}
export function decodeProfile(payload,bank){
 if(typeof payload!=='string'||new TextEncoder().encode(payload).length>MAX_PAYLOAD_BYTES)throw Error('Invalid cloud save size.');
 const p=JSON.parse(payload);
 if(!p||p.version!==3||typeof p.nickname!=='string'||!Array.isArray(p.records)||!Number.isSafeInteger(p.bestScore)||p.bestScore<0||!Number.isSafeInteger(p.bestCompleted)||p.bestCompleted<0||!p.settings||!p.armor||!p.mastery||p.run!==null&&!validRun(p.run,bank))throw Error('Cloud save is incompatible. Local progress was kept.');
 // Use the same migration and optional-field validation as local Continue.
 const restored=loadProfile({getItem:()=>payload},bank);
 if(p.run&&!restored.run)throw Error('Cloud run could not be restored.');
 if(p.medals&&stable(loadMedals(p.medals))!==stable(p.medals))throw Error('Cloud medal data failed validation. Local progress was kept.');
 return restored;
}
export function compareSaves(local,remote,bank){
 if(!remote)return 'associate';
 if(remote.schema!==1||!Number.isSafeInteger(remote.revision)||remote.revision<1||typeof remote.leaderboardEnabled!=='boolean')throw Error('Unsupported cloud revision.');
 return stable(decodeProfile(remote.payload,bank))===stable(local)?'same':'conflict';
}
// A conflict choice selects the run/current streak, never revokes permanent medals.
export function retainEarnedMedals(chosen,other){
 const merged=loadMedals(chosen.medals),source=loadMedals(other.medals);
 for(const [id,owner]of Object.entries(source.identities)){
  if(!merged.identities[id]){merged.identities[id]=structuredClone(owner);continue;}
  const target=merged.identities[id];
  for(const [cat,s]of Object.entries(owner.categories)){
   const t=target.categories[cat]??={current:0,best:0,earned:{},seen:{},laterReviews:[]};
   t.best=Math.max(t.best,s.best);
   for(const [tier,award]of Object.entries(s.earned))if(!t.earned[tier])t.earned[tier]=structuredClone(award);
  }
  for(const [run,count]of Object.entries(owner.receipts))target.receipts[run]=Math.max(target.receipts[run]||0,count);
 }
 return {...chosen,medals:merged};
}
export function publicSummary(p){
 const name=cleanNickname(p.run?.nickname||p.nickname);
 return {name,level:Math.max(1,p.bestCompleted+1,p.run?.level||1,...p.records.map(r=>r.level||r.completed+1)),souls:Math.max(0,p.bestScore,p.run?.score||0),medals:topMasteryMedals(p.medals,name).map(m=>m.category+':'+m.tier)};
}
export function validPublicRow(row){return row&&typeof row.name==='string'&&row.name===cleanNickname(row.name)&&Number.isSafeInteger(row.level)&&row.level>=1&&Number.isSafeInteger(row.souls)&&row.souls>=0&&Array.isArray(row.medals)&&row.medals.length<=3&&row.medals.every(m=>typeof m==='string'&&medalCategories.some(c=>medalTiers.some(t=>m===c.id+':'+t.id)));}
// Dependency-injected controller: no network or SDK initialization at module import.
export class CloudProgress{
 constructor({storage,bank,getProfile,applyProfile,onChange=()=>{},schedule=(fn,delay)=>globalThis.setTimeout(fn,delay),cancel=id=>globalThis.clearTimeout(id)}){
  Object.assign(this,{storage,bank,getProfile,applyProfile,onChange,schedule,cancel});this.user=null;this.api=null;this.revision=null;this.bound=false;this.busy=false;this.generation=0;this.timer=null;this.public=false;this.status='Play as Guest — progress stays on this device.';
  try{this.prefs=JSON.parse(storage.getItem(CLOUD_KEY))||{};}catch{this.prefs={};}
 }
 notify(text){if(text)this.status=text;this.onChange();}
 preferences(){try{this.storage.setItem(CLOUD_KEY,JSON.stringify(this.prefs));}catch{throw Error('Browser storage unavailable. Cloud changes stopped to protect local progress.');}}
 async connect(loader=()=>import('./firebase-sdk.js').then(m=>m.firebaseAdapter())){
  if(this.api)return;
  if(this.connecting)return this.connecting;
  this.connecting=(async()=>{this.api=await loader();this.unsubscribe=this.api.observe(user=>{void this.authChanged(user);});})();
  try{await this.connecting;}finally{this.connecting=null;}
 }
 async authChanged(user){
  if(user&&this.user?.uid===user.uid)return; // Popup result and Auth observer may report the same login.
  this.generation++;this.cancel(this.timer);this.timer=null;this.user=user;this.bound=false;this.revision=null;this.remote=undefined;this.public=false;
  if(!user)return this.notify('Play as Guest — local progress is preserved.');
  this.notify('Signed in. Compare cloud progress before enabling sync.');
  await this.inspect();
 }
 async inspect(){
  if(!this.user||this.busy)return;
  const gen=this.generation,uid=this.user.uid;this.busy=true;this.notify('Checking cloud progress…');
  try{const remote=await this.api.read(uid);if(gen!==this.generation)return;
   const state=compareSaves(this.getProfile(),remote,this.bank);this.remote=remote;this.public=remote?.leaderboardEnabled===true;this.revision=remote?.revision||0;this.bound=state==='same';
   this.notify(state==='same'?'Cloud and local progress match. Sync enabled.':state==='associate'?'No cloud save yet. Choose Upload Local to associate this device’s progress.':'Local and cloud saves differ. Choose which progress to keep. Nothing has been replaced.');
  }catch(e){if(gen===this.generation){this.bound=false;this.notify(friendlyError(e));}}
  finally{this.busy=false;this.onChange();}
 }
 backup(local,remote){
  const key='lions-gate-cloud-backups-v1';let old=[];try{old=JSON.parse(this.storage.getItem(key))||[];}catch{}
  const item={uid:this.user.uid,at:new Date().toISOString(),local:encodeProfile(local),cloud:remote?.payload||null,revision:remote?.revision||0};
  const backups=JSON.stringify([item,...(Array.isArray(old)?old:[])]);
  this.storage.setItem(key,backups);
  if(this.storage.getItem(key)!==backups)throw Error('Could not back up local progress. No save was replaced.');
 }
 async upload(explicit=false){
  if(!this.user||this.busy||this.revision===null||!explicit&&!this.bound)return;
  const gen=this.generation,uid=this.user.uid,initial=structuredClone(this.getProfile());let profile=initial;
  this.busy=true;this.notify('Saving to cloud…');
  try{
   if(explicit)this.backup(profile,this.remote);
   if(this.remote)profile=retainEarnedMedals(profile,decodeProfile(this.remote.payload,this.bank));
   const payload=encodeProfile(profile);
   const revision=await this.api.write(uid,this.revision,payload,publicSummary(profile));
   if(gen!==this.generation)return;this.revision=revision;this.remote={schema:1,revision,payload,leaderboardEnabled:this.public};this.bound=true;
   // Preserve newer live gameplay if the account modal was closed mid-request.
   const current=this.getProfile(),merged=retainEarnedMedals(current,profile);
   if(stable(merged.medals)!==stable(current.medals)){this.storage.setItem(SAVE_KEY,JSON.stringify(merged));current.medals=merged.medals;}
   this.notify('Cloud progress saved. Local progress is retained.');
   if(stable(profile)!==stable(this.getProfile()))this.localChanged();
  }catch(e){if(gen===this.generation){this.bound=false;this.remote=undefined;this.revision=null;this.notify(friendlyError(e));}}
  finally{this.busy=false;this.onChange();}
 }
 async restore(){
  if(!this.user||this.busy||!this.remote)return;
  const gen=this.generation,initial=stable(this.getProfile());this.busy=true;this.notify('Checking selected cloud revision…');
  try{
   const remote=await this.api.read(this.user.uid);if(gen!==this.generation)return;
   if(!remote||remote.revision!==this.remote.revision)throw Error('Cloud progress changed. Compare saves again before restoring.');
   if(stable(this.getProfile())!==initial)throw Error('Local progress changed while restoring. Compare saves again.');
   const restored=retainEarnedMedals(decodeProfile(remote.payload,this.bank),this.getProfile());this.backup(this.getProfile(),remote);
   // Local commit must succeed before changing the running application.
   this.storage.setItem(SAVE_KEY,JSON.stringify(restored));
   if(this.storage.getItem(SAVE_KEY)!==JSON.stringify(restored))throw Error('Could not save restored progress locally.');
   this.applyProfile(restored);this.remote=remote;this.revision=remote.revision;this.bound=true;this.notify('Cloud progress restored. Earned medals from both saves are retained. Previous local progress is backed up on this device.');if(stable(restored)!==stable(decodeProfile(remote.payload,this.bank)))this.localChanged();
  }catch(e){if(gen===this.generation){this.bound=false;this.notify(friendlyError(e));}}
  finally{this.busy=false;this.onChange();}
 }
 localChanged(){
  if(!this.bound||!this.user||this.timer)return;
  // Throttle, not a trailing debounce: one transaction at most every 30s.
  this.timer=this.schedule(()=>{this.timer=null;void this.upload();},30000);
 }
 async signOut(){
  this.generation++;this.bound=false;this.cancel(this.timer);this.timer=null;this.prefs.resume=false;this.preferences();
  await this.api?.signOut();this.user=null;this.notify('Signed out. Play as Guest with local progress intact.');
 }
 async visibility(enabled){
  if(!this.user||this.busy)return;
  if(!this.remote||this.revision===null)return this.notify('First compare and save your private progress, then choose leaderboard visibility.');
  const gen=this.generation;this.busy=true;this.notify('Updating leaderboard visibility…');
  try{
   const revision=await this.api.write(this.user.uid,this.revision,this.remote.payload,publicSummary(decodeProfile(this.remote.payload,this.bank)),enabled);
   if(gen!==this.generation)return;this.revision=revision;this.remote={...this.remote,revision,leaderboardEnabled:enabled};this.public=enabled;
   this.notify(enabled?'Your saved arcade record is listed publicly.':'Leaderboard entry removed. Private progress is unchanged.');
  }catch(e){if(gen===this.generation){this.bound=false;this.revision=null;this.notify(friendlyError(e));}}
  finally{this.busy=false;this.onChange();}
 }
}
export function friendlyError(e){
 const code=e?.code||'';
 if(code==='auth/popup-closed-by-user'||code==='auth/cancelled-popup-request')return 'Sign-in cancelled. Guest progress is safe.';
 if(code==='auth/popup-blocked')return 'Allow the Google sign-in popup, then try again. Guest play remains available.';
 if(code==='auth/unauthorized-domain')return 'This hostname needs Firebase Authentication authorization. Guest play remains available.';
 if(code==='auth/operation-not-supported-in-this-environment'||code==='auth/disallowed-useragent')return 'Google sign-in is unavailable in this browser. Open the game directly in Chrome or Safari. Local progress here is unchanged.';
 if(code==='auth/web-storage-unsupported')return 'Google sign-in needs browser storage. Allow storage in Chrome or Safari, or keep playing as Guest.';
 if(code==='permission-denied')return 'Cloud access was denied. Check Firebase rules and sign-in. Local progress is safe.';
 if(code==='unavailable'||code==='auth/network-request-failed')return 'Cloud unavailable or offline. Keep playing locally; reconnect and compare saves later.';
 if(typeof code==='string'&&code.startsWith('auth/'))return 'Google sign-in could not finish. Try again in Chrome or Safari. Local progress is unchanged.';
 return (e?.message||'Cloud unavailable.')+' Your local progress is safe.';
}
