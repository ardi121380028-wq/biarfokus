"use client";

import type { AmbientSoundMode, Task, TimerMode } from "@/types/domain";
import { AMBIENT_SOUND_OPTIONS } from "@/features/audio/ambient-sound";
import { formatTime } from "@/features/timer/timer-utils";

type TimerPanelProps = {
  mode: TimerMode;
  seconds: number;
  running: boolean;
  completedPomodoros: number;
  focusedTask: Task | null;
  ambientSound: AmbientSoundMode;
  selectedColor: string;
  colorThemes: readonly { color: string; name: string }[];
  modeLabels: Record<TimerMode, string>;
  longBreakInterval?: number;
  dailyGoalPomodoros?: number;
  onModeChange: (mode: TimerMode) => void;
  onToggleRunning: () => void;
  onReset: () => void;
  onSkip: () => void;
  onToggleZen?: () => void;
  onAmbientSoundChange: (mode: AmbientSoundMode) => void;
  onColorChange: (color: string) => void;
};

export function TimerPanel({
  mode,
  seconds,
  running,
  completedPomodoros,
  focusedTask,
  ambientSound,
  selectedColor,
  colorThemes,
  modeLabels,
  dailyGoalPomodoros = 8,
  onModeChange,
  onToggleRunning,
  onReset,
  onSkip,
  onToggleZen,
  onAmbientSoundChange,
  onColorChange,
}: TimerPanelProps) {
  const goalPercentage = dailyGoalPomodoros > 0
    ? Math.min(100, Math.round((completedPomodoros / dailyGoalPomodoros) * 100))
    : 0;

  return (
    <section className={`timer-card card ${running ? "is-running" : ""}`}>
      <div className="mode-tabs">
        {(Object.keys(modeLabels) as TimerMode[]).map((item) => (
          <button
            key={item}
            className={mode === item ? "mode-tab selected" : "mode-tab"}
            onClick={() => onModeChange(item)}
          >
            {modeLabels[item]}
          </button>
        ))}
      </div>

      {dailyGoalPomodoros > 0 && (
        <div
          className="daily-goal-bar"
          aria-label={`Target hari ini: ${completedPomodoros} dari ${dailyGoalPomodoros} sesi selesai`}
        >
          <div className="daily-goal-info">
            <span className="daily-goal-label">🎯 Target Hari Ini</span>
            <span className="daily-goal-stats">
              <strong>{completedPomodoros}</strong> / {dailyGoalPomodoros} sesi ({goalPercentage}%)
            </span>
          </div>
          <div
            className="daily-goal-track"
            role="progressbar"
            aria-valuenow={completedPomodoros}
            aria-valuemin={0}
            aria-valuemax={dailyGoalPomodoros}
          >
            <div
              className="daily-goal-fill"
              style={{ width: `${goalPercentage}%` }}
            />
          </div>
          {completedPomodoros >= dailyGoalPomodoros && (
            <div className="daily-goal-badge">🎉 Target harian tercapai! Luar biasa!</div>
          )}
        </div>
      )}

      <div className="timer-display" aria-live="polite">{formatTime(seconds)}</div>

      <div className="focused-task-banner" aria-live="polite">
        {focusedTask ? (
          <>
            <span className="focused-task-badge">🎯 Fokus aktif</span>
            <strong className="focused-task-title" title={focusedTask.title}>{focusedTask.title}</strong>
            <span className="focused-task-pomos">🍅 {focusedTask.pomodoros}</span>
          </>
        ) : (
          <span className="focused-task-empty">Belum ada task aktif — tambahkan task untuk mulai fokus</span>
        )}
      </div>

      <div className="timer-controls">
        <button
          type="button"
          className="timer-aux-button"
          onClick={onReset}
          aria-label="Reset timer"
          title="Reset timer (R)"
        >
          ↺
        </button>
        <button className={`start-button ${running ? "running" : ""}`} onClick={onToggleRunning}>
          {running ? "PAUSE" : "START"}
        </button>
        <button
          type="button"
          className="timer-aux-button"
          onClick={onSkip}
          aria-label="Lewati sesi ini"
          title="Lewati sesi (S)"
        >
          ⏭
        </button>
        {onToggleZen && (
          <button
            type="button"
            className="timer-aux-button zen-button"
            onClick={onToggleZen}
            aria-label="Mode Zen / Layar Penuh"
            title="Mode Zen (F)"
          >
            ⛶
          </button>
        )}
      </div>

      <div className="ambient-bar" role="group" aria-label="Suara latar fokus">
        <span className="ambient-label">🎧 Suara latar</span>
        <div className="ambient-pills">
          {AMBIENT_SOUND_OPTIONS.map((option) => (
            <button
              key={option.mode}
              type="button"
              className={ambientSound === option.mode ? "ambient-pill selected" : "ambient-pill"}
              onClick={() => onAmbientSoundChange(option.mode)}
              aria-pressed={ambientSound === option.mode}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="color-picker" aria-label="Pilih warna">
        {colorThemes.map(({ color, name }) => (
          <button
            key={color}
            className={selectedColor === color ? "color-dot selected" : "color-dot"}
            style={{ backgroundColor: color }}
            onClick={() => onColorChange(color)}
            aria-label={`Pilih tema ${name}`}
          />
        ))}
      </div>
    </section>
  );
}
