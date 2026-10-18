"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { getSafeAvatarUrl } from "@/features/profile/profile-service";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { TaskManagement } from "@/app/components/task-management";
import { TimerPanel } from "@/app/components/timer-panel";
import { AccountModal } from "@/app/components/account-modal";
import { ProfileMenu } from "@/app/components/profile-menu";
import { AuthModal as AuthModalComponent } from "@/app/components/auth-modal";
import { SettingsModal as SettingsModalComponent } from "@/app/components/settings-modal";
import { ShortcutsModal as ShortcutsModalComponent } from "@/app/components/shortcuts-modal";
import { StatsView } from "@/app/components/stats-view";
import { AdminView } from "@/app/components/admin-view";
import { PricingView } from "@/app/components/pricing-view";
import { NotesModal } from "@/app/components/notes-modal";
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
import type { AmbientSoundMode, Task, TimerDurations, TimerMode, UserRole, UserSubscription } from "@/types/domain";
import { AMBIENT_SOUND_OPTIONS, stopAmbientSound, syncAmbientSound } from "@/features/audio/ambient-sound";
import { playAlarmSound, type AlarmSoundType } from "@/features/audio/alarm-sound";
import {
  createTask,
  deleteAllTasks as deleteAllCloudTasks,
  deleteTaskById,
  deleteTasksByIds,
  initialTasks,
  loadLocalTasks,
  loadTasks,
  recordCompletedSession,
  resolveFocusedTask,
  setTaskCompleted,
  updateTaskPomodoros,
} from "@/features/tasks/task-service";
import {
  formatTime,
  getCycleProgress,
  getNextTimerMode,
  getRemainingSeconds,
  getTimerEndTime,
} from "@/features/timer/timer-utils";

type View = "timer" | "stats" | "pricing" | "admin";
const durations: Record<TimerMode, number> = {
  pomodoro: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const modeLabels: Record<TimerMode, string> = {
  pomodoro: "Pomodoro",
  short: "Short Break",
  long: "Long Break",
};

const colorThemes = [
  { color: "#e8e8e8", name: "Cloud" },
  { color: "#f77fa5", name: "Rose" },
  { color: "#a9d63b", name: "Lime" },
  { color: "#1976df", name: "Ocean" },
  { color: "#ffc247", name: "Sun" },
  { color: "#f7c928", name: "Focus" },
];

function playClickSound() {
  const AudioContextClass = window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 520;
  oscillator.type = "sine";
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.035, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.08);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.08);
  window.setTimeout(() => void context.close(), 150);
}

export default function Home() {
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [seconds, setSeconds] = useState(durations.pomodoro);
  const [running, setRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [ambientSound, setAmbientSound] = useState<AmbientSoundMode>("off");
  const [dark, setDark] = useState(false);
  const [activeView, setActiveView] = useState<View>("timer");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [tasksHydrated, setTasksHydrated] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState<string | null>(null);
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
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>("user");
  const [subscription, setSubscription] = useState<UserSubscription>(() => createDefaultSubscription());
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [appError, setAppError] = useState<string | null>(null);
  const timerEndAtRef = useRef<number | null>(null);
  const lastTickedSecondRef = useRef<number | null>(null);
  const settingsHydratedRef = useRef(false);
  const settingsOwnerRef = useRef<string | null>(null);

  function getOperationError(error: unknown, fallback: string) {
    if (error instanceof Error) return error.message;
    if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
      return error.message;
    }
    return fallback;
  }

  useEffect(() => {
    const title = mode === "pomodoro" ? "Time to focus!" : "Time for a break!";
    document.title = `${formatTime(seconds)} - ${title}`;
  }, [mode, seconds]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("auth_error");
    const billing = params.get("billing");
    if (!error && !billing) return;
    const frame = window.requestAnimationFrame(() => {
      if (error) setAuthError(error);
      if (billing === "success") {
        setActiveView("pricing");
        setInfoOpen("Pembayaran berhasil diproses! Langganan Pro kamu sedang diaktifkan.");
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

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
          if (result.error.name === "AuthSessionMissingError" || result.error.message.includes("Auth session missing")) {
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
    const { data: listener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      setProfileDisplayName(session?.user?.user_metadata.display_name ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      const frame = window.requestAnimationFrame(() => {
        setUserRole("user");
        setSubscription(createDefaultSubscription());
        setActiveView((current) => (current === "admin" ? "timer" : current));
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
        if (!isAdminRole(role)) {
          setActiveView((current) => (current === "admin" ? "timer" : current));
        }
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
    return () => { cancelled = true; };
  }, [user]);

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
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    const handleClick = () => {
      if (soundEnabled) playClickSound();
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [soundEnabled]);

  const completedTasks = useMemo(() => tasks.filter((task) => task.done).length, [tasks]);
  const activeTasksCount = useMemo(() => tasks.filter((task) => !task.done).length, [tasks]);
  const focusedTask = useMemo(() => resolveFocusedTask(tasks, selectedTaskId), [tasks, selectedTaskId]);
  const isPro = isProSubscription(subscription) || isAdminRole(userRole);
  const userName = profileDisplayName ?? user?.user_metadata.full_name ?? user?.user_metadata.name ?? user?.email?.split("@")[0] ?? "Account";
  const userAvatar = getSafeAvatarUrl(user?.user_metadata.avatar_url);

  useEffect(() => {
    syncAmbientSound(ambientSound, running && mode === "pomodoro");
  }, [ambientSound, mode, running]);

  useEffect(() => () => stopAmbientSound(), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName ?? "");
      if (event.key === "Escape") {
        setShowSettings(false);
        setLoginOpen(false);
        setShortcutsOpen(false);
        setZenMode(false);
      }
      if (isTyping) return;
      if (event.key === "?" || (event.shiftKey && event.key === "/")) setShortcutsOpen(true);
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
      if (event.ctrlKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        setShowSettings(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [completedPomodoros, longBreakInterval, mode, running, seconds, timerDurations]);

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

  useEffect(() => {
    if (!tasksHydrated || user) return;
    window.localStorage.setItem("biarfokus.tasks", JSON.stringify(tasks));
  }, [tasks, tasksHydrated, user]);

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
      void saveUserSettings(getSupabaseBrowserClient(), user.id, settings)
        .catch((error: unknown) => setAppError(error instanceof Error ? `Pengaturan gagal disimpan: ${error.message}` : "Pengaturan gagal disimpan."));
    }
  }, [alarmSound, autoStart, dailyGoalPomodoros, longBreakInterval, notificationsEnabled, repeatAlarm, selectedColor, soundEnabled, tickingSoundEnabled, timerDurations, user]);

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
          const message = getOperationError(error, "Gagal memuat pengaturan.");
          console.error("Gagal memuat pengaturan cloud; menggunakan settings lokal.", error);
          if (message.includes("settings") || message.includes("column")) console.warn("Jalankan migration 20261016220000_add_profile_settings.sql di Supabase SQL Editor.");
        }
      });
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      const endAt = timerEndAtRef.current;
      if (endAt === null) return;
      const remaining = getRemainingSeconds(endAt);
      if (remaining > 0) {
        setSeconds(remaining);
        if (tickingSoundEnabled && mode === "pomodoro" && lastTickedSecondRef.current !== remaining) {
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
      if (notificationsEnabled && typeof Notification !== "undefined" && Notification.permission === "granted") {
        const taskContext = mode === "pomodoro" && focusedTask ? ` (${focusedTask.title})` : "";
        new Notification("BiarFokus", { body: `${modeLabels[mode]}${taskContext} selesai. Waktunya ganti sesi.` });
      }
      if (mode === "pomodoro" && focusedTask) {
        const nextPomodoros = Math.min(999, focusedTask.pomodoros + 1);
        setTasks((current) =>
          current.map((item) => (item.id === focusedTask.id ? { ...item, pomodoros: nextPomodoros } : item)),
        );
        if (user) {
          void updateTaskPomodoros(getSupabaseBrowserClient(), user.id, focusedTask.id, nextPomodoros)
            .catch((error: unknown) => console.error("Gagal memperbarui jumlah pomodoro task:", error));
        }
      }
      if (user) {
        void recordCompletedSession(getSupabaseBrowserClient(), user.id, mode, timerDurations[mode], focusedTask?.id)
          .catch((error: unknown) => setAppError(error instanceof Error ? `Sesi selesai, tetapi gagal disimpan: ${error.message}` : "Sesi selesai, tetapi gagal disimpan."));
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
  }, [alarmSound, autoStart, completedPomodoros, focusedTask, longBreakInterval, mode, notificationsEnabled, repeatAlarm, running, soundEnabled, tickingSoundEnabled, timerDurations, user]);

  function changeMode(nextMode: TimerMode) {
    timerEndAtRef.current = null;
    setMode(nextMode);
    setSeconds(timerDurations[nextMode]);
    setRunning(false);
  }

  function resetTimer() {
    timerEndAtRef.current = null;
    setRunning(false);
    setSeconds(timerDurations[mode]);
  }

  function skipSession() {
    const nextMode = getNextTimerMode(mode, Math.max(1, completedPomodoros), longBreakInterval);
    timerEndAtRef.current = null;
    setMode(nextMode);
    setSeconds(timerDurations[nextMode]);
    setRunning(false);
  }

  function toggleRunning() {
    if (running) {
      if (timerEndAtRef.current !== null) {
        setSeconds(getRemainingSeconds(timerEndAtRef.current));
      }
      timerEndAtRef.current = null;
      setRunning(false);
      return;
    }
    timerEndAtRef.current = getTimerEndTime(seconds);
    setRunning(true);
  }

  async function addTask(title: string) {
    assertTaskLimitAllowed(activeTasksCount, isPro);
    if (user) {
      try {
        const task = await createTask(getSupabaseBrowserClient(), user.id, title);
        setTasks((current) => [...current, task]);
        setSelectedTaskId((current) => current ?? task.id);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal menyimpan task.";
        throw new Error(message);
      }
    }
    const localTask: Task = { id: crypto.randomUUID(), title, done: false, pomodoros: 1 };
    setTasks((current) => [...current, localTask]);
    setSelectedTaskId((current) => current ?? localTask.id);
  }

  async function toggleTask(task: Task) {
    const completed = !task.done;
    if (user) {
      try {
        await setTaskCompleted(getSupabaseBrowserClient(), user.id, task.id, completed);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal memperbarui task.";
        throw new Error(message);
      }
    }
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, done: completed } : item));
  }

  async function deleteTask(task: Task) {
    if (user) {
      try {
        await deleteTaskById(getSupabaseBrowserClient(), user.id, task.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal menghapus task.";
        throw new Error(message);
      }
    }
    setTasks((current) => current.filter((item) => item.id !== task.id));
  }

  async function deleteCompletedTasks() {
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
  }

  async function deleteAllTasks() {
    try {
      if (user) {
        await deleteAllCloudTasks(getSupabaseBrowserClient(), user.id);
      }
      setTasks([]);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Gagal menghapus semua task.");
    }
  }

  async function handleDeleteAccount() {
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
      setInfoOpen("Akun dan semua data kamu telah berhasil dihapus. Terima kasih telah menggunakan BiarFokus.");
    } catch (error) {
      setAppError(error instanceof Error ? error.message : "Gagal menghapus akun.");
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
    <main
      className={dark ? "app dark" : "app"}
      style={{
        "--accent": selectedColor,
        "--page": dark ? "#111111" : selectedColor,
        "--ink": dark ? "#f5f5f5" : "#111111",
        "--muted": dark ? "#a9a9a9" : "#777777",
        "--paper": dark ? "#1d1d1d" : "#ffffff",
      } as CSSProperties}
    >
      <header className="topbar">
        <button className="brand" onClick={() => setActiveView("timer")} aria-label="Kembali ke timer">
          <span className="brand-mark" aria-hidden="true" />
          <span>biarfokus</span>
        </button>
        <nav className="desktop-nav" aria-label="Navigasi utama">
          {(["timer", "stats", "pricing"] as View[]).map((view) => (
            <button key={view} className={activeView === view ? "nav-link active" : "nav-link"} onClick={() => setActiveView(view)}>
              {view === "timer" ? "Timer" : view === "stats" ? "Statistik" : view === "pricing" ? "Pro" : "Admin"}
            </button>
          ))}
        </nav>
        <div className="top-actions">
          <button className="icon-button" onClick={() => setDark(!dark)} aria-label="Ganti tema">{dark ? "☀" : "☾"}</button>
          <button className="icon-button shortcut-button" onClick={() => setShortcutsOpen(true)} aria-label="Keyboard shortcuts">?</button>
          <button className="settings-button" onClick={() => setShowSettings(true)}>⚙ <span>Settings</span></button>
          {user ? (
            <div className="profile-area">
              <button className="profile-button" onClick={() => setProfileMenuOpen((open) => !open)} aria-label="Buka menu akun" aria-expanded={profileMenuOpen}>
                {userAvatar ? <Image src={userAvatar} alt="" width={42} height={42} unoptimized /> : <span>{userName.charAt(0).toUpperCase()}</span>}
              </button>
              {profileMenuOpen && <ProfileMenu
                userName={userName}
                isAdmin={isAdminRole(userRole)}
                onAccount={() => { setAccountOpen(true); setProfileMenuOpen(false); }}
                onPremium={() => { setActiveView("pricing"); setProfileMenuOpen(false); }}
                onAdmin={() => { setActiveView("admin"); setProfileMenuOpen(false); }}
                onShortcuts={() => { setShortcutsOpen(true); setProfileMenuOpen(false); }}
                onSignOut={() => {
                  setProfileMenuOpen(false);
                  void getSupabaseBrowserClient().auth.signOut().then((result: { error: { message: string } | null }) => {
                    if (result.error) setAppError(result.error.message);
                  });
                }}
                onDelete={() => { setProfileMenuOpen(false); setDeleteConfirmOpen(true); }}
              />}
            </div>
          ) : <button className="login-button" onClick={() => setLoginOpen(true)}>🔐 Sign In</button>}
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Buka menu" aria-expanded={menuOpen}>☰</button>
        </div>
      </header>
      {menuOpen && <nav className="mobile-nav" aria-label="Navigasi mobile">
        {(["timer", "stats", "pricing"] as View[]).map((view) => (
          <button key={view} className={activeView === view ? "nav-link active" : "nav-link"} onClick={() => { setActiveView(view); setMenuOpen(false); }}>
            {view === "timer" ? "Timer" : view === "stats" ? "Statistik" : view === "pricing" ? "Pro" : "Admin"}
          </button>
        ))}
        {!user && <button className="mobile-login-button" onClick={() => { setLoginOpen(true); setMenuOpen(false); }}>🔐 Sign In</button>}
      </nav>}

      {activeView === "timer" && (
        <div className="content-grid">
          <TimerPanel
            mode={mode}
            seconds={seconds}
            running={running}
            completedPomodoros={completedPomodoros}
            focusedTask={focusedTask}
            ambientSound={ambientSound}
            selectedColor={selectedColor}
            colorThemes={colorThemes}
            modeLabels={modeLabels}
            longBreakInterval={longBreakInterval}
            dailyGoalPomodoros={dailyGoalPomodoros}
            onModeChange={changeMode}
            onToggleRunning={toggleRunning}
            onReset={resetTimer}
            onSkip={skipSession}
            onToggleZen={() => setZenMode(true)}
            onAmbientSoundChange={setAmbientSound}
            onColorChange={setSelectedColor}
          />

          <TaskManagement
            tasks={tasks}
            focusedTaskId={focusedTask?.id ?? null}
            onSelectTask={setSelectedTaskId}
            onAdd={addTask}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onDeleteCompleted={deleteCompletedTasks}
            onDeleteAll={deleteAllTasks}
          />
        </div>
      )}

      {activeView === "stats" && <StatsView key={user?.id ?? "guest"} supabase={getSupabaseBrowserClient()} userId={user?.id ?? null} completedTasks={completedTasks} />}
      {activeView === "pricing" && (
        <PricingView
          userId={user?.id ?? null}
          subscription={subscription}
          isPro={isPro}
          activeTaskCount={activeTasksCount}
          onRequireSignIn={() => setLoginOpen(true)}
          onGoTimer={() => {
            setActiveView("timer");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
      {activeView === "admin" && <AdminView userId={user?.id ?? null} isAdmin={isAdminRole(userRole)} />}

      <footer className="footer">
        <div><strong>BiarFokus</strong><span>Bantu kamu fokus selesain setiap pekerjaan.</span></div>
        <div className="footer-links">
          <button onClick={() => setActiveView("timer")}>Main App</button>
          <button onClick={() => setInfoOpen("Pomodoro membagi waktu kerja menjadi interval fokus dan istirahat agar kamu bisa bekerja dengan ritme yang konsisten.")}>Apa itu Pomodoro?</button>
          <button onClick={() => setInfoOpen("BiarFokus dibuat untuk membantu kamu menyelesaikan pekerjaan dengan lebih tenang dan terarah.")}>Tentang Kami</button>
          <a
            href="https://www.instagram.com/biarfokus.id/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-link"
          >
            📸 Instagram @biarfokus.id
          </a>
        </div>
        <small>© 2025 biarfokus - All rights reserved</small>
      </footer>

      {/* Floating Action Buttons */}
      <button
        className="notes-fab"
        onClick={() => setNotesOpen(true)}
        aria-label="Catatan Fokus"
        title="Buka Catatan Fokus (Keep)"
      >
        ✏️
      </button>
      <button className="settings-fab" onClick={() => setShowSettings(true)} aria-label="Pengaturan">⚙</button>

      {notesOpen && (
        <NotesModal
          userId={user?.id ?? null}
          onClose={() => setNotesOpen(false)}
        />
      )}
      {showSettings && <SettingsModalComponent
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        autoStart={autoStart}
        setAutoStart={setAutoStart}
        dark={dark}
        setDark={setDark}
        notificationsEnabled={notificationsEnabled}
        setNotificationsEnabled={setNotificationsEnabled}
        repeatAlarm={repeatAlarm}
        setRepeatAlarm={setRepeatAlarm}
        alarmSound={alarmSound}
        setAlarmSound={setAlarmSound}
        longBreakInterval={longBreakInterval}
        setLongBreakInterval={setLongBreakInterval}
        dailyGoalPomodoros={dailyGoalPomodoros}
        setDailyGoalPomodoros={setDailyGoalPomodoros}
        tickingSoundEnabled={tickingSoundEnabled}
        setTickingSoundEnabled={setTickingSoundEnabled}
        timerDurations={timerDurations}
        setTimerDurations={(nextDurations) => {
          setTimerDurations(nextDurations);
          setSeconds(nextDurations[mode]);
          setRunning(false);
        }}
        onClose={() => setShowSettings(false)}
      />}
      {loginOpen && <AuthModalComponent mode={authMode} setMode={setAuthMode} onClose={() => setLoginOpen(false)} />}
      {accountOpen && <AccountModal user={user} userName={userName} supabase={getSupabaseBrowserClient()} onSaved={setProfileDisplayName} onClose={() => setAccountOpen(false)} />}
      {deleteConfirmOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => { if (!deletingAccount) setDeleteConfirmOpen(false); }}>
          <section className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setDeleteConfirmOpen(false)}
              aria-label="Tutup konfirmasi"
              disabled={deletingAccount}
            >
              ×
            </button>
            <h2>Hapus Akun Permanen?</h2>
            <p className="modal-copy">
              Semua task, riwayat sesi fokus, dan pengaturan akun kamu akan dihapus secara permanen dan tidak dapat dipulihkan kembali.
            </p>
            <div className="task-confirm-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deletingAccount}
              >
                Batal
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => void handleDeleteAccount()}
                disabled={deletingAccount}
              >
                {deletingAccount ? "Menghapus..." : "Ya, Hapus Akun"}
              </button>
            </div>
          </section>
        </div>
      )}
      {authError && <div className="modal-backdrop" role="presentation" onClick={() => setAuthError(null)}><section className="modal" role="alertdialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setAuthError(null)} aria-label="Tutup error">×</button><h2>Login gagal</h2><p className="modal-copy">{authError}</p><button className="secondary-button" onClick={() => setAuthError(null)}>Tutup</button></section></div>}
      {appError && <div className="modal-backdrop" role="presentation" onClick={() => setAppError(null)}><section className="modal" role="alertdialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setAppError(null)} aria-label="Tutup error">×</button><h2>Terjadi kesalahan</h2><p className="modal-copy">{appError}</p><button className="secondary-button" onClick={() => setAppError(null)}>Tutup</button></section></div>}
      {infoOpen && <div className="modal-backdrop" role="presentation" onClick={() => setInfoOpen(null)}><section className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setInfoOpen(null)} aria-label="Tutup">×</button><h2>Fokus dengan ritme yang tepat</h2><p className="modal-copy">{infoOpen}</p><button className="secondary-button" onClick={() => setInfoOpen(null)}>Mengerti</button></section></div>}
      {shortcutsOpen && <ShortcutsModalComponent onClose={() => setShortcutsOpen(false)} />}

      {zenMode && (
        <div className="zen-overlay" role="dialog" aria-modal="true" aria-label="Mode Zen Fokus">
          <div className="zen-header">
            <div className="cycle-bar" aria-label={`Siklus ${getCycleProgress(completedPomodoros, longBreakInterval).cycleNumber}`}>
              <span className="cycle-label">Siklus #{getCycleProgress(completedPomodoros, longBreakInterval).cycleNumber}</span>
              <div className="cycle-dots" aria-hidden="true">
                {Array.from({ length: getCycleProgress(completedPomodoros, longBreakInterval).totalInCycle }, (_, idx) => (
                  <span
                    key={idx}
                    className={idx < getCycleProgress(completedPomodoros, longBreakInterval).completedInCycle ? "cycle-dot filled" : "cycle-dot"}
                  />
                ))}
              </div>
            </div>
            <button
              type="button"
              className="zen-close-button"
              onClick={() => setZenMode(false)}
              aria-label="Keluar dari mode Zen"
              title="Keluar Zen (Esc atau F)"
            >
              ✕ Keluar Zen
            </button>
          </div>

          <div className="mode-tabs zen-mode-tabs">
            {(Object.keys(modeLabels) as TimerMode[]).map((item) => (
              <button
                key={item}
                className={mode === item ? "mode-tab selected" : "mode-tab"}
                onClick={() => changeMode(item)}
              >
                {modeLabels[item]}
              </button>
            ))}
          </div>

          <div className="zen-timer-display" aria-live="polite">
            {formatTime(seconds)}
          </div>

          {focusedTask && (
            <div className="zen-focused-task">
              <span className="focused-task-badge">🎯 Fokus</span>
              <strong>{focusedTask.title}</strong>
              <span className="focused-task-pomos">🍅 {focusedTask.pomodoros}</span>
            </div>
          )}

          <div className="timer-controls zen-controls">
            <button
              type="button"
              className="timer-aux-button"
              onClick={resetTimer}
              aria-label="Reset timer"
              title="Reset timer (R)"
            >
              ↺
            </button>
            <button className="start-button zen-start-button" onClick={toggleRunning}>
              {running ? "PAUSE" : "START"}
            </button>
            <button
              type="button"
              className="timer-aux-button"
              onClick={skipSession}
              aria-label="Lewati sesi ini"
              title="Lewati sesi (S)"
            >
              ⏭
            </button>
          </div>

          <div className="ambient-bar zen-ambient-bar" role="group" aria-label="Suara latar fokus">
            <span className="ambient-label">🎧 Suara latar</span>
            <div className="ambient-pills">
              {AMBIENT_SOUND_OPTIONS.map((option) => (
                <button
                  key={option.mode}
                  type="button"
                  className={ambientSound === option.mode ? "ambient-pill selected" : "ambient-pill"}
                  onClick={() => setAmbientSound(option.mode)}
                  aria-pressed={ambientSound === option.mode}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <p className="zen-hint">
            Tekan <kbd>Space</kbd> untuk mulai/jeda · <kbd>F</kbd> atau <kbd>Esc</kbd> untuk keluar
          </p>
        </div>
      )}
    </main>
  );
}
