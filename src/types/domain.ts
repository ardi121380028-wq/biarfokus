export type TimerMode = "pomodoro" | "short" | "long";

export type TimerDurations = Record<TimerMode, number>;

export type AmbientSoundMode = "off" | "rain" | "waves" | "brown";

export type Task = {
  id: string;
  title: string;
  done: boolean;
  pomodoros: number;
  linkedNoteId?: string;
  linkedNoteTitle?: string;
  linkedItemId?: string;
  linkedItemText?: string;
};

export type DbTask = {
  id: string;
  title: string;
  completed: boolean;
  pomodoros: number;
  linked_note_id?: string | null;
  linked_note_title?: string | null;
  linked_item_id?: string | null;
  linked_item_text?: string | null;
};

export type PomodoroSession = {
  mode: TimerMode;
  duration_seconds: number;
  completed_at: string;
};

export type DailyFocus = {
  day: string;
  focusSeconds: number;
  pomodoroCount: number;
};

export type StatsRange = "week" | "7d" | "30d";

export type StatsSummary = {
  focusSeconds: number;
  pomodoroCount: number;
  series: Array<{ day: string; focusSeconds: number }>;
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

export type AdminUserItem = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  createdAt: string;
};

export type DailyVisitStat = {
  date: string; // YYYY-MM-DD
  pageViews: number;
  uniqueVisitors: number;
};

export type AdminOverview = {
  totalUsers: number;
  activeUsersToday: number;
  completedPomodoros: number;
  totalTasks: number;
  completedTasks: number;
  totalPageViews: number;
  pageViewsToday: number;
  uniqueVisitorsTotal: number;
  uniqueVisitorsToday: number;
  dailyVisits: DailyVisitStat[];
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

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type KeepNote = {
  id: string;
  title: string;
  type: "text" | "checklist";
  content?: string;
  items?: ChecklistItem[];
  color: string;
  labels: string[];
  pinned?: boolean;
  updatedAt: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (e.g. "08:00")
  endTime: string; // HH:mm (e.g. "10:30")
  color: string; // Hex color code
  category?: "event" | "task";
  description?: string;
  linkedNoteId?: string;
  linkedNoteTitle?: string; // snapshot, used as fallback if the note is deleted
  linkedItemId?: string; // optional specific checklist item inside the linked note
  linkedItemText?: string; // snapshot of specific checklist item text
};

/* ------------------------------------------------------------------ */
/* Kanban (Trello-style) domain types                                  */
/* ------------------------------------------------------------------ */

export type KanbanLabel = {
  id: string;
  name: string;
  color: string; // Hex color (e.g. #61bd4f, #0079bf, #eb5a46, etc.)
};

export type KanbanChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type KanbanChecklist = {
  id: string;
  title: string;
  items: KanbanChecklistItem[];
};

export type KanbanComment = {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
};

export type KanbanCard = {
  id: string;
  title: string;
  description?: string;
  coverColor?: string;
  coverEmoji?: string;
  labels: KanbanLabel[];
  dueDate?: string; // YYYY-MM-DD
  dueCompleted?: boolean;
  checklists: KanbanChecklist[];
  comments: KanbanComment[];
  pomodoros?: number;
  frog?: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type KanbanList = {
  id: string;
  title: string;
  cards: KanbanCard[];
  order: number;
};

export type KanbanBoard = {
  id: string;
  title: string;
  description?: string;
  background: string; // Preset background key or CSS style
  lists: KanbanList[];
  starred?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DbKanbanBoard = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  background: string;
  lists: unknown;
  starred: boolean;
  created_at: string;
  updated_at: string;
};
