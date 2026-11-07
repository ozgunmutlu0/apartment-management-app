# CLAUDE.md

FixMyBuilding: apartment management app (residents, managers, technicians) - tickets with photos, announcements, dues, notifications, reservations. University term project. Public repo: ozgunmutlu0/apartment-management-app (branch `master`). `PLAN.md` (Turkish) is the binding plan; read it before starting a work package (WP).

## Stack
Expo SDK 58 (`expo ~58.0.23`), React Native 0.88.1, React 19.3.0, TypeScript ~6.0 strict, expo-router ~58.0.30, `@expo/ui ~58.0.27`, `expo-glass-effect ~58.0.5`, `expo-symbols`, `@supabase/supabase-js ^2.119`, `@tanstack/react-query ^5.107`, `i18next ^27` + `react-i18next ^18`, expo-secure-store, expo-notifications, expo-image(-picker).

## Commands
- `npx expo start` (`npm run ios|android|web`)
- `npm run typecheck` (`tsc --noEmit`), `npm run lint` (`expo lint`), `npx expo-doctor`, `npm run format`
- Bundle check: `npx expo export --platform ios --output-dir "$TEMP/fmb-export"` (never write output into the repo)

## Architecture
- `src/app/` expo-router. `_layout.tsx` = providers (QueryClient, i18n, Auth) + `Stack.Protected` auth gate; `sign-in`, `sign-up`, join-building screen.
- `src/app/(tabs)/_layout.tsx` = `NativeTabs`; role decides visible triggers (`hidden`). Groups: `(home) (tickets) (announcements) (dues) (manage) (profile)`, each with its own native `Stack` `_layout.tsx`.
  - resident: Home, Tickets, Announcements, Dues, Profile. manager: Home, Tickets, Announcements, Manage, Profile. technician: Home, Tickets (assigned), Announcements, Profile.
- `src/features/<feature>/` = `api.ts` (react-query hooks), `types.ts`, `components/`. Screens stay thin and call these hooks.
- `src/components/` shared UI (GlassCard, EmptyState, ...). `src/lib/` supabase client, auth context, queryClient, `database.types.ts`.
- `src/i18n/` namespaces per feature in `locales/{tr,en}/<ns>.json`; TR is default, EN second.
- `src/theme/colors.ts` wraps `PlatformColor` (iOS system colors, Android palette); dark mode required.

## Native-first rule (PLAN.md section 1)
Anything with a native equivalent is never imitated in JS: tab bar (NativeTabs), header (native stack, large titles, `headerSearchBarOptions`), sheets (`presentation: 'formSheet'`), glass surfaces (`expo-glass-effect` `GlassView`/`GlassContainer`, `isLiquidGlassAvailable()` with `PlatformColor` card fallback), segmented control / date picker / switch / context menu / alert / action sheet (`@expo/ui`, else RN core). No JS modal or bottom-sheet libraries. Justify before adding any UI library.

## Verified SDK 58 API notes
- `import { NativeTabs } from 'expo-router/native-tabs'` (NOT `unstable-native-tabs`). Hide per role with `<NativeTabs.Trigger name=".." hidden={...}>`.
- Use `headerLargeTitleEnabled` (`headerLargeTitle` is deprecated). iOS 26 headers are transparent by default.
- Sheets: `presentation: 'formSheet'` + `sheetAllowedDetents`.
- `@expo/ui/swift-ui` components must be wrapped in `<Host>`; `@expo/ui/community/*` has drop-in replacements for community packages.
- Icons: `SymbolView name={{ ios: 'house', android: 'home' }}`; tabs use `NativeTabs.Trigger.Icon sf=".." md=".."`.
- supabase-js needs no URL polyfill. Always check `node_modules` types / docs.expo.dev instead of guessing APIs.

## Backend rules (Supabase, see `supabase/README.md`, `docs/database.md`)
- RLS enforces roles; UI only hides. Never rely on client checks.
- Ticket status: `rpc('update_ticket_status', {p_ticket_id, p_status, p_note})`; assign: `rpc('assign_ticket')`; notes: `rpc('add_ticket_note')`. Residents only insert `pending` tickets.
- `ticket_events` and `notifications` are written by triggers - never insert from the client.
- Photos: private bucket `ticket-photos`, path `<ticket_id>/<filename>`, then insert a `ticket_photos` row; read with `createSignedUrl`.
- Joining a building: `get_building_by_invite` / `join_building` RPCs (demo code `GUNES1`).
- New schema change = new timestamped file in `supabase/migrations/`; never edit applied migrations. Keep `src/lib/database.types.ts` in sync.

## Conventions
- Code/identifiers in English; every user-facing string via `t()` with TR and EN added together. No hardcoded text.
- Install with `npx expo install <pkg>`.
- Public repo: no secrets. Only `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env` (gitignored; `.env.example` is tracked). Service role key never in the app.
- Conventional commits (`feat:`, `fix:`, `docs:`...). Do not commit unless asked. Never add `Co-Authored-By` or any AI attribution lines to commits/PRs.

## Workflow
Follow PLAN.md work packages; stay inside your WP's files (`src/app/(tabs)/(<feature>)/`, `src/features/<feature>/`, `src/i18n/locales/*/<feature>.json`). Before finishing: typecheck, lint, expo-doctor and the iOS export check must all pass. Report changed files, decisions and known gaps.
