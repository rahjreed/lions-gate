// Server/terminal only. The browser never receives API keys or tokens.
export function configuration(env=process.env){
 const url=new URL(env.SUPABASE_URL||'https://unconfigured.invalid');
 if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co')||url.pathname!=='/'||url.search||url.username||url.password)throw Error('Configure a hosted Supabase project URL.');
 if(!env.SUPABASE_PUBLISHABLE_KEY)throw Error('SUPABASE_PUBLISHABLE_KEY is required.');
 return {url:url.origin,key:env.SUPABASE_PUBLISHABLE_KEY,secret:env.SUPABASE_SECRET_KEY};
}
export function supabaseClient(config,fetcher=fetch){
 async function request(path,{token,secret=false,method='GET',body}={}){
  if(secret&&!config.secret)throw Error('Server secret is not configured.');
  const key=secret?config.secret:config.key;
  const bearer=token??(secret&&key.startsWith('eyJ')?key:null);
  const response=await fetcher(config.url+path,{method,headers:{apikey:key,...(bearer?{Authorization:'Bearer '+bearer}:{}),'Content-Type':'application/json'},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000),redirect:'error'});
  const data=await response.json().catch(()=>null);
  if(!response.ok){const e=Error('Supabase request failed.');e.status=response.status;e.code=data?.code;throw e}return data;
 }
 async function authorized(token){
  if(!token)throw Object.assign(Error('Sign in required.'),{status:401});
  const user=await request('/auth/v1/user',{token});
  if(!user?.id||user.is_anonymous||!user.email_confirmed_at)throw Object.assign(Error('Confirmed administrator required.'),{status:403});
  const rows=await request('/rest/v1/lg_review_admins?select=user_id&enabled=eq.true&user_id=eq.'+encodeURIComponent(user.id),{token});
  if(!Array.isArray(rows)||!rows.some(r=>r.user_id===user.id))throw Object.assign(Error('Administrator access required.'),{status:403});
  return user;
 }
 async function rows(table,token){
  // Explicit pagination prevents PostgREST's default row cap from truncating audit history.
  const all=[];for(let offset=0;;offset+=500){const page=await request(`/rest/v1/${table}?select=*&order=${table==='lg_review_events'?'event_id':'question_id'}.asc&limit=500&offset=${offset}`,{token});if(!Array.isArray(page))throw Error('Invalid database response.');all.push(...page);if(page.length<500)return all;}
 }
 async function snapshot(token){
  // The transactionally consistent RPC is service-only; authorize caller before use.
  const user=await authorized(token);return request('/rest/v1/rpc/lg_review_snapshot',{secret:true,method:'POST',body:{p_actor:user.id}});
 }
 return {request,authorized,rows,snapshot};
}
