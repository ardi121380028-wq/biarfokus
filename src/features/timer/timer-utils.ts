import type { TimerMode } from "../../types/domain";

export const LONG_BREAK_INTERVAL = 4;

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remaining = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remaining}`;
}

export function getTimerEndTime(seconds: number, now = Date.now()) {
  return now + Math.max(0, seconds) * 1000;
}

export function getRemainingSeconds(endAt: number, now = Date.now()) {
  return Math.max(0, Math.ceil((endAt - now) / 1000));
}

/**
 * Determines the next timer mode according to the Pomodoro cycle:
 * - After every Nth completed pomodoro (default 4), transition to "long" break.
 * - After any other pomodoro, transition to "short" break.
 * - After any break ("short" or "long"), transition back to "pomodoro".
 */
export function getNextTimerMode(
  currentMode: TimerMode,
  completedPomodoros: number,
  longBreakInterval = LONG_BREAK_INTERVAL,
): TimerMode {
  if (currentMode !== "pomodoro") {
    return "pomodoro";
  }
  const safeInterval = Math.max(1, Math.floor(longBreakInterval));
  const safeCompleted = Math.max(1, Math.floor(completedPomodoros));
  return safeCompleted % safeInterval === 0 ? "long" : "short";
}

/**
 * Computes the 1-indexed cycle number and how many pomodoros are completed
 * within the current cycle of `longBreakInterval` sessions.
 */
export function getCycleProgress(
  completedPomodoros: number,
  longBreakInterval = LONG_BREAK_INTERVAL,
): { cycleNumber: number; completedInCycle: number; totalInCycle: number } {
  const totalInCycle = Math.max(1, Math.floor(longBreakInterval));
  const safeCompleted = Math.max(0, Math.floor(completedPomodoros));
  const cycleNumber = Math.floor(safeCompleted / totalInCycle) + 1;
  const completedInCycle = safeCompleted % totalInCycle;
  return { cycleNumber, completedInCycle, totalInCycle };
}
