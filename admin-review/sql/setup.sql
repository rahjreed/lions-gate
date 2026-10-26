-- REVIEWED INSTALL SCRIPT, NOT APPLIED. Dedicated lions-gate-admin project only.
-- Apply once as project database owner after reviewing this file. No auth users/admins are created.
begin;
create table public.lg_review_admins (
 user_id uuid primary key references auth.users(id), enabled boolean not null default false
);
create table public.lg_review_sources (
 question_id text not null, source_hash text not null, payload text not null,
 batch text not null, is_live boolean not null,
 primary key(question_id,source_hash),
 check ((payload::jsonb)->>'id'=question_id),
 check (source_hash=encode(sha256(convert_to(payload,'UTF8')),'hex'))
);
create table public.lg_review_catalog (
 question_id text primary key, current_hash text not null,
 foreign key(question_id,current_hash) references public.lg_review_sources(question_id,source_hash)
);
create table public.lg_review_decisions (
 question_id text primary key references public.lg_review_catalog(question_id), revision integer not null check(revision>0),
 payload text not null, check ((payload::jsonb)->>'id'=question_id),
 check (((payload::jsonb)->>'revision')::integer=revision)
);
create table public.lg_review_events (
 event_id bigint generated always as identity primary key, event_key text not null unique,
 question_id text not null references public.lg_review_catalog(question_id),
 origin text not null, payload text not null
);
create table public.lg_review_metadata (question_id text primary key, payload text not null);

alter table public.lg_review_admins enable row level security;
create policy own_admin_membership on public.lg_review_admins for select to authenticated
 using (user_id=(select auth.uid()) and enabled and coalesce((select auth.jwt())->>'is_anonymous','false')='false');
revoke all on public.lg_review_admins from public,anon,authenticated;
grant select on public.lg_review_admins to authenticated;
grant all on public.lg_review_admins to service_role;

do $$ declare t text; begin
 foreach t in array array['lg_review_sources','lg_review_catalog','lg_review_decisions','lg_review_events','lg_review_metadata'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('grant all on public.%I to service_role',t);
  execute format('create policy admin_read on public.%I for select to authenticated using (exists(select 1 from public.lg_review_admins a where a.user_id=(select auth.uid()) and a.enabled))',t);
 end loop;
end $$;
revoke all on sequence public.lg_review_events_event_id_seq from public,anon,authenticated;
grant usage,select on sequence public.lg_review_events_event_id_seq to service_role;

-- All RPCs are SECURITY INVOKER and SERVICE-ONLY. End-user JWTs have read-only RLS.
-- The API verifies Auth /user + enabled membership before using its private secret.
create function public.lg_review_snapshot(p_actor uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.lg_review_admins where user_id=p_actor and enabled) then raise exception 'Administrator required' using errcode='42501'; end if;
 return jsonb_build_object('schemaVersion',1,
  'sources',coalesce((select jsonb_agg(to_jsonb(s) order by s.question_id) from public.lg_review_sources s join public.lg_review_catalog c on c.question_id=s.question_id and c.current_hash=s.source_hash),'[]'::jsonb),
  'decisions',coalesce((select jsonb_agg(to_jsonb(d) order by d.question_id) from public.lg_review_decisions d),'[]'::jsonb),
  'events',coalesce((select jsonb_agg(to_jsonb(e) order by e.event_id) from public.lg_review_events e),'[]'::jsonb),
  'coverage',(select payload from public.lg_review_metadata where question_id='coverage'));
end $$;

create function public.lg_review_save(p_actor uuid,p_question text,p_source_hash text,p_expected_revision integer,p_payload text) returns void
language plpgsql security invoker set search_path='' as $$
declare d jsonb:=p_payload::jsonb; src public.lg_review_sources; current_revision integer; k text; c jsonb; expected_count integer;
begin
 if not exists(select 1 from public.lg_review_admins where user_id=p_actor and enabled) then raise exception 'Administrator required' using errcode='42501'; end if;
 -- Serialize decisions/imports for this question; never accept client-side revision alone.
 perform 1 from public.lg_review_catalog where question_id=p_question for update;
 select s.* into src from public.lg_review_sources s join public.lg_review_catalog c on c.question_id=s.question_id and c.current_hash=s.source_hash where s.question_id=p_question;
 if not found or src.is_live then raise exception 'Unpublished candidate required'; end if;
 select revision into current_revision from public.lg_review_decisions where question_id=p_question;
 if coalesce(current_revision,0)<>p_expected_revision or src.source_hash<>p_source_hash then raise exception 'Stale review' using errcode='40001'; end if;
 if d->>'id' is distinct from p_question or d->>'sourceDigest' is distinct from p_source_hash or (d->>'revision')::integer is distinct from p_expected_revision+1 or d#>>'{hosted,actorId}' is distinct from p_actor::text then raise exception 'Decision identity mismatch'; end if;
 if coalesce(d->>'action','') not in ('approve','revise','reject') or length(trim(coalesce(d->>'notes','')))=0 or length(trim(coalesce(d->>'reviewer','')))=0 then raise exception 'Decision evidence required'; end if;
 if d->>'action'='approve' then
  foreach k in array array['passages','references','quotations','singleAnswer','distractors','context','crossQuestion'] loop
   if d#>array['checks',k] is distinct from 'true'::jsonb then raise exception 'Seven explicit confirmations required'; end if;
  end loop;
  if jsonb_typeof(d->'optionRationales') is distinct from 'array' or jsonb_array_length(d->'optionRationales')<>4 then raise exception 'Four rationales required'; end if;
  for c in select value from jsonb_array_elements(d->'optionRationales') loop
   if jsonb_typeof(c)<>'string' or length(trim(c#>>'{}'))=0 then raise exception 'Empty rationale'; end if;
  end loop;
  expected_count:=1+jsonb_array_length(coalesce((src.payload::jsonb)->'supportingScriptures','[]'::jsonb));
  if jsonb_typeof(d->'citations') is distinct from 'array' or jsonb_array_length(d->'citations')<>expected_count then raise exception 'Evidence required for all citations'; end if;
  for c in select value from jsonb_array_elements(d->'citations') loop
   if jsonb_typeof(c->'excerpt') is distinct from 'string' or length(trim(c->>'excerpt'))<8 or c->>'excerpt' ~* '\m(missing|pending|todo|tbd|placeholder|unverified)\M|not (yet )?(checked|verified|transcribed|provided)|to be (checked|verified|transcribed)|no evidence' then raise exception 'Checked Scripture excerpt required'; end if;
  end loop;
 end if;
 insert into public.lg_review_decisions(question_id,revision,payload) values(p_question,p_expected_revision+1,p_payload)
 on conflict(question_id) do update set revision=excluded.revision,payload=excluded.payload;
 insert into public.lg_review_events(event_key,question_id,origin,payload) values(encode(sha256(convert_to(p_payload,'UTF8')),'hex'),p_question,'hosted',p_payload);
end $$;

create function public.lg_review_import(p_bundle jsonb) returns void
language plpgsql security invoker set search_path='' as $$
declare r jsonb; d jsonb; prior text; old_hash text; changed boolean:=false;
begin
 if (p_bundle->>'schemaVersion')::integer is distinct from 1 then raise exception 'Unknown import version'; end if;
 -- Global import lock prevents simultaneous snapshots from dropping each other's catalog updates.
 perform pg_advisory_xact_lock(916205);
 for r in select value from jsonb_array_elements(p_bundle->'sources') loop
  select current_hash into old_hash from public.lg_review_catalog where question_id=r->>'question_id' for update;
  if found and old_hash<>r->>'source_hash' and coalesce((p_bundle->>'allowNewVersions')::boolean,false)=false then raise exception 'Source conflict; explicit new-version import required'; end if;
  select payload into prior from public.lg_review_sources where question_id=r->>'question_id' and source_hash=r->>'source_hash';
  if found and prior is distinct from r->>'payload' then raise exception 'Hash collision/source conflict'; end if;
  insert into public.lg_review_sources(question_id,source_hash,payload,batch,is_live) values(r->>'question_id',r->>'source_hash',r->>'payload',r->>'batch',(r->>'is_live')::boolean) on conflict do nothing;
  insert into public.lg_review_catalog(question_id,current_hash) values(r->>'question_id',r->>'source_hash') on conflict(question_id) do update set current_hash=excluded.current_hash;
  if old_hash is distinct from r->>'source_hash' then changed:=true;
   insert into public.lg_review_events(event_key,question_id,origin,payload) values('source:'||(r->>'question_id')||':'||(r->>'source_hash'),r->>'question_id','repository-import',jsonb_build_object('action','source-import','sourceDigest',r->>'source_hash','revision',0)::text) on conflict do nothing;
  end if;
 end loop;
 for d in select value from jsonb_array_elements(p_bundle->'decisions') loop
  select payload into prior from public.lg_review_decisions where question_id=d->>'question_id';
  if found and prior is distinct from d->>'payload' then raise exception 'Existing editorial decision conflict; refusing overwrite'; end if;
  insert into public.lg_review_decisions(question_id,revision,payload) values(d->>'question_id',(d->>'revision')::integer,d->>'payload') on conflict do nothing;
 end loop;
 for d in select value from jsonb_array_elements(p_bundle->'events') loop
  select payload into prior from public.lg_review_events where event_key=d->>'event_key';
  if found and prior is distinct from d->>'payload' then raise exception 'Audit event conflict'; end if;
  insert into public.lg_review_events(event_key,question_id,origin,payload) values(d->>'event_key',d->>'question_id','local-import',d->>'payload') on conflict do nothing;
 end loop;
 select payload into prior from public.lg_review_metadata where question_id='coverage';
 if prior is not null and prior is distinct from p_bundle->>'coverage' and not changed then raise exception 'Coverage conflict; inspect repository inventory'; end if;
 insert into public.lg_review_metadata(question_id,payload) values('coverage',p_bundle->>'coverage') on conflict(question_id) do update set payload=excluded.payload;
end $$;

revoke all on function public.lg_review_snapshot(uuid) from public,anon,authenticated;
revoke all on function public.lg_review_save(uuid,text,text,integer,text) from public,anon,authenticated;
revoke all on function public.lg_review_import(jsonb) from public,anon,authenticated;
grant execute on function public.lg_review_snapshot(uuid) to service_role;
grant execute on function public.lg_review_save(uuid,text,text,integer,text) to service_role;
grant execute on function public.lg_review_import(jsonb) to service_role;
notify pgrst,'reload schema';
commit;
