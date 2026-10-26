// Documentation inventory only. Never imports, reviews or publishes a batch.
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {questions} from '../dist/questions.js';
import {publishedQuestions} from '../dist/published-questions.js';
import {knowledgeFor} from '../dist/knowledge.js';
const root=new URL('../',import.meta.url),read=async p=>readFile(new URL(p,root),'utf8');
const categories=[
 ['01','Covenants and commandments','Trace recipients, obligations, promises, signs and stated purposes.'],
 ['02','Sabbath and rest','Distinguish rest instructions, participants, purposes and contextual applications.'],
 ['03','Appointed feasts and convocations','Distinguish each appointed time and its stated instructions and connections.'],
 ['04','Dietary laws and clean/unclean','Identify criteria, blood/carcass instructions and conditions.'],
 ['05','Appearance and modesty','Examine fringes, hair, beards, clothing and modesty without added rules.'],
 ['06','Prayer, worship and holiness','Explain prayer, worship and holiness in their covenant settings.'],
 ['07','Marriage, family and lineage','Distinguish obligations, prohibited relationships and inheritance contexts.'],
 ['08','Parents, children and vulnerable people','Explain duties toward parents, children, widows, orphans and strangers.'],
 ['09','Property, restitution and inheritance','Identify ownership, restitution, boundaries and inheritance conditions.'],
 ['10','Economic justice','Study lending, debt, wages, tithes and fair economic obligations.'],
 ['11','Agriculture and land cycles','Study gleaning, agriculture, Sabbatical years and Jubilee.'],
 ['12','Priesthood, sanctuary and offerings','Distinguish roles, offerings, sacrifices and conditional applications.'],
 ['13','Judges, witnesses and procedure','Examine evidence, witnesses, jurisdiction and judicial safeguards.'],
 ['14','Sexual conduct and purity','Distinguish prohibited conduct, purity conditions and procedures.'],
 ['15','Idolatry and prohibited practices','Distinguish express worship restrictions from human traditions.'],
 ['16','Leadership and community government','Study service, kingship, responsibility and accountability.'],
 ['17','Israel restoration and promised land','Trace tribes, reunification, covenants and land inheritance.'],
 ['18','Prophetic judgment and Kingdom government','Study Messiah, nations, justice, mercy, repentance and judgment.'],
 ['general','General scriptural foundations','Retain historical people, places, events, wisdom and other foundations.']
].map(([id,name,objective])=>({id,name,plannedLearningObjective:objective,reviewStatus:'framework; not exhaustive'}));
const matches=[['01',/commandment|covenant|torah|\blaw\b/i],['02',/sabbath|\brest\b/i],['03',/feast|passover|unleavened|firstfruits|pentecost|trumpet|atonement|tabernacle|eighth day|new moon/i],['04',/dietary|clean.unclean|cud|fins|scales|swine|eating blood|land animals/i],['05',/fringes|tassels|beard|hair|clothing|modest|adornment|garment|markings/i],['06',/pray|prayer|worship|holiness/i],['07',/marri|wife|husband|lineage|family|divorce|relative/i],['08',/parents|father and mother|children|widow|orphan|stranger|fatherless/i],['09',/property|theft|restitution|inherit|boundary/i],['10',/lending|debt|wages|tithe|pledge|\bpoor\b/i],['11',/agricultur|glean|jubilee|sabbatical|sheaf/i],['12',/priest|sanctuary|offering|sacrifice/i],['13',/witness|judge|judicial|evidence/i],['14',/sexual|purity|nakedness/i],['15',/idolatry|other gods|tradition/i],['16',/leadership|king.ship|government|accountability|chief/i],['17',/restoration|reunif|promised land|tribal|tribes/i],['18',/prophe|kingdom|judgment|judgement|messiah/i]];
const catalog=JSON.parse(await read('content/curriculum-catalog.json'));
const sources=['dist/questions.js','dist/extra-questions.js','dist/focus-questions.js','dist/published-questions.js'];
const records=questions.map(q=>({q,source:publishedQuestions.some(p=>p.id===q.id)?'dist/published-questions.js':'dist/questions.js (composed legacy bank)',state:'live-reviewed'}));
for(const file of (await readdir(new URL('content/candidates/',root))).filter(f=>f.endsWith('.json')).sort()){
 const source='content/candidates/'+file;sources.push(source);
 for(const q of JSON.parse(await read(source)))records.push({q,source,state:questions.some(live=>live.id===q.id)?'working-copy-of-live-id-not-authoritative':q.review.status==='verified'?'reviewed-working-copy-not-live':'candidate-not-live'});
}
const inventory=records.map(({q,source,state})=>{
 const text=[q.topic,q.q,...q.tags].join(' '),categoryIds=matches.filter(([,pattern])=>pattern.test(text)).map(([id])=>id);
 return {recordKey:source+'#'+q.id,id:q.id,editorialId:q.editorial?.sourceId??null,source,publicationState:state,reviewStatus:q.review.status,evidenceStatus:q.editorial?.evidenceStatus??q.review.sourceCheck?.status??'legacy documented review; no new verification',references:[q.scripture,...(q.supportingScriptures||[])].map(({book,chapter,verse,endVerse})=>({book,chapter,verse,...(endVerse?{endVerse}:{})})),commandmentOrTeaching:q.topic,curriculumCategories:categoryIds.length?categoryIds:['general'],classificationStatus:'provisional keyword index; manual taxonomy review required',knowledgeCategory:knowledgeFor(q).category,learningObjective:q.explain,objectiveStatus:'copied existing explanation; not newly verified',existingQuestion:q.q,difficultyProgression:{editorialRating1to10:q.editorial?.curriculumDifficulty??q.editorial?.sourceDifficulty??null,ratingStatus:q.editorial?.sourceDifficulty?'supplied rating; calibration pending':'1–10 calibration not performed',runtimeDisplay:q.difficulty,runtimeComplexity:knowledgeFor(q).complexity,nextObjective:'Develop a separately reviewed context/conditions/cross-reference objective where absent; do not relabel recall as mastery.'},relatedQuestionIds:[],uncoveredLearningObjectives:['Full conditions, exceptions and linked objectives beyond this item have not been exhaustively inventoried.'],manualCatalogEntryIds:catalog.entries.filter(e=>e.relatedQuestionIds?.includes(q.id)).map(e=>e.id)};
});
for(const row of inventory)row.relatedQuestionIds=inventory.filter(other=>other.id!==row.id&&row.references.some(a=>other.references.some(b=>a.book===b.book&&a.chapter===b.chapter&&a.verse<=(b.endVerse??b.verse)&&b.verse<=(a.endVerse??a.verse)))).map(other=>other.id);
const torahChapters=[];
for(const [book,count] of [['Genesis',50],['Exodus',40],['Leviticus',27],['Numbers',36],['Deuteronomy',34]])for(let chapter=1;chapter<=count;chapter++){
 const related=inventory.filter(q=>q.references.some(r=>r.book===book&&r.chapter===chapter)),manual=catalog.entries.filter(e=>e.book===book&&e.chapter===chapter);
 torahChapters.push({book,chapter,verseRange:null,commandmentOrTeaching:'Identify all commands, ordinances, judgments and relevant teaching in a chapter-by-chapter manual audit.',curriculumCategories:[...new Set(related.flatMap(q=>q.curriculumCategories))],learningObjectives:manual.map(e=>e.learningObjective),difficultyProgression:'Plan accessible recall through contextual and conditional reasoning on editorial scale 1–10; calibrate manually.',existingRelatedQuestions:related.map(q=>q.id),liveReviewedQuestionIds:related.filter(q=>q.publicationState==='live-reviewed').map(q=>q.id),candidateQuestionIds:related.filter(q=>q.publicationState==='candidate-not-live').map(q=>q.id),uncoveredLearningObjectives:['Identify precise verse ranges and every distinct command/teaching before claiming coverage.','Inventory recipients, purposes, conditions, exceptions and related passages.','Identify missing progression objectives and review them independently.'],reviewStatus:manual.length?'partial-manual-catalog':'chapter-not-catalogued',chapterReview:catalog.chapterReviews.find(r=>r.book===book&&r.chapter===chapter)??null,manualCatalogEntryIds:manual.map(e=>e.id)});
}
const dimensions=['Locate explicit scriptural date/day/season/counting instructions; distinguish calendar inference.','Identify stated duration and separate assembly/rest boundaries.','Inventory observances, participants, work/rest, offerings and conditions where stated.','Identify stated purpose or memorial meaning.','Explain historical/covenant context without equating narrative practice with command.','Review relevant prophetic/Gospel/apostolic connections and mark disputed frameworks.'];
const appointedTimes=['Passover','Unleavened Bread','Firstfruits','Weeks/Pentecost','Memorial of Trumpets','Day of Atonement','Tabernacles','The Eighth Day','Weekly Sabbath','New-moon passages'].map(name=>({name,reviewStatus:'coverage plan; exact passage catalog pending',learningObjectives:dimensions.map((objective,i)=>({dimension:i+1,objective,status:'planned-not-certified'})),existingRelatedQuestions:inventory.filter(q=>q.existingQuestion.toLowerCase().includes(name==='Weekly Sabbath'?'sabbath':name==='New-moon passages'?'new moon':name==='Weeks/Pentecost'?'weeks':name==='Memorial of Trumpets'?'trumpet':name.toLowerCase())).map(q=>q.id),associationStatus:'keyword hints only; review all actual source passages'}));
const hashes=Object.fromEntries(await Promise.all(sources.map(async path=>[path,createHash('sha256').update(await readFile(new URL(path,root))).digest('hex')])));
const output={schemaVersion:1,policy:'BIBLICAL_CURRICULUM_AND_DOCTRINE.md',purpose:'Derived inventory and coverage framework, not new questions or approval evidence.',limitations:['No exhaustive Torah commandment catalog has been completed.','Related citations/topic keywords do not prove conceptual coverage.','Candidate evidence is not live reviewed coverage.','Unknown 1–10 difficulty calibrations remain null.'],summary:{liveReviewed:questions.length,publishedAdditions:publishedQuestions.length,candidates:records.filter(r=>r.state==='candidate-not-live').length,inventoryRecords:inventory.length,torahChapterSlots:torahChapters.length,manualCatalogEntries:catalog.entries.length,chapterReviews:catalog.chapterReviews.length},sourceHashes:hashes,categories,appointedTimes,torahChapters,questionInventory:inventory,manualCatalog:catalog};
await writeFile(new URL('content/curriculum-coverage.json',root),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output.summary));
