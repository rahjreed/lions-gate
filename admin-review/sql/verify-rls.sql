-- NOT RUN. Run only in the dedicated project after setup.sql and initial import.
-- Transaction rolls back. Uses two synthetic auth users, never real editor accounts.
begin;
insert into auth.users(id,email) values
 ('a1111111-1111-4111-8111-111111111111','rls-editor@example.invalid'),
 ('a2222222-2222-4222-8222-222222222222','rls-reader@example.invalid');
insert into public.lg_review_admins values('a1111111-1111-4111-8111-111111111111',true);

set local role anon;
do $$ begin
 begin perform 1 from public.lg_review_sources; raise exception 'FAIL: anon can read sources';
 exception when insufficient_privilege then null; end;
 if has_function_privilege(current_user,'public.lg_review_save(uuid,text,text,integer,text)','EXECUTE') then raise exception 'FAIL: anon RPC execute'; end if;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a2222222-2222-4222-8222-222222222222","role":"authenticated","is_anonymous":false}',true);
do $$ begin
 if exists(select 1 from public.lg_review_sources) or exists(select 1 from public.lg_review_events) or exists(select 1 from public.lg_review_admins) then raise exception 'FAIL: ordinary account can read editorial data'; end if;
 if has_table_privilege(current_user,'public.lg_review_decisions','UPDATE') or has_table_privilege(current_user,'public.lg_review_events','DELETE') or has_function_privilege(current_user,'public.lg_review_save(uuid,text,text,integer,text)','EXECUTE') then raise exception 'FAIL: direct write privilege'; end if;
end $$;

select set_config('request.jwt.claims','{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated","is_anonymous":false}',true);
do $$ begin
 if not exists(select 1 from public.lg_review_admins) or not exists(select 1 from public.lg_review_sources) then raise exception 'FAIL: enabled admin cannot read imported data'; end if;
 if has_table_privilege(current_user,'public.lg_review_decisions','INSERT') or has_function_privilege(current_user,'public.lg_review_import(jsonb)','EXECUTE') then raise exception 'FAIL: administrator JWT has unguarded write access'; end if;
end $$;
reset role;
update public.lg_review_admins set enabled=false where user_id='a1111111-1111-4111-8111-111111111111';
set local role authenticated;
do $$ begin
 if exists(select 1 from public.lg_review_sources) then raise exception 'FAIL: revoked administrator can read'; end if;
end $$;
reset role;
rollback;
-- No rows or roles/settings from this script persist after successful rollback.
