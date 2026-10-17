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

export type UserRole = "user" | "admin";

export type AdminAuditLog = {
  id: string;
  actor_user_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AdminOverview = {
  totalUsers: number;
  activeUsersToday: number;
  completedPomodoros: number;
  totalTasks: number;
  completedTasks: number;
  auditLogs: AdminAuditLog[];
};

export type SubscriptionPlan = "free" | "pro";

export type SubscriptionStatus =
  | "inactive"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled";

export type UserSubscription = {
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};
