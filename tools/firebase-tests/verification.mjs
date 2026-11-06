// Adversarial regression and actual-client transaction tests; strictly local.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import * as F from 'firebase/firestore';
import {encodeProfile,MAX_PAYLOAD_BYTES} from '../../dist/cloud-progress.js';
import {emptyProfile} from '../../dist/storage.js';
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8080');
assert.equal(process.env.GCLOUD_PROJECT,'demo-kingdom-race');
F.setLogLevel('silent');
const rules=await readFile(new URL('../../firestore.rules',import.meta.url),'utf8');
const env=await initializeTestEnvironment({projectId:'demo-kingdom-race',firestore:{host:'127.0.0.1',port:8080,rules}});
let count=0;const yes=async p=>{await assertSucceeds(p);count++;},no=async p=>{await assertFails(p);count++;};
const snapshot=(revision,leaderboardEnabled=false,payload='{"version":3}')=>({schema:1,revision,leaderboardEnabled,payload,updatedAt:F.serverTimestamp()});
const publicRow=revision=>({name:'SECURITY QA',level:75,souls:12000,medals:['torah:bronze'],revision,updatedAt:F.serverTimestamp()});
const save=(db,uid='owner')=>F.doc(db,'players',uid,'saves','current'),row=(db,uid='owner')=>F.doc(db,'leaderboard',uid);
try{
 await env.clearFirestore();
 const owner=env.authenticatedContext('owner').firestore(),other=env.authenticatedContext('other').firestore(),guest=env.unauthenticatedContext().firestore();
 for(const db of [guest,other]){await no(F.getDoc(save(db)));await no(F.setDoc(save(db),snapshot(1)));await no(F.deleteDoc(save(db)));await no(F.setDoc(row(db),publicRow(1)));await no(F.deleteDoc(row(db)));}
 await no(F.getDocs(F.collection(owner,'players')));await no(F.getDocs(F.collection(owner,'players/owner/saves')));await no(F.setDoc(F.doc(owner,'players/owner/saves/other'),snapshot(1)));
 await no(F.setDoc(save(owner),snapshot(2)));await yes(F.setDoc(save(owner),snapshot(1)));await yes(F.getDoc(save(owner)));
 for(const revision of [0,-1,1,3,1.5,'2',null])await no(F.setDoc(save(owner),snapshot(revision)));
 for(const change of [{schema:2},{schema:'1'},{leaderboardEnabled:'false'},{payload:[]},{payload:''},{updatedAt:new Date(0)},{email:'private@example.com'}])await no(F.setDoc(save(owner),{...snapshot(2),...change}));
 const missing=snapshot(2);delete missing.leaderboardEnabled;await no(F.setDoc(save(owner),missing));
 console.log('PASS ownership/default deny, private paths, revision increments and malformed private records');

 await no(F.setDoc(row(owner),publicRow(1)));
 let batch=F.writeBatch(owner);batch.set(save(owner),snapshot(2,true));batch.set(row(owner),publicRow(2));await yes(batch.commit());
 await yes(F.getDoc(row(guest)));await no(F.deleteDoc(row(owner))); // Cannot leave enabled account without row.
 await no(F.setDoc(save(owner),snapshot(3,true))); // Matching public update is mandatory.
 await no(F.setDoc(save(owner),snapshot(3,false))); // Opt-out must remove the old public row atomically.
 await no(F.setDoc(row(owner),publicRow(2))); // A fresh server timestamp alone cannot reuse an old save.
 for(const change of [{email:'secret@example.com'},{name:'secret@example.com'},{name:''},{name:'A'.repeat(17)},{level:0},{level:1.5},{souls:-1},{souls:'100'},{medals:['fake:master']},{medals:['torah:bronze','torah:bronze']},{medals:['torah:bronze','torah:silver','torah:gold','torah:master']},{updatedAt:new Date(0)},{revision:2}]){
  batch=F.writeBatch(owner);batch.set(save(owner),snapshot(3,true));batch.set(row(owner),{...publicRow(3),...change});await no(batch.commit());
 }
 batch=F.writeBatch(owner);batch.set(save(owner),snapshot(3,true));batch.set(row(owner),{...publicRow(3),souls:13000});await yes(batch.commit());
 assert.equal((await F.getDoc(row(owner))).data().souls,13000);
 batch=F.writeBatch(owner);batch.set(save(owner),snapshot(4,false));batch.delete(row(owner));await yes(batch.commit());assert.equal((await F.getDoc(row(guest))).exists(),false);
 await no(F.setDoc(row(owner),publicRow(3)));
 batch=F.writeBatch(owner);batch.set(save(owner),snapshot(3,true));batch.set(row(owner),publicRow(3));await no(batch.commit());
 batch=F.writeBatch(owner);batch.set(save(owner),snapshot(5,false));batch.set(row(owner),publicRow(5));await no(batch.commit());
 assert.equal((await F.getDoc(save(owner))).data().revision,4);
 console.log('PASS getAfter pairing in both directions, public create/update/delete, atomic opt-out and raw stale writes');

 const bytes=env.authenticatedContext('bytes').firestore();let revision=0;
 for(const payload of ['a'.repeat(700000),'é'.repeat(350000),'漢'.repeat(233333)+'a','😀'.repeat(175000)]){
  assert.equal(new TextEncoder().encode(payload).length,MAX_PAYLOAD_BYTES);await yes(F.setDoc(save(bytes,'bytes'),snapshot(++revision,false,payload)));
 }
 for(const payload of ['a'.repeat(700001),'é'.repeat(350001),'漢'.repeat(233334),'😀'.repeat(175001)]){
  assert.ok(new TextEncoder().encode(payload).length>MAX_PAYLOAD_BYTES);await no(F.setDoc(save(bytes,'bytes'),snapshot(revision+1,false,payload)));
 }
 assert.throws(()=>encodeProfile({...emptyProfile(),extra:'é'.repeat(350000)}),/too large/);
 console.log('PASS identical 700000-byte ASCII/accented/CJK/emoji rule boundaries and client UTF-8 cap');

 // Execute the real browser adapter body with real modular Firestore functions.
 // Only its imports/initialization are substituted with demo-bound SDK clients.
 const source=await readFile(new URL('../../dist/firebase-sdk.js',import.meta.url),'utf8');
 const body=source.replace(/^import .*;\r?\n/gm,'').replace('export function firebaseAdapter','function firebaseAdapter');
 assert.doesNotMatch(body,/https:\/\/|r2g2-kingdom-race|import\s/);
 function adapter(uid){
  const db=env.authenticatedContext(uid).firestore(),auth={currentUser:{uid}};
  const providerStub=()=>{throw Error('Real authentication is forbidden in emulator rule tests');};
  const bindings={...F,initializeApp:()=>({}),getAuth:()=>auth,getFirestore:()=>db,firebaseConfig:{projectId:'demo-kingdom-race'},GoogleAuthProvider:providerStub,signInWithPopup:providerStub,signOut:providerStub,onAuthStateChanged:providerStub};
  return new Function(...Object.keys(bindings),body+'\nreturn firebaseAdapter();')(...Object.values(bindings));
 }
 const client=adapter('client');let r=await client.write('client',0,'client save',publicRow(0));assert.equal(r,1);assert.equal((await client.read('client')).leaderboardEnabled,false);assert.equal((await F.getDoc(row(guest,'client'))).exists(),false);
 r=await client.write('client',r,'client save',publicRow(0),true);assert.equal(r,2);assert.equal((await F.getDoc(row(guest,'client'))).data().revision,2);
 const stale=r;r=await client.write('client',r,'client newer save',{...publicRow(0),souls:14000});assert.equal(r,3);
 r=await client.write('client',r,'client newer save',publicRow(0),false);assert.equal(r,4);assert.equal((await F.getDoc(row(guest,'client'))).exists(),false);
 await assert.rejects(client.write('client',stale,'stale save',publicRow(0),true),e=>e.code==='cloud/conflict');count++;
 assert.equal((await F.getDoc(row(guest,'client'))).exists(),false);
 r=await client.write('client',r,'offline device caught up',publicRow(0));assert.equal(r,5);assert.equal((await F.getDoc(row(guest,'client'))).exists(),false,'Normal uploads cannot silently enable listing');
 r=await client.write('client',r,'explicit re-opt-in',publicRow(0),true);assert.equal(r,6);
 await assert.rejects(client.write('other',0,'wrong UID',publicRow(0)),/Account changed/);count++;
 await no(client.read('owner'));
 console.log('PASS actual client create/update/list/unlist/explicit re-opt-in and stale opt-out protection');

 // Exercise the exact production cursor query with ties across two full pages.
 await env.clearFirestore();
 for(let i=0;i<43;i++){const uid='page'+i;await adapter(uid).write(uid,0,'page fixture',{name:'PAGE_'+String(i).padStart(2,'0'),level:i+1,souls:100+(i%3),medals:[]},true);}
 const reader=adapter('reader'),first=await reader.page(),second=await reader.page(first.cursor),third=await reader.page(second.cursor);
 assert.equal(first.rows.length,20);assert.equal(second.rows.length,20);assert.equal(third.rows.length,3);assert.equal(third.more,false);assert.equal(first.more,true);
 const all=[...first.rows,...second.rows,...third.rows];assert.equal(new Set(all.map(r=>r.name)).size,43);assert.ok(all.every((r,i)=>i===0||all[i-1].souls>=r.souls));
 await yes(F.getDocs(F.query(F.collection(guest,'leaderboard'),F.orderBy('souls','desc'),F.limit(20))));await no(F.getDocs(F.collection(guest,'leaderboard')));await no(F.getDocs(F.query(F.collection(guest,'leaderboard'),F.limit(21))));
 const indexes=JSON.parse(await readFile(new URL('../../firestore.indexes.json',import.meta.url),'utf8'));
 assert.deepEqual(indexes,{indexes:[],fieldOverrides:[{collectionGroup:'saves',fieldPath:'payload',indexes:[]}]});
 const config=JSON.parse(await readFile(new URL('../../firebase.json',import.meta.url),'utf8'));assert.equal(config.firestore.indexes,'firestore.indexes.json');assert.equal(config.firestore.rules,'firestore.rules');
 assert.match(source,/orderBy\('souls','desc'\)/);assert.doesNotMatch(source,/orderBy\('payload'/);
 console.log('PASS actual 20/20/3 cursor pagination with ties, public query caps and static index exemption/configuration');
 console.log(`PASS ${count} explicit allow/deny checks plus actual client transactions, UTF-8 boundaries, pagination and index assertions.`);
}finally{await env.cleanup();}
