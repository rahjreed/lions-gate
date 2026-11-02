import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {CARD_WIDTH,CARD_HEIGHT,COVER_ART,cardDetails,drawAchievementCard} from '../dist/achievement-card.js';
import {ARCADE_URL,ACHIEVEMENT_URL,FACEBOOK_URL,challengeText,shareScoreMarkup} from '../dist/share-score.js';
assert.equal(CARD_WIDTH,1200);assert.equal(CARD_HEIGHT,630);
const art=await readFile(new URL('../dist/assets/share/kingdom-race-cover.png',import.meta.url));assert.equal(createHash('sha256').update(art).digest('hex'),'6fa49b2d5d803d02e46d723128f4ac045beddb3b3cd2c103b6c9aafe882ed556','Official supplied artwork stays byte-identical');
const png=await readFile(new URL('../dist/assets/share/kingdom-race-facebook.png',import.meta.url));assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
const html=await readFile(new URL('../dist/challenge.html',import.meta.url),'utf8');
for(const value of ['og:title','og:description','og:image','og:image:width','og:image:height','og:url'])assert.ok(html.includes(`property="${value}"`));
assert.match(html,/content="1200"/);assert.match(html,/content="630"/);assert.match(html,/content="https:\/\/lionsgate\.callistadigital\.com\/assets\/share\/kingdom-race-facebook\.png"/);assert.ok(html.includes(`href="${ARCADE_URL}">PLAY AT RAHJREED.COM`));assert.ok(html.includes(`content="${ACHIEVEMENT_URL}"`));assert.doesNotMatch(html,/<script|http-equiv="refresh"|URLSearchParams|localStorage/);
assert.equal(new URL(FACEBOOK_URL).searchParams.get('u'),ACHIEVEMENT_URL);assert.equal(ARCADE_URL,'https://rahjreed.com');
const record=Object.freeze({nickname:'REAL ARCADE NAME',level:700,score:987654}),snapshot=JSON.stringify(record);assert.deepEqual(cardDetails(record),{name:'REAL ARCADE NAME',level:700,souls:987654});
for(const bad of [null,{}, {...record,score:NaN},{...record,score:-1},{...record,level:0}])assert.throws(()=>cardDetails(bad));
const texts=[],images=[],ctx={fillRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},drawImage(...a){images.push(a)},fillText(text){texts.push(text)},measureText(text){return {width:text.length*14}}},canvas={getContext:()=>ctx};
const previousImage=globalThis.Image;globalThis.Image=class{naturalWidth=1671;naturalHeight=941;async decode(){}};
try{await drawAchievementCard(canvas,record);assert.equal(canvas.width,1200);assert.equal(canvas.height,630);assert.deepEqual(texts.filter(t=>['REAL ARCADE NAME','700','987,654'].includes(t)),['REAL ARCADE NAME','700','987,654']);assert.ok(texts.includes('CAN YOU BEAT MY SCORE?'));assert.ok(texts.includes('PLAY AT RAHJREED.COM'));assert.equal(images[0][0].src,COVER_ART);assert.equal(images[0].length,5,'Whole artwork is drawn, not cropped or replaced');texts.length=0;await drawAchievementCard(canvas);assert.deepEqual(texts,['CAN YOU BEAT MY SCORE?','PLAY AT RAHJREED.COM'],'Generic public cover has no invented player or scores');}finally{globalThis.Image=previousImage;}
assert.equal(JSON.stringify(record),snapshot);assert.match(shareScoreMarkup(record),/data-preview-achievement=/);assert.match(challengeText(record),/PLAY AT RAHJREED.COM\nhttps:\/\/rahjreed.com/);
console.log('PASS achievement cards: byte-identical official cover; 1200×630 PNG; real-record overlay and missing-data rejection; exact promo text; no invented generic scores; static crawler-readable OG and arcade-first landing; public URL has no player data; immutable records.');
