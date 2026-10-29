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
 * - Returns the task matching selectedTaskId if it is incomplete.
 * - If no task is selected or if the selected task is done/not found, returns null.
 */
export function resolveFocusedTask(
  tasks: Task[],
  selectedTaskId: string | null,
): Task | null {
  if (!selectedTaskId) return null;
  const activeTasks = tasks.filter((task) => !task.done);
  return activeTasks.find((task) => task.id === selectedTaskId) || null;
}

export type LinkedNoteMeta = {
  linkedNoteId?: string;
  linkedNoteTitle?: string;
  linkedItemId?: string;
  linkedItemText?: string;
};

export const LOCAL_TASK_LINKS_KEY = "biarfokus.task_links";

/**
 * Compares two task lists for structural equality (including exact ordering)
 * so background sync polls never trigger unnecessary React re-renders.
 */
export function areTasksEqual(a: Task[], b: Task[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (
      x.id !== y.id ||
      x.title !== y.title ||
      x.done !== y.done ||
      x.pomodoros !== y.pomodoros ||
      x.linkedNoteId !== y.linkedNoteId ||
      x.linkedNoteTitle !== y.linkedNoteTitle ||
      x.linkedItemId !== y.linkedItemId ||
      x.linkedItemText !== y.linkedItemText
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Computes monotonically increasing ISO timestamps (<= nowMs) for ordered task IDs.
 * Because `public.tasks` is always queried with `ORDER BY created_at ASC`, updating
 * `created_at` directly on `public.tasks` persists task priority across all devices
 * using the guaranteed base schema (no extra table or manual SQL migration needed),
 * while any newly created task (`default now()`) naturally lands at the bottom.
 */
export function buildOrderedTaskTimestamps(
  orderedIds: string[],
  nowMs: number = Date.now(),
): Array<{ id: string; createdAt: string }> {
  const validIds = orderedIds.filter(isUuid);
  const baseMs = nowMs - (validIds.length + 2) * 1000;
  return validIds.map((id, index) => ({
    id,
    createdAt: new Date(baseMs + index * 1000).toISOString(),
  }));
}

export async function saveCloudTaskOrder(
  supabase: SupabaseClient,
  userId: string,
  orderedIds: string[],
): Promise<void> {
  const updates = buildOrderedTaskTimestamps(orderedIds);
  if (updates.length === 0) return;

  await Promise.all(
    updates.map(async ({ id, createdAt }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ created_at: createdAt })
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to sync task order to cloud:", error);
      }
    }),
  );
}

export function loadTaskLinks(): Record<string, LinkedNoteMeta> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_TASK_LINKS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, LinkedNoteMeta>) : {};
  } catch {
    return {};
  }
}

export function saveTaskLink(taskId: string, meta: LinkedNoteMeta): void {
  if (typeof window === "undefined") return;
  try {
    const links = loadTaskLinks();
    links[taskId] = meta;
    window.localStorage.setItem(LOCAL_TASK_LINKS_KEY, JSON.stringify(links));
  } catch {}
}

export function deleteTaskLink(taskId: string): void {
  if (typeof window === "undefined") return;
  try {
    const links = loadTaskLinks();
    if (taskId in links) {
      delete links[taskId];
      window.localStorage.setItem(LOCAL_TASK_LINKS_KEY, JSON.stringify(links));
    }
  } catch {}
}

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
      const links = loadTaskLinks();
      return parsedTasks.map((t) => {
        const link = links[t.id];
        if (!link) return t;
        return {
          ...t,
          linkedNoteId: t.linkedNoteId || link.linkedNoteId,
          linkedNoteTitle: t.linkedNoteTitle || link.linkedNoteTitle,
          linkedItemId: t.linkedItemId || link.linkedItemId,
          linkedItemText: t.linkedItemText || link.linkedItemText,
        };
      });
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
  // Clean up any legacy per-browser order keys so stale local order never overrides cloud order
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(`biarfokus.tasks.order.${userId}`);
      window.localStorage.removeItem(`biarfokus.tasks.order_ts.${userId}`);
    } catch {}
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, completed, pomodoros, linked_note_id, linked_note_title, linked_item_id, linked_item_text")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  let loadedTasks: Task[] | null = null;

  if (!error && data && data.length > 0) {
    loadedTasks = (data as unknown as DbTask[]).map(mapDbTask);
  } else if (error && (error.message.includes("column") || error.code === "PGRST204" || error.code === "42703")) {
    const fallback = await supabase
      .from("tasks")
      .select("id, title, completed, pomodoros")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (fallback.error) throw fallback.error;
    if (fallback.data && fallback.data.length > 0) {
      loadedTasks = (fallback.data as unknown as DbTask[]).map(mapDbTask);
    }
  } else if (error) {
    throw error;
  }

  if (loadedTasks) {
    const links = loadTaskLinks();
    return loadedTasks.map((t) => {
      const link = links[t.id];
      if (!link) return t;
      return {
        ...t,
        linkedNoteId: t.linkedNoteId || link.linkedNoteId,
        linkedNoteTitle: t.linkedNoteTitle || link.linkedNoteTitle,
        linkedItemId: t.linkedItemId || link.linkedItemId,
        linkedItemText: t.linkedItemText || link.linkedItemText,
      };
    });
  }

  const localTasks = loadLocalTasks();
  if (localTasks.length === 0) return [];

  const { data: migratedTasks, error: migrationError } = await supabase.rpc(
    "migrate_local_tasks",
    { p_tasks: buildLocalTaskMigrationPayload(localTasks) },
  );
  if (migrationError) throw migrationError;
  const rows: DbTask[] = (migratedTasks as unknown as DbTask[]) ?? [];
  const mapped = rows.map(mapDbTask);
  const links = loadTaskLinks();
  return mapped.map((t) => {
    const link = links[t.id];
    if (!link) return t;
    return {
      ...t,
      linkedNoteId: t.linkedNoteId || link.linkedNoteId,
      linkedNoteTitle: t.linkedNoteTitle || link.linkedNoteTitle,
      linkedItemId: t.linkedItemId || link.linkedItemId,
      linkedItemText: t.linkedItemText || link.linkedItemText,
    };
  });
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
    const task = mapDbTask(fallback.data as unknown as DbTask);
    if (linkedMeta) {
      if (linkedMeta.linkedNoteId) task.linkedNoteId = linkedMeta.linkedNoteId;
      if (linkedMeta.linkedNoteTitle) task.linkedNoteTitle = linkedMeta.linkedNoteTitle;
      if (linkedMeta.linkedItemId) task.linkedItemId = linkedMeta.linkedItemId;
      if (linkedMeta.linkedItemText) task.linkedItemText = linkedMeta.linkedItemText;
      saveTaskLink(task.id, linkedMeta);
    }
    return task;
  }
  if (error) throw error;
  const task = mapDbTask(data as unknown as DbTask);
  if (linkedMeta) {
    saveTaskLink(task.id, linkedMeta);
  }
  return task;
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
  deleteTaskLink(taskId);
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
  for (const id of taskIds) {
    deleteTaskLink(id);
  }
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
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(LOCAL_TASK_LINKS_KEY);
    } catch {}
  }
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
