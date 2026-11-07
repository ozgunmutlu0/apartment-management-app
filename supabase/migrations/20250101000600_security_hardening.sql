-- FixMyBuilding :: 7/7 security hardening
--   1. pg_net moves from schema public to schema extensions (advisor 0014)
--   2. push tokens move out of profiles (readable by the whole building) into an owner-only table

-- ================================================================ 1. pg_net -> extensions schema
-- pg_net is not relocatable: drop and recreate. Its functions live in schema `net` either way,
-- so `net.http_post` in notifications_send_push() keeps working. The trigger is dropped first and
-- recreated at the end of this file; its function body only resolves net.http_post at run time.
drop trigger if exists notifications_send_push on public.notifications;
drop extension if exists pg_net;
create schema if not exists extensions;
create extension if not exists pg_net with schema extensions;

-- ================================================================ 2. push_tokens
create table if not exists public.push_tokens (
  token       text primary key check (length(token) between 1 and 512),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  platform    text check (platform in ('ios', 'android', 'web')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists push_tokens_user_id_idx on public.push_tokens (user_id);

drop trigger if exists push_tokens_set_updated_at on public.push_tokens;
create trigger push_tokens_set_updated_at before update on public.push_tokens
  for each row execute function public.set_updated_at();

-- privileges: same pattern as 0200 (new tables are not covered by its "all tables" grants)
revoke all on public.push_tokens from anon;
grant select, insert, update, delete on public.push_tokens to authenticated;
grant all on public.push_tokens to service_role;

alter table public.push_tokens enable row level security;

drop policy if exists push_tokens_select_own on public.push_tokens;
drop policy if exists push_tokens_insert_own on public.push_tokens;
drop policy if exists push_tokens_update_own on public.push_tokens;
drop policy if exists push_tokens_delete_own on public.push_tokens;
create policy push_tokens_select_own on public.push_tokens for select to authenticated
  using (user_id = (select auth.uid()));
create policy push_tokens_insert_own on public.push_tokens for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy push_tokens_update_own on public.push_tokens for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy push_tokens_delete_own on public.push_tokens for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------- RPCs
-- One device = one account: registering a token removes it from every other user first.
-- SECURITY DEFINER because RLS would (rightly) hide the other user's row from the caller.
create or replace function public.register_push_token(p_token text, p_platform text default null)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_token text := btrim(p_token);
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if v_token is null or v_token = '' or length(v_token) > 512 then
    raise exception 'invalid push token' using errcode = '22023';
  end if;
  if p_platform is not null and p_platform not in ('ios', 'android', 'web') then
    raise exception 'invalid platform' using errcode = '22023';
  end if;

  delete from public.push_tokens where token = v_token and user_id <> v_uid;

  insert into public.push_tokens (token, user_id, platform)
  values (v_token, v_uid, p_platform)
  on conflict (token) do update
    set user_id = excluded.user_id,
        platform = coalesce(excluded.platform, public.push_tokens.platform),
        updated_at = now();
end $$;

-- Only removes the caller's own row for this token.
create or replace function public.unregister_push_token(p_token text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  delete from public.push_tokens where token = btrim(p_token) and user_id = v_uid;
end $$;

revoke execute on function public.register_push_token(text, text), public.unregister_push_token(text)
  from public, anon;
grant execute on function public.register_push_token(text, text), public.unregister_push_token(text)
  to authenticated;

-- ---------------------------------------------------------------- migrate existing tokens
-- (no row in profiles is updated, so profiles_guard does not fire; the column drop below does not
-- fire row triggers either.) If two profiles shared a token, keep the most recently updated one.
insert into public.push_tokens (token, user_id)
select distinct on (p.expo_push_token) p.expo_push_token, p.id
from public.profiles p
where p.expo_push_token is not null and btrim(p.expo_push_token) <> ''
  and length(p.expo_push_token) <= 512
order by p.expo_push_token, p.updated_at desc
on conflict (token) do nothing;

-- ---------------------------------------------------------------- remove the old storage
drop trigger if exists profiles_dedupe_push_token on public.profiles;
drop function if exists public.profiles_dedupe_push_token();
alter table public.profiles drop column if exists expo_push_token;

-- ================================================================ push trigger (recreated)
-- Function is unchanged from 0500 (still fail-safe, still calls net.http_post); only the trigger
-- had to be dropped for the extension re-create. Re-assert the definition so this file is complete.
create or replace function public.notifications_send_push()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_url    text;
  v_secret text;
begin
  begin
    select decrypted_secret into v_url
      from vault.decrypted_secrets where name = 'send_push_url' limit 1;
    select decrypted_secret into v_secret
      from vault.decrypted_secrets where name = 'send_push_secret' limit 1;

    if coalesce(v_url, '') = '' or coalesce(v_secret, '') = '' then
      return new;
    end if;

    perform net.http_post(
      url     := v_url,
      body    := jsonb_build_object('notification_id', new.id),
      headers := jsonb_build_object(
                   'Content-Type', 'application/json',
                   'x-webhook-secret', v_secret
                 ),
      timeout_milliseconds := 5000
    );
  exception when others then
    -- vault / pg_net not available or misconfigured: push is best effort
    null;
  end;
  return new;
end $$;

drop trigger if exists notifications_send_push on public.notifications;
create trigger notifications_send_push after insert on public.notifications
  for each row execute function public.notifications_send_push();

revoke execute on function public.notifications_send_push() from public, anon, authenticated;
