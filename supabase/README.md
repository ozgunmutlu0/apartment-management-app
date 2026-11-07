# FixMyBuilding - Supabase Backend

Bu klasör uygulamanın tüm backend tanımını içerir: şema, RLS, trigger'lar, storage ve demo veri.

```
supabase/
  config.toml
  migrations/
    20250101000000_schema.sql             # uzantılar, enum'lar, tablolar, indeksler
    20250101000100_functions_triggers.sql # yardımcı fonksiyonlar, trigger'lar, RPC'ler
    20250101000200_rls.sql                # grant'ler + RLS politikaları
    20250101000300_storage_realtime.sql   # ticket-photos bucket + realtime
    20250101000400_join_building.sql      # davet kodu, get_building_by_invite / join_building RPC
  seed.sql                                # demo bina, kullanıcılar, örnek veriler
```

## Uygulama yolları

### A) SQL Editor (en hızlı)

Supabase panelinde **SQL Editor** açın ve dosyaları **sırayla** çalıştırın:

1. `migrations/20250101000000_schema.sql`
2. `migrations/20250101000100_functions_triggers.sql`
3. `migrations/20250101000200_rls.sql`
4. `migrations/20250101000300_storage_realtime.sql`
5. `migrations/20250101000400_join_building.sql`
6. `seed.sql` (isteğe bağlı, yalnızca demo/geliştirme projesi için)

### B) Supabase CLI

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push            # migration'ları uygular
# seed'i uzak projeye uygulamak için SQL Editor'a seed.sql yapıştırın
# (veya: npx supabase db push --include-seed)
```

Yerel geliştirme (Docker gerekir):

```bash
npx supabase start
npx supabase db reset           # migration'lar + seed.sql
```

> `seed.sql` demo şifreleriyle kullanıcı oluşturur. **Production projesinde çalıştırmayın.**

## Demo hesaplar

Hepsinin şifresi: `Demo1234!`

| E-posta | Rol | Notlar |
|---|---|---|
| manager@fixmybuilding.app | manager | Güneş Apartmanı yöneticisi |
| resident@fixmybuilding.app | resident | Blok A / 3 (TR) |
| resident2@fixmybuilding.app | resident | Blok B / 5 (EN) |
| tech@fixmybuilding.app | technician | Atanmış işleri olan teknisyen |

## Yetki modeli (RLS)

| Tablo | resident | technician | manager |
|---|---|---|---|
| profiles | kendi + aynı bina okur; sadece kendi (rol/bina/daire hariç) günceller | aynı | bina içi okur; bina içi rol/daire değiştirir |
| tickets | kendi + dairesinin taleplerini okur; kendi adına `pending` ekler | yalnız kendine atananları okur; sadece `status` günceller | bina içi tam yetki |
| ticket_events / ticket_photos | görünen talebin geçmişi/fotoğrafı | aynı | aynı |
| announcements | bina içi okur | bina içi okur | CRUD |
| dues / payments | kendi dairesi okur | yok | bina içi CRUD |
| reservations | confirmed hepsi okunur; kendininkini yönetir | aynı | hepsi |
| notifications | yalnız kendi (okuma + `read_at`) | aynı | aynı |

Kayıt olan herkes `resident` olur (metadata'daki rol yok sayılır). Yönetici/teknisyen ve bina/daire ataması seed veya service role / SQL ile yapılır.

## Binaya katılma (davet kodu)

Kayıt olan kullanıcının `building_id`'si boştur; uygulama onu `join-building` ekranına yönlendirir.

- `buildings.invite_code`: 6 karakterlik benzersiz kod (otomatik üretilir; demo bina: `GUNES1`). Yönetici kodu sakinlerle paylaşır.
- `supabase.rpc('get_building_by_invite', { p_code })` -> `{ id, name, units: [{ id, block, number, floor }] }` veya `null` (geçersiz kod).
- `supabase.rpc('join_building', { p_code, p_unit_id })` -> güncel `profiles` satırı. Yalnızca binası olmayan `resident` çağırabilir; daire o binaya ait olmalıdır. `profiles_guard` yalnızca bu RPC içinde set edilen işlem-yerel `fmb.joining` bayrağıyla bu geçişe izin verir; diğer korumalar aynıdır.
- Her iki RPC `security definer`'dır; `anon`'a kapalı, `authenticated`'a açıktır.

## Uygulama için notlar

- Fotoğraf yolu: bucket `ticket-photos`, yol `<ticket_id>/<dosya_adı>`; ardından `ticket_photos` satırı eklenir. Okuma için `createSignedUrl` kullanın (bucket private).
- Durum güncelleme (yönetici/teknisyen): `supabase.rpc('update_ticket_status', { p_ticket_id, p_status, p_note })`.
- Atama (yönetici): `supabase.rpc('assign_ticket', { p_ticket_id, p_technician_id, p_note })` (`null` = atamayı kaldır).
- Not ekleme: `supabase.rpc('add_ticket_note', { p_ticket_id, p_note })`.
- Gecikmiş aidatlar: `select public.mark_overdue_dues();` (service role). pg_cron ile zamanlamak için fonksiyon dosyasındaki yorum satırına bakın.

## TypeScript tiplerini yeniden üretme

`src/lib/database.types.ts` elle yazılmıştır ve `supabase gen types` çıktısıyla aynı biçimdedir. Gerçek çıktıyla değiştirmek için:

```bash
npx supabase gen types typescript --project-id <PROJECT_REF> --schema public > src/lib/database.types.ts
# yerel: npx supabase gen types typescript --local > src/lib/database.types.ts
```

## Uygulamanın ihtiyaç duyduğu ortam değişkenleri

`.env` (git'e eklenmez), örnek için `.env.example`:

```
EXPO_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>
```

Service role anahtarı uygulamaya **asla** konmaz (yalnızca Edge Function / sunucu tarafı).

Auth ayarı: Authentication > Providers > Email açık olmalı. Demo için "Confirm email" kapatılabilir.
