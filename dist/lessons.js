import {courseLessons} from './course-lessons.js';
import {contentFingerprint} from './question-rules.js';

// Presentation-only titles. No answers, citations or reviewed explanations change.
const titles={
 'sabbath-day':'The Seventh-Day Sabbath','wisdom-soul':'Wisdom and the Character of the Soul','hear-first':'Hear Before Answering','unleavened-days':'The Days of Unleavened Bread','honor-parents':'Honouring Father and Mother','guard-heart':'Guarding the Heart','trust-lord':'Trusting the LORD','hope-deferred':'Hope and Fulfilled Desire','receive-commandments':'Wisdom Receives Commandments','enemy-falls':'When an Enemy Stumbles','moses-brother':'Aaron and Moses','jonah-days':'Jonah in the Fish','creation-rest':'The Day of Creation Rest','spirit-sword':'The Sword of the Spirit','wise-count':'Gifts Do Not Establish a Visitor Count','wise-house':'Read the Wise Men’s Visit Carefully','david-stones':'What David Chose Before the Battle','antioch-name':'The Disciples at Antioch','vengeance':'Leave Repayment to the Lord','city-descends':'John’s Description of the Holy City','raphael':'Raphael Identifies Himself','learned-leisure':'Opportunity for Learned Wisdom','esdras-comparison':'Read the Named Comparison','law-prophets-psalms':'Yeshua and the Scriptural Witness','salem-meaning':'The Meaning of Salem','weightier-matters':'Judgment, Mercy and Faith','measure-number-weight':'Measure, Number and Weight','apollos-origin':'Apollos’ Origin and Arrival','lydia-city':'Lydia’s City and the Narrative Setting','sychar':'Sychar and Jacob’s Gift','land-animals':'Both Land-Animal Criteria Matter','water-creatures':'Fins and Scales','six-days':'Labour and Sabbath Rest','love-commandments':'Love Expressed in Keeping Commandments','hands-complaint':'Identify the Handwashing Dispute','hands-conclusion':'What the Passage Says Defiles','establish-law':'Paul Rejects Making the Law Void','doers-word':'Hear the Word and Act','command-tradition':'Commandment and Human Tradition','grace-sin':'Grace Is Not Permission to Sin','keeping-commandments':'Read Paul’s Stated Contrast','teach-children':'Teaching the Words in Daily Life'
};
const readableTitle=text=>String(text||'Understanding the Passage').toLowerCase().replace(/(^|\s)\p{L}/gu,c=>c.toUpperCase()).replace(/\bYeshua\b/g,'Yeshua');

export function lessonFor(q){
 const profile=courseLessons[q.id];
 // A changed question must never silently retain a stale expanded lesson.
 const current=profile?.questionFingerprint===contentFingerprint(q)?profile:null;
 const title=current?.title||titles[q.id]||readableTitle(q.topic);
 return {id:q.id,title,explanation:q.explain,context:current?.context||'',
  objective:current?.objective||q.knowledge?.learningObjective||q.editorial?.learningObjective||`Understand the passage’s teaching about ${title.replace(/[.!?]$/,'')}.`,
  courseUnitId:current?.courseUnitId||null,courseUnitTitle:current?.courseUnitTitle||null,
  primary:q.scripture,related:q.supportingScriptures||[],fallback:!current};
}
