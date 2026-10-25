"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Habit, HabitFilter, HabitStats, HeatmapDay } from "./habit-types";
import {
  loadLocalHabits,
  saveLocalHabits,
  toggleHabitDate,
  calculateHabitStats,
  buildConsistencyHeatmap,
  getTodayKey,
} from "./habit-service";

export function useHabits(userId?: string | null) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [filter, setFilter] = useState<HabitFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize habits from local storage
  useEffect(() => {
    const loaded = loadLocalHabits();
    setHabits(loaded);
    setIsLoaded(true);
  }, [userId]);

  // Save to localStorage whenever habits change after initial load
  useEffect(() => {
    if (!isLoaded) return;
    saveLocalHabits(habits);
  }, [habits, isLoaded]);

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
    isLoaded,
  };
}
