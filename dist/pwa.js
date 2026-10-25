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
  navigator.serviceWorker.register(new URL('sw.js',import.meta.url),{updateViaCache:'none'}).then(()=>navigator.serviceWorker.ready).then(()=>{
   document.querySelector('#offline-status').textContent='Offline game ready. Close all game windows to apply future updates.';
  }).catch(()=>{
   document.querySelector('#offline-status').textContent='Offline setup unavailable. Online play and local saving still work.';
  });
 });
}
