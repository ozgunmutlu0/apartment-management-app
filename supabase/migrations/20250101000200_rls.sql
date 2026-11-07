-- FixMyBuilding :: 3/4 grants + Row Level Security (PLAN section 2)

-- ---------------------------------------------------------------- table privileges
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

-- notifications: clients can only flip read_at (inserts come from triggers)
revoke insert, update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;
-- history is append-only for clients
revoke update, delete on public.ticket_events from authenticated;

alter table public.buildings     enable row level security;
alter table public.units         enable row level security;
alter table public.profiles      enable row level security;
alter table public.tickets       enable row level security;
alter table public.ticket_photos enable row level security;
alter table public.ticket_events enable row level security;
alter table public.announcements enable row level security;
alter table public.dues          enable row level security;
alter table public.payments      enable row level security;
alter table public.common_areas  enable row level security;
alter table public.reservations  enable row level security;
alter table public.notifications enable row level security;

-- ---------------------------------------------------------------- buildings
create policy buildings_select on public.buildings for select to authenticated
  using (id = (select public.current_building_id()));
create policy buildings_update_manager on public.buildings for update to authenticated
  using ((select public.current_user_role()) = 'manager' and id = (select public.current_building_id()))
  with check (id = (select public.current_building_id()));

-- ---------------------------------------------------------------- units
create policy units_select on public.units for select to authenticated
  using (building_id = (select public.current_building_id()));
create policy units_write_manager on public.units for all to authenticated
  using ((select public.current_user_role()) = 'manager' and building_id = (select public.current_building_id()))
  with check ((select public.current_user_role()) = 'manager' and building_id = (select public.current_building_id()));

-- ---------------------------------------------------------------- profiles
-- (role/building/unit changes are additionally enforced by the profiles_guard trigger)
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (building_id is not null and building_id = (select public.current_building_id()))
  );
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
create policy profiles_update_manager on public.profiles for update to authenticated
  using ((select public.current_user_role()) = 'manager' and building_id = (select public.current_building_id()))
  with check (building_id = (select public.current_building_id()));

-- ---------------------------------------------------------------- tickets
create policy tickets_select_resident on public.tickets for select to authenticated
  using (
    (select public.current_user_role()) = 'resident'
    and (
      created_by = (select auth.uid())
      or (unit_id is not null and unit_id = (select public.current_unit_id()))
    )
  );
create policy tickets_select_technician on public.tickets for select to authenticated
  using ((select public.current_user_role()) = 'technician' and assigned_to = (select auth.uid()));
create policy tickets_select_manager on public.tickets for select to authenticated
  using ((select public.current_user_role()) = 'manager' and building_id = (select public.current_building_id()));

create policy tickets_insert_resident on public.tickets for insert to authenticated
  with check (
    (select public.current_user_role()) = 'resident'
    and created_by = (select auth.uid())
    and building_id = (select public.current_building_id())
    and status = 'pending'
    and assigned_to is null
    and (unit_id is null or unit_id = (select public.current_unit_id()))
  );
create policy tickets_insert_manager on public.tickets for insert to authenticated
  with check (
    (select public.current_user_role()) = 'manager'
    and created_by = (select auth.uid())
    and building_id = (select public.current_building_id())
  );

create policy tickets_update_manager on public.tickets for update to authenticated
  using ((select public.current_user_role()) = 'manager' and building_id = (select public.current_building_id()))
  with check (building_id = (select public.current_building_id()));
-- technician: only assigned tickets; tickets_guard trigger restricts the columns to `status`
create policy tickets_update_technician on public.tickets for update to authenticated
  using ((select public.current_user_role()) = 'technician' and assigned_to = (select auth.uid()))
  with check (assigned_to = (select auth.uid()));

create policy tickets_delete_manager on public.tickets for delete to authenticated
  using ((select public.current_user_role()) = 'manager' and building_id = (select public.current_building_id()));

-- ---------------------------------------------------------------- ticket_photos (follow ticket visibility)
create policy ticket_photos_select on public.ticket_photos for select to authenticated
  using (exists (select 1 from public.tickets t where t.id = ticket_photos.ticket_id));
create policy ticket_photos_insert on public.ticket_photos for insert to authenticated
  with check ((select public.can_add_ticket_photo(ticket_id)));
create policy ticket_photos_delete on public.ticket_photos for delete to authenticated
  using ((select public.can_add_ticket_photo(ticket_id)));

-- ---------------------------------------------------------------- ticket_events (timeline)
create policy ticket_events_select on public.ticket_events for select to authenticated
  using (exists (select 1 from public.tickets t where t.id = ticket_events.ticket_id));
-- clients may only add plain notes (status/assignment events come from triggers)
create policy ticket_events_insert_note on public.ticket_events for insert to authenticated
  with check (
    actor_id = (select auth.uid())
    and event_type = 'note'
    and from_status = to_status
    and exists (
      select 1 from public.tickets t
      where t.id = ticket_events.ticket_id
        and (t.assigned_to = (select auth.uid()) or (select public.current_user_role()) = 'manager')
    )
  );

-- ---------------------------------------------------------------- announcements
create policy announcements_select on public.announcements for select to authenticated
  using (building_id = (select public.current_building_id()));
create policy announcements_insert_manager on public.announcements for insert to authenticated
  with check (
    (select public.current_user_role()) = 'manager'
    and building_id = (select public.current_building_id())
    and author_id = (select auth.uid())
  );
create policy announcements_update_manager on public.announcements for update to authenticated
  using ((select public.current_user_role()) = 'manager' and building_id = (select public.current_building_id()))
  with check (building_id = (select public.current_building_id()));
create policy announcements_delete_manager on public.announcements for delete to authenticated
  using ((select public.current_user_role()) = 'manager' and building_id = (select public.current_building_id()));

-- ---------------------------------------------------------------- dues
create policy dues_select_resident on public.dues for select to authenticated
  using (
    (select public.current_user_role()) = 'resident'
    and unit_id = (select public.current_unit_id())
  );
create policy dues_select_manager on public.dues for select to authenticated
  using (
    (select public.current_user_role()) = 'manager'
    and exists (select 1 from public.units u where u.id = dues.unit_id and u.building_id = (select public.current_building_id()))
  );
create policy dues_write_manager on public.dues for all to authenticated
  using (
    (select public.current_user_role()) = 'manager'
    and exists (select 1 from public.units u where u.id = dues.unit_id and u.building_id = (select public.current_building_id()))
  )
  with check (
    (select public.current_user_role()) = 'manager'
    and exists (select 1 from public.units u where u.id = dues.unit_id and u.building_id = (select public.current_building_id()))
  );

-- ---------------------------------------------------------------- payments (follow due visibility)
create policy payments_select on public.payments for select to authenticated
  using (exists (select 1 from public.dues d where d.id = payments.due_id));
create policy payments_write_manager on public.payments for all to authenticated
  using (
    (select public.current_user_role()) = 'manager'
    and exists (select 1 from public.dues d where d.id = payments.due_id)
  )
  with check (
    (select public.current_user_role()) = 'manager'
    and exists (select 1 from public.dues d where d.id = payments.due_id)
  );

-- ---------------------------------------------------------------- common areas
create policy common_areas_select on public.common_areas for select to authenticated
  using (building_id = (select public.current_building_id()));
create policy common_areas_write_manager on public.common_areas for all to authenticated
  using ((select public.current_user_role()) = 'manager' and building_id = (select public.current_building_id()))
  with check ((select public.current_user_role()) = 'manager' and building_id = (select public.current_building_id()));

-- ---------------------------------------------------------------- reservations
-- confirmed ones are visible to the whole building (availability); own + manager see cancelled too
create policy reservations_select on public.reservations for select to authenticated
  using (
    exists (select 1 from public.common_areas a where a.id = reservations.area_id)
    and (
      status = 'confirmed'
      or user_id = (select auth.uid())
      or (select public.current_user_role()) = 'manager'
    )
  );
create policy reservations_insert on public.reservations for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.common_areas a where a.id = reservations.area_id)
  );
create policy reservations_update on public.reservations for update to authenticated
  using (
    exists (select 1 from public.common_areas a where a.id = reservations.area_id)
    and (user_id = (select auth.uid()) or (select public.current_user_role()) = 'manager')
  )
  with check (
    exists (select 1 from public.common_areas a where a.id = reservations.area_id)
    and (user_id = (select auth.uid()) or (select public.current_user_role()) = 'manager')
  );
create policy reservations_delete on public.reservations for delete to authenticated
  using (
    exists (select 1 from public.common_areas a where a.id = reservations.area_id)
    and (user_id = (select auth.uid()) or (select public.current_user_role()) = 'manager')
  );

-- ---------------------------------------------------------------- notifications (own only)
create policy notifications_select_own on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy notifications_update_own on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy notifications_delete_own on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));
