export type TimerMode = "pomodoro" | "short" | "long";

export type TimerDurations = Record<TimerMode, number>;

export type Task = {
  id: string;
  title: string;
  done: boolean;
  pomodoros: number;
};

export type DbTask = {
  id: string;
  title: string;
  completed: boolean;
  pomodoros: number;
};

export type PomodoroSession = {
  mode: TimerMode;
  duration_seconds: number;
  completed_at: string;
};

export type WeeklyStats = {
  focusSeconds: number;
  pomodoroCount: number;
  dailyFocusSeconds: number[];
};
