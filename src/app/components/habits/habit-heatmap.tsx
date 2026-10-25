"use client";

import { useMemo } from "react";
import type { HeatmapDay } from "@/features/habits/habit-types";

interface HabitHeatmapProps {
  heatmap: HeatmapDay[];
  allTimeCheckins: number;
}

export function HabitHeatmap({ heatmap, allTimeCheckins }: HabitHeatmapProps) {
  // Group into weeks of 7 days (Monday to Sunday)
  const weeks = useMemo(() => {
    const list: HeatmapDay[][] = [];
    let currentWeek: HeatmapDay[] = [];

    for (const day of heatmap) {
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
  }, [heatmap]);

  const activeDaysCount = useMemo(() => {
    return heatmap.filter((d) => d.count > 0).length;
  }, [heatmap]);

  return (
    <div className="habit-heatmap-card">
      <div className="habit-heatmap-header">
        <div className="heatmap-title-box">
          <span className="heatmap-icon">📊</span>
          <div>
            <h4 className="heatmap-heading">Peta Konsistensi (90 Hari Terakhir)</h4>
            <p className="heatmap-sub">
              Visualisasi frekuensi pembentukan kebiasaan harian seperti GitHub Commit Heatmap.
            </p>
          </div>
        </div>

        <div className="heatmap-stats-pill">
          <span>✨ <strong>{activeDaysCount}</strong> hari aktif</span>
          <span className="dot-divider">•</span>
          <span>🔥 <strong>{allTimeCheckins}</strong> total check-in</span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="habit-heatmap-scroll-wrap">
        <div className="habit-heatmap-grid" role="grid" aria-label="Kalender Konsistensi">
          {weeks.map((week, wIdx) => (
            <div key={`week-${wIdx}`} className="heatmap-week-column">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`heatmap-day-cell level-${day.level} ${day.isToday ? "today-cell" : ""}`}
                  title={`${day.date}: ${day.count} kebiasaan selesai`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend Row */}
      <div className="habit-heatmap-legend">
        <span className="legend-label">Jarang</span>
        <div className="legend-cells">
          <span className="heatmap-day-cell level-0" />
          <span className="heatmap-day-cell level-1" />
          <span className="heatmap-day-cell level-2" />
          <span className="heatmap-day-cell level-3" />
          <span className="heatmap-day-cell level-4" />
        </div>
        <span className="legend-label">Sangat Konsisten</span>
      </div>
    </div>
  );
}
