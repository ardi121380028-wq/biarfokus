import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  apiJson,
  createRateLimiter,
  getClientKey,
  logApiEvent,
  rateLimitResponse,
  resolveCorrelationId,
} from "@/lib/api/request-guard";
import type { KanbanMemberRole } from "@/types/domain";

const ROUTE = "/api/kanban/invite";
const limiter = createRateLimiter({ limit: 30, windowMs: 60_000 });

function generateInviteCode(role: "editor" | "viewer"): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const prefix = role === "viewer" ? "bf_inv_viewer_" : "bf_inv_editor_";
  let code = prefix;
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: Request) {
  const correlationId = resolveCorrelationId(request.headers.get("x-correlation-id"));
  const limit = limiter.check(`${ROUTE}:${getClientKey(request.headers)}`, Date.now());
  if (!limit.allowed) return rateLimitResponse(limit, correlationId);

  try {
    const body = (await request.json().catch(() => ({}))) as {
      boardId?: unknown;
      role?: unknown;
      board?: {
        title?: unknown;
        description?: unknown;
        background?: unknown;
        lists?: unknown;
      };
    };

    const boardId = typeof body.boardId === "string" ? body.boardId.trim() : "";
    const requestedRole: "editor" | "viewer" =
      body.role === "viewer" ? "viewer" : "editor";

    if (!boardId) {
      return apiJson({ error: "boardId diperlukan." }, { status: 400, correlationId });
    }

    const supabase = await getSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    // If user is guest/unauthenticated, produce a self-contained fallback token so they can still share
    if (authError || !authData.user) {
      const fallbackPayload = {
        b: boardId,
        r: requestedRole,
        u: "guest",
        t: Date.now(),
        board: body.board,
      };
      const fallbackCode = `bf_inv_${requestedRole}_${Buffer.from(JSON.stringify(fallbackPayload)).toString("base64url")}`;
      return apiJson(
        {
          ok: true,
          inviteCode: fallbackCode,
          role: requestedRole,
          isGuestToken: true,
        },
        { correlationId },
      );
    }

    let board: { id: string; user_id: string; title: string } | null = null;
    let isTableMissing = false;

    // Check if board already exists in cloud DB
    const { data: existingBoard, error: boardError } = await supabase
      .from("kanban_boards")
      .select("id, user_id, title")
      .eq("id", boardId)
      .maybeSingle();

    if (boardError) {
      if (boardError.code === "42P01" || boardError.message?.includes("does not exist")) {
        isTableMissing = true;
      } else {
        logApiEvent("warn", ROUTE, correlationId, "Query kanban_boards error", boardError);
      }
    } else {
      board = existingBoard;
    }

    // Auto-provision board in cloud DB if it exists only locally
    if (!isTableMissing && !board) {
      const rawBoard = body.board;
      const boardTitle =
        typeof rawBoard?.title === "string" && rawBoard.title.trim()
          ? rawBoard.title.trim()
          : "Papan Proyek";
      const boardDesc = typeof rawBoard?.description === "string" ? rawBoard.description : "";
      const boardBg =
        typeof rawBoard?.background === "string" && rawBoard.background
          ? rawBoard.background
          : "biarfokus-white";
      const boardLists = Array.isArray(rawBoard?.lists) ? rawBoard.lists : [];

      const { data: newBoard, error: insertBoardErr } = await supabase
        .from("kanban_boards")
        .insert({
          id: boardId,
          user_id: authData.user.id,
          title: boardTitle,
          description: boardDesc,
          background: boardBg,
          lists: boardLists,
          starred: false,
          updated_at: new Date().toISOString(),
        })
        .select("id, user_id, title")
        .maybeSingle();

      if (!insertBoardErr && newBoard) {
        board = newBoard;
        // Auto add creator to members table
        try {
          await supabase
            .from("kanban_board_members")
            .upsert({
              board_id: boardId,
              user_id: authData.user.id,
              role: "owner",
            });
        } catch {
          // Non-blocking membership registration
        }
      } else if (insertBoardErr?.code === "42P01" || insertBoardErr?.message?.includes("does not exist")) {
        isTableMissing = true;
      }
    }

    // If board exists in DB and current user is not owner, check membership
    if (board && board.user_id !== authData.user.id) {
      const { data: member } = await supabase
        .from("kanban_board_members")
        .select("role")
        .eq("board_id", boardId)
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (!member || (member.role !== "owner" && member.role !== "editor")) {
        return apiJson(
          { error: "Kamu tidak memiliki izin untuk membagikan papan proyek ini." },
          { status: 403, correlationId },
        );
      }
    }

    // Check existing active invite for this board and role
    if (!isTableMissing) {
      const { data: existingInvite } = await supabase
        .from("kanban_board_invites")
        .select("id, invite_code, role, created_at")
        .eq("board_id", boardId)
        .eq("role", requestedRole)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingInvite) {
        return apiJson(
          {
            ok: true,
            inviteCode: existingInvite.invite_code,
            role: existingInvite.role,
          },
          { correlationId },
        );
      }

      // Generate new invite code with explicit role prefix
      const inviteCode = generateInviteCode(requestedRole);
      const { error: insertError } = await supabase
        .from("kanban_board_invites")
        .insert({
          board_id: boardId,
          invite_code: inviteCode,
          role: requestedRole,
          created_by: authData.user.id,
        });

      if (!insertError) {
        return apiJson(
          {
            ok: true,
            inviteCode,
            role: requestedRole,
          },
          { correlationId },
        );
      }

      logApiEvent("warn", ROUTE, correlationId, "Could not insert invite", insertError);
    }

    // Fallback resilient token in case tables are pending or insertion fails
    const fallbackPayload = {
      b: boardId,
      r: requestedRole,
      u: authData.user.id,
      t: Date.now(),
      board: body.board,
      owner:
        (typeof authData.user.user_metadata?.full_name === "string" && authData.user.user_metadata.full_name) ||
        authData.user.email?.split("@")[0] ||
        "Pemilik Papan",
    };
    const fallbackCode = `bf_inv_${requestedRole}_${Buffer.from(JSON.stringify(fallbackPayload)).toString("base64url")}`;

    return apiJson(
      {
        ok: true,
        inviteCode: fallbackCode,
        role: requestedRole,
      },
      { correlationId },
    );
  } catch (error) {
    logApiEvent("error", ROUTE, correlationId, "Unhandled error in kanban invite", error);
    return apiJson({ error: "Gagal membuat undangan." }, { status: 500, correlationId });
  }
}

export async function GET(request: Request) {
  const correlationId = resolveCorrelationId(request.headers.get("x-correlation-id"));
  const url = new URL(request.url);
  const boardId = url.searchParams.get("boardId")?.trim() || "";

  if (!boardId) {
    return apiJson({ error: "boardId diperlukan." }, { status: 400, correlationId });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();

    // 1. Fetch board members
    const { data: membersData } = await supabase
      .from("kanban_board_members")
      .select("id, board_id, user_id, role, joined_at")
      .eq("board_id", boardId)
      .order("joined_at", { ascending: true });

    const rawMembers = (membersData || []) as Array<{
      id: string;
      board_id: string;
      user_id: string;
      role: KanbanMemberRole;
      joined_at: string;
    }>;

    // 2. Fetch board row to ensure owner is present
    const { data: boardRow } = await supabase
      .from("kanban_boards")
      .select("user_id")
      .eq("id", boardId)
      .maybeSingle();

    const seenUserIds = new Set<string>();
    const uniqueRawMembers: typeof rawMembers = [];

    if (boardRow?.user_id) {
      seenUserIds.add(boardRow.user_id);
      const ownerMember = rawMembers.find((m) => m.user_id === boardRow.user_id);
      uniqueRawMembers.push({
        id: ownerMember?.id || `owner-${boardRow.user_id}`,
        board_id: boardId,
        user_id: boardRow.user_id,
        role: "owner",
        joined_at: ownerMember?.joined_at || new Date(0).toISOString(),
      });
    }

    for (const m of rawMembers) {
      if (!seenUserIds.has(m.user_id)) {
        seenUserIds.add(m.user_id);
        uniqueRawMembers.push(m);
      }
    }

    // 3. Fetch profiles for display names and avatars
    const userIds = Array.from(seenUserIds);
    const profilesMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      (profiles || []).forEach((p) => {
        profilesMap.set(p.id, {
          display_name: p.display_name,
          avatar_url: p.avatar_url,
        });
      });
    }

    const members = uniqueRawMembers.map((m) => {
      const prof = profilesMap.get(m.user_id);
      const isCurrentUser = m.user_id === authData?.user?.id;
      const currentUserName =
        authData?.user?.user_metadata?.full_name ||
        authData?.user?.user_metadata?.name ||
        authData?.user?.email?.split("@")[0] ||
        "Kamu";
      const currentUserAvatar = authData?.user?.user_metadata?.avatar_url || null;

      return {
        id: m.id,
        boardId: m.board_id,
        userId: m.user_id,
        role: m.role,
        joinedAt: m.joined_at,
        displayName: prof?.display_name || (isCurrentUser ? currentUserName : "Anggota"),
        avatarUrl: prof?.avatar_url || (isCurrentUser ? currentUserAvatar : null),
      };
    });

    return apiJson({ ok: true, members }, { correlationId });
  } catch (error) {
    logApiEvent("error", ROUTE, correlationId, "Failed to load board members", error);
    return apiJson({ ok: true, members: [] }, { correlationId });
  }
}
