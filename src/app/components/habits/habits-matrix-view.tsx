"use client";

import { useMemo, useState } from "react";
import type { Habit } from "@/features/habits/habit-types";
import { getTodayKey, calculateStreak } from "@/features/habits/habit-service";

interface HabitsMatrixViewProps {
  habits: Habit[];
  onToggleCheckin: (habitId: string, dateKey?: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  onOpenCreateModal: () => void;
}

function getWeekDays(offsetWeeks = 0): { date: string; dayName: string; dayNumber: number; isToday: boolean }[] {
  const today = new Date();
  const currentDayOfWeek = (today.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - currentDayOfWeek + offsetWeeks * 7);

  const days: { date: string; dayName: string; dayNumber: number; isToday: boolean }[] = [];
  const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const todayKey = getTodayKey();

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateKey = d.toISOString().slice(0, 10);
    days.push({
      date: dateKey,
      dayName: dayNames[i],
      dayNumber: d.getDate(),
      isToday: dateKey === todayKey,
    });
  }

  return days;
}

export function HabitsMatrixView({
  habits,
  onToggleCheckin,
  onEdit,
  onDelete,
  onOpenCreateModal,
}: HabitsMatrixViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const todayKey = getTodayKey();

  // Week range label (e.g. "20 Okt - 26 Okt 2026")
  const weekRangeLabel = useMemo(() => {
    if (weekDays.length === 0) return "";
    const first = new Date(weekDays[0].date);
    const last = new Date(weekDays[6].date);
    const m1 = first.toLocaleDateString("id-ID", { month: "short", day: "numeric" });
    const m2 = last.toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" });
    return `${m1} — ${m2}`;
  }, [weekDays]);

  if (habits.length === 0) {
    return (
      <div className="habits-empty-state-card">
        <span className="empty-state-icon">📅</span>
        <h3>Belum ada kebiasaan untuk ditampilkan di matriks</h3>
        <p>Bangun kebiasaan pertamamu dan pantau konsistensi mingguan di sini.</p>
        <button
          type="button"
          className="primary-button habits-empty-create-btn"
          onClick={onOpenCreateModal}
        >
          + Bangun Kebiasaan Baru
        </button>
      </div>
    );
  }

  return (
    <div className="habits-matrix-container">
      {/* Matrix Header & Navigation */}
      <div className="habits-matrix-nav-bar">
        <div className="matrix-title-col">
          <h2 className="matrix-heading">Matriks Konsistensi Mingguan</h2>
          <span className="matrix-sub">Tandai dan evaluasi komitmen 7 hari secara visual.</span>
        </div>

        <div className="matrix-week-switcher">
          <button
            type="button"
            className="matrix-nav-btn"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            title="Minggu Sebelumnya"
          >
            ‹ Minggu Lalu
          </button>
          <span className="matrix-current-week-label">
            {weekOffset === 0 ? `Minggu Ini (${weekRangeLabel})` : weekRangeLabel}
          </span>
          <button
            type="button"
            className="matrix-nav-btn"
            onClick={() => setWeekOffset((prev) => Math.min(0, prev + 1))}
            disabled={weekOffset === 0}
            title={weekOffset === 0 ? "Sudah di minggu ini" : "Minggu Berikutnya"}
          >
            Minggu Depan ›
          </button>
          {weekOffset !== 0 && (
            <button
              type="button"
              className="matrix-today-btn"
              onClick={() => setWeekOffset(0)}
              title="Kembali ke minggu ini"
            >
              Hari Ini
            </button>
          )}
        </div>
      </div>

      {/* Responsive Horizontal Scrolling Table Container */}
      <div className="habits-matrix-table-wrap">
        <table className="habits-matrix-table" aria-label="Tabel Matriks Kebiasaan">
          <thead>
            <tr>
              <th className="matrix-th-habit">Kebiasaan</th>
              {weekDays.map((d) => (
                <th
                  key={d.date}
                  className={`matrix-th-day ${d.isToday ? "matrix-today-col" : ""}`}
                >
                  <span className="th-day-name">{d.dayName}</span>
                  <span className="th-day-number">{d.dayNumber}</span>
                </th>
              ))}
              <th className="matrix-th-stat">Minggu Ini</th>
              <th className="matrix-th-streak">Streak</th>
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => {
              const weekCompletedCount = weekDays.filter((d) =>
                habit.completedDates.includes(d.date)
              ).length;
              const streakInfo = calculateStreak(habit.completedDates);

              return (
                <tr key={habit.id} className="matrix-row">
                  {/* Sticky Habit Info Column */}
                  <td className="matrix-td-habit">
                    <div className="matrix-habit-cell">
                      <span
                        className="matrix-habit-icon"
                        style={{
                          background: `color-mix(in srgb, ${habit.color} 15%, var(--paper))`,
                        }}
                      >
                        {habit.icon || "✨"}
                      </span>
                      <div className="matrix-habit-info">
                        <span className="matrix-habit-title" title={habit.title}>
                          {habit.title}
                        </span>
                        <span className="matrix-habit-time-badge">
                          {habit.routineTime === "morning" && "🌅 Pagi"}
                          {habit.routineTime === "afternoon" && "☀️ Siang"}
                          {habit.routineTime === "evening" && "🌙 Malam"}
                          {habit.routineTime === "anytime" && "⚡ Fleksibel"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 7 Interactive Day Checkmark Cells */}
                  {weekDays.map((d) => {
                    const isDone = habit.completedDates.includes(d.date);

                    return (
                      <td
                        key={d.date}
                        className={`matrix-td-day ${d.isToday ? "matrix-today-col" : ""}`}
                      >
                        <button
                          type="button"
                          className={`matrix-check-bubble ${isDone ? "checked" : ""} ${d.isToday ? "is-today" : ""}`}
                          style={
                            isDone
                              ? ({
                                  background: habit.color,
                                  borderColor: habit.color,
                                } as React.CSSProperties)
                              : ({
                                  "--bubble-color": habit.color,
                                } as React.CSSProperties)
                          }
                          onClick={() => onToggleCheckin(habit.id, d.date)}
                          title={`${habit.title} • ${d.dayName} (${d.date}): ${isDone ? "Selesai" : "Belum selesai"}`}
                          aria-label={`${habit.title} ${d.dayName} ${isDone ? "selesai" : "belum selesai"}`}
                        >
                          {isDone ? "✓" : ""}
                        </button>
                      </td>
                    );
                  })}

                  {/* Week Rate */}
                  <td className="matrix-td-stat">
                    <div className="matrix-stat-cell">
                      <span className="matrix-stat-val">{weekCompletedCount}/7</span>
                      <div className="matrix-stat-bar">
                        <div
                          className="matrix-stat-fill"
                          style={{
                            width: `${Math.round((weekCompletedCount / 7) * 100)}%`,
                            background: habit.color,
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Streak */}
                  <td className="matrix-td-streak">
                    <span
                      className={`matrix-streak-tag ${streakInfo.current > 0 ? "has-streak" : ""}`}
                    >
                      🔥 {streakInfo.current}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
