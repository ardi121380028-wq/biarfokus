"use client";

import type { AmbientSoundMode, Task, TimerMode } from "@/types/domain";
import { AMBIENT_SOUND_OPTIONS } from "@/features/audio/ambient-sound";
import { formatTime, getCycleProgress } from "@/features/timer/timer-utils";

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
  longBreakInterval,
  onModeChange,
  onToggleRunning,
  onReset,
  onSkip,
  onToggleZen,
  onAmbientSoundChange,
  onColorChange,
}: TimerPanelProps) {
  const cycle = getCycleProgress(completedPomodoros, longBreakInterval);

  return (
    <section className="timer-card card">
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

      <div className="cycle-bar" aria-label={`Siklus ${cycle.cycleNumber}, ${cycle.completedInCycle} dari ${cycle.totalInCycle} pomodoro selesai`}>
        <span className="cycle-label">Siklus #{cycle.cycleNumber}</span>
        <div className="cycle-dots" aria-hidden="true">
          {Array.from({ length: cycle.totalInCycle }, (_, index) => (
            <span
              key={index}
              className={index < cycle.completedInCycle ? "cycle-dot filled" : "cycle-dot"}
            />
          ))}
        </div>
      </div>

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
        <button className="start-button" onClick={onToggleRunning}>
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
