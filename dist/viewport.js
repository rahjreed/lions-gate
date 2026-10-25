// Viewport geometry only. No quiz state, animation clocks or saved data live here.
export function viewportSize(win){
 const visual=win.visualViewport,scale=visual?.scale>0?visual.scale:1;
 // Normalize any browser-enforced zoom override rather than resizing the game
 // into an already magnified viewport. Keyboard/toolbars still reduce height.
 const width=Math.min(win.innerWidth,visual?.width>0?visual.width*scale:win.innerWidth);
 const height=Math.min(win.innerHeight,visual?.height>0?visual.height*scale:win.innerHeight);
 return {width:Math.max(1,Math.floor(width)),height:Math.max(1,Math.floor(height))};
}
export function syncViewport(doc=globalThis.document,win=globalThis.window){
 const size=viewportSize(win),style=doc.documentElement.style;
 doc.body.classList.toggle('viewport-short',size.height<280);
 for(const [key,value] of [['--game-view-height',`${size.height}px`],['--game-view-width',`${size.width}px`],['--game-vh',`${size.height/100}px`]]){
  if(style.getPropertyValue(key)!==value)style.setProperty(key,value);
 }
 return size;
}
export function installFixedScaleGestures(doc,win){
 const cancel=event=>{if(event.cancelable)event.preventDefault()};
 const touchCapable=()=>win.navigator.maxTouchPoints>0||win.matchMedia('(pointer: coarse)').matches;
 let start=null,lastTap=null,moved=false;
 const multi=event=>{if(event.touches.length>1){cancel(event);start=null;lastTap=null;return true}return false};
 doc.addEventListener('touchstart',event=>{
  if(multi(event))return;
  const touch=event.touches[0];start=touch?{x:touch.clientX,y:touch.clientY,time:event.timeStamp}:null;moved=false;
 },{passive:false});
 doc.addEventListener('touchmove',event=>{
  if(multi(event))return;
  const touch=event.touches[0];if(start&&touch&&Math.hypot(touch.clientX-start.x,touch.clientY-start.y)>10)moved=true;
 },{passive:false});
 doc.addEventListener('touchcancel',()=>{start=null;lastTap=null},{passive:true});
 doc.addEventListener('touchend',event=>{
  const touch=event.changedTouches[0],tap=start;start=null;
  // Never suppress ordinary control clicks or single-finger explanation scrolling.
  if(!tap||!touch||event.touches.length||moved||event.timeStamp-tap.time>350||event.target.closest?.('button,a,input,textarea,select,label,summary,[role="button"],[tabindex]:not([tabindex="-1"])')){lastTap=null;return}
  if(lastTap&&lastTap.target===event.target&&event.timeStamp-lastTap.time<300&&Math.hypot(touch.clientX-lastTap.x,touch.clientY-lastTap.y)<24){cancel(event);lastTap=null}
  else lastTap={target:event.target,time:event.timeStamp,x:touch.clientX,y:touch.clientY};
 },{passive:false});
 for(const name of ['gesturestart','gesturechange','gestureend'])doc.addEventListener(name,cancel,{passive:false});
 doc.addEventListener('dblclick',event=>{if(touchCapable()||event.sourceCapabilities?.firesTouchEvents)cancel(event)},{passive:false});
 doc.addEventListener('wheel',event=>{if(event.ctrlKey&&touchCapable())cancel(event)},{passive:false});
}
if(typeof document!=='undefined'){
 installFixedScaleGestures(document,window);syncViewport();
 for(const name of ['resize','orientationchange','pageshow'])window.addEventListener(name,()=>syncViewport());
 window.visualViewport?.addEventListener('resize',()=>syncViewport());
}
