// Presentation only. Starting a run stays in the existing app initialization.
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function playerNameScreen(name){
 return `<section class="menu-screen name-entry-screen"><p class="kicker">A NEW JOURNEY</p><h1 id="screen-title" tabindex="-1">ENTER PLAYER NAME</h1><form id="player-name-form" aria-labelledby="screen-title"><label class="nickname-label" for="nickname">PLAYER NAME<input id="nickname" name="nickname" maxlength="16" autocomplete="nickname" inputmode="text" enterkeyhint="go" autocorrect="off" spellcheck="false" value="${escape(name)}"></label><div class="name-entry-actions"><button type="submit" class="button primary">BEGIN GAME</button><button type="button" class="button" data-action="cancel-start">← BACK</button></div></form></section>`;
}
