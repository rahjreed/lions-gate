import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {GAME_URL,FACEBOOK_URL,challengeText,shareScoreMarkup,copyChallenge,bindChallengeCopy} from '../dist/share-score.js';
import {beforeSharingFeature} from './share-score-revision.mjs';
const source=(await readFile(new URL('../dist/app.js',import.meta.url),'utf8')).replace(/\r\n/g,'\n');
beforeSharingFeature('dist/app.js',source);
assert.throws(()=>beforeSharingFeature('dist/app.js',source.replace('run.score','run.score+1')),'Gameplay mutations still fail the exact audit');
const record=Object.freeze({id:'r1',nickname:'ARCADE HERO',score:12345,completed:14,level:15}),before=JSON.stringify(record);
const text=challengeText(record);assert.equal(text,"Kingdom Race The Lion's Gate\nARCADE HERO\nHighest level reached: 15\nSouls earned (score): 12,345\nCan you beat my score?\nhttps://lionsgate.callistadigital.com/");
assert.match(challengeText({nickname:'X',score:0,completed:9}),/level reached: 10/);
assert.doesNotMatch(challengeText({nickname:'<script>',score:NaN,level:-1}),/<script>|NaN|-1/);
const url=new URL(FACEBOOK_URL);assert.equal(url.origin,'https://www.facebook.com');assert.equal(url.pathname,'/sharer/sharer.php');assert.deepEqual([...url.searchParams],[['u',GAME_URL]]);assert.doesNotMatch(FACEBOOK_URL,/quote=|message=|12345|ARCADE/);
const markup=shareScoreMarkup(record);assert.match(markup,/target="_blank" rel="noopener noreferrer"/);assert.match(markup,/SHARE ON FACEBOOK/);assert.match(markup,/Copy Challenge/);assert.match(markup,/role="status"/);assert.match(markup,/readonly hidden/);assert.equal(JSON.stringify(record),before);
function fixture(){const textArea={value:text,hidden:true,focus(){this.focused=true},select(){this.selected=true}},status={textContent:''},group={querySelector:s=>s==='.challenge-text'?textArea:status},button={disabled:false,closest:()=>group};return {textArea,status,button};}
const ok=fixture();let copied;await copyChallenge(ok.button,{async writeText(value){copied=value}});assert.equal(copied,text);assert.equal(ok.status.textContent,'CHALLENGE COPIED!');assert.equal(ok.textArea.hidden,true);assert.equal(ok.button.disabled,false);
for(const clipboard of [{async writeText(){throw Error('Denied')}},null]){const f=fixture();await copyChallenge(f.button,clipboard);assert.equal(f.textArea.hidden,false);assert.equal(f.textArea.focused,true);assert.equal(f.textArea.selected,true);assert.match(f.status.textContent,/copy the challenge/);assert.equal(f.button.disabled,false);}
const pending=fixture();let release,calls=0;const clipboard={writeText(){calls++;return new Promise(r=>{release=r})}};const first=copyChallenge(pending.button,clipboard);await copyChallenge(pending.button,clipboard);assert.equal(calls,1);release();await first;assert.equal(pending.button.disabled,false);
let listener;const root={addEventListener(type,fn){assert.equal(type,'click');listener=fn},contains:()=>true};bindChallengeCopy(root);assert.doesNotThrow(()=>listener({target:{closest:()=>null}}));
// Render actual screens; sharing never changes state, controls or rankings.
const c={run:{...record,status:'gameover',answers:[],lives:0,bestStreak:3},profile:{armor:{unlocked:[]},mastery:{legacyRecords:[]}},filter:'all',shareScoreMarkup,localScores:()=>[record],cleanNickname:v=>v,esc:v=>v,number:n=>n.toLocaleString('en-US'),hud:()=>'',sword:'',judah:()=>'',rankFor:()=>({name:'Novice'}),rankLabel:()=> 'Novice',masteryCompleted:()=>14,canRetryLevel:()=>true,levelConfig:()=>({bonus:100,boss:false}),flawlessRewardMarkup:()=>'',achievements:()=>[],armorItems:[],button:(label,action)=>`<button data-action="${action}">${label}</button>`,reviewList:()=>'',symbolicGate:()=>''};
vm.createContext(c);vm.runInContext(['resultScreen','hallScreen'].map(name=>source.match(new RegExp('function '+name+'\\(\\)[^\\n]*'))[0]).join('\n'),c);
const saved=JSON.stringify(c.run),profile=JSON.stringify(c.profile);for(const status of ['gameover','levelup']){c.run.status=status;const html=c.resultScreen();assert.match(html,/SHARE ON FACEBOOK/);assert.match(html,/Copy Challenge/);assert.match(html,status==='levelup'?/ENTER LEVEL 16/:/RETRY LEVEL/);}
c.run.status='gameover';assert.equal(JSON.stringify(c.run),saved);assert.equal(JSON.stringify(c.profile),profile);assert.match(c.hallScreen(),/ARCADE HERO/);assert.match(c.hallScreen(),/SHARE ON FACEBOOK/);c.filter='sample';assert.doesNotMatch(c.hallScreen(),/SHARE ON FACEBOOK|Copy Challenge/);
const moduleSource=await readFile(new URL('../dist/share-score.js',import.meta.url),'utf8');assert.doesNotMatch(moduleSource,/localStorage|saveProfile|fetch\(|score\s*=/);
console.log('PASS sharing: public-URL-only Facebook link; exact nickname/level/score challenge; escaped content; clipboard success, denial/manual fallback and rapid-click guard; both results and real Hall records; demo exclusion; save/state immutability; historical gameplay audits retained.');
