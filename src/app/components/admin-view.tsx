"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { AdminOverview, AdminUserItem } from "@/types/domain";
import { getSafeAvatarUrl } from "@/features/profile/profile-service";
import {
  fetchAdminOverviewFromApi,
  fetchAdminUsersFromApi,
  postAdminAuditLogToApi,
  postDeleteUserByAdminToApi,
  postUpdateUserPlanToApi,
} from "@/features/admin/admin-service";

type AdminViewProps = {
  userId: string | null;
  isAdmin: boolean;
};

function formatAuditTime(isoString: string) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminView({ userId, isAdmin }: AdminViewProps) {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState<AdminUserItem | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [adminTab, setAdminTab] = useState<"traffic" | "users" | "audit" | "docs">("traffic");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [demoPasswordVisible, setDemoPasswordVisible] = useState(false);
  const [demoPassword, setDemoPassword] = useState("Katakunci123!");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userFilterRole, setUserFilterRole] = useState<"all" | "pro" | "free" | "admin">("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewResult, usersResult] = await Promise.all([
        fetchAdminOverviewFromApi(),
        fetchAdminUsersFromApi(),
      ]);
      setOverview(overviewResult);
      setUsers(usersResult);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Gagal memuat data admin.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId || !isAdmin) return;
    let cancelled = false;
    void Promise.all([fetchAdminOverviewFromApi(), fetchAdminUsersFromApi()])
      .then(([overviewResult, usersResult]) => {
        if (!cancelled) {
          setOverview(overviewResult);
          setUsers(usersResult);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Gagal memuat data admin.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, userId]);

  async function handleAuditRefresh() {
    if (recording) return;
    setRecording(true);
    setError(null);
    try {
      await postAdminAuditLogToApi("refresh_overview", "admin_dashboard");
      await loadData();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Gagal mencatat audit log admin.",
      );
    } finally {
      setRecording(false);
    }
  }

  async function handleTogglePlan(targetUser: AdminUserItem) {
    if (updatingUserId) return;
    const nextPlan = targetUser.plan === "pro" ? "free" : "pro";
    setUpdatingUserId(targetUser.id);
    setError(null);
    setSuccessMessage(null);

    try {
      await postUpdateUserPlanToApi(targetUser.id, nextPlan);
      setUsers((current) =>
        current.map((u) =>
          u.id === targetUser.id
            ? { ...u, plan: nextPlan, status: nextPlan === "pro" ? "active" : "inactive" }
            : u,
        ),
      );
      setSuccessMessage(
        `Berhasil mengubah status langganan ${targetUser.displayName || targetUser.id.slice(0, 8)} menjadi ${nextPlan.toUpperCase()}.`,
      );
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Gagal memperbarui status paket pengguna.",
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleConfirmDeleteUser() {
    if (!deleteTargetUser || deletingUserId) return;
    const target = deleteTargetUser;
    setDeletingUserId(target.id);
    setError(null);
    setSuccessMessage(null);

    try {
      await postDeleteUserByAdminToApi(target.id);
      setUsers((current) => current.filter((u) => u.id !== target.id));
      setDeleteTargetUser(null);
      setSuccessMessage(
        `Akun ${target.displayName || target.id.slice(0, 8)} berhasil dihapus secara permanen.`,
      );
      await loadData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Gagal menghapus akun pengguna.",
      );
    } finally {
      setDeletingUserId(null);
    }
  }

  function copyToClipboard(text: string, label: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      setCopiedToken(`✓ ${label} disalin ke clipboard!`);
      setTimeout(() => setCopiedToken(null), 2500);
    }
  }

  function handleDownloadTokensJson() {
    const tokens = {
      name: "BiarFokus Design System Tokens",
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      colors: {
        ink: "#111111",
        muted: "#777777",
        paper: "#ffffff",
        page: "#e8e8e8",
        pink: "#f77fa5",
        accent: "#f77fa5",
        yellow: "#f6c832",
        blue: "#1875d1",
        success: "#22c55e",
        danger: "#ef4444",
      },
      typography: {
        display: "clamp(82px, 9.5vw, 122px) Georgia, serif",
        primaryFont: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Inter, sans-serif",
        heading1: "32px / 700 / -0.02em",
        heading2: "22px / 700",
        heading3: "18px / 600",
        body: "15px / 400",
        caption: "11px - 13px / 600",
      },
      borderRadius: {
        topbar: "34px",
        dock: "34px",
        card: "26px",
        modal: "20px",
        button: "12px",
        badge: "9999px",
      },
      zIndices: {
        canvas: 1,
        topbar: 80,
        drawerBackdrop: 850,
        drawerSidebar: 900,
        dock: 950,
        popover: 1200,
        modal: 99999,
        splash: 100000,
      },
    };
    const blob = new Blob([JSON.stringify(tokens, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "biarfokus-design-tokens.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setCopiedToken("✓ File biarfokus-design-tokens.json berhasil di-download!");
    setTimeout(() => setCopiedToken(null), 2500);
  }

  function handleCopyMarkdownErd() {
    const erdMarkdown = `# BiarFokus Database Architecture & Entity Relationship Specs

## Overview
Database: PostgreSQL on Supabase (Port 5432 direct, Port 6543 Supavisor Pooler)
Security: 100% tables protected by Row Level Security (RLS) via \`auth.uid() = user_id\`.

### 1. profiles
- \`id\` (UUID, PK, references auth.users.id)
- \`display_name\` (TEXT)
- \`avatar_url\` (TEXT)
- \`plan\` (TEXT: 'free' | 'pro')
- \`role\` (TEXT: 'user' | 'admin')
- \`tasks_migrated_at\` (TIMESTAMPTZ)
- \`created_at\` (TIMESTAMPTZ)

### 2. tasks
- \`id\` (UUID, PK)
- \`user_id\` (UUID, references profiles.id)
- \`title\` (TEXT, max 200 chars)
- \`completed\` (BOOLEAN)
- \`pomodoros\` (INTEGER)
- \`order_index\` (INTEGER)
- \`linked_item_text\` (TEXT, nullable)
- \`linked_note_id\` (UUID, nullable, references keep_notes.id)
- \`created_at\` (TIMESTAMPTZ)

### 3. pomodoro_sessions
- \`id\` (UUID, PK)
- \`user_id\` (UUID, references profiles.id)
- \`mode\` (TEXT: 'pomodoro' | 'shortBreak' | 'longBreak')
- \`duration_seconds\` (INTEGER)
- \`completed_at\` (TIMESTAMPTZ)

### 4. keep_notes
- \`id\` (UUID, PK)
- \`user_id\` (UUID, references profiles.id)
- \`title\` (TEXT)
- \`content\` (TEXT)
- \`bg_color\` (TEXT: '#ffffff', '#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', etc.)
- \`pinned\` (BOOLEAN)
- \`is_archived\` (BOOLEAN)
- \`checklist\` (JSONB)
- \`created_at\` (TIMESTAMPTZ)
- \`updated_at\` (TIMESTAMPTZ)

### 5. calendar_events
- \`id\` (UUID, PK)
- \`user_id\` (UUID, references profiles.id)
- \`title\` (TEXT)
- \`start_time\` (TIMESTAMPTZ)
- \`end_time\` (TIMESTAMPTZ)
- \`color\` (TEXT)
- \`recurrence\` (TEXT: 'none' | 'daily' | 'weekly')
- \`kanban_card_id\` (TEXT, nullable)

### 6. kanban_boards & kanban_members
- \`kanban_boards\`: id (UUID), owner_id (UUID), title (TEXT), invite_code (TEXT), created_at
- \`kanban_members\`: id (UUID), board_id (UUID), user_id (UUID), role ('owner'|'editor'|'viewer')

### 7. subscriptions
- \`id\` (UUID, PK)
- \`user_id\` (UUID, references profiles.id)
- \`plan\` (TEXT: 'free' | 'pro')
- \`status\` (TEXT: 'active' | 'canceled' | 'past_due')
- \`stripe_customer_id\` (TEXT)
- \`stripe_subscription_id\` (TEXT)
- \`current_period_end\` (TIMESTAMPTZ)

### 8. site_visits
- \`id\` (BIGSERIAL, PK)
- \`visitor_id\` (TEXT)
- \`path\` (TEXT)
- \`referrer\` (TEXT)
- \`user_agent\` (TEXT)
- \`user_id\` (UUID, nullable)
- \`created_at\` (TIMESTAMPTZ)
`;
    copyToClipboard(erdMarkdown, "Spesifikasi ERD Database (Markdown)");
  }

  if (!userId) {
    return (
      <div className="inner-page">
        <p className="eyebrow">Workspace admin</p>
        <h1>Akses Terbatas</h1>
        <p className="admin-note">
          Silakan masuk dengan akun administrator untuk mengakses halaman ini.
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="inner-page">
        <p className="eyebrow">Workspace admin</p>
        <h1>Akses Ditolak</h1>
        <p className="task-error" role="alert">
          Akun kamu tidak memiliki izin administrator untuk membuka halaman ini.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="inner-page">
        <p className="eyebrow">Workspace admin</p>
        <h1>Overview</h1>
        <p className="admin-note">Memuat metrik real-time, daftar pengguna, dan audit log...</p>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="inner-page">
        <p className="eyebrow">Workspace admin</p>
        <h1>Overview</h1>
        <p className="task-error" role="alert">
          Gagal memuat data admin: {error}
        </p>
        <button
          type="button"
          className="secondary-button admin-action-button"
          onClick={() => void loadData()}
        >
          Coba lagi
        </button>
      </div>
    );
  }

  const data = overview ?? {
    totalUsers: 0,
    activeUsersToday: 0,
    completedPomodoros: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalPageViews: 0,
    pageViewsToday: 0,
    uniqueVisitorsTotal: 0,
    uniqueVisitorsToday: 0,
    dailyVisits: [],
    auditLogs: [],
  };

  const proCount = users.filter((u) => u.plan === "pro").length;
  const freeCount = users.filter((u) => u.plan !== "pro").length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  const filteredUsers = users.filter((u) => {
    if (userFilterRole === "pro" && u.plan !== "pro") return false;
    if (userFilterRole === "free" && u.plan === "pro") return false;
    if (userFilterRole === "admin" && u.role !== "admin") return false;
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    const name = (u.displayName || "").toLowerCase();
    const id = (u.id || "").toLowerCase();
    return name.includes(q) || id.includes(q);
  });

  return (
    <div className="inner-page">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Workspace admin</p>
          <h1>Overview & Manajemen Pengguna</h1>
        </div>
        <button
          type="button"
          className="secondary-button admin-action-button"
          onClick={() => void handleAuditRefresh()}
          disabled={recording}
        >
          {recording ? "Mencatat..." : "🔄 Catat Audit & Refresh"}
        </button>
      </div>

      {error && (
        <p className="task-error" role="alert">
          {error}
        </p>
      )}

      {successMessage && (
        <p className="admin-success-banner" role="status">
          ✓ {successMessage}
        </p>
      )}

      {/* Admin Tab Navigation Menu */}
      <nav className="admin-tabs-nav" aria-label="Menu Admin">
        <button
          type="button"
          className={`admin-tab-btn ${adminTab === "traffic" ? "active" : ""}`}
          onClick={() => setAdminTab("traffic")}
        >
          <span className="tab-icon">🌐</span>
          <span className="tab-text">Trafik &amp; Ringkasan</span>
          <span className="tab-pill-badge">{data.totalPageViews} Views</span>
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${adminTab === "users" ? "active" : ""}`}
          onClick={() => setAdminTab("users")}
        >
          <span className="tab-icon">👥</span>
          <span className="tab-text">Daftar Pengguna</span>
          <span className="tab-pill-badge">{users.length}</span>
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${adminTab === "audit" ? "active" : ""}`}
          onClick={() => setAdminTab("audit")}
        >
          <span className="tab-icon">🛡️</span>
          <span className="tab-text">Audit Log &amp; Keamanan</span>
          <span className="tab-pill-badge">{data.auditLogs.length}</span>
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${adminTab === "docs" ? "active" : ""}`}
          onClick={() => setAdminTab("docs")}
        >
          <span className="tab-icon">🎨</span>
          <span className="tab-text">Design System &amp; Dev Specs</span>
          <span className="tab-pill-badge">Handoff</span>
        </button>
      </nav>

      {/* Tab 1: Traffic & Engagement Analytics */}
      {adminTab === "traffic" && (
        <div className="admin-tab-content">
          <section className="admin-traffic-section" aria-label="Statistik Kunjungan Website">
            <div className="section-subheading">
              <h2>🌐 Rekap Kunjungan Website (Traffic Analytics)</h2>
              <span>Pantau berapa banyak pengunjung &amp; tayangan web yang masuk secara real-time</span>
            </div>

            <div className="stat-grid admin-traffic-grid">
              <div className="stat-card">
                <span>🌐 Total Kunjungan Web</span>
                <strong>{data.totalPageViews}</strong>
                <small>Total tayangan halaman (all-time)</small>
              </div>
              <div className="stat-card">
                <span>👥 Pengunjung Unik Hari Ini</span>
                <strong>{data.uniqueVisitorsToday}</strong>
                <small>Visitor unik masuk hari ini</small>
              </div>
              <div className="stat-card">
                <span>📈 Kunjungan Hari Ini</span>
                <strong>{data.pageViewsToday}</strong>
                <small>Tayangan halaman hari ini</small>
              </div>
              <div className="stat-card">
                <span>👤 Total Pengunjung Unik</span>
                <strong>{data.uniqueVisitorsTotal}</strong>
                <small>Visitor unik terlacak</small>
              </div>
            </div>

            {/* 7-Day Traffic Trend Table */}
            {data.dailyVisits && data.dailyVisits.length > 0 && (
              <div className="admin-traffic-table-card">
                <strong className="traffic-table-title">Tren Kunjungan 7 Hari Terakhir</strong>
                <div className="admin-traffic-table-wrapper">
                  <table className="admin-traffic-table">
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Tayangan Halaman (Views)</th>
                        <th>Pengunjung Unik (Visitors)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.dailyVisits.map((day) => (
                        <tr key={day.date}>
                          <td>{day.date}</td>
                          <td><strong>{day.pageViews}</strong> views</td>
                          <td><strong>{day.uniqueVisitors}</strong> unik</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Core App Engagement Stats */}
          <div className="section-subheading" style={{ marginTop: "32px" }}>
            <h2>📊 Ringkasan Aktivitas Fokus &amp; Tugas</h2>
            <span>Statistik akumulatif pengguna dan tingkat produktivitas harian</span>
          </div>
          <div className="admin-table">
            <div>
              <span>Total pengguna</span>
              <strong>{data.totalUsers}</strong>
              <em>Terdaftar di profiles</em>
            </div>
            <div>
              <span>Pengguna aktif hari ini</span>
              <strong>{data.activeUsersToday}</strong>
              <em>Sesi fokus hari ini</em>
            </div>
            <div>
              <span>Pomodoro selesai</span>
              <strong>{data.completedPomodoros}</strong>
              <em>
                Task selesai: {data.completedTasks}/{data.totalTasks}
              </em>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: User Management with Search & Filter */}
      {adminTab === "users" && (
        <div className="admin-tab-content">
          <section className="admin-users-section" aria-label="Manajemen pengguna">
            <div className="section-subheading">
              <h2>Daftar Pengguna ({users.length})</h2>
              <span>Cari akun, pantau role, dan kelola akses Pro / Free secara instan</span>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="admin-users-toolbar">
              <div className="admin-search-input-wrap">
                <span className="admin-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama atau User ID..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  aria-label="Cari pengguna"
                />
              </div>

              <div className="admin-filter-pills" role="group" aria-label="Filter Paket">
                <button
                  type="button"
                  className={`admin-filter-pill ${userFilterRole === "all" ? "active" : ""}`}
                  onClick={() => setUserFilterRole("all")}
                >
                  Semua ({users.length})
                </button>
                <button
                  type="button"
                  className={`admin-filter-pill ${userFilterRole === "pro" ? "active" : ""}`}
                  onClick={() => setUserFilterRole("pro")}
                >
                  Pro ({proCount})
                </button>
                <button
                  type="button"
                  className={`admin-filter-pill ${userFilterRole === "free" ? "active" : ""}`}
                  onClick={() => setUserFilterRole("free")}
                >
                  Free ({freeCount})
                </button>
                <button
                  type="button"
                  className={`admin-filter-pill ${userFilterRole === "admin" ? "active" : ""}`}
                  onClick={() => setUserFilterRole("admin")}
                >
                  Admin ({adminCount})
                </button>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <p className="admin-note">
                {users.length === 0
                  ? "Belum ada pengguna terdaftar."
                  : "Tidak ada pengguna yang cocok dengan kriteria pencarian/filter."}
              </p>
            ) : (
              <div className="admin-users-list">
                {filteredUsers.map((item) => {
                  const safeAvatar = getSafeAvatarUrl(item.avatarUrl);
                  const isCurrentUser = item.id === userId;
                  const isPro = item.plan === "pro";
                  return (
                    <div className="admin-user-card" key={item.id}>
                      <div className="admin-user-info">
                        <div className="admin-user-avatar">
                          {safeAvatar ? (
                            <Image src={safeAvatar} alt="" width={38} height={38} unoptimized />
                          ) : (
                            <span>{(item.displayName || "U").charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <div className="admin-user-title-row">
                            <strong>{item.displayName || `Pengguna #${item.id.slice(0, 6)}`}</strong>
                            {isCurrentUser && <span className="admin-self-badge">Kamu</span>}
                            <span className={item.role === "admin" ? "admin-role-badge is-admin" : "admin-role-badge"}>
                              {item.role === "admin" ? "Admin" : "User"}
                            </span>
                          </div>
                          <small className="admin-user-meta">
                            ID: {item.id.slice(0, 13)}... · Terdaftar: {formatAuditTime(item.createdAt)}
                          </small>
                        </div>
                      </div>
                      <div className="admin-user-plan-action">
                        <span className={isPro ? "admin-plan-badge pro" : "admin-plan-badge free"}>
                          {isPro ? "PRO" : "FREE"}
                        </span>
                        <button
                          type="button"
                          className={isPro ? "secondary-button admin-plan-btn" : "primary-button admin-plan-btn"}
                          onClick={() => void handleTogglePlan(item)}
                          disabled={updatingUserId === item.id}
                          title={isPro ? "Turunkan ke paket Free" : "Tingkatkan ke paket Pro"}
                        >
                          {updatingUserId === item.id
                            ? "Menyimpan..."
                            : isPro
                              ? "Turunkan ke Free"
                              : "Jadikan Pro"}
                        </button>
                        {!isCurrentUser && (
                          <button
                            type="button"
                            className="admin-user-delete-btn"
                            onClick={() => setDeleteTargetUser(item)}
                            title="Hapus akun pengguna ini permanen"
                            aria-label={`Hapus akun ${item.displayName || item.id}`}
                            disabled={deletingUserId === item.id}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Tab 3: Security & Audit Logs */}
      {adminTab === "audit" && (
        <div className="admin-tab-content">
          <section className="admin-audit-section" aria-label="Riwayat audit admin" style={{ borderTop: "none", paddingTop: 0, marginTop: 0 }}>
            <div className="section-subheading">
              <h2>Riwayat Audit &amp; Keamanan ({data.auditLogs.length})</h2>
              <span>Pencatatan aktivitas sensitif administrator dan audit log keamanan sistem</span>
            </div>
            {data.auditLogs.length === 0 ? (
              <p className="admin-note">Belum ada aktivitas audit yang tercatat.</p>
            ) : (
              <div className="admin-audit-list">
                {data.auditLogs.map((log) => (
                  <div className="admin-audit-item" key={log.id}>
                    <div>
                      <strong>{log.action}</strong>
                      <span>Target: {log.target_type} {log.target_id ? `(${log.target_id.slice(0, 8)})` : ""}</span>
                    </div>
                    <small>{formatAuditTime(log.created_at)}</small>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Tab 4: Design System & Developer Specs Handoff Hub */}
      {adminTab === "docs" && (
        <div className="admin-tab-content admin-docs-container">
          {/* Toast / Copied feedback */}
          {copiedToken && (
            <p className="admin-success-banner" role="status">
              {copiedToken}
            </p>
          )}

          {/* Banner & Quick Action Handoff Bar */}
          <div className="admin-docs-banner">
            <div>
              <h2>🎨 Living Design System &amp; Developer Handoff</h2>
              <p>
                Spesifikasi desain arsitektural, token warna, komponen UI interaktif, skema database Supabase, dan panduan handoff khusus internal tim developer dan product designer.
              </p>
            </div>
            <div className="admin-docs-actions">
              <button
                type="button"
                className="admin-docs-action-btn primary"
                onClick={handleDownloadTokensJson}
              >
                📥 Export Tokens (JSON)
              </button>
              <button
                type="button"
                className="admin-docs-action-btn"
                onClick={handleCopyMarkdownErd}
              >
                📋 Salin ERD Schema (Markdown)
              </button>
            </div>
          </div>

          {/* Section 1: Brand Assets & Vector Identity */}
          <section className="admin-docs-card" aria-label="Identitas Brand dan Aset Logo">
            <div className="admin-docs-card-header">
              <div className="admin-docs-card-title">
                <span style={{ fontSize: "20px" }}>🖼️</span>
                <div>
                  <h3>Brand Identity &amp; Logo Assets</h3>
                  <div className="admin-docs-card-subtitle">
                    Aset visual resmi untuk handoff Figma, investor pitch deck, dan icon aplikasi
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-assets-grid">
              <div className="admin-asset-card">
                <div className="admin-asset-preview">
                  <Image
                    src="/biarfokus-light.png"
                    alt="BiarFokus Logo Light"
                    width={180}
                    height={38}
                    style={{ objectFit: "contain", height: "36px", width: "auto" }}
                  />
                </div>
                <div className="admin-asset-info">
                  <strong>Logo Utama (Light Mode)</strong>
                  <span>Path: <code>/biarfokus-light.png</code></span>
                </div>
                <a href="/biarfokus-light.png" download className="admin-token-copy-btn">
                  ⬇️ Unduh Logo
                </a>
              </div>

              <div className="admin-asset-card">
                <div className="admin-asset-preview dark-preview">
                  <Image
                    src="/biarfokus-dark.png"
                    alt="BiarFokus Logo Dark"
                    width={180}
                    height={38}
                    style={{ objectFit: "contain", height: "36px", width: "auto" }}
                  />
                </div>
                <div className="admin-asset-info">
                  <strong style={{ color: "var(--ink)" }}>Logo Utama (Dark Mode)</strong>
                  <span>Path: <code>/biarfokus-dark.png</code></span>
                </div>
                <a href="/biarfokus-dark.png" download className="admin-token-copy-btn">
                  ⬇️ Unduh Logo Dark
                </a>
              </div>

              <div className="admin-asset-card">
                <div className="admin-asset-preview">
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      background: "url(/biarfokus-icon.png) center/contain no-repeat",
                    }}
                  />
                </div>
                <div className="admin-asset-info">
                  <strong>Brand Mark &amp; App Icon</strong>
                  <span>Path: <code>/biarfokus-icon.png</code></span>
                </div>
                <a href="/biarfokus-icon.png" download className="admin-token-copy-btn">
                  ⬇️ Unduh Icon
                </a>
              </div>
            </div>
          </section>

          {/* Section 2: Color Palette Tokens */}
          <section className="admin-docs-card" aria-label="Token Palet Warna">
            <div className="admin-docs-card-header">
              <div className="admin-docs-card-title">
                <span style={{ fontSize: "20px" }}>🌈</span>
                <div>
                  <h3>Design Tokens &amp; Color Palette</h3>
                  <div className="admin-docs-card-subtitle">
                    Variabel warna sistem BiarFokus. Klik tombol salin untuk menyalin kode HEX langsung ke clipboard.
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-tokens-grid">
              {[
                { token: "--ink", hex: "#111111", desc: "Text Utama & High-Contrast" },
                { token: "--paper", hex: "#ffffff", desc: "Surface Kartu & Modal" },
                { token: "--page", hex: "#e8e8e8", desc: "Background Canvas Utama" },
                { token: "--muted", hex: "#777777", desc: "Subteks & Border Netral" },
                { token: "--pink", hex: "#f77fa5", desc: "Accent & Pomodoro Focus" },
                { token: "--yellow", hex: "#f6c832", desc: "Istirahat Pendek & Nav Active" },
                { token: "--blue", hex: "#1875d1", desc: "Istirahat Panjang & Auth CTA" },
                { token: "--success", hex: "#22c55e", desc: "Status Aktif & Terverifikasi" },
                { token: "--danger", hex: "#ef4444", desc: "Aksi Destruktif & Error" },
              ].map((item) => (
                <div key={item.token} className="admin-token-item">
                  <div
                    className="admin-token-swatch"
                    style={{ backgroundColor: item.hex }}
                  >
                    <span className="admin-token-swatch-badge">{item.hex}</span>
                  </div>
                  <div className="admin-token-info">
                    <div>
                      <div className="admin-token-name">{item.token}</div>
                      <div className="admin-token-val">{item.desc}</div>
                    </div>
                    <button
                      type="button"
                      className="admin-token-copy-btn"
                      onClick={() => copyToClipboard(item.hex, item.token)}
                    >
                      Salin HEX
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Typography & Elevation Hierarchy */}
          <section className="admin-docs-card" aria-label="Hierarki Tipografi dan Elevasi">
            <div className="admin-docs-card-header">
              <div className="admin-docs-card-title">
                <span style={{ fontSize: "20px" }}>🔤</span>
                <div>
                  <h3>Typography &amp; Layout Scale</h3>
                  <div className="admin-docs-card-subtitle">
                    Skala teks, font pairing, border radius, dan tatanan z-index layer
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-type-grid">
              <div className="admin-type-row">
                <div className="admin-type-meta">
                  <strong>Display Timer</strong>
                  <br />Georgia, serif (82px-122px)
                </div>
                <div className="admin-type-sample" style={{ font: "bold 46px Georgia, serif", color: "var(--ink)" }}>
                  25:00
                </div>
              </div>

              <div className="admin-type-row">
                <div className="admin-type-meta">
                  <strong>Heading 1 (H1)</strong>
                  <br />Geist Sans, 32px / Bold
                </div>
                <div className="admin-type-sample" style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.02em" }}>
                  BiarFokus Workspace
                </div>
              </div>

              <div className="admin-type-row">
                <div className="admin-type-meta">
                  <strong>Heading 2 (H2)</strong>
                  <br />Geist Sans, 22px / Bold
                </div>
                <div className="admin-type-sample" style={{ fontSize: "20px", fontWeight: 700 }}>
                  Overview &amp; Manajemen Pengguna
                </div>
              </div>

              <div className="admin-type-row">
                <div className="admin-type-meta">
                  <strong>Body &amp; Microcopy</strong>
                  <br />Geist Sans, 15px &amp; 12px
                </div>
                <div className="admin-type-sample" style={{ fontSize: "14px", color: "var(--muted)" }}>
                  Aplikasi produktivitas berbasis Pomodoro, Time-Blocking Calendar, dan Google Keep-style notes untuk menjaga fokus kerja tanpa distraksi.
                </div>
              </div>
            </div>

            <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
              <div style={{ padding: "14px", borderRadius: "14px", background: "color-mix(in srgb, var(--ink) 2%, var(--paper))", border: "1px solid color-mix(in srgb, var(--ink) 8%, transparent)" }}>
                <strong style={{ fontSize: "13px", display: "block", marginBottom: "6px" }}>📐 Border Radius Scale</strong>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "var(--muted)", lineHeight: "1.6" }}>
                  <li><code>34px</code>: Topbar, Floating Dock Navigation</li>
                  <li><code>26px</code>: Main Cards (Timer, Task, Notes, Calendar)</li>
                  <li><code>20px</code>: Modals &amp; Action Dialogs</li>
                  <li><code>12px</code>: Interactive Buttons &amp; Search Bars</li>
                  <li><code>9999px</code>: Pill Badges &amp; Status Indicators</li>
                </ul>
              </div>

              <div style={{ padding: "14px", borderRadius: "14px", background: "color-mix(in srgb, var(--ink) 2%, var(--paper))", border: "1px solid color-mix(in srgb, var(--ink) 8%, transparent)" }}>
                <strong style={{ fontSize: "13px", display: "block", marginBottom: "6px" }}>🥞 Z-Index Elevation Matrix</strong>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "var(--muted)", lineHeight: "1.6" }}>
                  <li><code>z-index: 1</code> — Canvas Content &amp; Grids</li>
                  <li><code>z-index: 80</code> — Topbar Navigation</li>
                  <li><code>z-index: 900</code> — Sidebar Drawer Backdrop</li>
                  <li><code>z-index: 950</code> — Floating Dock Controls</li>
                  <li><code>z-index: 1200</code> — Popover &amp; Tooltip Menus</li>
                  <li><code>z-index: 99999</code> — Auth &amp; Confirmation Modals</li>
                  <li><code>z-index: 100000</code> — Initial Splash Loader</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4: Interactive Living Component Sandbox */}
          <section className="admin-docs-card" aria-label="Living Component Sandbox">
            <div className="admin-docs-card-header">
              <div className="admin-docs-card-title">
                <span style={{ fontSize: "20px" }}>🧩</span>
                <div>
                  <h3>Interactive Living Component Sandbox</h3>
                  <div className="admin-docs-card-subtitle">
                    Pratinjau langsung komponen UI produksi yang bisa diuji coba secara interaktif
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-showcase-grid">
              {/* Box 1: Button Variants */}
              <div className="admin-showcase-box">
                <div className="admin-showcase-box-header">
                  <strong>Button Variants</strong>
                  <span>CSS Utilities</span>
                </div>
                <div className="admin-showcase-items">
                  <button type="button" className="start-button" style={{ width: "auto", padding: "8px 18px", fontSize: "13px" }}>
                    Primary Pink
                  </button>
                  <button type="button" className="secondary-button" style={{ padding: "8px 14px", fontSize: "13px" }}>
                    Secondary Ghost
                  </button>
                  <button type="button" className="danger-button" style={{ padding: "8px 14px", fontSize: "13px" }}>
                    Danger Button
                  </button>
                </div>
              </div>

              {/* Box 2: Password with SVG Eye Toggle */}
              <div className="admin-showcase-box">
                <div className="admin-showcase-box-header">
                  <strong>Auth Password Field with Eye Toggle</strong>
                  <span>Living Component</span>
                </div>
                <div style={{ position: "relative", width: "100%", maxWidth: "300px" }}>
                  <input
                    type={demoPasswordVisible ? "text" : "password"}
                    value={demoPassword}
                    onChange={(e) => setDemoPassword(e.target.value)}
                    className="auth-input-field"
                    style={{ paddingRight: "44px" }}
                    placeholder="Minimal 8 karakter..."
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setDemoPasswordVisible(!demoPasswordVisible)}
                    title={demoPasswordVisible ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {demoPasswordVisible ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="auth-field-hint" style={{ marginTop: "-6px" }}>
                  Status: {demoPassword.length >= 8 ? "✓ Memenuhi syarat (≥ 8 karakter)" : "⚠️ Minimal 8 karakter"}
                </div>
              </div>

              {/* Box 3: Pomodoro Status Pills */}
              <div className="admin-showcase-box">
                <div className="admin-showcase-box-header">
                  <strong>Timer State Pills</strong>
                  <span>Active State</span>
                </div>
                <div className="admin-showcase-items">
                  <span style={{ padding: "6px 14px", borderRadius: "999px", background: "var(--pink)", color: "#fff", fontWeight: "bold", fontSize: "12px" }}>
                    🔥 Fokus (25:00)
                  </span>
                  <span style={{ padding: "6px 14px", borderRadius: "999px", background: "var(--yellow)", color: "#111", fontWeight: "bold", fontSize: "12px" }}>
                    ☕ Istirahat Pendek (05:00)
                  </span>
                  <span style={{ padding: "6px 14px", borderRadius: "999px", background: "var(--blue)", color: "#fff", fontWeight: "bold", fontSize: "12px" }}>
                    🌴 Istirahat Panjang (15:00)
                  </span>
                </div>
              </div>

              {/* Box 4: Note Card Google Keep Style */}
              <div className="admin-showcase-box">
                <div className="admin-showcase-box-header">
                  <strong>Google Keep-Style Sticky Note</strong>
                  <span>Pastel Theme</span>
                </div>
                <div style={{ background: "#fef08a", border: "1px solid #fde047", borderRadius: "12px", padding: "12px 14px", color: "#111" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <strong style={{ fontSize: "13px" }}>📌 Catatan Cepat Rapat</strong>
                    <span style={{ fontSize: "11px", color: "#854d0e" }}>Kuning</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", lineHeight: "1.4" }}>
                    Setup distributed connection pooler Supavisor sebelum rilis public beta!
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Database Architecture & Schema */}
          <section className="admin-docs-card" aria-label="Arsitektur Database PostgreSQL">
            <div className="admin-docs-card-header">
              <div className="admin-docs-card-title">
                <span style={{ fontSize: "20px" }}>🗄️</span>
                <div>
                  <h3>Database Architecture &amp; RLS Model (Supabase)</h3>
                  <div className="admin-docs-card-subtitle">
                    Struktur 8 tabel PostgreSQL inti dengan Row Level Security (RLS) aktif 100%
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="admin-token-copy-btn"
                onClick={handleCopyMarkdownErd}
              >
                📋 Salin Spesifikasi Lengkap
              </button>
            </div>

            <div className="admin-schema-table-wrapper">
              <table className="admin-schema-table">
                <thead>
                  <tr>
                    <th>Nama Tabel</th>
                    <th>Kolom Kunci &amp; Tipe Data</th>
                    <th>Keamanan RLS</th>
                    <th>Fungsi Bisnis</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>profiles</code></td>
                    <td>id (UUID), display_name, plan (&apos;free&apos;|&apos;pro&apos;), role (&apos;user&apos;|&apos;admin&apos;)</td>
                    <td><span className="admin-schema-badge rls">RLS Active</span></td>
                    <td>Identitas pengguna, otorisasi peran admin, dan status lisensi</td>
                  </tr>
                  <tr>
                    <td><code>tasks</code></td>
                    <td>id (UUID), user_id, title, completed, pomodoros, order_index</td>
                    <td><span className="admin-schema-badge rls">RLS Active</span></td>
                    <td>Daftar pekerjaan to-do yang disinkronkan ke cloud &amp; timer</td>
                  </tr>
                  <tr>
                    <td><code>pomodoro_sessions</code></td>
                    <td>id, user_id, mode, duration_seconds, completed_at</td>
                    <td><span className="admin-schema-badge rls">RLS Active</span></td>
                    <td>Log riwayat sesi fokus yang dihitung untuk grafik statistik</td>
                  </tr>
                  <tr>
                    <td><code>keep_notes</code></td>
                    <td>id, user_id, title, content, bg_color, pinned, is_archived</td>
                    <td><span className="admin-schema-badge rls">RLS Active</span></td>
                    <td>Sistem catatan model Google Keep dengan warna &amp; checklist</td>
                  </tr>
                  <tr>
                    <td><code>calendar_events</code></td>
                    <td>id, user_id, title, start_time, end_time, recurrence</td>
                    <td><span className="admin-schema-badge rls">RLS Active</span></td>
                    <td>Jadwal time-blocking kalender mingguan &amp; bulanan</td>
                  </tr>
                  <tr>
                    <td><code>kanban_boards</code></td>
                    <td>id, owner_id, title, invite_code, created_at</td>
                    <td><span className="admin-schema-badge rls">RLS Active</span></td>
                    <td>Papan kolaboratif kanban dengan sistem undangan tim</td>
                  </tr>
                  <tr>
                    <td><code>subscriptions</code></td>
                    <td>id, user_id, plan, status, stripe_customer_id, current_period_end</td>
                    <td><span className="admin-schema-badge rls">RLS Active</span></td>
                    <td>Pencatatan status langganan Pro dari webhook payment gateway</td>
                  </tr>
                  <tr>
                    <td><code>site_visits</code></td>
                    <td>id, visitor_id, path, referrer, user_agent, created_at</td>
                    <td><span className="admin-schema-badge api">Admin Access</span></td>
                    <td>Pencatatan metrik analitik pengunjung &amp; tayangan halaman</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 6: Scale Readiness Checklist (100k+ Users) */}
          <section className="admin-docs-card" aria-label="Checklist Kesiapan Skala 100K+ Pengguna">
            <div className="admin-docs-card-header">
              <div className="admin-docs-card-title">
                <span style={{ fontSize: "20px" }}>🚀</span>
                <div>
                  <h3>Scale Readiness Checklist (100K+ Active Users)</h3>
                  <div className="admin-docs-card-subtitle">
                    Status kesiapan infrastruktur untuk menerima lonjakan ratusan ribu pengguna
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-scale-checklist">
              <div className="admin-scale-item">
                <span className="admin-scale-status">🟢</span>
                <div className="admin-scale-text">
                  <strong>Front-End SSG &amp; Global Edge CDN</strong>
                  <p>Next.js 16 dengan kompilasi statis. Aset JS, CSS, dan landing page disajikan langsung dari edge cache tanpa beban server.</p>
                </div>
              </div>

              <div className="admin-scale-item">
                <span className="admin-scale-status">🟢</span>
                <div className="admin-scale-text">
                  <strong>Strict Security &amp; Safe Admin Guard</strong>
                  <p>Semua endpoint admin dilindungi server-side auth (bukan client check). HTTP headers HSTS, nosniff, dan DENY terpasang.</p>
                </div>
              </div>

              <div className="admin-scale-item">
                <span className="admin-scale-status">🟢</span>
                <div className="admin-scale-text">
                  <strong>Postgres Row Level Security (RLS)</strong>
                  <p>100% tabel dilindungi RLS policies non-rekursif. Pengguna tidak bisa membaca data pengguna lain meskipun URL endpoint diketahui.</p>
                </div>
              </div>

              <div className="admin-scale-item">
                <span className="admin-scale-status">🟡</span>
                <div className="admin-scale-text">
                  <strong>Supavisor Connection Pooler (Port 6543)</strong>
                  <p>Wajib diaktifkan di Supabase Dashboard untuk beralih dari port 5432 ke 6543 guna mencegah habisnya slot koneksi DB saat ribuan koneksi bersamaan.</p>
                </div>
              </div>

              <div className="admin-scale-item">
                <span className="admin-scale-status">🟡</span>
                <div className="admin-scale-text">
                  <strong>Distributed Rate Limiting (Upstash Redis)</strong>
                  <p>Untuk multi-container Vercel autoscaling, ganti in-memory rate limiter lokal ke Redis shared counter agar kuota konsisten di semua node.</p>
                </div>
              </div>

              <div className="admin-scale-item">
                <span className="admin-scale-status">🟡</span>
                <div className="admin-scale-text">
                  <strong>Batched Analytics / Off-DB Tracking</strong>
                  <p>Pencatatan <code>/api/track/visit</code> disarankan menggunakan buffer Redis atau lightweight analytics agar tidak menguras IOPS database saat viral.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
      {/* Delete User Confirmation Modal for Admin */}
      {deleteTargetUser && (
        <div
          className="auth-modal-backdrop"
          onClick={() => {
            if (!deletingUserId) setDeleteTargetUser(null);
          }}
        >
          <div
            className="auth-modal delete-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-delete-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setDeleteTargetUser(null)}
              aria-label="Tutup konfirmasi"
              disabled={Boolean(deletingUserId)}
            >
              ×
            </button>
            <h2 id="admin-delete-confirm-title">Hapus Akun Pengguna?</h2>
            <p>
              Tindakan ini permanen. Semua data tugas, pomodoro, dan riwayat untuk{" "}
              <strong>{deleteTargetUser.displayName || `Pengguna #${deleteTargetUser.id.slice(0, 8)}`}</strong>{" "}
              akan dihapus dan tidak bisa dikembalikan.
            </p>
            <div className="auth-modal-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setDeleteTargetUser(null)}
                disabled={Boolean(deletingUserId)}
              >
                Batal
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => void handleConfirmDeleteUser()}
                disabled={Boolean(deletingUserId)}
              >
                {deletingUserId ? "Menghapus..." : "Ya, Hapus Akun"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
