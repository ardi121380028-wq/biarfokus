import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  apiJson,
  createRateLimiter,
  getClientKey,
  rateLimitResponse,
  resolveCorrelationId,
} from "@/lib/api/request-guard";
import { mapDbKanbanBoard } from "@/features/kanban/kanban-cloud";
import type { DbKanbanBoard, KanbanBoard, KanbanMemberRole } from "@/types/domain";

const ROUTE = "/api/kanban/boards";
const limiter = createRateLimiter({ limit: 120, windowMs: 60_000 });

export async function GET(request: Request) {
  const correlationId = resolveCorrelationId(request.headers.get("x-correlation-id"));
  const limit = limiter.check(`${ROUTE}:get:${getClientKey(request.headers)}`, Date.now());
  if (!limit.allowed) return rateLimitResponse(limit, correlationId);

  try {
    const supabase = await getSupabaseServerClient().catch(() => null);
    if (!supabase) {
      return apiJson({ error: "Supabase not configured", boards: [] }, { status: 503, correlationId });
    }

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData.user) {
      return apiJson({ error: "Unauthorized", boards: [] }, { status: 401, correlationId });
    }

    const userId = authData.user.id;

    // Load boards accessible to user
    const { data: boardsData, error: boardsErr } = await supabase
      .from("kanban_boards")
      .select("*")
      .order("starred", { ascending: false })
      .order("updated_at", { ascending: false });

    if (boardsErr) {
      if (boardsErr.code === "42P01" || boardsErr.message?.includes("does not exist")) {
        return apiJson({ boards: [] }, { correlationId });
      }
      return apiJson({ error: boardsErr.message, boards: [] }, { status: 500, correlationId });
    }

    // Load memberships for assigned roles
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

    const mappedBoards = ((boardsData as DbKanbanBoard[]) || []).map((row) => {
      const isOwner = row.user_id === userId;
      const assignedRole = memberRoleMap.get(row.id) || (isOwner ? "owner" : "viewer");
      return mapDbKanbanBoard(row, userId, assignedRole);
    });

    return apiJson({ boards: mappedBoards }, { correlationId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return apiJson({ error: message, boards: [] }, { status: 500, correlationId });
  }
}

export async function POST(request: Request) {
  const correlationId = resolveCorrelationId(request.headers.get("x-correlation-id"));
  const limit = limiter.check(`${ROUTE}:post:${getClientKey(request.headers)}`, Date.now());
  if (!limit.allowed) return rateLimitResponse(limit, correlationId);

  try {
    const supabase = await getSupabaseServerClient().catch(() => null);
    if (!supabase) {
      return apiJson({ error: "Supabase not configured" }, { status: 503, correlationId });
    }

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData.user) {
      return apiJson({ error: "Unauthorized" }, { status: 401, correlationId });
    }

    const userId = authData.user.id;
    const body = (await request.json().catch(() => ({}))) as { board?: KanbanBoard };
    const board = body.board;

    if (!board || !board.id) {
      return apiJson({ error: "Invalid board payload" }, { status: 400, correlationId });
    }

    const isSharedCollab = Boolean(board.isShared && board.userId && board.userId !== userId);

    if (isSharedCollab) {
      const { error: updateErr } = await supabase
        .from("kanban_boards")
        .update({
          title: board.title || "My Board",
          description: board.description || "",
          background: board.background || "wave-blue",
          lists: board.lists || [],
          starred: Boolean(board.starred),
          updated_at: new Date().toISOString(),
        })
        .eq("id", board.id);

      if (updateErr) {
        return apiJson({ error: updateErr.message }, { status: 500, correlationId });
      }
      return apiJson({ ok: true, id: board.id }, { correlationId });
    }

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

    // Try insert first
    const { error: insertErr } = await supabase.from("kanban_boards").insert(payload);
    if (!insertErr) {
      return apiJson({ ok: true, id: board.id }, { correlationId });
    }

    // If duplicate, update
    if (
      insertErr.code === "23505" ||
      insertErr.message?.includes("duplicate") ||
      insertErr.message?.includes("unique") ||
      insertErr.message?.includes("already exists")
    ) {
      const { error: updateErr } = await supabase
        .from("kanban_boards")
        .update({
          title: payload.title,
          description: payload.description,
          background: payload.background,
          lists: payload.lists,
          starred: payload.starred,
          updated_at: payload.updated_at,
        })
        .eq("id", board.id);

      if (updateErr) {
        return apiJson({ error: updateErr.message }, { status: 500, correlationId });
      }
      return apiJson({ ok: true, id: board.id }, { correlationId });
    }

    // Fallback upsert
    const { error: upsertErr } = await supabase.from("kanban_boards").upsert(payload, { onConflict: "id" });
    if (upsertErr) {
      return apiJson({ error: upsertErr.message }, { status: 500, correlationId });
    }

    return apiJson({ ok: true, id: board.id }, { correlationId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return apiJson({ error: message }, { status: 500, correlationId });
  }
}

export async function DELETE(request: Request) {
  const correlationId = resolveCorrelationId(request.headers.get("x-correlation-id"));
  const limit = limiter.check(`${ROUTE}:delete:${getClientKey(request.headers)}`, Date.now());
  if (!limit.allowed) return rateLimitResponse(limit, correlationId);

  try {
    const supabase = await getSupabaseServerClient().catch(() => null);
    if (!supabase) {
      return apiJson({ error: "Supabase not configured" }, { status: 503, correlationId });
    }

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData.user) {
      return apiJson({ error: "Unauthorized" }, { status: 401, correlationId });
    }

    const userId = authData.user.id;
    const url = new URL(request.url);
    const boardId = url.searchParams.get("id")?.trim();

    if (!boardId) {
      return apiJson({ error: "Missing board id" }, { status: 400, correlationId });
    }

    const { error: delErr } = await supabase
      .from("kanban_boards")
      .delete()
      .eq("id", boardId)
      .eq("user_id", userId);

    if (delErr) {
      return apiJson({ error: delErr.message }, { status: 500, correlationId });
    }

    return apiJson({ ok: true, id: boardId }, { correlationId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return apiJson({ error: message }, { status: 500, correlationId });
  }
}
