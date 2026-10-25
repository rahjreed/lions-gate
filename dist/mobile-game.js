// Measure, never shrink/truncate essential text. Oversized content can scroll.
let active=false,celebration=false,frame;
function measure(){
 cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
  document.body.classList.remove('game-fit');
  if(!(active||celebration)||!matchMedia('(max-width: 760px)').matches)return;
  const app=document.querySelector('#app');
  const fits=app.scrollHeight<=app.clientHeight+1&&document.documentElement.scrollHeight<=document.documentElement.clientHeight+1;
  document.body.classList.toggle('game-fit',fits);
 });
}
export function setGameLayout(value,celebrating=false){
 active=value;celebration=celebrating;document.body.classList.toggle('gameplay',active);document.body.classList.toggle('celebrating',celebration);measure();
}
document.addEventListener('toggle',event=>{if(celebration&&event.target.matches('.review-list'))measure()},true);
new ResizeObserver(measure).observe(document.querySelector('#app'));
window.addEventListener('resize',measure);
window.visualViewport?.addEventListener('resize',measure);
document.fonts?.ready.then(measure);
