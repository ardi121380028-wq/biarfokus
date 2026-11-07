import type { SupabaseClient } from "@supabase/supabase-js";
import type { Habit } from "./habit-types";

/**
 * Loads cloud habits from Supabase profiles.settings.habits
 */
export async function loadCloudHabits(
  supabase: SupabaseClient,
  userId: string
): Promise<Habit[] | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("settings")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return null;
    const settings = data.settings as Record<string, unknown> | null;
    if (settings && Array.isArray(settings.habits) && settings.habits.length > 0) {
      return settings.habits as Habit[];
    }
    return null;
  } catch (err) {
    console.warn("[BiarFokus Habits] Failed to load habits from cloud:", err);
    return null;
  }
}

/**
 * Saves habits to Supabase profiles.settings.habits
 * Implements strict anti-data-loss protections:
 * 1. Refuses to overwrite non-empty cloud habits with an empty array.
 * 2. Unions completedDates so check-in history is never lost across multiple devices/updates.
 */
export async function saveCloudHabits(
  supabase: SupabaseClient,
  userId: string,
  habits: Habit[]
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

    // CRITICAL SAFETY GUARD: Never overwrite an existing user's cloud habits with an empty array.
    if ((!habits || habits.length === 0) && cloudExistingHabits.length > 0) {
      console.warn("[BiarFokus Habits] Refusing to overwrite non-empty cloud habits with empty array.");
      return;
    }

    // Safety union: ensure no check-in dates already saved in cloud are lost
    const safeHabits = (habits || []).map((h) => {
      const cloudMatch = cloudExistingHabits.find((c) => c.id === h.id);
      if (!cloudMatch || !cloudMatch.completedDates || cloudMatch.completedDates.length === 0) {
        return h;
      }
      const unionDates = Array.from(new Set([...cloudMatch.completedDates, ...(h.completedDates || [])])).sort();
      return {
        ...h,
        completedDates: unionDates,
      };
    });

    const { error } = await supabase
      .from("profiles")
      .update({ settings: { ...prev, habits: safeHabits } })
      .eq("id", userId);

    if (error) {
      console.warn("[BiarFokus Habits] Failed to save habits to cloud:", error);
    }
  } catch (err) {
    console.warn("[BiarFokus Habits] Error saving habits to cloud:", err);
  }
}
