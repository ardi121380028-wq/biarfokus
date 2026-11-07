"use client";

import { useMemo, useRef, useState } from "react";
import type { Habit } from "@/features/habits/habit-types";
import { getTodayKey, formatDateKey, calculateStreak } from "@/features/habits/habit-service";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";

interface HabitsMatrixViewProps {
  habits: Habit[];
  onToggleCheckin: (habitId: string, dateKey?: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  onOpenCreateModal: () => void;
  onReorderHabits?: (fromIndex: number, toIndex: number, currentList?: Habit[]) => void;
  onAddToFrog?: (habit: Habit) => void;
  onAddToCalendar?: (habit: Habit) => void;
  isSyncing?: boolean;
  onSyncWithCloud?: () => void;
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
    const dateKey = formatDateKey(d);
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
  onReorderHabits,
  onAddToFrog,
  onAddToCalendar,
  isSyncing,
  onSyncWithCloud,
}: HabitsMatrixViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);
  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const todayKey = getTodayKey();

  // Drag and drop reordering states
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverPos, setDragOverPos] = useState<"above" | "below" | null>(null);
  const touchStartRef = useRef<{ y: number; index: number } | null>(null);
  const touchOverIndexRef = useRef<number | null>(null);

  function handleDragStart(e: React.DragEvent<HTMLTableRowElement>, index: number) {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }

  function handleDragOver(e: React.DragEvent<HTMLTableRowElement>, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndex === null || draggedIndex === index) {
      setDragOverIndex(null);
      setDragOverPos(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? "above" : "below";
    setDragOverIndex(index);
    setDragOverPos(pos);
  }

  function handleDragLeave(e: React.DragEvent<HTMLTableRowElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null);
      setDragOverPos(null);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLTableRowElement>, index: number) {
    e.preventDefault();
    if (draggedIndex === null || !onReorderHabits) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setDragOverPos(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const isAbove = e.clientY < midY;
    let targetIndex = index;
    if (draggedIndex < index && isAbove) {
      targetIndex = index - 1;
    } else if (draggedIndex > index && !isAbove) {
      targetIndex = index + 1;
    }
    if (targetIndex !== draggedIndex) {
      onReorderHabits(draggedIndex, targetIndex, habits);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDragOverPos(null);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDragOverPos(null);
  }

  function handleTouchStart(e: React.TouchEvent, index: number) {
    const touch = e.touches[0];
    touchStartRef.current = { y: touch.clientY, index };
    touchOverIndexRef.current = index;
    setDraggedIndex(index);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const rowBelow = elemBelow?.closest("[data-habit-index]") as HTMLElement | null;
    if (rowBelow) {
      const idx = Number(rowBelow.getAttribute("data-habit-index"));
      if (!Number.isNaN(idx) && idx !== touchOverIndexRef.current) {
        touchOverIndexRef.current = idx;
        setDragOverIndex(idx);
        setDragOverPos(idx < touchStartRef.current.index ? "above" : "below");
      }
    }
  }

  function handleTouchEnd() {
    const fromIdx = touchStartRef.current?.index ?? null;
    const toIdx = touchOverIndexRef.current;
    if (fromIdx !== null && toIdx !== null && fromIdx !== toIdx && onReorderHabits) {
      onReorderHabits(fromIdx, toIdx, habits);
    }
    touchStartRef.current = null;
    touchOverIndexRef.current = null;
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDragOverPos(null);
  }

  // Week range label (e.g. "20 Okt - 26 Okt 2026")
  const weekRangeLabel = useMemo(() => {
    if (weekDays.length === 0) return "";
    const [y1, m1, d1] = weekDays[0].date.split("-").map(Number);
    const [y2, m2, d2] = weekDays[6].date.split("-").map(Number);
    const first = new Date(y1, m1 - 1, d1);
    const last = new Date(y2, m2 - 1, d2);
    const label1 = first.toLocaleDateString("id-ID", { month: "short", day: "numeric" });
    const label2 = last.toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" });
    return `${label1} — ${label2}`;
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h2 className="matrix-heading">Matriks Konsistensi Mingguan</h2>
            {onSyncWithCloud && (
              <button
                type="button"
                className={`habits-cloud-sync-pill ${isSyncing ? "is-syncing" : ""}`}
                onClick={onSyncWithCloud}
                disabled={isSyncing}
                title={isSyncing ? "Sedang menyinkronkan data..." : "Klik untuk sinkronisasi cloud sekarang"}
              >
                <span className={`sync-icon ${isSyncing ? "is-spinning" : ""}`}>☁️</span>
                <span>{isSyncing ? "Menyinkronkan..." : "Cloud Tersinkron"}</span>
              </button>
            )}
          </div>
          <span className="matrix-sub">Tandai dan evaluasi komitmen 7 hari secara visual.</span>
        </div>

        <div className="matrix-nav-right-group">
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

          <button
            type="button"
            className="primary-button matrix-add-habit-btn"
            onClick={onOpenCreateModal}
            title="Tambah Kebiasaan Baru"
          >
            <span className="btn-plus-icon">+</span>
            <span>Kebiasaan Baru</span>
          </button>
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
              <th className="matrix-th-action">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {habits.map((habit, index) => {
              const weekCompletedCount = weekDays.filter((d) =>
                habit.completedDates.includes(d.date)
              ).length;
              const streakInfo = calculateStreak(habit.completedDates);
              const isDragging = draggedIndex === index;
              const isOver = dragOverIndex === index;

              return (
                <tr
                  key={habit.id}
                  className={`matrix-row ${isDragging ? "is-dragging" : ""} ${isOver ? (dragOverPos === "above" ? "drag-over-above" : "drag-over-below") : ""}`}
                  data-habit-index={index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  {/* Sticky Habit Info Column */}
                  <td className="matrix-td-habit">
                    <div className="matrix-habit-row-drag-wrap">
                      <span
                        className="matrix-drag-handle"
                        style={{ touchAction: "none" }}
                        title="Tahan dan geser untuk ubah urutan prioritas"
                        aria-label="Geser urutan prioritas"
                        onTouchStart={(e) => handleTouchStart(e, index)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchEnd}
                      >
                        ⠿
                      </span>
                      <div
                        className="matrix-habit-cell is-clickable"
                        onClick={() => onEdit(habit)}
                        title={`Klik untuk edit ${habit.title}`}
                        role="button"
                        tabIndex={0}
                      >
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
                          <div className="matrix-habit-meta-row">
                            <span className="matrix-habit-time-badge">
                              {habit.routineTime === "morning" && "🌅 Pagi"}
                              {habit.routineTime === "afternoon" && "☀️ Siang"}
                              {habit.routineTime === "evening" && "🌙 Malam"}
                              {habit.routineTime === "anytime" && "⚡ Fleksibel"}
                            </span>
                            <button
                              type="button"
                              className="matrix-quick-frog-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToFrog?.(habit);
                              }}
                              title={`Jadikan "${habit.title}" sebagai target Eat That Frog di Beranda`}
                              aria-label={`Jadikan Eat That Frog ${habit.title}`}
                            >
                              🐸 +Frog
                            </button>
                          </div>
                        </div>
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

                  {/* Action Column: Move, Edit & Delete buttons */}
                  <td className="matrix-td-action">
                    <div className="matrix-actions-group">
                      <button
                        type="button"
                        className="matrix-action-btn frog"
                        onClick={() => onAddToFrog?.(habit)}
                        title={`Jadikan "${habit.title}" sebagai Eat That Frog di Beranda`}
                        aria-label={`Jadikan Eat That Frog ${habit.title}`}
                      >
                        🐸
                      </button>
                      <button
                        type="button"
                        className="matrix-action-btn calendar"
                        onClick={() => onAddToCalendar?.(habit)}
                        title={`Jadwalkan "${habit.title}" ke Kalender Hari Ini`}
                        aria-label={`Jadwalkan ${habit.title} ke Kalender`}
                      >
                        📅
                      </button>
                      <button
                        type="button"
                        className="matrix-action-btn edit"
                        onClick={() => onEdit(habit)}
                        title={`Edit kebiasaan "${habit.title}"`}
                        aria-label={`Edit ${habit.title}`}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="matrix-action-btn delete"
                        onClick={() => setDeletingHabit(habit)}
                        title={`Hapus kebiasaan "${habit.title}"`}
                        aria-label={`Hapus ${habit.title}`}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal for Habit Deletion */}
      <ConfirmModal
        isOpen={Boolean(deletingHabit)}
        title="Hapus Kebiasaan?"
        message="Apakah kamu yakin ingin menghapus kebiasaan ini? Seluruh riwayat check-in dan streak kebiasaan ini akan terhapus secara permanen."
        itemName={deletingHabit?.title}
        itemSubtext={
          deletingHabit?.routineTime === "morning"
            ? "Rutinitas: 🌅 Pagi"
            : deletingHabit?.routineTime === "afternoon"
            ? "Rutinitas: ☀️ Siang"
            : deletingHabit?.routineTime === "evening"
            ? "Rutinitas: 🌙 Malam"
            : "Rutinitas: ⚡ Fleksibel"
        }
        confirmLabel="Hapus Kebiasaan"
        cancelLabel="Batal"
        onConfirm={() => {
          if (deletingHabit) {
            onDelete(deletingHabit.id);
            setDeletingHabit(null);
          }
        }}
        onCancel={() => setDeletingHabit(null)}
      />
    </div>
  );
}
