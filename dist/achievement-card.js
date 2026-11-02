// Deterministic canvas composition. Official artwork is drawn intact, never regenerated.
import {cleanNickname} from './storage.js';
export const CARD_WIDTH=1200,CARD_HEIGHT=630;
export const COVER_ART=new URL('./assets/share/kingdom-race-cover.png',import.meta.url).href;
export function cardDetails(record){
 if(!record||!Number.isSafeInteger(record.score)||record.score<0||!Number.isSafeInteger(record.level)||record.level<1)throw Error('An actual score and level are required.');
 return {name:cleanNickname(record.nickname),level:record.level,souls:record.score};
}
function fittedText(ctx,text,x,y,maxWidth,size,color='#ffe5a0'){
 ctx.font=`bold ${size}px Georgia, serif`;while(ctx.measureText(text).width>maxWidth&&size>16)ctx.font=`bold ${--size}px Georgia, serif`;
 ctx.fillStyle=color;ctx.fillText(text,x,y);
}
export async function drawAchievementCard(canvas,record=null){
 const details=record===null?null:cardDetails(record),image=new Image();image.src=COVER_ART;await image.decode();
 canvas.width=CARD_WIDTH;canvas.height=CARD_HEIGHT;const ctx=canvas.getContext('2d');
 if(!ctx)throw Error('Card preview is unavailable.');
 ctx.fillStyle='#080e20';ctx.fillRect(0,0,1200,630);
 const scale=Math.min(1200/image.naturalWidth,630/image.naturalHeight),width=image.naturalWidth*scale,height=image.naturalHeight*scale;
 ctx.drawImage(image,(1200-width)/2,(630-height)/2,width,height);
 ctx.strokeStyle='#e7b34f';ctx.lineWidth=3;ctx.strokeRect(9.5,9.5,1181,611);
 if(details){
  ctx.fillStyle='rgba(7,15,34,.94)';ctx.fillRect(667,337,505,204);ctx.strokeStyle='#dba64b';ctx.lineWidth=2;ctx.strokeRect(667,337,505,204);
  ctx.font='bold 16px monospace';ctx.fillStyle='#b8d5e8';ctx.fillText('ARCADE WARRIOR',690,366);
  fittedText(ctx,details.name,690,407,456,36);
  ctx.font='bold 15px monospace';ctx.fillStyle='#bdd4e5';ctx.fillText('LEVEL REACHED',690,444);ctx.fillText('SOULS EARNED',910,444);
  fittedText(ctx,details.level.toLocaleString('en-US'),690,504,198,44,'#b6f1ff');
  fittedText(ctx,details.souls.toLocaleString('en-US'),910,504,236,44,'#ffdf8e');
 }
 ctx.fillStyle='rgba(6,12,28,.97)';ctx.fillRect(11,566,1178,53);ctx.strokeStyle='#d9a950';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(11,566);ctx.lineTo(1189,566);ctx.stroke();
 fittedText(ctx,'CAN YOU BEAT MY SCORE?',29,602,608,30);
 fittedText(ctx,'PLAY AT RAHJREED.COM',692,602,480,28,'#b6f1ff');
 return canvas;
}
export async function previewAchievement(record,ownerDocument=document){
 cardDetails(record);
 const dialog=ownerDocument.createElement('dialog');dialog.className='achievement-preview';dialog.setAttribute('aria-label','Achievement card preview');
 dialog.innerHTML='<div class="achievement-preview-controls"><button type="button" class="button" data-close-card>Close</button><button type="button" class="button" data-download-card disabled>DOWNLOAD CARD</button></div><canvas width="1200" height="630" role="img" aria-label="Kingdom Race achievement card"></canvas><p role="status">Preparing your card…</p>';
 const canvas=dialog.querySelector('canvas'),status=dialog.querySelector('[role="status"]'),download=dialog.querySelector('[data-download-card]');
 ownerDocument.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.querySelector('[data-close-card]').onclick=()=>dialog.close();dialog.showModal();
 try{await drawAchievementCard(canvas,record);if(!dialog.isConnected)return;canvas.setAttribute('aria-label',`${cleanNickname(record.nickname)} · Level ${record.level} · ${record.score.toLocaleString('en-US')} souls earned`);status.textContent='Local card only. Facebook currently previews the shared cover. You can attach this image manually.';download.disabled=false;
  download.onclick=()=>canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=ownerDocument.createElement('a');a.href=url;a.download='kingdom-race-achievement.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'image/png');
 }catch{status.textContent='Card preview could not load. Copy Challenge is still available.';}
}
