-- FixMyBuilding :: 5/5 notifications: realtime tables, technician status notice, push delivery via pg_net

-- ---------------------------------------------------------------- realtime: ticket timeline + photos
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ticket_events') then
      alter publication supabase_realtime add table public.ticket_events;
    end if;
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ticket_photos') then
      alter publication supabase_realtime add table public.ticket_photos;
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------- tickets_after_update (replaces 0100 version)
-- Same behaviour as before, plus: a status change made by someone else also notifies the assigned
-- technician (skipped when the assignment changes in the same update - they get `ticket_assigned`
-- instead - and when the technician is the ticket creator, who is already notified).
create or replace function public.tickets_after_update()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_note  text := nullif(btrim(current_setting('app.ticket_note', true)), '');
begin
  if new.status is distinct from old.status then
    insert into public.ticket_events (ticket_id, actor_id, event_type, from_status, to_status, note, created_at)
    values (new.id, v_actor, 'status', old.status, new.status, v_note, clock_timestamp());

    if new.created_by is distinct from v_actor then
      insert into public.notifications (user_id, type, title, body, data)
      values (new.created_by, 'ticket_status', new.title, v_note,
              jsonb_build_object('ticket_id', new.id, 'from_status', old.status, 'status', new.status));
    end if;

    if new.assigned_to is not null
       and new.assigned_to is not distinct from old.assigned_to
       and new.assigned_to is distinct from v_actor
       and new.assigned_to is distinct from new.created_by then
      insert into public.notifications (user_id, type, title, body, data)
      values (new.assigned_to, 'ticket_status', new.title, v_note,
              jsonb_build_object('ticket_id', new.id, 'from_status', old.status, 'status', new.status));
    end if;
  end if;

  if new.assigned_to is distinct from old.assigned_to then
    insert into public.ticket_events (ticket_id, actor_id, event_type, from_status, to_status, assignee_id, note, created_at)
    values (new.id, v_actor, 'assignment', new.status, new.status, new.assigned_to,
            case when new.status is distinct from old.status then null else v_note end,
            clock_timestamp());

    if new.assigned_to is not null and new.assigned_to is distinct from v_actor then
      insert into public.notifications (user_id, type, title, body, data)
      values (new.assigned_to, 'ticket_assigned', new.title, null,
              jsonb_build_object('ticket_id', new.id, 'status', new.status, 'priority', new.priority));
    end if;
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------- push delivery (pg_net -> send-push)
-- Optional: does nothing unless the Vault secrets `send_push_url` and `send_push_secret` exist.
-- Any failure is swallowed so that inserting a notification can never fail because of push.
create extension if not exists pg_net;

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

-- trigger functions are never RPC-callable
revoke execute on function public.tickets_after_update(), public.notifications_send_push()
from public, anon, authenticated;

-- ---------------------------------------------------------------- one push token = one profile
-- A device can be used by several accounts in turn. When a profile stores a token, remove it from
-- every other profile so the previous user stops receiving pushes on this device.
create or replace function public.profiles_dedupe_push_token()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.profiles
     set expo_push_token = null
   where expo_push_token = new.expo_push_token
     and id <> new.id;
  return null;
end $$;

drop trigger if exists profiles_dedupe_push_token on public.profiles;
create trigger profiles_dedupe_push_token
  after update of expo_push_token on public.profiles
  for each row
  when (new.expo_push_token is not null and new.expo_push_token is distinct from old.expo_push_token)
  execute function public.profiles_dedupe_push_token();

revoke execute on function public.profiles_dedupe_push_token() from public, anon, authenticated;
