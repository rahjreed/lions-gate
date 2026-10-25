import {syncViewport} from './viewport.js';
// Measure, never shrink/truncate essential text. Oversized content can scroll.
let active=false,celebration=false,screen='',frame;
function measure(){
 cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
  syncViewport();document.body.classList.remove('game-fit','compact-game');
  if(!(active||celebration||screen)||!matchMedia('(max-width: 760px), (max-width: 1100px) and (max-height: 500px)').matches)return;
  const app=document.querySelector('#app');
  if(active&&app.scrollHeight>app.clientHeight+1)document.body.classList.add('compact-game');
  const body=document.body;
  const fits=(body.scrollHeight??document.documentElement.scrollHeight)<=(body.clientHeight??document.documentElement.clientHeight)+1&&app.scrollHeight<=app.clientHeight+1&&document.documentElement.scrollHeight<=document.documentElement.clientHeight+1;
  document.body.classList.toggle('game-fit',fits);
 });
}
export function setGameLayout(value,celebrating=false,nextScreen=''){
 active=value;celebration=celebrating;screen=nextScreen;for(const name of ['opening','game-over','transition-view'])document.body.classList.toggle(name,screen===name);document.body.classList.toggle('gameplay',active);document.body.classList.toggle('celebrating',celebration);measure();
}
document.addEventListener('toggle',event=>{if((celebration||screen==='game-over')&&event.target.matches('.review-list'))measure()},true);
new ResizeObserver(measure).observe(document.querySelector('#app'));
window.addEventListener('resize',measure);
window.visualViewport?.addEventListener('resize',measure);
document.fonts?.ready.then(measure);
