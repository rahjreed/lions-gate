// Fictional presentation names only. Stable level mapping; never part of quiz or save state.
const romans=['Marcus','Titus','Maximus','Cassius','Lucius','Brutus','Severus','Decimus','Gaius','Quintus','Aulus','Flavius','Octavius','Valerius','Drusus','Caius','Marcellus','Crispus','Varro','Antonius','Cornelius','Fabius','Claudius','Junius','Rufus','Sextus','Tiberius','Aurelius','Vitellius','Nerva','Gallus','Scaeva'];
const epithets=['the Proud','the Deceiver','the Lawless','the Ruthless','the Arrogant','the Merciless','the Cunning','the Defiant','the Relentless','the Boastful','the Iron-Willed','the Unyielding','the Vengeful','the Cold-Hearted','the Reckless','the Cruel','the Schemer','the Oathbreaker','the Grim','the Fearless','the Bitter','the Tyrant','the Stern','the Scornful','the Brazen','the Pitiless','the Haughty','the Restless','the Fierce','the Hardened','the Unforgiving','the Impatient'];
const bossAspects=['Iron','Crimson','Obsidian','Bronze','Ashen','Dread','Blackstone','Storm'];
const bossTitles=['Gatekeeper','Guardian','Warden','Sentinel','Overseer','Watchman','Bastion','Castellan'];

export function opponentFor(level){
 if(!Number.isSafeInteger(level)||level<1)throw new RangeError('Opponent level must be a positive safe integer');
 const boss=level%5===0;
 // Count only regular encounters, so the name sequence has no holes at boss levels.
 const index=boss?level/5-1:level-Math.floor(level/5)-1;
 const name=boss?`The ${bossAspects[index%bossAspects.length]} ${bossTitles[(index+Math.floor(index/bossAspects.length))%bossTitles.length]}`:`${romans[index%romans.length]} ${epithets[(index+Math.floor(index/romans.length))%epithets.length]}`;
 return {name,boss};
}
