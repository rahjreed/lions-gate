import {knowledgeCategories,normalizedText} from './knowledge.js';
export const oldTestament=['Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi'];
export const newTestament=['Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation'];
// Baruch includes the Letter of Jeremiah (chapter 6); the Song includes the Prayer of Azariah.
export const apocrypha=['1 Esdras','2 Esdras','Tobit','Judith','Additions to Esther','Wisdom of Solomon','Ecclesiasticus','Baruch','Song of the Three Holy Children','Susanna','Bel and the Dragon','Prayer of Manasseh','1 Maccabees','2 Maccabees'];
export const canon=[...oldTestament,...newTestament,...apocrypha];
// Chapter bounds catch malformed references. Verse existence still needs passage review.
export const chapterLimits=Object.fromEntries(canon.map((book,i)=>[book,[50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22,9,16,14,16,16,19,51,6,1,1,1,1,16,15][i]]));
export const prohibitedPersonalReferences=/\bnotes?\b|\b(?:my|your|personal)\s+(?:study|documents?|research|teachings?|files?)\b|study assignment|heart precepts|google\s*drive|docs\.google|drive\.google|where.{0,30}(?:wrote|written|recorded)|according to.{0,30}(?:document|teacher)/i;
const excluded=/myles\s+awakens|becoming\s+solomon|yahweh[\s_-]*(?:s?trickster)|short\s+stor(?:y|ies)|\b(?:enoch|jubilees|jasher|cepher)\b/i;
export function contentFingerprint(q){const input=JSON.stringify([q.id,q.topic,q.category,q.difficulty,q.q,q.options,q.answer,q.correctAnswer,q.explain,q.scripture,q.tags,q.trapType,q.trap,...((q.knowledge||q.supportingScriptures||q.interpretiveFramework)?[q.knowledge,q.supportingScriptures||[],q.interpretiveFramework||null]:[])]);let h=2166136261;for(let i=0;i<input.length;i++){h^=input.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,'0')}
export function validateQuestions(bank,{allowCandidates=false}={}){
 if(!Array.isArray(bank)||!bank.length)throw Error('Question bank must not be empty.');const ids=new Set(),stems=new Set();
 for(const q of bank){const fail=m=>{throw Error(`${q.id||'Question'}: ${m}`)};
  if(typeof q.id!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(q.id)||Object.hasOwn(Object.prototype,q.id)||['prototype','__proto__'].includes(q.id)||ids.has(q.id))fail('Unique safe stable id required.');ids.add(q.id);const stem=normalizedText(q.q);if(stems.has(stem))fail('Duplicate question wording.');stems.add(stem);
  for(const key of ['category','topic','q','explain','correctAnswer'])if(typeof q[key]!=='string'||!q[key].trim())fail(`${key} required.`);
  if(!Array.isArray(q.options)||q.options.length!==4||q.options.some(o=>typeof o!=='string'||!o.trim())||new Set(q.options.map(normalizedText)).size!==4)fail('Four distinct options required.');
  if(!Number.isInteger(q.answer)||q.answer<0||q.answer>3||q.correctAnswer!==q.options[q.answer])fail('Correct answer must match selected option.');
  if(![1,2,3].includes(q.difficulty))fail('Difficulty rating 1–3 required.');
  if(!Array.isArray(q.tags)||!q.tags.length||q.tags.some(t=>!['general','commandments','torah','sabbath','feasts','clean-unclean','obedience','yeshua-context','paul-context','scripture-tradition'].includes(t)))fail('Recognized topic tags required.');
  if(![null,'tradition','context','misquote'].includes(q.trapType)||q.trapType&&!q.trap?.correction?.trim()||!q.trapType&&q.trap!==null)fail('Valid trap type and contextual correction required.');
  const playerText=JSON.stringify([q.category,q.topic,q.q,q.options,q.explain,q.correctAnswer,q.scripture,q.tags,q.trap,q.knowledge,q.supportingScriptures,q.interpretiveFramework]);
  if(prohibitedPersonalReferences.test(playerText))fail('Personal research references forbidden.');if(excluded.test(playerText))fail('Excluded material forbidden.');
  if(!Array.isArray(q.supportingScriptures||[]))fail('Supporting citations must be a list.');
  const citations=[q.scripture,...(q.supportingScriptures||[])];
  for(const s of citations){
   if(!s||!canon.includes(s.book)||s.translation!=='KJV'||!Number.isInteger(s.chapter)||s.chapter<1||!Number.isInteger(s.verse)||s.verse<1)fail('Exact KJV citation from the 80-book collection required.');
   if(s.chapter>chapterLimits[s.book]||s.verse>176||s.endVerse>176)fail('Citation outside known chapter or maximum verse bounds.');
   if(s.endVerse!==undefined&&(!Number.isInteger(s.endVerse)||s.endVerse<s.verse))fail('Invalid verse range.');
   if(!s.excerpt?.trim())fail('Passage evidence required.');
   try{const u=new URL(s.url);if(s.url!==`https://www.kingjamesbibleonline.org${u.pathname}`||u.protocol!=='https:'||u.hostname!=='www.kingjamesbibleonline.org'||u.pathname!==(s.endVerse?`/${s.book.replaceAll(' ','-')}-Chapter-${s.chapter}/`:`/${s.book.replaceAll(' ','-')}-${s.chapter}-${s.verse}/`))fail('Scripture link must match citation.')}catch{fail('Matching public Scripture URL required.');}
  }
  if(q.knowledge){const k=q.knowledge;
   if(!knowledgeCategories.some(c=>c.id===k.category)||!Number.isInteger(k.complexity)||k.complexity<1||k.complexity>7||!k.concept?.trim()||!['explicit','multi-passage','framework'].includes(k.mode))fail('Valid knowledge category, complexity 1–7, concept and mode required.');
   if(k.mode!=='explicit'&&!q.supportingScriptures?.length)fail('Reasoning requires supporting passages.');
   if(k.mode==='framework'&&(!q.interpretiveFramework?.trim()||!q.q.includes(q.interpretiveFramework)))fail('Interpretive framework must be named in the question.');
  }
  if(allowCandidates&&['candidate','draft'].includes(q.review?.status))continue;
  if(q.review?.status!=='verified'||!['explicit-passage','passage-comparison','named-framework'].includes(q.review.basis)||!/^\d{4}-\d{2}-\d{2}$/.test(q.review.reviewedOn)||!q.review.rationale?.trim())fail('Documented passage review required.');
  if(q.knowledge&&q.review.basis!==(q.knowledge.mode==='framework'?'named-framework':q.knowledge.mode==='multi-passage'?'passage-comparison':'explicit-passage'))fail('Review basis must match reasoning mode.');
  if(q.knowledge&&(!q.review.reviewedBy?.trim()||!['passages','references','quotations','singleAnswer','distractors','context','crossQuestion'].every(key=>q.review.checks?.[key]===true)||!Array.isArray(q.review.optionRationales)||q.review.optionRationales.length!==4||q.review.optionRationales.some(text=>typeof text!=='string'||!text.trim())))fail('Independent editorial checklist and four option rationales required.');
  if(q.review.contentFingerprint!==contentFingerprint(q))fail('Content changed: re-read the passage and renew review approval.');
 }return true;
}
