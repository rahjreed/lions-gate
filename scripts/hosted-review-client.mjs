import {configuration,supabaseClient} from '../admin-review/server/supabase.mjs';
import {digest} from './editorial-core.mjs';
export async function hostedSnapshot({env=process.env,fetcher=fetch}={}){
 const config=configuration(env),db=supabaseClient(config,fetcher),token=env.REVIEW_ACCESS_TOKEN;
 await db.authorized(token);
 const [versions,catalog,decisions,events,metadata]=await Promise.all(['lg_review_sources','lg_review_catalog','lg_review_decisions','lg_review_events','lg_review_metadata'].map(t=>db.rows(t,token)));
 const sources=catalog.map(c=>{const s=versions.find(s=>s.question_id===c.question_id&&s.source_hash===c.current_hash);if(!s)throw Error('Inconsistent source snapshot; retry.');return s});
 return {schemaVersion:1,projectUrl:config.url,sources,decisions,events,coverage:metadata.find(m=>m.question_id==='coverage')?.payload??null};
}
export async function verifyHostedApprovals(decisions,{env=process.env,fetcher=fetch}={}){
 const hosted=decisions.filter(d=>d?.hosted);if(!hosted.length)return;
 const config=configuration(env);if(hosted.some(d=>d.hosted.projectUrl!==config.url))throw Error('Hosted approval project does not match SUPABASE_URL.');
 const db=supabaseClient(config,fetcher),token=env.REVIEW_ACCESS_TOKEN;await db.authorized(token);
 for(const d of hosted){
  const id=encodeURIComponent(d.id),rows=await db.request(`/rest/v1/lg_review_decisions?select=payload&question_id=eq.${id}`,{token});
  const catalogs=await db.request(`/rest/v1/lg_review_catalog?select=current_hash&question_id=eq.${id}`,{token});
  if(rows.length!==1||catalogs.length!==1||catalogs[0].current_hash!==d.sourceDigest||digest(JSON.parse(rows[0].payload))!==digest(d)||d.action!=='approve')throw Error(`${d.id}: hosted approval is stale, revoked or missing; publication blocked.`);
 }
}
