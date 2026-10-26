import {configuration,supabaseClient} from './supabase.mjs';
import {makeDecision,viewState} from './model.mjs';
const accessName='__Host-lg_access',refreshName='__Host-lg_refresh';
export function createHandler({env=process.env,fetcher=fetch,localFixture=false}={}){
 const cookieAccess=localFixture?'lg_fixture_access':accessName,cookieRefresh=localFixture?'lg_fixture_refresh':refreshName;
 return async(req,res)=>{
  const send=(code,data)=>{res.statusCode=code;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(data))};
  res.setHeader('Cache-Control','no-store');res.setHeader('Vary','Cookie');res.setHeader('X-Content-Type-Options','nosniff');
  const secure=localFixture?'':' Secure;';
  const clear=()=>res.setHeader('Set-Cookie',[cookieAccess,cookieRefresh].map(n=>`${n}=; HttpOnly;${secure} SameSite=Strict; Path=/; Max-Age=0`));
  const setSession=s=>{if(typeof s.access_token!=='string'||typeof s.refresh_token!=='string')throw Error('Invalid session.');res.setHeader('Set-Cookie',[`${cookieAccess}=${encodeURIComponent(s.access_token)}; HttpOnly;${secure} SameSite=Strict; Path=/; Max-Age=${Math.min(Number(s.expires_in)||3600,3600)}`,`${cookieRefresh}=${encodeURIComponent(s.refresh_token)}; HttpOnly;${secure} SameSite=Strict; Path=/; Max-Age=604800`]);};
  try{
   const origin=new URL(env.REVIEW_ORIGIN||'');if((origin.protocol!=='https:'&&!(localFixture&&env.NODE_ENV!=='production'&&origin.protocol==='http:'&&origin.hostname==='127.0.0.1'))||origin.origin!==env.REVIEW_ORIGIN)throw Error('REVIEW_ORIGIN must be an exact HTTPS origin.');
   if(req.headers.host!==origin.host||req.headers.origin&&req.headers.origin!==origin.origin||req.headers['sec-fetch-site']&&!['same-origin','none'].includes(req.headers['sec-fetch-site']))return send(403,{error:'Cross-origin request denied.'});
   const action=new URL(req.url,origin).pathname.replace(/^\/api\//,'');
   const methods={login:'POST',logout:'POST',refresh:'POST',session:'GET',state:'GET',decision:'POST'};
   if(!Object.hasOwn(methods,action))return send(404,{error:'Not found.'});
   if(req.method!==methods[action])return send(405,{error:'Method not allowed.'});
   let input;
   if(req.method==='POST'){
    if(req.headers.origin!==origin.origin||req.headers['x-review-request']!=='1'||req.headers['content-type']!=='application/json')return send(403,{error:'Same-origin JSON request required.'});
    // Vercel may preparse JSON. Enforce a size bound in both paths.
    if(req.body!==undefined){if(Buffer.byteLength(JSON.stringify(req.body))>131072)return send(413,{error:'Body too large.'});input=typeof req.body==='string'?JSON.parse(req.body):req.body;}
    else{let body='';for await(const c of req){body+=c;if(Buffer.byteLength(body)>131072)return send(413,{error:'Body too large.'})}input=JSON.parse(body)}
    if(!input||typeof input!=='object'||Array.isArray(input))return send(400,{error:'JSON object required.'});
   }
   const db=supabaseClient(configuration(env),fetcher),cookies=Object.fromEntries((req.headers.cookie||'').split(';').filter(Boolean).map(v=>{const i=v.indexOf('=');return [v.slice(0,i).trim(),decodeURIComponent(v.slice(i+1))]})),token=cookies[cookieAccess];
   if(action==='login'||action==='refresh'){
    const login=action==='login';if(login&&(typeof input.email!=='string'||typeof input.password!=='string'||input.email.length>320||input.password.length>1024))return send(400,{error:'Email and password required.'});
    if(!login&&!cookies[cookieRefresh])return send(401,{error:'Sign in required.'});
    let session;try{session=await db.request('/auth/v1/token?grant_type='+(login?'password':'refresh_token'),{method:'POST',body:login?{email:input.email,password:input.password}:{refresh_token:cookies[cookieRefresh]}});await db.authorized(session.access_token)}catch{clear();return send(401,{error:'Sign-in failed or account is not an authorized administrator.'})}
    setSession(session);return send(200,{ok:true});
   }
   if(action==='logout'){try{if(token)await db.request('/auth/v1/logout',{token,method:'POST'})}catch{}clear();return send(200,{ok:true});}
   const user=await db.authorized(token);
   if(action==='session')return send(200,{email:user.email});
   const snapshot=await db.snapshot(token);
   if(action==='state')return send(200,{...viewState(snapshot),reviewer:user.email});
   if(action==='decision'){
    let decision;try{decision=makeDecision(snapshot,input,user,configuration(env).url)}catch(e){return send(e.status===409?409:400,{error:e.message});}
    await db.request('/rest/v1/rpc/lg_review_save',{secret:true,method:'POST',body:{p_actor:user.id,p_question:decision.id,p_source_hash:decision.sourceDigest,p_expected_revision:input.expectedRevision,p_payload:JSON.stringify(decision)}});
    return send(200,{ok:true});
   }
  }catch(e){const status=e.code==='40001'?409:[401,403,409].includes(e.status)?e.status:400;if(status===401||status===403)clear();return send(status,{error:status===409?'Stale review: reload before saving.':status===401?'Sign in required.':status===403?'Administrator access required.':'Request could not be completed. Check configuration, evidence and review fields, then reload.'});}
 };
}
