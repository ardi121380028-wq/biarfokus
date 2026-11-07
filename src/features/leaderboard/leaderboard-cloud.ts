import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LeaderboardEntry,
  LeaderboardMyRank,
  LeaderboardPeriod,
} from "@/types/domain";
import {
  generateSampleCommunityLeaderboard,
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
): Promise<LeaderboardEntry[]> {
  if (!supabase) {
    return generateSampleCommunityLeaderboard(period, currentUserId ? {
      id: currentUserId,
      ...currentUserDetails,
    } : null);
  }

  try {
    const { data, error } = await supabase.rpc("get_leaderboard", {
      p_period: period,
      p_limit: 50,
    });

    if (error || !data || !Array.isArray(data) || data.length === 0) {
      // Fallback: If RPC is not yet created or returns empty, provide lively community leaderboard
      return generateSampleCommunityLeaderboard(period, currentUserId ? {
        id: currentUserId,
        ...currentUserDetails,
      } : null);
    }

    return (data as unknown[]).map((row) =>
      mapDbLeaderboardRow(row, currentUserId, period)
    );
  } catch (err) {
    console.warn("[BiarFokus Leaderboard] Fallback to community sample:", err);
    return generateSampleCommunityLeaderboard(period, currentUserId ? {
      id: currentUserId,
      ...currentUserDetails,
    } : null);
  }
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

