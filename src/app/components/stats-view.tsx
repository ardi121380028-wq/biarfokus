"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { WeeklyStats } from "@/types/domain";
import { loadWeeklyStats } from "@/features/stats/stats-service";

type StatsViewProps = {
  supabase: SupabaseClient;
  userId: string | null;
  completedTasks: number;
};

const dayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function formatFocusTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}j ${minutes}m`;
}

export function StatsView({ supabase, userId, completedTasks }: StatsViewProps) {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void loadWeeklyStats(supabase, userId)
      .then((result) => {
        if (!cancelled) setStats(result);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Gagal memuat statistik.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [supabase, userId]);

  if (!userId) {
    return <div className="inner-page"><p className="eyebrow">Ringkasan mingguan</p><h1>Statistik produktivitas</h1><p className="admin-note">Masuk untuk menyimpan dan melihat histori fokusmu.</p></div>;
  }
  if (loading) return <div className="inner-page"><p className="eyebrow">Ringkasan mingguan</p><h1>Statistik produktivitas</h1><p className="admin-note">Memuat statistik...</p></div>;
  if (error) return <div className="inner-page"><p className="eyebrow">Ringkasan mingguan</p><h1>Statistik produktivitas</h1><p className="task-error" role="alert">Gagal memuat statistik: {error}</p></div>;

  const currentStats = stats ?? { focusSeconds: 0, pomodoroCount: 0, dailyFocusSeconds: Array.from({ length: 7 }, () => 0) };
  const maxFocus = Math.max(...currentStats.dailyFocusSeconds, 1);
  return <div className="inner-page">
    <p className="eyebrow">Ringkasan mingguan</p>
    <h1>Statistik produktivitas</h1>
    <div className="stat-grid">
      <div className="stat-card"><span>Fokus minggu ini</span><strong>{formatFocusTime(currentStats.focusSeconds)}</strong><small>Data sesi Pomodoro selesai</small></div>
      <div className="stat-card"><span>Pomodoro selesai</span><strong>{currentStats.pomodoroCount}</strong><small>Minggu berjalan</small></div>
      <div className="stat-card"><span>Tugas selesai</span><strong>{completedTasks}</strong><small>Dari task aktifmu</small></div>
    </div>
    <div className="chart-card"><div className="chart-labels">{dayLabels.map((label) => <span key={label}>{label}</span>)}</div><div className="bars">{currentStats.dailyFocusSeconds.map((seconds, index) => <div className="bar-wrap" key={dayLabels[index]}><div className="bar" style={{ height: `${Math.max((seconds / maxFocus) * 100, seconds ? 4 : 0)}%` }} /><small>{formatFocusTime(seconds)}</small></div>)}</div></div>
  </div>;
}
