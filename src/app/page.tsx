"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { TaskManagement, type Task } from "@/app/components/task-management";

type TimerMode = "pomodoro" | "short" | "long";
type View = "timer" | "stats" | "pricing" | "admin";
type TimerDurations = Record<TimerMode, number>;
const durations: Record<TimerMode, number> = {
  pomodoro: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const deepWorkDurations: TimerDurations = {
  pomodoro: 50 * 60,
  short: 10 * 60,
  long: 30 * 60,
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

const initialTasks = [
  { id: "demo-1", title: "Rencanakan target hari ini", done: true, pomodoros: 2 },
  { id: "demo-2", title: "Kerjakan prioritas utama", done: false, pomodoros: 4 },
  { id: "demo-3", title: "Review pekerjaan dan catatan", done: false, pomodoros: 1 },
];

function loadSavedTasks(): Task[] {
  if (typeof window === "undefined") return initialTasks;
  const savedTasks = window.localStorage.getItem("biarfokus.tasks");
  if (!savedTasks) return initialTasks;
  try {
    const parsedTasks: unknown = JSON.parse(savedTasks);
    if (Array.isArray(parsedTasks) && parsedTasks.every((task) => {
      if (typeof task !== "object" || task === null) return false;
      const value = task as Record<string, unknown>;
      return (typeof value.id === "string" || typeof value.id === "number") && typeof value.title === "string" &&
        typeof value.done === "boolean" && typeof value.pomodoros === "number";
    })) {
      return parsedTasks as Task[];
    }
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    window.localStorage.removeItem("biarfokus.tasks");
  }
  return initialTasks;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remaining = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remaining}`;
}

function playCompletionSound() {
  const AudioContextClass = window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 880;
  oscillator.type = "sine";
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.45);
  window.setTimeout(() => void context.close(), 600);
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

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("auth_error");
    if (!error) return;
    const frame = window.requestAnimationFrame(() => setAuthError(error));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    async function loadUser() {
      const result = await supabase.auth.getUser();
      if (result.error) throw result.error;
      setUser(result.data.user);
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
        const { data, error } = await supabase
          .from("tasks")
          .select("id, title, completed, pomodoros")
          .eq("user_id", userId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        if (data.length > 0) {
          if (!cancelled)           setTasks(data.map((task: { id: string; title: string; completed: boolean; pomodoros: number }) => ({ id: task.id, title: task.title, done: task.completed, pomodoros: task.pomodoros })));
          return;
        }

        const localTasks = loadSavedTasks();
        const tasksToMigrate = localTasks.map((task) => ({
          id: crypto.randomUUID(),
          user_id: userId,
          title: task.title,
          completed: task.done,
          pomodoros: task.pomodoros,
        }));
        if (tasksToMigrate.length > 0) {
          const { error: migrationError } = await supabase.from("tasks").insert(tasksToMigrate);
          if (migrationError) throw migrationError;
          if (!cancelled) setTasks(tasksToMigrate.map((task) => ({ id: task.id, title: task.title, done: task.completed, pomodoros: task.pomodoros })));
        }
      } catch (error) {
        if (!cancelled) window.alert(error instanceof Error ? `Gagal memuat task: ${error.message}` : "Gagal memuat task.");
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
      if (event.key === "Escape") {
        setShowSettings(false);
        setLoginOpen(false);
        setShortcutsOpen(false);
      }
      if (event.key === "?" || (event.shiftKey && event.key === "/")) setShortcutsOpen(true);
      if (event.code === "Space" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName ?? "")) {
        event.preventDefault();
        setRunning((current) => !current);
      }
      if (event.key.toLowerCase() === "r") {
        setRunning(false);
        setSeconds(timerDurations[mode]);
      }
      if (event.key.toLowerCase() === "s") {
        const nextMode: TimerMode = mode === "pomodoro" ? "short" : "pomodoro";
        setMode(nextMode);
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
  }, [mode, timerDurations]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTasks(loadSavedTasks());
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
      setSeconds((value) => {
        if (value <= 1) {
          setRunning(false);
          if (soundEnabled) playCompletionSound();
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("BiarFokus", { body: `${modeLabels[mode]} selesai. Waktunya ganti sesi.` });
          }
          const nextMode: TimerMode = mode === "pomodoro" ? "short" : "pomodoro";
          if (autoStart) {
            setMode(nextMode);
            return timerDurations[nextMode];
          }
          return timerDurations[mode];
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [autoStart, mode, running, soundEnabled, timerDurations]);

  const completedTasks = useMemo(() => tasks.filter((task) => task.done).length, [tasks]);
  const userName = user?.user_metadata.full_name ?? user?.user_metadata.name ?? user?.email?.split("@")[0] ?? "Account";
  const userAvatar = user?.user_metadata.avatar_url as string | undefined;

  function changeMode(nextMode: TimerMode) {
    setMode(nextMode);
    setSeconds(timerDurations[nextMode]);
    setRunning(false);
  }

  async function addTask(title: string) {
    const task = { id: crypto.randomUUID(), title, done: false, pomodoros: 1 };
    if (user) {
      try {
        const { data, error } = await getSupabaseBrowserClient().from("tasks").insert({
          user_id: user.id,
          title: task.title,
          completed: false,
          pomodoros: task.pomodoros,
        }).select("id, title, completed, pomodoros").single();
        if (error) throw error;
        setTasks((current) => [...current, {
          id: data.id,
          title: data.title,
          done: data.completed,
          pomodoros: data.pomodoros,
        }]);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal menyimpan task.";
        throw new Error(message);
      }
    }
    setTasks((current) => [...current, task]);
  }

  async function toggleTask(task: Task) {
    const completed = !task.done;
    if (user) {
      try {
        const { error } = await getSupabaseBrowserClient().from("tasks").update({ completed }).eq("id", task.id).eq("user_id", user.id);
        if (error) throw error;
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
        const { error } = await getSupabaseBrowserClient().from("tasks").delete().eq("id", task.id).eq("user_id", user.id);
        if (error) throw error;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal menghapus task.";
        throw new Error(message);
      }
    }
    setTasks((current) => current.filter((item) => item.id !== task.id));
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
          <span className="brand-mark"><i /><i /><i /><i /></span>
          <span>BiarFokus</span>
        </button>
        <nav className="desktop-nav" aria-label="Navigasi utama">
          {(["timer", "stats", "pricing", "admin"] as View[]).map((view) => (
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
                onShortcuts={() => { setShortcutsOpen(true); setProfileMenuOpen(false); }}
                onSignOut={() => { setProfileMenuOpen(false); void getSupabaseBrowserClient().auth.signOut(); }}
                onDelete={() => { setProfileMenuOpen(false); setInfoOpen("Penghapusan akun akan tersedia setelah endpoint aman dan proses konfirmasi email disiapkan."); }}
              />}
            </div>
          ) : <button className="login-button" onClick={() => setLoginOpen(true)}>🔐 Sign In</button>}
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Buka menu" aria-expanded={menuOpen}>☰</button>
        </div>
      </header>
      {menuOpen && <nav className="mobile-nav" aria-label="Navigasi mobile">
        {(["timer", "stats", "pricing", "admin"] as View[]).map((view) => (
          <button key={view} className={activeView === view ? "nav-link active" : "nav-link"} onClick={() => { setActiveView(view); setMenuOpen(false); }}>
            {view === "timer" ? "Timer" : view === "stats" ? "Statistik" : view === "pricing" ? "Pro" : "Admin"}
          </button>
        ))}
      </nav>}

      {activeView === "timer" && (
        <div className="content-grid">
          <section className="timer-card card">
            <div className="mode-tabs">
              {(Object.keys(modeLabels) as TimerMode[]).map((item) => (
                <button key={item} className={mode === item ? "mode-tab selected" : "mode-tab"} onClick={() => changeMode(item)}>
                  {modeLabels[item]}
                </button>
              ))}
            </div>
            <div className="timer-display" aria-live="polite">{formatTime(seconds)}</div>
            <button className="start-button" onClick={() => setRunning(!running)}>{running ? "PAUSE" : "START"}</button>
            <div className="color-picker" aria-label="Pilih warna">
              {colorThemes.map(({ color, name }) => (
                <button key={color} className={selectedColor === color ? "color-dot selected" : "color-dot"} style={{ backgroundColor: color }} onClick={() => setSelectedColor(color)} aria-label={`Pilih tema ${name}`} />
              ))}
            </div>
          </section>

          <TaskManagement
            tasks={tasks}
            onAdd={addTask}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onViewProductivity={() => setActiveView("stats")}
          />
        </div>
      )}

      {activeView === "stats" && <Stats completedTasks={completedTasks} />}
      {activeView === "pricing" && <Pricing />}
      {activeView === "admin" && <Admin />}

      <footer className="footer">
        <div><strong>BiarFokus</strong><span>Bantu kamu fokus selesain setiap pekerjaan.</span></div>
        <div className="footer-links"><button onClick={() => setActiveView("timer")}>Main App</button><button onClick={() => setInfoOpen("Pomodoro membagi waktu kerja menjadi interval fokus dan istirahat agar kamu bisa bekerja dengan ritme yang konsisten.")}>Apa itu Pomodoro?</button><button onClick={() => setInfoOpen("BiarFokus dibuat untuk membantu kamu menyelesaikan pekerjaan dengan lebih tenang dan terarah.")}>Tentang Kami</button></div>
        <small>© 2025 biarfokus - All rights reserved</small>
      </footer>
      <button className="settings-fab" onClick={() => setShowSettings(true)} aria-label="Pengaturan">⚙</button>
      {showSettings && <SettingsModal
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
        setTimerDurations={(nextDurations) => {
          setTimerDurations(nextDurations);
          setSeconds(nextDurations[mode]);
          setRunning(false);
        }}
        onClose={() => setShowSettings(false)}
      />}
      {loginOpen && <AuthModal mode={authMode} setMode={setAuthMode} onClose={() => setLoginOpen(false)} />}
      {accountOpen && <AccountModal user={user} userName={userName} onClose={() => setAccountOpen(false)} />}
      {authError && <div className="modal-backdrop" role="presentation" onClick={() => setAuthError(null)}><section className="modal" role="alertdialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setAuthError(null)} aria-label="Tutup error">×</button><h2>Login gagal</h2><p className="modal-copy">{authError}</p><button className="secondary-button" onClick={() => setAuthError(null)}>Tutup</button></section></div>}
      {infoOpen && <div className="modal-backdrop" role="presentation" onClick={() => setInfoOpen(null)}><section className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setInfoOpen(null)} aria-label="Tutup">×</button><h2>Fokus dengan ritme yang tepat</h2><p className="modal-copy">{infoOpen}</p><button className="secondary-button" onClick={() => setInfoOpen(null)}>Mengerti</button></section></div>}
      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
    </main>
  );
}

function Stats({ completedTasks }: { completedTasks: number }) {
  return <div className="inner-page"><p className="eyebrow">Ringkasan mingguan</p><h1>Statistik produktivitas</h1><div className="stat-grid"><div className="stat-card"><span>Fokus minggu ini</span><strong>12j 45m</strong><small>↑ 18% dari minggu lalu</small></div><div className="stat-card"><span>Pomodoro selesai</span><strong>32</strong><small>Target mingguan: 40</small></div><div className="stat-card"><span>Tugas selesai</span><strong>{completedTasks}</strong><small>Terus pertahankan!</small></div></div><div className="chart-card"><div className="chart-labels"><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span></div><div className="bars">{[55, 72, 42, 88, 64, 35, 20].map((height, index) => <div className="bar-wrap" key={index}><div className="bar" style={{ height: `${height}%` }} /><small>{height === 88 ? "4j" : `${Math.round(height / 22)}j`}</small></div>)}</div></div></div>;
}

function Pricing() {
  return <div className="inner-page"><p className="eyebrow">Biar makin fokus</p><h1>Pilih ruang fokusmu</h1><div className="pricing-grid"><div className="price-card"><span>Free</span><strong>$0 <small>/ forever</small></strong><p>Pomodoro timer, task management, dan fokus tanpa batas.</p><button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Mulai gratis</button></div><div className="price-card featured"><b className="popular">MOST POPULAR</b><span>Pro</span><strong>$2.99 <small>/ month</small></strong><p>Statistik lengkap, task tanpa batas, dan suara fokus.</p><button onClick={() => alert("Checkout Stripe akan aktif setelah akun pembayaran dikonfigurasi.")}>Upgrade ke Pro</button></div></div></div>;
}

function Admin() {
  return <div className="inner-page"><p className="eyebrow">Workspace admin</p><h1>Overview</h1><div className="admin-table"><div><span>Total pengguna</span><strong>1,248</strong><em>↑ 12.4%</em></div><div><span>Pengguna aktif hari ini</span><strong>386</strong><em>↑ 8.1%</em></div><div><span>Pendapatan berulang</span><strong>Rp8.7jt</strong><em>↑ 21.3%</em></div></div><p className="admin-note">Dashboard admin lengkap akan terhubung ke Supabase setelah project production dikonfigurasi.</p></div>;
}

function ProfileMenu({
  userName,
  onAccount,
  onPremium,
  onShortcuts,
  onSignOut,
  onDelete,
}: {
  userName: string;
  onAccount: () => void;
  onPremium: () => void;
  onShortcuts: () => void;
  onSignOut: () => void;
  onDelete: () => void;
}) {
  return <div className="profile-menu" role="menu">
    <strong>{userName}</strong>
    <button onClick={onAccount} role="menuitem">♟ <span>Account</span></button>
    <button onClick={onPremium} role="menuitem">♛ <span>Premium</span></button>
    <button onClick={onSignOut} role="menuitem">↪ <span>Logout</span></button>
    <button onClick={onShortcuts} role="menuitem">⌨ <span>Shortcuts</span></button>
    <button onClick={onDelete} role="menuitem">♲ <span>Delete Account</span></button>
  </div>;
}

function AccountModal({ user, userName, onClose }: { user: User | null; userName: string; onClose: () => void }) {
  const avatar = user?.user_metadata.avatar_url as string | undefined;
  return <div className="modal-backdrop" role="presentation" onClick={onClose}>
    <section className="account-modal" role="dialog" aria-modal="true" aria-labelledby="account-title" onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose} aria-label="Tutup account">×</button>
      <p className="account-kicker" id="account-title">ACCOUNT</p>
      <div className="account-profile">
        {avatar ? <img src={avatar} alt="" /> : <div className="account-avatar">{userName.charAt(0).toUpperCase()}</div>}
        <div><h2>{userName}</h2><p>{user?.email}</p></div>
      </div>
      <div className="account-actions"><button className="secondary-button" onClick={onClose}>Close</button><button className="apply-button" onClick={onClose}>Save</button></div>
    </section>
  </div>;
}

function AuthModal({
  mode,
  setMode,
  onClose,
}: {
  mode: "sign-in" | "sign-up";
  setMode: (mode: "sign-in" | "sign-up") => void;
  onClose: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isSignUp = mode === "sign-up";

  async function submitAuth() {
    setLoading(true);
    setError(null);
    setStatus(null);
    const supabase = getSupabaseBrowserClient();
    const result = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (isSignUp) {
      setStatus("Akun dibuat. Cek email kamu untuk verifikasi sebelum login.");
      return;
    }
    onClose();
  }

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    const { error: authError } = await getSupabaseBrowserClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authError) {
      setLoading(false);
      setError(authError.message);
    }
  }

  async function resetPassword() {
    if (!email) {
      setError("Masukkan email terlebih dahulu.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: authError } = await getSupabaseBrowserClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setStatus("Link reset password sudah dikirim ke email kamu.");
  }

  return <div className="modal-backdrop" role="presentation" onClick={onClose}>
    <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose} aria-label="Tutup login">×</button>
      <div className="auth-heading"><h2 id="auth-title">{isSignUp ? "Create Account" : "Welcome Back"}</h2><p>Focus better. Finish more.</p></div>
      <button className="google-button" onClick={() => void signInWithGoogle()} disabled={loading}>G <span>Sign in With Google SSO</span></button>
      <div className="auth-divider"><span>OR</span></div>
      {isSignUp && <label className="auth-field">Username<input required placeholder="e.g ardikharisma_" /></label>}
      <label className="auth-field">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="e.g hello@example.com" /></label>
      <label className="auth-field">Password<div className="password-field"><input required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="***********" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Tampilkan password">{showPassword ? "◉" : "◌"}</button></div></label>
      {!isSignUp && <button className="forgot-button" onClick={() => void resetPassword()}>Forgot Password?</button>}
      <button className="auth-submit" onClick={() => void submitAuth()} disabled={loading}>{loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}</button>
      <small>By continuing, I agree to the <a href="#terms">Terms of service</a> and <a href="#privacy">Privacy policy</a>.</small>
      {error && <p className="auth-status auth-error">{error}</p>}
      {status && <p className="auth-status">{status}</p>}
      <p className="auth-switch">{isSignUp ? "Already Have Account?" : "Do not have an account?"} <button onClick={() => { setMode(isSignUp ? "sign-in" : "sign-up"); setError(null); setStatus(null); }}>{isSignUp ? "Sign In" : "Create Account"}</button></p>
    </section>
  </div>;
}

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    ["Start/Pause", "Space"],
    ["Reset Timer", "R"],
    ["Skip Session", "S"],
    ["Open Settings", "Ctrl + S"],
    ["Open Tasks", "Ctrl + T"],
    ["Close Modal", "Esc"],
    ["Toggle Shortcuts", "?"],
  ];
  return <div className="modal-backdrop" role="presentation" onClick={onClose}>
    <section className="shortcuts-modal" role="dialog" aria-modal="true" aria-labelledby="shortcuts-title" onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose} aria-label="Tutup shortcuts">×</button>
      <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
      <p className="shortcut-group">TIMER CONTROLS</p>
      {shortcuts.slice(0, 3).map(([label, key]) => <div className="shortcut-row" key={label}><span>{label}</span><kbd>{key}</kbd></div>)}
      <p className="shortcut-group">NAVIGATION</p>
      {shortcuts.slice(3, 5).map(([label, key]) => <div className="shortcut-row" key={label}><span>{label}</span><kbd>{key}</kbd></div>)}
      <p className="shortcut-group">GENERAL</p>
      {shortcuts.slice(5).map(([label, key]) => <div className="shortcut-row" key={label}><span>{label}</span><kbd>{key}</kbd></div>)}
      <small>Press <kbd>Esc</kbd> or click outside to close</small>
    </section>
  </div>;
}

function SettingsModal({
  selectedColor,
  setSelectedColor,
  soundEnabled,
  setSoundEnabled,
  autoStart,
  setAutoStart,
  dark,
  setDark,
  notificationsEnabled,
  setNotificationsEnabled,
  repeatAlarm,
  setRepeatAlarm,
  setTimerDurations,
  onClose,
}: {
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  autoStart: boolean;
  setAutoStart: (enabled: boolean) => void;
  dark: boolean;
  setDark: (enabled: boolean) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  repeatAlarm: boolean;
  setRepeatAlarm: (enabled: boolean) => void;
  setTimerDurations: (durations: TimerDurations) => void;
  onClose: () => void;
}) {
  return <div className="modal-backdrop" role="presentation" onClick={onClose}>
    <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose} aria-label="Tutup pengaturan">×</button>
      <aside className="settings-sidebar">
        <span className="settings-kicker">BiarFokus</span>
        <h2 id="settings-title">Settings</h2>
        <button className="settings-tab active">◷ <span>Concentration time</span></button>
        <button className="settings-tab" onClick={() => setSoundEnabled(!soundEnabled)}>♧ <span>Sound & alarm</span></button>
        <button className="settings-tab" onClick={() => setAutoStart(!autoStart)}>▷ <span>Auto start</span></button>
        <button className="settings-tab" onClick={() => setNotificationsEnabled(!notificationsEnabled)}>♧ <span>Notification</span></button>
      </aside>
      <div className="settings-content">
        <div className="settings-section">
          <p className="settings-section-title">TIMER TEMPLATE</p>
          <button className="template-card active" onClick={() => setTimerDurations(durations)}>
            <strong>✓ Template fokus</strong>
            <span>25 min pomodoro · 5 min short break · 15 min long break</span>
          </button>
          <button className="template-card" onClick={() => setTimerDurations(deepWorkDurations)}>
            <strong>□ Deep work</strong>
            <span>50 min pomodoro · 10 min short break · 30 min long break</span>
          </button>
        </div>
        <div className="settings-section">
          <p className="settings-section-title">PREFERENCES</p>
          <div className="setting-row"><span>Color theme</span><div className="theme-options">{colorThemes.map(({ color, name }) => <button key={color} title={name} aria-label={name} className={selectedColor === color ? "theme-swatch selected" : "theme-swatch"} style={{ backgroundColor: color }} onClick={() => setSelectedColor(color)} />)}</div></div>
          <button className="setting-row setting-action" onClick={() => setSoundEnabled(!soundEnabled)}><span>Focus sound</span><b>{soundEnabled ? "On" : "Off"}</b></button>
          <button className="setting-row setting-action" onClick={() => setRepeatAlarm(!repeatAlarm)}><span>Repeat alarm</span><b>{repeatAlarm ? "On" : "Off"}</b></button>
          <button className="setting-row setting-action" onClick={() => setAutoStart(!autoStart)}><span>Auto start next session</span><b>{autoStart ? "On" : "Off"}</b></button>
          <button className="setting-row setting-action" onClick={() => setDark(!dark)}><span>Dark mode</span><b>{dark ? "On" : "Off"}</b></button>
          <button className="setting-row setting-action" onClick={async () => {
            if (!notificationsEnabled && typeof Notification !== "undefined" && Notification.permission === "default") {
              const permission = await Notification.requestPermission();
              setNotificationsEnabled(permission === "granted");
            } else {
              setNotificationsEnabled(!notificationsEnabled);
            }
          }}><span>Browser notification</span><b>{notificationsEnabled ? "On" : "Off"}</b></button>
        </div>
        <div className="settings-footer"><span>Changes are saved automatically</span><button className="apply-button" onClick={onClose}>Apply</button></div>
      </div>
    </section>
  </div>;
}
