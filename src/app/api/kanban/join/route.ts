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

function decodeFallbackInviteToken(
  code: string,
): { boardId: string; role: "editor" | "viewer"; board?: unknown } | null {
  if (!code.startsWith("bf_inv_")) return null;
  let payloadStr = code.slice("bf_inv_".length);
  if (payloadStr.startsWith("viewer_")) {
    payloadStr = payloadStr.slice("viewer_".length);
  } else if (payloadStr.startsWith("editor_")) {
    payloadStr = payloadStr.slice("editor_".length);
  }
  try {
    const json = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf-8"));
    if (json && typeof json.b === "string") {
      const explicitRole: "editor" | "viewer" =
        code.includes("_viewer_") || json.r === "viewer" ? "viewer" : "editor";
      return {
        boardId: json.b,
        role: explicitRole,
        board: json.board,
      };
    }
  } catch {
    // not base64url encoded payload
  }
  return null;
}

export async function GET(request: Request) {
  const correlationId = resolveCorrelationId(request.headers.get("x-correlation-id"));
  const url = new URL(request.url);
  const rawInviteCode = url.searchParams.get("inviteCode")?.trim() || "";

  if (!rawInviteCode) {
    return apiJson({ error: "inviteCode diperlukan." }, { status: 400, correlationId });
  }

  // 1. Check fallback token
  const fallback = decodeFallbackInviteToken(rawInviteCode);
  if (fallback) {
    const boardTitle =
      (fallback.board as { title?: string } | undefined)?.title || "Papan Proyek";
    return apiJson(
      {
        ok: true,
        boardId: fallback.boardId,
        boardTitle,
        role: fallback.role,
      },
      { correlationId },
    );
  }

  // 2. Check cloud DB invite table
  try {
    const supabase = await getSupabaseServerClient();
    const { data: invite } = await supabase
      .from("kanban_board_invites")
      .select("board_id, role, kanban_boards(title)")
      .eq("invite_code", rawInviteCode)
      .maybeSingle();

    if (invite) {
      const dbBoard = invite.kanban_boards as unknown as { title?: string } | null;
      return apiJson(
        {
          ok: true,
          boardId: invite.board_id,
          boardTitle: dbBoard?.title || "Papan Proyek",
          role: (invite.role as "editor" | "viewer") || (rawInviteCode.includes("_viewer_") ? "viewer" : "editor"),
        },
        { correlationId },
      );
    }
  } catch {
    // Non-blocking query error
  }

  // Inferred fallback
  const role: "editor" | "viewer" = rawInviteCode.includes("_viewer_") ? "viewer" : "editor";
  return apiJson(
    {
      ok: true,
      boardTitle: "Papan Proyek",
      role,
    },
    { correlationId },
  );
}

export async function POST(request: Request) {
  const correlationId = resolveCorrelationId(request.headers.get("x-correlation-id"));
  const limit = limiter.check(`${ROUTE}:${getClientKey(request.headers)}`, Date.now());
  if (!limit.allowed) return rateLimitResponse(limit, correlationId);

  try {
    const body = (await request.json().catch(() => ({}))) as { inviteCode?: unknown };
    const rawInviteCode = typeof body.inviteCode === "string" ? body.inviteCode.trim() : "";

    if (!rawInviteCode) {
      return apiJson({ error: "Kode undangan diperlukan." }, { status: 400, correlationId });
    }

    const supabase = await getSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();

    let boardId: string | null = null;
    let boardTitle = "Papan Proyek";
    let assignedRole: "editor" | "viewer" = rawInviteCode.includes("_viewer_") ? "viewer" : "editor";
    let embeddedBoard: unknown = null;

    // 1. Check fallback encoded invite token
    const fallbackDecoded = decodeFallbackInviteToken(rawInviteCode);
    if (fallbackDecoded) {
      boardId = fallbackDecoded.boardId;
      assignedRole = fallbackDecoded.role;
      embeddedBoard = fallbackDecoded.board || null;

      if (authData?.user) {
        try {
          await supabase.from("kanban_board_members").upsert({
            board_id: boardId,
            user_id: authData.user.id,
            role: assignedRole,
          });
        } catch {
          // Non-blocking membership registration
        }
      }
    } else {
      // 2. Try RPC first if authenticated
      if (authData?.user) {
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
          assignedRole = data.role || assignedRole;
        }
      }

      // 3. Direct query fallback
      if (!boardId) {
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

        if (authData?.user) {
          await supabase.from("kanban_board_members").upsert({
            board_id: invite.board_id,
            user_id: authData.user.id,
            role: assignedRole,
          });
        }

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

    let mappedBoard: unknown = null;
    if (boardData) {
      mappedBoard = {
        ...mapDbKanbanBoard(boardData as DbKanbanBoard, authData?.user?.id || "guest"),
        role: assignedRole,
        isShared: true,
      };
    } else if (embeddedBoard && typeof embeddedBoard === "object") {
      const eBoard = embeddedBoard as Record<string, unknown>;
      mappedBoard = {
        id: boardId,
        title: typeof eBoard.title === "string" ? eBoard.title : boardTitle,
        description: typeof eBoard.description === "string" ? eBoard.description : "",
        background: typeof eBoard.background === "string" ? eBoard.background : "biarfokus-white",
        lists: Array.isArray(eBoard.lists) ? eBoard.lists : [],
        starred: false,
        role: assignedRole,
        isShared: true,
        createdAt: new Date().toLocaleDateString("id-ID"),
        updatedAt: new Date().toLocaleDateString("id-ID"),
      };
    }

    return apiJson(
      {
        ok: true,
        boardId,
        boardTitle: (mappedBoard as { title?: string } | null)?.title || boardTitle,
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
