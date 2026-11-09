"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { loadCloudHabitsData, saveCloudHabits } from "./habit-cloud";
import type { Habit, HabitFilter, HabitStats, HeatmapDay } from "./habit-types";
import {
  loadLocalHabits,
  saveLocalHabits,
  toggleHabitDate,
  calculateHabitStats,
  buildConsistencyHeatmap,
  getTodayKey,
  reorderHabitsList,
  mergeHabits,
  getDeletedHabitIds,
  saveDeletedHabitIds,
  recordDeletedHabitId,
} from "./habit-service";

export function useHabits(userId?: string | null) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [filter, setFilter] = useState<HabitFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const initialSyncDoneRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize habits from local storage and sync with Supabase cloud
  useEffect(() => {
    let isCancelled = false;
    const local = loadLocalHabits();
    const localDeletedIds = getDeletedHabitIds(userId);
    const cleanLocal = local.filter((h) => !localDeletedIds.includes(h.id));
    setHabits(cleanLocal);

    if (!userId) {
      setIsLoaded(true);
      initialSyncDoneRef.current = true;
      setIsSyncing(false);
      return;
    }

    setIsSyncing(true);

    // Load from Supabase cloud and safely merge
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const cloudData = await loadCloudHabitsData(supabase, userId);
        if (isCancelled) return;

        const cloudHabits = cloudData?.habits || [];
        const cloudDeletedIds = cloudData?.deletedHabitIds || [];
        const allDeletedIds = Array.from(new Set([...cloudDeletedIds, ...localDeletedIds]));
        saveDeletedHabitIds(allDeletedIds, userId);

        if (cloudHabits.length > 0) {
          // Cloud has established habits: Authoritative list comes from cloud
          const merged = mergeHabits(cleanLocal, cloudHabits, allDeletedIds);
          setHabits(merged);
          saveLocalHabits(merged);

          // ONLY upload if local had genuine unsynced offline drafts
          const hasLocalDrafts = cleanLocal.some(
            (l) => Boolean(l._isLocalDraft) && !allDeletedIds.includes(l.id)
          );
          if (hasLocalDrafts) {
            await saveCloudHabits(supabase, userId, merged);
          }
        } else if (cleanLocal.length > 0) {
          // First-time guest migration to cloud
          setHabits(cleanLocal);
          saveLocalHabits(cleanLocal);
          await saveCloudHabits(supabase, userId, cleanLocal);
        }
      } catch (err) {
        console.warn("[BiarFokus Habits] Cloud sync init failed:", err);
      } finally {
        if (!isCancelled) {
          initialSyncDoneRef.current = true;
          setIsLoaded(true);
          setIsSyncing(false);
        }
      }
    })();

    // Realtime Supabase subscription on profiles table
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
            const updatedDeletedIds = payload.new?.settings?.deletedHabitIds;
            const currentDeleted = getDeletedHabitIds(userId);
            const combinedDeleted = Array.from(
              new Set([...currentDeleted, ...(Array.isArray(updatedDeletedIds) ? updatedDeletedIds : [])])
            );
            saveDeletedHabitIds(combinedDeleted, userId);

            if (Array.isArray(updatedHabits)) {
              setHabits((prev) => {
                const merged = mergeHabits(prev, updatedHabits, combinedDeleted);
                saveLocalHabits(merged);
                return merged;
              });
            }
          }
        )
        .subscribe();
    } catch {}

    // Tab visibility and focus change (e.g. mobile returns from background or desktop window focused)
    const handleVisibilityOrFocus = async () => {
      if (document.visibilityState === "visible" && !isCancelled && userId) {
        try {
          setIsSyncing(true);
          const supabase = getSupabaseBrowserClient();
          const cloudData = await loadCloudHabitsData(supabase, userId);
          if (cloudData && !isCancelled) {
            const currentDeleted = getDeletedHabitIds(userId);
            const allDeleted = Array.from(new Set([...currentDeleted, ...(cloudData.deletedHabitIds || [])]));
            saveDeletedHabitIds(allDeleted, userId);

            setHabits((prev) => {
              const merged = mergeHabits(prev, cloudData.habits, allDeleted);
              saveLocalHabits(merged);
              return merged;
            });
          }
        } catch {
        } finally {
          if (!isCancelled) setIsSyncing(false);
        }
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

  // Save to localStorage and cloud whenever habits change after initial sync completes
  useEffect(() => {
    if (!isLoaded || !initialSyncDoneRef.current) return;
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

  // Explicit manual sync button callback
  const syncWithCloud = useCallback(async () => {
    if (!userId) return;
    try {
      setIsSyncing(true);
      const supabase = getSupabaseBrowserClient();
      const cloudData = await loadCloudHabitsData(supabase, userId);
      if (cloudData) {
        const currentDeleted = getDeletedHabitIds(userId);
        const allDeleted = Array.from(new Set([...currentDeleted, ...(cloudData.deletedHabitIds || [])]));
        saveDeletedHabitIds(allDeleted, userId);

        setHabits((prev) => {
          const merged = mergeHabits(prev, cloudData.habits, allDeleted);
          saveLocalHabits(merged);
          return merged;
        });
      }
    } catch (err) {
      console.warn("[BiarFokus Habits] Manual sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [userId]);

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
      _isLocalDraft: true,
    };
    setHabits((prev) => [newHabit, ...prev]);
    return newHabit;
  }, []);

  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...updates } : h)));
  }, []);

  const deleteHabit = useCallback(
    (id: string) => {
      recordDeletedHabitId(id, userId);
      setHabits((prev) => {
        const next = prev.filter((h) => h.id !== id);
        saveLocalHabits(next);
        return next;
      });

      if (userId) {
        // Immediately persist deletion to cloud with tombstone
        try {
          const supabase = getSupabaseBrowserClient();
          void saveCloudHabits(
            supabase,
            userId,
            habits.filter((h) => h.id !== id),
            id
          );
        } catch (err) {
          console.warn("[BiarFokus Habits] Instant cloud delete failed:", err);
        }
      }
    },
    [habits, userId]
  );

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
    isSyncing,
    syncWithCloud,
  };
}
