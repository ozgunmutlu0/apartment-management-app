-- FixMyBuilding demo seed. Run as postgres (SQL editor / `supabase db reset`); RLS is bypassed.
-- Demo password for all users: Demo1234!
-- Triggers use auth.uid(); the seed temporarily "impersonates" actors via request.jwt.claims.

do $seed$
declare
  v_building uuid := '11111111-1111-4111-8111-111111111111';
  v_mgr      uuid := 'a0000000-0000-4000-8000-000000000001';
  v_res1     uuid := 'a0000000-0000-4000-8000-000000000002';
  v_res2     uuid := 'a0000000-0000-4000-8000-000000000003';
  v_tech     uuid := 'a0000000-0000-4000-8000-000000000004';
  v_unit1    uuid;  -- resident 1: Blok A / 3
  v_unit2    uuid;  -- resident 2: Blok B / 5
  v_area_meeting uuid := '22222222-2222-4222-8222-000000000001';
  v_area_gym     uuid := '22222222-2222-4222-8222-000000000002';
  v_area_social  uuid := '22222222-2222-4222-8222-000000000003';
  t1 uuid := '33333333-3333-4333-8333-000000000001';
  t2 uuid := '33333333-3333-4333-8333-000000000002';
  t3 uuid := '33333333-3333-4333-8333-000000000003';
  t4 uuid := '33333333-3333-4333-8333-000000000004';
  t5 uuid := '33333333-3333-4333-8333-000000000005';
  r record;
begin
  -- ------------------------------------------------------------ building, units, areas
  insert into public.buildings (id, name, address, invite_code)
  values (v_building, 'Güneş Apartmanı', 'Atatürk Cad. No: 12, Kadıköy / İstanbul', 'GUNES1');

  insert into public.units (building_id, block, number, floor)
  select v_building, b.block, n::text, (n + 1) / 2
  from (values ('A'), ('B')) as b(block)
  cross join generate_series(1, 6) as n;

  select id into v_unit1 from public.units where building_id = v_building and block = 'A' and number = '3';
  select id into v_unit2 from public.units where building_id = v_building and block = 'B' and number = '5';

  insert into public.common_areas (id, building_id, name, description, capacity, open_time, close_time) values
    (v_area_meeting, v_building, 'Toplantı Odası', 'Bina sakinleri için toplantı odası', 12, '08:00', '22:00'),
    (v_area_gym,     v_building, 'Spor Salonu',    'Kardiyo ve ağırlık ekipmanları',     8, '06:00', '23:00'),
    (v_area_social,  v_building, 'Sosyal Tesis',   'Mutfaklı sosyal alan, doğum günü ve toplantılar için', 30, '09:00', '23:00');

  -- ------------------------------------------------------------ auth users (profiles created by trigger)
  for r in
    select * from (values
      (v_mgr,  'manager@fixmybuilding.app',   'Mehmet Yılmaz'),
      (v_res1, 'resident@fixmybuilding.app',  'Ayşe Demir'),
      (v_res2, 'resident2@fixmybuilding.app', 'Can Kaya'),
      (v_tech, 'tech@fixmybuilding.app',      'Hasan Usta')
    ) as u(id, email, full_name)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', r.id, 'authenticated', 'authenticated', r.email,
      extensions.crypt('Demo1234!', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', r.full_name),
      now(), now(),
      '', '', '', '', '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), r.id, r.id::text, 'email',
      jsonb_build_object('sub', r.id::text, 'email', r.email, 'email_verified', true, 'phone_verified', false),
      now(), now(), now()
    );
  end loop;

  -- roles / building / units (auth.uid() is null here -> profiles_guard allows it)
  update public.profiles set role = 'manager',    building_id = v_building, phone = '+90 532 000 00 01', locale = 'tr' where id = v_mgr;
  update public.profiles set role = 'resident',   building_id = v_building, unit_id = v_unit1, phone = '+90 532 000 00 02', locale = 'tr' where id = v_res1;
  update public.profiles set role = 'resident',   building_id = v_building, unit_id = v_unit2, phone = '+90 532 000 00 03', locale = 'en' where id = v_res2;
  update public.profiles set role = 'technician', building_id = v_building, phone = '+90 532 000 00 04', locale = 'tr' where id = v_tech;

  -- ------------------------------------------------------------ tickets (all statuses) + timeline
  -- t1: pending (resident 1)
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_res1)::text, true);
  insert into public.tickets (id, building_id, unit_id, created_by, category, priority, title, description, created_at) values
    (t1, v_building, v_unit1, v_res1, 'elevator', 'high', 'Asansör 3. katta kapanmıyor',
     'B blok asansörü 3. katta kapısı tam kapanmıyor, bir süre bekledikten sonra hareket ediyor.', now() - interval '1 day');
  -- t2: in_review (resident 1)
  insert into public.tickets (id, building_id, unit_id, created_by, category, priority, title, description, created_at) values
    (t2, v_building, v_unit1, v_res1, 'electrical', 'normal', 'Koridor lambası yanmıyor',
     '2. kat koridor aydınlatması iki gündür çalışmıyor.', now() - interval '3 days');
  -- t4: resolved (resident 1)
  insert into public.tickets (id, building_id, unit_id, created_by, category, priority, title, description, created_at) values
    (t4, v_building, v_unit1, v_res1, 'heating', 'normal', 'Kalorifer petekleri ısınmıyor',
     'Merkezi sistemde A blok 2. kat petekleri soğuk kalıyor.', now() - interval '9 days');

  -- t3 / t5 (resident 2)
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_res2)::text, true);
  insert into public.tickets (id, building_id, unit_id, created_by, category, priority, title, description, created_at) values
    (t3, v_building, v_unit2, v_res2, 'plumbing', 'urgent', 'Otopark girişinde su kaçağı',
     'Otopark rampasının girişinde tavandan su damlıyor.', now() - interval '5 days'),
    (t5, v_building, v_unit2, v_res2, 'cleaning', 'low', 'Çöp odası temizliği',
     'B blok çöp odasında koku var, temizlik yapılmasını rica ederim.', now() - interval '2 hours');

  -- manager triages
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_mgr)::text, true);
  perform set_config('app.ticket_note', 'Talep incelemeye alındı, elektrikçi kontrol edecek.', true);
  update public.tickets set status = 'in_review' where id = t2;

  perform set_config('app.ticket_note', 'Acil: teknisyen yönlendirildi.', true);
  update public.tickets set assigned_to = v_tech, status = 'in_review' where id = t3;

  perform set_config('app.ticket_note', '', true);
  update public.tickets set assigned_to = v_tech, status = 'in_review' where id = t4;

  -- technician works on them
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tech)::text, true);
  perform set_config('app.ticket_note', 'Yerinde inceleme yapıldı, boru değişimi gerekiyor.', true);
  update public.tickets set status = 'in_progress' where id = t3;

  perform set_config('app.ticket_note', 'Hava alma işlemi yapıldı.', true);
  update public.tickets set status = 'in_progress' where id = t4;
  perform set_config('app.ticket_note', 'Petekler ısınıyor, sorun giderildi.', true);
  update public.tickets set status = 'resolved' where id = t4;

  perform set_config('app.ticket_note', '', true);

  -- ------------------------------------------------------------ announcements (one pinned)
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_mgr)::text, true);
  insert into public.announcements (building_id, author_id, title, body, category, pinned, created_at) values
    (v_building, v_mgr, 'Aylık aidat hatırlatması',
     'Sevgili sakinlerimiz, aylık aidatların her ayın 15''ine kadar yatırılması gerekmektedir. Banka bilgileri için yönetimle iletişime geçebilirsiniz.',
     'payment', true, now() - interval '6 days'),
    (v_building, v_mgr, 'Asansör bakımı',
     'Cuma günü 10:00 - 14:00 arası asansör periyodik bakımı yapılacaktır. Bu sürede asansörler kullanılamayacaktır.',
     'maintenance', false, now() - interval '3 days'),
    (v_building, v_mgr, 'Bahar şenliği',
     'Önümüzdeki hafta sonu bahçede komşuluk şenliği düzenliyoruz. Tüm sakinlerimiz davetlidir.',
     'event', false, now() - interval '1 day');

  -- ------------------------------------------------------------ dues: last 4 months (m = 0 is the current month)
  insert into public.dues (unit_id, period, amount, due_date, status)
  select u.id,
         (date_trunc('month', current_date) - make_interval(months => m))::date,
         1250.00,
         case when m = 0
              then (date_trunc('month', current_date) + interval '1 month' - interval '1 day')::date
              else (date_trunc('month', current_date) - make_interval(months => m))::date + 14 end,
         'unpaid'
  from public.units u
  cross join generate_series(0, 3) as m
  where u.building_id = v_building;

  -- past months are paid, except resident 1's last month (-> the one overdue due)
  insert into public.payments (due_id, amount, paid_at, method, recorded_by)
  select d.id, d.amount, (d.due_date - 3)::timestamptz + interval '10 hours',
         case when d.unit_id = v_unit2 then 'card' else 'bank_transfer' end, v_mgr
  from public.dues d
  join public.units u on u.id = d.unit_id
  where u.building_id = v_building
    and d.period < date_trunc('month', current_date)::date
    and not (d.unit_id = v_unit1 and d.period = (date_trunc('month', current_date) - interval '1 month')::date);

  -- a partial payment for resident 2's current month (stays unpaid)
  insert into public.payments (due_id, amount, method, recorded_by)
  select d.id, 500.00, 'cash', v_mgr
  from public.dues d
  where d.unit_id = v_unit2 and d.period = date_trunc('month', current_date)::date;

  perform public.mark_overdue_dues();

  -- ------------------------------------------------------------ reservation (resident 1, meeting room, in 2 days 18:00-20:00 Istanbul time)
  insert into public.reservations (area_id, user_id, starts_at, ends_at, status)
  values (
    v_area_meeting, v_res1,
    ((current_date + 2)::timestamp + time '18:00') at time zone 'Europe/Istanbul',
    ((current_date + 2)::timestamp + time '20:00') at time zone 'Europe/Istanbul',
    'confirmed'
  );

  perform set_config('request.jwt.claims', '', true);
end
$seed$;
