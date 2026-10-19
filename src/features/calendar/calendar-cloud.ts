import type { SupabaseClient } from "@supabase/supabase-js";
import type { CalendarEvent } from "@/types/domain";

type DbCalendarEvent = {
  id: string;
  user_id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  color: string;
  category: string;
  description: string | null;
  linked_note_id: string | null;
  linked_note_title: string | null;
  linked_item_id: string | null;
  linked_item_text?: string | null;
  linked_kanban_card_id?: string | null;
  linked_kanban_board_id?: string | null;
  linked_kanban_board_title?: string | null;
  recurrence?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export function mapDbCalendarEvent(row: DbCalendarEvent): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    color: row.color,
    category: row.category === "task" ? "task" : "event",
    description: row.description || undefined,
    linkedNoteId: row.linked_note_id || undefined,
    linkedNoteTitle: row.linked_note_title || undefined,
    linkedItemId: row.linked_item_id || undefined,
    linkedItemText: row.linked_item_text || undefined,
    linkedKanbanCardId: row.linked_kanban_card_id || undefined,
    linkedKanbanBoardId: row.linked_kanban_board_id || undefined,
    linkedKanbanBoardTitle: row.linked_kanban_board_title || undefined,
    recurrence: (row.recurrence as CalendarEvent["recurrence"]) || undefined,
  };
}

export async function loadCloudEvents(
  supabase: SupabaseClient,
  userId: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return ((data as DbCalendarEvent[]) || []).map(mapDbCalendarEvent);
}

export async function upsertCloudEvent(
  supabase: SupabaseClient,
  userId: string,
  event: CalendarEvent,
): Promise<void> {
  const payload = {
    id: event.id,
    user_id: userId,
    title: event.title,
    date: event.date,
    start_time: event.startTime,
    end_time: event.endTime,
    color: event.color,
    category: event.category || "event",
    description: event.description || null,
    linked_note_id: event.linkedNoteId || null,
    linked_note_title: event.linkedNoteTitle || null,
    linked_item_id: event.linkedItemId || null,
    linked_item_text: event.linkedItemText || null,
    linked_kanban_card_id: event.linkedKanbanCardId || null,
    linked_kanban_board_id: event.linkedKanbanBoardId || null,
    linked_kanban_board_title: event.linkedKanbanBoardTitle || null,
    recurrence: event.recurrence || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("calendar_events").upsert(payload);
  if (error) throw error;
}

export async function deleteCloudEvent(
  supabase: SupabaseClient,
  userId: string,
  eventId: string,
): Promise<void> {
  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId)
    .eq("user_id", userId);

  if (error) throw error;
}
