// Only reviewed, fully authored equipment is enabled. The remaining milestones
// and Full Armor award are intentionally deferred until their artwork is ready.
export const armorItems=Object.freeze([Object.freeze({id:'belt',level:75,name:'Belt of Truth',reference:'Ephesians 6:14 (KJV)',url:'https://www.kingjamesbibleonline.org/Ephesians-6-14/',explanation:'Paul tells his readers to stand with their loins girded with truth.',icon:'assets/armor/belt-icon.png'})]);
// Display-only roadmap in passage order (not milestone order). Levels retain the
// owner's revised six-piece plan; only armorItems may grant/equip achievements.
// A catalog entry must never enable a reward before its fitted art is implemented.
const planned=(id,level,name,verse)=>Object.freeze({id,level,name,reference:`Ephesians 6:${verse} (KJV)`,url:`https://www.kingjamesbibleonline.org/Ephesians-6-${verse}/`,icon:`assets/armor/${id}-icon.svg`,implemented:false});
export const armorCatalog=Object.freeze([
 Object.freeze({...armorItems[0],implemented:true}),
 planned('breastplate',225,'Breastplate of Righteousness',14),
 planned('shoes',150,'Shoes of Peace',15),
 planned('shield',375,'Shield of Faith',16),
 planned('helmet',450,'Helmet of Salvation',17),
 planned('sword',300,'Sword of the Spirit',17)
]);
export function reconcileArmor(profile){
 const previous=profile.armor||{},owned=Array.isArray(previous.unlocked)?previous.unlocked:[],pending=Array.isArray(previous.pending)?previous.pending:[];
 const completed=Math.max(profile.bestCompleted||0,profile.run?.completed||0);
 const unlocked=armorItems.filter(item=>completed>=item.level).map(item=>item.id);
 profile.armor={unlocked,pending:unlocked.filter(id=>!owned.includes(id)||pending.includes(id))};
 return profile.armor;
}
export function acknowledgeArmor(profile,id){
 if(!profile.armor?.pending.includes(id))return false;
 profile.armor.pending=profile.armor.pending.filter(value=>value!==id);return true;
}
export function armorRevealMarkup(item){return `<dialog id="armor-reveal" class="answer-reveal armor-reveal" aria-modal="true" aria-labelledby="armor-title" aria-describedby="armor-description"><header class="reveal-heading"><div><p class="kicker">ARMOR OF GOD · LEVEL ${item.level} COMPLETED</p><h2 id="armor-title">${item.name}</h2></div></header><div class="reveal-copy" tabindex="0" role="region" aria-label="Equipment achievement and Scripture"><div class="armor-award-art"><img src="${item.icon}" width="256" height="128" alt="Gold-edged teal belt with a bright square buckle"></div><p id="armor-description">A permanent cosmetic upgrade for Judah. This equipment does not change combat or power-ups.</p><a class="scripture-confirmation" href="${item.url}" target="_blank" rel="noopener noreferrer">${item.reference} ↗</a><p>${item.explanation}</p></div><footer class="reveal-footer"><button id="next" class="button primary" data-action="claim-armor">EQUIP &amp; CONTINUE →</button></footer></dialog>`}
export function armorCollectionMarkup(armor){return `<section class="armor-collection" aria-labelledby="armor-collection-title"><h2 id="armor-collection-title">Armor of God</h2><p class="armor-intro">Ephesians 6:14–17 · In Scripture order. Earn equipment by completing its milestone level.</p><ol class="armor-grid">${armorCatalog.map(item=>{const equipped=item.implemented&&armor?.unlocked?.includes(item.id);return `<li><article class="armor-card ${equipped?'armor-equipped':'armor-locked'}" data-equipment="${item.id}"><div class="armor-icon"><img src="${item.icon}" width="96" height="88" alt="${item.name}"></div><div class="armor-card-copy"><h3>${item.name}</h3><p class="armor-status">${equipped?'✦ PERMANENTLY EQUIPPED':item.implemented?'◇ LOCKED':'◇ PLANNED · LOCKED'}</p><p>Complete Level ${item.level}</p>${item.implemented?'':'<p class="armor-availability">Coming later · not yet earnable</p>'}<a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.reference} ↗</a></div></article></li>`}).join('')}</ol></section>`}
