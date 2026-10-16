import type { SupabaseClient } from "@supabase/supabase-js";
import type { PomodoroSession, WeeklyStats } from "@/types/domain";

const DAY_MS = 24 * 60 * 60 * 1000;

export function getWeekStart(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  return start;
}

export function calculateWeeklyStats(
  sessions: PomodoroSession[],
  now = new Date(),
): WeeklyStats {
  const weekStart = getWeekStart(now).getTime();
  const nowTime = now.getTime();
  const dailyFocusSeconds = Array.from({ length: 7 }, () => 0);
  let focusSeconds = 0;
  let pomodoroCount = 0;

  for (const session of sessions) {
    const completedAt = new Date(session.completed_at).getTime();
    const dayIndex = Math.floor((completedAt - weekStart) / DAY_MS);
    if (dayIndex < 0 || dayIndex > 6 || completedAt > nowTime) continue;
    if (session.mode === "pomodoro") {
      focusSeconds += session.duration_seconds;
      pomodoroCount += 1;
      dailyFocusSeconds[dayIndex] += session.duration_seconds;
    }
  }

  return { focusSeconds, pomodoroCount, dailyFocusSeconds };
}

export async function loadWeeklyStats(
  supabase: SupabaseClient,
  userId: string,
): Promise<WeeklyStats> {
  const weekStart = getWeekStart().toISOString();
  const { data, error } = await supabase
    .from("pomodoro_sessions")
    .select("mode, duration_seconds, completed_at")
    .eq("user_id", userId)
    .gte("completed_at", weekStart)
    .lte("completed_at", new Date().toISOString())
    .order("completed_at", { ascending: true });
  if (error) throw error;
  return calculateWeeklyStats(data as PomodoroSession[]);
}
