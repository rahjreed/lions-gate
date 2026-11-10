// Installation/offline support only. Never reads, resets or migrates saved runs.
const install=document.querySelector('#install-game'),ios=document.querySelector('#ios-install');
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
let promptEvent;
function hideInstall(){promptEvent=null;install.hidden=true;ios.hidden=true}
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();if(standalone())return;
 promptEvent=event;install.hidden=false;
});
install.addEventListener('click',async()=>{
 if(!promptEvent)return;
 const event=promptEvent;promptEvent=null;install.hidden=true;
 try{await event.prompt();await event.userChoice}catch{/* Native install is optional. */}
});
window.addEventListener('appinstalled',hideInstall);
matchMedia('(display-mode: standalone)').addEventListener('change',()=>{if(standalone())hideInstall()});
const appleMobile=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
ios.hidden=!appleMobile||standalone();
if('serviceWorker' in navigator&&window.isSecureContext){
 window.addEventListener('load',()=>{
  const workers=navigator.serviceWorker;
  const update=document.createElement('button');
  update.type='button';
  update.id='game-update';
  update.className='button';
  update.hidden=true;
  update.textContent='APPLY GAME UPDATE';
  document.body.append(update);
  let requested=false;
  workers.addEventListener('controllerchange',()=>{
   if(requested)location.reload();
  });
  workers.register(new URL('sw.js',import.meta.url),{updateViaCache:'none'}).then(registration=>{
   const showWaiting=()=>{update.hidden=!(registration.waiting&&workers.controller)};
   const watchInstall=()=>registration.installing?.addEventListener('statechange',showWaiting);
   registration.addEventListener('updatefound',watchInstall);
   watchInstall();
   showWaiting();
   document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)void registration.update().catch(()=>{});
   });
   update.onclick=()=>{
    if(requested||!document.body.classList.contains('opening')||document.querySelector('dialog[open]'))return;
    const waiting=registration.waiting;
    if(!waiting)return showWaiting();
    requested=true;
    const app=document.querySelector('#app');
    app.inert=true;
    update.disabled=true;
    update.textContent='APPLYING UPDATE…';
    const channel=new MessageChannel();
    const reset=message=>{
     if(!requested)return;
     requested=false;
     app.inert=false;
     update.disabled=false;
     update.textContent=message;
    };
    const timeout=setTimeout(()=>reset('CLOSE ALL GAME WINDOWS TO UPDATE'),8000);
    channel.port1.onmessage=event=>{
     clearTimeout(timeout);
     reset(event.data==='close-other-windows'?'CLOSE OTHER GAME WINDOWS, THEN RETRY':'CLOSE ALL GAME WINDOWS TO UPDATE');
     channel.port1.close();
    };
    waiting.postMessage('apply-title-update',[channel.port2]);
   };
   return workers.ready;
  }).then(()=>{
   document.querySelector('#offline-status').textContent='Offline game ready. Close all game windows to apply future updates.';
  }).catch(()=>{
   document.querySelector('#offline-status').textContent='Offline setup unavailable. Online play and local saving still work.';
  });
 });
}
