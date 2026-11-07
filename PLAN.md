# FixMyBuilding — Uygulama Planı

> "Your Building, Your Community, One App."
> Bu dosya, işi yapan alt ajanlar için tek doğruluk kaynağıdır. Kurallara uyulmalı; değiştirmek gerekiyorsa gerekçesiyle raporla.

## 1. Teknoloji kararları

| Konu | Karar |
|---|---|
| Framework | React Native + **Expo (en güncel stabil SDK)**, TypeScript `strict` |
| Navigasyon | **Expo Router** (dosya tabanlı). Sekmeler: `expo-router/native-tabs` (**NativeTabs**) → iOS 26'da otomatik Liquid Glass tab bar, Android'de Material bottom nav |
| Stack | Native stack (`Stack` from expo-router). iOS'ta `headerLargeTitle`, `headerTransparent` + `headerBlurEffect`/sistem varsayılanı; arama için `headerSearchBarOptions` |
| Modallar | `presentation: 'formSheet'` + `sheetAllowedDetents` (iOS 26'da glass sheet). JS tabanlı modal/bottom-sheet kütüphanesi **YOK** |
| Glass yüzeyler | Liquid Glass yalnızca sistem krom'unda (NativeTabs tab bar, native header, formSheet); içerik kartları (`GlassCard`) düz, opak, ince çizgili karttır |
| Native kontroller | `@expo/ui` (iOS: SwiftUI — Picker/segmented, DateTimePicker, Switch, ContextMenu, Button; Android: Jetpack Compose karşılıkları). Mevcut değilse RN core + `@react-native-community/datetimepicker` |
| İkonlar | `expo-symbols` (SF Symbols) iOS; Android için Material ikon fallback'i |
| Renkler | Özel sıcak palet, tek vurgu rengi ("blueprint blue"); iOS'ta `DynamicColorIOS`, Android'de `useColorScheme`, kütüphaneler için `hexColors()`. Boşluk/radius/tipografi `theme/tokens.ts`. Dark mode zorunlu destek |
| Backend | **Supabase** (Auth email+şifre, Postgres + RLS, Storage, Realtime, Edge Functions) |
| Veri katmanı | `@supabase/supabase-js` + `@tanstack/react-query`; oturum `expo-secure-store` (büyük değer sorunu varsa AsyncStorage) |
| i18n | `i18next` + `react-i18next` + `expo-localization`; **TR (varsayılan) + EN**; feature başına namespace dosyası |
| Görseller | `expo-image-picker` (kamera + galeri), `expo-image`, Supabase Storage `ticket-photos` bucket |
| Bildirim | `expo-notifications` (push) + Supabase Realtime (uygulama içi) + `notifications` tablosu |
| Kalite | ESLint (`eslint-config-expo`), Prettier, `tsc --noEmit`, `npx expo-doctor` |

**Native-first kuralı:** Ekranda native karşılığı olan hiçbir şey JS ile taklit edilmez (tab bar, header, arama çubuğu, sheet, segmented control, date picker, switch, context menu, alert, action sheet). Özel gölgeli/yuvarlak "fake iOS" kartları yerine tutarlı palet + `tokens.ts` ile düz kartlar; Liquid Glass sistem krom'una bırakılır.

## 2. Roller

| Rol (`role` enum) | Yetkiler |
|---|---|
| `resident` | Arıza oluştur/görüntüle (kendi), aidat görüntüle (kendi dairesi), duyuru oku, rezervasyon |
| `manager` | Binadaki tüm talepler, durum değiştirme, teknisyen atama, duyuru CRUD, aidat oluşturma/ödeme işleme, raporlar |
| `technician` | Kendine atanan talepler, durum güncelleme + not, duyuru okuma |

Yetki **RLS ile veritabanında** uygulanır; UI sadece gizler.

## 3. Veri modeli (Supabase / Postgres)

Enum'lar: `user_role (resident, manager, technician)`, `ticket_status (pending, in_review, in_progress, resolved)`, `ticket_category (elevator, plumbing, electrical, cleaning, common_area, heating, other)`, `ticket_priority (low, normal, high, urgent)`, `due_status (unpaid, paid, overdue)`, `reservation_status (confirmed, cancelled)`.

Tablolar (hepsi `id uuid pk default gen_random_uuid()`, `created_at timestamptz default now()`):
- `buildings(name, address, timezone, invite_code)`
- `units(building_id, block, number, floor)` — unique(building_id, block, number)
- `profiles(id = auth.users.id, full_name, phone, role, building_id, unit_id, locale, expo_push_token)` — auth signup trigger ile otomatik oluşur
- `tickets(building_id, unit_id, created_by, assigned_to, category, priority, title, description, status default 'pending', updated_at, resolved_at)`
- `ticket_photos(ticket_id, storage_path)`
- `ticket_events(ticket_id, actor_id, event_type [created|status|assignment|note], from_status, to_status, assignee_id, note)` — zaman çizelgesi (trigger/RPC ile yazılır)
- `announcements(building_id, author_id, title, body, category, pinned bool)`
- `dues(unit_id, period date (ayın 1'i), amount numeric, due_date, status)` — unique(unit_id, period)
- `payments(due_id, amount, paid_at, method, recorded_by)`
- `common_areas(building_id, name, description, capacity, open_time, close_time)`
- `reservations(area_id, user_id, starts_at, ends_at, status)` — çakışma için `btree_gist` exclusion constraint (confirmed olanlar)
- `notifications(user_id, type, title, body, data jsonb, read_at)`

Trigger'lar: ticket status değişince `ticket_events` + `notifications` kaydı; yeni duyuruda binadaki tüm sakinlere `notifications`; ödeme kaydedilince `dues.status='paid'`; `updated_at` otomatik.
Helper SQL fonksiyonları: `current_user_role()`, `current_building_id()`, `current_unit_id()` (security definer, RLS'de kullanılır).
RPC'ler: `update_ticket_status`, `assign_ticket`, `add_ticket_note`, `get_building_by_invite`, `join_building`. Güncel şema için tek kaynak `supabase/migrations/` ve `docs/database.md`.

## 4. Klasör yapısı

```
src/
  app/                      # expo-router
    _layout.tsx             # providers (QueryClient, i18n, Auth) + Stack.Protected auth gate
    sign-in.tsx, sign-up.tsx
    join-building.tsx       # davet kodu ile binaya katılma (demo: GUNES1)
    (tabs)/
      _layout.tsx           # NativeTabs, role'e göre görünür sekmeler
      (home)/_layout.tsx, index.tsx
      (tickets)/_layout.tsx, index.tsx, [id].tsx, new.tsx (formSheet)
      (announcements)/_layout.tsx, index.tsx, [id].tsx, new.tsx (manager, formSheet)
      (dues)/_layout.tsx, index.tsx                         # resident
      (manage)/_layout.tsx, index.tsx, dues.tsx, reports.tsx # manager
      (profile)/_layout.tsx, index.tsx, reservations.tsx, notifications.tsx
  components/               # paylaşılan UI: GlassCard, StatusBadge, EmptyState, SectionList yardımcıları
  features/<feature>/       # api.ts (react-query hook'ları), types.ts, components/
  lib/supabase.ts, lib/queryClient.ts, lib/auth.tsx
  i18n/index.ts, i18n/locales/{tr,en}/<namespace>.json
  theme/colors.ts           # özel palet (DynamicColorIOS / useColorScheme, hexColors)
  theme/tokens.ts           # spacing, radius, tipografi ölçeği
supabase/
  migrations/*.sql
  seed.sql
  functions/send-push/      # Edge Function (Aşama 5)
```

Sekmeler (NativeTabs, max 5):
- **resident:** Ana Sayfa · Taleplerim · Duyurular · Aidat · Profil
- **manager:** Ana Sayfa · Talepler · Duyurular · Yönetim · Profil
- **technician:** Ana Sayfa · Atanan İşler (tickets) · Duyurular · Profil

## 5. İş paketleri (alt ajanlara dağıtılır, her biri review edilir)

| WP | İçerik | Bağımlılık | Proje fazı |
|---|---|---|---|
| WP1 | Expo iskeleti, bağımlılıklar, tema, i18n altyapısı, NativeTabs + tüm placeholder ekranlar, lint/typecheck | — | Aşama 3 |
| WP2 | Supabase migration'ları, RLS, trigger'lar, storage bucket, seed (demo bina + 3 rol kullanıcısı), `src/lib/database.types.ts` | — (WP1 ile paralel) | Aşama 3 |
| WP3 | Supabase client, auth (giriş/çıkış, oturum), role-aware tabs, Profil ekranı, dil değiştirme | WP1, WP2 | Aşama 3 — **Zorunlu** |
| WP4 | Arıza bildirimi (foto ile), Taleplerim listesi + filtre, detay + durum timeline, yönetici atama/durum, teknisyen güncelleme | WP3 | Aşama 4 — **Zorunlu** |
| WP5 | Duyurular: liste (pinned üstte), detay, yönetici oluştur/düzenle/sil | WP3 | Aşama 4 — **Zorunlu** |
| WP6 | Aidat: sakin borç/ödeme geçmişi; yönetici dönem aidatı oluşturma, ödeme kaydetme | WP3 | İkinci aşama |
| WP7 | Bildirimler: notifications ekranı, realtime rozet, push token kaydı, Edge Function | WP4, WP5 | İkinci aşama |
| WP8 | Ana sayfa dashboard (özet + son duyurular), ortak alan rezervasyonu, yönetici raporları | WP4–WP6 | Ekstra |
| WP9 | QA: tüm akışlar, i18n eksikleri, dark mode, erişilebilirlik, README | hepsi | Aşama 6–7 |

WP4, WP5, WP6 paralel yürütülebilir: her ajan **yalnızca kendi** `src/app/(tabs)/(<feature>)/`, `src/features/<feature>/`, `src/i18n/locales/*/<feature>.json` dosyalarına dokunur. Paylaşılan dosyada değişiklik gerekiyorsa yapmaz, raporunda belirtir.

## 6. Ortak kurallar (her alt ajan için)

1. Kod/identifier İngilizce; kullanıcıya görünen **tüm** metinler i18n'den (`t('...')`), TR ve EN birlikte eklenir. Hardcoded metin yok.
2. Native-first kuralı (Bölüm 1). Yeni bir UI kütüphanesi eklemeden önce gerekçe sun.
3. Kurulum her zaman `npx expo install <pkg>` ile (SDK uyumlu sürüm).
4. API'yi tahmin etme: `expo-router/native-tabs`, `expo-glass-effect`, `@expo/ui` kurulu sürümün dokümanına (docs.expo.dev) ve `node_modules` içindeki tip tanımlarına bakılarak kullanılır.
5. Bitirmeden önce: `npx tsc --noEmit`, `npx eslint .`, `npx expo-doctor` temiz olmalı; ayrıca `npx expo export --platform ios --output-dir %TEMP%` bundle'ı hatasız almalı (çıktı repoya yazılmaz).
6. Gizli anahtar commit edilmez: `.env` (gitignore'da), `.env.example` repoda.
7. Commit atma — review'dan sonra ben (koordinatör) commit ederim.
8. Rapor: değişen dosyalar, alınan kararlar, kontrol komutlarının çıktısı, bilinen eksikler.

## 7. Test notu

Geliştirme Windows'ta; iOS Liquid Glass görünümü **iOS 26 cihazda** Expo Go (SDK destekliyorsa) veya EAS development build ile doğrulanır. Android emülatör/cihaz ile de test edilir.
