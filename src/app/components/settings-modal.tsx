"use client";

import { useEffect, useState } from "react";
import type { TimerDurations, TimerMode } from "@/types/domain";
import {
  ALARM_SOUND_OPTIONS,
  playAlarmSound,
  stopAlarmSound,
  type AlarmSoundType,
} from "@/features/audio/alarm-sound";

const focusDurations: TimerDurations = { pomodoro: 25 * 60, short: 5 * 60, long: 15 * 60 };
const deepWorkDurations: TimerDurations = { pomodoro: 50 * 60, short: 10 * 60, long: 30 * 60 };
const colorThemes = [
  { color: "#e8e8e8", name: "Cloud" },
  { color: "#f77fa5", name: "Rose" },
  { color: "#a9d63b", name: "Lime" },
  { color: "#1976df", name: "Ocean" },
  { color: "#ffc247", name: "Sun" },
  { color: "#f7c928", name: "Focus" },
];

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
  onClose,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"concentration" | "sound" | "auto" | "notification">("concentration");
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const isFocusTemplate = (Object.keys(focusDurations) as TimerMode[]).every((mode) => timerDurations[mode] === focusDurations[mode]);

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

  return (
    <div className="modal-backdrop" role="presentation" onClick={handleClose}>
      <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={handleClose} aria-label="Tutup pengaturan">×</button>
        <aside className="settings-sidebar">
          <span className="settings-kicker">BiarFokus</span>
          <h2 id="settings-title">Settings</h2>
          <button className={activeTab === "concentration" ? "settings-tab active" : "settings-tab"} onClick={() => setActiveTab("concentration")}>◷ <span>Concentration time</span></button>
          <button className={activeTab === "sound" ? "settings-tab active" : "settings-tab"} onClick={() => setActiveTab("sound")}>♧ <span>Sound & alarm</span></button>
          <button className={activeTab === "auto" ? "settings-tab active" : "settings-tab"} onClick={() => setActiveTab("auto")}>▷ <span>Auto start</span></button>
          <button className={activeTab === "notification" ? "settings-tab active" : "settings-tab"} onClick={() => setActiveTab("notification")}>♧ <span>Notification</span></button>
        </aside>
        <div className="settings-content">
          {activeTab === "concentration" && (
            <>
              <div className="settings-section">
                <p className="settings-section-title">TIMER TEMPLATE</p>
                <button className={isFocusTemplate ? "template-card active" : "template-card"} onClick={() => setTimerDurations(focusDurations)}>
                  <strong>{isFocusTemplate ? "✓" : "○"} Template fokus</strong>
                  <span>25 min pomodoro · 5 min short break · 15 min long break</span>
                </button>
                <button className={!isFocusTemplate ? "template-card active" : "template-card"} onClick={() => setTimerDurations(deepWorkDurations)}>
                  <strong>{!isFocusTemplate ? "✓" : "○"} Deep work</strong>
                  <span>50 min pomodoro · 10 min short break · 30 min long break</span>
                </button>
              </div>

              <div className="settings-section">
                <p className="settings-section-title">SIKLUS ISTIRAHAT PANJANG</p>
                <div className="setting-row">
                  <span>Interval Long Break</span>
                  <div className="interval-options" role="group" aria-label="Frekuensi istirahat panjang">
                    {[2, 3, 4, 5, 6].map((count) => (
                      <button
                        key={count}
                        type="button"
                        className={longBreakInterval === count ? "interval-chip active" : "interval-chip"}
                        onClick={() => setLongBreakInterval(count)}
                        aria-pressed={longBreakInterval === count}
                      >
                        {count} sesi
                      </button>
                    ))}
                  </div>
                </div>
                <p className="settings-help">Istirahat panjang akan dimulai setiap kelipatan {longBreakInterval} sesi Pomodoro.</p>
              </div>

              <div className="settings-section">
                <p className="settings-section-title">TARGET SESI HARIAN</p>
                <div className="setting-row">
                  <span>Target Pomodoro / Hari</span>
                  <div className="interval-options" role="group" aria-label="Target sesi harian">
                    {[4, 6, 8, 10, 12].map((count) => (
                      <button
                        key={count}
                        type="button"
                        className={dailyGoalPomodoros === count ? "interval-chip active" : "interval-chip"}
                        onClick={() => setDailyGoalPomodoros(count)}
                        aria-pressed={dailyGoalPomodoros === count}
                      >
                        {count} sesi
                      </button>
                    ))}
                  </div>
                </div>
                <p className="settings-help">
                  Ditampilkan di panel timer utama (~{Math.round((dailyGoalPomodoros * 25 / 60) * 10) / 10} jam fokus).
                </p>
              </div>

              <div className="settings-section">
                <p className="settings-section-title">PREFERENCES</p>
                <div className="setting-row"><span>Color theme</span><div className="theme-options">{colorThemes.map(({ color, name }) => <button key={color} title={name} aria-label={name} className={selectedColor === color ? "theme-swatch selected" : "theme-swatch"} style={{ backgroundColor: color }} onClick={() => setSelectedColor(color)} />)}</div></div>
                <button className="setting-row setting-action" onClick={() => setDark(!dark)}><span>Dark mode</span><b>{dark ? "On" : "Off"}</b></button>
              </div>
            </>
          )}

          {activeTab === "sound" && (
            <>
              <div className="settings-section">
                <p className="settings-section-title">SOUND & ALARM</p>
                <button className="setting-row setting-action" onClick={() => setSoundEnabled(!soundEnabled)}><span>Focus sound</span><b>{soundEnabled ? "On" : "Off"}</b></button>
                <button className="setting-row setting-action" onClick={() => setRepeatAlarm(!repeatAlarm)}><span>Repeat alarm</span><b>{repeatAlarm ? "On" : "Off"}</b></button>
                <button
                  className="setting-row setting-action"
                  onClick={() => setTickingSoundEnabled(!tickingSoundEnabled)}
                >
                  <span>Detak jam saat fokus (Clock ticking)</span>
                  <b>{tickingSoundEnabled ? "On" : "Off"}</b>
                </button>
                <p className="settings-help">Suara alarm diputar ketika sesi fokus atau istirahat selesai, dan detak jam berdetik lembut tiap detik saat fokus.</p>
              </div>

              <div className="settings-section">
                <p className="settings-section-title">NADA ALARM SELESAI</p>
                <div className="alarm-options" role="radiogroup" aria-label="Pilihan bunyi alarm">
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

                <div className="alarm-test-wrap">
                  <button
                    type="button"
                    className={isPlayingPreview ? "alarm-test-btn playing" : "alarm-test-btn"}
                    onClick={toggleAlarmPreview}
                  >
                    {isPlayingPreview ? "⏹ Hentikan Bunyi" : "▶ Tes Bunyi Alarm"}
                  </button>
                  <small>Bunyi alarm kini lebih besar volumenya dan bertahan ~6-8 detik agar terdengar dari jauh.</small>
                </div>
              </div>
            </>
          )}

          {activeTab === "auto" && (
            <div className="settings-section">
              <p className="settings-section-title">AUTO START</p>
              <button className="setting-row setting-action" onClick={() => setAutoStart(!autoStart)}><span>Auto start next session</span><b>{autoStart ? "On" : "Off"}</b></button>
              <p className="settings-help">Automatically start the next focus or break session.</p>
            </div>
          )}

          {activeTab === "notification" && (
            <div className="settings-section">
              <p className="settings-section-title">NOTIFICATION</p>
              <button className="setting-row setting-action" onClick={async () => {
                if (!notificationsEnabled && typeof Notification !== "undefined" && Notification.permission === "default") {
                  const permission = await Notification.requestPermission();
                  setNotificationsEnabled(permission === "granted");
                } else {
                  setNotificationsEnabled(!notificationsEnabled);
                }
              }}><span>Browser notification</span><b>{notificationsEnabled ? "On" : "Off"}</b></button>
              <p className="settings-help">Show a browser notification when a session ends.</p>
            </div>
          )}

          <div className="settings-footer">
            <span>Perubahan tersimpan otomatis</span>
            <button className="apply-button" onClick={handleClose}>Tutup</button>
          </div>
        </div>
      </section>
    </div>
  );
}
