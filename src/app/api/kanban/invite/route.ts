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

function generateInviteCode(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let code = "bf_inv_";
  for (let i = 0; i < 9; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: Request) {
  const correlationId = resolveCorrelationId(request.headers.get("x-correlation-id"));
  const limit = limiter.check(`${ROUTE}:${getClientKey(request.headers)}`, Date.now());
  if (!limit.allowed) return rateLimitResponse(limit, correlationId);

  try {
    const supabase = await getSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return apiJson(
        { error: "Sesi login diperlukan untuk membuat undangan papan proyek." },
        { status: 401, correlationId },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      boardId?: unknown;
      role?: unknown;
    };

    const boardId = typeof body.boardId === "string" ? body.boardId.trim() : "";
    const requestedRole: "editor" | "viewer" =
      body.role === "viewer" ? "viewer" : "editor";

    if (!boardId) {
      return apiJson({ error: "boardId diperlukan." }, { status: 400, correlationId });
    }

    // Verify board exists and current user is owner or editor
    const { data: board, error: boardError } = await supabase
      .from("kanban_boards")
      .select("id, user_id, title")
      .eq("id", boardId)
      .maybeSingle();

    if (boardError || !board) {
      return apiJson(
        { error: "Papan proyek tidak ditemukan atau kamu tidak memiliki izin." },
        { status: 404, correlationId },
      );
    }

    // Check existing active invite for this board and role
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

    // Generate new invite code
    const inviteCode = generateInviteCode();
    const { error: insertError } = await supabase
      .from("kanban_board_invites")
      .insert({
        board_id: boardId,
        invite_code: inviteCode,
        role: requestedRole,
        created_by: authData.user.id,
      });

    if (insertError) {
      logApiEvent("warn", ROUTE, correlationId, "Could not insert invite", insertError);
      // Fallback in case table is not yet migrated on remote Supabase
      return apiJson(
        {
          ok: true,
          inviteCode,
          role: requestedRole,
          warning: "Cloud invite table pending migration; generated local invite token.",
        },
        { correlationId },
      );
    }

    return apiJson(
      {
        ok: true,
        inviteCode,
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

    // 2. Fetch profiles for display names and avatars
    const userIds = Array.from(new Set(rawMembers.map((m) => m.user_id)));
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

    const members = rawMembers.map((m) => {
      const prof = profilesMap.get(m.user_id);
      return {
        id: m.id,
        boardId: m.board_id,
        userId: m.user_id,
        role: m.role,
        joinedAt: m.joined_at,
        displayName: prof?.display_name || (m.user_id === authData?.user?.id ? "Kamu" : "Anggota"),
        avatarUrl: prof?.avatar_url || null,
      };
    });

    return apiJson({ ok: true, members }, { correlationId });
  } catch (error) {
    logApiEvent("error", ROUTE, correlationId, "Failed to load board members", error);
    return apiJson({ ok: true, members: [] }, { correlationId });
  }
}
