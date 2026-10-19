import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbKanbanBoard, KanbanBoard, KanbanBoardMember, KanbanList, KanbanMemberRole } from "@/types/domain";

export function mapDbKanbanBoard(row: DbKanbanBoard, currentUserId?: string | null): KanbanBoard {
  const isOwner = currentUserId ? row.user_id === currentUserId : true;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title || "My Board",
    description: row.description || "",
    background: row.background || "wave-blue",
    lists: Array.isArray(row.lists) ? (row.lists as KanbanList[]) : [],
    starred: Boolean(row.starred),
    role: (isOwner ? "owner" : "editor") as KanbanMemberRole,
    isShared: !isOwner,
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
    // Queries all boards accessible by the authenticated user via RLS (owned or member)
    const { data, error } = await supabase
      .from("kanban_boards")
      .select("*")
      .order("starred", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) {
      // If table doesn't exist yet, gracefully return empty so local fallback is used
      if (error.code === "42P01" || error.message.includes("does not exist")) {
        return [];
      }
      throw error;
    }

    return ((data as DbKanbanBoard[]) || []).map((row) => mapDbKanbanBoard(row, userId));
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
      user_id: board.userId || userId,
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
      .eq("id", boardId);

    if (error && error.code !== "42P01") throw error;
  } catch (err) {
    console.warn("Cloud kanban delete failed.", err);
  }
}

export async function createBoardInviteApi(
  boardId: string,
  role: "editor" | "viewer" = "editor",
): Promise<{ ok: boolean; inviteCode?: string; error?: string }> {
  try {
    const res = await fetch("/api/kanban/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boardId, role }),
    });
    const data = (await res.json()) as { ok?: boolean; inviteCode?: string; error?: string };
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || "Gagal membuat undangan." };
    }
    return { ok: true, inviteCode: data.inviteCode };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Gagal menghubungi server undangan.",
    };
  }
}

export async function loadBoardMembersApi(
  boardId: string,
): Promise<KanbanBoardMember[]> {
  try {
    const res = await fetch(`/api/kanban/invite?boardId=${encodeURIComponent(boardId)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { members?: KanbanBoardMember[] };
    return data.members || [];
  } catch {
    return [];
  }
}

export async function joinBoardViaInviteApi(
  inviteCode: string,
): Promise<{ ok: boolean; board?: KanbanBoard; boardTitle?: string; error?: string }> {
  try {
    const res = await fetch("/api/kanban/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      board?: KanbanBoard;
      boardTitle?: string;
      error?: string;
    };
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || "Gagal bergabung ke papan proyek." };
    }
    return { ok: true, board: data.board, boardTitle: data.boardTitle };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Koneksi terputus saat mencoba bergabung.",
    };
  }
}
