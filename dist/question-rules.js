export const oldTestament=['Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi'];
export const newTestament=['Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation'];
// Baruch includes the Letter of Jeremiah (chapter 6); the Song includes the Prayer of Azariah.
export const apocrypha=['1 Esdras','2 Esdras','Tobit','Judith','Additions to Esther','Wisdom of Solomon','Ecclesiasticus','Baruch','Song of the Three Holy Children','Susanna','Bel and the Dragon','Prayer of Manasseh','1 Maccabees','2 Maccabees'];
export const canon=[...oldTestament,...newTestament,...apocrypha];
export const prohibitedPersonalReferences=/\bnotes?\b|\b(?:my|your|personal)\s+(?:study|documents?|research|teachings?|files?)\b|study assignment|heart precepts|google\s*drive|docs\.google|drive\.google|where.{0,30}(?:wrote|written|recorded)|according to.{0,30}(?:document|teacher)/i;
const excluded=/myles\s+awakens|becoming\s+solomon|yahweh[\s_-]*(?:s?trickster)|short\s+stor(?:y|ies)|\b(?:enoch|jubilees|jasher|cepher)\b/i;
export function contentFingerprint(q){const input=JSON.stringify([q.id,q.topic,q.category,q.difficulty,q.q,q.options,q.answer,q.correctAnswer,q.explain,q.scripture]);let h=2166136261;for(let i=0;i<input.length;i++){h^=input.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,'0')}
export function validateQuestions(bank){
 if(!Array.isArray(bank)||!bank.length)throw Error('Question bank must not be empty.');const ids=new Set();
 for(const q of bank){const fail=m=>{throw Error(`${q.id||'Question'}: ${m}`)};
  if(!q.id||ids.has(q.id))fail('Unique id required.');ids.add(q.id);
  for(const key of ['category','topic','q','explain','correctAnswer'])if(typeof q[key]!=='string'||!q[key].trim())fail(`${key} required.`);
  if(!Array.isArray(q.options)||q.options.length!==4||q.options.some(o=>typeof o!=='string'||!o.trim())||new Set(q.options.map(o=>o.toLowerCase().trim())).size!==4)fail('Four distinct options required.');
  if(!Number.isInteger(q.answer)||q.answer<0||q.answer>3||q.correctAnswer!==q.options[q.answer])fail('Correct answer must match selected option.');
  if(![1,2,3].includes(q.difficulty))fail('Difficulty rating 1–3 required.');
  const playerText=JSON.stringify([q.category,q.topic,q.q,q.options,q.explain,q.correctAnswer,q.scripture]);
  if(prohibitedPersonalReferences.test(playerText))fail('Personal research references forbidden.');if(excluded.test(playerText))fail('Excluded material forbidden.');
  const s=q.scripture;if(!s||!canon.includes(s.book)||s.translation!=='KJV'||!Number.isInteger(s.chapter)||s.chapter<1||!Number.isInteger(s.verse)||s.verse<1)fail('Exact KJV citation from the 80-book collection required.');
  if(s.endVerse!==undefined&&(!Number.isInteger(s.endVerse)||s.endVerse<s.verse))fail('Invalid verse range.');
  if(!s.excerpt?.trim())fail('Passage evidence required.');
  try{const u=new URL(s.url);if(u.protocol!=='https:'||u.hostname!=='www.kingjamesbibleonline.org'||u.pathname!==(s.endVerse?`/${s.book.replaceAll(' ','-')}-Chapter-${s.chapter}/`:`/${s.book.replaceAll(' ','-')}-${s.chapter}-${s.verse}/`))fail('Scripture link must match citation.')}catch{fail('Matching public Scripture URL required.');}
  if(q.review?.status!=='verified'||q.review.basis!=='explicit-passage'||!/^\d{4}-\d{2}-\d{2}$/.test(q.review.reviewedOn)||!q.review.rationale?.trim())fail('Documented passage review required.');
  if(q.review.contentFingerprint!==contentFingerprint(q))fail('Content changed: re-read the passage and renew review approval.');
 }return true;
}
