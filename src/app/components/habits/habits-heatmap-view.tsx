"use client";

import { useMemo, useState } from "react";
import type { Habit, HabitStats, HeatmapDay } from "@/features/habits/habit-types";
import { getTodayKey, calculateStreak, shiftDateKey } from "@/features/habits/habit-service";
import { HabitHeatmap } from "./habit-heatmap";
import { HabitsReportModal } from "./habits-report-modal";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";

interface HabitsHeatmapViewProps {
  stats: HabitStats;
  heatmap: HeatmapDay[];
  habits?: Habit[];
  userName?: string;
  onToggleCheckin?: (habitId: string, dateKey?: string) => void;
  onEdit?: (habit: Habit) => void;
  onDelete?: (habitId: string) => void;
  onOpenCreateModal: () => void;
}

interface AchievementBadge {
  id: string;
  icon: string;
  title: string;
  desc: string;
  progressText: string;
  progressPercent: number;
  isUnlocked: boolean;
}

export function HabitsHeatmapView({
  stats,
  heatmap,
  habits = [],
  userName = "Pengguna BiarFokus",
  onEdit,
  onOpenCreateModal,
}: HabitsHeatmapViewProps) {
  const todayKey = getTodayKey();

  // 30-day cutoff for calculating 30-day consistency rate
  const thirtyDaysAgoKey = useMemo(() => shiftDateKey(todayKey, -30), [todayKey]);

  // Overall average 30-day consistency percentage across all active habits
  const average30DayRate = useMemo(() => {
    if (habits.length === 0) return 0;
    const totalRates = habits.reduce((acc, h) => {
      const past30Count = h.completedDates.filter((d) => d >= thirtyDaysAgoKey && d <= todayKey).length;
      return acc + Math.min(100, Math.round((past30Count / 30) * 100));
    }, 0);
    return Math.round(totalRates / habits.length);
  }, [habits, thirtyDaysAgoKey, todayKey]);

  // Dr. Phillippa Lally 66-day automaticity milestone
  const bestStreak = stats.bestCurrentStreak;
  const automaticityPercent = Math.min(100, Math.round((bestStreak / 66) * 100));

  // Modern modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [tableRoutineFilter, setTableRoutineFilter] = useState<"all" | "morning" | "afternoon" | "evening" | "anytime">("all");
  const [noticeModal, setNoticeModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemName?: string;
    itemSubtext?: string;
  } | null>(null);

  // Routine counts for table filters
  const routineCounts = useMemo(() => {
    return {
      all: habits.length,
      morning: habits.filter((h) => h.routineTime === "morning").length,
      afternoon: habits.filter((h) => h.routineTime === "afternoon").length,
      evening: habits.filter((h) => h.routineTime === "evening").length,
      anytime: habits.filter((h) => h.routineTime === "anytime").length,
    };
  }, [habits]);

  // Filtered habits for macro evaluation table
  const filteredTableHabits = useMemo(() => {
    if (tableRoutineFilter === "all") return habits;
    return habits.filter((h) => h.routineTime === tableRoutineFilter);
  }, [habits, tableRoutineFilter]);

  // Smart Consistency Insights
  const championHabit = useMemo(() => {
    if (habits.length === 0) return null;
    return [...habits].sort((a, b) => {
      const streakA = calculateStreak(a.completedDates).current;
      const streakB = calculateStreak(b.completedDates).current;
      if (streakB !== streakA) return streakB - streakA;
      return b.completedDates.length - a.completedDates.length;
    })[0];
  }, [habits]);

  const opportunityHabit = useMemo(() => {
    if (habits.length <= 1) return null;
    return [...habits].sort((a, b) => {
      const rateA = a.completedDates.filter((d) => d >= thirtyDaysAgoKey && d <= todayKey).length;
      const rateB = b.completedDates.filter((d) => d >= thirtyDaysAgoKey && d <= todayKey).length;
      return rateA - rateB;
    })[0];
  }, [habits, thirtyDaysAgoKey, todayKey]);

  const estimatedInvestmentMinutes = useMemo(() => {
    return stats.allTimeCheckins * 15;
  }, [stats.allTimeCheckins]);

  // Gamified achievements calculation
  const achievements = useMemo<AchievementBadge[]>(() => {
    const morningHabitStreak = habits
      .filter((h) => h.routineTime === "morning")
      .map((h) => calculateStreak(h.completedDates).current);
    const maxMorningStreak = morningHabitStreak.length > 0 ? Math.max(...morningHabitStreak) : 0;

    const list: AchievementBadge[] = [
      {
        id: "first_step",
        icon: "🚀",
        title: "Langkah Pertama",
        desc: "Selesaikan check-in kebiasaan pertamamu.",
        progressText: `${Math.min(1, stats.allTimeCheckins)}/1 Selesai`,
        progressPercent: stats.allTimeCheckins >= 1 ? 100 : 0,
        isUnlocked: stats.allTimeCheckins >= 1,
      },
      {
        id: "streak_7",
        icon: "⚡",
        title: "Momentum 7 Hari",
        desc: "Capai streak 7 hari berturut-turut pada kebiasaan apa pun.",
        progressText: `${Math.min(7, stats.bestCurrentStreak)}/7 Hari`,
        progressPercent: Math.min(100, Math.round((stats.bestCurrentStreak / 7) * 100)),
        isUnlocked: stats.bestCurrentStreak >= 7,
      },
      {
        id: "habit_21",
        icon: "🧠",
        title: "Neuroplastisitas 21 Hari",
        desc: "Membentuk jalur saraf kebiasaan baru di otak.",
        progressText: `${Math.min(21, stats.bestCurrentStreak)}/21 Hari`,
        progressPercent: Math.min(100, Math.round((stats.bestCurrentStreak / 21) * 100)),
        isUnlocked: stats.bestCurrentStreak >= 21,
      },
      {
        id: "automaticity_66",
        icon: "👑",
        title: "Threshold Otomatisasi (66 Hari)",
        desc: "Kebiasaan menjadi refleks bawah sadar (Riset UCL Dr. Lally).",
        progressText: `${Math.min(66, stats.bestCurrentStreak)}/66 Hari`,
        progressPercent: automaticityPercent,
        isUnlocked: stats.bestCurrentStreak >= 66,
      },
      {
        id: "century_100",
        icon: "💯",
        title: "Klub Seabad (100 Check-In)",
        desc: "Akumulasi 100 total check-in seumur hidup.",
        progressText: `${Math.min(100, stats.allTimeCheckins)}/100 Check-in`,
        progressPercent: Math.min(100, Math.round((stats.allTimeCheckins / 100) * 100)),
        isUnlocked: stats.allTimeCheckins >= 100,
      },
      {
        id: "perfect_day",
        icon: "🎯",
        title: "Hari Sempurna (100% Disiplin)",
        desc: "Selesaikan seluruh daftar kebiasaan aktif hari ini.",
        progressText: `${stats.todayRatePercent}% Selesai`,
        progressPercent: stats.todayRatePercent,
        isUnlocked: stats.todayRatePercent === 100 && stats.totalHabits > 0,
      },
      {
        id: "morning_master",
        icon: "🌅",
        title: "Master Rutinitas Pagi",
        desc: "Pertahankan streak minimal 3 hari pada kebiasaan pagi.",
        progressText: `${Math.min(3, maxMorningStreak)}/3 Hari`,
        progressPercent: Math.min(100, Math.round((maxMorningStreak / 3) * 100)),
        isUnlocked: maxMorningStreak >= 3,
      },
      {
        id: "legend_250",
        icon: "💎",
        title: "Konsistensi Tingkat Elit",
        desc: "Tembus 250 check-in total komitmen kebiasaan.",
        progressText: `${Math.min(250, stats.allTimeCheckins)}/250 Check-in`,
        progressPercent: Math.min(100, Math.round((stats.allTimeCheckins / 250) * 100)),
        isUnlocked: stats.allTimeCheckins >= 250,
      },
    ];

    return list;
  }, [stats, habits, automaticityPercent]);

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  // Export CSV Handler
  const handleExportCsv = () => {
    if (habits.length === 0) {
      setNoticeModal({
        isOpen: true,
        title: "Belum Ada Data Kebiasaan",
        message: "Belum ada data kebiasaan yang dapat diekspor ke CSV. Silakan buat kebiasaan pertama Anda terlebih dahulu.",
      });
      return;
    }

    const headers = [
      "Nama Kebiasaan",
      "Rutinitas",
      "Frekuensi",
      "Target",
      "Total Check-in",
      "Streak Saat Ini",
      "Rekor Terbaik",
      "Konsistensi 30 Hari (%)",
      "Status Otomatisasi",
      "Pemicu (Cue)",
      "Aturan 2 Menit",
      "Tanggal Dibuat",
      "Daftar Tanggal Check-in",
    ];

    const rows = habits.map((h) => {
      const streak = calculateStreak(h.completedDates);
      const past30 = h.completedDates.filter((d) => d >= thirtyDaysAgoKey && d <= todayKey).length;
      const rate30 = Math.round((past30 / 30) * 100);

      let status = "Langkah Awal (< 7 hari)";
      if (streak.current >= 66) status = "Otomatis Refleks (>= 66 hari)";
      else if (streak.current >= 21) status = "Membangun Pola (21-65 hari)";
      else if (streak.current >= 7) status = "Fase Pembiasaan (7-20 hari)";

      return [
        `"${h.title.replace(/"/g, '""')}"`,
        `"${h.routineTime}"`,
        `"${h.frequency}"`,
        `"${h.targetCount} ${h.unit || "kali"}"`,
        h.completedDates.length,
        streak.current,
        Math.max(h.streakBest, streak.best),
        `"${rate30}%"`,
        `"${status}"`,
        `"${(h.cue || "").replace(/"/g, '""')}"`,
        `"${(h.twoMinuteRule || "").replace(/"/g, '""')}"`,
        `"${h.createdAt}"`,
        `"${h.completedDates.join("; ")}"`,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan-konsistensi-biarfokus-${todayKey}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export JSON Backup Handler
  const handleExportJson = () => {
    if (habits.length === 0) {
      setNoticeModal({
        isOpen: true,
        title: "Belum Ada Data Kebiasaan",
        message: "Belum ada data kebiasaan yang dapat diekspor ke format JSON. Silakan buat kebiasaan pertama Anda terlebih dahulu.",
      });
      return;
    }

    const payload = {
      app: "BiarFokus Habit Tracker",
      version: "1.0",
      exportedAt: new Date().toISOString(),
      stats: {
        totalHabits: stats.totalHabits,
        allTimeCheckins: stats.allTimeCheckins,
        bestCurrentStreak: stats.bestCurrentStreak,
        todayRatePercent: stats.todayRatePercent,
        average30DayRate,
      },
      habits,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup-kebiasaan-biarfokus-${todayKey}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print Report Handler
  const handlePrint = () => {
    if (habits.length === 0) {
      setNoticeModal({
        isOpen: true,
        title: "Belum Ada Data Laporan",
        message: "Tambahkan minimal satu kebiasaan aktif agar BiarFokus dapat mengompilasi lembar laporan konsistensi resmi untuk Anda.",
      });
      return;
    }
    setReportModalOpen(true);
  };

  return (
    <div className="habits-heatmap-view-container">
      {/* View Header Bar with Macro Title & Export Group */}
      <div className="habits-view-header-bar">
        <div className="view-header-title-col">
          <h2 className="view-header-heading">Peta Konsistensi & Analisis Makro</h2>
          <span className="view-header-sub">
            Gambaran besar statistik pembentukan kebiasaan, milestone pencapaian, visualisasi 90 hari, dan ekspor data komitmen.
          </span>
        </div>

        <div className="habits-macro-header-actions">
          {/* Export & Print Button Group */}
          <div className="habits-export-group">
            <button
              type="button"
              className="habits-export-btn"
              onClick={handleExportCsv}
              title="Ekspor Laporan Rinci ke Spreadsheet (CSV)"
            >
              <span className="export-btn-icon">📊</span>
              <span>Ekspor CSV</span>
            </button>
            <button
              type="button"
              className="habits-export-btn"
              onClick={handleExportJson}
              title="Cadangkan Data Lengkap (JSON Backup)"
            >
              <span className="export-btn-icon">💾</span>
              <span>Backup JSON</span>
            </button>
            <button
              type="button"
              className="habits-export-btn print-btn"
              onClick={handlePrint}
              title="Cetak atau Simpan Dokumen Laporan (PDF)"
            >
              <span className="export-btn-icon">🖨️</span>
              <span>Cetak Laporan</span>
            </button>
          </div>

          <button
            type="button"
            className="primary-button habits-add-new-btn"
            onClick={onOpenCreateModal}
            title="Tambah Kebiasaan Baru"
          >
            <span className="btn-plus-icon">+</span>
            <span>Kebiasaan Baru</span>
          </button>
        </div>
      </div>

      {/* 4 Macro KPI Cards */}
      <section className="habits-stats-grid" aria-label="Gambaran Besar Statistik Kebiasaan">
        <div className="habit-stat-card">
          <span className="stat-card-icon">🎯</span>
          <div className="stat-card-info">
            <span className="stat-card-value">
              {stats.completedTodayCount}/{stats.totalHabits}
            </span>
            <span className="stat-card-label">Selesai Hari Ini</span>
            <span className="stat-card-sub">
              {stats.todayRatePercent}% komitmen harian tuntas
            </span>
          </div>
          <div className="stat-card-progress-bar">
            <div
              className="stat-card-progress-fill"
              style={{ width: `${stats.todayRatePercent}%` }}
            />
          </div>
        </div>

        <div className="habit-stat-card">
          <span className="stat-card-icon">🔥</span>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats.bestCurrentStreak} Hari</span>
            <span className="stat-card-label">Streak Beruntun Tertinggi</span>
            <span className="stat-card-sub">Rekor tanpa bolong terpanjang</span>
          </div>
        </div>

        <div className="habit-stat-card">
          <span className="stat-card-icon">📈</span>
          <div className="stat-card-info">
            <span className="stat-card-value">{average30DayRate}%</span>
            <span className="stat-card-label">Konsistensi 30 Hari</span>
            <span className="stat-card-sub">Rata-rata disiplin seluruh kebiasaan</span>
          </div>
          <div className="stat-card-progress-bar">
            <div
              className="stat-card-progress-fill"
              style={{ width: `${average30DayRate}%` }}
            />
          </div>
        </div>

        <div className="habit-stat-card">
          <span className="stat-card-icon">✨</span>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats.allTimeCheckins}</span>
            <span className="stat-card-label">Total Check-In Berhasil</span>
            <span className="stat-card-sub">Akumulasi komitmen seumur hidup</span>
          </div>
        </div>
      </section>

      {/* Hero Visual Heatmap: 90-Day GitHub-style Consistency Map */}
      <section className="habits-heatmap-section">
        <HabitHeatmap heatmap={heatmap} allTimeCheckins={stats.allTimeCheckins} />
      </section>

      {/* 66-Day Habit Automaticity Milestone Card (Dr. Phillippa Lally rule) */}
      <section className="habits-automaticity-card" aria-label="Milestone Otomatisasi 66 Hari">
        <div className="auto-card-left">
          <div className="auto-badge-icon">🧠</div>
          <div className="auto-card-text">
            <h4>Threshold Otomatisasi Otak (Riset 66 Hari)</h4>
            <p>
              Riset ilmiah Dr. Phillippa Lally (University College London) membuktikan bahwa rata-rata dibutuhkan 66 hari pengulangan agar suatu kebiasaan mencapai titik otomatisasi saraf tanpa membutuhkan willpower ekstra.
            </p>
          </div>
        </div>

        <div className="auto-progress-col">
          <div className="auto-progress-header">
            <span>Progress Menuju Otomatis: {bestStreak}/66 Hari</span>
            <span className="auto-percent-val">{automaticityPercent}%</span>
          </div>
          <div className="auto-progress-track">
            <div
              className="auto-progress-fill"
              style={{ width: `${automaticityPercent}%` }}
            />
          </div>
        </div>
      </section>

      {/* Gamified Achievements & Milestone Badges */}
      <section className="habits-achievements-card" aria-label="Pencapaian & Lencana Konsistensi">
        <div className="achievements-card-top">
          <div className="achievements-title-group">
            <h3 className="achievements-heading">
              <span>🏆</span>
              <span>Pencapaian & Lencana Konsistensi</span>
            </h3>
            <span className="achievements-sub">
              Buka lencana kehormatan seiring dengan bertambahnya konsistensi dan streak harianmu.
            </span>
          </div>

          <div className="achievements-badge-counter">
            <span className="counter-icon">🎖️</span>
            <strong>{unlockedCount} dari {achievements.length}</strong>
            <span>Lencana Terbuka</span>
          </div>
        </div>

        <div className="habits-achievements-grid">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`habit-badge-card ${ach.isUnlocked ? "is-unlocked" : "is-locked"}`}
            >
              <div className="badge-card-header">
                <span className="badge-card-icon">{ach.icon}</span>
                <span className={`badge-status-pill ${ach.isUnlocked ? "unlocked" : "locked"}`}>
                  {ach.isUnlocked ? "🏆 Terbuka" : "🔒 Terkunci"}
                </span>
              </div>

              <div className="badge-card-content">
                <h4 className="badge-card-title">{ach.title}</h4>
                <p className="badge-card-desc">{ach.desc}</p>
              </div>

              <div className="badge-progress-wrap">
                <div className="badge-progress-info">
                  <span className="badge-progress-label">Progress</span>
                  <span className="badge-progress-text">{ach.progressText}</span>
                </div>
                <div className="badge-progress-track">
                  <div
                    className="badge-progress-fill"
                    style={{ width: `${ach.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Macro Habit Performance Breakdown Table with Edit Action */}
      <section className="habits-macro-table-card" aria-label="Rincian Performa Tiap Kebiasaan">
        <div className="macro-table-header">
          <div className="macro-table-title-group">
            <h3 className="macro-table-heading">
              <span>📋</span>
              <span>Rincian & Evaluasi Tiap Kebiasaan</span>
            </h3>
            <span className="macro-table-sub">
              Daftar statistik komprehensif, performa streak, tingkat disiplin 30 hari, dan fase otomatisasi.
            </span>
          </div>

          <div className="macro-table-filters" role="tablist" aria-label="Filter Rutinitas Kebiasaan">
            <button
              type="button"
              className={`macro-filter-btn ${tableRoutineFilter === "all" ? "is-active" : ""}`}
              onClick={() => setTableRoutineFilter("all")}
            >
              <span>Semua</span>
              <span className="macro-filter-count">{routineCounts.all}</span>
            </button>
            <button
              type="button"
              className={`macro-filter-btn ${tableRoutineFilter === "morning" ? "is-active" : ""}`}
              onClick={() => setTableRoutineFilter("morning")}
            >
              <span>🌅 Pagi</span>
              <span className="macro-filter-count">{routineCounts.morning}</span>
            </button>
            <button
              type="button"
              className={`macro-filter-btn ${tableRoutineFilter === "afternoon" ? "is-active" : ""}`}
              onClick={() => setTableRoutineFilter("afternoon")}
            >
              <span>☀️ Siang</span>
              <span className="macro-filter-count">{routineCounts.afternoon}</span>
            </button>
            <button
              type="button"
              className={`macro-filter-btn ${tableRoutineFilter === "evening" ? "is-active" : ""}`}
              onClick={() => setTableRoutineFilter("evening")}
            >
              <span>🌙 Malam</span>
              <span className="macro-filter-count">{routineCounts.evening}</span>
            </button>
            <button
              type="button"
              className={`macro-filter-btn ${tableRoutineFilter === "anytime" ? "is-active" : ""}`}
              onClick={() => setTableRoutineFilter("anytime")}
            >
              <span>⚡ Fleksibel</span>
              <span className="macro-filter-count">{routineCounts.anytime}</span>
            </button>
          </div>
        </div>

        {habits.length === 0 ? (
          <div className="macro-table-empty">
            <p>Belum ada kebiasaan yang dibuat.</p>
          </div>
        ) : filteredTableHabits.length === 0 ? (
          <div className="macro-table-empty">
            <p>Tidak ada kebiasaan untuk filter rutinitas yang dipilih.</p>
          </div>
        ) : (
          <div className="habits-macro-table-wrap">
            <table className="habits-macro-table" aria-label="Tabel Evaluasi Kebiasaan">
              <thead>
                <tr>
                  <th className="macro-th-habit">Kebiasaan</th>
                  <th className="macro-th-routine">Rutinitas</th>
                  <th className="macro-th-total">Total Check-In</th>
                  <th className="macro-th-streak">Streak Aktif</th>
                  <th className="macro-th-best">Rekor Terbaik</th>
                  <th className="macro-th-rate">Disiplin 30 Hari</th>
                  <th className="macro-th-status">Fase Otomatisasi</th>
                  {onEdit && <th className="macro-th-action">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {filteredTableHabits.map((habit) => {
                  const streak = calculateStreak(habit.completedDates);
                  const past30Count = habit.completedDates.filter(
                    (d) => d >= thirtyDaysAgoKey && d <= todayKey
                  ).length;
                  const rate30 = Math.round((past30Count / 30) * 100);

                  // Automaticity phase
                  let phaseLabel = "Langkah Awal";
                  let phaseClass = "phase-initial";
                  if (streak.current >= 66) {
                    phaseLabel = "🧠 Refleks Otomatis";
                    phaseClass = "phase-automatic";
                  } else if (streak.current >= 21) {
                    phaseLabel = "⚡ Membangun Pola";
                    phaseClass = "phase-building";
                  } else if (streak.current >= 7) {
                    phaseLabel = "🌱 Fase Pembiasaan";
                    phaseClass = "phase-forming";
                  }

                  return (
                    <tr key={habit.id} className="macro-table-row">
                      <td className="macro-td-habit">
                        <div
                          className={`macro-habit-cell ${onEdit ? "is-clickable" : ""}`}
                          onClick={() => onEdit?.(habit)}
                          title={onEdit ? `Klik untuk edit ${habit.title}` : habit.title}
                          role={onEdit ? "button" : undefined}
                          tabIndex={onEdit ? 0 : undefined}
                        >
                          <span
                            className="macro-habit-icon"
                            style={{
                              background: `color-mix(in srgb, ${habit.color} 15%, var(--paper))`,
                            }}
                          >
                            {habit.icon || "✨"}
                          </span>
                          <span className="macro-habit-title" title={habit.title}>
                            {habit.title}
                          </span>
                        </div>
                      </td>

                      <td className="macro-td-routine">
                        <span className="macro-routine-badge">
                          {habit.routineTime === "morning" && "🌅 Pagi"}
                          {habit.routineTime === "afternoon" && "☀️ Siang"}
                          {habit.routineTime === "evening" && "🌙 Malam"}
                          {habit.routineTime === "anytime" && "⚡ Fleksibel"}
                        </span>
                      </td>

                      <td className="macro-td-total">
                        <span className="macro-total-pill">
                          {habit.completedDates.length} kali
                        </span>
                      </td>

                      <td className="macro-td-streak">
                        <span
                          className={`macro-streak-pill ${streak.current > 0 ? "has-streak" : ""}`}
                        >
                          🔥 {streak.current} Hari
                        </span>
                      </td>

                      <td className="macro-td-best">
                        <span className="macro-best-pill">
                          ⭐ {Math.max(habit.streakBest, streak.best)} Hari
                        </span>
                      </td>

                      <td className="macro-td-rate">
                        <div className="macro-rate-cell">
                          <span className="macro-rate-text">{rate30}%</span>
                          <div className="macro-rate-bar">
                            <div
                              className="macro-rate-fill"
                              style={{ width: `${rate30}%`, background: habit.color }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="macro-td-status">
                        <span className={`macro-phase-badge ${phaseClass}`}>
                          {phaseLabel}
                        </span>
                      </td>

                      {onEdit && (
                        <td className="macro-td-action">
                          <button
                            type="button"
                            className="macro-edit-btn"
                            onClick={() => onEdit(habit)}
                            title={`Edit ${habit.title}`}
                            aria-label={`Edit ${habit.title}`}
                          >
                            <span>✏️</span>
                            <span>Edit</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Smart Consistency Insights & Macro Performance */}
      {habits.length > 0 && (
        <section className="habits-smart-insights-section" aria-label="Analisis Konsistensi Cerdas">
          <div className="insights-section-title-group">
            <h3 className="insights-section-heading">
              <span>🧠</span>
              <span>Analisis & Rekomendasi Konsistensi</span>
            </h3>
            <span className="insights-section-sub">
              Sintesis otomatis dari ritme harianmu untuk mempercepat otomatisasi kebiasaan dan menjaga momentum.
            </span>
          </div>

          <div className="habits-insights-grid">
            {championHabit && (
              <div className="habit-insight-card champion">
                <div className="insight-card-head">
                  <span className="insight-badge">🌟 Juara Konsistensi</span>
                  <span className="insight-icon">{championHabit.icon || "👑"}</span>
                </div>
                <h4 className="insight-card-title">{championHabit.title}</h4>
                <p className="insight-card-desc">
                  Mencapai streak aktif <strong>{calculateStreak(championHabit.completedDates).current} hari</strong> dengan total <strong>{championHabit.completedDates.length} kali check-in</strong>. Terus pertahankan ritme ini sebagai fondasi utama harimu!
                </p>
                <div className="insight-card-meta">
                  <span>
                    Rutinitas:{" "}
                    {championHabit.routineTime === "morning"
                      ? "Pagi"
                      : championHabit.routineTime === "afternoon"
                      ? "Siang"
                      : championHabit.routineTime === "evening"
                      ? "Malam"
                      : "Fleksibel"}
                  </span>
                  <span>
                    Disiplin 30 Hari:{" "}
                    {Math.round(
                      (championHabit.completedDates.filter(
                        (d) => d >= thirtyDaysAgoKey && d <= todayKey
                      ).length /
                        30) *
                        100
                    )}
                    %
                  </span>
                </div>
              </div>
            )}

            {opportunityHabit && (
              <div className="habit-insight-card opportunity">
                <div className="insight-card-head">
                  <span className="insight-badge">💡 Peluang Penguatan</span>
                  <span className="insight-icon">{opportunityHabit.icon || "🌱"}</span>
                </div>
                <h4 className="insight-card-title">{opportunityHabit.title}</h4>
                <p className="insight-card-desc">
                  Tingkat konsistensi memerlukan perhatian khusus (disiplin 30 hari:{" "}
                  <strong>
                    {Math.round(
                      (opportunityHabit.completedDates.filter(
                        (d) => d >= thirtyDaysAgoKey && d <= todayKey
                      ).length /
                        30) *
                        100
                    )}
                    %
                  </strong>
                  ). Coba sederhanakan dengan <em>Aturan 2 Menit</em> atau tautkan dengan kebiasaan yang sudah rutin.
                </p>
                <div className="insight-card-meta">
                  <span>Pemicu: {opportunityHabit.cue || "Belum ditentukan"}</span>
                  <span style={{ color: "#d97706" }}>Area Fokus Utama</span>
                </div>
              </div>
            )}

            <div className="habit-insight-card investment">
              <div className="insight-card-head">
                <span className="insight-badge">⏱️ Investasi Disiplin Diri</span>
                <span className="insight-icon">⏳</span>
              </div>
              <h4 className="insight-card-title">
                {estimatedInvestmentMinutes >= 60
                  ? `~${(estimatedInvestmentMinutes / 60).toFixed(1)} Jam Pertumbuhan`
                  : `~${estimatedInvestmentMinutes} Menit Pertumbuhan`}
              </h4>
              <p className="insight-card-desc">
                Total perkiraan waktu yang telah kamu investasikan untuk perbaikan diri dari{" "}
                <strong>{stats.allTimeCheckins} kali check-in</strong>. Perubahan 1% setiap hari berlipat ganda menjadi hasil luar biasa.
              </p>
              <div className="insight-card-meta">
                <span>Rata-rata Disiplin Global: {average30DayRate}%</span>
                <span>
                  {automaticityPercent >= 100
                    ? "Refleks Otomatis Tercapai"
                    : `${automaticityPercent}% Menuju Otomatis`}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Atomic Habits 4 Laws Philosophy Cards */}
      <section className="habits-philosophy-grid" aria-label="4 Kaidah Pembentukan Kebiasaan">
        <div className="habits-law-card">
          <div className="law-badge">Hukum 1</div>
          <h4>Jadikan Jelas (Make it Obvious)</h4>
          <p>
            Gunakan formula <em>Habit Stacking</em>: hubungkan kebiasaan baru tepat setelah kebiasaan lama yang sudah otomatis kamu lakukan.
          </p>
        </div>
        <div className="habits-law-card">
          <div className="law-badge">Hukum 2</div>
          <h4>Jadikan Menarik (Make it Attractive)</h4>
          <p>
            Fokus pada pembentukan identitas: bukan sekadar apa yang ingin dicapai, melainkan menjadi orang seperti apa kamu ingin bertransformasi.
          </p>
        </div>
        <div className="habits-law-card">
          <div className="law-badge">Hukum 3</div>
          <h4>Jadikan Mudah (Make it Easy)</h4>
          <p>
            Terapkan <em>Aturan 2 Menit</em>: buat langkah awal sekecil mungkin agar otak tidak merasa terbebani untuk memulai.
          </p>
        </div>
        <div className="habits-law-card">
          <div className="law-badge">Hukum 4</div>
          <h4>Jadikan Memuaskan (Make it Satisfying)</h4>
          <p>
            Pantau dan ceklis setiap hari. Kepuasan visual dan audio instan menjaga motivasi bawah sadar untuk terus konsisten.
          </p>
        </div>
      </section>

      {/* Printable Consistency Report Modal */}
      <HabitsReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        habits={habits}
        stats={stats}
        userName={userName}
        heatmap={heatmap}
      />

      {/* Modern Notice / Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(noticeModal?.isOpen)}
        title={noticeModal?.title || "Pemberitahuan"}
        message={noticeModal?.message || ""}
        itemName={noticeModal?.itemName}
        itemSubtext={noticeModal?.itemSubtext}
        confirmLabel="Mengerti"
        variant="info"
        hideCancel
        onConfirm={() => setNoticeModal(null)}
        onCancel={() => setNoticeModal(null)}
      />
    </div>
  );
}
