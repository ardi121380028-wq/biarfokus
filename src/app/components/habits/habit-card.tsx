"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Habit } from "@/features/habits/habit-types";
import { getWeeklyStrip, getTodayKey, calculateStreak } from "@/features/habits/habit-service";

interface HabitCardProps {
  habit: Habit;
  onToggleCheckin: (habitId: string, dateKey?: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
}

export function HabitCard({ habit, onToggleCheckin, onEdit, onDelete }: HabitCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const todayKey = getTodayKey();
  const isDoneToday = habit.completedDates.includes(todayKey);

  const weeklyStrip = useMemo(() => {
    return getWeeklyStrip(habit);
  }, [habit]);

  const streakInfo = useMemo(() => {
    return calculateStreak(habit.completedDates);
  }, [habit.completedDates]);

  return (
    <article
      className={`habit-card ${isDoneToday ? "is-completed-today" : ""}`}
      style={{
        "--habit-color": habit.color,
      } as React.CSSProperties}
    >
      {/* Top Header Row */}
      <div className="habit-card-header">
        <div className="habit-card-identity-box">
          <span className="habit-card-icon" style={{ background: `color-mix(in srgb, ${habit.color} 15%, var(--paper))` }}>
            {habit.icon || "✨"}
          </span>
          <div className="habit-card-title-wrap">
            <h3 className="habit-card-title">{habit.title}</h3>
            {habit.identity && (
              <span className="habit-identity-tag" title="Identitas James Clear: Siapa yang kamu bangun">
                🎯 <em>{habit.identity}</em>
              </span>
            )}
          </div>
        </div>

        {/* 1-Click Interactive Big Circular Check-in Button */}
        <button
          type="button"
          className={`habit-checkin-btn ${isDoneToday ? "checked" : ""}`}
          onClick={() => onToggleCheckin(habit.id, todayKey)}
          aria-label={isDoneToday ? "Tandai belum selesai hari ini" : "Tandai selesai hari ini"}
          title={isDoneToday ? "Bagus! Kamu sudah check-in hari ini." : "Klik untuk check-in hari ini"}
        >
          {isDoneToday ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <span className="habit-checkin-plus">+</span>
          )}
        </button>
      </div>

      {/* Habit Stacking Cue (James Clear: Setelah [kebiasaan], saya akan [tindakan]) */}
      {habit.cue && (
        <div className="habit-cue-badge" title="Habit Stacking James Clear: Pemicu kebiasaan">
          <span className="cue-label">🔗 Pemicu:</span>
          <span className="cue-text">{habit.cue}</span>
        </div>
      )}

      {/* 2-Minute Rule Starter Badge */}
      {habit.twoMinuteRule && (
        <div className="habit-twomin-badge" title="Aturan 2 Menit: Versi ringkas tanpa beban untuk memulai">
          <span className="twomin-icon">⚡ Aturan 2 Menit:</span>
          <span>{habit.twoMinuteRule}</span>
        </div>
      )}

      {/* James Clear 'Never Miss Twice' Danger Alert */}
      {streakInfo.isAtRiskOfMissingTwice && (
        <div className="habit-danger-alert" role="alert">
          <span className="danger-icon">⚠️</span>
          <span>
            <strong>Aturan James Clear:</strong> Jangan lewatkan 2 hari berturut-turut! Check-in hari ini untuk menjaga momentummu.
          </span>
        </div>
      )}

      {/* Weekly 7-Day Checklist Strip (Sen - Min) */}
      <div className="habit-week-strip" role="group" aria-label="Aktivitas 7 Hari Terakhir">
        {weeklyStrip.map((day) => (
          <button
            key={day.date}
            type="button"
            className={`habit-day-cell ${day.completed ? "is-done" : ""} ${day.isToday ? "is-today" : ""} ${day.isFuture ? "is-future" : ""}`}
            disabled={day.isFuture}
            onClick={() => onToggleCheckin(habit.id, day.date)}
            title={`${day.dayName} (${day.date}): ${day.completed ? "Selesai" : "Belum selesai"}`}
          >
            <span className="day-name">{day.dayName}</span>
            <span className="day-bubble">
              {day.completed ? "✓" : day.dayNumber}
            </span>
          </button>
        ))}
      </div>

      {/* Footer Meta Row: Streak, Pomodoro Link, and Actions */}
      <div className="habit-card-footer">
        <div className="habit-streaks-group">
          <span className={`habit-streak-pill ${habit.streakCurrent > 0 ? "active" : ""}`} title="Current Streak: Hari beruntun aktif">
            🔥 <strong>{habit.streakCurrent}</strong> hari
          </span>
          {habit.streakBest > 0 && (
            <span className="habit-streak-best" title="Rekor streak terpanjang">
              🏆 Terbaik: {habit.streakBest}
            </span>
          )}
        </div>

        <div className="habit-card-actions">
          {/* Quick link to Pomodoro Timer if integrated */}
          {habit.linkedPomodoroMinutes && (
            <Link
              href="/"
              className="habit-pomodoro-link-btn"
              title={`Mulai sesi fokus ${habit.linkedPomodoroMinutes}m di Timer Pomodoro`}
            >
              ⏱️ Mulai {habit.linkedPomodoroMinutes}m
            </Link>
          )}

          {/* Quick Menu Options */}
          <div className="habit-menu-wrap">
            <button
              type="button"
              className="habit-dots-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Pilihan kebiasaan"
            >
              •••
            </button>
            {menuOpen && (
              <div className="habit-dropdown-menu">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(habit);
                  }}
                >
                  ✏️ Edit Kebiasaan
                </button>
                <button
                  type="button"
                  className="delete-item"
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
    </article>
  );
}
