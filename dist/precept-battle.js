import {HITS_TO_WIN, shuffled} from './engine.js';
import {CombatDirector, paintCombat, romanSoldier} from './combat.js';
import {judah} from './mascot.js';
import {GameJuice} from './juice.js';
import {sabbathBattle} from './precept-sabbath.js';

const noticeKey = 'lions-gate-precept-notice-v1';
const esc = text => String(text).replace(/[&<>"']/g, char => ({
 '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[char]));
const button = (label, action, primary = false) =>
 `<button type="button" class="button${primary ? ' primary' : ''}" data-precept="${action}">${label}</button>`;

export class PreceptAttempt {
 constructor(battle, random = Math.random) {
  this.exchanges = battle.chains.flatMap(chain => chain.exchanges.map(exchange => ({
   ...exchange, choices: shuffled(exchange.choices, random)
  })));
  this.hits = 0;
  this.heroHealth = 100;
  this.index = 0;
  this.phase = 'answering';
 }
 get exchange() { return this.exchanges[this.index]; }
 get health() { return {enemy: Math.max(0, 100 - this.hits * 10), hero: this.heroHealth}; }
 select(id) {
  if (this.phase !== 'answering') return false;
  const choice = this.exchange.choices.find(option => option.id === id);
  if (!choice) return false;
  this.choice = choice;
  this.correct = choice.id === this.exchange.correct;
  this.phase = 'animating';
  return true;
 }
 impact() {
  if (this.phase !== 'animating') return false;
  if (this.correct) this.hits++;
  else this.heroHealth = Math.max(0, this.heroHealth - 20);
  this.phase = 'recovering';
  return true;
 }
 finish() {
  if (this.phase === 'recovering') this.phase = 'feedback';
 }
 proceed() {
  if (this.phase !== 'feedback') return;
  if (this.hits === HITS_TO_WIN) this.phase = 'victory';
  else if (!this.heroHealth) this.phase = 'defeat';
  else {
   if (this.correct) this.index++;
   this.phase = 'answering';
  }
 }
}

const notice = `<h1 id="precept-title" tabindex="-1">⚔️ PRECEPT BATTLE MODE — BEFORE YOU ENTER</h1>
 <p>Because of the depth of Yah's Word, Precept Battle Mode is designed for players who recognize the authority of both the Old and New Testaments and believe Yah's commandments remain relevant today.</p>
 <p>Each battle challenges you to examine biblical teachings, answer opposing arguments, and defend your understanding through Scripture.</p>
 <p><strong>Precept upon precept. Line upon line.</strong></p>
 <p>Are you ready to enter the arena?</p>
 <div class="precept-actions">${button('ENTER THE ARENA','accept',true)}${button('BACK','exit')}</div>`;

export function bindPreceptBattle({root, storage, audio, getSettings, restoreMusic, getWardrobe}) {
 const dialog = document.createElement('dialog');
 dialog.className = 'precept-dialog';
 dialog.setAttribute('aria-labelledby','precept-title');
 document.body.append(dialog);
 const combat = new CombatDirector();
 const juice = new GameJuice(dialog);
 let attempt, wardrobe, opener, paused = false, accepted = false;
 const find = selector => dialog.querySelector(selector);
 const focusHeading = () => find('#precept-title').focus({preventScroll:true});
 function music() {
  const settings = getSettings();
  audio.configure(settings.sound, settings.music, !paused && !document.hidden);
 }
 function menu(markup) {
  dialog.innerHTML = `<section class="precept-menu question-panel">${markup}</section>`;
  focusHeading();
 }
 function topic() {
  menu(`<h1 id="precept-title" tabindex="-1">PRECEPT BATTLE</h1><p>Two chains. Ten successful precepts. Both fighters start at 100% health.</p>
   <div class="precept-actions">${button(sabbathBattle.title,'start',true)}${button('BACK','exit')}</div>`);
 }
 function open(control) {
  if (dialog.open) return;
  opener = control;
  try { accepted ||= storage.getItem(noticeKey) === '1'; } catch {}
  dialog.showModal();
  if (accepted) topic();
  else menu(notice);
  music();
  void audio.unlock();
 }
 function close() {
  combat.cancel();
  juice.clear();
  attempt = null;
  paused = false;
  dialog.classList.remove('precept-paused');
  dialog.close();
  dialog.replaceChildren();
  restoreMusic();
  (opener?.isConnected ? opener : root.querySelector('[data-precept-open]'))?.focus();
 }
 function begin() {
  if (!accepted) return;
  attempt = new PreceptAttempt(sabbathBattle);
  wardrobe = getWardrobe();
  dialog.innerHTML = `<section class="precept-shell">
   <div class="precept-top"><h1 id="precept-title" tabindex="-1">${sabbathBattle.title}</h1>${button('Ⅱ PAUSE','pause')}</div>
   <div class="combat-health precept-health">
    <div class="health-block health-judah"><div class="health-label"><b>AKOBI</b><span data-precept-value="hero"></span></div><progress data-precept-meter="hero" aria-label="Akobi health" max="100"></progress></div>
    <div class="health-block health-enemy"><div class="health-label"><b>ROMAN SOLDIER</b><span data-precept-value="enemy"></span></div><progress data-precept-meter="enemy" aria-label="Roman soldier health" max="100"></progress></div>
   </div>
   <div class="game-scene precept-arena" aria-label="Roman stone arena"><div class="precept-stone" aria-hidden="true"></div>
    <div class="scene-status">${judah(wardrobe.completed,'ready',false,wardrobe.equipment,wardrobe.rank)}${romanSoldier()}<span class="combat-sparks" aria-hidden="true"></span></div>
   </div>
   <section class="question-panel precept-debate"></section>
   <section class="question-panel precept-pause" hidden><h2 tabindex="-1">BATTLE PAUSED</h2>
    <div class="precept-actions">${button('RESUME','resume',true)}${button('EXIT TO MENU','exit')}</div>
   </section>
  </section>`;
  updateHealth();
  debate();
  music();
 }
 function updateHealth() {
  const {hero, enemy} = attempt.health;
  find('[data-precept-meter="hero"]').value = hero;
  find('[data-precept-meter="enemy"]').value = enemy;
  find('[data-precept-value="hero"]').textContent = `${hero}%`;
  find('[data-precept-value="enemy"]').textContent = `${enemy}%`;
 }
 function debate() {
  const {exchange,index,phase,choice,correct} = attempt;
  const answering = phase === 'answering';
  const feedback = phase === 'feedback';
  const best = exchange.choices.find(option => option.id === exchange.correct);
  const links = exchange.citations.map(({label,url}) =>
   `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`).join(' · ');
  const choices = exchange.choices.map((option,i) => `<button type="button" class="answer" data-precept-choice="${option.id}"><span>${'ABCD'[i]}</span><strong>${esc(option.text)}</strong></button>`).join('');
  const verse = exchange.romanScripture;
  const finished = attempt.hits === HITS_TO_WIN || !attempt.heroHealth;
  find('.precept-debate').innerHTML = `<p class="precept-progress">CHAIN ${Math.floor(index / 5) + 1} / 2 · PRECEPT ${index % 5 + 1} / 5</p>
   <h2 tabindex="-1">${answering ? 'Roman Soldier' : 'Akobi'}</h2>
   ${answering && verse ? `<blockquote class="precept-verse"><p>${esc(verse.quote)}</p><a href="${esc(verse.url)}" target="_blank" rel="noopener noreferrer">${esc(verse.reference)} · KJV excerpt ↗</a></blockquote>` : ''}
   <p class="precept-line">${esc(answering ? exchange.claim : choice.text)}</p>
   ${answering ? `<div class="answers">${choices}</div>` : ''}
   ${feedback ? `<div class="precept-feedback ${correct ? 'right' : 'wrong'}">
    <strong>${correct ? 'PRECEPT LANDED!' : 'REBUTTAL FAILED · −20%'}</strong>
    ${correct ? '' : `<p><b>Best response:</b> ${esc(best.text)}</p>`}
    ${!correct && choice.weakness ? `<p>${esc(choice.weakness)}</p>` : ''}
    <p>${esc(exchange.explanation)}</p><p>${links}</p>
    ${button(finished ? 'SEE RESULT' : correct ? 'CONTINUE' : 'TRY THIS REBUTTAL AGAIN','advance',true)}
   </div>` : ''}`;
  find('.precept-debate h2').focus({preventScroll:true});
 }
 function select(id) {
  if (paused || !attempt?.select(id)) return;
  const current = attempt;
  const scene = find('.game-scene');
  const before = current.health;
  const correct = current.correct;
  debate();
  combat.start({
   correct,
   enemyDefeated: correct && current.hits === HITS_TO_WIN - 1,
   heroDefeated: !correct && current.heroHealth === 20,
   reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
   onFrame(frame) {
    paintCombat(scene,frame,wardrobe.completed,wardrobe.equipment,wardrobe.rank);
    if (frame.phase === 'strike') void audio.effect('swordSwing');
    if (frame.shieldImpact) void audio.effect('shieldClang');
    if (frame.phase === 'ground' || frame.phase === 'hero-ground') void audio.effect('groundImpact');
   },
   onImpact() {
    if (!current.impact()) return;
    updateHealth();
    const after = current.health;
    const amount = correct ? before.enemy - after.enemy : before.hero - after.hero;
    juice.combatNumber(scene,{who:correct ? 'enemy' : 'judah',kind:correct ? 'hit' : 'hurt',amount,text:`−${amount}%`});
    juice.burst(find('.combat-sparks'),12,correct ? 'gold' : 'green');
    void audio.effect(correct ? 'swordStrike' : 'damage');
    if (current.hits === HITS_TO_WIN || !current.heroHealth) void audio.effect('finisher');
   },
   onFinish() {
    current.finish();
    debate();
   }
  });
 }
 function advance() {
  if (!attempt || paused || attempt.phase !== 'feedback') return;
  attempt.proceed();
  if (attempt.phase === 'answering') return debate();
  const won = attempt.phase === 'victory';
  find('[data-precept="pause"]').hidden = true;
  find('.precept-debate').innerHTML = `<h2 tabindex="-1">${won ? 'PRECEPT BATTLE WON!' : 'PRECEPT BATTLE LOST'}</h2>
   <p>${sabbathBattle.title} · ${attempt.hits} / 10 successful precepts</p>
   ${won ? `<p><b>Roman Soldier:</b> ${esc(sabbathBattle.closing)}</p>` : ''}
   <div class="precept-actions">${button(won ? 'REPLAY BATTLE' : 'RETRY BATTLE','start',true)}${button('RETURN TO MENU','exit')}</div>`;
  find('.precept-debate h2').focus();
  void audio.effect(won ? 'levelComplete' : 'gameover');
 }
 function togglePause(next) {
  if (!attempt || ['victory','defeat'].includes(attempt.phase) || paused === next) return;
  if (!next && document.hidden) return;
  paused = next;
  dialog.classList.toggle('precept-paused',paused);
  find('.precept-debate').hidden = paused;
  find('.precept-pause').hidden = !paused;
  find('[data-precept="pause"]').hidden = paused;
  if (paused) {
   combat.pause();
   juice.pause();
   find('[data-precept="resume"]').focus();
  } else {
   combat.resume();
   juice.resume();
   find('.precept-debate h2').focus();
  }
  music();
  if (!document.hidden) void audio.effect(paused ? 'pause' : 'resume');
 }
 root.addEventListener('click',event => {
  const control = event.target.closest('[data-precept-open]');
  if (control) open(control);
 });
 dialog.addEventListener('click',event => {
  const control = event.target.closest('button');
  if (!control) return;
  const {precept,preceptChoice} = control.dataset;
  void audio.unlock();
  if (preceptChoice) return select(preceptChoice);
  switch (precept) {
   case 'accept':
    accepted = true;
    try { storage.setItem(noticeKey,'1'); } catch {}
    return topic();
   case 'start': return begin();
   case 'advance': return advance();
   case 'pause': return togglePause(true);
   case 'resume': return togglePause(false);
   case 'exit': return close();
  }
 });
 dialog.addEventListener('keydown',event => {
  event.stopPropagation();
  if (event.repeat && ['Enter',' '].includes(event.key)) event.preventDefault();
 });
 dialog.addEventListener('cancel',event => {
  event.preventDefault();
  if (!attempt || ['victory','defeat'].includes(attempt.phase)) close();
  else togglePause(!paused);
 });
 document.addEventListener('visibilitychange',() => {
  if (dialog.open && document.hidden && attempt) togglePause(true);
  if (dialog.open) music();
 });
 document.addEventListener('freeze',() => { if (dialog.open) togglePause(true); });
 window.addEventListener('pagehide',() => { if (dialog.open) togglePause(true); });
}
