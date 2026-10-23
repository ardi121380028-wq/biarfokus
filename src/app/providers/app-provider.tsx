"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { getSafeAvatarUrl } from "@/features/profile/profile-service";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { trackSiteVisit } from "@/features/analytics/visitor-tracker";
import { playTickSound } from "@/features/audio/ticking-sound";
import { isAdminRole, loadUserRole } from "@/features/admin/admin-service";
import {
  assertTaskLimitAllowed,
  createDefaultSubscription,
  isProSubscription,
  loadUserSubscription,
} from "@/features/billing/billing-service";
import {
  DEFAULT_SETTINGS,
  loadLocalSettings,
  loadUserSettings,
  saveLocalSettings,
  saveUserSettings,
  type UserSettings,
} from "@/features/settings/settings-service";
import type {
  AmbientSoundMode,
  KeepNote,
  Task,
  TimerDurations,
  TimerMode,
  UserRole,
  UserSubscription,
} from "@/types/domain";
import type { LinkedNoteMeta } from "@/features/tasks/task-service";
import { syncAmbientSound, stopAmbientSound } from "@/features/audio/ambient-sound";
import { playAlarmSound, type AlarmSoundType } from "@/features/audio/alarm-sound";
import {
  createTask,
  deleteAllTasks as deleteAllCloudTasks,
  deleteTaskById,
  deleteTasksByIds,
  initialTasks,
  loadLocalTasks,
  loadTaskLinks,
  loadTasks,
  recordCompletedSession,
  resolveFocusedTask,
  saveTaskLink,
  setTaskCompleted,
  updateTaskPomodoros,
} from "@/features/tasks/task-service";
import { useKeepNotes } from "@/features/notes/use-keep-notes";
import {
  formatTime,
  getNextTimerMode,
  getRemainingSeconds,
  getTimerEndTime,
} from "@/features/timer/timer-utils";

export const timerDurationsDefault: Record<TimerMode, number> = {
  pomodoro: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

export const modeLabels: Record<TimerMode, string> = {
  pomodoro: "Pomodoro",
  short: "Short Break",
  long: "Long Break",
};

export const colorThemes = [
  { color: "#e8e8e8", name: "Cloud" },
  { color: "#f77fa5", name: "Rose" },
  { color: "#a9d63b", name: "Lime" },
  { color: "#1976df", name: "Ocean" },
  { color: "#ffc247", name: "Sun" },
  { color: "#f7c928", name: "Focus" },
];

function playClickSound() {
  if (typeof window === "undefined") return;
  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 587.33; // D5 tone - gentle, focused start chime
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.06, context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.12);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
    window.setTimeout(() => void context.close(), 200);
  } catch {}
}

export interface AppContextType {
  // Auth & Profile
  user: User | null;
  userRole: UserRole;
  subscription: UserSubscription;
  isPro: boolean;
  userName: string;
  userAvatar: string | null;
  profileDisplayName: string | null;
  setProfileDisplayName: (name: string | null) => void;
  loginOpen: boolean;
  setLoginOpen: (open: boolean) => void;
  authMode: "sign-in" | "sign-up";
  setAuthMode: (mode: "sign-in" | "sign-up") => void;
  accountOpen: boolean;
  setAccountOpen: (open: boolean) => void;
  deleteConfirmOpen: boolean;
  setDeleteConfirmOpen: (open: boolean) => void;
  deletingAccount: boolean;
  handleDeleteAccount: () => Promise<void>;
  handleLogout: () => Promise<void>;
  authError: string | null;
  setAuthError: (err: string | null) => void;
  appError: string | null;
  setAppError: (err: string | null) => void;

  // Theme & Settings
  dark: boolean;
  setDark: (dark: boolean | ((prev: boolean) => boolean)) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  autoStart: boolean;
  setAutoStart: (v: boolean) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (v: boolean) => void;
  timerDurations: TimerDurations;
  setTimerDurations: (d: TimerDurations) => void;
  repeatAlarm: boolean;
  setRepeatAlarm: (v: boolean) => void;
  alarmSound: AlarmSoundType;
  setAlarmSound: (v: AlarmSoundType) => void;
  longBreakInterval: number;
  setLongBreakInterval: (v: number) => void;
  dailyGoalPomodoros: number;
  setDailyGoalPomodoros: (v: number) => void;
  tickingSoundEnabled: boolean;
  setTickingSoundEnabled: (v: boolean) => void;

  // Timer & Audio
  mode: TimerMode;
  setMode: (mode: TimerMode) => void;
  seconds: number;
  setSeconds: (sec: number | ((prev: number) => number)) => void;
  running: boolean;
  setRunning: (running: boolean) => void;
  completedPomodoros: number;
  setCompletedPomodoros: (count: number | ((prev: number) => number)) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null | ((prev: string | null) => string | null)) => void;
  focusedTask: Task | null;
  ambientSound: AmbientSoundMode;
  setAmbientSound: (sound: AmbientSoundMode) => void;
  changeMode: (nextMode: TimerMode) => void;
  toggleRunning: () => void;
  resetTimer: () => void;
  skipSession: () => void;
  zenMode: boolean;
  setZenMode: (zen: boolean | ((prev: boolean) => boolean)) => void;

  // Tasks
  tasks: Task[];
  tasksHydrated: boolean;
  activeTasksCount: number;
  completedTasks: number;
  addTask: (title: string, linkedMeta?: LinkedNoteMeta) => Promise<void>;
  toggleTask: (task: Task) => Promise<void>;
  reorderTasks: (sourceIndex: number, destinationIndex: number) => void;
  deleteTask: (task: Task) => Promise<void>;
  deleteCompletedTasks: () => Promise<void>;
  deleteAllTasks: () => Promise<void>;

  // Notes
  notes: KeepNote[];
  setItemDone: (noteId: string, itemId: string, done: boolean) => void;

  // Modals & Navigation
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
  infoOpen: string | null;
  setInfoOpen: (info: string | null) => void;
  aboutModalOpen: boolean;
  setAboutModalOpen: (open: boolean) => void;
  pomodoroModalOpen: boolean;
  setPomodoroModalOpen: (open: boolean) => void;
  termsModalOpen: boolean;
  setTermsModalOpen: (open: boolean) => void;
  faqModalOpen: boolean;
  setFaqModalOpen: (open: boolean) => void;
  notesOpen: boolean;
  setNotesOpen: (open: boolean) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;

  // Constants
  colorThemes: typeof colorThemes;
  modeLabels: typeof modeLabels;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // Timer State
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [seconds, setSeconds] = useState(timerDurationsDefault.pomodoro);
  const [running, setRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [ambientSound, setAmbientSound] = useState<AmbientSoundMode>("off");
  const [dark, setDark] = useState(false);

  // Settings State
  const [selectedColor, setSelectedColor] = useState(DEFAULT_SETTINGS.selectedColor);
  const [autoStart, setAutoStart] = useState(DEFAULT_SETTINGS.autoStart);
  const [soundEnabled, setSoundEnabled] = useState(DEFAULT_SETTINGS.soundEnabled);
  const [notificationsEnabled, setNotificationsEnabled] = useState(DEFAULT_SETTINGS.notificationsEnabled);
  const [timerDurations, setTimerDurations] = useState<TimerDurations>(DEFAULT_SETTINGS.timerDurations);
  const [repeatAlarm, setRepeatAlarm] = useState(DEFAULT_SETTINGS.repeatAlarm);
  const [alarmSound, setAlarmSound] = useState<AlarmSoundType>(DEFAULT_SETTINGS.alarmSound);
  const [longBreakInterval, setLongBreakInterval] = useState<number>(DEFAULT_SETTINGS.longBreakInterval);
  const [dailyGoalPomodoros, setDailyGoalPomodoros] = useState<number>(DEFAULT_SETTINGS.dailyGoalPomodoros);
  const [tickingSoundEnabled, setTickingSoundEnabled] = useState<boolean>(DEFAULT_SETTINGS.tickingSoundEnabled);
  const [zenMode, setZenMode] = useState(false);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>("user");
  const [subscription, setSubscription] = useState<UserSubscription>(() => createDefaultSubscription());
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [accountOpen, setAccountOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [appError, setAppError] = useState<string | null>(null);

  // Tasks State
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [tasksHydrated, setTasksHydrated] = useState(false);

  // Modals & UI
  const [showSettings, setShowSettings] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState<string | null>(null);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [pomodoroModalOpen, setPomodoroModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Notes Hook
  const { notes, setItemDone } = useKeepNotes(user?.id);

  // Refs for timer calculations
  const timerEndAtRef = useRef<number | null>(null);
  const lastTickedSecondRef = useRef<number | null>(null);
  const settingsHydratedRef = useRef(false);
  const settingsOwnerRef = useRef<string | null>(null);

  // Document title sync
  useEffect(() => {
    const title = mode === "pomodoro" ? "Time to focus!" : "Time for a break!";
    document.title = `${formatTime(seconds)} - ${title}`;
  }, [mode, seconds]);

  // Handle URL error & billing search params on initial load
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const error = params.get("auth_error");
    const billing = params.get("billing");
    if (!error && !billing) return;
    const frame = window.requestAnimationFrame(() => {
      if (error) setAuthError(error);
      if (billing === "success") {
        setInfoOpen("Pembayaran berhasil diproses! Langganan Pro kamu sedang diaktifkan.");
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  // Supabase Auth listener
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    async function loadUser() {
      try {
        const sessionResult = await supabase.auth.getSession();
        if (sessionResult.error) throw sessionResult.error;
        if (!sessionResult.data.session) {
          setUser(null);
          setProfileDisplayName(null);
          return;
        }
        const result = await supabase.auth.getUser();
        if (result.error) {
          if (
            result.error.name === "AuthSessionMissingError" ||
            result.error.message.includes("Auth session missing")
          ) {
            setUser(null);
            setProfileDisplayName(null);
            return;
          }
          throw result.error;
        }
        setUser(result.data.user);
        setProfileDisplayName(result.data.user?.user_metadata.display_name ?? null);
      } catch (error) {
        console.error("Gagal memuat sesi akun; melanjutkan sebagai guest.", error);
      }
    }
    void loadUser();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        setProfileDisplayName(session?.user?.user_metadata.display_name ?? null);
      },
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  // Load User Role and Subscription
  useEffect(() => {
    if (!user) {
      const frame = window.requestAnimationFrame(() => {
        setUserRole("user");
        setSubscription(createDefaultSubscription());
      });
      return () => window.cancelAnimationFrame(frame);
    }
    const userId = user.id;
    let cancelled = false;
    const supabase = getSupabaseBrowserClient();
    void loadUserRole(supabase, userId)
      .then((role) => {
        if (cancelled) return;
        setUserRole(role);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error("Gagal memuat role pengguna; menggunakan role default.", error);
          setUserRole("user");
        }
      });
    void loadUserSubscription(supabase, userId)
      .then((sub) => {
        if (!cancelled) setSubscription(sub);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error("Gagal memuat status langganan; menggunakan paket default.", error);
          setSubscription(createDefaultSubscription(userId));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Load Cloud Tasks
  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    let cancelled = false;
    async function loadCloudTasks() {
      try {
        const supabase = getSupabaseBrowserClient();
        const cloudTasks = await loadTasks(supabase, userId);
        if (!cancelled) setTasks(cloudTasks);
      } catch (error) {
        if (!cancelled) console.error("Gagal memuat task cloud; menggunakan task lokal.", error);
      }
    }
    void loadCloudTasks();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Derived Task info
  const completedTasks = useMemo(() => tasks.filter((task) => task.done).length, [tasks]);
  const activeTasksCount = useMemo(() => tasks.filter((task) => !task.done).length, [tasks]);
  const focusedTask = useMemo(
    () => resolveFocusedTask(tasks, selectedTaskId),
    [tasks, selectedTaskId],
  );
  const isPro = isProSubscription(subscription) || isAdminRole(userRole);
  const userName =
    profileDisplayName ??
    user?.user_metadata.full_name ??
    user?.user_metadata.name ??
    user?.email?.split("@")[0] ??
    "Account";
  const userAvatar = getSafeAvatarUrl(user?.user_metadata.avatar_url);

  // Ambient sound sync
  useEffect(() => {
    syncAmbientSound(ambientSound, running && mode === "pomodoro");
  }, [ambientSound, mode, running]);

  useEffect(() => () => stopAmbientSound(), []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const isTyping =
        ["INPUT", "TEXTAREA", "SELECT"].includes(active?.tagName ?? "") ||
        Boolean(active?.isContentEditable);
      if (event.key === "Escape") {
        setShowSettings(false);
        setLoginOpen(false);
        setShortcutsOpen(false);
        setZenMode(false);
      }
      if (isTyping) return;
      if (event.key === "?" || (event.shiftKey && event.key === "/")) setShortcutsOpen(true);
      if (event.ctrlKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        setShowSettings(true);
        return;
      }
      // Space / R / S shortcuts for timer (when not inside modals)
      if (notesOpen) return;
      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        setZenMode((z) => !z);
      }
      if (event.code === "Space") {
        event.preventDefault();
        if (running) {
          if (timerEndAtRef.current !== null) {
            setSeconds(getRemainingSeconds(timerEndAtRef.current));
          }
          timerEndAtRef.current = null;
          setRunning(false);
        } else {
          timerEndAtRef.current = getTimerEndTime(seconds);
          setRunning(true);
        }
      }
      if (event.key.toLowerCase() === "r") {
        timerEndAtRef.current = null;
        setRunning(false);
        setSeconds(timerDurations[mode]);
      }
      if (event.key.toLowerCase() === "s") {
        const nextMode = getNextTimerMode(mode, Math.max(1, completedPomodoros), longBreakInterval);
        setMode(nextMode);
        timerEndAtRef.current = null;
        setSeconds(timerDurations[nextMode]);
        setRunning(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [completedPomodoros, longBreakInterval, mode, notesOpen, running, seconds, timerDurations]);

  // Initial Local Storage Hydration
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTasks(loadLocalTasks());
      const localSettings = loadLocalSettings();
      setSelectedColor(localSettings.selectedColor);
      setAutoStart(localSettings.autoStart);
      setSoundEnabled(localSettings.soundEnabled);
      setNotificationsEnabled(localSettings.notificationsEnabled);
      setTimerDurations(localSettings.timerDurations);
      setRepeatAlarm(localSettings.repeatAlarm);
      setAlarmSound(localSettings.alarmSound);
      setLongBreakInterval(localSettings.longBreakInterval);
      setDailyGoalPomodoros(localSettings.dailyGoalPomodoros);
      setTickingSoundEnabled(localSettings.tickingSoundEnabled);
      settingsHydratedRef.current = true;
      setTasksHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  // Save Local Tasks
  useEffect(() => {
    if (!tasksHydrated || user) return;
    window.localStorage.setItem("biarfokus.tasks", JSON.stringify(tasks));
  }, [tasks, tasksHydrated, user]);

  // Save Settings
  useEffect(() => {
    if (!settingsHydratedRef.current) return;
    const settings: UserSettings = {
      selectedColor,
      autoStart,
      soundEnabled,
      notificationsEnabled,
      timerDurations,
      repeatAlarm,
      alarmSound,
      longBreakInterval,
      dailyGoalPomodoros,
      tickingSoundEnabled,
    };
    saveLocalSettings(settings);
    if (user && settingsOwnerRef.current !== user.id) return;
    if (user) {
      void saveUserSettings(getSupabaseBrowserClient(), user.id, settings).catch((error: unknown) =>
        setAppError(
          error instanceof Error
            ? `Pengaturan gagal disimpan: ${error.message}`
            : "Pengaturan gagal disimpan.",
        ),
      );
    }
  }, [
    alarmSound,
    autoStart,
    dailyGoalPomodoros,
    longBreakInterval,
    notificationsEnabled,
    repeatAlarm,
    selectedColor,
    soundEnabled,
    tickingSoundEnabled,
    timerDurations,
    user,
  ]);

  // Load Cloud Settings
  useEffect(() => {
    if (!user) {
      settingsOwnerRef.current = null;
      return;
    }
    let cancelled = false;
    void loadUserSettings(getSupabaseBrowserClient(), user.id)
      .then((settings) => {
        if (cancelled) return;
        setSelectedColor(settings.selectedColor);
        setAutoStart(settings.autoStart);
        setSoundEnabled(settings.soundEnabled);
        setNotificationsEnabled(settings.notificationsEnabled);
        setTimerDurations(settings.timerDurations);
        setRepeatAlarm(settings.repeatAlarm);
        setAlarmSound(settings.alarmSound);
        setLongBreakInterval(settings.longBreakInterval);
        setDailyGoalPomodoros(settings.dailyGoalPomodoros);
        setTickingSoundEnabled(settings.tickingSoundEnabled);
        settingsOwnerRef.current = user.id;
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error("Gagal memuat pengaturan cloud; menggunakan settings lokal.", error);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Timer Tick Interval
  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      const endAt = timerEndAtRef.current;
      if (endAt === null) return;
      const remaining = getRemainingSeconds(endAt);
      if (remaining > 0) {
        setSeconds(remaining);
        if (
          tickingSoundEnabled &&
          mode === "pomodoro" &&
          lastTickedSecondRef.current !== remaining
        ) {
          lastTickedSecondRef.current = remaining;
          playTickSound();
        }
        return;
      }

      timerEndAtRef.current = null;
      lastTickedSecondRef.current = null;
      setRunning(false);
      const nextCompleted = mode === "pomodoro" ? completedPomodoros + 1 : completedPomodoros;
      if (mode === "pomodoro") {
        setCompletedPomodoros(nextCompleted);
      }
      if (soundEnabled) playAlarmSound(alarmSound, repeatAlarm);
      if (
        notificationsEnabled &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        const taskContext = mode === "pomodoro" && focusedTask ? ` (${focusedTask.title})` : "";
        new Notification("BiarFokus", {
          body: `${modeLabels[mode]}${taskContext} selesai. Waktunya ganti sesi.`,
        });
      }
      if (mode === "pomodoro" && focusedTask) {
        const nextPomodoros = Math.min(999, focusedTask.pomodoros + 1);
        setTasks((current) =>
          current.map((item) =>
            item.id === focusedTask.id ? { ...item, pomodoros: nextPomodoros } : item,
          ),
        );
        if (user) {
          void updateTaskPomodoros(
            getSupabaseBrowserClient(),
            user.id,
            focusedTask.id,
            nextPomodoros,
          ).catch((error: unknown) =>
            console.error("Gagal memperbarui jumlah pomodoro task:", error),
          );
        }
      }
      if (user) {
        void recordCompletedSession(
          getSupabaseBrowserClient(),
          user.id,
          mode,
          timerDurations[mode],
          focusedTask?.id,
        ).catch((error: unknown) =>
          setAppError(
            error instanceof Error
              ? `Sesi selesai, tetapi gagal disimpan: ${error.message}`
              : "Sesi selesai, tetapi gagal disimpan.",
          ),
        );
      }
      const nextMode = getNextTimerMode(mode, nextCompleted, longBreakInterval);
      const nextSeconds = timerDurations[autoStart ? nextMode : mode];
      setMode(autoStart ? nextMode : mode);
      setSeconds(nextSeconds);
      if (autoStart) {
        timerEndAtRef.current = getTimerEndTime(nextSeconds);
        setRunning(true);
      }
    }, 250);
    return () => window.clearInterval(interval);
  }, [
    alarmSound,
    autoStart,
    completedPomodoros,
    focusedTask,
    longBreakInterval,
    mode,
    notificationsEnabled,
    repeatAlarm,
    running,
    soundEnabled,
    tickingSoundEnabled,
    timerDurations,
    user,
  ]);

  // Timer actions
  const changeMode = useCallback(
    (nextMode: TimerMode) => {
      timerEndAtRef.current = null;
      setMode(nextMode);
      setSeconds(timerDurations[nextMode]);
      setRunning(false);
    },
    [timerDurations],
  );

  const resetTimer = useCallback(() => {
    timerEndAtRef.current = null;
    setRunning(false);
    setSeconds(timerDurations[mode]);
  }, [mode, timerDurations]);

  const skipSession = useCallback(() => {
    const nextMode = getNextTimerMode(mode, Math.max(1, completedPomodoros), longBreakInterval);
    timerEndAtRef.current = null;
    setMode(nextMode);
    setSeconds(timerDurations[nextMode]);
    setRunning(false);
  }, [completedPomodoros, longBreakInterval, mode, timerDurations]);

  const toggleRunning = useCallback(() => {
    if (running) {
      if (timerEndAtRef.current !== null) {
        setSeconds(getRemainingSeconds(timerEndAtRef.current));
      }
      timerEndAtRef.current = null;
      setRunning(false);
      return;
    }
    if (soundEnabled) {
      playClickSound();
    }
    timerEndAtRef.current = getTimerEndTime(seconds);
    setRunning(true);
  }, [running, seconds, soundEnabled]);

  // Task actions
  const addTask = useCallback(
    async (title: string, linkedMeta?: LinkedNoteMeta) => {
      assertTaskLimitAllowed(activeTasksCount, isPro);
      if (user) {
        try {
          const task = await createTask(getSupabaseBrowserClient(), user.id, title, linkedMeta);
          setTasks((current) => [...current, task]);
          // do not auto-select
          return;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Gagal menyimpan task.";
          throw new Error(message);
        }
      }
      const localTask: Task = {
        id: crypto.randomUUID(),
        title,
        done: false,
        pomodoros: 1,
        ...linkedMeta,
      };
      if (linkedMeta) {
        saveTaskLink(localTask.id, linkedMeta);
      }
      setTasks((current) => [...current, localTask]);
      // do not auto-select
    },
    [activeTasksCount, isPro, user],
  );

  // Two-way sync: Note item toggle
  useEffect(() => {
    function handleNoteItemToggled(event: Event) {
      const customEvent = event as CustomEvent<{
        noteId: string;
        itemId: string;
        done?: boolean;
        source?: string;
      }>;
      if (!customEvent.detail) return;
      if (customEvent.detail.source === "eat-your-frog") return;
      const { noteId, itemId, done } = customEvent.detail;
      setTasks((prevTasks) => {
        const taskLinks = loadTaskLinks();
        const matching = prevTasks.find(
          (t) =>
            (t.linkedNoteId === noteId && t.linkedItemId === itemId) ||
            (taskLinks[t.id]?.linkedNoteId === noteId && taskLinks[t.id]?.linkedItemId === itemId),
        );
        if (!matching) return prevTasks;
        const newDone = typeof done === "boolean" ? done : !matching.done;
        if (matching.done === newDone) return prevTasks;
        if (user) {
          void setTaskCompleted(getSupabaseBrowserClient(), user.id, matching.id, newDone).catch(
            () => {},
          );
        }
        return prevTasks.map((t) => (t.id === matching.id ? { ...t, done: newDone } : t));
      });
    }
    window.addEventListener("biarfokus:note-item-toggled", handleNoteItemToggled);
    return () => window.removeEventListener("biarfokus:note-item-toggled", handleNoteItemToggled);
  }, [user]);

  useEffect(() => {
    function handleAddFromNote(event: Event) {
      const customEvent = event as CustomEvent<{
        title: string;
        linkedNoteId: string;
        linkedNoteTitle: string;
        linkedItemId?: string;
        linkedItemText?: string;
      }>;
      if (!customEvent.detail) return;
      void addTask(customEvent.detail.title, {
        linkedNoteId: customEvent.detail.linkedNoteId,
        linkedNoteTitle: customEvent.detail.linkedNoteTitle,
        linkedItemId: customEvent.detail.linkedItemId,
        linkedItemText: customEvent.detail.linkedItemText,
      });
      setInfoOpen(`Tugas "${customEvent.detail.title}" berhasil dijadikan target Eat Your Frog!`);
    }
    window.addEventListener("biarfokus:add-task-from-note", handleAddFromNote);
    return () => window.removeEventListener("biarfokus:add-task-from-note", handleAddFromNote);
  }, [addTask]);

  const toggleTask = useCallback(
    async (task: Task) => {
      const completed = !task.done;
      if (user) {
        try {
          await setTaskCompleted(getSupabaseBrowserClient(), user.id, task.id, completed);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Gagal memperbarui task.";
          throw new Error(message);
        }
      }
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? { ...item, done: completed } : item)),
      );

      let targetNoteId = task.linkedNoteId;
      let targetItemId = task.linkedItemId;

      if (!targetNoteId || !targetItemId) {
        const taskLinks = loadTaskLinks();
        const meta = taskLinks[task.id];
        if (meta?.linkedNoteId && meta?.linkedItemId) {
          targetNoteId = meta.linkedNoteId;
          targetItemId = meta.linkedItemId;
        }
      }

      if (!targetNoteId || !targetItemId) {
        for (const n of notes) {
          if (targetNoteId && n.id !== targetNoteId) continue;
          const matchingItem = n.items?.find((i) => i.text.trim() === task.title.trim());
          if (matchingItem) {
            targetNoteId = n.id;
            targetItemId = matchingItem.id;
            saveTaskLink(task.id, {
              linkedNoteId: n.id,
              linkedNoteTitle: n.title || "(Catatan)",
              linkedItemId: matchingItem.id,
              linkedItemText: matchingItem.text,
            });
            break;
          }
        }
      }

      if (targetNoteId && targetItemId) {
        setItemDone(targetNoteId, targetItemId, completed);
      }
    },
    [notes, setItemDone, user],
  );

  const deleteTask = useCallback(
    async (task: Task) => {
      if (user) {
        try {
          await deleteTaskById(getSupabaseBrowserClient(), user.id, task.id);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Gagal menghapus task.";
          throw new Error(message);
        }
      }
      setTasks((current) => current.filter((item) => item.id !== task.id));
    },
    [user],
  );

  const deleteCompletedTasks = useCallback(async () => {
    const completedTaskIds = tasks.filter((task) => task.done).map((task) => task.id);
    if (!completedTaskIds.length) return;
    try {
      if (user) {
        await deleteTasksByIds(getSupabaseBrowserClient(), user.id, completedTaskIds);
      }
      setTasks((current) => current.filter((task) => !task.done));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Gagal menghapus task selesai.");
    }
  }, [tasks, user]);

  const deleteAllTasks = useCallback(async () => {
    try {
      if (user) {
        await deleteAllCloudTasks(getSupabaseBrowserClient(), user.id);
      }
      setTasks([]);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Gagal menghapus semua task.");
    }
  }, [user]);

    const reorderTasks = useCallback(
    (sourceIndex: number, destinationIndex: number) => {
      setTasks((current) => {
        const active = current.filter((t) => !t.done);
        const done = current.filter((t) => t.done);
        if (
          sourceIndex < 0 ||
          sourceIndex >= active.length ||
          destinationIndex < 0 ||
          destinationIndex >= active.length ||
          sourceIndex === destinationIndex
        ) {
          return current;
        }
        const reorderedActive = [...active];
        const [moved] = reorderedActive.splice(sourceIndex, 1);
        reorderedActive.splice(destinationIndex, 0, moved);
        const nextTasks = [...reorderedActive, ...done];

        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem("biarfokus.tasks", JSON.stringify(nextTasks));
            if (user) {
              window.localStorage.setItem(
                `biarfokus.tasks.order.${user.id}`,
                JSON.stringify(nextTasks.map((t) => t.id)),
              );
            }
          } catch {}
        }
        return nextTasks;
      });
    },
    [user],
  );

  const handleDeleteAccount = useCallback(async () => {
    if (deletingAccount || !user) return;
    setDeletingAccount(true);
    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Gagal menghapus akun.");
      }
      await getSupabaseBrowserClient().auth.signOut();
      setUser(null);
      setProfileDisplayName(null);
      setDeleteConfirmOpen(false);
      setTasks(initialTasks);
      window.localStorage.removeItem("biarfokus.tasks");
      setInfoOpen(
        "Akun dan semua data kamu telah berhasil dihapus. Terima kasih telah menggunakan BiarFokus.",
      );
    } catch (error) {
      setAppError(error instanceof Error ? error.message : "Gagal menghapus akun.");
    } finally {
      setDeletingAccount(false);
    }
  }, [deletingAccount, user]);

  const handleLogout = useCallback(async () => {
    try {
      await getSupabaseBrowserClient().auth.signOut();
      setUser(null);
      setProfileDisplayName(null);
      setAccountOpen(false);
      setInfoOpen("Kamu telah berhasil keluar dari akun.");
    } catch (error) {
      setAppError(error instanceof Error ? error.message : "Gagal logout.");
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      userRole,
      subscription,
      isPro,
      userName,
      userAvatar,
      profileDisplayName,
      setProfileDisplayName,
      loginOpen,
      setLoginOpen,
      authMode,
      setAuthMode,
      accountOpen,
      setAccountOpen,
      deleteConfirmOpen,
      setDeleteConfirmOpen,
      deletingAccount,
      handleDeleteAccount,
      handleLogout,
      authError,
      setAuthError,
      appError,
      setAppError,

      dark,
      setDark,
      selectedColor,
      setSelectedColor,
      showSettings,
      setShowSettings,
      soundEnabled,
      setSoundEnabled,
      autoStart,
      setAutoStart,
      notificationsEnabled,
      setNotificationsEnabled,
      timerDurations,
      setTimerDurations,
      repeatAlarm,
      setRepeatAlarm,
      alarmSound,
      setAlarmSound,
      longBreakInterval,
      setLongBreakInterval,
      dailyGoalPomodoros,
      setDailyGoalPomodoros,
      tickingSoundEnabled,
      setTickingSoundEnabled,

      mode,
      setMode,
      seconds,
      setSeconds,
      running,
      setRunning,
      completedPomodoros,
      setCompletedPomodoros,
      selectedTaskId,
      setSelectedTaskId,
      focusedTask,
      ambientSound,
      setAmbientSound,
      changeMode,
      toggleRunning,
      resetTimer,
      skipSession,
      zenMode,
      setZenMode,

      tasks,
      tasksHydrated,
      activeTasksCount,
      completedTasks,
      addTask,
      toggleTask,
      reorderTasks,
      deleteTask,
      deleteCompletedTasks,
      deleteAllTasks,

      notes,
      setItemDone,

      shortcutsOpen,
      setShortcutsOpen,
      infoOpen,
      setInfoOpen,
      aboutModalOpen,
      setAboutModalOpen,
      pomodoroModalOpen,
      setPomodoroModalOpen,
      termsModalOpen,
      setTermsModalOpen,
      faqModalOpen,
      setFaqModalOpen,
      notesOpen,
      setNotesOpen,
      menuOpen,
      setMenuOpen,

      colorThemes,
      modeLabels,
    }),
    [
      aboutModalOpen,
      accountOpen,
      activeTasksCount,
      addTask,
      alarmSound,
      ambientSound,
      appError,
      authError,
      authMode,
      autoStart,
      changeMode,
      completedPomodoros,
      completedTasks,
      faqModalOpen,
      termsModalOpen,
      dailyGoalPomodoros,
      dark,
      deleteAllTasks,
      deleteCompletedTasks,
      deleteConfirmOpen,
      deleteTask,
      deletingAccount,
      focusedTask,
      handleDeleteAccount,
      handleLogout,
      infoOpen,
      isPro,
      loginOpen,
      longBreakInterval,
      menuOpen,
      mode,
      notes,
      notesOpen,
      notificationsEnabled,
      pomodoroModalOpen,
      profileDisplayName,
      repeatAlarm,
      resetTimer,
      running,
      seconds,
      selectedColor,
      selectedTaskId,
      setItemDone,
      shortcutsOpen,
      showSettings,
      skipSession,
      soundEnabled,
      subscription,
      tasks,
      tasksHydrated,
      tickingSoundEnabled,
      timerDurations,
      toggleRunning,
      toggleTask,
      user,
      userAvatar,
      userName,
      userRole,
      zenMode,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
