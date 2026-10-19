import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbTask, Task } from "../../types/domain";

export const LOCAL_TASKS_KEY = "biarfokus.tasks";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const initialTasks: Task[] = [
  { id: "demo-1", title: "Rencanakan target hari ini", done: true, pomodoros: 2 },
  { id: "demo-2", title: "Kerjakan prioritas utama", done: false, pomodoros: 4 },
  { id: "demo-3", title: "Review pekerjaan dan catatan", done: false, pomodoros: 1 },
];

export function isUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * Resolves the active task being worked on:
 * - Prefers the explicitly selected task if it is still incomplete.
 * - Falls back to the first incomplete task in list order.
 * - Returns null when there are no incomplete tasks.
 */
export function resolveFocusedTask(
  tasks: Task[],
  selectedTaskId: string | null,
): Task | null {
  const activeTasks = tasks.filter((task) => !task.done);
  if (activeTasks.length === 0) return null;
  if (selectedTaskId) {
    const matching = activeTasks.find((task) => task.id === selectedTaskId);
    if (matching) return matching;
  }
  return activeTasks[0];
}

export type LinkedNoteMeta = {
  linkedNoteId?: string;
  linkedNoteTitle?: string;
  linkedItemId?: string;
  linkedItemText?: string;
};

export function mapDbTask(task: DbTask): Task {
  return {
    id: task.id,
    title: task.title,
    done: task.completed,
    pomodoros: task.pomodoros,
    ...(task.linked_note_id ? { linkedNoteId: task.linked_note_id } : {}),
    ...(task.linked_note_title ? { linkedNoteTitle: task.linked_note_title } : {}),
    ...(task.linked_item_id ? { linkedItemId: task.linked_item_id } : {}),
    ...(task.linked_item_text ? { linkedItemText: task.linked_item_text } : {}),
  };
}

export function loadLocalTasks(): Task[] {
  if (typeof window === "undefined") return initialTasks;
  const savedTasks = window.localStorage.getItem(LOCAL_TASKS_KEY);
  if (!savedTasks) return initialTasks;

  try {
    const parsedTasks: unknown = JSON.parse(savedTasks);
    if (Array.isArray(parsedTasks) && parsedTasks.every(isTask)) {
      return parsedTasks;
    }
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    window.localStorage.removeItem(LOCAL_TASKS_KEY);
  }
  return initialTasks;
}

function isTask(value: unknown): value is Task {
  if (typeof value !== "object" || value === null) return false;
  const task = value as Record<string, unknown>;
  return typeof task.id === "string" &&
    typeof task.title === "string" &&
    typeof task.done === "boolean" &&
    typeof task.pomodoros === "number";
}

export function buildLocalTaskMigrationPayload(localTasks: Task[]) {
  return localTasks.map((task) => ({
    title: task.title,
    completed: task.done,
    pomodoros: task.pomodoros,
  }));
}

export async function loadTasks(
  supabase: SupabaseClient,
  userId: string,
): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, completed, pomodoros, linked_note_id, linked_note_title, linked_item_id, linked_item_text")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (!error && data && data.length > 0) {
    return (data as unknown as DbTask[]).map(mapDbTask);
  }

  if (error && (error.message.includes("column") || error.code === "PGRST204" || error.code === "42703")) {
    const fallback = await supabase
      .from("tasks")
      .select("id, title, completed, pomodoros")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (fallback.error) throw fallback.error;
    if (fallback.data && fallback.data.length > 0) {
      return (fallback.data as unknown as DbTask[]).map(mapDbTask);
    }
  } else if (error) {
    throw error;
  }

  const localTasks = loadLocalTasks();
  if (localTasks.length === 0) return [];

  // The database decides whether this is the first migration for the user. It
  // serialises concurrent calls (e.g. two tabs) and records a marker, so local
  // tasks are imported at most once and never resurrected after being deleted.
  const { data: migratedTasks, error: migrationError } = await supabase.rpc(
    "migrate_local_tasks",
    { p_tasks: buildLocalTaskMigrationPayload(localTasks) },
  );
  if (migrationError) throw migrationError;
  const rows: DbTask[] = (migratedTasks as unknown as DbTask[]) ?? [];
  return rows.map(mapDbTask);
}

export async function createTask(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  linkedMeta?: LinkedNoteMeta,
): Promise<Task> {
  const insertPayload: Record<string, unknown> = {
    user_id: userId,
    title,
    completed: false,
    pomodoros: 1,
  };
  if (linkedMeta?.linkedNoteId) insertPayload.linked_note_id = linkedMeta.linkedNoteId;
  if (linkedMeta?.linkedNoteTitle) insertPayload.linked_note_title = linkedMeta.linkedNoteTitle;
  if (linkedMeta?.linkedItemId) insertPayload.linked_item_id = linkedMeta.linkedItemId;
  if (linkedMeta?.linkedItemText) insertPayload.linked_item_text = linkedMeta.linkedItemText;

  const { data, error } = await supabase
    .from("tasks")
    .insert(insertPayload)
    .select("id, title, completed, pomodoros, linked_note_id, linked_note_title, linked_item_id, linked_item_text")
    .single();

  if (error && (error.message.includes("column") || error.code === "PGRST204" || error.code === "42703")) {
    const fallback = await supabase
      .from("tasks")
      .insert({ user_id: userId, title, completed: false, pomodoros: 1 })
      .select("id, title, completed, pomodoros")
      .single();
    if (fallback.error) throw fallback.error;
    return mapDbTask(fallback.data as unknown as DbTask);
  }
  if (error) throw error;
  return mapDbTask(data as unknown as DbTask);
}

export async function setTaskCompleted(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
  completed: boolean,
) {
  const { error } = await supabase
    .from("tasks")
    .update({ completed })
    .eq("id", taskId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function updateTaskPomodoros(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
  pomodoros: number,
) {
  const safePomodoros = Math.min(999, Math.max(0, Math.floor(pomodoros)));
  const { error } = await supabase
    .from("tasks")
    .update({ pomodoros: safePomodoros })
    .eq("id", taskId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function deleteTaskById(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
) {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function deleteTasksByIds(
  supabase: SupabaseClient,
  userId: string,
  taskIds: string[],
) {
  if (taskIds.length === 0) return;
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("user_id", userId)
    .in("id", taskIds);
  if (error) throw error;
}

export async function deleteAllTasks(
  supabase: SupabaseClient,
  userId: string,
) {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("user_id", userId);
  if (error) throw error;
}

export async function recordCompletedSession(
  supabase: SupabaseClient,
  userId: string,
  mode: "pomodoro" | "short" | "long",
  durationSeconds: number,
  taskId?: string | null,
) {
  const { error } = await supabase
    .from("pomodoro_sessions")
    .insert({
      user_id: userId,
      mode,
      duration_seconds: durationSeconds,
      task_id: isUuid(taskId) ? taskId : null,
    });
  if (error) throw error;
}
