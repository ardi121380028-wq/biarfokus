"use client";

import type { TimerMode } from "@/types/domain";
import { formatTime } from "@/features/timer/timer-utils";

type TimerPanelProps = {
  mode: TimerMode;
  seconds: number;
  running: boolean;
  selectedColor: string;
  colorThemes: readonly { color: string; name: string }[];
  modeLabels: Record<TimerMode, string>;
  onModeChange: (mode: TimerMode) => void;
  onToggleRunning: () => void;
  onColorChange: (color: string) => void;
};

export function TimerPanel({
  mode,
  seconds,
  running,
  selectedColor,
  colorThemes,
  modeLabels,
  onModeChange,
  onToggleRunning,
  onColorChange,
}: TimerPanelProps) {
  return (
    <section className="timer-card card">
      <div className="mode-tabs">
        {(Object.keys(modeLabels) as TimerMode[]).map((item) => (
          <button key={item} className={mode === item ? "mode-tab selected" : "mode-tab"} onClick={() => onModeChange(item)}>
            {modeLabels[item]}
          </button>
        ))}
      </div>
      <div className="timer-display" aria-live="polite">{formatTime(seconds)}</div>
      <button className="start-button" onClick={onToggleRunning}>{running ? "PAUSE" : "START"}</button>
      <div className="color-picker" aria-label="Pilih warna">
        {colorThemes.map(({ color, name }) => (
          <button key={color} className={selectedColor === color ? "color-dot selected" : "color-dot"} style={{ backgroundColor: color }} onClick={() => onColorChange(color)} aria-label={`Pilih tema ${name}`} />
        ))}
      </div>
    </section>
  );
}
