-- FixMyBuilding :: 5/5 binaya davet koduyla katilma
-- Yeni kayit olan (binasi olmayan) kullanici davet kodu + daire secerek binaya katilir.

-- ---------------------------------------------------------------- davet kodu
alter table public.buildings
  add column invite_code text not null default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
alter table public.buildings add constraint buildings_invite_code_key unique (invite_code);

-- ---------------------------------------------------------------- profiles_guard
-- Degisiklik: join_building() islem-yerel 'fmb.joining' bayragini 'on' yaparsa, bina/daire
-- yalnizca (eski bina NULL, rol resident, rol degismiyor) ise degisebilir. Diger korumalar aynen durur.
-- (PostgREST istemcisi set_config cagiramaz; bayrak yalnizca security definer RPC icinden set edilir.)
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
    if coalesce(current_setting('fmb.joining', true), '') = 'on'
       and old.building_id is null
       and old.role = 'resident'
       and new.role = 'resident'
       and new.building_id is not null
    then
      return new; -- binaya katilma (join_building)
    end if;
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

-- ---------------------------------------------------------------- RPC: kodla bina + daireler
create or replace function public.get_building_by_invite(p_code text)
returns json
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_building public.buildings;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select * into v_building from public.buildings where invite_code = upper(btrim(p_code));
  if not found then
    return null;
  end if;

  return json_build_object(
    'id', v_building.id,
    'name', v_building.name,
    'units', coalesce((
      select json_agg(json_build_object('id', u.id, 'block', u.block, 'number', u.number, 'floor', u.floor)
                      order by u.block, length(u.number), u.number)
      from public.units u where u.building_id = v_building.id
    ), '[]'::json)
  );
end $$;

-- ---------------------------------------------------------------- RPC: binaya katil
create or replace function public.join_building(p_code text, p_unit_id uuid)
returns public.profiles
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid      uuid := auth.uid();
  v_profile  public.profiles;
  v_building public.buildings;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select * into v_profile from public.profiles where id = v_uid for update;
  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;
  if v_profile.building_id is not null then
    raise exception 'already a member of a building' using errcode = '42501';
  end if;
  if v_profile.role <> 'resident' then
    raise exception 'only residents can join a building' using errcode = '42501';
  end if;

  select * into v_building from public.buildings where invite_code = upper(btrim(p_code));
  if not found then
    raise exception 'invalid invite code' using errcode = 'P0002';
  end if;

  if not exists (select 1 from public.units where id = p_unit_id and building_id = v_building.id) then
    raise exception 'unit does not belong to this building' using errcode = '23514';
  end if;

  perform set_config('fmb.joining', 'on', true);
  update public.profiles
     set building_id = v_building.id, unit_id = p_unit_id
   where id = v_uid
   returning * into v_profile;
  perform set_config('fmb.joining', 'off', true);

  return v_profile;
end $$;

revoke execute on function public.get_building_by_invite(text), public.join_building(text, uuid)
  from public, anon;
grant execute on function public.get_building_by_invite(text), public.join_building(text, uuid)
  to authenticated;
revoke execute on function public.profiles_guard() from public, anon, authenticated;
