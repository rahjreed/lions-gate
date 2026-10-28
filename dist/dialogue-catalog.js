import {canon,chapterLimits} from './question-rules.js';
export const dialogueCategories=Object.freeze(['pre-battle','enemy-low','one-life','knockout','gatekeeper']);
export function dialogueFingerprint(entry){
 const text=JSON.stringify([entry.id,entry.category,entry.opponent,entry.judah,entry.scripture??null]);let hash=2166136261;
 for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619)}return (hash>>>0).toString(16).padStart(8,'0');
}
export function validateDialogue(entry){
 if(!entry||typeof entry.id!=='string'||!entry.id.trim()||!dialogueCategories.includes(entry.category)||!['pending','approved','rejected'].includes(entry.reviewStatus))throw Error('Invalid dialogue ID, category or review status');
 for(const field of ['opponent','judah'])if(typeof entry[field]!=='string'||!entry[field].trim()||entry[field].length>180)throw Error('Dialogue lines must contain 1–180 characters');
 if(entry.reviewStatus==='approved'&&entry.containsScriptureQuotation===true&&!entry.scripture)throw Error('Scripture quotations require a cited, reviewed passage');
 if(entry.scripture){
  const s=entry.scripture;
  if(!canon.includes(s.book)||!Number.isInteger(s.chapter)||s.chapter<1||s.chapter>chapterLimits[s.book]||!Number.isInteger(s.verse)||s.verse<1||s.endVerse!==undefined&&(!Number.isInteger(s.endVerse)||s.endVerse<s.verse))throw Error('Scripture must cite the established 80-book scope');
  const review=entry.scriptureReview;
  if(entry.reviewStatus==='approved'&&(!review||review.contentFingerprint!==dialogueFingerprint(entry)||review.accuracyChecked!==true||review.contextChecked!==true||typeof review.excerpt!=='string'||!review.excerpt.trim()||typeof review.sourceUrl!=='string'||!/^https:\/\//.test(review.sourceUrl)||typeof review.reviewedBy!=='string'||!review.reviewedBy.trim()))throw Error('Approved Scripture dialogue requires current source evidence and accuracy/context review');
 }
 return true;
}
export function approvedDialogue(records,category){
 const ids=new Set();return records.filter(entry=>{
  try{validateDialogue(entry);if(entry.reviewStatus!=='approved'||category&&entry.category!==category||ids.has(entry.id))return false;ids.add(entry.id);return true}catch{return false}
 }).map(({id,category,opponent,judah,scripture})=>({id,category,opponent,judah,scripture:scripture??null}));
}
export function rotatedDialogue(records,category,ordinal,exchangeId){
 const pool=approvedDialogue(records,category);if(!pool.length)throw Error('No approved dialogue for '+category);
 // Consecutive encounter ordinals visit every pair before any repeat, even for
 // pools of five/seven where the previous coprime-stride formula broke down.
 return pool.find(entry=>entry.id===exchangeId)||pool[ordinal%pool.length];
}
