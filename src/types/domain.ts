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
  archived?: boolean;
  updatedAt: string;
};

export type RecurrenceFrequency = "none" | "daily" | "weekdays" | "custom";

export type EventRecurrence = {
  frequency: RecurrenceFrequency;
  daysOfWeek?: number[]; // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  untilDate?: string; // YYYY-MM-DD optional end date
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
  linkedKanbanCardId?: string; // snapshot of linked Kanban card id
  linkedKanbanBoardId?: string; // snapshot of linked Kanban board id
  linkedKanbanBoardTitle?: string; // snapshot of linked Kanban board title
  recurrence?: EventRecurrence;
  isRecurringOccurrence?: boolean; // true if this is a projected virtual occurrence
  originalEventId?: string; // master event id if this is a recurring occurrence
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

export type KanbanCardAssignee = {
  id: string; // userId or unique member id
  name: string;
  avatarUrl?: string | null;
  role?: string;
  email?: string | null;
};

export type KanbanCard = {
  id: string;
  title: string;
  description?: string;
  coverColor?: string;
  coverEmoji?: string;
  labels: KanbanLabel[];
  startDate?: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  dueCompleted?: boolean;
  checklists: KanbanChecklist[];
  comments: KanbanComment[];
  pomodoros?: number;
  frog?: boolean;
  assignees?: KanbanCardAssignee[];
  assigneeId?: string | null;
  assigneeName?: string | null;
  assigneeAvatar?: string | null;
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

export type KanbanMemberRole = "owner" | "editor" | "viewer";

export type KanbanBoardMember = {
  id: string;
  boardId: string;
  userId: string;
  role: KanbanMemberRole;
  joinedAt: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
};

export type KanbanBoardInvite = {
  id: string;
  boardId: string;
  inviteCode: string;
  role: "editor" | "viewer";
  createdBy: string;
  maxUses?: number | null;
  usesCount: number;
  expiresAt: string | null;
  createdAt: string;
};

export type KanbanBoard = {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  background: string; // Preset background key or CSS style
  lists: KanbanList[];
  labels?: KanbanLabel[]; // Custom label definitions for this board
  starred?: boolean;
  role?: KanbanMemberRole;
  memberCount?: number;
  members?: KanbanBoardMember[];
  isShared?: boolean;
  _isLocalDraft?: boolean;
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

export type DbKanbanMember = {
  id: string;
  board_id: string;
  user_id: string;
  role: KanbanMemberRole;
  joined_at: string;
};

export type DbKanbanInvite = {
  id: string;
  board_id: string;
  invite_code: string;
  role: "editor" | "viewer";
  created_by: string;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  created_at: string;
};
