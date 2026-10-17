"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminOverview } from "@/types/domain";
import {
  fetchAdminOverviewFromApi,
  postAdminAuditLogToApi,
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
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminOverviewFromApi();
      setOverview(result);
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
    void fetchAdminOverviewFromApi()
      .then((result) => {
        if (!cancelled) setOverview(result);
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
      const refreshed = await fetchAdminOverviewFromApi();
      setOverview(refreshed);
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
        <p className="admin-note">Memuat metrik real-time dan audit log...</p>
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
    auditLogs: [],
  };

  return (
    <div className="inner-page">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Workspace admin</p>
          <h1>Overview</h1>
        </div>
        <button
          type="button"
          className="secondary-button admin-action-button"
          onClick={() => void handleAuditRefresh()}
          disabled={recording}
        >
          {recording ? "Mencatat..." : "Catat Audit & Muat Ulang"}
        </button>
      </div>

      {error && (
        <p className="task-error" role="alert">
          {error}
        </p>
      )}

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
                  <span>Target: {log.target_type}</span>
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
