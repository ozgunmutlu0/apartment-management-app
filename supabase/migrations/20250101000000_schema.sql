-- FixMyBuilding :: 1/4 schema (extensions, enums, tables, indexes)

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;

-- gist_uuid_ops (btree_gist) must be resolvable for the exclusion constraint below
set search_path = public, extensions;

-- ---------------------------------------------------------------- enums
create type public.user_role          as enum ('resident', 'manager', 'technician');
create type public.ticket_status      as enum ('pending', 'in_review', 'in_progress', 'resolved');
create type public.ticket_category    as enum ('elevator', 'plumbing', 'electrical', 'cleaning', 'common_area', 'heating', 'other');
create type public.ticket_priority    as enum ('low', 'normal', 'high', 'urgent');
create type public.due_status         as enum ('unpaid', 'paid', 'overdue');
create type public.reservation_status as enum ('confirmed', 'cancelled');

-- ---------------------------------------------------------------- buildings / units
create table public.buildings (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(btrim(name)) between 1 and 120),
  address    text,
  timezone   text not null default 'Europe/Istanbul',  -- used for common-area opening hours
  created_at timestamptz not null default now()
);

create table public.units (
  id          uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  block       text not null default '',
  number      text not null check (char_length(btrim(number)) > 0),
  floor       integer,
  created_at  timestamptz not null default now(),
  constraint units_unique_number unique (building_id, block, number)
);
create index units_building_idx on public.units (building_id);

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text not null default '',
  phone           text,
  role            public.user_role not null default 'resident',
  building_id     uuid references public.buildings(id) on delete set null,
  unit_id         uuid references public.units(id) on delete set null,
  locale          text not null default 'tr' check (locale in ('tr', 'en')),
  expo_push_token text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index profiles_building_role_idx on public.profiles (building_id, role);
create index profiles_unit_idx on public.profiles (unit_id);

-- ---------------------------------------------------------------- tickets
create table public.tickets (
  id          uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  unit_id     uuid references public.units(id) on delete set null,
  created_by  uuid not null references public.profiles(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  category    public.ticket_category not null default 'other',
  priority    public.ticket_priority not null default 'normal',
  title       text not null check (char_length(btrim(title)) between 3 and 120),
  description text not null default '' check (char_length(description) <= 4000),
  status      public.ticket_status not null default 'pending',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  resolved_at timestamptz
);
create index tickets_building_status_idx on public.tickets (building_id, status, created_at desc);
create index tickets_created_by_idx      on public.tickets (created_by, created_at desc);
create index tickets_assigned_to_idx     on public.tickets (assigned_to, status);
create index tickets_unit_idx            on public.tickets (unit_id);

create table public.ticket_photos (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid not null references public.tickets(id) on delete cascade,
  storage_path text not null check (char_length(storage_path) > 0),
  created_at   timestamptz not null default now()
);
create index ticket_photos_ticket_idx on public.ticket_photos (ticket_id);

create table public.ticket_events (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.tickets(id) on delete cascade,
  actor_id    uuid references public.profiles(id) on delete set null,
  event_type  text not null default 'status' check (event_type in ('created', 'status', 'assignment', 'note')),
  from_status public.ticket_status,
  to_status   public.ticket_status not null,
  assignee_id uuid references public.profiles(id) on delete set null,  -- set for event_type = 'assignment' (null = unassigned)
  note        text check (note is null or char_length(note) <= 2000),
  created_at  timestamptz not null default now()
);
create index ticket_events_ticket_idx on public.ticket_events (ticket_id, created_at);

-- ---------------------------------------------------------------- announcements
create table public.announcements (
  id          uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  author_id   uuid references public.profiles(id) on delete set null,
  title       text not null check (char_length(btrim(title)) between 1 and 160),
  body        text not null default '' check (char_length(body) <= 10000),
  category    text not null default 'general' check (category in ('general', 'maintenance', 'event', 'urgent', 'payment')),
  pinned      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index announcements_building_idx on public.announcements (building_id, pinned desc, created_at desc);

-- ---------------------------------------------------------------- dues / payments
create table public.dues (
  id         uuid primary key default gen_random_uuid(),
  unit_id    uuid not null references public.units(id) on delete cascade,
  period     date not null check (extract(day from period) = 1),  -- first day of month
  amount     numeric(12,2) not null check (amount >= 0),
  due_date   date not null,
  status     public.due_status not null default 'unpaid',
  created_at timestamptz not null default now(),
  constraint dues_unit_period_key unique (unit_id, period)
);
create index dues_period_idx on public.dues (period desc);
create index dues_status_due_date_idx on public.dues (status, due_date);

create table public.payments (
  id          uuid primary key default gen_random_uuid(),
  due_id      uuid not null references public.dues(id) on delete cascade,
  amount      numeric(12,2) not null check (amount > 0),
  paid_at     timestamptz not null default now(),
  method      text not null default 'cash' check (method in ('cash', 'bank_transfer', 'card', 'other')),
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index payments_due_idx on public.payments (due_id);

-- ---------------------------------------------------------------- common areas / reservations
create table public.common_areas (
  id          uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  name        text not null check (char_length(btrim(name)) > 0),
  description text,
  capacity    integer check (capacity is null or capacity > 0),
  open_time   time not null default '08:00',
  close_time  time not null default '22:00',
  created_at  timestamptz not null default now(),
  constraint common_areas_hours_check check (close_time > open_time)
);
create index common_areas_building_idx on public.common_areas (building_id);

create table public.reservations (
  id         uuid primary key default gen_random_uuid(),
  area_id    uuid not null references public.common_areas(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  status     public.reservation_status not null default 'confirmed',
  created_at timestamptz not null default now(),
  constraint reservations_time_check check (ends_at > starts_at),
  constraint reservations_no_overlap exclude using gist (
    area_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status = 'confirmed')
);
create index reservations_user_idx on public.reservations (user_id, starts_at desc);
create index reservations_area_time_idx on public.reservations (area_id, starts_at);

-- ---------------------------------------------------------------- notifications
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null,  -- ticket_created | ticket_status | ticket_assigned | announcement | ...
  title      text not null,
  body       text,
  data       jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;
