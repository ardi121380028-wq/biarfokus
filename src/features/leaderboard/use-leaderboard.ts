"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LeaderboardEntry,
  LeaderboardMyRank,
  LeaderboardPeriod,
} from "@/types/domain";
import {
  calculateRankProgress,
  getPodium,
} from "./leaderboard-service";
import {
  fetchLeaderboardEntries,
  fetchMyLeaderboardRank,
} from "./leaderboard-cloud";

type UseLeaderboardOptions = {
  supabase: SupabaseClient | null;
  userId?: string | null;
  userName?: string | null;
  userAvatar?: string | null;
  isPro?: boolean;
  totalFocusSeconds?: number;
  completedPomodoros?: number;
  initialPeriod?: LeaderboardPeriod;
  initialMonth?: string | null;
};

export function useLeaderboard({
  supabase,
  userId,
  userName,
  userAvatar,
  isPro,
  totalFocusSeconds = 0,
  completedPomodoros = 0,
  initialPeriod = "weekly",
  initialMonth = null,
}: UseLeaderboardOptions) {
  const [period, setPeriod] = useState<LeaderboardPeriod>(initialPeriod);
  const [month, setMonth] = useState<string | null>(initialMonth);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardMyRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const currentUserMinutes = Math.round(totalFocusSeconds / 60);

  const handlePeriodChange = useCallback((newPeriod: LeaderboardPeriod) => {
    setPeriod(newPeriod);
    setMonth(null);
    setLoading(true);
  }, []);

  const handleMonthChange = useCallback((newMonth: string | null) => {
    setMonth(newMonth);
    setPeriod("monthly");
    setLoading(true);
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    setReloadTrigger((v) => v + 1);
  }, []);

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      const currentUserPayload = userId
        ? {
            id: userId,
            name: userName,
            avatarUrl: userAvatar,
            isPro,
            minutes: currentUserMinutes,
            pomodoros: completedPomodoros,
          }
        : null;

      try {
        const [loadedEntries, loadedMyRank] = await Promise.all([
          fetchLeaderboardEntries(supabase, period, userId, currentUserPayload, month),
          fetchMyLeaderboardRank(supabase, period, userId),
        ]);

        if (!ignore) {
          setEntries(loadedEntries);
          setMyRank(loadedMyRank);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      ignore = true;
    };
  }, [
    supabase,
    period,
    month,
    userId,
    userName,
    userAvatar,
    isPro,
    currentUserMinutes,
    completedPomodoros,
    reloadTrigger,
  ]);

  // Derived current user entry from entries list
  const currentUserEntry = useMemo(() => {
    return entries.find((e) => e.isCurrentUser);
  }, [entries]);

  // Podium (Ranks 1, 2, 3)
  const podium = useMemo(() => {
    return getPodium(entries);
  }, [entries]);

  // Remaining ranked entries (Rank 4+)
  const otherEntries = useMemo(() => {
    return entries.filter((e) => e.rank > 3);
  }, [entries]);

  // Progress needed to pass previous rank
  const surpassInfo = useMemo(() => {
    if (!currentUserEntry || currentUserEntry.rank <= 1) return null;
    const previous = entries.find((e) => e.rank === currentUserEntry.rank - 1);
    return calculateRankProgress(currentUserEntry, previous);
  }, [currentUserEntry, entries]);

  return {
    period,
    setPeriod: handlePeriodChange,
    month,
    setMonth: handleMonthChange,
    entries,
    myRank,
    loading,
    refresh,
    currentUserEntry,
    podium,
    otherEntries,
    surpassInfo,
  };
}
