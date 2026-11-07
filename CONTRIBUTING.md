# Contributing

Thanks for your interest in FixMyBuilding! This is a university term project, but issues and pull requests are welcome.

## Workflow
1. Fork or branch from `master`: `feat/<short-name>`, `fix/<short-name>`, `docs/<short-name>`.
2. Make focused changes. Read [PLAN.md](PLAN.md) (binding plan) and [CLAUDE.md](CLAUDE.md) (conventions) first.
3. Use [Conventional Commits](https://www.conventionalcommits.org/): `feat: add ticket filter`, `fix: sheet detents on Android`, `docs: update README`.
4. Open a pull request using the template.

## Before opening a PR
```bash
npm run typecheck
npm run lint
npx expo-doctor
```
All three must pass.

## Rules
- All user-facing text goes through i18n (`t()`); add **both** Turkish and English strings.
- Native-first UI: use NativeTabs, native stack, formSheet, `expo-glass-effect`, `@expo/ui`. No JS imitations of native controls.
- Install packages with `npx expo install`.
- Database changes: add a new timestamped migration in `supabase/migrations/` (never edit applied ones) and update `src/lib/database.types.ts`.
- Never commit secrets. Only `EXPO_PUBLIC_*` values belong in `.env`, which is gitignored.
