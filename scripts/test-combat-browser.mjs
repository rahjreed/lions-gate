// Optional browser regression: PLAYWRIGHT_PATH may point to a shared installation.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {questions} from '../dist/questions.js';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
const errors=[];
try{
 for(const [width,reducedMotion] of [[1100,'no-preference'],[390,'no-preference'],[390,'reduce']]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion});
  page.setDefaultTimeout(10000);
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith('http://127.0.0.1'))errors.push(`${r.status()} ${r.url()}`)});
  await page.goto(process.env.TEST_URL||'http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});
  await page.locator('[data-action=start]').click();
  await page.locator('#sound').click();
  await page.clock.install();await page.clock.pauseAt(new Date());
  const readRun=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lions-gate-arcade-v3')).run);
  for(const outcome of ['correct','wrong','shield','timeout']){
   if(outcome==='shield')await page.locator('[data-action=shield]').evaluate(el=>el.click());
   const before=await readRun(),q=questions.find(q=>q.id===before.queue[before.index].id);
   if(outcome==='timeout'){
    await page.clock.fastForward(61000);
   }else{
    const choice=outcome==='correct'?q.answer:(q.answer+1)%4;
    // Two synchronous events exercise stale handlers as well as disabled UI.
    await page.locator(`[data-answer="${choice}"]`).evaluate(el=>{el.click();el.click()});
    if(reducedMotion==='no-preference'){
     assert.equal(await page.locator('#answer-reveal').evaluate(el=>el.open),false);
     assert.equal(await page.locator('#score-value').textContent(),before.score.toLocaleString('en-US').padStart(6,'0'),'Score waits for impact');
     assert.equal(await page.locator('.hearts').getAttribute('aria-label'),`${before.lives} lives remaining`,'Lives wait for impact');
     // Header settings must not rerender/cancel the pending strike or open the reveal early.
     await page.locator('#sound').click();await page.locator('#sound').click();
     await page.locator('#music').click();await page.locator('#music').click();
     assert.equal(await page.locator('.game-scene').getAttribute('data-combat'),'windup');
     assert.equal(await page.locator('#answer-reveal').evaluate(el=>el.open),false);
     await page.clock.runFor(250);
     assert.equal(await page.locator('.game-scene').getAttribute('data-combat'),'impact');
     assert.equal(await page.locator('.scene-status>.judah').getAttribute('data-pose'),outcome==='correct'?'slash':'recoil');
     assert.ok(await page.locator('.combat-sparks .pixel-burst').count());
     if(outcome==='correct'){
      assert.equal(await page.locator('.answer.correct>.pixel-burst').evaluate(el=>getComputedStyle(el).borderTopWidth),'0px','Particles do not inherit answer-letter borders');
     }
     if(process.env.CAPTURE_COMBAT)await page.screenshot({path:`${process.env.CAPTURE_COMBAT}/${width}-${outcome}.png`});
     if(outcome==='wrong')assert.equal(await page.locator('.life-pop').textContent(),'−1 ♥');
    }
   }
   await page.clock.runFor(1000);
   await page.locator('#answer-reveal[open]').waitFor();
   assert.match(await page.locator('#reveal-title').textContent(),outcome==='correct'?/Correct!/:/Incorrect/);
   const after=await readRun();assert.equal(after.answers.length,before.answers.length+1);
   assert.equal(after.lives,before.lives-(['wrong','timeout'].includes(outcome)?1:0));
   assert.equal(after.score,before.score+(outcome==='correct'?after.answers.at(-1).earned:0));
   const box=await page.locator('#answer-reveal').boundingBox();
   assert.ok(Math.abs(box.y+box.height/2-450)<2,'Reveal remains vertically centered');
   assert.ok(box.x>=0&&box.x+box.width<=width,'Reveal fits viewport');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.locator('#next').evaluate(el=>el.click());
   assert.equal((await readRun()).index,before.index+1);
   assert.equal(await page.locator('.roman-soldier').count(),1);
  }
  await page.close();console.log(`PASS browser: ${width}px, ${reducedMotion}, correct/wrong/shield/timeout, duplicate input, reveal centering, continuation.`);
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close()}
