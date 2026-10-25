export type RoutineTime = "morning" | "afternoon" | "evening" | "anytime";

export type HabitFilter = "all" | RoutineTime;

export type HabitFrequency = "daily" | "weekdays" | "weekends";

export interface Habit {
  id: string;
  userId?: string | null;
  title: string;
  cue?: string; // James Clear Habit Stacking: "Setelah [kebiasaan lama], saya akan..."
  identity?: string; // Identity-based habit: "Saya adalah seorang..."
  twoMinuteRule?: string; // The 2-Minute Rule frictionless starter version
  routineTime: RoutineTime; // Pagi / Siang / Malam / Kapan Saja
  frequency: HabitFrequency;
  targetCount: number; // e.g. 1 per day
  unit?: string; // "sesi", "halaman", "gelas", "menit"
  color: string; // Pastel accent hex: "#6366f1", "#10b981", "#ef4444", "#f59e0b", "#ec4899", "#06b6d4"
  icon: string; // Emoji
  linkedPomodoroMinutes?: number; // If set, allows 1-click focus session
  completedDates: string[]; // List of "YYYY-MM-DD"
  streakCurrent: number;
  streakBest: number;
  createdAt: string;
  archived?: boolean;
}

export interface DayCheckin {
  date: string; // "YYYY-MM-DD"
  dayName: string; // "Sen", "Sel", "Rab", etc.
  dayNumber: number;
  isToday: boolean;
  isFuture: boolean;
  completed: boolean;
}

export interface HabitStats {
  totalHabits: number;
  completedTodayCount: number;
  todayRatePercent: number;
  bestCurrentStreak: number;
  allTimeCheckins: number;
  neverMissTwiceAlerts: number; // Number of habits at risk of missing 2 days in a row
}

export interface HeatmapDay {
  date: string; // "YYYY-MM-DD"
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // Intensity level for heatmap colors
  isToday: boolean;
}
