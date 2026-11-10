import {knowledgeCategories,legacyKnowledge} from './knowledge.js';
import {contentFingerprint} from './question-rules.js';
import {collectionFor} from './scripture-collections.js';
import {studyPathFor,questionInStudy} from './study-paths.js';
export const medalCategories=knowledgeCategories.map(c=>Object.freeze({...c}));
export const medalTiers=Object.freeze([{id:'bronze',name:'BRONZE',threshold:10},{id:'silver',name:'SILVER',threshold:25},{id:'gold',name:'GOLD',threshold:50},{id:'master',name:'MASTER',threshold:100}].map(Object.freeze));
export const REVIEW_BREAK_MS=30*60*1000,MASTER_REVIEWS=2;
const clean=value=>String(value||'PLAYER 1').replace(/[^a-zA-Z0-9 _-]/g,'').trim().slice(0,16)||'PLAYER 1';
const safe=n=>Number.isSafeInteger(n)&&n>=0;
const stamp=s=>typeof s==='string'&&Number.isFinite(Date.parse(s));
const token=s=>typeof s==='string'&&s.length>0&&s.length<=160&&!['__proto__','constructor','prototype'].includes(s);
const questionId=s=>typeof s==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
const object=o=>o&&typeof o==='object'&&!Array.isArray(o);
const escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const medalIdentity=name=>'arcade:'+encodeURIComponent(clean(name).toLowerCase());
export const primaryMedalCategory=q=>{const id=q?.knowledge?.category||legacyKnowledge[q?.id];return medalCategories.some(c=>c.id===id)?id:null;};
export const emptyMedals=()=>({version:1,identities:{}});
const emptyCategory=()=>({current:0,best:0,earned:{},seen:{},laterReviews:[]});
function validReview(r){return object(r)&&questionId(r.questionId)&&token(r.fromSession)&&token(r.toSession)&&r.fromSession!==r.toSession&&stamp(r.priorAt)&&stamp(r.reviewedAt)&&Date.parse(r.reviewedAt)-Date.parse(r.priorAt)>=REVIEW_BREAK_MS;}
export function loadMedals(raw){
 const result=emptyMedals();if(raw?.version!==1||!object(raw.identities))return result;
 for(const [key,source]of Object.entries(raw.identities)){
  if(!object(source)||typeof source.name!=='string'||key!==medalIdentity(source.name))continue;
  const owner={id:key,name:clean(source.name),categories:{},receipts:{},session:null};
  if(object(source.session)&&token(source.session.id)&&stamp(source.session.startedAt)&&stamp(source.session.lastActivityAt)&&Date.parse(source.session.lastActivityAt)>=Date.parse(source.session.startedAt))owner.session={...source.session};
  for(const c of medalCategories){const saved=source.categories?.[c.id];if(!object(saved))continue;const state=emptyCategory(),intact=safe(saved.current);state.current=intact?saved.current:0;state.best=Math.max(state.current,safe(saved.best)?saved.best:0);
   for(const tier of medalTiers){const e=saved.earned?.[tier.id];if(object(e)&&stamp(e.earnedAt)&&safe(e.streak)&&e.streak>=tier.threshold){const evidence=Array.isArray(e.reviewEvidence)?e.reviewEvidence.filter(validReview).filter((r,i,all)=>all.findIndex(e=>e.questionId===r.questionId)===i):[];if(tier.id==='master'&&new Set(evidence.map(r=>r.questionId)).size<MASTER_REVIEWS)continue;state.earned[tier.id]={id:c.id+':'+tier.id,earnedAt:e.earnedAt,streak:e.streak,...(tier.id==='master'?{reviewEvidence:evidence.slice(0,MASTER_REVIEWS)}:{})};state.best=Math.max(state.best,e.streak);}}
   if(intact&&owner.session&&object(saved.seen))for(const [id,e]of Object.entries(saved.seen))if(questionId(id)&&object(e)&&token(e.sessionId)&&stamp(e.at))state.seen[id]={sessionId:e.sessionId,at:e.at};
   if(intact&&owner.session&&Array.isArray(saved.laterReviews))state.laterReviews=saved.laterReviews.filter(validReview).filter((r,i,all)=>all.findIndex(e=>e.questionId===r.questionId)===i).slice(0,MASTER_REVIEWS);
   owner.categories[c.id]=state;
  }
  if(object(source.receipts))for(const [id,count]of Object.entries(source.receipts))if(token(id)&&safe(count))owner.receipts[id]=count;
  result.identities[key]=owner;
 }return result;
}
export function medalOwner(store,name,create=false){const key=medalIdentity(name);if(!store.identities[key]&&create)store.identities[key]={id:key,name:clean(name),categories:{},receipts:{},session:null};return store.identities[key]||null;}
export function creditMasteryAnswer(profile,run,bank,now=Date.now()){
 const last=run?.answers?.at(-1),q=bank.find(q=>q.id===last?.id),category=primaryMedalCategory(q);
 if(run?.status!=='feedback'||!token(run.id)||!safe(run.asked)||run.asked<1||!last||run.queue?.[run.index]?.id!==last.id||!category||q.review?.status!=='verified'||q.review.contentFingerprint!==contentFingerprint(q)||!questionInStudy(q,collectionFor(run),studyPathFor(run))||![-1,0,1,2,3].includes(last.choice)||last.correct!==(last.choice===q.answer)||!Number.isFinite(new Date(now).getTime()))return [];
 profile.medals??=emptyMedals();const owner=medalOwner(profile.medals,run.nickname,true);if((owner.receipts[run.id]||0)>=run.asked)return [];owner.receipts[run.id]=run.asked;
 const previous=owner.session;if(!previous||now-Date.parse(previous.lastActivityAt)>=REVIEW_BREAK_MS){const iso=new Date(now).toISOString();owner.session={id:globalThis.crypto?.randomUUID?.()||'session-'+now+'-'+Math.random(),startedAt:iso,lastActivityAt:iso};}
 const session=owner.session;session.lastActivityAt=new Date(Math.max(now,Date.parse(session.lastActivityAt))).toISOString();
 const state=owner.categories[category]??=emptyCategory();
 if(!last.correct){state.current=0;state.seen={};state.laterReviews=[];return [];}
 state.current=Math.min(Number.MAX_SAFE_INTEGER,state.current+1);state.best=Math.max(state.best,state.current);
 const seen=state.seen[q.id],at=session.lastActivityAt;
 if(seen&&seen.sessionId!==session.id&&Date.parse(at)-Date.parse(seen.at)>=REVIEW_BREAK_MS&&!state.laterReviews.some(r=>r.questionId===q.id)&&state.laterReviews.length<MASTER_REVIEWS)state.laterReviews.push({questionId:q.id,fromSession:seen.sessionId,toSession:session.id,priorAt:seen.at,reviewedAt:at});
 state.seen[q.id]={sessionId:session.id,at};const awards=[];
 for(const tier of medalTiers)if(state.current>=tier.threshold&&!state.earned[tier.id]&&(tier.id!=='master'||state.laterReviews.length>=MASTER_REVIEWS)){const earned={id:category+':'+tier.id,earnedAt:at,streak:state.current,...(tier.id==='master'?{reviewEvidence:state.laterReviews.map(r=>({...r}))}:{})};state.earned[tier.id]=earned;awards.push({ownerId:owner.id,category,tier:tier.id,...earned});}
 return awards;
}
export function topMasteryMedals(store,name,limit=3){const owner=store&&medalOwner(store,name);if(!owner)return [];return medalCategories.flatMap(c=>medalTiers.filter(t=>owner.categories[c.id]?.earned[t.id]).map(t=>({category:c.id,tier:t.id,...owner.categories[c.id].earned[t.id]}))).sort((a,b)=>medalTiers.findIndex(t=>t.id===b.tier)-medalTiers.findIndex(t=>t.id===a.tier)||a.earnedAt.localeCompare(b.earnedAt)||a.id.localeCompare(b.id)).slice(0,limit);}
export function hallMedalsMarkup(row){if(!Array.isArray(row.masteryMedals))return '';return '<span class="hall-medals">'+row.masteryMedals.filter(m=>object(m)&&medalCategories.some(c=>c.id===m.category)&&medalTiers.some(t=>t.id===m.tier)&&stamp(m.earnedAt)).slice(0,3).map(m=>`<small class="medal-chip medal-${m.tier}" title="${escape(medalCategories.find(c=>c.id===m.category).name)}">✦ ${medalTiers.find(t=>t.id===m.tier).name} · ${escape(medalCategories.find(c=>c.id===m.category).name)}</small>`).join('')+'</span>';}
function ownerMarkup(owner,bank,scope){return `<div class="mastery-grid">${medalCategories.map(c=>{const state=owner?.categories[c.id]||emptyCategory(),next=medalTiers.find(t=>!state.earned[t.id]),reviews=state.laterReviews.length;return `<article class="mastery-category"><h2>${escape(c.name)}</h2><p>${bank.filter(q=>primaryMedalCategory(q)===c.id).length} approved questions · ${bank.filter(q=>primaryMedalCategory(q)===c.id&&questionInStudy(q,collectionFor(scope),studyPathFor(scope))).length} in current scope · Current <strong>${state.current}</strong> · Best <strong>${state.best}</strong></p><div class="medal-tiers">${medalTiers.map(t=>{const earned=state.earned[t.id];return `<div class="medal-tier medal-${t.id} ${earned?'medal-earned':'medal-locked'}"><span aria-hidden="true">${t.id==='master'?'★':'✦'}</span><b>${t.name}</b><small>${earned?'EARNED · '+escape(earned.earnedAt.slice(0,10))+' UTC':'LOCKED · '+t.threshold+' correct'}</small></div>`}).join('')}</div>${next?`<label>${next.name}: ${Math.min(state.current,next.threshold)} / ${next.threshold}<progress value="${Math.min(state.current,next.threshold)}" max="${next.threshold}" aria-label="${escape(c.name)} progress to ${next.name}"></progress></label>`:'<p class="mastery-complete">ALL FOUR MEDALS EARNED</p>'}<p class="mastery-review-note">Master: 100 consecutive category answers plus later reviews of 2 different questions after a 30-minute break. Reviews in this streak: ${reviews}/2.</p></article>`;}).join('')}</div>`;}
export function trophyRoomMarkup(profile,bank){const activeName=profile.run?.nickname||profile.nickname,owner=medalOwner(profile.medals||emptyMedals(),activeName),others=Object.values(profile.medals?.identities||{}).filter(o=>o.id!==medalIdentity(activeName)),count=topMasteryMedals(profile.medals,activeName,28).length;return `<section class="menu-screen trophy-room"><p class="kicker">PERMANENT SCRIPTURE MASTERY</p><h1 id="screen-title" tabindex="-1">TROPHY ROOM</h1><p>Arcade identity: <strong>${escape(clean(activeName))}</strong> · ${count}/28 medals earned. Saved on this device.</p><p>One answer counts toward one existing curriculum category. A wrong answer or timeout resets only that category’s current streak, even with a shield. Earned medals stay unlocked across runs and study paths. Nothing is removed from question rotation. All categories remain visible; some require another collection or study path to progress.</p>${ownerMarkup(owner,bank,profile.run)}${others.map(o=>`<details class="other-mastery"><summary>Saved arcade identity: ${escape(o.name)}</summary>${ownerMarkup(o,bank,profile.run)}</details>`).join('')}<button class="button" data-action="settings">← BACK TO SETTINGS</button></section>`;}
const shownMedals=new Set();
export function showMedalNotification(awards,audio,ownerDocument=document,schedule=setTimeout){awards=awards.filter(a=>!shownMedals.has(a.ownerId+':'+a.id+':'+a.earnedAt));if(!awards.length)return;const host=ownerDocument.querySelector('#answer-reveal');if(!host)return;for(const a of awards)shownMedals.add(a.ownerId+':'+a.id+':'+a.earnedAt);const notice=ownerDocument.createElement('div');notice.className='medal-notification';notice.setAttribute('role','status');notice.innerHTML=awards.map(a=>`<strong>✦ ${escape(a.tier.toUpperCase())} MEDAL EARNED</strong><span>${escape(medalCategories.find(c=>c.id===a.category)?.name||'')}</span>`).join('');host.querySelector('.reveal-copy')?.prepend(notice);audio.effect('promotion');schedule(()=>notice.remove(),5000);}
