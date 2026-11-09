import {HITS_TO_WIN, shuffled} from './engine.js';
import {CombatDirector, paintCombat, romanSoldier} from './combat.js';
import {judah} from './mascot.js';
import {GameJuice} from './juice.js';
import {sabbathBattle} from './precept-sabbath.js';

const noticeKey = 'lions-gate-precept-notice-v1';
const chainDamage = [10,5,5];
const chainPoints = [100,50,50];
const perfectChainBonus = 200;
const chainLabels = ['REBUTTAL','PRECEPT 1','PRECEPT 2'];
// Approved pilot text has exchange-level citations, not evidence assigned to
// individual answers. Keep its original key and one existing counter-reading.
const approvedPilotAlternatives = Object.freeze({
 'PB-SAB-01':'A', 'PB-SAB-02':'C', 'PB-SAB-03':'D', 'PB-SAB-04':'A', 'PB-SAB-05':'A',
 'PB-SAB-06':'D', 'PB-SAB-07':'C', 'PB-SAB-08':'C', 'PB-SAB-09':'D', 'PB-SAB-10':'B'
});
const esc = text => String(text).replace(/[&<>"']/g, char => ({
 '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[char]));
const button = (label, action, primary = false) =>
 `<button type="button" class="button${primary ? ' primary' : ''}" data-precept="${action}">${label}</button>`;
const argumentOf = option => option.argument ?? option.text;
function supportingScripture(scripture, linked = false) {
 if (!scripture) return '';
 const reference = `${esc(scripture.reference)} · KJV excerpt`;
 const citation = linked
  ? `<a href="${esc(scripture.url)}" target="_blank" rel="noopener noreferrer">${reference} ↗</a>`
  : `<cite>${reference}</cite>`;
 return `<span class="precept-support"><q>${esc(scripture.quote)}</q> ${citation}</span>`;
}

export class PreceptAttempt {
 constructor(battle, random = Math.random) {
  this.chainCombat = battle.rules === 'precept-chain';
  this.exchanges = battle.chains.flatMap(chain => chain.exchanges.map(exchange => {
   const alternate = battle.id === sabbathBattle.id && approvedPilotAlternatives[exchange.id];
   const choices = alternate
    ? exchange.choices.filter(option => option.id === exchange.correct || option.id === alternate)
    : exchange.choices;
   return {...exchange, choices: shuffled(choices, random),
    ...(this.chainCombat ? {supports:exchange.supports.map(round=>({...round,choices:shuffled(round.choices,random)}))} : {})};
  }));
  this.hits = 0;
  this.heroHealth = 100;
  this.index = 0;
  this.stage = 0;
  this.score = 0;
  this.enemyHealth = 100;
  this.phase = 'answering';
 }
 get exchange() { return this.exchanges[this.index]; }
 get round() { return this.stage ? this.exchange.supports[this.stage-1] : this.exchange; }
 get health() { return {enemy: this.enemyHealth, hero: this.heroHealth}; }
 get damage() { return this.correct ? chainDamage[this.stage] : 0; }
 get selfDamage() { return !this.correct && !this.stage ? 20 : 0; }
 select(id) {
  if (this.phase !== 'answering') return false;
  const choice = this.round.choices.find(option => option.id === id);
  if (!choice) return false;
  this.choice = choice;
  this.correct = choice.id === this.round.correct;
  this.phase = 'animating';
  return true;
 }
 impact() {
  if (this.phase !== 'animating') return false;
  this.enemyHealth = Math.max(0,this.enemyHealth-this.damage);
  this.heroHealth = Math.max(0,this.heroHealth-this.selfDamage);
  if (this.correct) {
   this.hits++;
   if (this.chainCombat) this.score += chainPoints[this.stage]+(this.stage===2 ? perfectChainBonus : 0);
  }
  this.phase = 'recovering';
  return true;
 }
 finish() {
  if (this.phase === 'recovering') this.phase = 'feedback';
 }
 proceed() {
  if (this.phase !== 'feedback') return;
  if (!this.enemyHealth) this.phase = 'victory';
  else if (!this.heroHealth) this.phase = 'defeat';
  else {
   if (this.chainCombat) {
    if (this.correct && this.stage<2) this.stage++;
    else if (this.stage) {
     this.stage = 0;
     this.index = (this.index+1)%this.exchanges.length;
    }
   } else if (this.correct) this.index++;
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

export function bindPreceptBattle({root, storage, audio, getSettings, restoreMusic, getWardrobe, onBattleExit}) {
 const dialog = document.createElement('dialog');
 dialog.className = 'precept-dialog';
 dialog.setAttribute('aria-labelledby','precept-title');
 document.body.append(dialog);
 const combat = new CombatDirector();
 const juice = new GameJuice(dialog);
 let attempt, wardrobe, opener, gatekeeper, paused = false, accepted = false;
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
  const description = sabbathBattle.rules==='precept-chain'
   ? 'Answer the Roman, then land two supporting precepts. Reduce his health to zero to win.'
   : 'Two chains. Ten successful precepts. Both fighters start at 100% health.';
  menu(`<h1 id="precept-title" tabindex="-1">PRECEPT BATTLE</h1><p>${description}</p>
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
  const leavingBattle = Boolean(attempt);
  const story = gatekeeper;
  combat.cancel();
  juice.clear();
  attempt = null;
  gatekeeper = null;
  paused = false;
  dialog.classList.remove('precept-paused');
  dialog.close();
  dialog.replaceChildren();
  if (story) return story.onExit();
  if (leavingBattle) return onBattleExit();
  restoreMusic();
  (opener?.isConnected ? opener : root.querySelector('[data-precept-open]'))?.focus();
 }
 function begin() {
  if (!gatekeeper && !accepted) return;
  const battle = gatekeeper?.battle ?? sabbathBattle;
  attempt = new PreceptAttempt(battle);
  wardrobe = getWardrobe();
  dialog.innerHTML = `<section class="precept-shell">
   <div class="precept-top"><h1 id="precept-title" tabindex="-1">${esc(battle.title)}</h1>${button('Ⅱ PAUSE','pause')}</div>
   <div class="combat-health precept-health">
    <div class="health-block health-judah"><div class="health-label"><b>AKOBI</b><span data-precept-value="hero"></span></div><progress data-precept-meter="hero" aria-label="Akobi health" max="100"></progress></div>
    <div class="health-block health-enemy"><div class="health-label"><b>${gatekeeper?'GATEKEEPER':'ROMAN SOLDIER'}</b><span data-precept-value="enemy"></span></div><progress data-precept-meter="enemy" aria-label="${gatekeeper?'Gatekeeper':'Roman soldier'} health" max="100"></progress></div>
   </div>
   ${gatekeeper ? gatekeeper.scene() : `<div class="game-scene precept-arena" aria-label="Roman stone arena"><div class="precept-stone" aria-hidden="true"></div>
    <div class="scene-status">${judah(wardrobe.completed,'ready',false,wardrobe.equipment,wardrobe.rank)}${romanSoldier()}<span class="combat-sparks" aria-hidden="true"></span></div>
   </div>`}
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
  if (gatekeeper) find('.symbolic-gate')?.style.setProperty('--gate-power',String((100-enemy)/100));
 }
 function debate() {
  const {exchange,round,index,phase,choice,correct,stage,chainCombat} = attempt;
  const answering = phase === 'answering';
  const feedback = phase === 'feedback';
  const best = round.choices.find(option => option.id === round.correct);
  const links = exchange.citations.map(({label,url}) =>
   `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`).join(' · ');
  const choices = round.choices.map((option,i) => {
   const argument = stage ? '' : `<strong>${esc(argumentOf(option))}</strong>`;
   const copy = option.scripture
    ? `<span class="precept-option-copy">${argument}${supportingScripture(option.scripture)}</span>`
    : argument;
   return `<button type="button" class="answer" data-precept-choice="${option.id}"><span>${'ABCD'[i]}</span>${copy}</button>`;
  }).join('');
  const verse = exchange.romanScripture;
  const finished = !attempt.health.enemy || !attempt.heroHealth;
  const progress = chainCombat
   ? `<span>CHALLENGE ${index+1} · SCORE ${attempt.score.toLocaleString('en-US')}</span><br>${chainLabels.map((label,i)=>i===stage?`<strong aria-current="step">${label}</strong>`:label).join(' → ')}`
   : `CHAIN ${Math.floor(index / 5) + 1} / 2 · PRECEPT ${index % 5 + 1} / 5`;
  const result = correct ? stage===2 ? 'PRECEPT CHAIN COMPLETE! · +200 BONUS' : 'PRECEPT LANDED!'
   : stage ? 'CHAIN ENDED · DAMAGE RETAINED' : 'REBUTTAL FAILED · −20%';
  find('.precept-debate').innerHTML = `<p class="precept-progress">${progress}</p>
   <h2 tabindex="-1">${answering ? stage ? 'Akobi · Choose supporting Scripture' : gatekeeper ? 'Gatekeeper' : 'Roman Soldier' : 'Akobi'}</h2>
   ${answering && verse ? `<blockquote class="precept-verse"><p>${esc(verse.quote)}</p><a href="${esc(verse.url)}" target="_blank" rel="noopener noreferrer">${esc(verse.reference)} · KJV excerpt ↗</a></blockquote>` : ''}
   <p class="precept-line">${answering ? esc(exchange.claim) : `${stage ? '' : esc(argumentOf(choice))}${supportingScripture(choice.scripture,true)}`}</p>
   ${answering && stage ? `<p><b>Akobi:</b> ${esc(argumentOf(exchange.choices.find(option=>option.id===exchange.correct)))}</p><p>${esc(round.prompt)}</p>` : ''}
   ${answering ? `<div class="answers">${choices}</div>${verse ? '' : `<p class="precept-support">Scripture for this exchange: ${links}</p>`}` : ''}
   ${feedback ? `<div class="precept-feedback ${correct ? 'right' : 'wrong'}">
    <strong>${result}</strong>
    ${choice.feedback ? `<p>${esc(choice.feedback)}</p>` : ''}
    ${correct ? '' : `<p><b>Stronger response:</b> ${stage ? '' : esc(argumentOf(best))}${supportingScripture(best.scripture,true)}${stage ? esc(best.feedback) : ''}</p>`}
    ${choice.feedback ? '' : `<p>${esc(exchange.explanation)}</p>`}<p>${links}</p>
    ${button(finished ? 'SEE RESULT' : correct || stage ? 'CONTINUE' : 'TRY THIS REBUTTAL AGAIN','advance',true)}
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
  if (!correct && current.stage) {
   current.impact();
   current.finish();
   debate();
   return;
  }
  combat.start({
   correct,
   enemyDefeated: current.damage >= before.enemy,
   heroDefeated: current.selfDamage >= before.hero,
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
    if (!after.enemy || !after.hero) void audio.effect('finisher');
    if (correct && current.stage===2) {
     juice.burst(find('.combat-sparks'),20,'gold');
     void audio.effect('powerRestored');
    }
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
  if (gatekeeper) {
   const {onResult} = gatekeeper;
   const result = attempt;
   gatekeeper = null;
   attempt = null;
   close();
   return onResult(result);
  }
  const won = attempt.phase === 'victory';
  find('[data-precept="pause"]').hidden = true;
  find('.precept-debate').innerHTML = `<h2 tabindex="-1">${won ? 'PRECEPT BATTLE WON!' : 'PRECEPT BATTLE LOST'}</h2>
   <p>${sabbathBattle.title} · ${attempt.chainCombat ? `${attempt.score.toLocaleString('en-US')} POINTS` : `${attempt.hits} / ${HITS_TO_WIN} successful precepts`}</p>
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
 return {
  dismissGatekeeper() {
   if (gatekeeper) close();
  },
  startGatekeeper(session) {
   if (dialog.open) return false;
   gatekeeper = session;
   opener = null;
   dialog.showModal();
   begin();
   return true;
  }
 };
}
