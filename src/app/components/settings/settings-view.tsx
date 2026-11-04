"use client";

import { useEffect, useState } from "react";
import type { TimerDurations } from "@/types/domain";
import {
  ALARM_SOUND_OPTIONS,
  playAlarmSound,
  stopAlarmSound,
  type AlarmSoundType,
} from "@/features/audio/alarm-sound";
import {
  loadLocalSettings,
  saveLocalSettings,
  type UserSettings,
} from "@/features/settings/settings-service";
import { useAppContext } from "@/app/providers/app-provider";
import { AppWorkspaceSidebar } from "@/app/components/ui/app-workspace-sidebar";

const presetClassic: TimerDurations = { pomodoro: 25 * 60, short: 5 * 60, long: 15 * 60 };
const presetDeepWork: TimerDurations = { pomodoro: 50 * 60, short: 10 * 60, long: 30 * 60 };
const presetSprint: TimerDurations = { pomodoro: 15 * 60, short: 3 * 60, long: 10 * 60 };

const colorThemes = [
  { color: "#e8e8e8", name: "Cloud" },
  { color: "#f77fa5", name: "Rose" },
  { color: "#a9d63b", name: "Lime" },
  { color: "#1976df", name: "Ocean" },
  { color: "#ffc247", name: "Sun" },
  { color: "#f7c928", name: "Focus" },
];

export type SettingsTab = "general" | "pomodoro" | "catatan" | "kalender" | "kanban";

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const {
    user,
    dark,
    setDark,
    selectedColor,
    setSelectedColor,
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
  } = useAppContext();

  // Collapsible sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("biarfokus.settings.sidebar_collapsed");
        if (stored !== null) return stored === "true";
        return window.innerWidth < 1024;
      } catch {}
    }
    return false;
  });

  function toggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("biarfokus.settings.sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  }

  // Extra local settings
  const [language, setLanguage] = useState<"id" | "en">("id");
  const [timeFormat, setTimeFormat] = useState<"24" | "12">("24");
  const [notesDefaultView, setNotesDefaultView] = useState<"grid" | "list">("grid");
  const [notesConfirmDelete, setNotesConfirmDelete] = useState(true);
  const [notesAutoCopy, setNotesAutoCopy] = useState(true);
  const [calendarDefaultView, setCalendarDefaultView] = useState<"day" | "week" | "month">("day");
  const [calendarDefaultDuration, setCalendarDefaultDuration] = useState<number>(60);
  const [calendarConfirmDelete, setCalendarConfirmDelete] = useState(true);
  const [calendarKanbanSync, setCalendarKanbanSync] = useState(true);
  const [kanbanConfirmDelete, setKanbanConfirmDelete] = useState(true);
  const [kanbanShowPIC, setKanbanShowPIC] = useState(true);
  const [kanbanShowDueDate, setKanbanShowDueDate] = useState(true);
  const [kanbanFrogIntegration, setKanbanFrogIntegration] = useState(true);
  const [kanbanMobileQuickMove, setKanbanMobileQuickMove] = useState(true);
  const [loadingStyle, setLoadingStyle] = useState<"minimal" | "pro" | "classic">("minimal");

  useEffect(() => {
    const s = loadLocalSettings();
    if (s.language) setLanguage(s.language);
    if (s.timeFormat) setTimeFormat(s.timeFormat);
    if (s.notesDefaultView) setNotesDefaultView(s.notesDefaultView);
    if (s.calendarDefaultView) setCalendarDefaultView(s.calendarDefaultView);
    if (s.calendarDefaultDuration) setCalendarDefaultDuration(s.calendarDefaultDuration);
    if (typeof s.calendarConfirmDelete === "boolean") setCalendarConfirmDelete(s.calendarConfirmDelete);
    if (typeof s.kanbanConfirmDelete === "boolean") setKanbanConfirmDelete(s.kanbanConfirmDelete);
    const explicitLoading = typeof window !== "undefined" ? window.localStorage.getItem("biarfokus.loading_style") : null;
    if (explicitLoading === "minimal" || explicitLoading === "pro" || explicitLoading === "classic") {
      setLoadingStyle(explicitLoading);
    } else if (s.loadingStyle) {
      setLoadingStyle(s.loadingStyle);
    }
  }, []);

  function handleUpdateExtraSetting<K extends keyof UserSettings>(key: K, val: UserSettings[K]) {
    const current = loadLocalSettings();
    const updated = { ...current, [key]: val };
    saveLocalSettings(updated);
    triggerToast();
  }

  function triggerToast() {
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 2000);
  }

  // Custom durations (minutes)
  const [customPomoMin, setCustomPomoMin] = useState(Math.round(timerDurations.pomodoro / 60));
  const [customShortMin, setCustomShortMin] = useState(Math.round(timerDurations.short / 60));
  const [customLongMin, setCustomLongMin] = useState(Math.round(timerDurations.long / 60));

  useEffect(() => {
    setCustomPomoMin(Math.round(timerDurations.pomodoro / 60));
    setCustomShortMin(Math.round(timerDurations.short / 60));
    setCustomLongMin(Math.round(timerDurations.long / 60));
  }, [timerDurations]);

  useEffect(() => {
    return () => {
      stopAlarmSound();
    };
  }, []);

  function toggleAlarmPreview() {
    if (isPlayingPreview) {
      stopAlarmSound();
      setIsPlayingPreview(false);
    } else {
      setIsPlayingPreview(true);
      playAlarmSound(alarmSound, repeatAlarm);
      window.setTimeout(() => {
        setIsPlayingPreview(false);
      }, 7500);
    }
  }

  function handleApplyCustomMinutes(pomo: number, shortB: number, longB: number) {
    const validPomo = Math.max(1, Math.min(180, pomo));
    const validShort = Math.max(1, Math.min(60, shortB));
    const validLong = Math.max(1, Math.min(120, longB));

    setCustomPomoMin(validPomo);
    setCustomShortMin(validShort);
    setCustomLongMin(validLong);

    setTimerDurations({
      pomodoro: validPomo * 60,
      short: validShort * 60,
      long: validLong * 60,
    });
    triggerToast();
  }

  return (
    <div className="notes-app-workspace settings-workspace-layout">
      {/* Sidebar Navigation */}
      <AppWorkspaceSidebar
        badge="Pengaturan"
        activeModule="settings"
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      >
        {/* Settings Navigation Tabs in Sidebar */}
        <div className="kanban-sidebar-section">
          {!sidebarCollapsed && <span className="kanban-sidebar-section-title">Kategori</span>}
          <div className="notes-sidebar-filter-list">
            <button
              type="button"
              className={`notes-sidebar-filter-item ${activeTab === "general" ? "active" : ""}`}
              onClick={() => setActiveTab("general")}
              title="Pengaturan Tampilan & Umum"
            >
              <span className="filter-icon">⚙️</span>
              {!sidebarCollapsed && <span className="filter-title">General</span>}
            </button>
            <button
              type="button"
              className={`notes-sidebar-filter-item ${activeTab === "pomodoro" ? "active" : ""}`}
              onClick={() => setActiveTab("pomodoro")}
              title="Pengaturan Timer & Suara"
            >
              <span className="filter-icon">⏱️</span>
              {!sidebarCollapsed && <span className="filter-title">Pomodoro / Timer</span>}
            </button>
            <button
              type="button"
              className={`notes-sidebar-filter-item ${activeTab === "catatan" ? "active" : ""}`}
              onClick={() => setActiveTab("catatan")}
              title="Pengaturan Catatan & Todo"
            >
              <span className="filter-icon">📝</span>
              {!sidebarCollapsed && <span className="filter-title">Catatan</span>}
            </button>
            <button
              type="button"
              className={`notes-sidebar-filter-item ${activeTab === "kalender" ? "active" : ""}`}
              onClick={() => setActiveTab("kalender")}
              title="Pengaturan Kalender & Timeblock"
            >
              <span className="filter-icon">📅</span>
              {!sidebarCollapsed && <span className="filter-title">Kalender</span>}
            </button>
            <button
              type="button"
              className={`notes-sidebar-filter-item ${activeTab === "kanban" ? "active" : ""}`}
              onClick={() => setActiveTab("kanban")}
              title="Pengaturan Project Kanban"
            >
              <span className="filter-icon">📋</span>
              {!sidebarCollapsed && <span className="filter-title">Kanban</span>}
            </button>
          </div>
        </div>
      </AppWorkspaceSidebar>

      {/* Main Settings Content Area (Fluid & Wide) */}
      <main className="notes-workspace-main settings-workspace-main">
        {/* Top Header */}
        <header className="notes-workspace-topbar settings-page-topbar">
          <div className="notes-topbar-left">
            <button
              type="button"
              className="notes-topbar-hamburger-btn"
              onClick={toggleSidebar}
              aria-label="Toggle Sidebar"
            >
              ☰
            </button>
            <div>
              <p className="eyebrow" style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--accent)" }}>
                BIARFOKUS WORKSPACE
              </p>
              <h1 style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>
                Pengaturan
              </h1>
            </div>
          </div>

          {/* Quick tab switcher pill bar on desktop/tablet */}
          <div className="settings-page-tab-pills">
            <button
              type="button"
              className={`settings-tab-pill ${activeTab === "general" ? "active" : ""}`}
              onClick={() => setActiveTab("general")}
            >
              ⚙️ General
            </button>
            <button
              type="button"
              className={`settings-tab-pill ${activeTab === "pomodoro" ? "active" : ""}`}
              onClick={() => setActiveTab("pomodoro")}
            >
              ⏱️ Timer
            </button>
            <button
              type="button"
              className={`settings-tab-pill ${activeTab === "catatan" ? "active" : ""}`}
              onClick={() => setActiveTab("catatan")}
            >
              📝 Catatan
            </button>
            <button
              type="button"
              className={`settings-tab-pill ${activeTab === "kalender" ? "active" : ""}`}
              onClick={() => setActiveTab("kalender")}
            >
              📅 Kalender
            </button>
            <button
              type="button"
              className={`settings-tab-pill ${activeTab === "kanban" ? "active" : ""}`}
              onClick={() => setActiveTab("kanban")}
            >
              📋 Kanban
            </button>
          </div>
        </header>

        {/* Scrollable Content Container */}
        <div className="settings-page-scroll-container">
          <div className="settings-page-card">
            {/* TAB 1: GENERAL */}
            {activeTab === "general" && (
              <div className="settings-tab-pane">
                <div className="settings-section">
                  <p className="settings-section-title">TEMA TAMPILAN</p>
                  <div className="settings-row">
                    <div>
                      <p className="settings-label">Mode Gelap / Terang</p>
                      <p className="settings-help">Pilih tampilan gelap untuk kenyamanan mata di malam hari.</p>
                    </div>
                    <button
                      type="button"
                      className="settings-contrast-toggle"
                      onClick={() => {
                        setDark(!dark);
                        triggerToast();
                      }}
                    >
                      {dark ? "🌙 Mode Gelap" : "☀️ Mode Terang"}
                    </button>
                  </div>

                  <div className="settings-row">
                    <div>
                      <p className="settings-label">Warna Aksen Halaman</p>
                      <p className="settings-help">Warna tema personalisasi background kartu dan aksen.</p>
                    </div>
                    <div className="settings-color-picker">
                      {colorThemes.map((theme) => (
                        <button
                          key={theme.name}
                          type="button"
                          className={`settings-color-swatch ${selectedColor === theme.color ? "active" : ""}`}
                          style={{ backgroundColor: theme.color }}
                          onClick={() => {
                            setSelectedColor(theme.color);
                            triggerToast();
                          }}
                          aria-label={`Pilih tema ${theme.name}`}
                          title={theme.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="settings-section">
                  <p className="settings-section-title">NOTIFIKASI</p>
                  <div className="settings-row">
                    <div>
                      <p className="settings-label">Notifikasi Desktop Browser</p>
                      <p className="settings-help">Kirim pemberitahuan saat sesi fokus atau istirahat selesai.</p>
                    </div>
                    <button
                      type="button"
                      className={`settings-contrast-toggle ${notificationsEnabled ? "active" : ""}`}
                      onClick={async () => {
                        if (!notificationsEnabled && "Notification" in window) {
                          const permission = await Notification.requestPermission();
                          if (permission === "granted") {
                            setNotificationsEnabled(true);
                            triggerToast();
                          }
                        } else {
                          setNotificationsEnabled(!notificationsEnabled);
                          triggerToast();
                        }
                      }}
                    >
                      {notificationsEnabled ? "Aktif" : "Nonaktif"}
                    </button>
                  </div>
                </div>

                <div className="settings-section">
                  <p className="settings-section-title">BAHASA &amp; FORMAT WAKTU</p>
                  <div className="settings-row">
                    <div>
                      <p className="settings-label">
                        Bahasa Antarmuka{" "}
                        <span style={{ fontSize: 10, background: "var(--accent)", color: "#fff", padding: "1px 5px", borderRadius: 4, marginLeft: 6, fontWeight: 700 }}>
                          SEGERA HADIR
                        </span>
                      </p>
                      <p className="settings-help">Pilih bahasa aplikasi untuk kenyamanan kerja kamu (saat ini aktif dalam Bahasa Indonesia).</p>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        className={`settings-contrast-toggle ${language === "id" ? "active" : ""}`}
                        onClick={() => {
                          setLanguage("id");
                          handleUpdateExtraSetting("language", "id");
                        }}
                      >
                        🇮🇩 Indonesia
                      </button>
                      <button
                        type="button"
                        className={`settings-contrast-toggle ${language === "en" ? "active" : ""}`}
                        onClick={() => {
                          setLanguage("en");
                          handleUpdateExtraSetting("language", "en");
                        }}
                      >
                        🇬🇧 English <small>(Soon)</small>
                      </button>
                    </div>
                  </div>

                  <div className="settings-row">
                    <div>
                      <p className="settings-label">Format Jam &amp; Waktu</p>
                      <p className="settings-help">Tampilan jam di kalender, timer, dan kartu tenggat waktu.</p>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        className={`settings-contrast-toggle ${timeFormat === "24" ? "active" : ""}`}
                        onClick={() => {
                          setTimeFormat("24");
                          handleUpdateExtraSetting("timeFormat", "24");
                        }}
                      >
                        24 Jam (14:30)
                      </button>
                      <button
                        type="button"
                        className={`settings-contrast-toggle ${timeFormat === "12" ? "active" : ""}`}
                        onClick={() => {
                          setTimeFormat("12");
                          handleUpdateExtraSetting("timeFormat", "12");
                        }}
                      >
                        12 Jam (02:30 PM)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="settings-section">
                  <p className="settings-section-title">GAYA LAYAR LOADING (SPLASH SCREEN)</p>
                  <p className="settings-help" style={{ marginBottom: 14 }}>
                    Pilih animasi tampilan pembuka (startup) aplikasi sesuai preferensi estetikamu:
                  </p>
                  <div className="settings-loading-style-grid">
                    <button
                      type="button"
                      className={`settings-loading-card ${loadingStyle === "minimal" ? "active" : ""}`}
                      onClick={() => {
                        setLoadingStyle("minimal");
                        handleUpdateExtraSetting("loadingStyle", "minimal");
                        try {
                          localStorage.setItem("biarfokus.loading_style", "minimal");
                        } catch {}
                      }}
                    >
                      <div className="settings-loading-preview preview-minimal">
                        <span className="preview-logo-icon">⚡</span>
                        <div className="preview-rainbow-bar" />
                      </div>
                      <div className="settings-loading-meta">
                        <span className="settings-loading-title">Minimalis (Pelangi Dinamis)</span>
                        <span className="settings-loading-desc">Hanya logo besar dengan bar pelangi tipis tanpa teks.</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`settings-loading-card ${loadingStyle === "pro" ? "active" : ""}`}
                      onClick={() => {
                        setLoadingStyle("pro");
                        handleUpdateExtraSetting("loadingStyle", "pro");
                        try {
                          localStorage.setItem("biarfokus.loading_style", "pro");
                        } catch {}
                      }}
                    >
                      <div className="settings-loading-preview preview-pro">
                        <span className="preview-pro-sparkle">✨</span>
                        <span className="preview-pro-badge">PRO LUXURY</span>
                      </div>
                      <div className="settings-loading-meta">
                        <span className="settings-loading-title">Pro Aurora (Layar Gelap &amp; Laser Mewah)</span>
                        <span className="settings-loading-desc">Layar gelap immersif unboxed, ambient aurora glow, dan laser neon dinamis.</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`settings-loading-card ${loadingStyle === "classic" ? "active" : ""}`}
                      onClick={() => {
                        setLoadingStyle("classic");
                        handleUpdateExtraSetting("loadingStyle", "classic");
                        try {
                          localStorage.setItem("biarfokus.loading_style", "classic");
                        } catch {}
                      }}
                    >
                      <div className="settings-loading-preview preview-classic">
                        <span className="preview-classic-icon">🏛️</span>
                        <span className="preview-classic-text">&ldquo;Fokus...&rdquo;</span>
                      </div>
                      <div className="settings-loading-meta">
                        <span className="settings-loading-title">Klasik (BiarFokus Orisinal)</span>
                        <span className="settings-loading-desc">Kartu fokus minimalis dengan kutipan produktivitas harian.</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="settings-section">
                  <p className="settings-section-title">STATUS APLIKASI</p>
                  <div className="settings-row">
                    <div>
                      <p className="settings-label">Penyimpanan Workspace</p>
                      <p className="settings-help">Sinkronisasi otomatis cloud Supabase dan cache lokal browser.</p>
                    </div>
                    <span className="settings-badge-ok">
                      {user ? "Tersambung Cloud" : "Mode Tamu Lokal"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: POMODORO / TIMER */}
            {activeTab === "pomodoro" && (
              <div className="settings-tab-pane">
                <div className="settings-section">
                  <p className="settings-section-title">PRESET DURASI FOKUS CEPAT</p>
                  <div className="settings-preset-buttons">
                    <button
                      type="button"
                      className="settings-contrast-btn"
                      onClick={() => {
                        setTimerDurations(presetClassic);
                        triggerToast();
                      }}
                    >
                      Klasik (25 / 5 / 15m)
                    </button>
                    <button
                      type="button"
                      className="settings-contrast-btn"
                      onClick={() => {
                        setTimerDurations(presetDeepWork);
                        triggerToast();
                      }}
                    >
                      Deep Work (50 / 10 / 30m)
                    </button>
                    <button
                      type="button"
                      className="settings-contrast-btn"
                      onClick={() => {
                        setTimerDurations(presetSprint);
                        triggerToast();
                      }}
                    >
                      Sprint (15 / 3 / 10m)
                    </button>
                  </div>
                </div>

                <div className="settings-section">
                  <p className="settings-section-title">KUSTOMISASI DURASI (MENIT)</p>
                  <div className="settings-durations-grid">
                    <div className="settings-duration-input-card">
                      <label htmlFor="custom-pomo">⏱️ Pomodoro</label>
                      <input
                        id="custom-pomo"
                        type="number"
                        min="1"
                        max="180"
                        value={customPomoMin}
                        onChange={(e) => setCustomPomoMin(Number(e.target.value))}
                        onBlur={() => handleApplyCustomMinutes(customPomoMin, customShortMin, customLongMin)}
                      />
                      <small>menit</small>
                    </div>
                    <div className="settings-duration-input-card">
                      <label htmlFor="custom-short">☕ Istirahat Pendek</label>
                      <input
                        id="custom-short"
                        type="number"
                        min="1"
                        max="60"
                        value={customShortMin}
                        onChange={(e) => setCustomShortMin(Number(e.target.value))}
                        onBlur={() => handleApplyCustomMinutes(customPomoMin, customShortMin, customLongMin)}
                      />
                      <small>menit</small>
                    </div>
                    <div className="settings-duration-input-card">
                      <label htmlFor="custom-long">🌴 Istirahat Panjang</label>
                      <input
                        id="custom-long"
                        type="number"
                        min="1"
                        max="120"
                        value={customLongMin}
                        onChange={(e) => setCustomLongMin(Number(e.target.value))}
                        onBlur={() => handleApplyCustomMinutes(customPomoMin, customShortMin, customLongMin)}
                      />
                      <small>menit</small>
                    </div>
                  </div>
                </div>

                <div className="settings-section">
                  <p className="settings-section-title">SUARA ALARM &amp; AUDIO</p>
                  <div className="settings-row">
                    <div>
                      <p className="settings-label">Pilihan Suara Alarm</p>
                      <p className="settings-help">Nada saat sesi fokus selesai.</p>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <select
                        value={alarmSound}
                        onChange={(e) => {
                          setAlarmSound(e.target.value as AlarmSoundType);
                          triggerToast();
                        }}
                        className="settings-select"
                      >
                        {ALARM_SOUND_OPTIONS.map((opt) => (
                          <option key={opt.type} value={opt.type}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="settings-contrast-btn"
                        onClick={toggleAlarmPreview}
                        style={{ padding: "6px 12px", fontSize: 12 }}
                      >
                        {isPlayingPreview ? "⏹ Stop" : "▶ Test"}
                      </button>
                    </div>
                  </div>

                  <div className="settings-row">
                    <div>
                      <p className="settings-label">Ulangi Bunyi Alarm</p>
                      <p className="settings-help">Alarm berbunyi 3 kali berturut-turut.</p>
                    </div>
                    <button
                      type="button"
                      className={`settings-contrast-toggle ${repeatAlarm ? "active" : ""}`}
                      onClick={() => {
                        setRepeatAlarm(!repeatAlarm);
                        triggerToast();
                      }}
                    >
                      {repeatAlarm ? "Aktif" : "Mati"}
                    </button>
                  </div>

                  <div className="settings-row">
                    <div>
                      <p className="settings-label">Detik Jam Ticking</p>
                      <p className="settings-help">Bunyi detik halus saat timer berjalan.</p>
                    </div>
                    <button
                      type="button"
                      className={`settings-contrast-toggle ${tickingSoundEnabled ? "active" : ""}`}
                      onClick={() => {
                        setTickingSoundEnabled(!tickingSoundEnabled);
                        triggerToast();
                      }}
                    >
                      {tickingSoundEnabled ? "Aktif" : "Mati"}
                    </button>
                  </div>
                </div>

                <div className="settings-section">
                  <p className="settings-section-title">ALUR OTOMATIS &amp; TARGET</p>
                  <div className="settings-row">
                    <div>
                      <p className="settings-label">Otomatis Lanjut Sesi</p>
                      <p className="settings-help">Langsung mulai hitung mundur saat transisi mode.</p>
                    </div>
                    <button
                      type="button"
                      className={`settings-contrast-toggle ${autoStart ? "active" : ""}`}
                      onClick={() => {
                        setAutoStart(!autoStart);
                        triggerToast();
                      }}
                    >
                      {autoStart ? "Aktif" : "Mati"}
                    </button>
                  </div>

                  <div className="settings-row">
                    <div>
                      <p className="settings-label">Interval Istirahat Panjang</p>
                      <p className="settings-help">Istirahat panjang setiap berapa kali sesi fokus?</p>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[2, 3, 4, 5].map((count) => (
                        <button
                          key={count}
                          type="button"
                          className={`settings-contrast-toggle ${longBreakInterval === count ? "active" : ""}`}
                          onClick={() => {
                            setLongBreakInterval(count);
                            triggerToast();
                          }}
                        >
                          {count}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="settings-row">
                    <div>
                      <p className="settings-label">Target Pomodoro Harian</p>
                      <p className="settings-help">Jumlah tomat target untuk dicapai setiap hari.</p>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[4, 6, 8, 10, 12].map((goal) => (
                        <button
                          key={goal}
                          type="button"
                          className={`settings-contrast-toggle ${dailyGoalPomodoros === goal ? "active" : ""}`}
                          onClick={() => {
                            setDailyGoalPomodoros(goal);
                            triggerToast();
                          }}
                        >
                          {goal} 🍅
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CATATAN & TODO */}
            {activeTab === "catatan" && (
              <div className="settings-tab-pane">
                <div className="settings-section">
                  <p className="settings-section-title">TAMPILAN CATATAN</p>
                  <div className="settings-row">
                    <div>
                      <p className="settings-label">Layout Default Grid / List</p>
                      <p className="settings-help">Susunan kartu catatan di ruang kerja Catatan &amp; Todo.</p>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        className={`settings-contrast-toggle ${notesDefaultView === "grid" ? "active" : ""}`}
                        onClick={() => {
                          setNotesDefaultView("grid");
                          handleUpdateExtraSetting("notesDefaultView", "grid");
                        }}
                      >
                        🗂️ Grid (Kartu)
                      </button>
                      <button
                        type="button"
                        className={`settings-contrast-toggle ${notesDefaultView === "list" ? "active" : ""}`}
                        onClick={() => {
                          setNotesDefaultView("list");
                          handleUpdateExtraSetting("notesDefaultView", "list");
                        }}
                      >
                        📑 Baris (List)
                      </button>
                    </div>
                  </div>

                  <div className="settings-row">
                    <div>
                      <p className="settings-label">Konfirmasi Sebelum Menghapus</p>
                      <p className="settings-help">Minta konfirmasi dialog saat tombol hapus catatan diklik.</p>
                    </div>
                    <button
                      type="button"
                      className={`settings-contrast-toggle ${notesConfirmDelete ? "active" : ""}`}
                      onClick={() => {
                        const val = !notesConfirmDelete;
                        setNotesConfirmDelete(val);
                        handleUpdateExtraSetting("notesConfirmDelete", val);
                      }}
                    >
                      {notesConfirmDelete ? "Wajib Konfirmasi" : "Langsung Hapus"}
                    </button>
                  </div>
                </div>

                <div className="settings-section">
                  <p className="settings-section-title">PENYIMPANAN &amp; EKSPOR</p>
                  <div className="settings-row">
                    <div>
                      <p className="settings-label">Auto-copy Teks Catatan Selesai</p>
                      <p className="settings-help">Salin checklist yang selesai ke papan klip secara otomatis.</p>
                    </div>
                    <button
                      type="button"
                      className={`settings-contrast-toggle ${notesAutoCopy ? "active" : ""}`}
                      onClick={() => {
                        const val = !notesAutoCopy;
                        setNotesAutoCopy(val);
                        handleUpdateExtraSetting("notesAutoCopy", val);
                      }}
                    >
                      {notesAutoCopy ? "Aktif" : "Nonaktif"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: KALENDER */}
            {activeTab === "kalender" && (
              <div className="settings-tab-pane">
                <div className="settings-section">
                  <p className="settings-section-title">TAMPILAN AWAL KALENDER</p>
                  <div className="settings-row">
                    <div>
                      <p className="settings-label">Mode Default Kalender</p>
                      <p className="settings-help">Tampilan yang dibuka pertama kali di halaman Kalender.</p>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        className={`settings-contrast-toggle ${calendarDefaultView === "day" ? "active" : ""}`}
                        onClick={() => {
                          setCalendarDefaultView("day");
                          handleUpdateExtraSetting("calendarDefaultView", "day");
                        }}
                      >
                        Hari
                      </button>
                      <button
                        type="button"
                        className={`settings-contrast-toggle ${calendarDefaultView === "week" ? "active" : ""}`}
                        onClick={() => {
                          setCalendarDefaultView("week");
                          handleUpdateExtraSetting("calendarDefaultView", "week");
                        }}
                      >
                        Minggu
                      </button>
                      <button
                        type="button"
                        className={`settings-contrast-toggle ${calendarDefaultView === "month" ? "active" : ""}`}
                        onClick={() => {
                          setCalendarDefaultView("month");
                          handleUpdateExtraSetting("calendarDefaultView", "month");
                        }}
                      >
                        Bulan
                      </button>
                    </div>
                  </div>

                  <div className="settings-row">
                    <div>
                      <p className="settings-label">Durasi Default Event Baru</p>
                      <p className="settings-help">Durasi waktu awal saat klik di kalender (menit).</p>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[15, 30, 60].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          className={`settings-contrast-toggle ${calendarDefaultDuration === mins ? "active" : ""}`}
                          onClick={() => {
                            setCalendarDefaultDuration(mins);
                            handleUpdateExtraSetting("calendarDefaultDuration", mins);
                          }}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="settings-section">
                  <p className="settings-section-title">PENGELOLAAN &amp; INTEGRASI JADWAL</p>
                  <div className="settings-row">
                    <div>
                      <p className="settings-label">Konfirmasi Hapus Event</p>
                      <p className="settings-help">Tampilkan konfirmasi sebelum jadwal dihapus permanen.</p>
                    </div>
                    <button
                      type="button"
                      className={`settings-contrast-toggle ${calendarConfirmDelete ? "active" : ""}`}
                      onClick={() => {
                        const val = !calendarConfirmDelete;
                        setCalendarConfirmDelete(val);
                        handleUpdateExtraSetting("calendarConfirmDelete", val);
                      }}
                    >
                      {calendarConfirmDelete ? "Wajib Konfirmasi" : "Langsung Hapus"}
                    </button>
                  </div>

                  <div className="settings-row">
                    <div>
                      <p className="settings-label">Integrasi Jadwal ke Kanban</p>
                      <p className="settings-help">Otomatis sinkronisasi event kalender yang terhubung kartu kanban.</p>
                    </div>
                    <button
                      type="button"
                      className={`settings-contrast-toggle ${calendarKanbanSync ? "active" : ""}`}
                      onClick={() => {
                        const val = !calendarKanbanSync;
                        setCalendarKanbanSync(val);
                        handleUpdateExtraSetting("calendarKanbanSync", val);
                      }}
                    >
                      {calendarKanbanSync ? "Aktif" : "Nonaktif"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: KANBAN */}
            {activeTab === "kanban" && (
              <div className="settings-tab-pane">
                <div className="settings-section">
                  <p className="settings-section-title">PENGATURAN KARTU &amp; PAPAN PROYEK</p>
                  <div className="settings-row">
                    <div>
                      <p className="settings-label">Konfirmasi Hapus Kartu</p>
                      <p className="settings-help">Tampilkan peringatan saat kartu kanban dihapus.</p>
                    </div>
                    <button
                      type="button"
                      className={`settings-contrast-toggle ${kanbanConfirmDelete ? "active" : ""}`}
                      onClick={() => {
                        const val = !kanbanConfirmDelete;
                        setKanbanConfirmDelete(val);
                        handleUpdateExtraSetting("kanbanConfirmDelete", val);
                      }}
                    >
                      {kanbanConfirmDelete ? "Wajib Konfirmasi" : "Langsung Hapus"}
                    </button>
                  </div>

                  <div className="settings-row">
                    <div>
                      <p className="settings-label">Tampilkan PIC / Penanggung Jawab</p>
                      <p className="settings-help">Tampilkan avatar PIC di kartu kanban depan.</p>
                    </div>
                    <button
                      type="button"
                      className={`settings-contrast-toggle ${kanbanShowPIC ? "active" : ""}`}
                      onClick={() => {
                        const val = !kanbanShowPIC;
                        setKanbanShowPIC(val);
                        handleUpdateExtraSetting("kanbanShowPIC", val);
                      }}
                    >
                      {kanbanShowPIC ? "Tampilkan" : "Sembunyikan"}
                    </button>
                  </div>

                  <div className="settings-row">
                    <div>
                      <p className="settings-label">Tampilkan Tanggal Tenggat (Due Date)</p>
                      <p className="settings-help">Beri penanda warna status tenggat di kartu kanban.</p>
                    </div>
                    <button
                      type="button"
                      className={`settings-contrast-toggle ${kanbanShowDueDate ? "active" : ""}`}
                      onClick={() => {
                        const val = !kanbanShowDueDate;
                        setKanbanShowDueDate(val);
                        handleUpdateExtraSetting("kanbanShowDueDate", val);
                      }}
                    >
                      {kanbanShowDueDate ? "Tampilkan" : "Sembunyikan"}
                    </button>
                  </div>
                </div>

                <div className="settings-section">
                  <p className="settings-section-title">FITUR WORKFLOW PRODUKTIVITAS</p>
                  <div className="settings-row">
                    <div>
                      <p className="settings-label">Integrasi Eat Your Frog</p>
                      <p className="settings-help">Sorot kartu penting dengan badge katak prioritas.</p>
                    </div>
                    <button
                      type="button"
                      className={`settings-contrast-toggle ${kanbanFrogIntegration ? "active" : ""}`}
                      onClick={() => {
                        const val = !kanbanFrogIntegration;
                        setKanbanFrogIntegration(val);
                        handleUpdateExtraSetting("kanbanFrogIntegration", val);
                      }}
                    >
                      {kanbanFrogIntegration ? "Aktif" : "Nonaktif"}
                    </button>
                  </div>

                  <div className="settings-row">
                    <div>
                      <p className="settings-label">Menu Pindah Cepat di Mobile</p>
                      <p className="settings-help">Tampilkan tombol panah geser kolom langsung di kartu mobile.</p>
                    </div>
                    <button
                      type="button"
                      className={`settings-contrast-toggle ${kanbanMobileQuickMove ? "active" : ""}`}
                      onClick={() => {
                        const val = !kanbanMobileQuickMove;
                        setKanbanMobileQuickMove(val);
                        handleUpdateExtraSetting("kanbanMobileQuickMove", val);
                      }}
                    >
                      {kanbanMobileQuickMove ? "Aktif" : "Nonaktif"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Save Toast */}
        {savedToast && (
          <div className="settings-floating-save-toast">
            ✓ Pengaturan berhasil disimpan otomatis
          </div>
        )}
      </main>
    </div>
  );
}
