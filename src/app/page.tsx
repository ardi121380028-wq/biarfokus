"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/providers/app-provider";
import { TimerPanel } from "@/app/components/timer-panel";
import { TaskManagement } from "@/app/components/task-management";
import { AMBIENT_SOUND_OPTIONS } from "@/features/audio/ambient-sound";
import { formatTime } from "@/features/timer/timer-utils";
import type { TimerMode } from "@/types/domain";

function HomeContent() {
  const router = useRouter();
  const {
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
    dailyGoalPomodoros,
    changeMode,
    toggleRunning,
    resetTimer,
    skipSession,
    setZenMode,
    setAmbientSound,
    setSelectedColor,
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    deleteCompletedTasks,
    deleteAllTasks,
    selectedTaskId,
    setSelectedTaskId,
    zenMode,
    notes,
  } = useAppContext();

  // Redirect legacy query parameter views (e.g., ?view=kanban or ?kanbanInvite=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      if (
        url.searchParams.has("kanbanInvite") ||
        url.searchParams.has("invite") ||
        url.searchParams.get("view") === "kanban"
      ) {
        router.replace("/kanban" + url.search);
        return;
      }
      if (url.searchParams.get("view") === "calendar") {
        router.replace("/kalender");
        return;
      }
      if (url.searchParams.get("view") === "notes") {
        router.replace("/catatan");
        return;
      }
      if (url.searchParams.get("view") === "stats") {
        router.replace("/statistik");
        return;
      }
      if (url.searchParams.get("view") === "pricing") {
        router.replace("/upgrade");
        return;
      }
    } catch {}
  }, [router]);

  return (
    <>
      <div className="content-grid">
        <TimerPanel
          mode={mode}
          seconds={seconds}
          running={running}
          completedPomodoros={completedPomodoros}
          focusedTask={focusedTask}
          ambientSound={ambientSound}
          selectedColor={selectedColor}
          colorThemes={colorThemes}
          modeLabels={modeLabels}
          longBreakInterval={longBreakInterval}
          dailyGoalPomodoros={dailyGoalPomodoros}
          onModeChange={changeMode}
          onToggleRunning={toggleRunning}
          onReset={resetTimer}
          onSkip={skipSession}
          onToggleZen={() => setZenMode(true)}
          onAmbientSoundChange={setAmbientSound}
          onColorChange={setSelectedColor}
        />
        <TaskManagement
          tasks={tasks}
          focusedTaskId={selectedTaskId}
          onSelectTask={(id) => setSelectedTaskId(id)}
          onAdd={addTask}
          onToggle={toggleTask}
          onDelete={deleteTask}
          onDeleteCompleted={deleteCompletedTasks}
          onDeleteAll={deleteAllTasks}
          notes={notes}
          onOpenNotes={() => router.push("/catatan")}
        />
      </div>

      {zenMode && (
        <div className="zen-overlay" role="dialog" aria-modal="true" aria-label="Mode Zen Fokus">
          <div className="zen-header">
            <button
              type="button"
              className="zen-close-button"
              onClick={() => setZenMode(false)}
              aria-label="Keluar dari mode Zen"
              title="Keluar Zen (Esc atau F)"
            >
              ✕ Keluar Zen
            </button>
          </div>

          <div className="mode-tabs zen-mode-tabs">
            {(Object.keys(modeLabels) as TimerMode[]).map((item) => (
              <button
                key={item}
                className={mode === item ? "mode-tab selected" : "mode-tab"}
                onClick={() => changeMode(item)}
              >
                {modeLabels[item]}
              </button>
            ))}
          </div>

          <div className="zen-timer-display" aria-live="polite">
            {formatTime(seconds)}
          </div>

          {focusedTask && (
            <div className="zen-focused-task">
              <span className="focused-task-badge">🎯 Fokus</span>
              <strong>{focusedTask.title}</strong>
              <span className="focused-task-pomos">🍅 {focusedTask.pomodoros}</span>
            </div>
          )}

          <div className="timer-controls zen-controls">
            <button
              type="button"
              className="timer-aux-button"
              onClick={resetTimer}
              aria-label="Reset timer"
              title="Reset timer (R)"
            >
              ↺
            </button>
            <button className="start-button zen-start-button" onClick={toggleRunning}>
              {running ? "PAUSE" : "START"}
            </button>
            <button
              type="button"
              className="timer-aux-button"
              onClick={skipSession}
              aria-label="Lewati sesi ini"
              title="Lewati sesi (S)"
            >
              ⏭
            </button>
          </div>

          <div className="ambient-bar zen-ambient-bar" role="group" aria-label="Suara latar fokus">
            <span className="ambient-label">🎧 Suara latar</span>
            <div className="ambient-pills">
              {AMBIENT_SOUND_OPTIONS.map((option) => (
                <button
                  key={option.mode}
                  type="button"
                  className={ambientSound === option.mode ? "ambient-pill selected" : "ambient-pill"}
                  onClick={() => setAmbientSound(option.mode)}
                  aria-pressed={ambientSound === option.mode}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <p className="zen-hint">
            Tekan <kbd>Space</kbd> untuk mulai/jeda · <kbd>F</kbd> atau <kbd>Esc</kbd> untuk keluar
          </p>
        </div>
      )}
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="content-grid" style={{ minHeight: "80vh" }} />}>
      <HomeContent />
    </Suspense>
  );
}
