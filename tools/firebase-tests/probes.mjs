// Regression probes. These intentionally failed against the original rules.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,writeBatch,serverTimestamp,setLogLevel} from 'firebase/firestore';
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8080');
setLogLevel('silent');
const env=await initializeTestEnvironment({projectId:'demo-kingdom-race',firestore:{host:'127.0.0.1',port:8080,rules:await readFile(new URL('../../firestore.rules',import.meta.url),'utf8')}});
const allowed=async work=>{try{await work;return true;}catch(e){if(e.code==='permission-denied')return false;throw e;}};
try{
 await env.clearFirestore();const db=env.authenticatedContext('probe').firestore(),save=doc(db,'players/probe/saves/current'),row=doc(db,'leaderboard/probe');
 const data=(revision,enabled,payload='probe')=>({schema:1,revision,leaderboardEnabled:enabled,payload,updatedAt:serverTimestamp()});
 const oversizedBytesAccepted=await allowed(setDoc(save,data(1,false,'漢'.repeat(233334))));
 await env.clearFirestore();const b=writeBatch(db);b.set(save,data(1,true));b.set(row,{name:'PROBE',level:1,souls:1,medals:[],revision:1,updatedAt:serverTimestamp()});await b.commit();
 const unpairedOptOutAccepted=await allowed(setDoc(save,data(2,false)));
 const publicRecordStillExists=(await getDoc(row)).exists();
 console.log(JSON.stringify({oversizedBytesAccepted,unpairedOptOutAccepted,publicRecordStillExists}));
 assert.equal(oversizedBytesAccepted,false,'Reject >700000 UTF-8 bytes, even below 700000 characters');
 assert.equal(unpairedOptOutAccepted,false,'Opt-out must atomically delete public row');
}finally{await env.cleanup();}
