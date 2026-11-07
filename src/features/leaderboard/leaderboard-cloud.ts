import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LeaderboardEntry,
  LeaderboardMyRank,
  LeaderboardPeriod,
} from "@/types/domain";
import {
  calculateTier,
  mapDbLeaderboardRow,
  mapDbMyRankRow,
} from "./leaderboard-service";

export async function fetchLeaderboardEntries(
  supabase: SupabaseClient | null,
  period: LeaderboardPeriod,
  currentUserId?: string | null,
  currentUserDetails?: {
    name?: string | null;
    avatarUrl?: string | null;
    isPro?: boolean;
    minutes?: number;
    pomodoros?: number;
  } | null,
  month?: string | null,
): Promise<LeaderboardEntry[]> {
  // 1. Fetch real user data from our server API endpoint
  try {
    const monthQuery = month ? `&month=${encodeURIComponent(month)}` : "";
    const res = await fetch(`/api/leaderboard?period=${period}${monthQuery}&limit=50`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const payload = (await res.json()) as { data?: unknown[] };
      if (payload.data && Array.isArray(payload.data) && payload.data.length > 0) {
        return payload.data.map((row) =>
          mapDbLeaderboardRow(row, currentUserId, period)
        );
      }
    }
  } catch (apiErr) {
    console.warn("[BiarFokus Leaderboard] API route fetch failed, trying direct RPC:", apiErr);
  }

  // 2. Direct RPC fallback if client has direct supabase connection
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc("get_leaderboard", {
        p_period: period,
        p_limit: 50,
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        return (data as unknown[]).map((row) =>
          mapDbLeaderboardRow(row, currentUserId, period)
        );
      }
    } catch {
      // RPC not yet configured in remote SQL
    }
  }

  // 3. If there is a current user, return current user with their real stats
  if (currentUserId) {
    const mins = currentUserDetails?.minutes ?? 0;
    const poms = currentUserDetails?.pomodoros ?? 0;

    let userSocials: LeaderboardEntry["socialLinks"] = undefined;
    let userBio: string | undefined = undefined;
    let userOccupation: string | undefined = undefined;
    if (typeof window !== "undefined") {
      try {
        const rawSocials = window.localStorage.getItem("biarfokus.profile.social_links");
        if (rawSocials) userSocials = JSON.parse(rawSocials);
        userBio = window.localStorage.getItem("biarfokus.profile.status_bio") || undefined;
        userOccupation = window.localStorage.getItem("biarfokus.profile.occupation") || undefined;
      } catch {}
    }

    return [
      {
        rank: 1,
        userId: currentUserId,
        displayName: currentUserDetails?.name?.trim() || "Kamu (Akun Saya)",
        avatarUrl: currentUserDetails?.avatarUrl ?? null,
        totalMinutes: mins,
        pomodoroCount: poms,
        isPro: Boolean(currentUserDetails?.isPro),
        isCurrentUser: true,
        tier: calculateTier(mins, period),
        bio: userBio,
        occupation: userOccupation,
        currentStreak: 1,
        socialLinks: userSocials,
      },
    ];
  }

  return [];
}

export async function fetchMyLeaderboardRank(
  supabase: SupabaseClient | null,
  period: LeaderboardPeriod,
  currentUserId?: string | null,
): Promise<LeaderboardMyRank | null> {
  if (!supabase || !currentUserId) return null;

  try {
    const { data, error } = await supabase.rpc("get_my_leaderboard_rank", {
      p_period: period,
    });

    if (error || !data || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    return mapDbMyRankRow(data[0]);
  } catch {
    return null;
  }
}

export async function updateLeaderboardPrivacy(
  supabase: SupabaseClient,
  userId: string,
  showOnLeaderboard: boolean,
): Promise<void> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ show_on_leaderboard: showOnLeaderboard })
      .eq("id", userId);

    if (error) {
      console.warn("[BiarFokus Leaderboard] Failed to update privacy:", error);
    }
  } catch (err) {
    console.warn("[BiarFokus Leaderboard] Privacy update error:", err);
  }
}
