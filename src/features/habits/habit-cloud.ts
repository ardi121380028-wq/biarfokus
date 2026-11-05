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
 */
export async function saveCloudHabits(
  supabase: SupabaseClient,
  userId: string,
  habits: Habit[]
): Promise<void> {
  try {
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

    const { error } = await supabase
      .from("profiles")
      .update({ settings: { ...prev, habits } })
      .eq("id", userId);

    if (error) {
      console.warn("[BiarFokus Habits] Failed to save habits to cloud:", error);
    }
  } catch (err) {
    console.warn("[BiarFokus Habits] Error saving habits to cloud:", err);
  }
}
