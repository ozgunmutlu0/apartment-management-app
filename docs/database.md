# Database

Postgres on Supabase. Source of truth: [`supabase/migrations/`](../supabase/migrations) (applied in timestamp order). Setup and demo data: [`supabase/README.md`](../supabase/README.md) (Turkish).

## ER diagram

```mermaid
erDiagram
    BUILDINGS ||--o{ UNITS : has
    BUILDINGS ||--o{ PROFILES : "members"
    UNITS ||--o{ PROFILES : "lives in"
    BUILDINGS ||--o{ TICKETS : has
    UNITS ||--o{ TICKETS : "reported from"
    PROFILES ||--o{ TICKETS : "created_by"
    PROFILES ||--o{ TICKETS : "assigned_to"
    TICKETS ||--o{ TICKET_PHOTOS : has
    TICKETS ||--o{ TICKET_EVENTS : timeline
    PROFILES ||--o{ TICKET_EVENTS : actor
    BUILDINGS ||--o{ ANNOUNCEMENTS : has
    PROFILES ||--o{ ANNOUNCEMENTS : author
    UNITS ||--o{ DUES : owes
    DUES ||--o{ PAYMENTS : "paid by"
    BUILDINGS ||--o{ COMMON_AREAS : has
    COMMON_AREAS ||--o{ RESERVATIONS : booked
    PROFILES ||--o{ RESERVATIONS : makes
    PROFILES ||--o{ NOTIFICATIONS : receives
    PROFILES ||--o{ PUSH_TOKENS : "devices"

    BUILDINGS {
        uuid id PK
        text name
        text address
        text timezone
        text invite_code UK
    }
    UNITS {
        uuid id PK
        uuid building_id FK
        text block
        text number
        int floor
    }
    PROFILES {
        uuid id PK "= auth.users.id"
        text full_name
        text phone
        user_role role
        uuid building_id FK
        uuid unit_id FK
        text locale
    }
    PUSH_TOKENS {
        text token PK "Expo push token"
        uuid user_id FK
        text platform
    }
    TICKETS {
        uuid id PK
        uuid building_id FK
        uuid unit_id FK
        uuid created_by FK
        uuid assigned_to FK
        ticket_category category
        ticket_priority priority
        text title
        text description
        ticket_status status
        timestamptz resolved_at
    }
    TICKET_PHOTOS {
        uuid id PK
        uuid ticket_id FK
        text storage_path
    }
    TICKET_EVENTS {
        uuid id PK
        uuid ticket_id FK
        uuid actor_id FK
        text event_type
        ticket_status from_status
        ticket_status to_status
        uuid assignee_id FK
        text note
    }
    ANNOUNCEMENTS {
        uuid id PK
        uuid building_id FK
        uuid author_id FK
        text title
        text body
        text category
        bool pinned
    }
    DUES {
        uuid id PK
        uuid unit_id FK
        date period
        numeric amount
        date due_date
        due_status status
    }
    PAYMENTS {
        uuid id PK
        uuid due_id FK
        numeric amount
        timestamptz paid_at
        text method
        uuid recorded_by FK
    }
    COMMON_AREAS {
        uuid id PK
        uuid building_id FK
        text name
        int capacity
        time open_time
        time close_time
    }
    RESERVATIONS {
        uuid id PK
        uuid area_id FK
        uuid user_id FK
        timestamptz starts_at
        timestamptz ends_at
        reservation_status status
    }
    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        text type
        text title
        text body
        jsonb data
        timestamptz read_at
    }
```

All tables also have `created_at`; `profiles`, `tickets` and `announcements` have an auto-maintained `updated_at`.

## Enums

| Enum | Values |
|---|---|
| `user_role` | `resident`, `manager`, `technician` |
| `ticket_status` | `pending`, `in_review`, `in_progress`, `resolved` |
| `ticket_category` | `elevator`, `plumbing`, `electrical`, `cleaning`, `common_area`, `heating`, `other` |
| `ticket_priority` | `low`, `normal`, `high`, `urgent` |
| `due_status` | `unpaid`, `paid`, `overdue` |
| `reservation_status` | `confirmed`, `cancelled` |

Text columns with check constraints: `ticket_events.event_type` (`created`, `status`, `assignment`, `note`), `announcements.category` (`general`, `maintenance`, `event`, `urgent`, `payment`), `payments.method` (`cash`, `bank_transfer`, `card`, `other`), `profiles.locale` (`tr`, `en`).

Notable constraints: `units` unique `(building_id, block, number)`; `dues` unique `(unit_id, period)` with `period` = first of month; `reservations` exclusion constraint (`btree_gist`) prevents overlapping `confirmed` bookings per area.

## Tables

| Table | Purpose |
|---|---|
| `buildings` | A building; `invite_code` (6 chars, demo `GUNES1`) lets residents join |
| `units` | Apartments of a building |
| `profiles` | One row per auth user (created by signup trigger); role, building, unit, locale |
| `tickets` | Fault reports / requests with status lifecycle |
| `ticket_photos` | Storage paths of ticket photos |
| `ticket_events` | Timeline: created, status change, assignment, note (trigger-written, plus client notes) |
| `announcements` | Building announcements, optionally pinned |
| `dues` / `payments` | Monthly dues per unit and recorded payments |
| `common_areas` / `reservations` | Shared spaces and bookings |
| `notifications` | In-app notifications (also source for push) |
| `push_tokens` | Expo push tokens, one row per device; owner-only (not visible to other building members) |

## RLS matrix

RLS is enabled on every table; all policies target `authenticated`. Scope is always the user's own building (via `current_building_id()`).

| Table | resident | technician | manager |
|---|---|---|---|
| `buildings` / `units` | read own building | read own building | read; update building; write units |
| `profiles` | read own building; update own (not role/building/unit) | same | read building; update role/unit within building |
| `tickets` | read own + own unit's; insert as `pending` | read only assigned; update status only (never back to `pending`) | full within building |
| `ticket_photos` | read/add for visible tickets | same | same |
| `ticket_events` | read for visible tickets | read; add `note` on assigned tickets | read; add `note` |
| `announcements` | read | read | create, update, delete |
| `dues` / `payments` | read own unit | none | full within building |
| `common_areas` | read | read | full |
| `reservations` | read confirmed; manage own | same | read and manage all |
| `notifications` | read/update/delete own | same | same |
| `push_tokens` | read/insert/update/delete own only | same | same |

Storage bucket `ticket-photos` is private; policies derive the ticket from the first path segment and reuse ticket visibility.

## Triggers

| Trigger | Effect |
|---|---|
| `on_auth_user_created` (`handle_new_user`) | Creates the `profiles` row; everyone starts as `resident` |
| `set_updated_at` (profiles, tickets, announcements) | Maintains `updated_at` |
| `profiles_guard` | Blocks self-escalation of role/building/unit (except via `join_building`) |
| `tickets_guard` | Role-specific column limits, assignee must be a technician of the same building, sets `resolved_at` |
| `tickets_after_insert` | Writes `created` event; notifies building managers |
| `tickets_after_update` | Writes `status` / `assignment` events; notifies creator or assignee |
| `announcements_after_insert` | Notifies all other building members |
| `payments_after_change` | Recomputes `dues.status` (`paid` when settled) |
| `reservations_validate` | Validates opening hours and rules |

## RPCs and helpers

| Function | Caller | Purpose |
|---|---|---|
| `update_ticket_status(p_ticket_id, p_status, p_note)` | manager, technician | Change status with optional note |
| `assign_ticket(p_ticket_id, p_technician_id, p_note)` | manager | Assign/unassign (`null`) a technician |
| `add_ticket_note(p_ticket_id, p_note)` | manager, technician | Add a timeline note |
| `get_building_by_invite(p_code)` | authenticated | Building + units for an invite code, or `null` |
| `join_building(p_code, p_unit_id)` | resident without building | Join a building and unit |
| `mark_overdue_dues()` | service role / cron | Mark past-due unpaid dues as `overdue` |
| `register_push_token(p_token, p_platform)` | authenticated | Register this device token for the caller; removes it from any other user (one device = one account) |
| `unregister_push_token(p_token)` | authenticated | Remove the caller's own row for this token (call before sign-out) |
| `current_user_role()`, `current_building_id()`, `current_unit_id()` | RLS helpers | `security definer` lookups |

Never insert into `ticket_events` (except notes through the RPC) or `notifications` from the client.

## Changing the schema

Add a new timestamped file in `supabase/migrations/` and regenerate or update `src/lib/database.types.ts`. Do not edit applied migrations.
