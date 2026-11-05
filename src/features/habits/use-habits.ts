"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { loadCloudHabits, saveCloudHabits } from "./habit-cloud";
import type { Habit, HabitFilter, HabitStats, HeatmapDay } from "./habit-types";
import {
  loadLocalHabits,
  saveLocalHabits,
  toggleHabitDate,
  calculateHabitStats,
  buildConsistencyHeatmap,
  getTodayKey,
  reorderHabitsList,
} from "./habit-service";

export function useHabits(userId?: string | null) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [filter, setFilter] = useState<HabitFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize habits from local storage and sync with Supabase cloud
  useEffect(() => {
    let isCancelled = false;
    const local = loadLocalHabits();
    setHabits(local);
    setIsLoaded(true);

    if (!userId) return;

    // Load from Supabase cloud
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const cloud = await loadCloudHabits(supabase, userId);
        if (isCancelled) return;
        if (cloud && cloud.length > 0) {
          setHabits(cloud);
          saveLocalHabits(cloud);
        } else if (local && local.length > 0) {
          await saveCloudHabits(supabase, userId, local);
        }
      } catch (err) {
        console.warn("[BiarFokus Habits] Cloud sync init failed:", err);
      }
    })();

    // Realtime Supabase subscription on profiles
    let channel: any = null;
    try {
      const supabase = getSupabaseBrowserClient();
      channel = supabase
        .channel(`habits_realtime_${userId}_${Date.now()}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${userId}`,
          },
          (payload: any) => {
            if (isCancelled) return;
            const updatedHabits = payload.new?.settings?.habits;
            if (Array.isArray(updatedHabits) && updatedHabits.length > 0) {
              setHabits(updatedHabits);
              saveLocalHabits(updatedHabits);
            }
          }
        )
        .subscribe();
    } catch {}

    // Tab visibility and focus change (e.g. mobile returns from background or desktop window focused)
    const handleVisibilityOrFocus = async () => {
      if (document.visibilityState === "visible" && !isCancelled) {
        try {
          const supabase = getSupabaseBrowserClient();
          const cloud = await loadCloudHabits(supabase, userId);
          if (cloud && cloud.length > 0) {
            setHabits(cloud);
            saveLocalHabits(cloud);
          }
        } catch {}
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      isCancelled = true;
      if (channel) void channel.unsubscribe();
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [userId]);

  // Save to localStorage and cloud whenever habits change after initial load
  useEffect(() => {
    if (!isLoaded) return;
    saveLocalHabits(habits);

    if (!userId) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        await saveCloudHabits(supabase, userId, habits);
      } catch (err) {
        console.warn("[BiarFokus Habits] Debounced save failed:", err);
      }
    }, 600);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [habits, isLoaded, userId]);

  // Audio feedback on habit check-in
  const playCheckinSound = useCallback(() => {
    try {
      if (typeof window === "undefined") return;
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } catch {
      // AudioContext unavailable or blocked by user policy
    }
  }, []);

  const toggleCheckin = useCallback(
    (habitId: string, dateKey = getTodayKey()) => {
      setHabits((prev) => {
        const target = prev.find((h) => h.id === habitId);
        if (!target) return prev;

        const isMarkingDone = !target.completedDates.includes(dateKey);
        if (isMarkingDone && dateKey === getTodayKey()) {
          playCheckinSound();
        }

        return prev.map((h) => (h.id === habitId ? toggleHabitDate(h, dateKey) : h));
      });
    },
    [playCheckinSound]
  );

  const addHabit = useCallback((data: Omit<Habit, "id" | "completedDates" | "streakCurrent" | "streakBest" | "createdAt">) => {
    const newHabit: Habit = {
      ...data,
      id: "habit-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
      completedDates: [],
      streakCurrent: 0,
      streakBest: 0,
      createdAt: new Date().toISOString(),
    };
    setHabits((prev) => [newHabit, ...prev]);
    return newHabit;
  }, []);

  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...updates } : h)));
  }, []);

    const deleteHabit = useCallback((id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const reorderHabits = useCallback(
    (fromIndex: number, toIndex: number, currentList?: Habit[]) => {
      setHabits((prev) => {
        const list = currentList && currentList.length > 0 ? currentList : prev;
        if (
          fromIndex < 0 ||
          fromIndex >= list.length ||
          toIndex < 0 ||
          toIndex >= list.length ||
          fromIndex === toIndex
        ) {
          return prev;
        }

        const fromHabit = list[fromIndex];
        const toHabit = list[toIndex];
        if (!fromHabit || !toHabit) return prev;

        const realFromIdx = prev.findIndex((h) => h.id === fromHabit.id);
        const realToIdx = prev.findIndex((h) => h.id === toHabit.id);
        if (realFromIdx === -1 || realToIdx === -1) return prev;

        return reorderHabitsList(prev, realFromIdx, realToIdx);
      });
    },
    []
  );

  const filteredHabits = useMemo(() => {
    return habits.filter((h) => {
      if (h.archived) return false;
      if (filter !== "all" && h.routineTime !== filter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = h.title.toLowerCase().includes(q);
        const matchesCue = h.cue?.toLowerCase().includes(q);
        const matchesIdentity = h.identity?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCue && !matchesIdentity) return false;
      }
      return true;
    });
  }, [habits, filter, searchQuery]);

  const stats: HabitStats = useMemo(() => {
    return calculateHabitStats(habits);
  }, [habits]);

  const heatmap: HeatmapDay[] = useMemo(() => {
    return buildConsistencyHeatmap(habits, 84); // 12 weeks
  }, [habits]);

  return {
    habits,
    filteredHabits,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    stats,
    heatmap,
    toggleCheckin,
    addHabit,
    updateHabit,
    deleteHabit,
    reorderHabits,
    isLoaded,
  };
}
