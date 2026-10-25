"use client";

import { useState } from "react";
import type { Habit, RoutineTime } from "@/features/habits/habit-types";

interface HabitModalProps {
  initialHabit?: Habit | null;
  onSave: (habitData: Omit<Habit, "id" | "completedDates" | "streakCurrent" | "streakBest" | "createdAt">) => void;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  { hex: "#6366f1", label: "Indigo" },
  { hex: "#10b981", label: "Emerald" },
  { hex: "#ef4444", label: "Coral" },
  { hex: "#f59e0b", label: "Amber" },
  { hex: "#3b82f6", label: "Sky" },
  { hex: "#ec4899", label: "Pink" },
];

const ICON_PRESETS = ["🍅", "📚", "📅", "🐸", "✍️", "💧", "🧘", "🏃", "🥗", "💡", "🎯", "⚡", "🏋️", "🧘‍♂️", "🛌", "🚶"];

const TEMPLATES = [
  {
    title: "Fokus 1 Pomodoro 25 Menit",
    cue: "Setelah menyeduh kopi & merapikan meja kerja",
    identity: "Saya adalah orang yang fokus dan menyelesaikan hal terpenting.",
    twoMinuteRule: "Duduk dan nyalakan timer untuk 5 menit pertama.",
    routineTime: "afternoon" as RoutineTime,
    color: "#ef4444",
    icon: "🍅",
    linkedPomodoroMinutes: 25,
  },
  {
    title: "Time-Blocking Kalender Hari Ini",
    cue: "Setelah bangun tidur & sarapan pagi",
    identity: "Saya adalah pemilik waktu saya, bukan budak distraksi.",
    twoMinuteRule: "Buka Kalender dan tandai 2 blok waktu fokus utama.",
    routineTime: "morning" as RoutineTime,
    color: "#3b82f6",
    icon: "📅",
  },
  {
    title: "Eat That Frog di Kanban",
    cue: "Setelah memeriksa to-do list harian",
    identity: "Saya adalah eksekutor yang berani menghadapi tantangan.",
    twoMinuteRule: "Tarik 1 kartu tugas terpenting ke kolom In Progress.",
    routineTime: "morning" as RoutineTime,
    color: "#f59e0b",
    icon: "🐸",
  },
  {
    title: "Membaca Buku 5-10 Halaman",
    cue: "Setelah sarapan pagi",
    identity: "Saya adalah pembelajar konsisten yang berkembang 1% setiap hari.",
    twoMinuteRule: "Buka buku dan baca 1 halaman saja.",
    routineTime: "morning" as RoutineTime,
    color: "#10b981",
    icon: "📚",
  },
  {
    title: "Minum Segelas Air Putih",
    cue: "Seketika setelah bangun tidur",
    identity: "Saya adalah pribadi yang menjaga kesehatan dan hidrasi tubuh.",
    twoMinuteRule: "Tuang air ke gelas dan minum sampai habis.",
    routineTime: "morning" as RoutineTime,
    color: "#3b82f6",
    icon: "💧",
  },
  {
    title: "Refleksi & Catat Hal Positif",
    cue: "Setelah menutup laptop di malam hari",
    identity: "Saya adalah pribadi yang selalu bersyukur dan bertumbuh.",
    twoMinuteRule: "Buka Catatan Cepat Keep dan tulis 1 kalimat sederhana.",
    routineTime: "evening" as RoutineTime,
    color: "#6366f1",
    icon: "✍️",
  },
];

export function HabitModal({ initialHabit, onSave, onClose }: HabitModalProps) {
  const [title, setTitle] = useState(initialHabit?.title || "");
  const [cue, setCue] = useState(initialHabit?.cue || "");
  const [identity, setIdentity] = useState(initialHabit?.identity || "");
  const [twoMinuteRule, setTwoMinuteRule] = useState(initialHabit?.twoMinuteRule || "");
  const [routineTime, setRoutineTime] = useState<RoutineTime>(initialHabit?.routineTime || "morning");
  const [color, setColor] = useState(initialHabit?.color || "#6366f1");
  const [icon, setIcon] = useState(initialHabit?.icon || "✨");
  const [linkedPomodoroMinutes, setLinkedPomodoroMinutes] = useState<number | undefined>(
    initialHabit?.linkedPomodoroMinutes
  );

  const applyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setTitle(tpl.title);
    setCue(tpl.cue);
    setIdentity(tpl.identity);
    setTwoMinuteRule(tpl.twoMinuteRule);
    setRoutineTime(tpl.routineTime);
    setColor(tpl.color);
    setIcon(tpl.icon);
    setLinkedPomodoroMinutes(tpl.linkedPomodoroMinutes);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      cue: cue.trim() || undefined,
      identity: identity.trim() || undefined,
      twoMinuteRule: twoMinuteRule.trim() || undefined,
      routineTime,
      frequency: "daily",
      targetCount: 1,
      unit: "kali",
      color,
      icon,
      linkedPomodoroMinutes,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop habit-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="habit-modal-dialog"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <header className="habit-modal-header">
          <div className="habit-modal-title-col">
            <h2>{initialHabit ? "Edit Kebiasaan" : "Bangun Kebiasaan Baru"}</h2>
            <p className="habit-modal-subtitle">
              Format berbasis sains <em>Atomic Habits</em> James Clear untuk kemajuan 1% setiap hari.
            </p>
          </div>
          <button
            type="button"
            className="habit-modal-close-btn"
            onClick={onClose}
            aria-label="Tutup modal"
          >
            ✕
          </button>
        </header>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="habit-modal-form-wrap">
          <div className="habit-modal-grid-body">
            {/* Left Column: Form Fields */}
            <div className="habit-modal-left-col">
              {/* Title & Icon */}
              <div className="form-group">
                <label htmlFor="habit-title" className="form-label">
                  Nama Kebiasaan <span className="required-star">*</span>
                </label>
                <div className="habit-title-input-row">
                  <div className="habit-icon-picker">
                    <select
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="habit-icon-select"
                      aria-label="Pilih Ikon"
                    >
                      {ICON_PRESETS.map((ic) => (
                        <option key={ic} value={ic}>
                          {ic}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    id="habit-title"
                    type="text"
                    className="text-input habit-text-input"
                    placeholder="Contoh: Baca Buku 5 Halaman..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Routine Time Segment */}
              <div className="form-group">
                <label className="form-label">Waktu Rutinitas</label>
                <div className="routine-time-pills">
                  <button
                    type="button"
                    className={`routine-pill ${routineTime === "morning" ? "active" : ""}`}
                    onClick={() => setRoutineTime("morning")}
                  >
                    🌅 Pagi
                  </button>
                  <button
                    type="button"
                    className={`routine-pill ${routineTime === "afternoon" ? "active" : ""}`}
                    onClick={() => setRoutineTime("afternoon")}
                  >
                    ☀️ Siang
                  </button>
                  <button
                    type="button"
                    className={`routine-pill ${routineTime === "evening" ? "active" : ""}`}
                    onClick={() => setRoutineTime("evening")}
                  >
                    🌙 Malam
                  </button>
                  <button
                    type="button"
                    className={`routine-pill ${routineTime === "anytime" ? "active" : ""}`}
                    onClick={() => setRoutineTime("anytime")}
                  >
                    ⚡ Kapan Saja
                  </button>
                </div>
              </div>

              {/* James Clear: Habit Stacking */}
              <div className="form-group">
                <label htmlFor="habit-cue" className="form-label">
                  🔗 Habit Stacking (Pemicu Kebiasaan)
                </label>
                <span className="form-sub-hint">Formula: &ldquo;Setelah [kebiasaan lama], saya akan...&rdquo;</span>
                <input
                  id="habit-cue"
                  type="text"
                  className="text-input habit-text-input"
                  placeholder="Contoh: Setelah menyeduh kopi pagi..."
                  value={cue}
                  onChange={(e) => setCue(e.target.value)}
                />
              </div>

              {/* James Clear: Identity-Based Habit */}
              <div className="form-group">
                <label htmlFor="habit-identity" className="form-label">
                  🎯 Pembentukan Identitas
                </label>
                <span className="form-sub-hint">Formula: &ldquo;Saya adalah orang yang...&rdquo;</span>
                <input
                  id="habit-identity"
                  type="text"
                  className="text-input habit-text-input"
                  placeholder="Contoh: Saya adalah pembelajar konsisten seumur hidup."
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                />
              </div>

              {/* James Clear: The 2-Minute Rule */}
              <div className="form-group">
                <label htmlFor="habit-twomin" className="form-label">
                  ⚡ Aturan 2 Menit (Starter Tanpa Beban)
                </label>
                <span className="form-sub-hint">Versi super kecil agar otak tidak menolak untuk mulai</span>
                <input
                  id="habit-twomin"
                  type="text"
                  className="text-input habit-text-input"
                  placeholder="Contoh: Buka buku dan baca 1 halaman saja."
                  value={twoMinuteRule}
                  onChange={(e) => setTwoMinuteRule(e.target.value)}
                />
              </div>

              {/* Pomodoro & Accent Color Row */}
              <div className="form-row-two-col">
                <div className="form-group">
                  <label htmlFor="habit-pomo" className="form-label">Integrasi Pomodoro</label>
                  <select
                    id="habit-pomo"
                    className="select-input"
                    value={linkedPomodoroMinutes || ""}
                    onChange={(e) => setLinkedPomodoroMinutes(e.target.value ? Number(e.target.value) : undefined)}
                  >
                    <option value="">Tanpa Timer</option>
                    <option value="15">Timer Fokus 15 Menit</option>
                    <option value="25">Timer Fokus 25 Menit (Standar)</option>
                    <option value="50">Timer Fokus 50 Menit</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Warna Aksen</label>
                  <div className="color-swatches">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        className={`color-swatch-circle ${color === c.hex ? "selected" : ""}`}
                        style={{ background: c.hex }}
                        onClick={() => setColor(c.hex)}
                        title={c.label}
                        aria-label={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Templates & Science Guide */}
            <div className="habit-modal-right-col">
              <div className="templates-section-header">
                <span className="templates-section-title">💡 Template Siap Pakai</span>
                <span className="templates-section-hint">Klik untuk mengisi form secara otomatis:</span>
              </div>

              <div className="habit-templates-scroll-list">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.title}
                    type="button"
                    className="habit-template-card-btn"
                    onClick={() => applyTemplate(tpl)}
                  >
                    <span
                      className="tpl-card-icon"
                      style={{ background: `color-mix(in srgb, ${tpl.color} 15%, var(--paper))` }}
                    >
                      {tpl.icon}
                    </span>
                    <div className="tpl-card-info">
                      <strong className="tpl-card-title">{tpl.title}</strong>
                      <span className="tpl-card-meta">
                        {tpl.routineTime === "morning" && "🌅 Pagi"}
                        {tpl.routineTime === "afternoon" && "☀️ Siang"}
                        {tpl.routineTime === "evening" && "🌙 Malam"}
                        {tpl.routineTime === "anytime" && "⚡ Fleksibel"}
                        {tpl.linkedPomodoroMinutes ? ` • 🍅 ${tpl.linkedPomodoroMinutes}m` : ""}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Atomic Habits Tip Box */}
              <div className="habit-modal-wisdom-box">
                <span className="wisdom-badge">✨ Prinsip James Clear</span>
                <p>
                  &ldquo;Setiap tindakan yang kamu lakukan adalah suara untuk tipe orang yang ingin kamu bentuk.&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Sticky Modal Footer Actions (Always visible, never cut off) */}
          <footer className="habit-modal-footer">
            <button type="button" className="secondary-button habit-modal-cancel-btn" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="primary-button habit-modal-save-btn">
              {initialHabit ? "Simpan Perubahan" : "Buat Kebiasaan"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
