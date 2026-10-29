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

export function getTaskOrderStorageKey(userId: string): string {
  return `biarfokus.tasks.order.${userId}`;
}

export function getTaskOrderTimestampKey(userId: string): string {
  return `biarfokus.tasks.order_ts.${userId}`;
}

export function loadLocalTaskOrder(userId: string): { order: string[]; updatedAt: number } {
  if (typeof window === "undefined") return { order: [], updatedAt: 0 };
  try {
    const rawOrder = window.localStorage.getItem(getTaskOrderStorageKey(userId));
    const rawTs = window.localStorage.getItem(getTaskOrderTimestampKey(userId));
    const parsedOrder: unknown = rawOrder ? JSON.parse(rawOrder) : [];
    const order = Array.isArray(parsedOrder)
      ? parsedOrder.filter((id): id is string => typeof id === "string")
      : [];
    const updatedAt = rawTs ? Number(rawTs) || 0 : 0;
    return { order, updatedAt };
  } catch {
    return { order: [], updatedAt: 0 };
  }
}

export function saveLocalTaskOrder(userId: string, order: string[], updatedAt: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getTaskOrderStorageKey(userId), JSON.stringify(order));
    window.localStorage.setItem(getTaskOrderTimestampKey(userId), String(updatedAt));
  } catch {}
}

/**
 * Picks the winning task order between cloud and local storage based on timestamps.
 * Cloud wins whenever it has a non-empty order and its timestamp is >= local timestamp
 * (including when local order is legacy without a timestamp, i.e. updatedAt === 0).
 */
export function resolveAuthoritativeTaskOrder(
  localOrder: string[],
  localUpdatedAt: number,
  cloudOrder: string[],
  cloudUpdatedAt: number,
): { order: string[]; source: "cloud" | "local" | "none"; updatedAt: number } {
  if (cloudOrder.length > 0 && cloudUpdatedAt >= localUpdatedAt) {
    return { order: cloudOrder, source: "cloud", updatedAt: cloudUpdatedAt };
  }
  if (localOrder.length > 0) {
    return { order: localOrder, source: "local", updatedAt: localUpdatedAt };
  }
  if (cloudOrder.length > 0) {
    return { order: cloudOrder, source: "cloud", updatedAt: cloudUpdatedAt };
  }
  return { order: [], source: "none", updatedAt: 0 };
}

export function sortTasksByOrder(tasks: Task[], orderIds: string[]): Task[] {
  if (orderIds.length === 0) return tasks;
  const orderMap = new Map(orderIds.map((id, idx) => [id, idx]));
  return [...tasks].sort((a, b) => {
    const posA = orderMap.has(a.id) ? (orderMap.get(a.id) as number) : 99999;
    const posB = orderMap.has(b.id) ? (orderMap.get(b.id) as number) : 99999;
    return posA - posB;
  });
}

export async function saveCloudTaskOrder(
  supabase: SupabaseClient,
  userId: string,
  orderedIds: string[],
  updatedAt: number = Date.now(),
): Promise<void> {
  // 1. Persist order in `profiles.settings` JSONB (works immediately with existing schema across all devices)
  try {
    const { data: existing } = await supabase
      .from("profiles")
      .select("settings")
      .eq("id", userId)
      .maybeSingle();

    const prevSettings =
      existing?.settings && typeof existing.settings === "object" && !Array.isArray(existing.settings)
        ? (existing.settings as Record<string, unknown>)
        : {};

    await supabase
      .from("profiles")
      .update({
        settings: {
          ...prevSettings,
          taskOrder: orderedIds,
          taskOrderUpdatedAt: updatedAt,
        },
      })
      .eq("id", userId);
  } catch (err) {
    console.warn("Failed to sync task order to profile settings:", err);
  }

  // 2. Also persist `sort_order` per row in `public.tasks` when the optional column migration is present
  try {
    await Promise.all(
      orderedIds.map((taskId, index) =>
        supabase
          .from("tasks")
          .update({ sort_order: index })
          .eq("id", taskId)
          .eq("user_id", userId),
      ),
    );
  } catch {
    // Non-blocking if `sort_order` column is not migrated yet
  }
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

type DbTaskWithSort = DbTask & { sort_order?: number | null };

export async function loadTasks(
  supabase: SupabaseClient,
  userId: string,
): Promise<Task[]> {
  const [tasksQueryResult, profileQueryResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, completed, pomodoros, sort_order, linked_note_id, linked_note_title, linked_item_id, linked_item_text")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("settings")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  let { data, error } = tasksQueryResult;
  let loadedRows: DbTaskWithSort[] | null = null;

  if (!error && data && data.length > 0) {
    loadedRows = data as unknown as DbTaskWithSort[];
  } else if (error && (error.message.includes("column") || error.code === "PGRST204" || error.code === "42703")) {
    const retryLinked = await supabase
      .from("tasks")
      .select("id, title, completed, pomodoros, linked_note_id, linked_note_title, linked_item_id, linked_item_text")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (!retryLinked.error) {
      data = retryLinked.data as typeof data;
      error = null;
      if (retryLinked.data && retryLinked.data.length > 0) {
        loadedRows = retryLinked.data as unknown as DbTaskWithSort[];
      }
    } else if (
      retryLinked.error.message.includes("column") ||
      retryLinked.error.code === "PGRST204" ||
      retryLinked.error.code === "42703"
    ) {
      const fallback = await supabase
        .from("tasks")
        .select("id, title, completed, pomodoros")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (fallback.error) throw fallback.error;
      error = null;
      if (fallback.data && fallback.data.length > 0) {
        loadedRows = fallback.data as unknown as DbTaskWithSort[];
      }
    } else {
      throw retryLinked.error;
    }
  } else if (error) {
    throw error;
  }

  // Extract cloud task order from `profiles.settings` (or fallback to `tasks.sort_order`)
  let cloudOrder: string[] = [];
  let cloudUpdatedAt = 0;
  const rawSettings = profileQueryResult.data?.settings;
  if (rawSettings && typeof rawSettings === "object" && !Array.isArray(rawSettings)) {
    const s = rawSettings as Record<string, unknown>;
    if (Array.isArray(s.taskOrder)) {
      cloudOrder = s.taskOrder.filter((id): id is string => typeof id === "string");
      cloudUpdatedAt = typeof s.taskOrderUpdatedAt === "number" ? s.taskOrderUpdatedAt : 1;
    }
  }
  if (cloudOrder.length === 0 && loadedRows && loadedRows.some((r) => typeof r.sort_order === "number")) {
    cloudOrder = [...loadedRows]
      .sort((a, b) => (a.sort_order ?? 99999) - (b.sort_order ?? 99999))
      .map((r) => r.id);
    cloudUpdatedAt = 1;
  }

  if (loadedRows) {
    const links = loadTaskLinks();
    const mapped = loadedRows.map((row) => {
      const t = mapDbTask(row);
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

    const { order: localOrder, updatedAt: localUpdatedAt } = loadLocalTaskOrder(userId);
    const resolved = resolveAuthoritativeTaskOrder(
      localOrder,
      localUpdatedAt,
      cloudOrder,
      cloudUpdatedAt,
    );

    if (resolved.source === "cloud" && resolved.order.length > 0) {
      saveLocalTaskOrder(userId, resolved.order, resolved.updatedAt);
    }

    return sortTasksByOrder(mapped, resolved.order);
  }

  // If user already had tasks previously and deleted all of them (data is empty array []),
  // `migrate_local_tasks` RPC checks the marker so deleted tasks are never resurrected.
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
