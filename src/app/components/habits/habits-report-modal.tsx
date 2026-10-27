"use client";

import { useMemo, useRef } from "react";
import type { Habit, HabitStats, HeatmapDay } from "@/features/habits/habit-types";
import { calculateStreak, shiftDateKey, getTodayKey, buildConsistencyHeatmap } from "@/features/habits/habit-service";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";

interface HabitsReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  stats: HabitStats;
  userName?: string;
  heatmap?: HeatmapDay[];
}

export function HabitsReportModal({
  isOpen,
  onClose,
  habits,
  stats,
  userName = "Pengguna BiarFokus",
  heatmap,
}: HabitsReportModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useOutsideClick(modalRef, onClose, isOpen);
  useEscapeKey(onClose, isOpen);

  const todayKey = getTodayKey();
  const thirtyDaysAgoKey = useMemo(() => shiftDateKey(todayKey, -30), [todayKey]);

  // Formatted date string
  const formattedToday = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date());
    } catch {
      return todayKey;
    }
  }, [todayKey]);

  // Calculations for report
  const average30DayRate = useMemo(() => {
    if (habits.length === 0) return 0;
    const total = habits.reduce((acc, h) => {
      const c = h.completedDates.filter((d) => d >= thirtyDaysAgoKey && d <= todayKey).length;
      return acc + Math.min(100, Math.round((c / 30) * 100));
    }, 0);
    return Math.round(total / habits.length);
  }, [habits, thirtyDaysAgoKey, todayKey]);

  // Top habit
  const topHabit = useMemo(() => {
    if (habits.length === 0) return null;
    return [...habits].sort((a, b) => {
      const sA = calculateStreak(a.completedDates).current;
      const sB = calculateStreak(b.completedDates).current;
      return sB - sA;
    })[0];
  }, [habits]);

  // Habit needing attention
  const needsAttentionHabit = useMemo(() => {
    if (habits.length <= 1) return null;
    return [...habits].sort((a, b) => {
      const sA = a.completedDates.length;
      const sB = b.completedDates.length;
      return sA - sB;
    })[0];
  }, [habits]);

  // Display Heatmap data (84 days = 12 weeks)
  const displayHeatmap = useMemo(() => {
    if (heatmap && heatmap.length > 0) return heatmap;
    return buildConsistencyHeatmap(habits, 84);
  }, [heatmap, habits]);

  // Group into weeks of 7 days (Monday to Sunday)
  const heatmapWeeks = useMemo(() => {
    const list: HeatmapDay[][] = [];
    let currentWeek: HeatmapDay[] = [];

    for (const day of displayHeatmap) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        list.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      list.push(currentWeek);
    }
    return list;
  }, [displayHeatmap]);

  const handlePrint = () => {
    const sheet = document.getElementById("habits-printable-document");
    if (sheet) sheet.scrollTop = 0;
    const originalTitle = document.title;
    document.title = `Laporan-Konsistensi-BiarFokus-${todayKey}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="habits-report-modal-backdrop" role="dialog" aria-modal="true">
      <div ref={modalRef} className="habits-report-modal-container">
        {/* Modal Top Bar (Screen only, hidden on paper print) */}
        <div className="habits-report-topbar no-print">
          <div className="report-topbar-title">
            <span className="report-topbar-icon">🖨️</span>
            <div>
              <h3>Pratinjau Dokumen Laporan Konsistensi</h3>
              <p>Dokumen siap cetak atau disimpan sebagai PDF dengan tata letak resmi.</p>
            </div>
          </div>
          <div className="report-topbar-actions">
            <button
              type="button"
              className="report-btn cancel"
              onClick={onClose}
            >
              Tutup
            </button>
            <button
              type="button"
              className="report-btn print"
              onClick={handlePrint}
            >
              <span>🖨️</span>
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>

        {/* Printable Document Sheet (A4 Proportion) */}
        <div className="habits-printable-sheet" id="habits-printable-document">
          {/* Document Header */}
          <header className="print-doc-header">
            <div className="print-logo-row">
              <div className="print-brand">
                <span className="print-brand-icon">⚡</span>
                <span className="print-brand-name">biarfokus</span>
              </div>
              <span className="print-badge-official">DOKUMEN RESMI EVALUASI KONSISTENSI</span>
            </div>

            <div className="print-doc-title-box">
              <h1 className="print-doc-title">Laporan Performa & Peta Konsistensi Kebiasaan</h1>
              <p className="print-doc-subtitle">
                Analisis pembentukan kebiasaan jangka panjang berbasis metodologi Atomic Habits.
              </p>
            </div>

            <div className="print-meta-grid">
              <div className="print-meta-item">
                <span className="meta-label">Pemilik Laporan:</span>
                <strong className="meta-val">{userName}</strong>
              </div>
              <div className="print-meta-item">
                <span className="meta-label">Tanggal Terbit:</span>
                <strong className="meta-val">{formattedToday}</strong>
              </div>
              <div className="print-meta-item">
                <span className="meta-label">Periode Evaluasi:</span>
                <strong className="meta-val">90 Hari Terakhir & Evaluasi 30 Hari</strong>
              </div>
              <div className="print-meta-item">
                <span className="meta-label">Status Disiplin:</span>
                <strong className="meta-val">
                  {average30DayRate >= 80
                    ? "🌟 Luar Biasa (Konsisten)"
                    : average30DayRate >= 50
                    ? "📈 Membangun Momentum"
                    : "🎯 Langkah Awal Pembiasaan"}
                </strong>
              </div>
            </div>
          </header>

          {/* Section 1: Executive KPI Cards */}
          <section className="print-section">
            <h2 className="print-section-title">I. Ringkasan Eksekutif</h2>
            <div className="print-kpi-grid">
              <div className="print-kpi-card">
                <span className="print-kpi-val">{stats.totalHabits}</span>
                <span className="print-kpi-lbl">Total Kebiasaan Aktif</span>
              </div>
              <div className="print-kpi-card">
                <span className="print-kpi-val">{average30DayRate}%</span>
                <span className="print-kpi-lbl">Rata-rata Disiplin 30 Hari</span>
              </div>
              <div className="print-kpi-card">
                <span className="print-kpi-val">{stats.allTimeCheckins}</span>
                <span className="print-kpi-lbl">Total Akumulasi Check-In</span>
              </div>
              <div className="print-kpi-card">
                <span className="print-kpi-val">{stats.bestCurrentStreak} Hari</span>
                <span className="print-kpi-lbl">Rekor Streak Aktif</span>
              </div>
            </div>
          </section>

          {/* Section 2: Visual Consistency Map (Heatmap) */}
          <section className="print-section print-heatmap-section">
            <div className="print-section-header-row">
              <h2 className="print-section-title">II. Peta Konsistensi Visual (12 Minggu Terakhir)</h2>
              <div className="print-heatmap-legend">
                <span className="legend-label">Jarang</span>
                <span className="print-heatmap-cell level-0" />
                <span className="print-heatmap-cell level-1" />
                <span className="print-heatmap-cell level-2" />
                <span className="print-heatmap-cell level-3" />
                <span className="print-heatmap-cell level-4" />
                <span className="legend-label">Sangat Konsisten</span>
              </div>
            </div>

            <div className="print-heatmap-wrapper">
              <div className="print-heatmap-days-col" aria-hidden="true">
                <span>Sen</span>
                <span>Sel</span>
                <span>Rab</span>
                <span>Kam</span>
                <span>Jum</span>
                <span>Sab</span>
                <span>Min</span>
              </div>
              <div className="print-heatmap-grid" role="grid" aria-label="Peta Konsistensi">
                {heatmapWeeks.map((week, wIdx) => (
                  <div key={`print-week-${wIdx}`} className="print-heatmap-col">
                    {week.map((day) => (
                      <div
                        key={day.date}
                        className={`print-heatmap-cell level-${day.level} ${day.isToday ? "today-cell" : ""}`}
                        title={`${day.date}: ${day.count} kebiasaan selesai`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 3: Smart Insights */}
          <section className="print-section">
            <h2 className="print-section-title">III. Analisis Cerdas & Sorotan Kebiasaan</h2>
            <div className="print-insights-grid">
              {topHabit && (
                <div className="print-insight-box highlight">
                  <div className="insight-badge">🏆 Juara Konsistensi</div>
                  <h4>{topHabit.title}</h4>
                  <p>
                    Memiliki streak aktif tertinggi ({calculateStreak(topHabit.completedDates).current} hari) dengan total {topHabit.completedDates.length} kali check-in berhasil.
                  </p>
                </div>
              )}
              {needsAttentionHabit && (
                <div className="print-insight-box attention">
                  <div className="insight-badge warning">⚡ Perlu Penguatan</div>
                  <h4>{needsAttentionHabit.title}</h4>
                  <p>
                    {needsAttentionHabit.twoMinuteRule
                      ? `Terapkan starter 2 menit: "${needsAttentionHabit.twoMinuteRule}" agar tidak ada hambatan memulai.`
                      : "Gunakan aturan 2 menit untuk memperkecil gesekan awal agar kebiasaan kembali konsisten."}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Section 4: Detailed Habits Table */}
          <section className="print-section">
            <h2 className="print-section-title">IV. Rincian & Evaluasi Tiap Kebiasaan</h2>
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: "35px" }}>No</th>
                  <th>Kebiasaan</th>
                  <th>Rutinitas</th>
                  <th>Total Check-In</th>
                  <th>Streak</th>
                  <th>Rekor</th>
                  <th>Disiplin 30 Hari</th>
                  <th>Fase Otomatisasi</th>
                </tr>
              </thead>
              <tbody>
                {habits.map((habit, idx) => {
                  const streak = calculateStreak(habit.completedDates);
                  const past30 = habit.completedDates.filter(
                    (d) => d >= thirtyDaysAgoKey && d <= todayKey
                  ).length;
                  const rate30 = Math.round((past30 / 30) * 100);

                  let phase = "Langkah Awal";
                  if (streak.current >= 66) phase = "🧠 Otomatis Refleks";
                  else if (streak.current >= 21) phase = "⚡ Membangun Pola";
                  else if (streak.current >= 7) phase = "🌱 Fase Pembiasaan";

                  return (
                    <tr key={habit.id}>
                      <td style={{ textAlign: "center" }}>{idx + 1}</td>
                      <td>
                        <strong>{habit.title}</strong>
                        {habit.cue && (
                          <div className="print-table-sub">Pemicu: {habit.cue}</div>
                        )}
                      </td>
                      <td>
                        {habit.routineTime === "morning" && "🌅 Pagi"}
                        {habit.routineTime === "afternoon" && "☀️ Siang"}
                        {habit.routineTime === "evening" && "🌙 Malam"}
                        {habit.routineTime === "anytime" && "⚡ Fleksibel"}
                      </td>
                      <td style={{ textAlign: "center" }}>{habit.completedDates.length} kali</td>
                      <td style={{ textAlign: "center" }}>{streak.current} hari</td>
                      <td style={{ textAlign: "center" }}>{Math.max(habit.streakBest, streak.best)} hari</td>
                      <td style={{ textAlign: "center" }}>{rate30}%</td>
                      <td>{phase}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {/* Document Footer */}
          <footer className="print-doc-footer">
            <div className="print-quote-box">
              <em>&ldquo;Keberhasilan adalah produk dari kebiasaan harian — bukan transformasi sekali seumur hidup.&rdquo;</em>
              <span>— James Clear, Atomic Habits</span>
            </div>
            <div className="print-footer-brand">
              <span>Dicetak otomatis oleh BiarFokus Habit & Consistency Engine</span>
              <span>•</span>
              <span>www.biarfokus.site</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
