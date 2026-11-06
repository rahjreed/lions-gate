import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CloudProgress,stable,friendlyError,SAVE_KEY} from '../dist/cloud-progress.js';
import {startGoogleSignIn,embeddedSignInBrowser,accountButtonMarkup,accountMarkup,accountState,googleButtonMarkup} from '../dist/cloud-ui.js';
import {emptyProfile} from '../dist/storage.js';
import {questions} from '../dist/questions.js';

const p=emptyProfile(),profileBefore=stable(p),map=new Map([[SAVE_KEY,JSON.stringify(p)]]),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
// Node's timers tolerate a foreign receiver, unlike browser Window timers.
// Enforce the browser brand here so the original Illegal invocation regresses.
const oldSet=globalThis.setTimeout,oldClear=globalThis.clearTimeout,jobs=[],cancelled=[];
globalThis.setTimeout=function(fn,delay){assert.equal(this,globalThis,'setTimeout must retain its global receiver');jobs.push({fn,delay});return jobs.length;};
globalThis.clearTimeout=function(id){assert.equal(this,globalThis,'clearTimeout must retain its global receiver');cancelled.push(id);};
try{
 const cloud=new CloudProgress({storage,bank:questions,getProfile:()=>p,applyProfile:()=>assert.fail('Sign-in cannot apply a save')});let reads=0;
 cloud.api={read:async()=>{reads++;return null;},signOut:async()=>{}};
 await cloud.authChanged({uid:'auth-fixture'});assert.equal(reads,1);assert.equal(cloud.revision,0);assert.equal(cloud.bound,false);
 cloud.bound=true;cloud.localChanged();assert.equal(jobs.length,1);assert.equal(jobs[0].delay,30000);await cloud.signOut();assert.ok(cancelled.includes(1));assert.equal(cloud.user,null);
}finally{globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;}

const chrome='Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36';
assert.equal(embeddedSignInBrowser(chrome),false);assert.equal(embeddedSignInBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Mobile/15E148 Safari/604.1'),false);
for(const ua of [chrome.replace('Android 15; Pixel 9','Android 15; Pixel 9; wv'),'FBAN/FB4A;FBAV/1','Instagram 300','Line/15','TikTok 1'])assert.equal(embeddedSignInBrowser(ua),true);
function authFixture(){const c=new CloudProgress({storage,bank:questions,getProfile:()=>p,applyProfile:()=>assert.fail('No automatic migration'),schedule:()=>1,cancel:()=>{}});let calls=0,connects=0;
 c.connect=async()=>{connects++;c.api={signIn(){assert.equal(this,c.api,'Keep adapter invocation attached');calls++;return Promise.resolve({user:{uid:'auth-fixture'}});},read:async()=>null};};
 return {c,get calls(){return calls;},get connects(){return connects;}};
}
const f=authFixture();await startGoogleSignIn(f.c,chrome);assert.equal(f.connects,1);assert.equal(f.calls,0,'Preloading cannot open an asynchronous popup');assert.match(f.c.status,/Ready/);
const signIn=startGoogleSignIn(f.c,chrome);assert.equal(f.calls,1,'Popup invoked synchronously before the first await');assert.equal(f.c.signingIn,true);assert.match(accountMarkup(f.c,p),/data-cloud="signin" disabled/);await signIn;assert.equal(f.c.user.uid,'auth-fixture');assert.equal(f.c.signingIn,false);assert.equal(f.c.bound,false,'No implicit guest association');
const duplicate=authFixture();await duplicate.c.connect();let finish;duplicate.c.api.signIn=()=>{return new Promise(resolve=>finish=resolve);};const first=startGoogleSignIn(duplicate.c,chrome);await startGoogleSignIn(duplicate.c,chrome);finish({user:{uid:'auth-fixture'}});await first;
const unsupported=authFixture();await startGoogleSignIn(unsupported.c,'FBAN/FB4A');assert.equal(unsupported.connects,0);assert.equal(unsupported.calls,0);assert.match(unsupported.c.status,/in-app browser/);
for(const code of ['auth/popup-blocked','auth/popup-closed-by-user','auth/network-request-failed','auth/unauthorized-domain','auth/web-storage-unsupported','auth/operation-not-supported-in-this-environment','auth/unknown-test']){
 const e=authFixture();await e.c.connect();e.c.api.signIn=()=>Promise.reject({code,message:'DO_NOT_DISPLAY token=secret email=private@example.com'});await startGoogleSignIn(e.c,chrome);assert.equal(e.c.user,null);assert.equal(e.c.signingIn,false);assert.doesNotMatch(e.c.status,/DO_NOT_DISPLAY|token=|private@example/);assert.equal(stable(p),profileBefore);assert.equal(map.get(SAVE_KEY),JSON.stringify(p));
}
const init=authFixture();init.c.connect=async()=>{throw Error('DO_NOT_DISPLAY credential=secret');};await startGoogleSignIn(init.c,chrome);assert.equal(init.c.busy,false);assert.doesNotMatch(init.c.status,/secret|credential=/);assert.match(init.c.status,/connection/);
assert.match(friendlyError({code:'auth/web-storage-unsupported'}),/storage/);
assert.match(friendlyError({code:'auth/network-request-failed'}),/offline/);
const guestButton=accountButtonMarkup();assert.match(guestButton,/Sign in with Google/);assert.match(guestButton,/Keep your progress and medals across devices/);assert.match(guestButton,/data-cloud-google/);assert.equal((guestButton.match(/<button/g)||[]).length,1);assert.equal(accountButtonMarkup({id:'connected'}),'');assert.match(accountButtonMarkup({id:'pending'}),/Finish account setup/);assert.doesNotMatch(accountButtonMarkup({id:'pending'}),/google-g.png/);
const branded=googleButtonMarkup();assert.match(branded,/google-g.png/);assert.match(branded,/width="20" height="20"/);assert.match(branded,/data-cloud="signin"/);assert.match(branded,/>Sign in with Google</);assert.doesNotMatch(branded,/class="button/);
const signed={user:{uid:'test'},bound:false,revision:null,remote:undefined,busy:false,issue:null};assert.equal(accountState({user:null}).id,'guest');assert.equal(accountState(signed).label,'Finishing setup');assert.equal(accountState({...signed,remote:null,revision:0}).id,'pending');assert.equal(accountState({...signed,issue:'connection',remote:null,revision:0}).id,'action');assert.equal(accountState({...signed,issue:'conflict'}).id,'action');const linked={...signed,bound:true,revision:1,remote:{schema:1}};assert.equal(accountState(linked).label,'Connected to Cloud');assert.equal(accountState(linked,false).id,'action');assert.equal(accountState({...linked,issue:'connection'}).id,'action');assert.equal(accountState({...linked,user:null}).id,'guest');
assert.match(accountMarkup({...signed,status:'Waiting'},p),/Close account menu/);
const ui=await readFile(new URL('../dist/cloud-ui.js',import.meta.url),'utf8'),css=await readFile(new URL('../dist/cloud.css',import.meta.url),'utf8');assert.match(ui,/start\.insertAdjacentHTML\('beforebegin',accountButtonMarkup/);assert.match(ui,/syncAccountButton\(root,cloud\)/);assert.match(ui,/old=>old.remove/);assert.doesNotMatch(ui,/class="menu-link" data-cloud-open="account"/);assert.match(css,/min-height:44px/);assert.match(css,/'Google Sans',Arial,sans-serif/);assert.match(css,/focus-visible/);assert.match(ui,/autoCloseArmed/);assert.match(ui,/!actions&&!cloud.busy&&!cloud.signingIn/);
const sdk=await readFile(new URL('../dist/firebase-sdk.js',import.meta.url),'utf8');assert.match(sdk,/getAuth\(app\)/);assert.match(sdk,/signIn:\(\)=>signInWithPopup\(auth,new GoogleAuthProvider\(\)\)/);assert.doesNotMatch(sdk,/signInWithRedirect|setPersistence/);
console.log('PASS cloud authentication: Window-branded timer regression, Auth success reaches reconciliation without auto-migration, synchronous user-gesture popup, duplicate guard, embedded-browser guidance, safe failure messages and unchanged guest save; prominent state-aware button markup/order, footer removal, focus/touch styles and unchanged SDK/persistence/redirect policy.');
