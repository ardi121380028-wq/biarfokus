# Project Context BiarFokus (A–Z Comprehensive Architecture & System Reference)

Dokumen ini adalah ringkasan konteks arsitektur dan sistem lengkap (**A–Z**) dari platform SaaS **BiarFokus**. Dokumen ini disimpan sebagai referensi jangka panjang untuk memahami setiap fitur, modul, arsitektur data, state management, alur sinkronisasi offline-first, dan interaksi komponen.

---

## 1. Identitas & Visi Proyek

- **Nama Aplikasi**: BiarFokus (SaaS Productivity & Focus Operating System)
- **Repositori**: `ardi121380028-wq/biarfokus` (Branch: `main`)
- **Tujuan Utama**: Solusi produktivitas all-in-one yang menggabungkan:
  1. **Pomodoro Focus Timer & Audio Engine** (sintesis Web Audio, ambient noise, ticking, alarm).
  2. **Kanban Collaboration Board** (Trello-style workspace dengan real-time Supabase channels, member roles, PIC assignment, komentar, checklist, dan filter).
  3. **Timeblocking Calendar** (Google Calendar-style, drag & resize, recurrence, sinkronisasi cloud, ekspor .ics / Google Calendar URL, serta proaktif reminder notifikasi).
  4. **Notes System (Google Keep Style)** (Checklists, color palette, pin/archive, ekspor markdown/PDF).
  5. **Habit Tracker** (Daily streaks, sound effects, completion matrix).
  6. **SaaS Billing & Subscriptions** (Midtrans Snap payment gateway, Free vs Pro tiered limits, webhooks).
  7. **Admin Dashboard & Analytics** (Visitor tracking, audit logs, user management, metrics).

---

## 2. Technology Stack & Fondasi Arsitektur

| Lapisan | Teknologi | Alasan Pemilihan & Pola |
|---|---|---|
| **Framework** | Next.js (App Router, React 19) | Server & Client components, file-system routing, API routes (`/api/*`). |
| **Language** | TypeScript (Strict mode) | Strict type contracts pada domain types (`src/types/domain.ts`). |
| **Styling** | Vanilla CSS (`src/app/globals.css`) | Kontrol penuh atas performa, transisi CSS 60fps, CSS variables dinamis, bebas class-bloat. |
| **Database & Auth** | Supabase (PostgreSQL + RLS + Realtime) | Row Level Security (RLS), Postgres Realtime channels (`postgres_changes`), OAuth & Magic Links. |
| **State & Offline Storage** | Local-First Reactive Stores | Dual-layer persistence: instan di `localStorage`, sinkron ke Supabase saat online. |
| **Audio Engine** | Web Audio API (Synthesizer murni) | Bebas dependensi file MP3 eksternal, anti-latency, hemat bandwidth, 100% offline. |
| **Testing** | Node.js Test Runner (`node:test`, `node:assert/strict`) | Ringan, zero-dependency, 115 test cases berjalan dalam < 350ms. |

---

## 3. Peta Direktori & Struktur Kode Sumber

```
c:\Users\USER\Downloads\saas\
├── src\
│   ├── app\                                # Next.js App Router (Routes & UI Components)
│   │   ├── (auth)\                         # Rute autentikasi
│   │   ├── admin\page.tsx                  # Dashboard Admin & Metrics
│   │   ├── catatan\page.tsx                # Halaman Catatan (Keep Style)
│   │   ├── guide\page.tsx                  # Panduan Pintasan Keyboard & Fitur
│   │   ├── kalender\page.tsx               # Halaman Kalender Timeblocking
│   │   ├── kanban\                         # Halaman Kanban & Board Kolaborasi
│   │   │   ├── page.tsx                    # Daftar Board & Workspace Hub
│   │   │   └── [id]\page.tsx               # Workspace Board Spesifik
│   │   ├── kebiasaan\page.tsx              # Habit Tracker
│   │   ├── upgrade\page.tsx                # Pricing & Midtrans Payment
│   │   ├── api\                            # API Endpoints (Billing, Admin, Tracking, Auth)
│   │   ├── components\                     # UI Modals, Nav, Shell & Views
│   │   │   ├── app-shell.tsx               # Frame global: Nav, Brand Splash, Reminder Host
│   │   │   ├── task-management.tsx         # Quick Task Bar di Timer
│   │   │   ├── calendar\                   # Calendar Views, Modals & Toast Reminder
│   │   │   ├── kanban\                     # Kanban Board, Card Dialogs, Filters, Members
│   │   │   ├── notes\                      # Keep Notes Grid & Card Items
│   │   │   └── habits\                     # Habit Grid & Analytics
│   │   ├── providers\app-provider.tsx      # Core Global Context (Timer, Auth, Sound, Settings)
│   │   └── globals.css                     # Global Design System & Animations (~13.2k lines)
│   ├── features\                           # Domain Business Logic & Hooks
│   │   ├── admin\admin-service.ts          # Role validation & Audit log
│   │   ├── analytics\visitor-tracker.ts    # Visitor & Pageview counters
│   │   ├── audio\                          # Web Audio Synthesizer (Alarm, Ambient, Tick)
│   │   ├── billing\billing-service.ts      # Entitlements & Subscription checks
│   │   ├── calendar\                       # Calendar logic, sync, cloud & reminder hook
│   │   ├── kanban\                         # Kanban logic, cloud adapter & board hooks
│   │   ├── notes\                          # Note service, formatter (MD/PDF) & keep hook
│   │   ├── profile\profile-service.ts      # Profile display & avatar sanitization
│   │   ├── settings\settings-service.ts    # Default preferences & sync
│   │   ├── stats\stats-service.ts          # Streak computation, CSV export & daily focus
│   │   ├── tasks\task-service.ts           # Pomodoro task persistence & link storage
│   │   └── timer\timer-utils.ts            # Drift-free timer timestamp calculations
│   ├── lib\                                # Shared Utilities & Integrations
│   │   ├── api\request-guard.ts            # Rate limiting, client IP & standard errors
│   │   ├── storage\local-store.ts          # Reactive localStorage hook with tab broadcast
│   │   └── supabase\                       # Browser & Server Supabase Client Singletons
│   └── types\domain.ts                     # Single Source of Truth TypeScript Definitions
```

---

## 4. Rincian Modul & Fitur Utama

### 4.1. Pomodoro Focus Timer & Audio Engine
- **Files**:
  - [`timer-utils.ts`](file:///c:/Users/USER/Downloads/saas/src/features/timer/timer-utils.ts)
  - [`alarm-sound.ts`](file:///c:/Users/USER/Downloads/saas/src/features/audio/alarm-sound.ts)
  - [`ambient-sound.ts`](file:///c:/Users/USER/Downloads/saas/src/features/audio/ambient-sound.ts)
  - [`ticking-sound.ts`](file:///c:/Users/USER/Downloads/saas/src/features/audio/ticking-sound.ts)
- **Mekanisme Bebas Drift**: Timer tidak mengandalkan interval JavaScript konvensional yang melambat saat tab tidak aktif (background throttling). Melainkan menggunakan *Target Timestamp Reference* (`getTimerEndTime` & `getRemainingSeconds`).
- **Sintesis Audio**:
  - `playAlarmSound`: 4 pilihan alarm (Bell, Digital Beep, Marimba, Zen Bowl) dibangkitkan dari frekuensi osilator Web Audio murni.
  - `syncAmbientSound`: Generator derau sintetis (Rain, Ocean Waves, Brown Noise) dengan filter low-pass dan buffer audio loop.
  - `playCalendarReminderChime`: Dua nada harmonis (E5 659Hz dan B5 987Hz) yang lembut dan elegan saat pengingat jadwal berbunyi.

### 4.2. Kanban Workspace (Trello-Style Collaboration)
- **Files**:
  - [`kanban-service.ts`](file:///c:/Users/USER/Downloads/saas/src/features/kanban/kanban-service.ts)
  - [`kanban-cloud.ts`](file:///c:/Users/USER/Downloads/saas/src/features/kanban/kanban-cloud.ts)
  - [`kanban-view.tsx`](file:///c:/Users/USER/Downloads/saas/src/app/components/kanban/kanban-view.tsx)
  - [`kanban-card-dialog.tsx`](file:///c:/Users/USER/Downloads/saas/src/app/components/kanban/kanban-card-dialog.tsx)
- **Fitur Unggulan**:
  - Drag-and-Drop mulus untuk list dan card menggunakan pointer events native.
  - Multi-assignee PIC (Person In Charge) dengan stacked circular avatar.
  - Auto-contrast theme: Card dialog dan text secara dinamis mendeteksi wallpaper board (light/dark) sehingga kontras selalu terbaca tajam.
  - Realtime Channel: Terkoneksi ke PostgreSQL channel per `board_id` untuk sinkronisasi seketika antar-anggota tim.
  - Archive system: Fitur arsip kartu dengan undo toast dan restore modal.
  - Member Permissions: Owner, Editor, dan Viewer dengan kontrol edit ketat.

### 4.3. Timeblocking Calendar & Proactive Reminders
- **Files**:
  - [`calendar-service.ts`](file:///c:/Users/USER/Downloads/saas/src/features/calendar/calendar-service.ts)
  - [`use-calendar-events.ts`](file:///c:/Users/USER/Downloads/saas/src/features/calendar/use-calendar-events.ts)
  - [`use-calendar-reminders.ts`](file:///c:/Users/USER/Downloads/saas/src/features/calendar/use-calendar-reminders.ts)
  - [`calendar-reminder-toast.tsx`](file:///c:/Users/USER/Downloads/saas/src/app/components/calendar/calendar-reminder-toast.tsx)
- **Fitur Unggulan**:
  - Multi-view: Day, Week, Month, dan Year view.
  - Algoritma Overlap Column Layout: Penataan event bertumpuk otomatis sejajar vertikal mirip Google Calendar (`layoutDayEvents`).
  - Rekurensi Pintar: Harian (`daily`), hari kerja (`weekdays`), atau kustom hari dengan batas tanggal (`untilDate`).
  - Proactive Reminders: Pengecekan real-time tiap 15 detik. Mengirimkan Web Notification browser, audio chime Web Audio, dan floating in-app banner saat jadwal H-10 menit dan saat jadwal dimulai.

### 4.4. Notes System (Google Keep Style)
- **Files**:
  - [`notes-service.ts`](file:///c:/Users/USER/Downloads/saas/src/features/notes/notes-service.ts)
  - [`note-format.ts`](file:///c:/Users/USER/Downloads/saas/src/features/notes/note-format.ts)
- **Fitur**: Kartu teks & checklist interaktif, label tagging, pencarian instan, pinning, serta compiler Markdown/HTML/PDF untuk cetak langsung.

### 4.5. Habit Tracker
- **Files**:
  - [`habits-view.tsx`](file:///c:/Users/USER/Downloads/saas/src/app/components/habits/habits-view.tsx)
- **Fitur**: Tracking checklist harian, kalkulasi rekor rentang (streaks) aktif dan terpanjang, serta audio feedback saat menyelesaikan kebiasaan.

---

## 5. Pola Arsitektur Data: Local-First & Cloud Sync

Aplikasi BiarFokus menerapkan prinsip **Local-First Software**:
1. **Immediate UI Responsiveness**: Setiap aksi user (tambah kartu kanban, centang tugas, geser jadwal kalender) langsung ditulis ke memory dan `localStorage`. User tidak pernah merasakan lag jaringan.
2. **Optimistic UI Updates**: State dirender seketika, sementara sync Supabase berjalan di latar belakang (asynchronous).
3. **Resilient Offline Fallback**: Jika koneksi terputus atau API Supabase down, aplikasi tetap berfungsi 100%. Data lokal akan diunggah otomatis saat koneksi pulih.
4. **Tombstone Strategy**: Penghapusan item melacak `deleted_ids` untuk mencegah data lama dari cloud menimpa penghapusan lokal saat proses sync.

---

## 6. Model Data PostgreSQL (Supabase Tables)

1. `profiles`: `id (uuid, FK auth.users), display_name, avatar_url, role, updated_at`
2. `subscriptions`: `user_id, plan ('free'|'pro'), status, current_period_end`
3. `tasks`: `id, user_id, title, completed, pomodoros, linked_note_id, ...`
4. `pomodoro_sessions`: `id, user_id, mode, duration_seconds, completed_at`
5. `keep_notes`: `id, user_id, title, content, color, pinned, archived, items (jsonb)`
6. `calendar_events`: `id, user_id, title, date, start_time, end_time, color, category, recurrence (jsonb), linked_kanban_card_id, ...`
7. `kanban_boards`: `id, user_id, title, background, lists (jsonb), starred, ...`
8. `kanban_members`: `id, board_id, user_id, role, joined_at`
9. `kanban_invites`: `id, board_id, invite_code, role, uses_count, max_uses, expires_at`
10. `habits`: `id, user_id, title, emoji, color, completions (jsonb)`
11. `daily_visits` & `admin_audit_logs`: Analytic metrics and security audit trail.
