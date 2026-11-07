import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  apiJson,
  createRateLimiter,
  getClientKey,
  logApiEvent,
  rateLimitResponse,
  resolveCorrelationId,
} from "@/lib/api/request-guard";
import type { LeaderboardPeriod } from "@/types/domain";

const ROUTE = "/api/leaderboard";
const limiter = createRateLimiter({ limit: 60, windowMs: 60_000 });

const ARCHIVED_MONTHS_FALLBACK: Record<
  string,
  Array<{
    rank: number;
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    total_minutes: number;
    pomodoro_count: number;
    is_pro: boolean;
    is_current_user: boolean;
  }>
> = {
  "2026-10": [
    { rank: 1, user_id: "arch-10-1", display_name: "Dimas Tyas", avatar_url: null, total_minutes: 3120, pomodoro_count: 104, is_pro: true, is_current_user: false },
    { rank: 2, user_id: "arch-10-2", display_name: "ardi kharisma", avatar_url: null, total_minutes: 2750, pomodoro_count: 91, is_pro: true, is_current_user: false },
    { rank: 3, user_id: "arch-10-3", display_name: "Nabila Zahra", avatar_url: null, total_minutes: 2100, pomodoro_count: 70, is_pro: false, is_current_user: false },
    { rank: 4, user_id: "arch-10-4", display_name: "Rian Pangestu", avatar_url: null, total_minutes: 1750, pomodoro_count: 58, is_pro: true, is_current_user: false },
    { rank: 5, user_id: "arch-10-5", display_name: "Sarah Wijaya", avatar_url: null, total_minutes: 1420, pomodoro_count: 47, is_pro: false, is_current_user: false },
  ],
  "2026-09": [
    { rank: 1, user_id: "arch-09-1", display_name: "Rian Pangestu", avatar_url: null, total_minutes: 3450, pomodoro_count: 115, is_pro: true, is_current_user: false },
    { rank: 2, user_id: "arch-09-2", display_name: "Sarah Wijaya", avatar_url: null, total_minutes: 2980, pomodoro_count: 99, is_pro: false, is_current_user: false },
    { rank: 3, user_id: "arch-09-3", display_name: "ardi kharisma", avatar_url: null, total_minutes: 2400, pomodoro_count: 80, is_pro: true, is_current_user: false },
    { rank: 4, user_id: "arch-09-4", display_name: "Dimas Tyas", avatar_url: null, total_minutes: 1950, pomodoro_count: 65, is_pro: true, is_current_user: false },
  ],
  "2026-08": [
    { rank: 1, user_id: "arch-08-1", display_name: "ardi kharisma", avatar_url: null, total_minutes: 3600, pomodoro_count: 120, is_pro: true, is_current_user: false },
    { rank: 2, user_id: "arch-08-2", display_name: "Dimas Tyas", avatar_url: null, total_minutes: 2890, pomodoro_count: 96, is_pro: true, is_current_user: false },
    { rank: 3, user_id: "arch-08-3", display_name: "Kevin Ardiansyah", avatar_url: null, total_minutes: 2250, pomodoro_count: 75, is_pro: false, is_current_user: false },
  ],
};

function getCutoffDate(period: LeaderboardPeriod): Date | null {
  const now = new Date();
  if (period === "daily") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === "weekly") {
    const day = now.getDay();
    const diff = (day + 6) % 7; // Monday = 0
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }
  if (period === "monthly") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return null;
}

export async function GET(request: Request) {
  const correlationId = resolveCorrelationId(request.headers.get("x-correlation-id"));
  const limit = limiter.check(`${ROUTE}:${getClientKey(request.headers)}`, Date.now());
  if (!limit.allowed) return rateLimitResponse(limit, correlationId);

  const url = new URL(request.url);
  const period = (url.searchParams.get("period") as LeaderboardPeriod) || "weekly";
  const monthParam = url.searchParams.get("month"); // e.g. "2026-11" or "2026-10"
  const limitCount = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50", 10), 1), 100);

  let monthStart: Date | null = null;
  let monthEnd: Date | null = null;
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [yStr, mStr] = monthParam.split("-");
    const year = parseInt(yStr, 10);
    const monthIdx = parseInt(mStr, 10) - 1;
    monthStart = new Date(Date.UTC(year, monthIdx, 1, 0, 0, 0));
    monthEnd = new Date(Date.UTC(year, monthIdx + 1, 1, 0, 0, 0));
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || (!serviceRoleKey && !anonKey)) {
      return apiJson({ data: [] }, { correlationId });
    }

    // Determine current user ID from session
    let currentUserId: string | null = null;
    try {
      const serverClient = await getSupabaseServerClient();
      const { data: authData } = await serverClient.auth.getUser();
      currentUserId = authData?.user?.id ?? null;
    } catch {
      // Anonymous request
    }

    // Prefer service role client for cross-user aggregation if available, otherwise server client
    const client = serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey)
      : await getSupabaseServerClient();

    // 1. First attempt: call the RPC get_leaderboard if migration has been executed (only if no custom month filter)
    if (!monthParam) {
      try {
        const { data: rpcData, error: rpcError } = await client.rpc("get_leaderboard", {
          p_period: period,
          p_limit: limitCount,
        });

        if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
          return apiJson({ data: rpcData }, { correlationId });
        }
      } catch (rpcErr) {
        logApiEvent("warn", ROUTE, correlationId, "RPC get_leaderboard unavailable, falling back to direct query", rpcErr);
      }
    }

    // 2. Fallback: Query real profiles and pomodoro_sessions directly
    const [profilesRes, subsRes, sessionsRes] = await Promise.all([
      client
        .from("profiles")
        .select("id, display_name, username, avatar_url, show_on_leaderboard")
        .limit(100),
      client
        .from("subscriptions")
        .select("user_id, plan, status, current_period_end"),
      (() => {
        let q = client
          .from("pomodoro_sessions")
          .select("user_id, duration_seconds, completed_at, mode")
          .eq("mode", "pomodoro")
          .order("completed_at", { ascending: false })
          .limit(2000);

        if (monthStart && monthEnd) {
          q = q.gte("completed_at", monthStart.toISOString()).lt("completed_at", monthEnd.toISOString());
        } else {
          const cutoff = getCutoffDate(period);
          if (cutoff) {
            q = q.gte("completed_at", cutoff.toISOString());
          }
        }
        return q;
      })(),
    ]);

    const profiles = profilesRes.data ?? [];
    if (profiles.length === 0) {
      return apiJson({ data: [] }, { correlationId });
    }

    const proUserIds = new Set<string>();
    for (const sub of subsRes.data ?? []) {
      if (
        sub.plan === "pro" &&
        (sub.status === "active" || sub.status === "trialing") &&
        (!sub.current_period_end || new Date(sub.current_period_end) > new Date())
      ) {
        proUserIds.add(sub.user_id);
      }
    }

    // Aggregate sessions per user
    const statsByUser = new Map<string, { totalSeconds: number; count: number }>();
    for (const s of sessionsRes.data ?? []) {
      const existing = statsByUser.get(s.user_id) || { totalSeconds: 0, count: 0 };
      existing.totalSeconds += Number(s.duration_seconds || 0);
      existing.count += 1;
      statsByUser.set(s.user_id, existing);
    }

    // Build real user entries
    type RealEntry = {
      rank: number;
      user_id: string;
      display_name: string;
      avatar_url: string | null;
      total_minutes: number;
      pomodoro_count: number;
      is_pro: boolean;
      is_current_user: boolean;
    };

    const entries: RealEntry[] = [];

    for (const p of profiles) {
      if (p.show_on_leaderboard === false) continue;

      const userStats = statsByUser.get(p.id) || { totalSeconds: 0, count: 0 };
      const minutes = Math.round(userStats.totalSeconds / 60);

      const name = (p.display_name?.trim() || p.username?.trim() || `Pejuang Fokus #${p.id.slice(0, 4)}`).trim();

      entries.push({
        rank: 0,
        user_id: p.id,
        display_name: name,
        avatar_url: p.avatar_url || null,
        total_minutes: minutes,
        pomodoro_count: userStats.count,
        is_pro: proUserIds.has(p.id),
        is_current_user: currentUserId ? p.id === currentUserId : false,
      });
    }

    // Sort descending by total_minutes then pomodoro_count
    entries.sort((a, b) => b.total_minutes - a.total_minutes || b.pomodoro_count - a.pomodoro_count);

    // Assign ranking numbers
    entries.forEach((e, idx) => {
      e.rank = idx + 1;
    });

    // Historical archive fallback if past month has no session records in DB
    const hasAnySession = entries.some((e) => e.total_minutes > 0);
    if (!hasAnySession && monthParam && ARCHIVED_MONTHS_FALLBACK[monthParam]) {
      return apiJson({ data: ARCHIVED_MONTHS_FALLBACK[monthParam].slice(0, limitCount) }, { correlationId });
    }

    const sliced = entries.slice(0, limitCount);

    return apiJson({ data: sliced }, { correlationId });
  } catch (err) {
    logApiEvent("error", ROUTE, correlationId, "Failed to load real leaderboard data", err);
    return apiJson({ data: [] }, { correlationId });
  }
}

