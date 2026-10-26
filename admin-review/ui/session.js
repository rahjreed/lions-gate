const $=s=>document.querySelector(s);
export function lock(){ $('#editor').hidden=true;$('#editor').replaceChildren();$('#summary').textContent='Administrator authentication required.';$('#login').hidden=false;$('#logout').hidden=true; }
async function request(path,options={}){return fetch(path,{credentials:'same-origin',...options,headers:{...(options.method?{'Content-Type':'application/json','X-Review-Request':'1'}:{}),...options.headers}})}
let refreshing;
export async function portalFetch(path,options){
 let r=await request(path,options);
 if(r.status===401){refreshing??=request('/api/refresh',{method:'POST',body:'{}'}).finally(()=>{refreshing=null});if((await refreshing).ok)r=await request(path,options);}
 if(r.status===401||r.status===403){lock();throw Error('Your session ended or administrator access was revoked. Sign in again.');}return r;
}
export async function startSession(load){
 async function enter(){const r=await portalFetch('/api/session');if(!r.ok)throw Error('Unable to start session.');$('#login').hidden=true;$('#editor').hidden=false;$('#logout').hidden=false;await load();}
 $('#login-form').onsubmit=async e=>{e.preventDefault();const b=$('#sign-in');b.disabled=true;$('#login-message').textContent='Signing in…';try{const r=await request('/api/login',{method:'POST',body:JSON.stringify({email:$('#email').value,password:$('#password').value})});if(!r.ok)throw Error('Sign-in failed or account is not an authorized administrator.');location.reload();}catch(e){$('#login-message').textContent=e.message}finally{$('#password').value='';b.disabled=false}};
 $('#logout').onclick=async()=>{await request('/api/logout',{method:'POST',body:'{}'});location.reload();};
 try{await enter()}catch{$('#login-message').textContent='Sign in with an authorized administrator account.';}
}
export function renderHistory(parent,events,id){
 const section=document.createElement('section'),heading=document.createElement('h3');heading.textContent='Revision history';section.append(heading);
 const rows=events.filter(e=>e.id===id).reverse();if(!rows.length){const p=document.createElement('p');p.textContent='No saved editorial decisions.';section.append(p)}
 for(const e of rows){const details=document.createElement('details'),summary=document.createElement('summary'),pre=document.createElement('pre');summary.textContent=e.origin==='repository-import'?`Repository source import · ${e.decision.sourceDigest}`:`Revision ${e.decision.revision} · ${e.decision.action} · ${e.decision.reviewer} · ${e.decision.savedAt} (${e.origin})`;pre.textContent=JSON.stringify(e.decision,null,2);details.append(summary,pre);section.append(details)}parent.append(section);
}
