"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { AdminOverview, AdminUserItem } from "@/types/domain";
import { getSafeAvatarUrl } from "@/features/profile/profile-service";
import {
  fetchAdminOverviewFromApi,
  fetchAdminUsersFromApi,
  postAdminAuditLogToApi,
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
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
          {recording ? "Mencatat..." : "Catat Audit & Refresh"}
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

      {/* Website Traffic & Visitor Tracking Section */}
      <section className="admin-traffic-section" aria-label="Statistik Kunjungan Website">
        <div className="section-subheading">
          <h2>🌐 Rekap Kunjungan Website (Traffic Analytics)</h2>
          <span>Pantau berapa banyak pengunjung & tayangan web yang masuk secara real-time</span>
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

      <section className="admin-users-section" aria-label="Manajemen pengguna">
        <div className="section-subheading">
          <h2>Daftar Pengguna ({users.length})</h2>
          <span>Kelola akses Pro / Free secara manual</span>
        </div>
        {users.length === 0 ? (
          <p className="admin-note">Belum ada pengguna terdaftar.</p>
        ) : (
          <div className="admin-users-list">
            {users.map((item) => {
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
                        <strong>{item.displayName || "Pengguna Tanpa Nama"}</strong>
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="admin-audit-section" aria-label="Riwayat audit admin">
        <h2>Riwayat Audit Admin</h2>
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
  );
}
