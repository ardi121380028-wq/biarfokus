"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyFocus, StatsRange } from "@/types/domain";
import {
  calculateStreaks,
  dailyFocusToCsv,
  formatLocalDay,
  getBrowserTimezone,
  getWeekdayIndex,
  loadDailyFocus,
  summarizeRange,
} from "@/features/stats/stats-service";
import { evaluateBadges } from "@/features/gamification/badges";

type StatsViewProps = {
  supabase: SupabaseClient;
  userId: string | null;
  completedTasks: number;
};

type LoadedStats = {
  daily: DailyFocus[];
  today: string;
};

const dayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const rangeOptions: Array<{ value: StatsRange; label: string; title: string }> = [
  { value: "week", label: "Minggu ini", title: "Ringkasan mingguan" },
  { value: "7d", label: "7 hari", title: "7 hari terakhir" },
  { value: "30d", label: "30 hari", title: "30 hari terakhir" },
];

function formatFocusTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}j ${minutes}m`;
}

function formatShortDay(day: string) {
  return `${day.slice(8, 10)}/${day.slice(5, 7)}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Gagal memuat statistik.";
}

export function StatsView({ supabase, userId, completedTasks }: StatsViewProps) {
  const [stats, setStats] = useState<LoadedStats | null>(null);
  const [range, setRange] = useState<StatsRange>("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void loadDailyFocus(supabase, getBrowserTimezone())
      .then((daily) => {
        if (!cancelled) setStats({ daily, today: formatLocalDay(new Date()) });
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(getErrorMessage(loadError));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [supabase, userId]);

  const summary = useMemo(
    () => (stats ? summarizeRange(stats.daily, range, stats.today) : null),
    [range, stats],
  );
  const streaks = useMemo(
    () => (stats ? calculateStreaks(stats.daily, stats.today) : null),
    [stats],
  );
  const currentStreak = streaks?.current ?? 0;
  const longestStreak = streaks?.longest ?? 0;
  const badges = useMemo(() => {
    if (!stats || !streaks) return [];
    const totalPomodoros = stats.daily.reduce((acc, d) => acc + d.pomodoroCount, 0);
    const deepWorkCount = stats.daily.some((d) => d.focusSeconds >= 3000) ? 1 : 0;
    return evaluateBadges({
      totalPomodoros,
      currentStreak,
      longestStreak,
      deepWorkCount,
    });
  }, [currentStreak, longestStreak, stats, streaks]);
  const activeRange = rangeOptions.find((option) => option.value === range) ?? rangeOptions[0];

  function handleExport() {
    if (!stats) return;
    const csv = dailyFocusToCsv(stats.daily);
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `biarfokus-fokus-${stats.today}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  if (!userId) {
    return <div className="inner-page"><p className="eyebrow">Ringkasan produktivitas</p><h1>Statistik produktivitas</h1><p className="admin-note">Masuk untuk menyimpan dan melihat histori fokusmu.</p></div>;
  }
  if (loading) return <div className="inner-page"><p className="eyebrow">Ringkasan produktivitas</p><h1>Statistik produktivitas</h1><p className="admin-note">Memuat statistik...</p></div>;
  if (error || !summary || !streaks) return <div className="inner-page"><p className="eyebrow">Ringkasan produktivitas</p><h1>Statistik produktivitas</h1><p className="task-error" role="alert">Gagal memuat statistik: {error ?? "Data statistik tidak tersedia."}</p></div>;

  const maxFocus = Math.max(...summary.series.map((entry) => entry.focusSeconds), 1);
  const dense = summary.series.length > 7;
  const firstDay = summary.series[0].day;
  const lastDay = summary.series[summary.series.length - 1].day;

  return <div className="inner-page">
    <p className="eyebrow">{activeRange.title}</p>
    <h1>Statistik produktivitas</h1>
    <div className="stats-toolbar">
      <div className="range-tabs" role="group" aria-label="Rentang statistik">
        {rangeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={range === option.value ? "range-tab selected" : "range-tab"}
            aria-pressed={range === option.value}
            onClick={() => setRange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <button type="button" className="secondary-button admin-action-button" onClick={handleExport} disabled={stats?.daily.length === 0}>
        Export CSV
      </button>
    </div>
    <div className="stat-grid">
      <div className="stat-card"><span>Fokus {activeRange.label.toLowerCase()}</span><strong>{formatFocusTime(summary.focusSeconds)}</strong><small>Data sesi Pomodoro selesai</small></div>
      <div className="stat-card"><span>Pomodoro selesai</span><strong>{summary.pomodoroCount}</strong><small>{activeRange.title}</small></div>
      <div className="stat-card"><span>Streak fokus</span><strong>{streaks.current} hari</strong><small>Terbaik: {streaks.longest} hari (1 tahun terakhir)</small></div>
      <div className="stat-card"><span>Tugas selesai</span><strong>{completedTasks}</strong><small>Dari task aktifmu</small></div>
    </div>
    <div className="chart-card">
      <div className="chart-labels">
        {dense
          ? <><span>{formatShortDay(firstDay)}</span><span>{formatShortDay(lastDay)}</span></>
          : summary.series.map((entry) => <span key={entry.day}>{dayLabels[getWeekdayIndex(entry.day)]}</span>)}
      </div>
      <div className={dense ? "bars dense" : "bars"}>
        {summary.series.map((entry) => (
          <div className="bar-wrap" key={entry.day}>
            <div
              className="bar"
              title={`${formatShortDay(entry.day)}: ${formatFocusTime(entry.focusSeconds)}`}
              style={{ height: `${Math.max((entry.focusSeconds / maxFocus) * 100, entry.focusSeconds ? 4 : 0)}%` }}
            />
            {!dense && <small>{formatFocusTime(entry.focusSeconds)}</small>}
          </div>
        ))}
      </div>
    </div>
    {summary.pomodoroCount === 0 && <p className="admin-note">Belum ada sesi fokus yang selesai di rentang ini.</p>}

    <div className="badges-section">
      <div className="badges-header">
        <div>
          <h2>Lencana & Pencapaian</h2>
          <p className="badges-subtitle">Pencapaian fokus dan konsistensi belajarmu</p>
        </div>
        <span className="badges-count-pill">
          {badges.filter((b) => b.unlocked).length} / {badges.length} Terbuka
        </span>
      </div>

      <div className="badges-grid">
        {badges.map((badge) => (
          <div key={badge.id} className={badge.unlocked ? "badge-card unlocked" : "badge-card"}>
            <div className="badge-icon" aria-hidden="true">{badge.icon}</div>
            <div className="badge-content">
              <div className="badge-title-row">
                <strong>{badge.title}</strong>
                {badge.unlocked ? (
                  <span className="badge-status-pill unlocked">Tercapai</span>
                ) : (
                  <span className="badge-status-pill locked">{badge.progressPercent}%</span>
                )}
              </div>
              <p>{badge.description}</p>
              <div className="badge-progress-wrap" aria-hidden="true">
                <div
                  className="badge-progress-fill"
                  style={{ width: `${badge.progressPercent}%` }}
                />
              </div>
              <small>
                {badge.unlocked
                  ? "✓ Target terpenuhi"
                  : `${badge.current} / ${badge.target} ${badge.unit}`}
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>;
}
