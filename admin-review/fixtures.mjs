// Isolated local test transport. Never imported by the Vercel API or public UI.
import {readFile} from 'node:fs/promises';
import {digest} from './generated/scripts/editorial-core.mjs';
export async function fixtureBackend(){
 const batches=['initial-50.json','kr-101-150.json'];const sources=[];
 for(const batch of batches)for(const q of JSON.parse(await readFile(new URL('../content/candidates/'+batch,import.meta.url),'utf8')))sources.push({question_id:q.id,source_hash:digest(q),payload:JSON.stringify(q),batch,is_live:false});
 const {questions}=await import('../dist/questions.js');for(const q of questions)sources.push({question_id:q.id,source_hash:digest(q),payload:JSON.stringify(q),batch:'live-reviewed',is_live:true});
 const snapshot={schemaVersion:1,sources,decisions:[],events:[],coverage:await readFile(new URL('../content/curriculum-coverage.json',import.meta.url),'utf8')};
 let enabled=true;const calls=[];
 const user={id:'11111111-1111-4111-8111-111111111111',email:'editor@example.test',email_confirmed_at:'2026-01-01T00:00:00Z',is_anonymous:false};
 async function fetcher(url,options={}){
  const u=new URL(url),body=options.body?JSON.parse(options.body):null,token=options.headers?.Authorization;calls.push({path:u.pathname,secret:options.headers?.apikey==='fixture-secret'});
  const response=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
  if(u.pathname==='/auth/v1/token')return response(body?.password==='fixture-password'||body?.refresh_token==='fixture-refresh'?200:400,{access_token:'fixture-admin',refresh_token:'fixture-refresh',expires_in:3600});
  if(u.pathname==='/auth/v1/user')return token==='Bearer fixture-admin'?response(200,user):token==='Bearer fixture-ordinary'?response(200,{...user,id:'22222222-2222-4222-8222-222222222222'}):response(401,{});
  if(u.pathname==='/auth/v1/logout')return response(200,{});
  if(u.pathname==='/rest/v1/lg_review_admins')return response(200,enabled&&u.searchParams.get('user_id')==='eq.'+user.id?[{user_id:user.id}]:[]);
  if(u.pathname==='/rest/v1/rpc/lg_review_snapshot')return response(enabled?200:403,snapshot);
  if(u.pathname==='/rest/v1/rpc/lg_review_save'){
   const prior=snapshot.decisions.find(d=>d.question_id===body.p_question),source=snapshot.sources.find(s=>s.question_id===body.p_question);
   if(!enabled)return response(403,{});
   if((prior?.revision??0)!==body.p_expected_revision||source.source_hash!==body.p_source_hash)return response(409,{code:'40001'});
   const d=JSON.parse(body.p_payload),row={question_id:d.id,revision:d.revision,payload:body.p_payload};if(prior)Object.assign(prior,row);else snapshot.decisions.push(row);snapshot.events.push({event_id:snapshot.events.length+1,event_key:digest(d),question_id:d.id,origin:'hosted',payload:body.p_payload});return response(200,null);
  }
  if(u.pathname==='/rest/v1/lg_review_decisions')return response(200,snapshot.decisions.filter(d=>u.searchParams.get('question_id')==='eq.'+d.question_id));
  if(u.pathname==='/rest/v1/lg_review_catalog')return response(200,snapshot.sources.filter(d=>u.searchParams.get('question_id')==='eq.'+d.question_id).map(d=>({question_id:d.question_id,current_hash:d.source_hash})));
  return response(404,{});
 }
 return {fetcher,snapshot,user,calls,setEnabled:v=>{enabled=v}};
}
