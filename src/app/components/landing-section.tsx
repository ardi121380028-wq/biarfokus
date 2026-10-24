"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type HubTab = "pomodoro" | "calendar" | "kanban" | "notes";

type CyclingFeature = {
  id: string;
  icon: string;
  label: string;
  tab: HubTab;
};

const CYCLING_FEATURES: CyclingFeature[] = [
  { id: "pomodoro", icon: "⏱️", label: "Focus Timer 25 Menit", tab: "pomodoro" },
  { id: "calendar", icon: "📅", label: "Time-Blocking Kalender", tab: "calendar" },
  { id: "kanban", icon: "📋", label: "Project Kanban & Frog", tab: "kanban" },
  { id: "notes", icon: "📝", label: "Catatan Cepat Keep", tab: "notes" },
  { id: "ambient", icon: "🎧", label: "Zen Audio Suara Alam", tab: "pomodoro" },
  { id: "frog", icon: "🐸", label: "Eat That Frog Priority", tab: "kanban" },
];

export function LandingSection() {
  const [activeTab, setActiveTab] = useState<HubTab>("pomodoro");
  const [cyclerIdx, setCyclerIdx] = useState(0);
  const [isHeadingHovered, setIsHeadingHovered] = useState(false);

  // Live Timer Simulation
  const [previewSeconds, setPreviewSeconds] = useState(1488); // 24:48
  const [previewRunning, setPreviewRunning] = useState(true);
  const [previewSound, setPreviewSound] = useState<"hujan" | "hutan" | "ombak" | "kafe">("hujan");

  // Keep Notes Checklist Item Toggle Simulation
  const [notesItemChecked, setNotesItemChecked] = useState(false);

  // Dynamic Feature Icon Cycler
  useEffect(() => {
    const timer = setInterval(() => {
      setCyclerIdx((prev) => (prev + 1) % CYCLING_FEATURES.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  // Live countdown timer ticker
  useEffect(() => {
    if (!previewRunning) return;
    const timer = setInterval(() => {
      setPreviewSeconds((prev) => (prev > 0 ? prev - 1 : 1500));
    }, 1000);
    return () => clearInterval(timer);
  }, [previewRunning]);

  // Simulated auto-toggle of notes checklist item
  useEffect(() => {
    const timer = setInterval(() => {
      setNotesItemChecked((prev) => !prev);
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  function formatPreviewTime(totalSec: number) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function scrollToShowcase() {
    if (typeof window !== "undefined") {
      const el = document.getElementById("ekosistem-showcase");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function scrollToTop() {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleFeatureChipClick(tab: HubTab) {
    setActiveTab(tab);
    scrollToShowcase();
  }

  const currentFeature = CYCLING_FEATURES[cyclerIdx];

  return (
    <>
      {/* 1. Bridge Area below Timer & To-Do: Gemini button + Animated Floating Feature Chips */}
      <div className="landing-bridge-trigger">
        <button
          type="button"
          className="landing-gemini-btn-wrapper"
          onClick={scrollToShowcase}
          aria-label="Lihat fitur ekosistem BiarFokus"
        >
          {/* Animated Gemini conic rotating iridescent gradient */}
          <span className="landing-gemini-glow" aria-hidden="true" />
          {/* Inner surface */}
          <span className="landing-gemini-inner">
            <span className="landing-gemini-sparkle">✨</span>
            <span className="landing-gemini-text">Jelajahi Ekosistem BiarFokus</span>
            <span className="landing-gemini-arrow-box">↓</span>
          </span>
        </button>

        {/* Animated Feature Icon Badges with Staggered Floating Wave Animation */}
        <div className="landing-floating-chips-row" aria-label="Ikon Fitur Unggulan">
          <button
            type="button"
            className="landing-floating-chip chip-pomodoro"
            onClick={() => handleFeatureChipClick("pomodoro")}
            title="Pomodoro Focus Timer"
          >
            <span className="chip-icon">⏱️</span>
            <span>Focus Timer</span>
          </button>
          <button
            type="button"
            className="landing-floating-chip chip-calendar"
            onClick={() => handleFeatureChipClick("calendar")}
            title="Time-Blocking Kalender"
          >
            <span className="chip-icon">📅</span>
            <span>Kalender</span>
          </button>
          <button
            type="button"
            className="landing-floating-chip chip-kanban"
            onClick={() => handleFeatureChipClick("kanban")}
            title="Project Kanban & Frog"
          >
            <span className="chip-icon">📋</span>
            <span>Kanban Board</span>
          </button>
          <button
            type="button"
            className="landing-floating-chip chip-notes"
            onClick={() => handleFeatureChipClick("notes")}
            title="Google Keep Catatan"
          >
            <span className="chip-icon">📝</span>
            <span>Catatan Keep</span>
          </button>
          <button
            type="button"
            className="landing-floating-chip chip-ambient"
            onClick={() => handleFeatureChipClick("pomodoro")}
            title="Suara Alam Ambient"
          >
            <span className="chip-icon">🎧</span>
            <span>Suara Alam</span>
          </button>
        </div>
      </div>

      {/* 2. Dedicated Full-Width Pristine Clean White Section (Modern SaaS Look) */}
      <section
        id="ekosistem-showcase"
        className="landing-white-section"
        aria-label="Eksplorasi Ekosistem BiarFokus"
      >
        {/* Ambient Aurora Glass Lighting Orbs for Seamless Modern Blend */}
        <div className="landing-aurora-glow-container" aria-hidden="true">
          <div className="landing-aurora-orb pink" />
          <div className="landing-aurora-orb blue" />
          <div className="landing-aurora-glass-bar" />
        </div>

        <div className="landing-section-inner">
          {/* Hero Header with Interactive Hover Icon Cycler & Glossy AI Gradient */}
          <div className="landing-hero">
            <span className="landing-eyebrow-badge">
              ✨ Ekosistem Produktivitas All-in-One
            </span>

            {/* Interactive Heading Wrapper with Glossy AI Gradient & Hover Micro-Icons */}
            <div
              className="landing-hero-heading-wrap"
              onMouseEnter={() => setIsHeadingHovered(true)}
              onMouseLeave={() => setIsHeadingHovered(false)}
              onClick={() => {
                setActiveTab(currentFeature.tab);
                scrollToShowcase();
              }}
              role="button"
              tabIndex={0}
              title="Arahkan kursor atau klik untuk melihat fitur ekosistem"
            >
              {/* Cycling Pill Badge */}
              <div className="landing-heading-interactive-bar">
                <div className={`landing-heading-cycler-pill ${isHeadingHovered ? "is-hovered" : ""}`}>
                  <span className="cycler-ai-sparkle">✦</span>
                  <span className="cycler-icon" key={currentFeature.id}>{currentFeature.icon}</span>
                  <span className="cycler-label">{currentFeature.label}</span>
                  <span className="cycler-badge-ai">AI Focus</span>
                </div>
              </div>

              <h2>
                Bukan Sekadar Timer Biasa.
                <span className="landing-hero-ai-gradient">
                  Satu Ruang Kerja untuk Seluruh Harimu.
                  <span className="landing-hero-sparkle" aria-hidden="true">✦</span>
                </span>
              </h2>

              {/* Floating Orbiting Micro-Icons that pop up when hovering the heading */}
              <div className={`landing-hero-floating-icons ${isHeadingHovered ? "is-visible" : ""}`} aria-hidden="true">
                {CYCLING_FEATURES.map((feat, idx) => (
                  <button
                    key={feat.id}
                    type="button"
                    className={`hero-orb-icon hero-orb-${feat.id} ${idx === cyclerIdx ? "is-active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab(feat.tab);
                      scrollToShowcase();
                    }}
                    title={`Buka ${feat.label}`}
                  >
                    <span>{feat.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            <p>
              BiarFokus menggabungkan <strong>Timer Pomodoro Saintifik</strong>,{" "}
              <strong>Time-Blocking Kalender</strong>, <strong>Kanban Kolaboratif</strong>, dan{" "}
              <strong>Catatan Cepat Keep</strong> ke dalam satu aplikasi yang tenang dan 100% bebas gangguan iklan.
            </p>
            <div className="landing-hero-actions">
              <button
                type="button"
                className="landing-cta-primary"
                onClick={scrollToTop}
              >
                ⏱️ Mulai Sesi Fokus Sekarang (Gratis)
              </button>
              <Link href="/fitur" className="landing-cta-secondary">
                📖 Panduan Alur Kerja →
              </Link>
            </div>
          </div>

          {/* Interactive Notion / Linear Feature Showcase */}
          <div className="landing-interactive-hub">
            {/* Tab Selector */}
            <div className="landing-hub-nav" role="tablist" aria-label="Pilih Fitur">
              <button
                type="button"
                className={`landing-hub-tab-btn ${activeTab === "pomodoro" ? "active" : ""}`}
                onClick={() => setActiveTab("pomodoro")}
              >
                <span>⏱️</span> Pomodoro &amp; Zen Audio
              </button>
              <button
                type="button"
                className={`landing-hub-tab-btn ${activeTab === "calendar" ? "active" : ""}`}
                onClick={() => setActiveTab("calendar")}
              >
                <span>📅</span> Time-Blocking Kalender
              </button>
              <button
                type="button"
                className={`landing-hub-tab-btn ${activeTab === "kanban" ? "active" : ""}`}
                onClick={() => setActiveTab("kanban")}
              >
                <span>📋</span> Project Kanban &amp; Frog
              </button>
              <button
                type="button"
                className={`landing-hub-tab-btn ${activeTab === "notes" ? "active" : ""}`}
                onClick={() => setActiveTab("notes")}
              >
                <span>📝</span> Catatan Model Keep
              </button>
            </div>

            {/* Mockup Frame (Mac Window Frame) */}
            <div className="landing-mockup-frame">
              <div className="landing-mockup-header">
                <div className="landing-mockup-dots">
                  <span className="landing-mockup-dot red" />
                  <span className="landing-mockup-dot yellow" />
                  <span className="landing-mockup-dot green" />
                </div>
                <div className="landing-mockup-title">
                  biarfokus.com / {activeTab}
                </div>
                <div style={{ width: "42px" }} />
              </div>

              <div className="landing-mockup-body">
                {/* ======================================================== */}
                {/* TAB 1: POMODORO & ZEN AUDIO (LIVE REALISTIC PREVIEW)     */}
                {/* ======================================================== */}
                {activeTab === "pomodoro" && (
                  <>
                    <div className="landing-mockup-content">
                      <h3>Teknik Pomodoro Saintifik &amp; Suara Alam Penenang</h3>
                      <p>
                        Siklus kerja 25 menit fokus dan 5 menit jeda menjaga kejernihan pikiranmu sepanjang hari tanpa risiko kejenuhan mental.
                      </p>
                      <ul className="landing-mockup-bullets">
                        <li>
                          <span className="landing-mockup-check">✓</span>
                          <span>Siklus otomatis: Pomodoro, Istirahat Pendek, dan Istirahat Panjang teratur.</span>
                        </li>
                        <li>
                          <span className="landing-mockup-check">✓</span>
                          <span>Suara latar ambient: Hujan deras, hutan tropis, ombak laut, dan white noise.</span>
                        </li>
                        <li>
                          <span className="landing-mockup-check">✓</span>
                          <span>Mode Zen layar penuh untuk menghilangkan semua distraksi di sekelilingmu.</span>
                        </li>
                      </ul>
                    </div>

                    <div className="landing-mockup-visual">
                      <div className="preview-timer-card">
                        {/* Mode Tabs */}
                        <div className="preview-mode-tabs">
                          <button type="button" className="preview-mode-tab active">🍅 Pomodoro</button>
                          <button type="button" className="preview-mode-tab">☕ Istirahat Pendek</button>
                          <button type="button" className="preview-mode-tab">🌴 Istirahat Panjang</button>
                        </div>

                        {/* Daily Goal Bar */}
                        <div className="preview-daily-goal">
                          <div className="preview-goal-header">
                            <span className="preview-goal-title">🎯 Target Hari Ini</span>
                            <span className="preview-goal-count"><strong>3</strong> / 4 sesi (75%)</span>
                          </div>
                          <div className="preview-goal-track">
                            <div className="preview-goal-fill" />
                          </div>
                        </div>

                        {/* Focused Task Pill */}
                        <div className="preview-focused-task">
                          <span className="preview-task-badge">🎯 Fokus Aktif</span>
                          <span className="preview-task-text">Siapkan Peluncuran BiarFokus SaaS</span>
                          <span className="preview-task-pomo">🍅 3</span>
                        </div>

                        {/* Live Timer Display */}
                        <div className="preview-timer-main">
                          <div className="preview-timer-digits">
                            {formatPreviewTime(previewSeconds)}
                          </div>
                          <div className="preview-live-indicator">
                            <span className="preview-live-dot" />
                            <span>{previewRunning ? "Sesi Berjalan" : "Timer Dijeda"}</span>
                          </div>
                        </div>

                        {/* Control Buttons */}
                        <div className="preview-timer-controls">
                          <button
                            type="button"
                            className="preview-ctrl-btn"
                            onClick={() => setPreviewSeconds(1500)}
                            title="Reset Timer"
                          >
                            ↺
                          </button>
                          <button
                            type="button"
                            className="preview-start-btn"
                            onClick={() => setPreviewRunning(!previewRunning)}
                          >
                            {previewRunning ? "PAUSE ❚❚" : "START FOCUS ▶"}
                          </button>
                          <button
                            type="button"
                            className="preview-ctrl-btn"
                            onClick={() => setPreviewSeconds(300)}
                            title="Lewati Sesi"
                          >
                            ⏭
                          </button>
                          <button
                            type="button"
                            className="preview-ctrl-btn"
                            onClick={scrollToTop}
                            title="Mode Zen Layar Penuh"
                          >
                            ⛶
                          </button>
                        </div>

                        {/* Zen Audio Equalizer & Switcher */}
                        <div className="preview-ambient-bar">
                          <div className="preview-ambient-header">
                            <div className="preview-ambient-label">
                              <span>🎧 Suara Latar:</span>
                              <strong>
                                {previewSound === "hujan" && "🌧️ Hujan Deras"}
                                {previewSound === "hutan" && "🌲 Hutan Tropis"}
                                {previewSound === "ombak" && "🌊 Ombak Laut"}
                                {previewSound === "kafe" && "☕ Kafe Ramai"}
                              </strong>
                            </div>
                            <div className="preview-sound-wave" title="Audio Wave Equalizer">
                              <span className="wave-bar" />
                              <span className="wave-bar" />
                              <span className="wave-bar" />
                              <span className="wave-bar" />
                              <span className="wave-bar" />
                            </div>
                          </div>
                          <div className="preview-sound-chips">
                            <button
                              type="button"
                              className={`preview-sound-chip ${previewSound === "hujan" ? "active" : ""}`}
                              onClick={() => setPreviewSound("hujan")}
                            >
                              🌧️ Hujan
                            </button>
                            <button
                              type="button"
                              className={`preview-sound-chip ${previewSound === "hutan" ? "active" : ""}`}
                              onClick={() => setPreviewSound("hutan")}
                            >
                              🌲 Hutan
                            </button>
                            <button
                              type="button"
                              className={`preview-sound-chip ${previewSound === "ombak" ? "active" : ""}`}
                              onClick={() => setPreviewSound("ombak")}
                            >
                              🌊 Ombak
                            </button>
                            <button
                              type="button"
                              className={`preview-sound-chip ${previewSound === "kafe" ? "active" : ""}`}
                              onClick={() => setPreviewSound("kafe")}
                            >
                              ☕ Kafe
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ======================================================== */}
                {/* TAB 2: TIME-BLOCKING KALENDER (LIVE REALISTIC PREVIEW)   */}
                {/* ======================================================== */}
                {activeTab === "calendar" && (
                  <>
                    <div className="landing-mockup-content">
                      <h3>Time-Blocking: Kendalikan Jam Kerjamu</h3>
                      <p>
                        Petakan harimu ke dalam blok-blok waktu terencana. Selesaikan pekerjaan tepat waktu tanpa tergesa-gesa.
                      </p>
                      <ul className="landing-mockup-bullets">
                        <li>
                          <span className="landing-mockup-check">✓</span>
                          <span>Jadwalkan sesi fokus langsung ke slot jam kerja harian dan mingguan.</span>
                        </li>
                        <li>
                          <span className="landing-mockup-check">✓</span>
                          <span>Kode warna kategori kegiatan: Deep work, meeting, review, dan istirahat.</span>
                        </li>
                        <li>
                          <span className="landing-mockup-check">✓</span>
                          <span>Terhubung langsung dengan daftar tugas harianmu.</span>
                        </li>
                      </ul>
                    </div>

                    <div className="landing-mockup-visual">
                      <div className="preview-calendar-card">
                        <div className="preview-cal-header">
                          <div className="preview-cal-date-title">
                            <span>📅</span>
                            <span>Jumat, 24 Oktober 2026</span>
                          </div>
                          <button type="button" className="preview-cal-pill-btn" onClick={scrollToTop}>
                            + Blok Waktu
                          </button>
                        </div>

                        <div className="preview-cal-grid">
                          {/* Time Labels Axis */}
                          <div className="preview-cal-time-axis">
                            <span>08:30</span>
                            <span>10:00</span>
                            <span>11:30</span>
                            <span>13:00</span>
                          </div>

                          {/* Column 1: Kamis 23 */}
                          <div className="preview-cal-col">
                            <div className="preview-cal-col-header">Kamis 23</div>
                            <div className="preview-cal-col-body">
                              <div className="preview-event-box preview-event-blue">
                                <span className="preview-event-time">08:30 - 10:00 · 🍅 3</span>
                                <strong className="preview-event-title">Deep Work: Engine</strong>
                              </div>
                              <div className="preview-event-box preview-event-green">
                                <span className="preview-event-time">10:30 - 11:30 · 👥 Tim</span>
                                <strong className="preview-event-title">Sync Sprint 14</strong>
                              </div>
                            </div>
                          </div>

                          {/* Column 2: Jumat 24 (Today) */}
                          <div className="preview-cal-col">
                            <div className="preview-cal-col-header is-today">Jumat 24 (Hari Ini)</div>
                            <div className="preview-cal-col-body">
                              {/* Live Red Time Indicator */}
                              <div className="preview-cal-now-line">
                                <span className="preview-cal-now-dot" />
                              </div>

                              <div className="preview-event-box preview-event-purple">
                                <span className="preview-event-time">08:30 - 09:30 · 🍅 2</span>
                                <strong className="preview-event-title">Review Code PR</strong>
                              </div>

                              {/* Animated Dropping Block Demonstration */}
                              <div className="preview-event-box preview-event-anim-drop">
                                <span className="preview-event-time">✨ 10:30 - 12:00 · 🍅 3</span>
                                <strong className="preview-event-title">+ Sesi Fokus: SaaS UI</strong>
                              </div>

                              <div className="preview-event-box preview-event-blue" style={{ opacity: 0.85 }}>
                                <span className="preview-event-time">12:30 - 13:30 · ☕ Jeda</span>
                                <strong className="preview-event-title">Makan &amp; Recharge</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ======================================================== */}
                {/* TAB 3: PROJECT KANBAN & FROG (LIVE REALISTIC PREVIEW)    */}
                {/* ======================================================== */}
                {activeTab === "kanban" && (
                  <>
                    <div className="landing-mockup-content">
                      <h3>Eat That Frog &amp; Kanban Kolaboratif</h3>
                      <p>
                        Kuasai tugas terberat dan terpenting di awal hari (*Eat That Frog*). Visualisasikan alur proyek tim secara transparan.
                      </p>
                      <ul className="landing-mockup-bullets">
                        <li>
                          <span className="landing-mockup-check">✓</span>
                          <span>Fitur penanda Frog untuk memprioritaskan tugas berdampak paling besar.</span>
                        </li>
                        <li>
                          <span className="landing-mockup-check">✓</span>
                          <span>Kolaborasi tim tanpa ribet lewat kode invite instan.</span>
                        </li>
                        <li>
                          <span className="landing-mockup-check">✓</span>
                          <span>Drag &amp; drop kartu tugas antar kolom To-Do, In Progress, dan Selesai.</span>
                        </li>
                      </ul>
                    </div>

                    <div className="landing-mockup-visual">
                      <div className="preview-kanban-card">
                        <div className="preview-kanban-header">
                          <div className="preview-kanban-title">
                            <span>🚀</span>
                            <span>BiarFokus Launch Board</span>
                          </div>
                          <span style={{ fontSize: "10px", color: "var(--muted)", fontWeight: "600" }}>
                            👥 3 Anggota Tim
                          </span>
                        </div>

                        <div className="preview-kanban-cols">
                          {/* Column 1: TO-DO */}
                          <div className="preview-kanban-col">
                            <div className="preview-col-head">
                              <span>To-Do</span>
                              <span className="preview-col-badge">2</span>
                            </div>
                            <div className="preview-task-item">
                              <span className="preview-task-item-title">🔒 Pasang Security Headers</span>
                              <div className="preview-task-item-footer">
                                <span>Backend</span>
                                <span>🍅 2</span>
                              </div>
                            </div>
                            <div className="preview-task-item">
                              <span className="preview-task-item-title">📱 Responsive Mobile Nav</span>
                              <div className="preview-task-item-footer">
                                <span>UI/UX</span>
                                <span>🍅 1</span>
                              </div>
                            </div>
                          </div>

                          {/* Column 2: IN PROGRESS (With Eat That Frog card) */}
                          <div className="preview-kanban-col">
                            <div className="preview-col-head">
                              <span>In Progress</span>
                              <span className="preview-col-badge">1</span>
                            </div>

                            {/* The Eat That Frog Card */}
                            <div className="preview-task-item preview-frog-item">
                              <span className="preview-frog-tag">🐸 EAT THAT FROG #1</span>
                              <span className="preview-task-item-title">⚡ Database Query Optimasi</span>
                              <div className="preview-task-item-footer">
                                <span style={{ color: "#16a34a", fontWeight: "750" }}>Critical</span>
                                <span>✓ 2/3</span>
                              </div>
                            </div>

                            {/* Simulated Card Gliding to DONE */}
                            <div className="preview-gliding-card">
                              <span style={{ fontSize: "10px", fontWeight: "750", color: "#16a34a" }}>
                                🚀 One-Tap Google Auth
                              </span>
                              <span style={{ fontSize: "9px", color: "var(--muted)" }}>Gliding ke Selesai →</span>
                            </div>
                          </div>

                          {/* Column 3: DONE */}
                          <div className="preview-kanban-col">
                            <div className="preview-col-head">
                              <span>Selesai</span>
                              <span className="preview-col-badge">3</span>
                            </div>
                            <div className="preview-task-item" style={{ borderLeft: "3px solid #22c55e" }}>
                              <span className="preview-task-item-title">🎨 Living Design System</span>
                              <div className="preview-task-item-footer">
                                <span style={{ color: "#16a34a", fontWeight: "700" }}>✓ Selesai</span>
                                <span>🍅 4</span>
                              </div>
                            </div>
                            <div className="preview-task-item" style={{ borderLeft: "3px solid #22c55e" }}>
                              <span className="preview-task-item-title">💳 Webhook Billing Mayar</span>
                              <div className="preview-task-item-footer">
                                <span style={{ color: "#16a34a", fontWeight: "700" }}>✓ Selesai</span>
                                <span>🍅 3</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ======================================================== */}
                {/* TAB 4: CATATAN MODEL KEEP (LIVE REALISTIC PREVIEW)       */}
                {/* ======================================================== */}
                {activeTab === "notes" && (
                  <>
                    <div className="landing-mockup-content">
                      <h3>Catatan Cepat Google Keep di Samping Timermu</h3>
                      <p>
                        Jangan biarkan inspirasi penting hilang saat kamu sedang fokus. Tangkap ide mendadak tanpa harus meninggalkan timer.
                      </p>
                      <ul className="landing-mockup-bullets">
                        <li>
                          <span className="landing-mockup-check">✓</span>
                          <span>Pilihan warna pastel untuk membedakan kategori catatan secara visual.</span>
                        </li>
                        <li>
                          <span className="landing-mockup-check">✓</span>
                          <span>Mode to-do checklist interaktif dan pin catatan penting di baris teratas.</span>
                        </li>
                        <li>
                          <span className="landing-mockup-check">✓</span>
                          <span>Ekspor catatan rapi ke format PDF dan teks untuk dibagikan.</span>
                        </li>
                      </ul>
                    </div>

                    <div className="landing-mockup-visual">
                      <div className="preview-notes-card">
                        {/* Search Bar */}
                        <div className="preview-notes-search">
                          <span>🔍</span>
                          <span>Telusuri catatan cepat &amp; ide fokus...</span>
                        </div>

                        {/* Sticky Notes Grid */}
                        <div className="preview-notes-grid">
                          {/* Sticky Note 1: Pastel Yellow Checklist */}
                          <div className="preview-sticky-note sticky-yellow">
                            <div className="preview-sticky-header">
                              <span className="preview-sticky-title">📌 Checklist Sprint Launch</span>
                              <span className="preview-sticky-pin">📌</span>
                            </div>

                            <div className="preview-checklist-items">
                              <div className="preview-checklist-row">
                                <span className="preview-checklist-checkbox checked">✓</span>
                                <span className="preview-checklist-text striked">Pasang HTTP security headers</span>
                              </div>
                              <div className="preview-checklist-row">
                                <span className="preview-checklist-checkbox checked">✓</span>
                                <span className="preview-checklist-text striked">Living design system hub</span>
                              </div>
                              <div
                                className="preview-checklist-row"
                                onClick={() => setNotesItemChecked(!notesItemChecked)}
                                title="Klik untuk coba checklist"
                              >
                                <span className={`preview-checklist-checkbox ${notesItemChecked ? "checked" : ""}`}>
                                  {notesItemChecked ? "✓" : ""}
                                </span>
                                <span className={`preview-checklist-text ${notesItemChecked ? "striked" : ""}`}>
                                  Siapkan launch 100k pengguna
                                </span>
                              </div>
                            </div>

                            <div className="preview-sticky-footer">
                              <span>Diedit barusan</span>
                              <div className="preview-color-dots">
                                <span className="color-dot" style={{ background: "#fef08a" }} />
                                <span className="color-dot" style={{ background: "#bae6fd" }} />
                                <span className="color-dot" style={{ background: "#e9d5ff" }} />
                              </div>
                            </div>
                          </div>

                          {/* Sticky Note 2: Pastel Blue Quick Idea */}
                          <div className="preview-sticky-note sticky-blue">
                            <div className="preview-sticky-header">
                              <span className="preview-sticky-title">💡 Ide Fitur v2.0</span>
                              <span>🏷️</span>
                            </div>

                            <p style={{ fontSize: "10.5px", margin: "0", lineHeight: "1.45", color: "#334155" }}>
                              Mode suara binaural 40Hz untuk boost fokus kognitif &amp; auto-sync Google Calendar.
                            </p>

                            <div className="preview-sticky-footer">
                              <span style={{ fontSize: "8.5px", background: "rgba(37, 99, 235, 0.12)", color: "#1d4ed8", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>
                                #zen-audio
                              </span>
                              <span style={{ fontSize: "8.5px" }}>2 mnt lalu</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Three Key Value Pillars (Linear Style) */}
          <div className="landing-pillars-grid">
            <div className="landing-pillar-card">
              <div className="landing-pillar-icon">⚡</div>
              <h4>Instan Tanpa Wajib Login</h4>
              <p>
                Buka website dan langsung mulai sesi timermu dalam 2 detik. Semua riwayat tersimpan aman di browsermu tanpa wajib registrasi.
              </p>
            </div>
            <div className="landing-pillar-card">
              <div className="landing-pillar-icon">🛡️</div>
              <h4>100% Bebas Iklan &amp; Banner</h4>
              <p>
                Fokusmu tidak akan pernah terganggu oleh pop-up iklan banner yang menjengkelkan. Pengalaman bekerja yang bersih dan tenang.
              </p>
            </div>
            <div className="landing-pillar-card">
              <div className="landing-pillar-icon">🔄</div>
              <h4>Sinkronisasi Cloud &amp; PWA Mobile</h4>
              <p>
                Login untuk menyinkronkan data tugas dan riwayat ke semua perangkatmu. Bisa diinstal langsung di HP (iOS &amp; Android).
              </p>
            </div>
          </div>

          {/* Feature Comparison Matrix */}
          <div className="landing-compare-section">
            <div className="landing-compare-header">
              <h3>Kenapa Pengguna Memilih BiarFokus?</h3>
              <p>
                Bandingkan fitur BiarFokus dengan aplikasi stopwatch sederhana atau web timer konvensional.
              </p>
            </div>

            <div className="landing-compare-table-wrapper">
              <table className="landing-compare-table">
                <thead>
                  <tr>
                    <th>Fitur Produktivitas</th>
                    <th className="highlight">BiarFokus</th>
                    <th>Stopwatch Biasa</th>
                    <th>Web Pomodoro Iklanan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Timer Pomodoro Saintifik</strong></td>
                    <td className="highlight">✓ Siklus Otomatis</td>
                    <td>— Manual</td>
                    <td>✓ Ada</td>
                  </tr>
                  <tr>
                    <td><strong>100% Bebas Iklan Banner</strong></td>
                    <td className="highlight">✓ Bersih &amp; Tenang</td>
                    <td>✓ Bersih</td>
                    <td>✗ Penuh Iklan Mengganggu</td>
                  </tr>
                  <tr>
                    <td><strong>Time-Blocking Kalender</strong></td>
                    <td className="highlight">✓ Terintegrasi</td>
                    <td>— Tidak Ada</td>
                    <td>— Tidak Ada</td>
                  </tr>
                  <tr>
                    <td><strong>Project Kanban &amp; Tim Kolaboratif</strong></td>
                    <td className="highlight">✓ Ada (Invite Code)</td>
                    <td>— Tidak Ada</td>
                    <td>— Tidak Ada</td>
                  </tr>
                  <tr>
                    <td><strong>Catatan Model Google Keep</strong></td>
                    <td className="highlight">✓ Warna &amp; Checklist</td>
                    <td>— Tidak Ada</td>
                    <td>— Tidak Ada</td>
                  </tr>
                  <tr>
                    <td><strong>Audio Alam Binaural Ambient</strong></td>
                    <td className="highlight">✓ Gratis Langsung Pakai</td>
                    <td>— Tidak Ada</td>
                    <td>🔒 Wajib Bayar Mahal</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Final Call To Action Card */}
          <div className="landing-cta-banner">
            <span className="landing-eyebrow-badge">🚀 Mulai Hari Ini</span>
            <h2>Tingkatkan Produktivitasmu Tanpa Rasa Jenuh</h2>
            <p>
              Mulai sesi fokus pertamamu sekarang juga. Bebas iklan, cepat, dan siap membantumu menuntaskan setiap pekerjaan.
            </p>
            <div className="landing-hero-actions">
              <button
                type="button"
                className="landing-cta-primary"
                onClick={scrollToTop}
              >
                ⏱️ Ke Timer Sekarang (Gratis)
              </button>
              <Link href="/upgrade" className="landing-cta-secondary">
                👑 Lihat Paket Pro →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
