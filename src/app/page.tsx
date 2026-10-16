"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { TaskManagement } from "@/app/components/task-management";
import { TimerPanel } from "@/app/components/timer-panel";
import { AccountModal } from "@/app/components/account-modal";
import { ProfileMenu } from "@/app/components/profile-menu";
import { AuthModal as AuthModalComponent } from "@/app/components/auth-modal";
import { SettingsModal as SettingsModalComponent } from "@/app/components/settings-modal";
import { ShortcutsModal as ShortcutsModalComponent } from "@/app/components/shortcuts-modal";
import type { Task, TimerDurations, TimerMode } from "@/types/domain";
import {
  createTask,
  deleteAllTasks as deleteAllCloudTasks,
  deleteTaskById,
  deleteTasksByIds,
  initialTasks,
  loadLocalTasks,
  loadTasks,
  recordCompletedSession,
  setTaskCompleted,
} from "@/features/tasks/task-service";
import { formatTime, getRemainingSeconds, getTimerEndTime } from "@/features/timer/timer-utils";

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

function playCompletionSound(startAt = 0) {
  const AudioContextClass = window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const startTime = context.currentTime + startAt;
  const notes = [659.25, 783.99, 987.77, 1318.51];
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const noteStart = startTime + index * 0.16;
    oscillator.frequency.value = frequency;
    oscillator.type = index % 2 === 0 ? "sine" : "triangle";
    gain.gain.setValueAtTime(0.001, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.2, noteStart + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.55);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteStart + 0.58);
  });
  const chordStart = startTime + 0.55;
  [659.25, 783.99, 987.77].forEach((frequency) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.001, chordStart);
    gain.gain.exponentialRampToValueAtTime(0.12, chordStart + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, chordStart + 0.9);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(chordStart);
    oscillator.stop(chordStart + 0.95);
  });
  void context.resume();
  window.setTimeout(() => void context.close(), (startAt + 1.7) * 1000);
}

function playCompletionAlarm(repeat: boolean) {
  playCompletionSound();
  if (repeat) playCompletionSound(2.2);
}

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
  const [selectedColor, setSelectedColor] = useState("#e8e8e8");
  const [autoStart, setAutoStart] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [timerDurations, setTimerDurations] = useState<TimerDurations>(durations);
  const [repeatAlarm, setRepeatAlarm] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [appError, setAppError] = useState<string | null>(null);
  const timerEndAtRef = useRef<number | null>(null);

  useEffect(() => {
    const title = mode === "pomodoro" ? "Time to focus!" : "Time for a break!";
    document.title = `${formatTime(seconds)} - ${title}`;
  }, [mode, seconds]);

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("auth_error");
    if (!error) return;
    const frame = window.requestAnimationFrame(() => setAuthError(error));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    async function loadUser() {
      try {
        const result = await supabase.auth.getUser();
        if (result.error) throw result.error;
        setUser(result.data.user);
      } catch (error) {
        setAppError(error instanceof Error ? error.message : "Gagal memuat sesi akun.");
      }
    }
    void loadUser();
    const { data: listener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

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
        if (!cancelled) setAppError(error instanceof Error ? `Gagal memuat task: ${error.message}` : "Gagal memuat task.");
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName ?? "");
      if (event.key === "Escape") {
        setShowSettings(false);
        setLoginOpen(false);
        setShortcutsOpen(false);
      }
      if (isTyping) return;
      if (event.key === "?" || (event.shiftKey && event.key === "/")) setShortcutsOpen(true);
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
        const nextMode: TimerMode = mode === "pomodoro" ? "short" : "pomodoro";
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
  }, [mode, running, seconds, timerDurations]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTasks(loadLocalTasks());
      setSoundEnabled(window.localStorage.getItem("biarfokus.sound") !== "false");
      setTasksHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!tasksHydrated || user) return;
    window.localStorage.setItem("biarfokus.tasks", JSON.stringify(tasks));
  }, [tasks, tasksHydrated, user]);

  useEffect(() => {
    window.localStorage.setItem("biarfokus.sound", String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      const endAt = timerEndAtRef.current;
      if (endAt === null) return;
      const remaining = getRemainingSeconds(endAt);
      if (remaining > 0) {
        setSeconds(remaining);
        return;
      }

      timerEndAtRef.current = null;
      setRunning(false);
      if (soundEnabled) playCompletionAlarm(repeatAlarm);
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("BiarFokus", { body: `${modeLabels[mode]} selesai. Waktunya ganti sesi.` });
      }
      if (user) {
        void recordCompletedSession(getSupabaseBrowserClient(), user.id, mode, timerDurations[mode])
          .catch((error: unknown) => setAppError(error instanceof Error ? `Sesi selesai, tetapi gagal disimpan: ${error.message}` : "Sesi selesai, tetapi gagal disimpan."));
      }
      const nextMode: TimerMode = mode === "pomodoro" ? "short" : "pomodoro";
      const nextSeconds = timerDurations[autoStart ? nextMode : mode];
      setMode(autoStart ? nextMode : mode);
      setSeconds(nextSeconds);
      if (autoStart) {
        timerEndAtRef.current = getTimerEndTime(nextSeconds);
        setRunning(true);
      }
    }, 250);
    return () => window.clearInterval(interval);
  }, [autoStart, mode, repeatAlarm, running, soundEnabled, timerDurations, user]);

  const completedTasks = useMemo(() => tasks.filter((task) => task.done).length, [tasks]);
  const userName = user?.user_metadata.full_name ?? user?.user_metadata.name ?? user?.email?.split("@")[0] ?? "Account";
  const userAvatar = user?.user_metadata.avatar_url as string | undefined;

  function changeMode(nextMode: TimerMode) {
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
    if (user) {
      try {
        const task = await createTask(getSupabaseBrowserClient(), user.id, title);
        setTasks((current) => [...current, task]);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal menyimpan task.";
        throw new Error(message);
      }
    }
    setTasks((current) => [...current, { id: crypto.randomUUID(), title, done: false, pomodoros: 1 }]);
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
          <span>BiarFokus</span>
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
                {userAvatar ? <img src={userAvatar} alt="" /> : <span>{userName.charAt(0).toUpperCase()}</span>}
              </button>
              {profileMenuOpen && <ProfileMenu
                userName={userName}
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
                onDelete={() => { setProfileMenuOpen(false); setInfoOpen("Penghapusan akun akan tersedia setelah endpoint aman dan proses konfirmasi email disiapkan."); }}
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
      </nav>}

      {activeView === "timer" && (
        <div className="content-grid">
          <TimerPanel
            mode={mode}
            seconds={seconds}
            running={running}
            selectedColor={selectedColor}
            colorThemes={colorThemes}
            modeLabels={modeLabels}
            onModeChange={changeMode}
            onToggleRunning={toggleRunning}
            onColorChange={setSelectedColor}
          />

          <TaskManagement
            tasks={tasks}
            onAdd={addTask}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onDeleteCompleted={deleteCompletedTasks}
            onDeleteAll={deleteAllTasks}
          />
        </div>
      )}

      {activeView === "stats" && <Stats completedTasks={completedTasks} />}
      {activeView === "pricing" && <Pricing onUpgrade={() => setInfoOpen("Checkout Stripe akan aktif setelah akun pembayaran dikonfigurasi.")} />}
      {activeView === "admin" && <Admin />}

      <footer className="footer">
        <div><strong>BiarFokus</strong><span>Bantu kamu fokus selesain setiap pekerjaan.</span></div>
        <div className="footer-links"><button onClick={() => setActiveView("timer")}>Main App</button><button onClick={() => setInfoOpen("Pomodoro membagi waktu kerja menjadi interval fokus dan istirahat agar kamu bisa bekerja dengan ritme yang konsisten.")}>Apa itu Pomodoro?</button><button onClick={() => setInfoOpen("BiarFokus dibuat untuk membantu kamu menyelesaikan pekerjaan dengan lebih tenang dan terarah.")}>Tentang Kami</button></div>
        <small>© 2025 biarfokus - All rights reserved</small>
      </footer>
      <button className="settings-fab" onClick={() => setShowSettings(true)} aria-label="Pengaturan">⚙</button>
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
        timerDurations={timerDurations}
        setTimerDurations={(nextDurations) => {
          setTimerDurations(nextDurations);
          setSeconds(nextDurations[mode]);
          setRunning(false);
        }}
        onClose={() => setShowSettings(false)}
      />}
      {loginOpen && <AuthModalComponent mode={authMode} setMode={setAuthMode} onClose={() => setLoginOpen(false)} />}
      {accountOpen && <AccountModal user={user} userName={userName} onClose={() => setAccountOpen(false)} />}
      {authError && <div className="modal-backdrop" role="presentation" onClick={() => setAuthError(null)}><section className="modal" role="alertdialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setAuthError(null)} aria-label="Tutup error">×</button><h2>Login gagal</h2><p className="modal-copy">{authError}</p><button className="secondary-button" onClick={() => setAuthError(null)}>Tutup</button></section></div>}
      {appError && <div className="modal-backdrop" role="presentation" onClick={() => setAppError(null)}><section className="modal" role="alertdialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setAppError(null)} aria-label="Tutup error">×</button><h2>Terjadi kesalahan</h2><p className="modal-copy">{appError}</p><button className="secondary-button" onClick={() => setAppError(null)}>Tutup</button></section></div>}
      {infoOpen && <div className="modal-backdrop" role="presentation" onClick={() => setInfoOpen(null)}><section className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setInfoOpen(null)} aria-label="Tutup">×</button><h2>Fokus dengan ritme yang tepat</h2><p className="modal-copy">{infoOpen}</p><button className="secondary-button" onClick={() => setInfoOpen(null)}>Mengerti</button></section></div>}
      {shortcutsOpen && <ShortcutsModalComponent onClose={() => setShortcutsOpen(false)} />}
    </main>
  );
}

function Stats({ completedTasks }: { completedTasks: number }) {
  return <div className="inner-page"><p className="eyebrow">Ringkasan mingguan</p><h1>Statistik produktivitas</h1><div className="stat-grid"><div className="stat-card"><span>Fokus minggu ini</span><strong>12j 45m</strong><small>↑ 18% dari minggu lalu</small></div><div className="stat-card"><span>Pomodoro selesai</span><strong>32</strong><small>Target mingguan: 40</small></div><div className="stat-card"><span>Tugas selesai</span><strong>{completedTasks}</strong><small>Terus pertahankan!</small></div></div><div className="chart-card"><div className="chart-labels"><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span></div><div className="bars">{[55, 72, 42, 88, 64, 35, 20].map((height, index) => <div className="bar-wrap" key={index}><div className="bar" style={{ height: `${height}%` }} /><small>{height === 88 ? "4j" : `${Math.round(height / 22)}j`}</small></div>)}</div></div></div>;
}

function Pricing({ onUpgrade }: { onUpgrade: () => void }) {
  return <div className="inner-page"><p className="eyebrow">Biar makin fokus</p><h1>Pilih ruang fokusmu</h1><div className="pricing-grid"><div className="price-card"><span>Free</span><strong>$0 <small>/ forever</small></strong><p>Pomodoro timer, task management, dan fokus tanpa batas.</p><button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Mulai gratis</button></div><div className="price-card featured"><b className="popular">MOST POPULAR</b><span>Pro</span><strong>$2.99 <small>/ month</small></strong><p>Statistik lengkap, task tanpa batas, dan suara fokus.</p><button onClick={onUpgrade}>Upgrade ke Pro</button></div></div></div>;
}

function Admin() {
  return <div className="inner-page"><p className="eyebrow">Workspace admin</p><h1>Overview</h1><div className="admin-table"><div><span>Total pengguna</span><strong>1,248</strong><em>↑ 12.4%</em></div><div><span>Pengguna aktif hari ini</span><strong>386</strong><em>↑ 8.1%</em></div><div><span>Pendapatan berulang</span><strong>Rp8.7jt</strong><em>↑ 21.3%</em></div></div><p className="admin-note">Dashboard admin lengkap akan terhubung ke Supabase setelah project production dikonfigurasi.</p></div>;
}
