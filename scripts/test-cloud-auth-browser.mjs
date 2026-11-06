// Optional local browser QA. No production Firebase calls or real Google accounts.
// npm install --prefix .verification/browser-tests --ignore-scripts playwright-core
// Start scripts/preview-production.mjs with PREVIEW_PORT=65456 first.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../.verification/browser-tests/package.json',import.meta.url));
const {chromium}=require('playwright-core'),origin='http://127.0.0.1:65456';
const fakeSDK=`export function firebaseAdapter(){return {
 observe(fn){window.qaAuthObserve=fn;fn(null);return ()=>{};},
 signIn(){window.qaAuthCalls=(window.qaAuthCalls||0)+1;if(window.qaAuthFailure)return Promise.reject({code:window.qaAuthFailure,message:'SECRET_CREDENTIAL_MUST_NOT_RENDER'});const user={uid:'isolated-browser-qa'};window.qaAuthObserve(user);return Promise.resolve({user});},
 async signOut(){window.qaAuthObserve(null);},async read(){window.qaCloudReads=(window.qaCloudReads||0)+1;return null;},
 async write(){window.qaCloudWrites=(window.qaCloudWrites||0)+1;throw Error('Cloud writes forbidden in browser QA');}
};}`;
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [width,height]of [[1365,900],[390,844],[360,800],[320,568]]){
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/firebase-sdk.js',route=>route.fulfill({contentType:'text/javascript',body:fakeSDK}));
  await page.route('https://**/*',route=>route.abort()); // No remote Auth, Firestore or personal account traffic.
  await page.goto(origin);await page.locator('.cloud-account-button').waitFor();
  // A disposable valid guest profile, isolated from every real browser profile.
  const fixture=await page.evaluate(async()=>{const {emptyProfile}=await import('/storage.js'),{createRun}=await import('/engine.js'),{questions}=await import('/questions.js');const p=emptyProfile();p.nickname='BROWSER QA';p.run=createRun(questions,p.nickname,()=>.3,'kjv66','nt');p.bestScore=1234;p.run.score=1234;return JSON.stringify(p);});
  // Seed before the new app loads; pagehide legitimately saves the prior app.
  await page.addInitScript(saved=>localStorage.setItem('lions-gate-arcade-v3',saved),fixture);
  await page.reload();await page.locator('.cloud-account-button').waitFor();const before=await page.evaluate(()=>localStorage.getItem('lions-gate-arcade-v3'));
  assert.equal(await page.locator('.title-menu [data-cloud-open="account"]').count(),1);assert.equal(await page.locator('.menu-links [data-cloud-open="account"]').count(),0);
  const account=page.locator('.cloud-account-button'),start=page.locator('.press-start'),next=page.locator('[data-action="continue"]');
  assert.match(await account.innerText(),/SIGN IN \/ CLOUD SAVE/);const a=await account.boundingBox(),s=await start.boundingBox(),c=await next.boundingBox();assert.ok(a.y<s.y&&a.y<c.y);assert.ok(Math.abs(a.width-s.width)<1);assert.ok(a.height>=60);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await account.click();const modal=page.locator('dialog.cloud-modal');await modal.waitFor({state:'visible'});assert.match(await modal.innerText(),/PLAYER ACCOUNT/);
  await page.keyboard.press('Escape');await modal.waitFor({state:'detached'});assert.equal(await account.evaluate(el=>el===document.activeElement),true);
  await account.click();await page.locator('[data-cloud="signin"]').click();await page.getByText('Ready. Press SIGN IN WITH GOOGLE to continue.',{exact:true}).waitFor();
  await page.evaluate(()=>window.qaAuthFailure='auth/popup-blocked');await page.locator('[data-cloud="signin"]').click();await page.getByText(/Allow the Google sign-in popup/).waitFor();assert.doesNotMatch(await modal.innerText(),/SECRET_CREDENTIAL/);assert.equal(await page.evaluate(()=>localStorage.getItem('lions-gate-arcade-v3')),before);
  await page.evaluate(()=>window.qaAuthFailure=null);await page.locator('[data-cloud="signin"]').click();await page.getByText(/No cloud save yet/).waitFor();assert.match(await account.innerText(),/MY ACCOUNT \/ CLOUD SAVE/);assert.equal(await page.evaluate(()=>window.qaCloudWrites||0),0);assert.equal(await page.evaluate(()=>window.qaCloudReads),1);
  await page.locator('[data-cloud="signout"]').click();await page.getByText(/Signed out/).waitFor();assert.match(await account.innerText(),/SIGN IN \/ CLOUD SAVE/);
  await page.locator('[data-cloud="close"]').click();await modal.waitFor({state:'detached'});assert.equal(await page.evaluate(()=>localStorage.getItem('lions-gate-arcade-v3')),before);
  // Real browser Window timers, no SDK dependency, and no implicit save migration.
  const timerResult=await page.evaluate(async()=>{const {CloudProgress}=await import('/cloud-progress.js'),{emptyProfile}=await import('/storage.js');let reads=0;const cloud=new CloudProgress({storage:{getItem:()=>null,setItem(){}},bank:[],getProfile:emptyProfile,applyProfile(){throw Error('Unexpected migration');}});cloud.api={read:async()=>{reads++;return null;},signOut:async()=>{}};await cloud.authChanged({uid:'timer-probe'});cloud.bound=true;cloud.localChanged();await cloud.signOut();return {reads,user:cloud.user};});assert.deepEqual(timerResult,{reads:1,user:null});
  await start.click();await page.getByRole('heading',{name:'Choose Your Scripture Collection',exact:false}).waitFor();await page.keyboard.press('Escape');await page.locator('.cloud-account-button').waitFor();
  await page.locator('[data-action="continue"]').click();await page.locator('.pause-overlay').waitFor();assert.equal(await page.locator('#nickname').count(),0);await page.locator('[data-action="save-title"]').click();await page.locator('.cloud-account-button').waitFor();assert.equal(await page.locator('.cloud-account-button').count(),1);
  assert.deepEqual(errors,[]);console.log('PASS actual Chrome UI '+width+'x'+height+': one account button above Start/Continue, modal/focus/Escape, mock success/error/sign-out labels, unchanged guest save, native timers, Start/Continue, no JS errors or horizontal overflow');
  if(width===390)await page.screenshot({path:new URL('../.verification/browser-tests/account-mobile.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/i,'$1'),fullPage:true});
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',userAgent:'Mozilla/5.0 (Linux; Android 15; Pixel 9; wv) AppleWebKit/537.36 Chrome/132.0.0.0 Mobile Safari/537.36'}),page=await context.newPage();let sdkLoads=0;
 await page.route('**/firebase-sdk.js',route=>{sdkLoads++;return route.fulfill({contentType:'text/javascript',body:fakeSDK});});await page.route('https://**/*',route=>route.abort());
 await page.goto(origin);await page.locator('.cloud-account-button').click();await page.locator('[data-cloud="signin"]').click();await page.getByText(/Google sign-in is unavailable in this in-app browser/).waitFor();assert.equal(sdkLoads,0);await page.locator('[data-cloud="close"]').click();await page.locator('.press-start').click();await page.getByRole('heading',{name:'Choose Your Scripture Collection',exact:false}).waitFor();await context.close();
 console.log('PASS embedded-browser UA: helpful Chrome/Safari guidance, no SDK/popup attempts, guest Start remains available. Real Google OAuth and physical Android/iOS/PWA remain unverified.');
}finally{await browser.close();}
