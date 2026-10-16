import type { SupabaseClient } from "@supabase/supabase-js";
import type { TimerDurations } from "@/types/domain";

export const SETTINGS_STORAGE_KEY = "biarfokus.settings";

export type UserSettings = {
  selectedColor: string;
  autoStart: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  timerDurations: TimerDurations;
  repeatAlarm: boolean;
};

export const DEFAULT_SETTINGS: UserSettings = {
  selectedColor: "#e8e8e8",
  autoStart: false,
  soundEnabled: true,
  notificationsEnabled: false,
  timerDurations: { pomodoro: 25 * 60, short: 5 * 60, long: 15 * 60 },
  repeatAlarm: false,
};

function isSettings(value: unknown): value is UserSettings {
  if (typeof value !== "object" || value === null) return false;
  const settings = value as Record<string, unknown>;
  const timerDurations = settings.timerDurations;
  if (typeof timerDurations !== "object" || timerDurations === null) return false;
  const durations = timerDurations as Record<string, unknown>;
  return typeof settings.selectedColor === "string" &&
    typeof settings.autoStart === "boolean" &&
    typeof settings.soundEnabled === "boolean" &&
    typeof settings.notificationsEnabled === "boolean" &&
    typeof settings.repeatAlarm === "boolean" &&
    typeof durations.pomodoro === "number" &&
    typeof durations.short === "number" &&
    typeof durations.long === "number";
}

export function loadLocalSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const saved = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!saved) return DEFAULT_SETTINGS;
  try {
    const parsed: unknown = JSON.parse(saved);
    return isSettings(parsed) ? parsed : DEFAULT_SETTINGS;
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
    return DEFAULT_SETTINGS;
  }
}

export function saveLocalSettings(settings: UserSettings) {
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export async function loadUserSettings(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserSettings> {
  const { data, error } = await supabase
    .from("profiles")
    .select("settings")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return isSettings(data.settings) ? data.settings : DEFAULT_SETTINGS;
}

export async function saveUserSettings(
  supabase: SupabaseClient,
  userId: string,
  settings: UserSettings,
) {
  const { error } = await supabase
    .from("profiles")
    .update({ settings })
    .eq("id", userId);
  if (error) throw error;
}
