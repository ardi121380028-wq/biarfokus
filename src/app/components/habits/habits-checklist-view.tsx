"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Habit, RoutineTime } from "@/features/habits/habit-types";
import { getTodayKey, getWeeklyStrip, calculateStreak } from "@/features/habits/habit-service";

interface HabitsChecklistViewProps {
  habits: Habit[];
  onToggleCheckin: (habitId: string, dateKey?: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  onOpenCreateModal: () => void;
  activeFilter: string;
}

const ROUTINE_CONFIG: Record<RoutineTime, { title: string; icon: string; subtitle: string }> = {
  morning: {
    title: "Rutinitas Pagi",
    icon: "🌅",
    subtitle: "Mulai hari dengan kemenangan kecil dan kejelasan pikiran.",
  },
  afternoon: {
    title: "Rutinitas Siang",
    icon: "☀️",
    subtitle: "Pertahankan energi dan fokus pada pekerjaan berbobot tinggi.",
  },
  evening: {
    title: "Rutinitas Malam",
    icon: "🌙",
    subtitle: "Lepas lelah, refleksi hal positif, dan siapkan istirahat berkualitas.",
  },
  anytime: {
    title: "Kapan Saja",
    icon: "⚡",
    subtitle: "Kebiasaan fleksibel yang bisa dieksekusi sepanjang hari.",
  },
};

const SHORT_DAY_NAMES: Record<string, string> = {
  Sen: "Sn",
  Sel: "Sl",
  Rab: "Rb",
  Kam: "Km",
  Jum: "Jm",
  Sab: "Sb",
  Min: "Mg",
};

export function HabitsChecklistView({
  habits,
  onToggleCheckin,
  onEdit,
  onDelete,
  onOpenCreateModal,
  activeFilter,
}: HabitsChecklistViewProps) {
  const todayKey = getTodayKey();

  // Group habits by routine time
  const grouped = useMemo(() => {
    const routineOrder: RoutineTime[] = ["morning", "afternoon", "evening", "anytime"];
    const groups: { routine: RoutineTime; items: Habit[] }[] = [];

    routineOrder.forEach((routine) => {
      if (activeFilter === "all" || activeFilter === routine) {
        const items = habits.filter((h) => h.routineTime === routine);
        if (items.length > 0 || activeFilter === routine) {
          groups.push({ routine, items });
        }
      }
    });

    return groups;
  }, [habits, activeFilter]);

  if (habits.length === 0) {
    return (
      <div className="habits-empty-state-card">
        <span className="empty-state-icon">🌱</span>
        <h3>Belum ada kebiasaan di daftar ini</h3>
        <p>
          &ldquo;Kamu tidak naik ke tingkat tujuanmu. Kamu jatuh ke tingkat sistemmu.&rdquo; — James Clear, <em>Atomic Habits</em>
        </p>
        <button
          type="button"
          className="primary-button habits-empty-create-btn"
          onClick={onOpenCreateModal}
        >
          + Mulai Bangun Kebiasaan Pertama
        </button>
      </div>
    );
  }

  return (
    <div className="habits-checklist-container">
      {/* Top Header Bar with prominent + Kebiasaan Baru button */}
      <div className="habits-view-header-bar">
        <div className="view-header-title-col">
          <h2 className="view-header-heading">Ceklis Kebiasaan Hari Ini</h2>
          <span className="view-header-sub">Fokus selesaikan komitmen harian satu per satu dan bangun momentum 1%.</span>
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

      {grouped.map(({ routine, items }) => {
        const config = ROUTINE_CONFIG[routine];
        const completedCount = items.filter((h) => h.completedDates.includes(todayKey)).length;
        const totalCount = items.length;
        const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        const isAllDone = totalCount > 0 && completedCount === totalCount;

        return (
          <section key={routine} className="habits-routine-section" aria-label={config.title}>
            {/* Section Header */}
            <div className="habits-routine-header">
              <div className="habits-routine-title-wrap">
                <span className="habits-routine-icon">{config.icon}</span>
                <div className="habits-routine-text">
                  <h3 className="habits-routine-heading">{config.title}</h3>
                  <span className="habits-routine-sub">{config.subtitle}</span>
                </div>
              </div>

              <div className="habits-routine-progress-wrap">
                <div className="habits-routine-progress-badge">
                  <span>{completedCount} / {totalCount} Selesai</span>
                  <span className="progress-percent">({percent}%)</span>
                </div>
                <div className="habits-routine-progress-track">
                  <div
                    className="habits-routine-progress-fill"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* All Done Celebration Banner */}
            {isAllDone && (
              <div className="habits-routine-completed-banner">
                <span className="banner-sparkle">🎉</span>
                <span>Semua {config.title.toLowerCase()} tuntas hari ini! Kerja bagus, pertahankan ritmemu.</span>
              </div>
            )}

            {/* Checklist Rows List */}
            <div className="habits-checklist-list">
              {items.map((habit) => (
                <HabitChecklistRow
                  key={habit.id}
                  habit={habit}
                  todayKey={todayKey}
                  onToggleCheckin={onToggleCheckin}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

interface HabitChecklistRowProps {
  habit: Habit;
  todayKey: string;
  onToggleCheckin: (habitId: string, dateKey?: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
}

function HabitChecklistRow({
  habit,
  todayKey,
  onToggleCheckin,
  onEdit,
  onDelete,
}: HabitChecklistRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isDoneToday = habit.completedDates.includes(todayKey);

  const weeklyStrip = useMemo(() => {
    return getWeeklyStrip(habit);
  }, [habit]);

  const streakInfo = useMemo(() => {
    return calculateStreak(habit.completedDates);
  }, [habit.completedDates]);

  const hasCues = Boolean(
    habit.cue ||
    habit.identity ||
    habit.twoMinuteRule ||
    habit.linkedPomodoroMinutes ||
    (streakInfo.isAtRiskOfMissingTwice && !isDoneToday)
  );

  return (
    <div
      className={`habit-check-row ${isDoneToday ? "is-done" : ""}`}
      style={{ "--habit-accent": habit.color } as React.CSSProperties}
    >
      {/* Top Line: Checkbox, Icon, Title, Streak, Actions */}
      <div className="habit-row-top-line">
        {/* 1-Click Interactive Round Checkbox */}
        <button
          type="button"
          className={`habit-round-checkbox ${isDoneToday ? "checked" : ""}`}
          onClick={() => onToggleCheckin(habit.id, todayKey)}
          aria-label={isDoneToday ? `Batalkan ceklis ${habit.title}` : `Ceklis ${habit.title} selesai hari ini`}
          title={isDoneToday ? "Selesai! Klik untuk membatalkan" : "Klik untuk menandai selesai hari ini"}
        >
          {isDoneToday ? (
            <svg
              className="checkmark-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <span className="uncheck-dot" />
          )}
        </button>

        {/* Habit Icon Pill */}
        <div
          className="habit-row-icon"
          style={{
            background: `color-mix(in srgb, ${habit.color} 14%, var(--paper))`,
            borderColor: `color-mix(in srgb, ${habit.color} 28%, transparent)`,
          }}
        >
          <span>{habit.icon || "✨"}</span>
        </div>

        {/* Title and Done Badge */}
        <div className="habit-row-title-wrap">
          <span className={`habit-row-title ${isDoneToday ? "completed-title" : ""}`}>
            {habit.title}
          </span>
          {isDoneToday && <span className="habit-done-badge">✓ Selesai</span>}
        </div>

        {/* Top Right: Streak flame & actions */}
        <div className="habit-row-top-actions">
          <div className="habit-row-streak-col">
            <span
              className={`habit-streak-pill ${streakInfo.current > 0 ? "active-streak" : ""}`}
              title={`Streak saat ini: ${streakInfo.current} hari • Rekor terbaik: ${streakInfo.best} hari`}
            >
              <span className="streak-flame">🔥</span>
              <span className="streak-count">{streakInfo.current}</span>
              <span className="streak-unit">hr</span>
            </span>
          </div>

          <div className="habit-row-actions">
            <button
              type="button"
              className="habit-action-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu tindakan"
              title="Tindakan kebiasaan"
            >
              •••
            </button>

            {menuOpen && (
              <div className="habit-action-dropdown">
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(habit);
                  }}
                >
                  ✏️ Edit Kebiasaan
                </button>
                <button
                  type="button"
                  className="dropdown-item danger"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(habit.id);
                  }}
                >
                  🗑️ Hapus
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cues Chips Row */}
      {hasCues && (
        <div className="habit-row-cues">
          {habit.cue && (
            <span className="habit-cue-chip" title="Habit Stacking (Pemicu)">
              <span className="chip-icon">🔗</span>
              <span className="chip-text">{habit.cue}</span>
            </span>
          )}

          {habit.identity && (
            <span className="habit-identity-chip" title="Pembentukan Identitas">
              <span className="chip-icon">🎯</span>
              <span className="chip-text">{habit.identity}</span>
            </span>
          )}

          {habit.twoMinuteRule && (
            <span className="habit-twomin-chip" title="Aturan 2 Menit (Starter Tanpa Beban)">
              <span className="chip-icon">⚡</span>
              <span className="chip-text">Mulai: {habit.twoMinuteRule}</span>
            </span>
          )}

          {habit.linkedPomodoroMinutes && (
            <Link
              href="/"
              className="habit-pomo-chip"
              title="Mulai Sesi Timer Pomodoro untuk kebiasaan ini"
            >
              <span>🍅</span>
              <span>{habit.linkedPomodoroMinutes} Menit Fokus</span>
            </Link>
          )}

          {streakInfo.isAtRiskOfMissingTwice && !isDoneToday && (
            <span className="habit-danger-chip" title="Aturan Pantang Bolong Dua Kali James Clear!">
              ⚠️ Jangan bolong 2x berturut-turut!
            </span>
          )}
        </div>
      )}

      {/* 7-Day Mini Dots Strip */}
      <div className="habit-row-strip-col" aria-label="7 Hari Terakhir">
        <div className="habit-row-strip">
          {weeklyStrip.map((day) => (
            <button
              key={day.date}
              type="button"
              className={`habit-mini-dot ${day.completed ? "is-dot-done" : ""} ${day.isToday ? "is-dot-today" : ""}`}
              onClick={() => onToggleCheckin(habit.id, day.date)}
              title={`${day.dayName} (${day.date}): ${day.completed ? "Selesai" : "Belum selesai"}`}
              aria-label={`${day.dayName} ${day.completed ? "selesai" : "belum"}`}
            >
              <span className="dot-label">{SHORT_DAY_NAMES[day.dayName] || day.dayName.slice(0, 2)}</span>
              <span className="dot-circle" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
