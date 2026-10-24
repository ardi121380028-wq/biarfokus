"use client";

import { useEffect, useState } from "react";
import type { TimerDurations, TimerMode } from "@/types/domain";
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

type SettingsModalProps = {
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
  alarmSound: AlarmSoundType;
  setAlarmSound: (sound: AlarmSoundType) => void;
  longBreakInterval: number;
  setLongBreakInterval: (interval: number) => void;
  dailyGoalPomodoros: number;
  setDailyGoalPomodoros: (goal: number) => void;
  tickingSoundEnabled: boolean;
  setTickingSoundEnabled: (enabled: boolean) => void;
  timerDurations: TimerDurations;
  setTimerDurations: (durations: TimerDurations) => void;
  initialTab?: SettingsTab;
  onClose: () => void;
};

export function SettingsModal({
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
  alarmSound,
  setAlarmSound,
  longBreakInterval,
  setLongBreakInterval,
  dailyGoalPomodoros,
  setDailyGoalPomodoros,
  tickingSoundEnabled,
  setTickingSoundEnabled,
  timerDurations,
  setTimerDurations,
  initialTab = "general",
  onClose,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Additional settings state
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
  const [loadingStyle, setLoadingStyle] = useState<"minimal" | "pro" | "classic">("classic");

  useEffect(() => {
    const s = loadLocalSettings();
    if (s.language) setLanguage(s.language);
    if (s.timeFormat) setTimeFormat(s.timeFormat);
    if (s.notesDefaultView) setNotesDefaultView(s.notesDefaultView);
    if (s.calendarDefaultView) setCalendarDefaultView(s.calendarDefaultView);
    if (s.calendarDefaultDuration) setCalendarDefaultDuration(s.calendarDefaultDuration);
    if (typeof s.calendarConfirmDelete === "boolean") setCalendarConfirmDelete(s.calendarConfirmDelete);
    if (typeof s.kanbanConfirmDelete === "boolean") setKanbanConfirmDelete(s.kanbanConfirmDelete);
    if (s.loadingStyle) setLoadingStyle(s.loadingStyle);
  }, []);

  function handleUpdateExtraSetting<K extends keyof UserSettings>(key: K, val: UserSettings[K]) {
    const current = loadLocalSettings();
    const updated = { ...current, [key]: val };
    saveLocalSettings(updated);
  }

  // Local state for custom duration inputs (in minutes)
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

  function handleClose() {
    stopAlarmSound();
    onClose();
  }

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
  }

  return (
    <div className="modal-backdrop settings-modal-backdrop" role="presentation" onClick={handleClose}>
      <section
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={handleClose} aria-label="Tutup pengaturan">
          ×
        </button>

        {/* Dedicated Native Mobile Page Header */}
        <div className="settings-mobile-page-header">
          <button type="button" className="settings-mobile-back-btn" onClick={handleClose}>
            ← Kembali
          </button>
          <span className="settings-mobile-header-title">Pengaturan</span>
          <button type="button" className="settings-mobile-done-btn" onClick={handleClose}>
            Selesai
          </button>
        </div>

        <aside className="settings-sidebar">
          <span className="settings-kicker">BiarFokus Workspace</span>
          <h2 id="settings-title">Pengaturan</h2>

          <button
            type="button"
            className={activeTab === "general" ? "settings-tab active" : "settings-tab"}
            onClick={() => setActiveTab("general")}
          >
            ⚙️ <span>General</span>
          </button>

          <button
            type="button"
            className={activeTab === "pomodoro" ? "settings-tab active" : "settings-tab"}
            onClick={() => setActiveTab("pomodoro")}
          >
            ⏱️ <span>Pomodoro / Timer</span>
          </button>

          <button
            type="button"
            className={activeTab === "catatan" ? "settings-tab active" : "settings-tab"}
            onClick={() => setActiveTab("catatan")}
          >
            📝 <span>Catatan</span>
          </button>

          <button
            type="button"
            className={activeTab === "kalender" ? "settings-tab active" : "settings-tab"}
            onClick={() => setActiveTab("kalender")}
          >
            📅 <span>Kalender</span>
          </button>

          <button
            type="button"
            className={activeTab === "kanban" ? "settings-tab active" : "settings-tab"}
            onClick={() => setActiveTab("kanban")}
          >
            📊 <span>Kanban</span>
          </button>
        </aside>

        <div className="settings-content">
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
                    onClick={() => setDark(!dark)}
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
                        title={name}
                        aria-label={name}
                        className={selectedColor === color ? "theme-swatch selected" : "theme-swatch"}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
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
                    <span style={{ fontWeight: 600 }}>Bahasa Antarmuka</span>
                    <p className="settings-help" style={{ margin: "2px 0 0" }}>
                      Pilih bahasa aplikasi untuk kenyamanan kerja kamu.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
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
                      🇬🇧 English
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
                    }}
                  >
                    <div className="loading-style-preview">
                      <span className="style-icon">⚡</span>
                      <div className="prev-rainbow-bar" />
                    </div>
                    <div className="loading-style-info">
                      <strong>Minimalis (Pelangi Dinamis)</strong>
                      <span>Hanya logo &amp; teks dengan bar pelangi gradasi dinamis.</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`loading-style-card ${loadingStyle === "pro" ? "active" : ""}`}
                    onClick={() => {
                      setLoadingStyle("pro");
                      handleUpdateExtraSetting("loadingStyle", "pro");
                    }}
                  >
                    <div className="loading-style-preview pro-prev">
                      <span className="style-icon">✨</span>
                      <span className="prev-pro-pill">PRO ⭐</span>
                    </div>
                    <div className="loading-style-info">
                      <strong>Pro Aurora (Glassmorphism Mewah)</strong>
                      <span>Aura gelap bercahaya, badge Pro gold, dan ring pulse.</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`loading-style-card ${loadingStyle === "classic" ? "active" : ""}`}
                    onClick={() => {
                      setLoadingStyle("classic");
                      handleUpdateExtraSetting("loadingStyle", "classic");
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
                  <span className="settings-badge-ok">Tersambung Cloud</span>
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
                  <p className="settings-section-title">SIKLUS & TARGET</p>
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
                          onClick={() => setLongBreakInterval(count)}
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
                          onClick={() => setDailyGoalPomodoros(count)}
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
                  <p className="settings-section-title">SUARA & ALARM</p>

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
                      onClick={() => setSoundEnabled(!soundEnabled)}
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
                      onClick={() => setRepeatAlarm(!repeatAlarm)}
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
                      onClick={() => setTickingSoundEnabled(!tickingSoundEnabled)}
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
                      onClick={() => setAutoStart(!autoStart)}
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
                          onClick={() => setAlarmSound(opt.type)}
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
                    onClick={() => setNotesConfirmDelete(!notesConfirmDelete)}
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
                    onClick={() => setNotesAutoCopy(!notesAutoCopy)}
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
                    <button
                      type="button"
                      className={`settings-contrast-toggle ${calendarDefaultDuration === 15 ? "active" : ""}`}
                      onClick={() => {
                        setCalendarDefaultDuration(15);
                        handleUpdateExtraSetting("calendarDefaultDuration", 15);
                      }}
                    >
                      15m
                    </button>
                    <button
                      type="button"
                      className={`settings-contrast-toggle ${calendarDefaultDuration === 30 ? "active" : ""}`}
                      onClick={() => {
                        setCalendarDefaultDuration(30);
                        handleUpdateExtraSetting("calendarDefaultDuration", 30);
                      }}
                    >
                      30m
                    </button>
                    <button
                      type="button"
                      className={`settings-contrast-toggle ${calendarDefaultDuration === 60 ? "active" : ""}`}
                      onClick={() => {
                        setCalendarDefaultDuration(60);
                        handleUpdateExtraSetting("calendarDefaultDuration", 60);
                      }}
                    >
                      60m
                    </button>
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
                    onClick={() => setCalendarKanbanSync(!calendarKanbanSync)}
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
                      const next = !kanbanConfirmDelete;
                      setKanbanConfirmDelete(next);
                      handleUpdateExtraSetting("kanbanConfirmDelete", next);
                    }}
                  >
                    {kanbanConfirmDelete ? "Aktif" : "Nonaktif"}
                  </button>
                </div>

                <div className="setting-row" style={{ marginTop: 10 }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>Tampilkan Avatar PIC pada Kartu</span>
                    <p className="settings-help" style={{ margin: "2px 0 0" }}>
                      Tampilkan inisial atau foto penanggung jawab kartu di pojok kanan bawah.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`settings-contrast-toggle ${kanbanShowPIC ? "active" : ""}`}
                    onClick={() => setKanbanShowPIC(!kanbanShowPIC)}
                  >
                    {kanbanShowPIC ? "Aktif" : "Nonaktif"}
                  </button>
                </div>

                <div className="setting-row" style={{ marginTop: 10 }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>Tampilkan Badge Tanggal Tenggat</span>
                    <p className="settings-help" style={{ margin: "2px 0 0" }}>
                      Tampilkan tanggal jatuh tempo pada kartu proyek untuk memudahkan tracking.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`settings-contrast-toggle ${kanbanShowDueDate ? "active" : ""}`}
                    onClick={() => setKanbanShowDueDate(!kanbanShowDueDate)}
                  >
                    {kanbanShowDueDate ? "Aktif" : "Nonaktif"}
                  </button>
                </div>
              </div>

              <div className="settings-section">
                <p className="settings-section-title">FITUR WORKFLOW PRODUKTIVITAS</p>

                <div className="setting-row">
                  <div>
                    <span style={{ fontWeight: 600 }}>Integrasi Tombol Eat Your Frog 🐸</span>
                    <p className="settings-help" style={{ margin: "2px 0 0" }}>
                      Shortcut 1-klik untuk menjadikan kartu tugas prioritas sebagai fokus harian utama.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`settings-contrast-toggle ${kanbanFrogIntegration ? "active" : ""}`}
                    onClick={() => setKanbanFrogIntegration(!kanbanFrogIntegration)}
                  >
                    {kanbanFrogIntegration ? "Aktif" : "Nonaktif"}
                  </button>
                </div>

                <div className="setting-row" style={{ marginTop: 10 }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>Tombol Pindah Cepat Kolom di Mobile</span>
                    <p className="settings-help" style={{ margin: "2px 0 0" }}>
                      Tombol ⇄ mempermudah pindah kolom antar To Do / In Progress / Done di HP.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`settings-contrast-toggle ${kanbanMobileQuickMove ? "active" : ""}`}
                    onClick={() => setKanbanMobileQuickMove(!kanbanMobileQuickMove)}
                  >
                    {kanbanMobileQuickMove ? "Aktif" : "Nonaktif"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Settings Footer */}
          <div className="settings-footer">
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Perubahan tersimpan otomatis</span>
            <button
              type="button"
              className="settings-contrast-btn close-btn"
              onClick={handleClose}
            >
              Simpan & Tutup
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
