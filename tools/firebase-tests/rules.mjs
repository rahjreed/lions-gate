// Emulator only: fake UIDs, no real accounts or production data.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,deleteDoc,collection,getDocs,query,limit,orderBy,serverTimestamp,writeBatch,setLogLevel} from 'firebase/firestore';
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8080','Only the local emulator is permitted');
const env=await initializeTestEnvironment({projectId:'demo-kingdom-race',firestore:{host:'127.0.0.1',port:8080,rules:await readFile(new URL('../../firestore.rules',import.meta.url),'utf8')}});
setLogLevel('silent');
try{
 await env.clearFirestore();
 const owner=env.authenticatedContext('owner').firestore(),other=env.authenticatedContext('other').firestore(),guest=env.unauthenticatedContext().firestore();
 const save=db=>doc(db,'players/owner/saves/current'),row=db=>doc(db,'leaderboard/owner');
 const data=revision=>({schema:1,revision,payload:'{"version":3}',leaderboardEnabled:false,updatedAt:serverTimestamp()});
 await assertFails(getDoc(save(guest)));await assertFails(getDoc(save(other)));
 await assertFails(setDoc(save(guest),data(1)));await assertFails(setDoc(save(other),data(1)));
 await assertFails(setDoc(save(owner),data(2)));await assertSucceeds(setDoc(save(owner),data(1)));await assertSucceeds(getDoc(save(owner)));
 await assertFails(setDoc(save(owner),data(1)));await assertFails(setDoc(save(owner),data(3)));await assertFails(setDoc(save(owner),{...data(2),email:'private@example.com'}));
 await assertFails(setDoc(save(owner),{...data(2),payload:'x'.repeat(700001)}));
 const publicRow={name:'ARCADE HERO',level:75,souls:12000,medals:['torah:bronze'],revision:2,updatedAt:serverTimestamp()};
 await assertFails(setDoc(row(other),publicRow));await assertFails(setDoc(row(guest),publicRow));await assertFails(setDoc(row(owner),publicRow),'Leaderboard write needs an atomic matching save');
 const batch=writeBatch(owner);batch.set(save(owner),{...data(2),leaderboardEnabled:true});batch.set(row(owner),publicRow);await assertSucceeds(batch.commit());
 await assertSucceeds(getDoc(row(guest)));const result=await assertSucceeds(getDocs(query(collection(guest,'leaderboard'),orderBy('souls','desc'),limit(20))));assert.equal(result.size,1);
 await assertFails(getDocs(collection(guest,'leaderboard')));await assertFails(getDocs(query(collection(guest,'leaderboard'),limit(21))));await assertFails(getDocs(collection(owner,'players')));
 for(const change of [{email:'private@example.com'},{name:'private@example.com'},{souls:-1},{level:0},{medals:['invented:master']},{medals:['torah:bronze','torah:bronze']}]){
  const b=writeBatch(owner);b.set(save(owner),{...data(3),leaderboardEnabled:true});b.set(row(owner),{...publicRow,revision:3,...change});await assertFails(b.commit());
 }
 const hidden=writeBatch(owner);hidden.set(save(owner),{...data(3),leaderboardEnabled:false});hidden.set(row(owner),{...publicRow,revision:3});await assertFails(hidden.commit());
 const remove=writeBatch(owner);remove.set(save(owner),{...data(3),leaderboardEnabled:false});remove.delete(row(owner));await assertSucceeds(remove.commit());
 await assertFails(deleteDoc(row(other)));await assertSucceeds(deleteDoc(row(owner)));await assertFails(deleteDoc(save(owner)));
 console.log('PASS emulator rules: owner-only private saves, revision increments, bounded payloads, no extra private/public fields, atomic public snapshots, guest public queries, pagination limits, foreign UID protection and default deny.');
}finally{await env.cleanup();}
