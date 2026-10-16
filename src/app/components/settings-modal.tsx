"use client";

import { useState } from "react";
import type { TimerDurations, TimerMode } from "@/types/domain";

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
  timerDurations,
  setTimerDurations,
  onClose,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"concentration" | "sound" | "auto" | "notification">("concentration");
  const isFocusTemplate = (Object.keys(focusDurations) as TimerMode[]).every((mode) => timerDurations[mode] === focusDurations[mode]);

  return <div className="modal-backdrop" role="presentation" onClick={onClose}>
    <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose} aria-label="Tutup pengaturan">×</button>
      <aside className="settings-sidebar">
        <span className="settings-kicker">BiarFokus</span>
        <h2 id="settings-title">Settings</h2>
        <button className={activeTab === "concentration" ? "settings-tab active" : "settings-tab"} onClick={() => setActiveTab("concentration")}>◷ <span>Concentration time</span></button>
        <button className={activeTab === "sound" ? "settings-tab active" : "settings-tab"} onClick={() => setActiveTab("sound")}>♧ <span>Sound & alarm</span></button>
        <button className={activeTab === "auto" ? "settings-tab active" : "settings-tab"} onClick={() => setActiveTab("auto")}>▷ <span>Auto start</span></button>
        <button className={activeTab === "notification" ? "settings-tab active" : "settings-tab"} onClick={() => setActiveTab("notification")}>♧ <span>Notification</span></button>
      </aside>
      <div className="settings-content">
        {activeTab === "concentration" && <div className="settings-section">
          <p className="settings-section-title">TIMER TEMPLATE</p>
          <button className={isFocusTemplate ? "template-card active" : "template-card"} onClick={() => setTimerDurations(focusDurations)}>
            <strong>{isFocusTemplate ? "✓" : "○"} Template fokus</strong>
            <span>25 min pomodoro · 5 min short break · 15 min long break</span>
          </button>
          <button className={!isFocusTemplate ? "template-card active" : "template-card"} onClick={() => setTimerDurations(deepWorkDurations)}>
            <strong>{!isFocusTemplate ? "✓" : "○"} Deep work</strong>
            <span>50 min pomodoro · 10 min short break · 30 min long break</span>
          </button>
        </div>}
        {activeTab === "concentration" && <div className="settings-section">
          <p className="settings-section-title">PREFERENCES</p>
          <div className="setting-row"><span>Color theme</span><div className="theme-options">{colorThemes.map(({ color, name }) => <button key={color} title={name} aria-label={name} className={selectedColor === color ? "theme-swatch selected" : "theme-swatch"} style={{ backgroundColor: color }} onClick={() => setSelectedColor(color)} />)}</div></div>
          <button className="setting-row setting-action" onClick={() => setDark(!dark)}><span>Dark mode</span><b>{dark ? "On" : "Off"}</b></button>
        </div>}
        {activeTab === "sound" && <div className="settings-section">
          <p className="settings-section-title">SOUND & ALARM</p>
          <button className="setting-row setting-action" onClick={() => setSoundEnabled(!soundEnabled)}><span>Focus sound</span><b>{soundEnabled ? "On" : "Off"}</b></button>
          <button className="setting-row setting-action" onClick={() => setRepeatAlarm(!repeatAlarm)}><span>Repeat alarm</span><b>{repeatAlarm ? "On" : "Off"}</b></button>
          <p className="settings-help">Sound plays when a focus or break session ends.</p>
        </div>}
        {activeTab === "auto" && <div className="settings-section">
          <p className="settings-section-title">AUTO START</p>
          <button className="setting-row setting-action" onClick={() => setAutoStart(!autoStart)}><span>Auto start next session</span><b>{autoStart ? "On" : "Off"}</b></button>
          <p className="settings-help">Automatically start the next focus or break session.</p>
        </div>}
        {activeTab === "notification" && <div className="settings-section">
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
        </div>}
        <div className="settings-footer"><span>Changes are saved automatically</span><button className="apply-button" onClick={onClose}>Apply</button></div>
      </div>
    </section>
  </div>;
}
