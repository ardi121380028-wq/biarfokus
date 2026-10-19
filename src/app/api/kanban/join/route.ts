import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  apiJson,
  createRateLimiter,
  getClientKey,
  logApiEvent,
  rateLimitResponse,
  resolveCorrelationId,
} from "@/lib/api/request-guard";
import { mapDbKanbanBoard } from "@/features/kanban/kanban-cloud";
import type { DbKanbanBoard } from "@/types/domain";

const ROUTE = "/api/kanban/join";
const limiter = createRateLimiter({ limit: 20, windowMs: 60_000 });

export async function POST(request: Request) {
  const correlationId = resolveCorrelationId(request.headers.get("x-correlation-id"));
  const limit = limiter.check(`${ROUTE}:${getClientKey(request.headers)}`, Date.now());
  if (!limit.allowed) return rateLimitResponse(limit, correlationId);

  try {
    const supabase = await getSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return apiJson(
        { error: "Silakan login terlebih dahulu untuk bergabung ke papan proyek." },
        { status: 401, correlationId },
      );
    }

    const body = (await request.json().catch(() => ({}))) as { inviteCode?: unknown };
    const rawInviteCode = typeof body.inviteCode === "string" ? body.inviteCode.trim() : "";

    if (!rawInviteCode) {
      return apiJson({ error: "Kode undangan diperlukan." }, { status: 400, correlationId });
    }

function decodeFallbackInviteToken(
  code: string,
): { boardId: string; role: "editor" | "viewer" } | null {
  if (!code.startsWith("bf_inv_")) return null;
  const payloadStr = code.slice("bf_inv_".length);
  try {
    const json = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf-8"));
    if (json && typeof json.b === "string") {
      return {
        boardId: json.b,
        role: json.r === "viewer" ? "viewer" : "editor",
      };
    }
  } catch {
    // not base64url encoded payload
  }
  return null;
}

    let boardId: string | null = null;
    let boardTitle = "Papan Proyek";
    let assignedRole: "editor" | "viewer" = "editor";

    // 1. Check fallback encoded invite token
    const fallbackDecoded = decodeFallbackInviteToken(rawInviteCode);
    if (fallbackDecoded) {
      boardId = fallbackDecoded.boardId;
      assignedRole = fallbackDecoded.role;

      // Ensure membership is registered
      try {
        await supabase
          .from("kanban_board_members")
          .upsert({
            board_id: boardId,
            user_id: authData.user.id,
            role: assignedRole,
          });
      } catch {
        // Non-blocking membership registration
      }
    } else {
      // 2. Try RPC first
      const rpcRes = await supabase.rpc("join_kanban_board_by_invite", {
        invite_token: rawInviteCode,
      });

      if (!rpcRes.error && rpcRes.data) {
        const data = rpcRes.data as {
          ok?: boolean;
          board_id?: string;
          title?: string;
          role?: "editor" | "viewer";
        };
        boardId = data.board_id || null;
        boardTitle = data.title || boardTitle;
        assignedRole = data.role || "editor";
      } else {
        // 3. Direct query fallback
        const { data: invite, error: inviteError } = await supabase
          .from("kanban_board_invites")
          .select("id, board_id, role, max_uses, uses_count, expires_at")
          .eq("invite_code", rawInviteCode)
          .maybeSingle();

        if (inviteError || !invite) {
          return apiJson(
            { error: "Tautan undangan tidak valid atau sudah kadaluarsa." },
            { status: 404, correlationId },
          );
        }

        boardId = invite.board_id;
        assignedRole = invite.role as "editor" | "viewer";

        // Add to members table
        await supabase.from("kanban_board_members").upsert({
          board_id: invite.board_id,
          user_id: authData.user.id,
          role: assignedRole,
        });

        // Increment usage count
        await supabase
          .from("kanban_board_invites")
          .update({ uses_count: (invite.uses_count || 0) + 1 })
          .eq("id", invite.id);
      }
    }

    if (!boardId) {
      return apiJson(
        { error: "Gagal menemukan papan proyek dari undangan ini." },
        { status: 404, correlationId },
      );
    }

    // Fetch the joined board details
    const { data: boardData } = await supabase
      .from("kanban_boards")
      .select("*")
      .eq("id", boardId)
      .maybeSingle();

    const mappedBoard = boardData
      ? {
          ...mapDbKanbanBoard(boardData as DbKanbanBoard, authData.user.id),
          role: assignedRole,
          isShared: true,
        }
      : null;

    return apiJson(
      {
        ok: true,
        boardId,
        boardTitle: mappedBoard?.title || boardTitle,
        role: assignedRole,
        board: mappedBoard,
      },
      { correlationId },
    );
  } catch (error) {
    logApiEvent("error", ROUTE, correlationId, "Unhandled error in kanban join", error);
    return apiJson(
      { error: "Terjadi kesalahan saat bergabung ke papan proyek." },
      { status: 500, correlationId },
    );
  }
}
