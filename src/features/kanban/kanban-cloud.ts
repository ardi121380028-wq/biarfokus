import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbKanbanBoard, KanbanBoard, KanbanList } from "@/types/domain";

export function mapDbKanbanBoard(row: DbKanbanBoard): KanbanBoard {
  return {
    id: row.id,
    title: row.title || "My Board",
    description: row.description || "",
    background: row.background || "wave-blue",
    lists: Array.isArray(row.lists) ? (row.lists as KanbanList[]) : [],
    starred: Boolean(row.starred),
    createdAt: row.created_at,
    updatedAt: new Date(row.updated_at).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export async function loadCloudBoards(
  supabase: SupabaseClient,
  userId: string,
): Promise<KanbanBoard[]> {
  try {
    const { data, error } = await supabase
      .from("kanban_boards")
      .select("*")
      .eq("user_id", userId)
      .order("starred", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) {
      // If table doesn't exist yet, gracefully return empty so local fallback is used
      if (error.code === "42P01" || error.message.includes("does not exist")) {
        return [];
      }
      throw error;
    }

    return ((data as DbKanbanBoard[]) || []).map(mapDbKanbanBoard);
  } catch (err) {
    console.warn("Cloud kanban fetch skipped or failed; using local state.", err);
    return [];
  }
}

export async function upsertCloudBoard(
  supabase: SupabaseClient,
  userId: string,
  board: KanbanBoard,
): Promise<void> {
  try {
    const payload = {
      id: board.id,
      user_id: userId,
      title: board.title || "My Board",
      description: board.description || "",
      background: board.background || "wave-blue",
      lists: board.lists || [],
      starred: Boolean(board.starred),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("kanban_boards").upsert(payload);
    if (error) {
      if (error.code === "42P01" || error.message.includes("does not exist")) {
        return;
      }
      throw error;
    }
  } catch (err) {
    console.warn("Cloud kanban upsert skipped or failed.", err);
  }
}

export async function deleteCloudBoard(
  supabase: SupabaseClient,
  userId: string,
  boardId: string,
): Promise<void> {
  try {
    const { error } = await supabase
      .from("kanban_boards")
      .delete()
      .eq("id", boardId)
      .eq("user_id", userId);

    if (error && error.code !== "42P01") throw error;
  } catch (err) {
    console.warn("Cloud kanban delete failed.", err);
  }
}
