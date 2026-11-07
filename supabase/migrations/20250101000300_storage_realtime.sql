-- FixMyBuilding :: 4/4 storage bucket + policies, realtime

-- ---------------------------------------------------------------- storage: ticket-photos (private)
-- Path convention: <ticket_id>/<filename>   e.g. 6f1c.../1699999999.jpg
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ticket-photos', 'ticket-photos', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- read: anyone who can see the ticket (tickets RLS is applied inside the subquery)
create policy "ticket-photos read" on storage.objects for select to authenticated
  using (
    bucket_id = 'ticket-photos'
    and exists (select 1 from public.tickets t where t.id = public.storage_ticket_id(name))
  );

-- upload: ticket creator (also assigned technician / managers of the building)
create policy "ticket-photos insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ticket-photos'
    and public.can_add_ticket_photo(public.storage_ticket_id(name))
  );

create policy "ticket-photos update" on storage.objects for update to authenticated
  using (
    bucket_id = 'ticket-photos'
    and public.can_add_ticket_photo(public.storage_ticket_id(name))
  )
  with check (
    bucket_id = 'ticket-photos'
    and public.can_add_ticket_photo(public.storage_ticket_id(name))
  );

create policy "ticket-photos delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'ticket-photos'
    and public.can_add_ticket_photo(public.storage_ticket_id(name))
  );

-- ---------------------------------------------------------------- realtime
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
      alter publication supabase_realtime add table public.notifications;
    end if;
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tickets') then
      alter publication supabase_realtime add table public.tickets;
    end if;
  end if;
end $$;
