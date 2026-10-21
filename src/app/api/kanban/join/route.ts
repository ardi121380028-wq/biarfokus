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
import type { DbKanbanBoard, KanbanBoard, KanbanList } from "@/types/domain";

const ROUTE = "/api/kanban/join";
const limiter = createRateLimiter({ limit: 30, windowMs: 60_000 });

function decodeFallbackInviteToken(
  code: string,
): { boardId: string; role: "editor" | "viewer"; board?: unknown; ownerName?: string } | null {
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
        ownerName: typeof json.owner === "string" ? json.owner : undefined,
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

  // 1. Check fallback self-contained token
  const fallback = decodeFallbackInviteToken(rawInviteCode);
  if (fallback) {
    const fbBoard = fallback.board as Record<string, unknown> | undefined;
    const boardTitle =
      (typeof fbBoard?.title === "string" && fbBoard.title) || "Papan Proyek";
    const mappedBoard: KanbanBoard = {
      id: fallback.boardId,
      title: boardTitle,
      description: typeof fbBoard?.description === "string" ? fbBoard.description : "",
      background: typeof fbBoard?.background === "string" ? fbBoard.background : "wave-blue",
      lists: Array.isArray(fbBoard?.lists) ? (fbBoard.lists as KanbanList[]) : [],
      starred: false,
      role: fallback.role,
      isShared: true,
      createdAt: new Date().toLocaleDateString("id-ID"),
      updatedAt: new Date().toLocaleDateString("id-ID"),
    };

    return apiJson(
      {
        ok: true,
        boardId: fallback.boardId,
        boardTitle,
        role: fallback.role,
        ownerName: fallback.ownerName || "Pemilik Papan",
        board: mappedBoard,
      },
      { correlationId },
    );
  }

  // 2. Query database for invite and board preview
  try {
    const supabase = await getSupabaseServerClient();

    // 2a. Try RPC preview function first (security definer, works for guests & members)
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc("get_kanban_board_preview", {
        invite_token: rawInviteCode,
      });

      if (!rpcErr && rpcData && rpcData.ok) {
        const preview = rpcData as {
          boardId: string;
          boardTitle: string;
          boardDescription?: string;
          boardBackground?: string;
          boardLists?: unknown[];
          role: "editor" | "viewer";
          ownerName?: string;
          ownerAvatar?: string | null;
        };

        const previewBoard: KanbanBoard = {
          id: preview.boardId,
          title: preview.boardTitle || "Papan Proyek",
          description: preview.boardDescription || "",
          background: preview.boardBackground || "wave-blue",
          lists: Array.isArray(preview.boardLists) ? (preview.boardLists as KanbanList[]) : [],
          starred: false,
          role: preview.role,
          isShared: true,
          createdAt: new Date().toLocaleDateString("id-ID"),
          updatedAt: new Date().toLocaleDateString("id-ID"),
        };

        return apiJson(
          {
            ok: true,
            boardId: preview.boardId,
            boardTitle: preview.boardTitle,
            role: preview.role,
            ownerName: preview.ownerName || "Pemilik Papan",
            ownerAvatar: preview.ownerAvatar || null,
            board: previewBoard,
          },
          { correlationId },
        );
      }
    } catch {
      // RPC might not be applied yet, continue to fallback query
    }

    // 2b. Direct table query
    const { data: invite, error: inviteError } = await supabase
      .from("kanban_board_invites")
      .select("board_id, role, created_by, kanban_boards(id, user_id, title, description, background, lists)")
      .eq("invite_code", rawInviteCode)
      .maybeSingle();

    if (!inviteError && invite) {
      const dbBoard = invite.kanban_boards as unknown as DbKanbanBoard | null;
      let ownerName = "Pemilik Papan";
      let ownerAvatar: string | null = null;

      if (invite.created_by) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", invite.created_by)
          .maybeSingle();
        if (profile?.display_name) ownerName = profile.display_name;
        if (profile?.avatar_url) ownerAvatar = profile.avatar_url;
      }

      const assignedRole = (invite.role as "editor" | "viewer") || "editor";
      const boardTitle = dbBoard?.title || "Papan Proyek";

      const mappedBoard: KanbanBoard | null = dbBoard
        ? {
            ...mapDbKanbanBoard(dbBoard, null),
            role: assignedRole,
            isShared: true,
          }
        : null;

      return apiJson(
        {
          ok: true,
          boardId: invite.board_id,
          boardTitle,
          role: assignedRole,
          ownerName,
          ownerAvatar,
          board: mappedBoard,
        },
        { correlationId },
      );
    }
  } catch (error) {
    logApiEvent("warn", ROUTE, correlationId, "GET /api/kanban/join database lookup failed", error);
  }

  // Inferred fallback
  const role: "editor" | "viewer" = rawInviteCode.includes("_viewer_") ? "viewer" : "editor";
  return apiJson(
    {
      ok: true,
      boardTitle: "Papan Proyek",
      role,
      ownerName: "Pemilik Papan",
      board: null,
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

    // 1. Check fallback self-contained token
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
            description?: string;
            background?: string;
            lists?: unknown[];
            role?: "editor" | "viewer";
          };
          boardId = data.board_id || null;
          boardTitle = data.title || boardTitle;
          assignedRole = data.role || assignedRole;

          if (data.lists) {
            embeddedBoard = {
              title: data.title,
              description: data.description,
              background: data.background,
              lists: data.lists,
            };
          }
        }
      }

      // 3. Direct query fallback
      if (!boardId) {
        const { data: invite, error: inviteError } = await supabase
          .from("kanban_board_invites")
          .select("id, board_id, role, max_uses, uses_count, expires_at, created_by")
          .eq("invite_code", rawInviteCode)
          .maybeSingle();

        if (inviteError || !invite) {
          return apiJson(
            { error: "Tautan undangan tidak valid atau sudah kadaluarsa." },
            { status: 404, correlationId },
          );
        }

        boardId = invite.board_id;
        assignedRole = (invite.role as "editor" | "viewer") || assignedRole;

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

    const isOwner = authData?.user?.id && boardData?.user_id === authData.user.id;

    let mappedBoard: KanbanBoard | null = null;
    if (boardData) {
      mappedBoard = {
        ...mapDbKanbanBoard(boardData as DbKanbanBoard, authData?.user?.id || "guest"),
        role: isOwner ? "owner" : assignedRole,
        isShared: !isOwner,
      };
    } else if (embeddedBoard && typeof embeddedBoard === "object") {
      const eBoard = embeddedBoard as Record<string, unknown>;
      mappedBoard = {
        id: boardId,
        title: typeof eBoard.title === "string" ? eBoard.title : boardTitle,
        description: typeof eBoard.description === "string" ? eBoard.description : "",
        background: typeof eBoard.background === "string" ? eBoard.background : "wave-blue",
        lists: Array.isArray(eBoard.lists) ? (eBoard.lists as KanbanList[]) : [],
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
        boardTitle: mappedBoard?.title || boardTitle,
        role: isOwner ? "owner" : assignedRole,
        board: mappedBoard,
        isOwner: Boolean(isOwner),
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
