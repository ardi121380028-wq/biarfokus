import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbKanbanBoard, KanbanBoard, KanbanBoardMember, KanbanLabel, KanbanList, KanbanMemberRole } from "@/types/domain";

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
    labels: Array.isArray((row as unknown as { labels?: unknown }).labels)
      ? ((row as unknown as { labels: KanbanLabel[] }).labels)
      : undefined,
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

    // 1. Primary: Load owned boards directly by user_id (guaranteed reliable, just like notes & calendar)
    const { data: ownedData, error: ownedError } = await supabase
      .from("kanban_boards")
      .select("*")
      .eq("user_id", userId)
      .order("starred", { ascending: false })
      .order("updated_at", { ascending: false });

    if (ownedError) {
      if (ownedError.code === "42P01" || ownedError.message?.includes("does not exist")) {
        console.warn("[BiarFokus Cloud] Tabel 'kanban_boards' belum ada di Supabase. Jalankan file migrasi di Supabase SQL Editor.");
        return [];
      }
      throw ownedError;
    }

    const ownedBoards: KanbanBoard[] = ((ownedData as DbKanbanBoard[]) || []).map((row) =>
      mapDbKanbanBoard(row, userId, "owner")
    );

    // 2. Secondary: Load shared collaboration boards (non-blocking, never fails owned boards)
    try {
      const { data: memberRows } = await supabase
        .from("kanban_board_members")
        .select("board_id, role")
        .eq("user_id", userId)
        .neq("role", "owner");

      if (memberRows && memberRows.length > 0) {
        const sharedBoardIds = memberRows.map((m) => m.board_id).filter(Boolean);
        const { data: sharedData } = await supabase
          .from("kanban_boards")
          .select("*")
          .in("id", sharedBoardIds);

        if (sharedData && Array.isArray(sharedData)) {
          const roleMap = new Map<string, KanbanMemberRole>();
          for (const m of memberRows) {
            if (m.board_id && m.role) roleMap.set(m.board_id, m.role as KanbanMemberRole);
          }
          for (const row of sharedData as DbKanbanBoard[]) {
            if (!ownedBoards.some((b) => b.id === row.id)) {
              ownedBoards.push(mapDbKanbanBoard(row, userId, roleMap.get(row.id) || "viewer"));
            }
          }
        }
      }
    } catch {
      // Non-blocking: failure in shared boards lookup must NEVER affect owned boards
    }

    return ownedBoards;
  } catch (err) {
    console.warn("[BiarFokus Cloud] Direct browser kanban fetch failed; trying server API fallback.", err);
    // 3. Fallback: try server API route if browser direct client threw
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/kanban/boards", {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
        });
        if (res.ok) {
          const json = (await res.json()) as { boards?: KanbanBoard[] };
          if (Array.isArray(json.boards)) {
            return json.boards;
          }
        }
      } catch {}
    }
    // Re-throw if both direct client and server API fallback failed (e.g. offline)
    // so caller doesn't mistake network disconnect for 0 boards
    throw err;
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
      // Shared board: editors only update content
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

      if (!error && data && data.length > 0) return true;

      // Fallback to server API route for member updates
      if (typeof window !== "undefined") {
        try {
          const res = await fetch("/api/kanban/boards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ board }),
          });
          if (res.ok) {
            const json = (await res.json()) as { ok?: boolean };
            if (json?.ok) return true;
          }
        } catch {}
      }
      return false;
    }

    // Owned board: ensure user_id is the authenticated user's UUID
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

    // 1. Direct Supabase upsert (clean, atomic, and standard just like notes & calendar)
    const { error: upsertError } = await supabase
      .from("kanban_boards")
      .upsert(payload, { onConflict: "id" });

    if (!upsertError) {
      return true;
    }

    // 2. If upsert threw conflict or RLS quirk, try insert
    const { error: insertError } = await supabase
      .from("kanban_boards")
      .insert(payload);

    if (!insertError) {
      return true;
    }

    // 3. Or try update
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

    // 4. Server API route fallback (guaranteed to run in server context with cookies/tokens)
    if (typeof window !== "undefined") {
      try {
        const authHeaders: Record<string, string> = { "Content-Type": "application/json" };
        try {
          const session = (await supabase.auth.getSession()).data.session;
          if (session?.access_token) {
            authHeaders.Authorization = `Bearer ${session.access_token}`;
          }
        } catch {}

        const res = await fetch("/api/kanban/boards", {
          method: "POST",
          headers: authHeaders,
          credentials: "include",
          body: JSON.stringify({ board: { ...board, userId } }),
        });
        if (res.ok) {
          const json = (await res.json()) as { ok?: boolean };
          if (json?.ok) return true;
        }
      } catch {}
    }

    console.warn("[BiarFokus Cloud] Cloud kanban save failed across all methods:", upsertError, insertError, updateError);
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

    try {
      await supabase
        .from("kanban_board_members")
        .delete()
        .eq("board_id", boardId)
        .eq("user_id", userId);
    } catch {}

    if (error) {
      console.warn("Direct cloud kanban delete failed, attempting API route fallback.", error);
      if (typeof window !== "undefined") {
        try {
          await fetch(`/api/kanban/boards?id=${encodeURIComponent(boardId)}`, {
            method: "DELETE",
            credentials: "include",
          });
        } catch {}
      }
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
