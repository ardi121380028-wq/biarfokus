"use client";

import { useMemo } from "react";
import type { Habit, HabitStats, HeatmapDay } from "@/features/habits/habit-types";
import { getTodayKey, calculateStreak } from "@/features/habits/habit-service";
import { HabitHeatmap } from "./habit-heatmap";

interface HabitsHeatmapViewProps {
  stats: HabitStats;
  heatmap: HeatmapDay[];
  habits?: Habit[];
  onToggleCheckin?: (habitId: string, dateKey?: string) => void;
  onOpenCreateModal: () => void;
}

export function HabitsHeatmapView({
  stats,
  heatmap,
  habits = [],
  onToggleCheckin,
  onOpenCreateModal,
}: HabitsHeatmapViewProps) {
  const todayKey = getTodayKey();

  // Pending habits for today (needs reminder)
  const pendingHabits = useMemo(() => {
    return habits.filter((h) => !h.completedDates.includes(todayKey));
  }, [habits, todayKey]);

  // Habits at critical risk of missing twice (missed yesterday & not yet done today)
  const atRiskHabits = useMemo(() => {
    return habits.filter((h) => {
      const streakInfo = calculateStreak(h.completedDates);
      return streakInfo.isAtRiskOfMissingTwice;
    });
  }, [habits]);

  // Longest streak habit for automaticity milestone (Dr. Phillippa Lally 66-day rule)
  const bestStreak = stats.bestCurrentStreak;
  const automaticityPercent = Math.min(100, Math.round((bestStreak / 66) * 100));

  return (
    <div className="habits-heatmap-view-container">
      {/* View Header Bar */}
      <div className="habits-view-header-bar">
        <div className="view-header-title-col">
          <h2 className="view-header-heading">Peta Konsistensi & Pengingat</h2>
          <span className="view-header-sub">
            Evaluasi frekuensi 90 hari, selamatkan streak aktif, dan bentuk kebiasaan otomatis 1%.
          </span>
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

      {/* 4 Top KPI Stats Cards */}
      <section className="habits-stats-grid" aria-label="Ringkasan Statistik Kebiasaan">
        <div className="habit-stat-card">
          <span className="stat-card-icon">🎯</span>
          <div className="stat-card-info">
            <span className="stat-card-value">
              {stats.completedTodayCount}/{stats.totalHabits}
            </span>
            <span className="stat-card-label">Selesai Hari Ini</span>
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
            <span className="stat-card-label">Streak Beruntun Aktif</span>
          </div>
        </div>

        <div className="habit-stat-card">
          <span className="stat-card-icon">📈</span>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats.todayRatePercent}%</span>
            <span className="stat-card-label">Tingkat Disiplin Hari Ini</span>
          </div>
        </div>

        <div className="habit-stat-card">
          <span className="stat-card-icon">✨</span>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats.allTimeCheckins}</span>
            <span className="stat-card-label">Total Check-In Berhasil</span>
          </div>
        </div>
      </section>

      {/* Emergency Rescue: Never Miss Twice Danger Card */}
      {atRiskHabits.length > 0 && (
        <aside className="habits-urgent-rescue-card" role="alert">
          <div className="rescue-card-top">
            <span className="rescue-icon">⚠️</span>
            <div className="rescue-header-text">
              <h4>Peringatan Darurat James Clear: Pantang Bolong Dua Kali</h4>
              <p>
                Bolong sekali adalah ketidaksengajaan, tapi bolong dua kali adalah awal dari kebiasaan buruk yang baru. Selesaikan kebiasaan di bawah ini sekarang untuk menyelamatkan streak!
              </p>
            </div>
          </div>
          <div className="rescue-habits-row">
            {atRiskHabits.map((habit) => (
              <div key={habit.id} className="rescue-habit-pill">
                <span>{habit.icon || "✨"}</span>
                <span>{habit.title}</span>
                {onToggleCheckin && (
                  <button
                    type="button"
                    className="rescue-btn"
                    onClick={() => onToggleCheckin(habit.id, todayKey)}
                  >
                    Selamatkan Streak ✓
                  </button>
                )}
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* Interactive Reminder Hub: Today's Pending Habits Checklist */}
      <section className="habits-reminders-card" aria-label="Pengingat Kebiasaan Hari Ini">
        <div className="reminders-card-top">
          <div className="reminders-card-title-group">
            <h3 className="reminders-card-heading">
              <span>🔔</span>
              <span>Pusat Pengingat & Akuntabilitas Hari Ini</span>
            </h3>
            <span className="reminders-card-sub">
              Daftar kebiasaan yang membutuhkan perhatianmu hari ini agar konsistensi 1% tetap terjaga.
            </span>
          </div>

          <span
            className={`reminders-pending-badge ${pendingHabits.length === 0 ? "all-done" : ""}`}
          >
            {pendingHabits.length === 0
              ? "Semua Tuntas! 🎉"
              : `${pendingHabits.length} Belum Selesai`}
          </span>
        </div>

        {pendingHabits.length === 0 ? (
          <div className="reminders-all-done-box">
            <span className="all-done-icon">🎉</span>
            <div className="all-done-content">
              <h4>Luar Biasa! Semua Kebiasaan Hari Ini Tuntas</h4>
              <p>
                Kamu sudah menyelesaikan seluruh komitmenmu hari ini. Nikmati istirahatmu dan pertahankan momentum 1% lebih baik besok!
              </p>
            </div>
          </div>
        ) : (
          <div className="reminders-list">
            {pendingHabits.map((h) => (
              <div key={h.id} className="reminder-item-card">
                <div className="reminder-item-left">
                  <span
                    className="reminder-icon-box"
                    style={{
                      background: `color-mix(in srgb, ${h.color} 15%, var(--paper))`,
                    }}
                  >
                    {h.icon || "✨"}
                  </span>

                  <div className="reminder-info">
                    <div className="reminder-title-row">
                      <strong className="reminder-title">{h.title}</strong>
                      <span className="reminder-time-tag">
                        {h.routineTime === "morning" && "🌅 Pagi"}
                        {h.routineTime === "afternoon" && "☀️ Siang"}
                        {h.routineTime === "evening" && "🌙 Malam"}
                        {h.routineTime === "anytime" && "⚡ Fleksibel"}
                      </span>
                    </div>

                    <div className="reminder-cues">
                      {h.cue && (
                        <span>
                          🔗 <span className="reminder-cue-text">{h.cue}</span>
                        </span>
                      )}
                      {h.twoMinuteRule && (
                        <span>
                          ⚡ <span className="reminder-cue-text">2 Menit: {h.twoMinuteRule}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {onToggleCheckin && (
                  <button
                    type="button"
                    className="reminder-quick-check-btn"
                    onClick={() => onToggleCheckin(h.id, todayKey)}
                    title={`Tandai selesai untuk ${h.title}`}
                  >
                    <span>✓</span>
                    <span>Ceklis Sekarang</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 66-Day Habit Automaticity Milestone Card */}
      <section className="habits-automaticity-card" aria-label="Milestone Otomatisasi 66 Hari">
        <div className="auto-card-left">
          <div className="auto-badge-icon">🧠</div>
          <div className="auto-card-text">
            <h4>Milestone Menuju Kebiasaan Otomatis (Threshold 66 Hari)</h4>
            <p>
              Riset ilmiah Dr. Phillippa Lally (University College London) membuktikan bahwa otak butuh rata-rata 66 hari pengulangan agar suatu kebiasaan menjadi refleks bawah sadar tanpa beban willpower.
            </p>
          </div>
        </div>

        <div className="auto-progress-col">
          <div className="auto-progress-header">
            <span>Progress: {bestStreak}/66 Hari</span>
            <span>{automaticityPercent}%</span>
          </div>
          <div className="auto-progress-track">
            <div
              className="auto-progress-fill"
              style={{ width: `${automaticityPercent}%` }}
            />
          </div>
        </div>
      </section>

      {/* 90-Day Visual Heatmap */}
      <section className="habits-heatmap-section">
        <HabitHeatmap heatmap={heatmap} allTimeCheckins={stats.allTimeCheckins} />
      </section>

      {/* Atomic Habits 4 Laws Philosophy Cards */}
      <section className="habits-philosophy-grid">
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
    </div>
  );
}
