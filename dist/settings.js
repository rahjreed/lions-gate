// Settings map to existing saved preferences, never to an alternate game mode.
export function settingsScreen(settings){
 const toggle=(key,label,on)=>`<button id="setting-${key}" class="setting-toggle" role="switch" aria-label="${label}" aria-checked="${on}" data-action="setting-${key}"><span>${label}</span><strong aria-hidden="true">${on?'ON':'OFF'}</strong><i aria-hidden="true"></i></button>`;
 return `<section id="settings-screen" class="menu-screen settings-screen"><p class="kicker">YOUR JOURNEY · YOUR PREFERENCES</p><h1 id="screen-title" tabindex="-1">SETTINGS</h1><div class="settings-toggles">${toggle('music','Music',settings.music)}${toggle('sound','Sound Effects',settings.sound)}${toggle('dialogue','Character Dialogue',!settings.skipDialogue)}</div>
 <section class="settings-resources" aria-labelledby="settings-resources-title">
  <h2 id="settings-resources-title">Guide &amp; Collection</h2>
  <div>
   <button type="button" class="button" data-action="guide">HOW TO PLAY</button>
   <button type="button" class="button" data-action="trophies">TROPHY ROOM</button>
   <button type="button" class="button" data-action="armory">ARMORY</button>
  </div>
 </section>
 <button class="button" data-action="title">← BACK TO TITLE</button></section>`;
}
