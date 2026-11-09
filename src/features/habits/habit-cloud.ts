import type { SupabaseClient } from "@supabase/supabase-js";
import type { Habit } from "./habit-types";

export interface CloudHabitsData {
  habits: Habit[];
  deletedHabitIds: string[];
}

/**
 * Loads cloud habits and tombstone deletedHabitIds from Supabase profiles.settings
 */
export async function loadCloudHabitsData(
  supabase: SupabaseClient,
  userId: string
): Promise<CloudHabitsData | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("settings")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return null;
    const settings = data.settings as Record<string, unknown> | null;
    if (!settings) return null;

    const habits = Array.isArray(settings.habits) ? (settings.habits as Habit[]) : [];
    const deletedHabitIds = Array.isArray(settings.deletedHabitIds)
      ? (settings.deletedHabitIds as string[])
      : [];

    return { habits, deletedHabitIds };
  } catch (err) {
    console.warn("[BiarFokus Habits] Failed to load habits data from cloud:", err);
    return null;
  }
}

/**
 * Loads cloud habits from Supabase profiles.settings.habits
 */
export async function loadCloudHabits(
  supabase: SupabaseClient,
  userId: string
): Promise<Habit[] | null> {
  const data = await loadCloudHabitsData(supabase, userId);
  if (!data || data.habits.length === 0) return null;
  return data.habits;
}

/**
 * Saves habits to Supabase profiles.settings.habits
 * Implements strict anti-data-loss protections:
 * 1. Tracks deletedHabitIds (tombstones) so deletions propagate cross-device and deleted items never resurrect.
 * 2. Refuses to overwrite non-empty cloud habits with an empty array unless an explicit deletion was made.
 * 3. Unions completedDates so check-in history is never lost across multiple devices/updates.
 */
export async function saveCloudHabits(
  supabase: SupabaseClient,
  userId: string,
  habits: Habit[],
  deletedId?: string
): Promise<void> {
  try {
    if (!userId) return;

    const { data: existing } = await supabase
      .from("profiles")
      .select("settings")
      .eq("id", userId)
      .maybeSingle();

    const prev =
      existing?.settings &&
      typeof existing.settings === "object" &&
      !Array.isArray(existing.settings)
        ? (existing.settings as Record<string, unknown>)
        : {};

    const cloudExistingHabits = Array.isArray(prev.habits) ? (prev.habits as Habit[]) : [];
    const prevDeletedIds = Array.isArray(prev.deletedHabitIds) ? (prev.deletedHabitIds as string[]) : [];

    // Accumulate deleted IDs
    const nextDeletedIds = Array.from(
      new Set([...prevDeletedIds, ...(deletedId ? [deletedId] : [])])
    );

    // Filter out any habits that are in nextDeletedIds
    const filteredHabits = (habits || []).filter((h) => !nextDeletedIds.includes(h.id));

    // CRITICAL SAFETY GUARD: Never overwrite an existing user's cloud habits with an empty array unless intentional deletion.
    if (filteredHabits.length === 0 && cloudExistingHabits.length > 0 && !deletedId) {
      console.warn("[BiarFokus Habits] Refusing to overwrite non-empty cloud habits with empty array.");
      return;
    }

    // Safety union: ensure no check-in dates already saved in cloud are lost
    const safeHabits = filteredHabits.map((h) => {
      const cloudMatch = cloudExistingHabits.find((c) => c.id === h.id);
      const { _isLocalDraft, ...cleanHabit } = h as Habit & { _isLocalDraft?: boolean };

      if (!cloudMatch || !cloudMatch.completedDates || cloudMatch.completedDates.length === 0) {
        return cleanHabit as Habit;
      }
      const unionDates = Array.from(new Set([...cloudMatch.completedDates, ...(cleanHabit.completedDates || [])])).sort();
      return {
        ...cleanHabit,
        completedDates: unionDates,
      } as Habit;
    });

    const { error } = await supabase
      .from("profiles")
      .update({
        settings: {
          ...prev,
          habits: safeHabits,
          deletedHabitIds: nextDeletedIds,
        },
      })
      .eq("id", userId);

    if (error) {
      console.warn("[BiarFokus Habits] Failed to save habits to cloud:", error);
    }
  } catch (err) {
    console.warn("[BiarFokus Habits] Error saving habits to cloud:", err);
  }
}
