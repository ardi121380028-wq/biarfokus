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
    setInfoOpen,
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

  function triggerToast() {
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 2000);
  }

  function handleUpdateExtraSetting<K extends keyof UserSettings>(key: K, val: UserSettings[K]) {
    const current = loadLocalSettings();
    const updated = { ...current, [key]: val };
    saveLocalSettings(updated);
    triggerToast();
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

      {/* Main Settings Content Area */}
      <main className="notes-workspace-main settings-workspace-main">
        {/* Top Header */}
        <header className="notes-workspace-topbar settings-page-topbar">
          <div className="cal-topbar-left">
            <button
              type="button"
              className="cal-topbar-hamburger-btn"
              onClick={toggleSidebar}
              aria-label="Toggle Sidebar"
              title="Buka / Tutup sidebar"
            >
              ☰
            </button>
            <span className="notes-topbar-title">Pengaturan</span>
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
          <div className="settings-page-card settings-content" style={{ padding: "32px 36px" }}>
            {/* TAB 1: GENERAL */}
            {activeTab === "general" && (
              <>
                <div className="settings-section">
                  <p className="settings-section-title">TEMA TAMPILAN</p>
                  <div className="setting-row">
                    <div>
                      <span style={{ fontWeight: 600 }}>Mode Gelap / Terang</span>
                      <p className="settings-help" style={{ margin: "2px 0 0" }}>
                        Pilih tampilan gelap untuk kenyamanan mata di malam hari.
                      </p>
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

                  <div className="setting-row" style={{ marginTop: 12 }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>Warna Aksen Halaman</span>
                      <p className="settings-help" style={{ margin: "2px 0 0" }}>
                        Warna tema personalisasi background kartu dan aksen.
                      </p>
                    </div>
                    <div className="theme-options">
                      {colorThemes.map(({ color, name }) => (
                        <button
                          key={color}
                          type="button"
                          title={name}
                          aria-label={name}
                          className={selectedColor === color ? "theme-swatch selected" : "theme-swatch"}
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            setSelectedColor(color);
                            triggerToast();
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="settings-section">
                  <p className="settings-section-title">NOTIFIKASI</p>
                  <div className="setting-row">
                    <div>
                      <span style={{ fontWeight: 600 }}>Notifikasi Desktop Browser</span>
                      <p className="settings-help" style={{ margin: "2px 0 0" }}>
                        Kirim pemberitahuan saat sesi fokus atau istirahat selesai.
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`settings-contrast-toggle ${notificationsEnabled ? "active" : ""}`}
                      onClick={async () => {
                        if (!notificationsEnabled && typeof Notification !== "undefined" && Notification.permission === "default") {
                          const permission = await Notification.requestPermission();
                          setNotificationsEnabled(permission === "granted");
                        } else {
                          setNotificationsEnabled(!notificationsEnabled);
                        }
                        triggerToast();
                      }}
                    >
                      {notificationsEnabled ? "Aktif" : "Nonaktif"}
                    </button>
                  </div>
                </div>

                <div className="settings-section">
                  <p className="settings-section-title">BAHASA &amp; FORMAT WAKTU</p>
                  <div className="setting-row">
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 600 }}>Bahasa Antarmuka</span>
                        <span className="settings-coming-soon-pill">Segera Hadir</span>
                      </div>
                      <p className="settings-help" style={{ margin: "2px 0 0" }}>
                        Pilih bahasa aplikasi untuk kenyamanan kerja kamu (saat ini aktif dalam Bahasa Indonesia).
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button
                        type="button"
                        className="settings-contrast-toggle active"
                        title="Bahasa aktif: Indonesia"
                        onClick={() => {
                          setLanguage("id");
                          handleUpdateExtraSetting("language", "id");
                        }}
                      >
                        🇮🇩 Indonesia
                      </button>
                      <button
                        type="button"
                        className="settings-contrast-toggle"
                        style={{ opacity: 0.65, cursor: "pointer" }}
                        onClick={() => {
                          setInfoOpen?.(
                            "Dukungan antarmuka bahasa Inggris sedang disiapkan dan akan segera hadir di pembaruan berikutnya!"
                          );
                        }}
                        title="Dukungan bahasa Inggris segera hadir (Coming Soon)"
                      >
                        🇬🇧 English <span style={{ fontSize: "10px", marginLeft: "4px", color: "var(--muted)", fontWeight: 600 }}>(Soon)</span>
                      </button>
                    </div>
                  </div>

                  <div className="setting-row" style={{ marginTop: 10 }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>Format Jam &amp; Waktu</span>
                      <p className="settings-help" style={{ margin: "2px 0 0" }}>
                        Tampilan jam di kalender, timer, dan kartu tenggat waktu.
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
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
                  <p className="settings-help" style={{ margin: "0 0 12px" }}>
                    Pilih animasi tampilan pembuka (startup) aplikasi sesuai preferensi estetikamu:
                  </p>

                  <div className="loading-styles-grid">
                    <button
                      type="button"
                      className={`loading-style-card ${loadingStyle === "minimal" ? "active" : ""}`}
                      onClick={() => {
                        setLoadingStyle("minimal");
                        handleUpdateExtraSetting("loadingStyle", "minimal");
                        try {
                          localStorage.setItem("biarfokus.loading_style", "minimal");
                        } catch {}
                      }}
                    >
                      <div className="loading-style-preview">
                        <span className="style-icon">⚡</span>
                        <div className="prev-rainbow-bar" />
                      </div>
                      <div className="loading-style-info">
                        <strong>Minimalis (Pelangi Dinamis)</strong>
                        <span>Hanya logo besar dengan bar pelangi tipis tanpa teks.</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`loading-style-card ${loadingStyle === "pro" ? "active" : ""}`}
                      onClick={() => {
                        setLoadingStyle("pro");
                        handleUpdateExtraSetting("loadingStyle", "pro");
                        try {
                          localStorage.setItem("biarfokus.loading_style", "pro");
                        } catch {}
                      }}
                    >
                      <div className="loading-style-preview pro-prev">
                        <span className="style-icon">✨</span>
                        <span className="prev-pro-pill">PRO LUXURY</span>
                      </div>
                      <div className="loading-style-info">
                        <strong>Pro Aurora (Layar Gelap &amp; Laser Mewah)</strong>
                        <span>Layar gelap immersif unboxed, ambient aurora glow, dan laser neon dinamis.</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`loading-style-card ${loadingStyle === "classic" ? "active" : ""}`}
                      onClick={() => {
                        setLoadingStyle("classic");
                        handleUpdateExtraSetting("loadingStyle", "classic");
                        try {
                          localStorage.setItem("biarfokus.loading_style", "classic");
                        } catch {}
                      }}
                    >
                      <div className="loading-style-preview classic-prev">
                        <span className="style-icon">🏛️</span>
                        <span className="prev-classic-text">&ldquo;Fokus...&rdquo;</span>
                      </div>
                      <div className="loading-style-info">
                        <strong>Klasik (BiarFokus Orisinal)</strong>
                        <span>Kartu fokus minimalis dengan kutipan produktivitas harian.</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="settings-section">
                  <p className="settings-section-title">STATUS APLIKASI</p>
                  <div className="setting-row">
                    <div>
                      <span style={{ fontWeight: 600 }}>Penyimpanan Workspace</span>
                      <p className="settings-help" style={{ margin: "2px 0 0" }}>
                        Sinkronisasi otomatis cloud Supabase dan cache lokal browser.
                      </p>
                    </div>
                    <span className="settings-badge-ok">
                      {user ? "Tersambung Cloud" : "Mode Tamu Lokal"}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: POMODORO / TIMER */}
            {activeTab === "pomodoro" && (
              <div className="settings-pomodoro-layout">
                {/* Left Column: Durations, Presets & Cycles */}
                <div className="settings-pomodoro-col">
                  {/* Custom Durations Section */}
                  <div className="settings-section">
                    <p className="settings-section-title">CUSTOM WAKTU FOKUS (MENIT)</p>
                    <p className="settings-help" style={{ margin: "0 0 10px" }}>
                      Tentukan durasi bebas sesuai ritme kerja kamu.
                    </p>

                    <div className="settings-custom-durations-grid">
                      <div className="duration-input-box">
                        <label htmlFor="pomo-input">Fokus (Pomodoro)</label>
                        <div className="duration-input-stepper">
                          <input
                            id="pomo-input"
                            type="number"
                            min={1}
                            max={180}
                            value={customPomoMin}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10) || 1;
                              handleApplyCustomMinutes(v, customShortMin, customLongMin);
                            }}
                          />
                          <span className="stepper-unit">menit</span>
                        </div>
                      </div>

                      <div className="duration-input-box">
                        <label htmlFor="short-input">Istirahat Pendek</label>
                        <div className="duration-input-stepper">
                          <input
                            id="short-input"
                            type="number"
                            min={1}
                            max={60}
                            value={customShortMin}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10) || 1;
                              handleApplyCustomMinutes(customPomoMin, v, customLongMin);
                            }}
                          />
                          <span className="stepper-unit">menit</span>
                        </div>
                      </div>

                      <div className="duration-input-box">
                        <label htmlFor="long-input">Istirahat Panjang</label>
                        <div className="duration-input-stepper">
                          <input
                            id="long-input"
                            type="number"
                            min={1}
                            max={120}
                            value={customLongMin}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10) || 1;
                              handleApplyCustomMinutes(customPomoMin, customShortMin, v);
                            }}
                          />
                          <span className="stepper-unit">menit</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div style={{ marginTop: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                        Template Durasi Cepat
                      </span>
                      <div className="settings-presets-row" style={{ marginTop: 6 }}>
                        <button
                          type="button"
                          className="settings-preset-chip"
                          onClick={() => handleApplyCustomMinutes(25, 5, 15)}
                        >
                          🎯 Klasik (25/5/15)
                        </button>
                        <button
                          type="button"
                          className="settings-preset-chip"
                          onClick={() => handleApplyCustomMinutes(50, 10, 30)}
                        >
                          🧠 Deep Work (50/10/30)
                        </button>
                        <button
                          type="button"
                          className="settings-preset-chip"
                          onClick={() => handleApplyCustomMinutes(15, 3, 10)}
                        >
                          ⚡ Kilat (15/3/10)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Interval & Daily Goal */}
                  <div className="settings-section">
                    <p className="settings-section-title">SIKLUS &amp; TARGET</p>
                    <div className="setting-row">
                      <div>
                        <span style={{ fontWeight: 600 }}>Interval Istirahat Panjang</span>
                        <p className="settings-help" style={{ margin: "2px 0 0" }}>
                          Sesi istirahat panjang dimulai setiap {longBreakInterval} sesi.
                        </p>
                      </div>
                      <div className="interval-options" role="group">
                        {[2, 3, 4, 5, 6].map((count) => (
                          <button
                            key={count}
                            type="button"
                            className={longBreakInterval === count ? "interval-chip active" : "interval-chip"}
                            onClick={() => {
                              setLongBreakInterval(count);
                              triggerToast();
                            }}
                          >
                            {count} sesi
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="setting-row" style={{ marginTop: 8 }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>Target Harian Pomodoro</span>
                        <p className="settings-help" style={{ margin: "2px 0 0" }}>
                          Target: {dailyGoalPomodoros} sesi (~{Math.round(((dailyGoalPomodoros * customPomoMin) / 60) * 10) / 10} jam).
                        </p>
                      </div>
                      <div className="interval-options" role="group">
                        {[4, 6, 8, 10, 12].map((count) => (
                          <button
                            key={count}
                            type="button"
                            className={dailyGoalPomodoros === count ? "interval-chip active" : "interval-chip"}
                            onClick={() => {
                              setDailyGoalPomodoros(count);
                              triggerToast();
                            }}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Sound, Alarms & Audio Tone Cards */}
                <div className="settings-pomodoro-col">
                  {/* Sound & Alarm */}
                  <div className="settings-section">
                    <p className="settings-section-title">SUARA &amp; ALARM</p>

                    <div className="setting-row">
                      <div>
                        <span style={{ fontWeight: 600 }}>Suara Alarm Selesai</span>
                        <p className="settings-help" style={{ margin: "2px 0 0" }}>
                          Bunyi saat waktu fokus atau istirahat berakhir.
                        </p>
                      </div>
                      <button
                        type="button"
                        className={`settings-contrast-toggle ${soundEnabled ? "active" : ""}`}
                        onClick={() => {
                          setSoundEnabled(!soundEnabled);
                          triggerToast();
                        }}
                      >
                        {soundEnabled ? "Aktif" : "Bisu"}
                      </button>
                    </div>

                    <div className="setting-row" style={{ marginTop: 8 }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>Ulangi Alarm (Repeat Alarm)</span>
                        <p className="settings-help" style={{ margin: "2px 0 0" }}>
                          Terus berbunyi berulang sampai timer diklik.
                        </p>
                      </div>
                      <button
                        type="button"
                        className={`settings-contrast-toggle ${repeatAlarm ? "active" : ""}`}
                        onClick={() => {
                          setRepeatAlarm(!repeatAlarm);
                          triggerToast();
                        }}
                      >
                        {repeatAlarm ? "Aktif" : "Sekali"}
                      </button>
                    </div>

                    <div className="setting-row" style={{ marginTop: 8 }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>Detak Jam (Clock Ticking)</span>
                        <p className="settings-help" style={{ margin: "2px 0 0" }}>
                          Detik lembut setiap detik timer aktif.
                        </p>
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

                    <div className="setting-row" style={{ marginTop: 8 }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>Mulai Otomatis Sesi</span>
                        <p className="settings-help" style={{ margin: "2px 0 0" }}>
                          Langsung mulai istirahat saat fokus selesai.
                        </p>
                      </div>
                      <button
                        type="button"
                        className={`settings-contrast-toggle ${autoStart ? "active" : ""}`}
                        onClick={() => {
                          setAutoStart(!autoStart);
                          triggerToast();
                        }}
                      >
                        {autoStart ? "Aktif" : "Manual"}
                      </button>
                    </div>

                    {/* Alarm Sound Picker */}
                    <div style={{ marginTop: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                        Pilihan Nada Alarm
                      </span>
                      <div className="alarm-options" role="radiogroup" style={{ marginTop: 6 }}>
                        {ALARM_SOUND_OPTIONS.map((opt) => (
                          <button
                            key={opt.type}
                            type="button"
                            role="radio"
                            aria-checked={alarmSound === opt.type}
                            className={alarmSound === opt.type ? "alarm-option-card active" : "alarm-option-card"}
                            onClick={() => {
                              setAlarmSound(opt.type);
                              triggerToast();
                            }}
                          >
                            <div className="alarm-option-header">
                              <strong>{opt.label}</strong>
                              {alarmSound === opt.type && <span className="alarm-check">✓ Dipilih</span>}
                            </div>
                            <p>{opt.description}</p>
                          </button>
                        ))}
                      </div>

                      <div className="alarm-test-wrap" style={{ marginTop: 10 }}>
                        <button
                          type="button"
                          className={`settings-contrast-btn ${isPlayingPreview ? "playing" : ""}`}
                          onClick={toggleAlarmPreview}
                        >
                          {isPlayingPreview ? "⏹ Hentikan Bunyi" : "▶ Uji Nada Alarm"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CATATAN */}
            {activeTab === "catatan" && (
              <>
                <div className="settings-section">
                  <p className="settings-section-title">TAMPILAN &amp; TATA LETAK CATATAN</p>
                  <div className="setting-row">
                    <div>
                      <span style={{ fontWeight: 600 }}>Tampilan Default Catatan</span>
                      <p className="settings-help" style={{ margin: "2px 0 0" }}>
                        Pilih format kisi kartu atau daftar vertikal saat membuka catatan.
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className={`settings-contrast-toggle ${notesDefaultView === "grid" ? "active" : ""}`}
                        onClick={() => {
                          setNotesDefaultView("grid");
                          handleUpdateExtraSetting("notesDefaultView", "grid");
                        }}
                      >
                        ⊞ Grid Kotak
                      </button>
                      <button
                        type="button"
                        className={`settings-contrast-toggle ${notesDefaultView === "list" ? "active" : ""}`}
                        onClick={() => {
                          setNotesDefaultView("list");
                          handleUpdateExtraSetting("notesDefaultView", "list");
                        }}
                      >
                        ☰ Daftar Vertikal
                      </button>
                    </div>
                  </div>

                  <div className="setting-row" style={{ marginTop: 10 }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>Konfirmasi Sebelum Hapus Catatan</span>
                      <p className="settings-help" style={{ margin: "2px 0 0" }}>
                        Tampilkan dialog peringatan konfirmasi agar catatan tidak terhapus tidak sengaja.
                      </p>
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
                      {notesConfirmDelete ? "Aktif" : "Nonaktif"}
                    </button>
                  </div>
                </div>

                <div className="settings-section">
                  <p className="settings-section-title">PENYIMPANAN &amp; EKSPOR</p>
                  <div className="setting-row">
                    <div>
                      <span style={{ fontWeight: 600 }}>Salin Teks ke Clipboard saat Ekspor</span>
                      <p className="settings-help" style={{ margin: "2px 0 0" }}>
                        Otomatis salin ringkasan catatan saat menekan tombol ekspor atau bagikan.
                      </p>
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

                  <div className="setting-row" style={{ marginTop: 10 }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>Format Ekspor PDF &amp; Markdown</span>
                      <p className="settings-help" style={{ margin: "2px 0 0" }}>
                        Mendukung ekspor langsung ke format PDF dan format teks Markdown (.md).
                      </p>
                    </div>
                    <span className="settings-badge-ok">Tersedia</span>
                  </div>
                </div>
              </>
            )}

            {/* TAB 4: KALENDER */}
            {activeTab === "kalender" && (
              <>
                <div className="settings-section">
                  <p className="settings-section-title">TAMPILAN AWAL KALENDER</p>
                  <div className="setting-row">
                    <div>
                      <span style={{ fontWeight: 600 }}>Tampilan Default Kalender</span>
                      <p className="settings-help" style={{ margin: "2px 0 0" }}>
                        Mode waktu yang otomatis terbuka pertama kali saat membuka menu Kalender.
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className={`settings-contrast-toggle ${calendarDefaultView === "day" ? "active" : ""}`}
                        onClick={() => {
                          setCalendarDefaultView("day");
                          handleUpdateExtraSetting("calendarDefaultView", "day");
                        }}
                      >
                        Hari (Day)
                      </button>
                      <button
                        type="button"
                        className={`settings-contrast-toggle ${calendarDefaultView === "week" ? "active" : ""}`}
                        onClick={() => {
                          setCalendarDefaultView("week");
                          handleUpdateExtraSetting("calendarDefaultView", "week");
                        }}
                      >
                        Minggu (Week)
                      </button>
                      <button
                        type="button"
                        className={`settings-contrast-toggle ${calendarDefaultView === "month" ? "active" : ""}`}
                        onClick={() => {
                          setCalendarDefaultView("month");
                          handleUpdateExtraSetting("calendarDefaultView", "month");
                        }}
                      >
                        Bulan (Month)
                      </button>
                    </div>
                  </div>

                  <div className="setting-row" style={{ marginTop: 10 }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>Durasi Standar Jadwal Baru</span>
                      <p className="settings-help" style={{ margin: "2px 0 0" }}>
                        Durasi bawaan saat mengklik kalender untuk menambah acara baru.
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
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
                  <div className="setting-row">
                    <div>
                      <span style={{ fontWeight: 600 }}>Konfirmasi Sebelum Hapus Jadwal</span>
                      <p className="settings-help" style={{ margin: "2px 0 0" }}>
                        Tampilkan notifikasi peringatan sebelum acara kalender dihapus permanen.
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`settings-contrast-toggle ${calendarConfirmDelete ? "active" : ""}`}
                      onClick={() => {
                        const next = !calendarConfirmDelete;
                        setCalendarConfirmDelete(next);
                        handleUpdateExtraSetting("calendarConfirmDelete", next);
                      }}
                    >
                      {calendarConfirmDelete ? "Aktif" : "Nonaktif"}
                    </button>
                  </div>

                  <div className="setting-row" style={{ marginTop: 10 }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>Integrasi Otomatis Kartu Kanban</span>
                      <p className="settings-help" style={{ margin: "2px 0 0" }}>
                        Kartu kanban yang memiliki rentang tanggal tenggat otomatis tampil di kalender.
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`settings-contrast-toggle ${calendarKanbanSync ? "active" : ""}`}
                      onClick={() => {
                        const next = !calendarKanbanSync;
                        setCalendarKanbanSync(next);
                        handleUpdateExtraSetting("calendarKanbanSync", next);
                      }}
                    >
                      {calendarKanbanSync ? "Aktif" : "Nonaktif"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* TAB 5: KANBAN */}
            {activeTab === "kanban" && (
              <>
                <div className="settings-section">
                  <p className="settings-section-title">PENGATURAN KARTU &amp; PAPAN PROYEK</p>
                  <div className="setting-row">
                    <div>
                      <span style={{ fontWeight: 600 }}>Konfirmasi Sebelum Hapus Kartu</span>
                      <p className="settings-help" style={{ margin: "2px 0 0" }}>
                        Mencegah kartu proyek tidak sengaja terhapus dengan peringatan konfirmasi.
                      </p>
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
                      {kanbanConfirmDelete ? "Aktif" : "Nonaktif"}
                    </button>
                  </div>

                  <div className="setting-row" style={{ marginTop: 10 }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>Tampilkan PIC / Penanggung Jawab</span>
                      <p className="settings-help" style={{ margin: "2px 0 0" }}>
                        Tampilkan avatar nama PIC di bagian muka kartu kanban.
                      </p>
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
                      {kanbanShowPIC ? "Aktif" : "Nonaktif"}
                    </button>
                  </div>

                  <div className="setting-row" style={{ marginTop: 10 }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>Tampilkan Tanggal Tenggat (Due Date)</span>
                      <p className="settings-help" style={{ margin: "2px 0 0" }}>
                        Tampilkan badge peringatan tanggal tenggat waktu di kartu kanban.
                      </p>
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
                      {kanbanShowDueDate ? "Aktif" : "Nonaktif"}
                    </button>
                  </div>
                </div>

                <div className="settings-section">
                  <p className="settings-section-title">INTEGRASI &amp; PRODUKTIVITAS</p>
                  <div className="setting-row">
                    <div>
                      <span style={{ fontWeight: 600 }}>Integrasi Eat Your Frog</span>
                      <p className="settings-help" style={{ margin: "2px 0 0" }}>
                        Beri tanda bintang katak dan sinkronkan tugas prioritas kanban ke daftar katak harian.
                      </p>
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

                  <div className="setting-row" style={{ marginTop: 10 }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>Pindah Cepat Kolom di Mobile</span>
                      <p className="settings-help" style={{ margin: "2px 0 0" }}>
                        Tampilkan tombol panah untuk memindahkan kartu antar kolom di smartphone tanpa drag &amp; drop.
                      </p>
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
              </>
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
