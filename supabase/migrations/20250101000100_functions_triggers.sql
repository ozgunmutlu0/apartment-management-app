-- FixMyBuilding :: 2/4 helper functions, RPCs and triggers

-- ================================================================ helpers (used by RLS)
-- SECURITY DEFINER so they can read profiles without recursing into profiles RLS.
create or replace function public.current_user_role()
returns public.user_role
language sql stable security definer set search_path = ''
as $$ select p.role from public.profiles p where p.id = (select auth.uid()) $$;

create or replace function public.current_building_id()
returns uuid
language sql stable security definer set search_path = ''
as $$ select p.building_id from public.profiles p where p.id = (select auth.uid()) $$;

create or replace function public.current_unit_id()
returns uuid
language sql stable security definer set search_path = ''
as $$ select p.unit_id from public.profiles p where p.id = (select auth.uid()) $$;

-- Parses "<ticket_id>/<file>" storage object names; null if the first segment is not a uuid.
create or replace function public.storage_ticket_id(p_name text)
returns uuid
language sql immutable set search_path = ''
as $$
  select case
    when split_part(p_name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(p_name, '/', 1)::uuid
  end
$$;

-- Who may attach photos: ticket creator, assigned technician, building managers.
-- SECURITY INVOKER on purpose: tickets RLS also has to allow the caller to see the ticket.
create or replace function public.can_add_ticket_photo(p_ticket_id uuid)
returns boolean
language sql stable set search_path = ''
as $$
  select exists (
    select 1 from public.tickets t
    where t.id = p_ticket_id
      and (
        t.created_by = (select auth.uid())
        or t.assigned_to = (select auth.uid())
        or (select public.current_user_role()) = 'manager'
      )
  )
$$;

-- ================================================================ generic updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at := now(); return new; end $$;

create trigger profiles_set_updated_at      before update on public.profiles      for each row execute function public.set_updated_at();
create trigger tickets_set_updated_at       before update on public.tickets       for each row execute function public.set_updated_at();
create trigger announcements_set_updated_at before update on public.announcements for each row execute function public.set_updated_at();

-- ================================================================ auth.users -> profiles
-- Self-signup is ALWAYS a resident; role in user metadata is ignored on purpose.
-- Managers / technicians and building/unit assignment are done by seed or an admin (service role / SQL).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role, locale)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    'resident',
    case when new.raw_user_meta_data ->> 'locale' in ('tr', 'en')
         then new.raw_user_meta_data ->> 'locale' else 'tr' end
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ================================================================ profiles guard
-- Users cannot change their own role / building / unit. Managers may change role & unit of
-- OTHER users in their own building (never building_id). auth.uid() is null for SQL editor /
-- service_role / seed, which are unrestricted.
create or replace function public.profiles_guard()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  new.id := old.id;

  if new.unit_id is not null and not exists (
    select 1 from public.units u where u.id = new.unit_id and u.building_id is not distinct from new.building_id
  ) then
    raise exception 'unit does not belong to the profile building' using errcode = '23514';
  end if;

  if v_uid is null then
    return new;
  end if;

  if (new.role, new.building_id, new.unit_id) is distinct from (old.role, old.building_id, old.unit_id) then
    if not (
      public.current_user_role() = 'manager'
      and old.id <> v_uid
      and old.building_id is not null
      and old.building_id = public.current_building_id()
      and new.building_id is not distinct from old.building_id
    ) then
      raise exception 'role, building and unit can only be changed by a building manager' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.profiles_guard();

-- ================================================================ tickets
-- BEFORE UPDATE: column-level protection per role + resolved_at + assignee validation
create or replace function public.tickets_guard()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_role public.user_role;
begin
  if v_uid is not null then
    v_role := public.current_user_role();

    if v_role = 'technician' then
      -- technicians may only change status (never back to pending)
      if (new.building_id, new.unit_id, new.created_by, new.assigned_to, new.category,
          new.priority, new.title, new.description, new.created_at)
         is distinct from
         (old.building_id, old.unit_id, old.created_by, old.assigned_to, old.category,
          old.priority, old.title, old.description, old.created_at)
      then
        raise exception 'technicians can only update the ticket status' using errcode = '42501';
      end if;
      if new.status = 'pending' and old.status <> 'pending' then
        raise exception 'technicians cannot move a ticket back to pending' using errcode = '42501';
      end if;
    elsif v_role = 'manager' then
      if (new.building_id, new.created_by) is distinct from (old.building_id, old.created_by) then
        raise exception 'building_id and created_by are immutable' using errcode = '42501';
      end if;
    else
      raise exception 'not allowed to update tickets' using errcode = '42501';
    end if;
  end if;

  if new.assigned_to is not null and new.assigned_to is distinct from old.assigned_to then
    if not exists (
      select 1 from public.profiles p
      where p.id = new.assigned_to and p.role = 'technician' and p.building_id = new.building_id
    ) then
      raise exception 'assignee must be a technician of the same building' using errcode = '23514';
    end if;
  end if;

  if new.status is distinct from old.status then
    new.resolved_at := case when new.status = 'resolved' then now() else null end;
  end if;
  return new;
end $$;

create trigger tickets_guard before update on public.tickets
  for each row execute function public.tickets_guard();

-- AFTER INSERT: initial event + notify building managers
create or replace function public.tickets_after_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.ticket_events (ticket_id, actor_id, event_type, from_status, to_status, created_at)
  values (new.id, coalesce(auth.uid(), new.created_by), 'created', null, new.status, new.created_at);

  insert into public.notifications (user_id, type, title, body, data)
  select p.id, 'ticket_created', new.title, null,
         jsonb_build_object('ticket_id', new.id, 'category', new.category, 'priority', new.priority)
  from public.profiles p
  where p.building_id = new.building_id
    and p.role = 'manager'
    and p.id <> new.created_by;
  return new;
end $$;

create trigger tickets_after_insert after insert on public.tickets
  for each row execute function public.tickets_after_insert();

-- AFTER UPDATE: status change -> event + notify creator; assignment -> event + notify assignee
-- An optional note is passed through the transaction-local setting `app.ticket_note`
-- (set by the update_ticket_status / assign_ticket RPCs).
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

create trigger tickets_after_update after update on public.tickets
  for each row execute function public.tickets_after_update();

-- ================================================================ announcements -> notifications
create or replace function public.announcements_after_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.notifications (user_id, type, title, body, data)
  select p.id, 'announcement', new.title, left(new.body, 200),
         jsonb_build_object('announcement_id', new.id, 'category', new.category, 'pinned', new.pinned)
  from public.profiles p
  where p.building_id = new.building_id
    and p.id is distinct from new.author_id;
  return new;
end $$;

create trigger announcements_after_insert after insert on public.announcements
  for each row execute function public.announcements_after_insert();

-- ================================================================ payments -> dues.status
create or replace function public.refresh_due_status(p_due_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_due  public.dues;
  v_paid numeric;
  v_new  public.due_status;
begin
  select * into v_due from public.dues where id = p_due_id;
  if not found then return; end if;
  select coalesce(sum(amount), 0) into v_paid from public.payments where due_id = p_due_id;
  v_new := case
    when v_paid >= v_due.amount then 'paid'::public.due_status
    when v_due.due_date < current_date then 'overdue'::public.due_status
    else 'unpaid'::public.due_status
  end;
  if v_new is distinct from v_due.status then
    update public.dues set status = v_new where id = p_due_id;
  end if;
end $$;

create or replace function public.payments_after_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.refresh_due_status(new.due_id);
  end if;
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.due_id <> new.due_id) then
    perform public.refresh_due_status(old.due_id);
  end if;
  return null;
end $$;

create trigger payments_after_change after insert or update or delete on public.payments
  for each row execute function public.payments_after_change();

-- Mark unpaid dues past their due date as overdue. Schedule later with pg_cron, e.g.:
--   select cron.schedule('mark-overdue-dues', '0 3 * * *', $$select public.mark_overdue_dues()$$);
create or replace function public.mark_overdue_dues()
returns integer
language plpgsql security definer set search_path = ''
as $$
declare v_count integer;
begin
  update public.dues set status = 'overdue' where status = 'unpaid' and due_date < current_date;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- ================================================================ reservations: opening hours
create or replace function public.reservations_validate()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_area  record;
  v_start timestamp;
  v_end   timestamp;
begin
  if new.status <> 'confirmed' then
    return new;
  end if;

  select ca.open_time, ca.close_time, b.timezone
    into v_area
    from public.common_areas ca
    join public.buildings b on b.id = ca.building_id
   where ca.id = new.area_id;
  if not found then
    raise exception 'unknown common area' using errcode = '23503';
  end if;

  v_start := new.starts_at at time zone v_area.timezone;
  v_end   := new.ends_at   at time zone v_area.timezone;

  if v_start::date <> v_end::date then
    raise exception 'reservation must start and end on the same day' using errcode = '23514';
  end if;
  if v_start::time < v_area.open_time or v_end::time > v_area.close_time then
    raise exception 'reservation is outside the opening hours (% - %)', v_area.open_time, v_area.close_time
      using errcode = '23514';
  end if;
  if tg_op = 'INSERT' and auth.uid() is not null and new.starts_at < now() - interval '5 minutes' then
    raise exception 'reservation cannot start in the past' using errcode = '23514';
  end if;
  return new;
end $$;

create trigger reservations_validate before insert or update on public.reservations
  for each row execute function public.reservations_validate();

-- ================================================================ RPCs (SECURITY INVOKER: RLS + guards apply)
-- Change status (+ optional note). Residents can't; technicians only on their assigned tickets.
create or replace function public.update_ticket_status(
  p_ticket_id uuid,
  p_status    public.ticket_status,
  p_note      text default null
)
returns public.tickets
language plpgsql set search_path = ''
as $$
declare
  v_ticket public.tickets;
begin
  select * into v_ticket from public.tickets where id = p_ticket_id;
  if not found then
    raise exception 'ticket not found or not permitted' using errcode = '42501';
  end if;

  if v_ticket.status = p_status then
    if nullif(btrim(p_note), '') is not null then
      perform public.add_ticket_note(p_ticket_id, p_note);
    end if;
    return v_ticket;
  end if;

  perform set_config('app.ticket_note', coalesce(p_note, ''), true);
  update public.tickets set status = p_status where id = p_ticket_id returning * into v_ticket;
  if not found then
    raise exception 'ticket not found or not permitted' using errcode = '42501';
  end if;
  perform set_config('app.ticket_note', '', true);
  return v_ticket;
end $$;

-- Assign (or unassign with null) a technician. Managers only.
create or replace function public.assign_ticket(
  p_ticket_id     uuid,
  p_technician_id uuid,
  p_note          text default null
)
returns public.tickets
language plpgsql set search_path = ''
as $$
declare
  v_ticket public.tickets;
begin
  perform set_config('app.ticket_note', coalesce(p_note, ''), true);
  update public.tickets set assigned_to = p_technician_id where id = p_ticket_id returning * into v_ticket;
  if not found then
    raise exception 'ticket not found or not permitted' using errcode = '42501';
  end if;
  perform set_config('app.ticket_note', '', true);
  return v_ticket;
end $$;

-- Add a note to the timeline without changing status (manager / assigned technician).
create or replace function public.add_ticket_note(p_ticket_id uuid, p_note text)
returns public.ticket_events
language plpgsql set search_path = ''
as $$
declare
  v_status public.ticket_status;
  v_event  public.ticket_events;
begin
  select status into v_status from public.tickets where id = p_ticket_id;
  if not found then
    raise exception 'ticket not found or not permitted' using errcode = '42501';
  end if;
  insert into public.ticket_events (ticket_id, actor_id, event_type, from_status, to_status, note)
  values (p_ticket_id, (select auth.uid()), 'note', v_status, v_status, btrim(p_note))
  returning * into v_event;
  return v_event;
end $$;

-- ================================================================ function privileges
-- Default Supabase privileges grant EXECUTE to anon/authenticated; lock everything down explicitly.
revoke execute on function
  public.current_user_role(), public.current_building_id(), public.current_unit_id(),
  public.storage_ticket_id(text), public.can_add_ticket_photo(uuid),
  public.refresh_due_status(uuid), public.mark_overdue_dues(),
  public.update_ticket_status(uuid, public.ticket_status, text),
  public.assign_ticket(uuid, uuid, text), public.add_ticket_note(uuid, text)
from public, anon, authenticated;

grant execute on function
  public.current_user_role(), public.current_building_id(), public.current_unit_id(),
  public.storage_ticket_id(text), public.can_add_ticket_photo(uuid),
  public.update_ticket_status(uuid, public.ticket_status, text),
  public.assign_ticket(uuid, uuid, text), public.add_ticket_note(uuid, text)
to authenticated;

grant execute on function
  public.refresh_due_status(uuid), public.mark_overdue_dues()
to service_role;

-- trigger functions are never RPC-callable
revoke execute on function
  public.set_updated_at(), public.handle_new_user(), public.profiles_guard(),
  public.tickets_guard(), public.tickets_after_insert(), public.tickets_after_update(),
  public.announcements_after_insert(), public.payments_after_change(), public.reservations_validate()
from public, anon, authenticated;
