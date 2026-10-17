# Project Context — BiarFokus

This file serves as a single-source handoff for any developer or AI assistant continuing work on the project.

---

## 1. Product Overview

**BiarFokus** is a web-based Pomodoro productivity application localized in Indonesian. It allows users to run focus and break timers, manage a task list with per-task Pomodoro estimates, customize timer durations, view focus statistics, and sync everything to a cloud account (Google or email/password via Supabase) while remaining fully usable offline via `localStorage` when signed out.

---

## 2. Tech Stack

- **Framework:** Next.js `16.4.2` (App Router, `cacheComponents: true` in `next.config.ts`)
- **UI Library:** React `19.3.0` + React DOM `19.3.0`
- **Language:** TypeScript `^5` (`strict: true`)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/turbopack` + custom theme variables and component classes in `src/app/globals.css`)
- **Backend / Auth / Database:** Supabase (`@supabase/supabase-js` `^2.118.0`, `@supabase/ssr` `^0.12.7`)
- **Linting:** ESLint 9 (`eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`)

---

## 3. Repository Structure

```text
.
├── AGENTS.md                   # Next.js 16 agent rules (auto-maintained by next dev)
├── PROJECT_CONTEXT.md          # This handoff document
├── next.config.ts              # Next.js config (cacheComponents: true)
├── package.json                # Scripts: dev, build, start, lint, typecheck, test
├── tsconfig.json               # Strict TS config with @/* -> ./src/* alias
├── supabase/
│   └── migrations/
│       ├── 20261016183000_initial_product_schema.sql          # Core tables + RLS
│       ├── 20261016220000_add_profile_settings.sql            # Timer settings columns on profiles
│       ├── 20261017140000_add_admin_roles_and_audit_logs.sql  # Roles, audit logs, is_admin()
│       ├── 20261017143000_add_subscriptions.sql               # Subscriptions, is_pro_user(), free-tier task limit trigger
│       └── 20261018000000_mvp6_scale_and_reliability.sql      # Task migration RPC, daily focus RPC, indexes
└── src/
    ├── proxy.ts                # Next.js 16 request proxy refreshing Supabase auth cookies
    ├── types/
    │   └── domain.ts           # Shared domain types (Timer, Task, Stats, Profile, Admin, Billing)
    ├── lib/
    │   ├── api/
    │   │   ├── request-guard.ts      # Rate limiting, correlation IDs, structured API logs
    │   │   └── request-guard.test.ts # Unit tests for request guard
    │   └── supabase/
    │       ├── client.ts       # Browser Supabase client + isSupabaseConfigured flag
    │       └── server.ts       # Server Supabase client using next/headers cookies
    ├── features/
    │   ├── admin/
    │   │   ├── admin-service.ts      # Role lookup, overview response validation, fetch client
    │   │   └── admin-service.test.ts # Unit tests for admin service
    │   ├── audio/
    │   │   └── ambient-sound.ts      # Web Audio procedural ambient sounds (rain, ocean waves, brown noise)
    │   ├── billing/
    │   │   ├── billing-service.ts      # Plan constants, subscription state, Stripe signature verify, REST helper
    │   │   └── billing-service.test.ts # Unit tests for billing service
    │   ├── profile/
    │   │   ├── profile-service.ts      # Profile load/upsert, display name, safe avatar URL validation
    │   │   └── profile-service.test.ts # Unit tests for profile service
    │   ├── settings/
    │   │   ├── settings-service.ts      # Timer settings validation, localStorage + Supabase sync
    │   │   └── settings-service.test.ts # Unit tests for settings service
    │   ├── stats/
    │   │   ├── stats-service.ts      # Calendar helpers, range summary, streaks, CSV export, get_daily_focus RPC
    │   │   └── stats-service.test.ts # Unit tests for stats service
    │   ├── tasks/
    │   │   ├── task-service.ts      # Task CRUD, localStorage fallback, idempotent migrate_local_tasks RPC
    │   │   └── task-service.test.ts # Unit tests for task service
    │   └── timer/
    │       ├── timer-utils.ts       # Pure timer math & formatting helpers, Pomodoro cycle transitions
    │       └── timer-utils.test.ts  # Unit tests for timer helpers
    └── app/
        ├── api/
        │   ├── admin/overview/route.ts   # Server-verified admin overview & audit log API
        │   └── billing/
        │       ├── checkout/route.ts     # Stripe Checkout Session creation (Pro subscription)
        │       ├── portal/route.ts       # Stripe Customer Portal session creation
        │       └── webhook/route.ts      # Verified Stripe webhook handler updating subscriptions
        ├── auth/callback/route.ts  # OAuth code exchange route handler
        ├── components/
        │   ├── account-modal.tsx   # Profile editor (display name, avatar preview, email, sign-out)
        │   ├── admin-view.tsx      # Admin dashboard (metrics + audit log table)
        │   ├── auth-modal.tsx      # Login / register / Google OAuth modal
        │   ├── pricing-view.tsx    # Free vs Pro plan status, upgrade & billing portal actions
        │   ├── profile-menu.tsx    # Header user dropdown (Account, Paket & Billing, Admin, Sign out)
        │   ├── settings-modal.tsx  # Custom timer duration modal
        │   ├── stats-view.tsx      # Focus statistics (range selector, streak card, bar chart, CSV export)
        │   ├── task-management.tsx # Task list, add form, active focused task selection, bulk delete
        │   └── timer-panel.tsx     # Timer display, cycle dots, active focus banner, aux controls, ambient sound
        ├── globals.css             # Theme tokens and UI styles
        ├── icon.svg                # Brand SVG favicon
        ├── layout.tsx              # Root layout (Indonesian locale, PWA metadata, Plus Jakarta Sans + JetBrains Mono)
        ├── manifest.ts             # PWA Web App Manifest (standalone install on Android/iOS/Desktop)
        └── page.tsx                # Main application coordinator (Timer, Tasks, Stats, Pricing, Admin)
```

---

## 4. Database Schema (Supabase)

Defined in `supabase/migrations/`:

1. **`public.profiles`**
   - `id uuid primary key references auth.users(id) on delete cascade`
   - `username text unique`, `display_name text`, `avatar_url text`
   - `pomodoro_minutes int`, `short_break_minutes int`, `long_break_minutes int` (constrained to `1..180`)
   - `tasks_migrated_at timestamptz`, `created_at timestamptz`, `updated_at timestamptz`
   - Trigger `on_auth_user_created` (`public.handle_new_user()`) automatically provisions `profiles`, `user_roles`, and `subscriptions` when a user signs up in `auth.users`.
2. **`public.tasks`**
   - `id uuid primary key default gen_random_uuid()`
   - `user_id uuid not null references auth.users(id) on delete cascade`
   - `title text not null`, `completed boolean not null default false`, `pomodoros int not null default 1`
   - Trigger `tasks_enforce_plan_limit` (`public.enforce_task_plan_limit()`) enforces the Free plan limit of 10 active (incomplete) tasks on insert.
   - RPC `public.migrate_local_tasks(p_tasks jsonb)` atomically migrates guest `localStorage` tasks at most once per user using `pg_advisory_xact_lock` and `profiles.tasks_migrated_at`.
3. **`public.pomodoro_sessions`**
   - `id uuid primary key default gen_random_uuid()`
   - `user_id uuid not null references auth.users(id) on delete cascade`
   - `task_id uuid references public.tasks(id) on delete set null`
   - `mode text not null check (mode in ('pomodoro', 'short', 'long'))`
   - `duration_seconds int not null check (duration_seconds between 1 and 86400)`
   - `completed_at timestamptz not null default now()`
   - RPC `public.get_daily_focus(p_days int, p_timezone text)` aggregates completed focus sessions per local calendar day in the database.
4. **`public.user_roles`**
   - `user_id uuid primary key references auth.users(id) on delete cascade`
   - `role text not null default 'user' check (role in ('user', 'admin'))`
   - Helper `public.is_admin()` (`security definer`) checks whether `auth.uid()` has role `'admin'`.
5. **`public.admin_audit_logs`**
   - `id uuid primary key default gen_random_uuid()`
   - `actor_user_id uuid not null references auth.users(id) on delete cascade`
   - `action text not null`, `target_type text not null`, `target_id text`, `metadata jsonb not null default '{}'::jsonb`, `created_at timestamptz not null default now()`
6. **`public.subscriptions`**
   - `user_id uuid primary key references auth.users(id) on delete cascade`
   - `plan text not null default 'free' check (plan in ('free', 'pro'))`
   - `status text not null default 'inactive' check (status in ('inactive', 'trialing', 'active', 'past_due', 'canceled'))`
   - `stripe_customer_id text unique`, `stripe_subscription_id text unique`, `current_period_end timestamptz`, `cancel_at_period_end boolean not null default false`
   - Helper `public.is_pro_user()` (`security definer`) returns `true` when `auth.uid()` has a `pro` subscription with status `active` or `trialing` (and non-expired `current_period_end`) or is an admin.

All tables have Row Level Security (RLS) enabled.

---

## 5. Roadmap & Milestone Status

- **MVP1 — Foundation (Completed):** Timer modes, custom durations, tasks CRUD, basic stats, Supabase schema + RLS, Google & email/password auth, proxy session refresh, unit tests.
- **MVP2 — Core Features (Completed):** Real-time wall-clock timer engine, Web Audio completion chime, feature-sliced architecture (`src/features/*`, `src/types/domain.ts`), and expanded test suite.
- **MVP3 — User Experience (Completed):** Account profile management modal (`AccountModal`), profile dropdown menu (`ProfileMenu`), `public.profiles` sync (`profile-service.ts`), accessible error alerts, and responsive layout refinements.
- **MVP4 — Authorization & Admin (Completed):** Role-based access control (`public.user_roles`, `public.is_admin()`), audit logging (`public.admin_audit_logs`), server-enforced `/api/admin/overview` endpoint, and Admin dashboard (`AdminView`) gated in `ProfileMenu` and `page.tsx`.
- **MVP5 — Monetization (Completed):** Free (max 10 active tasks) vs Pro (unlimited active tasks) tiers, `public.subscriptions` table + `public.is_pro_user()` + database-level trigger `enforce_task_plan_limit()`, Stripe Checkout (`/api/billing/checkout`), Customer Portal (`/api/billing/portal`), verified Stripe webhook handler (`/api/billing/webhook`) using `SUPABASE_SERVICE_ROLE_KEY`, and `PricingView` UI.
- **MVP6 — Scale & Reliability (Completed):**
  - Complete Statistics: Focus streaks (`current` and `longest`), range selector (`Minggu ini`, `7 hari`, `30 hari`), timezone-aware database aggregation (`public.get_daily_focus`), and CSV export (`Export CSV`).
  - Idempotent Local-to-Cloud Task Migration: `profiles.tasks_migrated_at` + `public.migrate_local_tasks` RPC using `pg_advisory_xact_lock` so concurrent tabs never duplicate tasks and deleting all cloud tasks never resurrects `localStorage` tasks.
  - API Hardening & Observability: Sliding-window rate limiting (`429 Too Many Requests` + `Retry-After`), `x-correlation-id` propagation, and structured JSON request/error logging (`src/lib/api/request-guard.ts`) across all `/api/*` routes.
  - Database Performance Indexes: Targeted composite/partial indexes on `tasks`, `pomodoro_sessions`, `admin_audit_logs`, and `subscriptions`.
  - Zero Lint Warnings: Avatar rendering migrated to `next/image` (`unoptimized`) guarded by `getSafeAvatarUrl`.
- **MVP7 — Product Experience & Pro Features (Completed):**
  - Active Task Tracking: Link sessions directly to `pomodoro_sessions.task_id`, select active focus task in `TaskManagement`, display active task banner in `TimerPanel`, and auto-increment task pomodoro count upon completion.
  - Smart Pomodoro Cycle: Automatic transition to Long Break every 4 pomodoros with visual cycle indicator dots (`Siklus #N · 2/4`) plus direct `Reset (↺)` and `Skip (⏭)` touch/click controls.
  - Web Audio Ambient Sound: Procedural offline synthesizer for background focus audio (Rain, Waves, Brown noise) with zero external audio assets.
  - Installable PWA: Web App Manifest (`manifest.webmanifest`) and viewport/apple-web-app metadata for home screen installation on Android and iOS.

---

## 6. Environment Variables

Required in `.env.local` for full functionality:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>

# Optional — required only to enable live Stripe checkout, portal, and webhooks (MVP5):
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
STRIPE_SECRET_KEY=sk_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

When these variables are absent, `isSupabaseConfigured` in `src/lib/supabase/client.ts` evaluates to `false` and the app runs cleanly in local-only mode without crashing during build or prerender. When Stripe variables are absent, the app remains fully functional on the Free tier and displays a clear notice if upgrade is clicked.

---

## 7. Validation Commands

Always run all four checks before concluding a task:

```bash
npm test          # Runs Node native test runner across timer, task, stats, settings, profile, admin, billing, and API guard suites
npm run typecheck # Runs tsc --noEmit
npm run lint      # Runs ESLint
npm run build     # Runs production Next.js build (verifies prerendering under cacheComponents: true)
```
