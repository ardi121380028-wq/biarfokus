"use client";

import type { HabitStats, HeatmapDay } from "@/features/habits/habit-types";
import { HabitHeatmap } from "./habit-heatmap";

interface HabitsHeatmapViewProps {
  stats: HabitStats;
  heatmap: HeatmapDay[];
  onOpenCreateModal: () => void;
}

export function HabitsHeatmapView({
  stats,
  heatmap,
  onOpenCreateModal,
}: HabitsHeatmapViewProps) {
  return (
    <div className="habits-heatmap-view-container">
      {/* 4 Summary Stats Cards */}
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

      {/* James Clear Danger Alert: Never Miss Twice */}
      {stats.neverMissTwiceAlerts > 0 && (
        <aside className="habits-danger-banner" role="alert">
          <span className="banner-alert-icon">⚠️</span>
          <div className="banner-alert-content">
            <strong>Peringatan James Clear (Aturan Pantang Bolong Dua Kali):</strong>
            <span>
              Ada <strong>{stats.neverMissTwiceAlerts} kebiasaan</strong> yang terlewat kemarin dan belum selesai hari ini. Selesaikan sekarang agar tidak membentuk kebiasaan buruk baru!
            </span>
          </div>
        </aside>
      )}

      {/* 90-Day Visual Heatmap */}
      <section className="habits-heatmap-section">
        <HabitHeatmap heatmap={heatmap} allTimeCheckins={stats.allTimeCheckins} />
      </section>

      {/* Atomic Habits 4 Laws Philosophy Card */}
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
