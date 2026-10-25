"use client";

import { useState } from "react";
import Link from "next/link";
import { useHabits } from "@/features/habits/use-habits";
import { HabitCard } from "./habit-card";
import { HabitHeatmap } from "./habit-heatmap";
import { HabitModal } from "./habit-modal";
import type { Habit, RoutineTime } from "@/features/habits/habit-types";

interface HabitsWorkspaceViewProps {
  userId?: string | null;
}

export function HabitsWorkspaceView({ userId }: HabitsWorkspaceViewProps) {
  const {
    filteredHabits,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    stats,
    heatmap,
    toggleCheckin,
    addHabit,
    updateHabit,
    deleteHabit,
  } = useHabits(userId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const handleOpenAdd = () => {
    setEditingHabit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setModalOpen(true);
  };

  const handleSaveModal = (data: Omit<Habit, "id" | "completedDates" | "streakCurrent" | "streakBest" | "createdAt">) => {
    if (editingHabit) {
      updateHabit(editingHabit.id, data);
    } else {
      addHabit(data);
    }
  };

  return (
    <div className="habits-workspace-container">
      {/* Workspace Header & Productivity Overview */}
      <header className="habits-workspace-header">
        <div className="habits-header-main">
          <div className="habits-title-badge">
            <span>⚡ Atomic Habits System</span>
          </div>
          <h1 className="habits-page-title">Pelacak Kebiasaan Saintifik</h1>
          <p className="habits-page-subtitle">
            Raih kemajuan 1% setiap hari dengan pembentukan identitas, habit stacking, dan aturan pantang bolong dua kali dari James Clear.
          </p>
        </div>

        <div className="habits-header-actions">
          <button
            type="button"
            className="secondary-button habits-toggle-heatmap-btn"
            onClick={() => setShowHeatmap(!showHeatmap)}
          >
            {showHeatmap ? "Tutup Peta Konsistensi" : "📊 Lihat Heatmap Konsistensi"}
          </button>
          <button
            type="button"
            className="primary-button habits-add-btn"
            onClick={handleOpenAdd}
          >
            + Kebiasaan Baru
          </button>
        </div>
      </header>

      {/* Aggregated Stats Cards */}
      <section className="habits-stats-grid" aria-label="Ringkasan Statistik Kebiasaan">
        <div className="habit-stat-card">
          <span className="stat-card-icon">🎯</span>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats.completedTodayCount}/{stats.totalHabits}</span>
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

      {/* James Clear Danger Banner if at risk of breaking 'Never Miss Twice' */}
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

      {/* 90-Day Heatmap (Collapsible) */}
      {showHeatmap && (
        <section className="habits-heatmap-section">
          <HabitHeatmap heatmap={heatmap} allTimeCheckins={stats.allTimeCheckins} />
        </section>
      )}

      {/* Filter and Search Bar */}
      <div className="habits-controls-bar">
        <div className="habits-filter-tabs" role="tablist" aria-label="Filter Waktu Rutinitas">
          <button
            type="button"
            className={`habits-filter-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Semua Rutinitas ({stats.totalHabits})
          </button>
          <button
            type="button"
            className={`habits-filter-tab ${filter === "morning" ? "active" : ""}`}
            onClick={() => setFilter("morning")}
          >
            🌅 Pagi
          </button>
          <button
            type="button"
            className={`habits-filter-tab ${filter === "afternoon" ? "active" : ""}`}
            onClick={() => setFilter("afternoon")}
          >
            ☀️ Siang
          </button>
          <button
            type="button"
            className={`habits-filter-tab ${filter === "evening" ? "active" : ""}`}
            onClick={() => setFilter("evening")}
          >
            🌙 Malam
          </button>
          <button
            type="button"
            className={`habits-filter-tab ${filter === "anytime" ? "active" : ""}`}
            onClick={() => setFilter("anytime")}
          >
            ⚡ Kapan Saja
          </button>
        </div>

        <div className="habits-search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            className="habits-search-input"
            placeholder="Cari kebiasaan, pemicu, identitas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Habits Grid */}
      <main className="habits-cards-grid" aria-label="Daftar Kartu Kebiasaan">
        {filteredHabits.length > 0 ? (
          filteredHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggleCheckin={toggleCheckin}
              onEdit={handleOpenEdit}
              onDelete={deleteHabit}
            />
          ))
        ) : (
          <div className="habits-empty-state">
            <span className="empty-icon">🌱</span>
            <h3>Belum ada kebiasaan di kategori ini</h3>
            <p>
              &ldquo;Kamu tidak naik ke tingkat tujuanmu. Kamu jatuh ke tingkat sistemmu.&rdquo; — James Clear
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={handleOpenAdd}
            >
              + Mulai Bangun Kebiasaan Pertama
            </button>
          </div>
        )}
      </main>

      {/* Habit Creation / Edit Modal */}
      {modalOpen && (
        <HabitModal
          initialHabit={editingHabit}
          onSave={handleSaveModal}
          onClose={() => {
            setModalOpen(false);
            setEditingHabit(null);
          }}
        />
      )}
    </div>
  );
}
