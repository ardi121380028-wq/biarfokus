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
│       ├── 20261018000000_mvp6_scale_and_reliability.sql      # Task migration RPC, daily focus RPC, indexes
│       ├── 20261018223000_add_notes_and_calendar_events.sql   # keep_notes, keep_labels, calendar_events + RLS
│       ├── 20261018233000_add_linked_item_text_and_site_visits.sql # Sub-task linking & site_visits analytics table
│       ├── 20261019090000_add_linked_note_to_tasks.sql        # Eat Your Frog linked note & checklist item columns
│       └── 20261019100000_add_kanban_boards.sql               # Project Canban boards table + RLS
└── src/
    ├── proxy.ts                # Next.js 16 request proxy refreshing Supabase auth cookies
    ├── types/
    │   └── domain.ts           # Shared domain types (Timer, Task, Stats, Profile, Admin, Billing, Notes, Calendar, Kanban)
    ├── lib/
    │   ├── api/
    │   │   ├── request-guard.ts      # Rate limiting, correlation IDs, structured API logs
    │   │   └── request-guard.test.ts # Unit tests for request guard
    │   ├── supabase/
    │   │   ├── client.ts       # Browser Supabase client + isSupabaseConfigured flag
    │   │   └── server.ts       # Server Supabase client using next/headers cookies
    │   └── tracking/
    │       └── visitor-tracker.ts    # Client-side anonymous visit logging
    ├── features/
    │   ├── admin/
    │   │   ├── admin-service.ts      # Role lookup, overview response validation, traffic stats
    │   │   └── admin-service.test.ts # Unit tests for admin service
    │   ├── audio/
    │   │   └── ambient-sound.ts      # Web Audio procedural ambient sounds (rain, ocean waves, brown noise)
    │   ├── billing/
    │   │   ├── billing-service.ts      # Plan constants, subscription state, Stripe signature verify, REST helper
    │   │   └── billing-service.test.ts # Unit tests for billing service
    │   ├── calendar/
    │   │   ├── calendar-service.ts      # Day/Week/Month/Year calculations, drag-and-drop & resize logic
    │   │   └── calendar-service.test.ts # Unit tests for calendar service
    │   ├── kanban/
    │   │   ├── kanban-service.ts      # Pure domain operations, board templates, wallpapers, search & drag-and-drop
    │   │   ├── kanban-service.test.ts # Unit tests for kanban operations (81 passing tests total)
    │   │   ├── kanban-cloud.ts        # Supabase persistence with schema check & fallback
    │   │   └── use-kanban.ts          # Cross-tab reactive store and auto-cloud synchronization
    │   ├── notes/
    │   │   ├── note-service.ts          # Google Keep style notes CRUD, checklist & pin logic
    │   │   └── note-service.test.ts     # Unit tests for note service
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
        │   ├── account/
        │   │   └── delete/route.ts       # Secure user account and data deletion endpoint
        │   ├── admin/
        │   │   ├── overview/route.ts     # Server-verified admin overview, traffic analytics & audit logs
        │   │   └── users/route.ts        # Admin user listing & manual Pro/Free plan toggling
        │   ├── billing/
        │   │   ├── checkout/route.ts     # Stripe Checkout Session creation (Pro subscription)
        │   │   ├── portal/route.ts       # Stripe Customer Portal session creation
        │   │   └── webhook/route.ts      # Verified Stripe webhook handler updating subscriptions
        │   └── track/
        │       └── visit/route.ts        # Anonymous visitor tracking with IP hashing & rate limits
        ├── auth/callback/route.ts  # OAuth code exchange route handler
        ├── components/
        │   ├── about-modal.tsx     # Founder story & mission popup modal
        │   ├── account-modal.tsx   # Profile editor (display name, avatar preview, email, sign-out)
        │   ├── admin-view.tsx      # Admin dashboard (traffic metrics + user management + audit logs)
        │   ├── auth-modal.tsx      # Login / register / Google OAuth modal
        │   ├── calendar/           # Calendar sub-views (Day, Week, Month, Year, Event Modal)
        │   ├── calendar-view.tsx   # Google Calendar view with drag-and-drop & resize time-blocking
        │   ├── kanban/             # Trello-style Kanban components (Canvas, Columns, Cards, Dialog, Modal)
        │   ├── notes/              # Notes sub-components (Card, Edit Modal, Checklist items)
        │   ├── notes-modal.tsx     # Google Keep-style Notes drawer/modal
        │   ├── pomodoro-modal.tsx  # Interactive educational Pomodoro technique & science modal
        │   ├── pricing-view.tsx    # Free vs Pro plan status, upgrade & billing portal actions
        │   ├── profile-menu.tsx    # Header user dropdown (Account, Paket & Billing, Admin, Sign out)
        │   ├── settings-modal.tsx  # Custom timer duration modal
        │   ├── shortcuts-modal.tsx # Keyboard shortcuts cheat sheet
        │   ├── stats-view.tsx      # Focus statistics (range selector, streak card, bar chart, CSV export)
        │   ├── task-management.tsx # Eat Your Frog task list, add form, active focus task selection
        │   └── timer-panel.tsx     # Timer display, active focus banner, aux controls, ambient sound
        ├── globals.css             # Theme tokens, dark/light pastel card contrast, responsive styles
        ├── icon.svg                # Brand SVG favicon
        ├── layout.tsx              # Root layout (Indonesian locale, PWA metadata, OpenGraph & Twitter tags)
        ├── manifest.ts             # PWA Web App Manifest (standalone install on Android/iOS/Desktop)
        ├── opengraph-image.tsx     # Dynamic 1200x630 branded social share image (Next.js ImageResponse)
        └── page.tsx                # Main application coordinator (Timer, Tasks, Notes, Calendar, Stats, Pricing, Admin)
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
   - `linked_note_id text`, `linked_note_title text`, `linked_item_id text`, `linked_item_text text` (links Eat Your Frog tasks to Google Keep notes and specific checklist items)
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
7. **`public.keep_notes` & `public.keep_labels`**
   - `keep_notes`: `id text primary key`, `user_id uuid not null references auth.users(id) on delete cascade`, `title text`, `type text check (type in ('checklist', 'text'))`, `content text`, `items jsonb default '[]'::jsonb`, `color text`, `labels text[]`, `pinned boolean default false`, `created_at timestamptz`, `updated_at timestamptz`.
   - `keep_labels`: `id uuid primary key default gen_random_uuid()`, `user_id uuid references auth.users(id) on delete cascade`, `name text not null`, unique on `(user_id, name)`.
8. **`public.calendar_events`**
   - `id text primary key`, `user_id uuid not null references auth.users(id) on delete cascade`, `title text not null`, `date date not null`, `start_time text (HH:mm)`, `end_time text (HH:mm)`, `color text`, `category text check (category in ('event', 'task'))`, `description text`, `linked_note_id text`, `linked_note_title text`, `linked_item_id text`, `linked_item_text text`, `created_at timestamptz`, `updated_at timestamptz`.
9. **`public.site_visits`**
   - `id uuid primary key default gen_random_uuid()`, `visitor_id text not null`, `path text not null default '/'`, `referrer text`, `user_agent text`, `user_id uuid references auth.users(id) on delete set null`, `created_at timestamptz not null default now()`.
   - Insert policy open to all (anonymous visitor logging); select policy strictly gated to administrators via `public.user_roles`.

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
  - Web Audio Ambient Sound: Procedural offline synthesizer for background focus audio (Rain, Waves, Brown noise) with zero external audio assets.
  - Installable PWA: Web App Manifest (`manifest.webmanifest`) and viewport/apple-web-app metadata for home screen installation on Android and iOS.
- **MVP8 — Admin User Controls, Account Deletion & Social Share (Completed):**
  - Admin User Management: `/api/admin/users` endpoint + `AdminView` user cards list with live status and manual "Jadikan Pro" / "Turunkan ke Free" toggles audited in `admin_audit_logs`.
  - Secure Account Deletion: `/api/account/delete` endpoint cascading profile and domain data deletion + confirmation modal in `page.tsx`.
  - SEO & Dynamic Social Share Preview: Automated 1200x630 OpenGraph image (`/opengraph-image`) with branding, metadata base, Twitter card tags, and official Instagram link (`https://www.instagram.com/biarfokus.id/`) in the footer.
- **MVP9 — Notes, Calendar Time-Blocking & Experience Polish (Completed):**
  - **Google Keep-Style Notes (`NotesModal`):** Dynamic multi-color cards (12 pastel shades with automatic dark-mode contrast), pinned notes, custom labels/tags, checklist items with inline completion, and dual-layer sync (Supabase RLS + guest `localStorage`).
  - **Google Calendar Time-Blocking (`CalendarView`):** Day, Week, Month, and Year calendar views with native drag-and-drop between hour slots, top/bottom resize drag handles for intuitive duration adjustment, event categorization, and sub-task / checklist deep linking (`☑️ [Sub-task] (Catatan)`).
  - **Eat Your Frog Task Philosophy:** Rebranded task management to "Eat Your Frog" prioritizing high-value cognitive tasks and clean visual focus indicators.
  - **Site Traffic & Visitor Analytics:** Privacy-preserving visitor tracking (`/api/track/visit` + `visitor-tracker.ts`), daily visit counter, 24-hour visit volume, and 7-day visit trend table in the Admin dashboard.
  - **Brand Mission & Educational Modals:** `AboutModal` (founder story on ADHD/focus journey and vision behind BiarFokus) and `PomodoroModal` (Cirillo 4-step framework, time rules, and scientific benefits).
  - **Dark Mode & Contrast Polish:** Fixed dark mode pastel note text contrast using theme ink variables, cleaned redundant footer links, and resolved profile popup z-index stacking layers.
- **MVP10 — Revenue Strategy & Monetization Architecture (In Planning):**
  - Multi-stream revenue model: B2C Pro Subscriptions (Midtrans/Xendit/Stripe), Founder's Lifetime Deal (LTD), digital focus add-ons (binaural sound packs, productivity templates), and B2B Team Focus / Study Squad rooms.
- **MVP11 — Eat Your Frog & Catatan Two-Way Integration (Completed):**
  - **Import Task dari Catatan (`NoteTaskPickerModal`):** Pengguna dapat mengambil task langsung dari catatan Google Keep atau checklist sub-task tertentu ke dalam daftar fokus Eat Your Frog.
  - **Direct Note-to-Frog Action:** Tombol `🐸 Frog` di setiap baris checklist catatan untuk langsung menjadikannya target fokus Eat Your Frog tanpa perlu berpindah layar.
  - **Live Bidirectional Synchronization:** Menyelesaikan task di Eat Your Frog otomatis menandai centang `[✓]` di checklist catatan secara real-time via `setItemDone` dan reactive store events, dan mencentang di catatan otomatis menyinkronkan status task di Eat Your Frog. Dilengkapi filter `source: "eat-your-frog"` untuk mencegah recursive event echo loops.
  - **Client-Side Task Link Resilience:** Penyimpanan mapping link task (`LOCAL_TASK_LINKS_KEY = "biarfokus.task_links"`) yang otomatis di-rehidrasi saat fallback schema Supabase terjadi, ditambah fallback pencocokan teks pintar untuk task lama.
  - **Visual Origin Badge:** Task yang terhubung menampilkan badge link `📝 [Judul Catatan]` yang dapat diklik langsung untuk membuka catatan sumber.
  - **Database Migration:** Migration `20261019090000_add_linked_note_to_tasks.sql` dengan RLS dan fallback graceful saat offline/guest.
- **MVP12 — Project Canban (Trello-Style Architecture) (Completed):**
  - **Top Bar & Mobile Navigation:** Menu utama berlabel tepat `"Project Canban"` yang mudah diakses dari header desktop maupun mobile navigation drawer.
  - **Scalable Architecture & Clean Domain Separation:** Dibangun dengan arsitektur jangka panjang (`KanbanBoard`, `KanbanList`, `KanbanCard`, `KanbanLabel`, `KanbanChecklist`, `KanbanComment`), pure domain operations di `kanban-service.ts`, dan reactive store syncing (`useKanban`) dengan `useSyncExternalStore`.
  - **Dual-Layer Persistence:** Sinkronisasi otomatis ke Supabase database (`kanban_boards` table dengan Row-Level Security) jika user login, dan fallback tanpa batas ke `localStorage` (`biarfokus.kanban_boards`) untuk guest mode atau offline, dilengkapi graceful schema fallback jika database remote belum dimigrasi.
  - **Full Trello Feature Parity (Ref: 4 User Screenshots):**
    - **Horizontal Board Canvas:** Layout kolom horizontal fleksibel dengan auto-scroll halus dan composer inline "+ Add another list".
    - **Native Drag & Drop:** Pindah kartu antar list/kolom secara responsif dengan update posisi instan dan penyesuaian urutan indeks.
    - **Inline Card Composer:** Form penambahan kartu instan di setiap kolom dengan tombol "+ Add card", cancel `✕`, dan generator template kartu `💡 Tip`.
    - **Rich Card Detail Modal (`KanbanCardDialog`):** Modal komprehensif menampilkan breadcrumb list asal, label warna (6 palette preset), tanggal jatuh tempo (due date), deskripsi multiline dengan preview, multi-checklist dengan dynamic percentage progress bar, timeline komentar/aktivitas, serta action sidebar.
    - **Board Switcher & Workspace Modal (`KanbanBoardModal`):** Pemilihan board aktif, template instan (Growth Marketing, Sprint Scrum, Bug Tracking, Personal Board), dan pembuat board baru dengan pratinjau wallpaper.
    - **Theming & Wallpaper Support:** Koleksi background gradient dinamis (Ocean Wave, Sunset Ember, Northern Aurora, Midnight Deep) dan warna solid Trello dengan kontras teks otomatis.
    - **Deep Ecosystem Bridge (`🐸 Eat Your Frog`):** Tombol integrasi langsung di setiap kartu kanban dan dialog detail untuk mengirimkan card kanban langsung menjadi target fokus Pomodoro aktif di Eat Your Frog.
    - **Test Coverage:** Suite unit test `kanban-service.test.ts` (9 test cases) terverifikasi lulus bersama total 81 test suite di seluruh project.

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
