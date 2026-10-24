import type { SupabaseClient } from "@supabase/supabase-js";
import type { TimerDurations } from "@/types/domain";
import type { AlarmSoundType } from "../audio/alarm-sound.ts";

export const SETTINGS_STORAGE_KEY = "biarfokus.settings";

export type UserSettings = {
  selectedColor: string;
  autoStart: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  timerDurations: TimerDurations;
  repeatAlarm: boolean;
  alarmSound: AlarmSoundType;
  longBreakInterval: number;
  dailyGoalPomodoros: number;
  tickingSoundEnabled: boolean;
  language?: "id" | "en";
  timeFormat?: "24" | "12";
  notesDefaultView?: "grid" | "list";
  calendarDefaultView?: "day" | "week" | "month";
  calendarDefaultDuration?: number;
  calendarConfirmDelete?: boolean;
  kanbanConfirmDelete?: boolean;
  loadingStyle?: "minimal" | "pro" | "classic";
};

export const DEFAULT_SETTINGS: UserSettings = {
  selectedColor: "#e8e8e8",
  autoStart: false,
  soundEnabled: true,
  notificationsEnabled: false,
  timerDurations: { pomodoro: 25 * 60, short: 5 * 60, long: 15 * 60 },
  repeatAlarm: false,
  alarmSound: "bell",
  longBreakInterval: 4,
  dailyGoalPomodoros: 8,
  tickingSoundEnabled: false,
  language: "id",
  timeFormat: "24",
  notesDefaultView: "grid",
  calendarDefaultView: "day",
  calendarDefaultDuration: 60,
  calendarConfirmDelete: true,
  kanbanConfirmDelete: true,
  loadingStyle: "classic",
};

export function normalizeSettings(value: unknown): UserSettings {
  if (typeof value !== "object" || value === null) return DEFAULT_SETTINGS;
  const s = value as Record<string, unknown>;
  const rawDurations =
    typeof s.timerDurations === "object" && s.timerDurations !== null
      ? (s.timerDurations as Record<string, unknown>)
      : {};

  const pomodoro =
    typeof rawDurations.pomodoro === "number" && rawDurations.pomodoro > 0
      ? rawDurations.pomodoro
      : DEFAULT_SETTINGS.timerDurations.pomodoro;
  const short =
    typeof rawDurations.short === "number" && rawDurations.short > 0
      ? rawDurations.short
      : DEFAULT_SETTINGS.timerDurations.short;
  const long =
    typeof rawDurations.long === "number" && rawDurations.long > 0
      ? rawDurations.long
      : DEFAULT_SETTINGS.timerDurations.long;

  const alarmSound: AlarmSoundType =
    s.alarmSound === "digital" || s.alarmSound === "marimba" || s.alarmSound === "zen"
      ? s.alarmSound
      : "bell";

  const longBreakInterval =
    typeof s.longBreakInterval === "number" && s.longBreakInterval >= 1 && s.longBreakInterval <= 12
      ? Math.floor(s.longBreakInterval)
      : 4;

  const dailyGoalPomodoros =
    typeof s.dailyGoalPomodoros === "number" && s.dailyGoalPomodoros >= 1 && s.dailyGoalPomodoros <= 24
      ? Math.floor(s.dailyGoalPomodoros)
      : 8;

  const tickingSoundEnabled =
    typeof s.tickingSoundEnabled === "boolean" ? s.tickingSoundEnabled : false;

  const language = s.language === "en" ? "en" : "id";
  const timeFormat = s.timeFormat === "12" ? "12" : "24";
  const notesDefaultView = s.notesDefaultView === "list" ? "list" : "grid";
  const calendarDefaultView =
    s.calendarDefaultView === "week" || s.calendarDefaultView === "month"
      ? s.calendarDefaultView
      : "day";
  const calendarDefaultDuration =
    s.calendarDefaultDuration === 15 || s.calendarDefaultDuration === 30 || s.calendarDefaultDuration === 60
      ? s.calendarDefaultDuration
      : 60;
  const calendarConfirmDelete =
    typeof s.calendarConfirmDelete === "boolean" ? s.calendarConfirmDelete : true;
  const kanbanConfirmDelete =
    typeof s.kanbanConfirmDelete === "boolean" ? s.kanbanConfirmDelete : true;
  const loadingStyle =
    s.loadingStyle === "minimal" || s.loadingStyle === "pro"
      ? s.loadingStyle
      : "classic";

  return {
    selectedColor: typeof s.selectedColor === "string" ? s.selectedColor : DEFAULT_SETTINGS.selectedColor,
    autoStart: typeof s.autoStart === "boolean" ? s.autoStart : DEFAULT_SETTINGS.autoStart,
    soundEnabled: typeof s.soundEnabled === "boolean" ? s.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
    notificationsEnabled: typeof s.notificationsEnabled === "boolean" ? s.notificationsEnabled : DEFAULT_SETTINGS.notificationsEnabled,
    repeatAlarm: typeof s.repeatAlarm === "boolean" ? s.repeatAlarm : DEFAULT_SETTINGS.repeatAlarm,
    timerDurations: { pomodoro, short, long },
    alarmSound,
    longBreakInterval,
    dailyGoalPomodoros,
    tickingSoundEnabled,
    language,
    timeFormat,
    notesDefaultView,
    calendarDefaultView,
    calendarDefaultDuration,
    calendarConfirmDelete,
    kanbanConfirmDelete,
    loadingStyle,
  };
}

export function loadLocalSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const saved = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!saved) return DEFAULT_SETTINGS;
  try {
    const parsed: unknown = JSON.parse(saved);
    return normalizeSettings(parsed);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
    return DEFAULT_SETTINGS;
  }
}

export function saveLocalSettings(settings: Partial<UserSettings> | UserSettings) {
  if (typeof window === "undefined") return;
  const current = loadLocalSettings();
  const merged = normalizeSettings({ ...current, ...settings });
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
  if (merged.loadingStyle) {
    try {
      window.localStorage.setItem("biarfokus.loading_style", merged.loadingStyle);
    } catch {}
  }
}

export async function loadUserSettings(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserSettings> {
  const { data, error } = await supabase
    .from("profiles")
    .select("settings")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.settings ? normalizeSettings(data.settings) : DEFAULT_SETTINGS;
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
