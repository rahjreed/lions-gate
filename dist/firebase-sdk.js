// Loaded on demand. Guest play and the offline game shell never depend on CDN access.
// Pinned official modular SDK; no Analytics, Storage or administrator SDK.
import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js';
import {getFirestore,doc,getDocFromServer,runTransaction,serverTimestamp,collection,query,orderBy,limit,startAfter,getDocsFromServer} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js';
import {firebaseConfig} from './firebase-config.js';
export function firebaseAdapter(){
 const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
 return {
  observe:fn=>onAuthStateChanged(auth,user=>fn(user?{uid:user.uid}:null)),
  signIn:()=>signInWithPopup(auth,new GoogleAuthProvider()), // Future providers belong here, not in saves.
  signOut:()=>signOut(auth),
  async read(uid){const snap=await getDocFromServer(doc(db,'players',uid,'saves','current'));return snap.exists()?snap.data():null;},
  async write(uid,expected,payload,publicRow,listingChange=null){
   const ref=doc(db,'players',uid,'saves','current');
   return runTransaction(db,async tx=>{
    if(auth.currentUser?.uid!==uid)throw Error('Account changed. Reconnect before saving.');
    const snap=await tx.get(ref),revision=snap.exists()?snap.data().revision:0;
    if(revision!==expected)throw Object.assign(Error('Cloud progress changed on another device. Compare saves again.'),{code:'cloud/conflict'});
    const next=revision+1,previouslyListed=snap.exists()&&snap.data().leaderboardEnabled===true;
    const leaderboardEnabled=listingChange===null?previouslyListed:listingChange;
    tx.set(ref,{schema:1,revision:next,payload,leaderboardEnabled,updatedAt:serverTimestamp()});
    if(leaderboardEnabled)tx.set(doc(db,'leaderboard',uid),{...publicRow,revision:next,updatedAt:serverTimestamp()});
    else if(previouslyListed||listingChange===false)tx.delete(doc(db,'leaderboard',uid));
    return next;
   });
  },
  async page(cursor){
   // The default single-field index supplies the implicit document-ID tie break.
   const constraints=[orderBy('souls','desc'),limit(20)];if(cursor)constraints.push(startAfter(cursor));
   const snap=await getDocsFromServer(query(collection(db,'leaderboard'),...constraints));
   return {rows:snap.docs.map(d=>d.data()),cursor:snap.docs.at(-1)||null,more:snap.size===20};
  }
 };
}
