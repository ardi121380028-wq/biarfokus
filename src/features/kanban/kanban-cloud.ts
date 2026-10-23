import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbKanbanBoard, KanbanBoard, KanbanBoardMember, KanbanList, KanbanMemberRole } from "@/types/domain";

export function mapDbKanbanBoard(
  row: DbKanbanBoard,
  currentUserId?: string | null,
  membershipRole?: KanbanMemberRole,
): KanbanBoard {
  const isOwner = currentUserId ? row.user_id === currentUserId : true;
  const role: KanbanMemberRole = isOwner
    ? "owner"
    : membershipRole || "viewer";

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title || "My Board",
    description: row.description || "",
    background: row.background || "wave-blue",
    lists: Array.isArray(row.lists) ? (row.lists as KanbanList[]) : [],
    starred: Boolean(row.starred),
    role,
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
    if (!userId) return [];

    // Query all boards accessible to user (owned or shared member) via RLS
    const { data, error } = await supabase
      .from("kanban_boards")
      .select("*")
      .order("starred", { ascending: false })
      .order("updated_at", { ascending: false });

    let rows: DbKanbanBoard[] = [];
    if (error) {
      // Fallback: try querying explicitly with eq("user_id", userId)
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("kanban_boards")
        .select("*")
        .eq("user_id", userId)
        .order("starred", { ascending: false })
        .order("updated_at", { ascending: false });

      if (fallbackError) {
        if (fallbackError.code === "42P01" || fallbackError.message?.includes("does not exist")) {
          console.warn("[BiarFokus Cloud] Tabel 'kanban_boards' belum ada di Supabase. Jalankan file migrasi 'supabase/migrations/20261019100000_add_kanban_boards.sql' di Supabase SQL Editor.");
          return [];
        }
        throw fallbackError;
      }
      rows = (fallbackData as DbKanbanBoard[]) || [];
    } else {
      rows = (data as DbKanbanBoard[]) || [];
    }

    // Query user's memberships to ensure viewers stay viewers
    const memberRoleMap = new Map<string, KanbanMemberRole>();
    try {
      const { data: memberRows } = await supabase
        .from("kanban_board_members")
        .select("board_id, role")
        .eq("user_id", userId);

      if (memberRows && Array.isArray(memberRows)) {
        for (const m of memberRows) {
          if (m.board_id && m.role) {
            memberRoleMap.set(m.board_id, m.role as KanbanMemberRole);
          }
        }
      }
    } catch {}

    return rows.map((row) => {
      const isOwner = row.user_id === userId;
      const assignedRole = memberRoleMap.get(row.id) || (isOwner ? "owner" : "viewer");
      return mapDbKanbanBoard(row, userId, assignedRole);
    });
  } catch (err) {
    console.warn("Cloud kanban fetch skipped or failed; using local state.", err);
    return [];
  }
}

export async function upsertCloudBoard(
  supabase: SupabaseClient,
  userId: string,
  board: KanbanBoard,
): Promise<boolean> {
  try {
    if (!userId || !board.id) return false;

    const isSharedCollab = Boolean(board.isShared && board.userId && board.userId !== userId);

    if (isSharedCollab) {
      // Editors cannot INSERT or change user_id (the owner); they can only UPDATE
      const { data, error } = await supabase
        .from("kanban_boards")
        .update({
          title: board.title || "My Board",
          description: board.description || "",
          background: board.background || "wave-blue",
          lists: board.lists || [],
          starred: Boolean(board.starred),
          updated_at: new Date().toISOString(),
        })
        .eq("id", board.id)
        .select("id");

      if (error || !data || data.length === 0) {
        console.warn("[BiarFokus Cloud] Member board update error:", error);
        return false;
      }
      return true;
    }

    // Owned board: ensure user_id is the authenticated user's UUID (never "guest" or invalid string)
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

    // 1. Try insert first (safest and standard for newly created boards with RLS)
    const { error: insertError } = await supabase
      .from("kanban_boards")
      .insert(payload);

    if (!insertError) {
      return true;
    }

    // 2. If insert error indicates duplicate key (row already exists), update it
    if (
      insertError.code === "23505" ||
      insertError.message?.includes("duplicate") ||
      insertError.message?.includes("unique") ||
      insertError.message?.includes("already exists")
    ) {
      const { data: updateData, error: updateError } = await supabase
        .from("kanban_boards")
        .update({
          title: payload.title,
          description: payload.description,
          background: payload.background,
          lists: payload.lists,
          starred: payload.starred,
          updated_at: payload.updated_at,
        })
        .eq("id", board.id)
        .eq("user_id", userId)
        .select("id");

      if (!updateError && updateData && updateData.length > 0) {
        return true;
      }
    }

    // 3. Fallback: try upsert
    const { error: upsertError } = await supabase
      .from("kanban_boards")
      .upsert(payload, { onConflict: "id" });

    if (!upsertError) {
      return true;
    }

    if (
      insertError.code === "42P01" ||
      insertError.message?.includes("does not exist") ||
      upsertError?.code === "42P01" ||
      upsertError?.message?.includes("does not exist")
    ) {
      console.warn(
        "[BiarFokus Cloud] Tabel 'kanban_boards' belum ada di Supabase. Jalankan file migrasi 'supabase/migrations/20261019100000_add_kanban_boards.sql' di Supabase SQL Editor."
      );
      return false;
    }

    console.warn("[BiarFokus Cloud] Cloud kanban save failed:", insertError, upsertError);
    return false;
  } catch (err) {
    console.warn("[BiarFokus Cloud] Cloud kanban upsert skipped or failed.", err);
    return false;
  }
}

export async function deleteCloudBoard(
  supabase: SupabaseClient,
  userId: string,
  boardId: string,
): Promise<void> {
  try {
    if (!userId || !boardId) return;

    const { error } = await supabase
      .from("kanban_boards")
      .delete()
      .eq("id", boardId)
      .eq("user_id", userId);

    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        console.warn("[BiarFokus Cloud] Tabel 'kanban_boards' belum ada di Supabase. Jalankan file migrasi 'supabase/migrations/20261019100000_add_kanban_boards.sql' di Supabase SQL Editor.");
        return;
      }
      console.warn("Cloud kanban delete failed.", error);
    }
  } catch (err) {
    console.warn("Cloud kanban delete failed.", err);
  }
}

export async function createBoardInviteApi(
  target: string | KanbanBoard,
  role: "editor" | "viewer" = "editor",
): Promise<{ ok: boolean; inviteCode?: string; role?: string; error?: string }> {
  try {
    const isBoardObj = typeof target === "object" && target !== null && "id" in target;
    const boardId = isBoardObj ? target.id : target;
    const boardPayload = isBoardObj
      ? {
          title: target.title,
          description: target.description,
          background: target.background,
          lists: target.lists,
        }
      : undefined;

    const res = await fetch("/api/kanban/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boardId, role, board: boardPayload }),
    });
    const data = (await res.json()) as { ok?: boolean; inviteCode?: string; role?: string; error?: string };
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || "Gagal membuat undangan." };
    }
    return { ok: true, inviteCode: data.inviteCode, role: data.role };
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
