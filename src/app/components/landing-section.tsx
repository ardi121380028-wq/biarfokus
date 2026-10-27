"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type HubTab = "pomodoro" | "calendar" | "kanban" | "notes" | "habits";

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
  { id: "habits", icon: "🌱", label: "Pelacak Kebiasaan & Streak", tab: "habits" },
  { id: "ambient", icon: "🎧", label: "Zen Audio Suara Alam", tab: "pomodoro" },
  { id: "frog", icon: "🐸", label: "Eat That Frog Priority", tab: "kanban" },
];

export function LandingSection() {
  const [activeTab, setActiveTab] = useState<HubTab>("pomodoro");
  const [cyclerIdx, setCyclerIdx] = useState(0);

  // Live Timer Simulation
  const [previewSeconds, setPreviewSeconds] = useState(1488); // 24:48
  const [previewRunning, setPreviewRunning] = useState(true);
  const [previewSound, setPreviewSound] = useState<"hujan" | "hutan" | "ombak" | "kafe">("hujan");

  // Keep Notes Checklist Item Toggle Simulation
  const [notesItemChecked, setNotesItemChecked] = useState(false);

  // Habits Simulation State
  const [habitRoutineFilter, setHabitRoutineFilter] = useState<"all" | "morning" | "afternoon" | "evening">("all");
  const [habitCheckedMap, setHabitCheckedMap] = useState<Record<string, boolean>>({
    h1: true,
    h2: true,
    h3: false,
    h4: true,
  });

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

  // Listen to cross-component tab switch events (e.g. from topbar navigation when guest clicks features)
  useEffect(() => {
    function handleSwitchTab(e: Event) {
      const customEvent = e as CustomEvent<{ tab: HubTab }>;
      if (customEvent.detail?.tab) {
        setActiveTab(customEvent.detail.tab);
        scrollToShowcase();
      }
    }

    window.addEventListener("biarfokus:switch-landing-tab", handleSwitchTab);
    return () => window.removeEventListener("biarfokus:switch-landing-tab", handleSwitchTab);
  }, []);

  // Check URL query param "?tab=..." on initial load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as HubTab | null;
      if (tabParam && ["pomodoro", "calendar", "kanban", "notes", "habits"].includes(tabParam)) {
        setActiveTab(tabParam);
        setTimeout(() => {
          scrollToShowcase();
        }, 180);
      }
    }
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
            className="landing-floating-chip chip-habits"
            onClick={() => handleFeatureChipClick("habits")}
            title="Pelacak Kebiasaan & Peta Konsistensi"
          >
            <span className="chip-icon">🌱</span>
            <span>Kebiasaan</span>
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

            {/* Heading Wrapper with Glossy AI Gradient & Orbiting Micro-Icons */}
            <div className="landing-hero-heading-wrap">
              {/* Cycling Pill Badge */}
              <div className="landing-heading-interactive-bar">
                <div className="landing-heading-cycler-pill">
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

              {/* Floating Orbiting Micro-Icons - Permanently visible around the heading */}
              <div className="landing-hero-floating-icons" aria-label="Ikon Ekosistem BiarFokus">
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
              <strong>Time-Blocking Kalender</strong>, <strong>Kanban Kolaboratif</strong>,{" "}
              <strong>Catatan Cepat Keep</strong>, serta <strong>Pelacak Kebiasaan &amp; Peta Konsistensi</strong> ke dalam satu aplikasi yang tenang dan 100% bebas gangguan iklan.
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
              <button
                type="button"
                className={`landing-hub-tab-btn ${activeTab === "habits" ? "active" : ""}`}
                onClick={() => setActiveTab("habits")}
              >
                <span>🌱</span> Kebiasaan &amp; Streak
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
                  biarfokus.site / {activeTab}
                </div>
                <div style={{ width: "42px" }} />
              </div>

              <div className="landing-mockup-body">
                {/* ======================================================== */}
                {/* TAB 1: POMODORO & ZEN AUDIO (EXACT 1:1 TIMERPANEL UI)    */}
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
                        {/* Authentic Mode Tabs */}
                        <div className="preview-mode-tabs">
                          <button type="button" className="preview-mode-tab active">Pomodoro</button>
                          <button type="button" className="preview-mode-tab">Istirahat Pendek</button>
                          <button type="button" className="preview-mode-tab">Istirahat Panjang</button>
                        </div>

                        {/* Authentic Daily Goal Progress Bar */}
                        <div className="preview-daily-goal">
                          <div className="preview-goal-header">
                            <span className="preview-goal-title">🎯 Target Hari Ini</span>
                            <span className="preview-goal-count"><strong>3</strong> / 4 sesi (75%)</span>
                          </div>
                          <div className="preview-goal-track">
                            <div className="preview-goal-fill" style={{ width: "75%" }} />
                          </div>
                        </div>

                        {/* Authentic Big Georgia Timer Display */}
                        <div className="preview-timer-main">
                          <div className="preview-timer-digits">
                            {formatPreviewTime(previewSeconds)}
                          </div>
                          <div className="preview-live-indicator">
                            <span className="preview-live-dot" />
                            <span>{previewRunning ? "Sesi Berjalan" : "Timer Dijeda"}</span>
                          </div>
                        </div>

                        {/* Authentic Focused Task Banner */}
                        <div className="preview-focused-task">
                          <span className="preview-task-badge">🎯 Fokus aktif</span>
                          <strong className="preview-task-text">Selesaikan Fitur SaaS &amp; Refactor</strong>
                          <span className="preview-task-pomo">🍅 3</span>
                        </div>

                        {/* Authentic Controls */}
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
                            className={`preview-start-btn ${previewRunning ? "" : "is-paused"}`}
                            onClick={() => setPreviewRunning(!previewRunning)}
                          >
                            {previewRunning ? "PAUSE" : "START FOCUS"}
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

                        {/* Authentic Ambient Sound Pills Bar */}
                        <div className="preview-ambient-bar">
                          <div className="preview-ambient-header">
                            <span className="preview-ambient-label">
                              🎧 Suara latar:
                              <strong>
                                {previewSound === "hujan" && " 🌧️ Hujan Deras"}
                                {previewSound === "hutan" && " 🌲 Hutan Tropis"}
                                {previewSound === "ombak" && " 🌊 Ombak Laut"}
                                {previewSound === "kafe" && " ☕ Kafe Ramai"}
                              </strong>
                            </span>
                            <div className="preview-sound-wave" title="Audio Wave Equalizer">
                              <span className="wave-bar" />
                              <span className="wave-bar" />
                              <span className="wave-bar" />
                              <span className="wave-bar" />
                              <span className="wave-bar" />
                            </div>
                          </div>
                          <div className="preview-ambient-pills">
                            <button
                              type="button"
                              className={`preview-ambient-pill ${previewSound === "hujan" ? "selected" : ""}`}
                              onClick={() => setPreviewSound("hujan")}
                            >
                              🌧️ Hujan
                            </button>
                            <button
                              type="button"
                              className={`preview-ambient-pill ${previewSound === "hutan" ? "selected" : ""}`}
                              onClick={() => setPreviewSound("hutan")}
                            >
                              🌲 Hutan
                            </button>
                            <button
                              type="button"
                              className={`preview-ambient-pill ${previewSound === "ombak" ? "selected" : ""}`}
                              onClick={() => setPreviewSound("ombak")}
                            >
                              🌊 Ombak
                            </button>
                            <button
                              type="button"
                              className={`preview-ambient-pill ${previewSound === "kafe" ? "selected" : ""}`}
                              onClick={() => setPreviewSound("kafe")}
                            >
                              ☕ Kafe
                            </button>
                          </div>
                        </div>

                        {/* Authentic Signature Theme Color Dots */}
                        <div className="preview-color-picker" aria-hidden="true">
                          <span className="preview-color-dot selected" style={{ background: "#1875d1" }} />
                          <span className="preview-color-dot" style={{ background: "#f77fa5" }} />
                          <span className="preview-color-dot" style={{ background: "#f6c832" }} />
                          <span className="preview-color-dot" style={{ background: "#22c55e" }} />
                          <span className="preview-color-dot" style={{ background: "#181818" }} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ======================================================== */}
                {/* TAB 2: TIME-BLOCKING KALENDER (EXACT 1:1 CALENDARVIEW)   */}
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
                        {/* Authentic Calendar Header */}
                        <div className="preview-cal-header">
                          <div className="preview-cal-branding">
                            <div className="preview-cal-icon-date">24</div>
                            <div className="preview-cal-header-text">
                              <h4>Oktober 2026</h4>
                              <span className="preview-cal-subtext">Minggu ke-43 · Time-Blocking</span>
                            </div>
                          </div>
                          <div className="preview-cal-nav-buttons">
                            <button type="button" className="preview-cal-nav-btn today">Hari ini</button>
                            <button type="button" className="preview-cal-nav-btn">‹</button>
                            <button type="button" className="preview-cal-nav-btn">›</button>
                          </div>
                          <button type="button" className="preview-cal-create-btn" onClick={scrollToTop}>
                            + Blok Waktu
                          </button>
                        </div>

                        {/* Authentic Calendar Grid Wrapper */}
                        <div className="preview-cal-grid-wrapper">
                          {/* Day Columns Header */}
                          <div className="preview-cal-date-row">
                            <div className="preview-cal-spacer" />
                            <div className="preview-cal-day-col-head">
                              <span className="preview-cal-day-name">RAB</span>
                              <span className="preview-cal-day-number">22</span>
                            </div>
                            <div className="preview-cal-day-col-head">
                              <span className="preview-cal-day-name">KAM</span>
                              <span className="preview-cal-day-number">23</span>
                            </div>
                            <div className="preview-cal-day-col-head is-today">
                              <span className="preview-cal-day-name">JUM</span>
                              <span className="preview-cal-day-number">24</span>
                            </div>
                          </div>

                          {/* Body Row with Time Ruler & Events */}
                          <div className="preview-cal-body-row">
                            {/* Time Axis */}
                            <div className="preview-cal-time-axis">
                              <span>08:00</span>
                              <span>09:30</span>
                              <span>11:00</span>
                              <span>12:30</span>
                            </div>

                            {/* Columns */}
                            <div className="preview-cal-columns">
                              {/* Red current time indicator line across today */}
                              <div className="preview-cal-now-line">
                                <span className="preview-cal-now-dot" />
                              </div>

                              {/* Rabu */}
                              <div className="preview-cal-day-column">
                                <div className="preview-cal-event preview-event-green">
                                  <span className="preview-cal-event-strip" />
                                  <span className="preview-event-time-tag">09:00 - 10:30 · 👥 3</span>
                                  <strong className="preview-event-name">Sprint Retrospective</strong>
                                </div>
                              </div>

                              {/* Kamis */}
                              <div className="preview-cal-day-column">
                                <div className="preview-cal-event preview-event-blue">
                                  <span className="preview-cal-event-strip" />
                                  <span className="preview-event-time-tag">08:30 - 10:00 · 🍅 3</span>
                                  <strong className="preview-event-name">Deep Work: Database Core</strong>
                                </div>
                              </div>

                              {/* Jumat (Hari Ini) */}
                              <div className="preview-cal-day-column is-today">
                                <div className="preview-cal-event preview-event-purple">
                                  <span className="preview-cal-event-strip" />
                                  <span className="preview-event-time-tag">08:30 - 09:30 · 🍅 2</span>
                                  <strong className="preview-event-name">Review PR &amp; Testing</strong>
                                </div>

                                {/* Animated Block Drop-In Demonstration */}
                                <div className="preview-cal-event preview-cal-drop-anim">
                                  <span className="preview-cal-event-strip" />
                                  <span className="preview-event-time-tag">✨ 10:30 - 12:00 · 🍅 3</span>
                                  <strong className="preview-event-name">+ Sesi Fokus: SaaS UI Polish</strong>
                                </div>

                                <div className="preview-cal-event preview-event-blue" style={{ opacity: 0.85 }}>
                                  <span className="preview-cal-event-strip" />
                                  <span className="preview-event-time-tag">12:30 - 13:30 · ☕ Jeda</span>
                                  <strong className="preview-event-name">Makan Siang &amp; Recharge</strong>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ======================================================== */}
                {/* TAB 3: PROJECT KANBAN & FROG (EXACT 1:1 KANBANVIEW UI)   */}
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
                        {/* Authentic Kanban Board Header */}
                        <div className="preview-kanban-header">
                          <div className="preview-kanban-title-box">
                            <span>🚀</span>
                            <h4>BiarFokus Sprint Roadmap</h4>
                          </div>
                          <div className="preview-kanban-member-stack">
                            <span className="preview-member-avatar">AH</span>
                            <span className="preview-member-avatar" style={{ background: "#9333ea" }}>RD</span>
                            <span className="preview-member-avatar" style={{ background: "#059669" }}>ML</span>
                            <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: "600", marginLeft: "4px" }}>
                              + Invite
                            </span>
                          </div>
                        </div>

                        {/* Authentic 3 Kanban Columns */}
                        <div className="preview-kanban-columns-row">
                          {/* Column 1: TO-DO */}
                          <div className="preview-kanban-column-container">
                            <div className="preview-kanban-col-head">
                              <span className="preview-kanban-col-title">To-Do</span>
                              <span className="preview-kanban-count">2</span>
                            </div>
                            <div className="preview-kanban-card-item">
                              <span className="preview-card-label" style={{ background: "rgba(24, 117, 209, 0.15)", color: "var(--blue)" }}>
                                Backend
                              </span>
                              <span className="preview-card-title">🔒 Pasang Security Headers</span>
                              <div className="preview-card-footer">
                                <span>≡</span>
                                <span>☑ 2/2</span>
                                <span>🍅 2</span>
                              </div>
                            </div>
                            <div className="preview-kanban-card-item">
                              <span className="preview-card-label" style={{ background: "rgba(147, 51, 234, 0.15)", color: "#9333ea" }}>
                                UI/UX
                              </span>
                              <span className="preview-card-title">📱 Mobile Drawer Gesture</span>
                              <div className="preview-card-footer">
                                <span>🍅 1</span>
                              </div>
                            </div>
                          </div>

                          {/* Column 2: IN PROGRESS (With Eat That Frog Card) */}
                          <div className="preview-kanban-column-container">
                            <div className="preview-kanban-col-head">
                              <span className="preview-kanban-col-title">In Progress</span>
                              <span className="preview-kanban-count">1</span>
                            </div>

                            {/* Authentic Eat That Frog Card */}
                            <div className="preview-kanban-card-item" style={{ borderLeft: "3.5px solid #22c55e" }}>
                              <div className="preview-card-cover-bar" style={{ background: "#22c55e" }} />
                              <span className="preview-card-label" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#dc2626" }}>
                                Critical Priority
                              </span>
                              <span className="preview-card-title">⚡ Optimasi Rendering &amp; Query DB</span>
                              <div className="preview-card-footer">
                                <span className="preview-frog-badge">🐸 Frog #1</span>
                                <span>☑ 2/3</span>
                                <span>💬 4</span>
                              </div>
                            </div>

                            {/* Simulated Card Gliding to DONE Column */}
                            <div className="preview-kanban-glider">
                              <span className="preview-card-label" style={{ background: "rgba(34, 197, 94, 0.18)", color: "#16a34a" }}>
                                Auth
                              </span>
                              <span className="preview-card-title">✨ One-Tap Google Auth</span>
                              <div className="preview-card-footer">
                                <span style={{ color: "#16a34a", fontWeight: "750" }}>Moving ke Selesai →</span>
                              </div>
                            </div>
                          </div>

                          {/* Column 3: SELESAI */}
                          <div className="preview-kanban-column-container">
                            <div className="preview-kanban-col-head">
                              <span className="preview-kanban-col-title">Selesai</span>
                              <span className="preview-kanban-count">3</span>
                            </div>
                            <div className="preview-kanban-card-item" style={{ borderLeft: "3.5px solid #22c55e" }}>
                              <span className="preview-card-label" style={{ background: "rgba(34, 197, 94, 0.15)", color: "#16a34a" }}>
                                Design
                              </span>
                              <span className="preview-card-title">🎨 Living Design System Hub</span>
                              <div className="preview-card-footer">
                                <span style={{ color: "#16a34a", fontWeight: "750" }}>✓ Selesai</span>
                                <span>🍅 4</span>
                              </div>
                            </div>
                            <div className="preview-kanban-card-item" style={{ borderLeft: "3.5px solid #22c55e" }}>
                              <span className="preview-card-label" style={{ background: "rgba(147, 51, 234, 0.15)", color: "#9333ea" }}>
                                Billing
                              </span>
                              <span className="preview-card-title">💳 Webhook Mayar Payment</span>
                              <div className="preview-card-footer">
                                <span style={{ color: "#16a34a", fontWeight: "750" }}>✓ Selesai</span>
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
                {/* TAB 4: CATATAN MODEL KEEP (EXACT 1:1 NOTECARD UI)        */}
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
                        {/* Authentic Search Bar */}
                        <div className="preview-notes-search-bar">
                          <span>🔍</span>
                          <span>Telusuri catatan cepat &amp; ide fokus...</span>
                        </div>

                        {/* Quick Filter Chips */}
                        <div className="preview-notes-chips">
                          <span className="preview-notes-chip active">📌 Semua</span>
                          <span className="preview-notes-chip">🏷️ Rapat</span>
                          <span className="preview-notes-chip">☑️ Checklist</span>
                        </div>

                        {/* Authentic Keep Grid of Pastel Notes */}
                        <div className="preview-keep-grid">
                          {/* Note 1: Pastel Yellow Checklist (#fff8b8) */}
                          <div className="preview-keep-card" style={{ background: "#fff8b8", borderColor: "#fde047" }}>
                            <div className="preview-keep-top">
                              <h5 className="preview-keep-title">📌 Checklist Sprint Launch</h5>
                              <span className="preview-keep-pin" title="Disematkan">📌</span>
                            </div>

                            <div className="preview-keep-checklist">
                              <label className="preview-keep-item">
                                <input type="checkbox" checked readOnly className="preview-keep-checkbox" />
                                <span className="preview-keep-item-text done">Pasang HTTP security headers</span>
                              </label>
                              <label className="preview-keep-item">
                                <input type="checkbox" checked readOnly className="preview-keep-checkbox" />
                                <span className="preview-keep-item-text done">Living design system hub</span>
                              </label>
                              <label
                                className="preview-keep-item"
                                onClick={() => setNotesItemChecked(!notesItemChecked)}
                                title="Klik untuk coba checklist"
                              >
                                <input type="checkbox" checked={notesItemChecked} onChange={() => {}} className="preview-keep-checkbox" />
                                <span className={`preview-keep-item-text ${notesItemChecked ? "done" : ""}`}>
                                  Siapkan launch 100k pengguna
                                </span>
                              </label>
                            </div>

                            <div className="preview-keep-tags">
                              <span className="preview-keep-tag">#sprint</span>
                              <span className="preview-keep-tag">#launch</span>
                            </div>

                            <div className="preview-keep-bottom">
                              <span>Diedit barusan</span>
                              <div className="preview-keep-dots">
                                <span className="preview-keep-dot" style={{ background: "#fff8b8", border: "1px solid #777" }} />
                                <span className="preview-keep-dot" style={{ background: "#d4e4ed" }} />
                                <span className="preview-keep-dot" style={{ background: "#f39f76" }} />
                              </div>
                            </div>
                          </div>

                          {/* Note 2: Pastel Blue Note (#d4e4ed) */}
                          <div className="preview-keep-card" style={{ background: "#d4e4ed", borderColor: "#bae6fd" }}>
                            <div className="preview-keep-top">
                              <h5 className="preview-keep-title">💡 Ide Fitur Zen Audio</h5>
                              <span title="Kategori Ide">🏷️</span>
                            </div>

                            <p style={{ fontSize: "11px", margin: "0", lineHeight: "1.45", color: "#1e293b" }}>
                              Mode suara frekuensi alfa 10Hz untuk boost konsentrasi kognitif &amp; sinkronisasi Google Calendar.
                            </p>

                            <div className="preview-keep-tags">
                              <span className="preview-keep-tag">#zen-audio</span>
                              <span className="preview-keep-tag">#roadmap</span>
                            </div>

                            <div className="preview-keep-bottom">
                              <span>Diedit kemarin</span>
                              <span style={{ fontSize: "9px", color: "var(--blue)", fontWeight: "700" }}>v2.0</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ======================================================== */}
                {/* TAB 5: PELACAK KEBIASAAN & PETA KONSISTENSI             */}
                {/* ======================================================== */}
                {activeTab === "habits" && (
                  <>
                    <div className="landing-mockup-content">
                      <h3>Pelacak Kebiasaan, Rutinitas &amp; Peta Konsistensi</h3>
                      <p>
                        Bangun disiplin harian tanpa beban mental. Kelola rutinitas pagi, siang, dan malam, pantau streak konsistensi ala heatmap GitHub, serta cetak laporan kemajuan berkala.
                      </p>
                      <ul className="landing-mockup-bullets">
                        <li>
                          <span className="landing-mockup-check">✓</span>
                          <span>Pengelompokan rutinitas: Pagi 🌅, Siang ☀️, Malam 🌙, dan Fleksibel ⚡.</span>
                        </li>
                        <li>
                          <span className="landing-mockup-check">✓</span>
                          <span>Peta Konsistensi &amp; Heatmap 52 Minggu: Pantau komitmen disiplin harianmu.</span>
                        </li>
                        <li>
                          <span className="landing-mockup-check">✓</span>
                          <span>Format siap cetak PDF / A4 untuk evaluasi dan refleksi produktivitas pribadi.</span>
                        </li>
                      </ul>
                    </div>

                    <div className="landing-mockup-visual">
                      <div className="preview-habits-card">
                        {/* Topbar: Routine Filters & Cetak Laporan Tag */}
                        <div className="preview-habits-topbar">
                          <div className="preview-habits-routine-pills">
                            <button
                              type="button"
                              className={`preview-habits-pill ${habitRoutineFilter === "all" ? "active" : ""}`}
                              onClick={() => setHabitRoutineFilter("all")}
                            >
                              Semua · 4
                            </button>
                            <button
                              type="button"
                              className={`preview-habits-pill ${habitRoutineFilter === "morning" ? "active" : ""}`}
                              onClick={() => setHabitRoutineFilter("morning")}
                            >
                              🌅 Pagi
                            </button>
                            <button
                              type="button"
                              className={`preview-habits-pill ${habitRoutineFilter === "afternoon" ? "active" : ""}`}
                              onClick={() => setHabitRoutineFilter("afternoon")}
                            >
                              ☀️ Siang
                            </button>
                            <button
                              type="button"
                              className={`preview-habits-pill ${habitRoutineFilter === "evening" ? "active" : ""}`}
                              onClick={() => setHabitRoutineFilter("evening")}
                            >
                              🌙 Malam
                            </button>
                          </div>

                          <Link href="/kebiasaan" className="preview-habits-print-tag" title="Buka Cetak Laporan di Kebiasaan">
                            <span>📄 Cetak Laporan</span>
                            <span style={{ fontSize: "9px" }}>↗</span>
                          </Link>
                        </div>

                        {/* Interactive Habit Checklist Items */}
                        <div className="preview-habits-list">
                          {(habitRoutineFilter === "all" || habitRoutineFilter === "morning") && (
                            <div className="preview-habit-item">
                              <div className="preview-habit-left">
                                <button
                                  type="button"
                                  className={`preview-habit-check-btn ${habitCheckedMap.h1 ? "checked" : ""}`}
                                  onClick={() =>
                                    setHabitCheckedMap((prev) => ({ ...prev, h1: !prev.h1 }))
                                  }
                                  title="Check-in kebiasaan"
                                >
                                  {habitCheckedMap.h1 ? "✓" : ""}
                                </button>
                                <div className="preview-habit-info">
                                  <span className="preview-habit-name">💧 Minum 500ml Air &amp; Stretching</span>
                                  <div className="preview-habit-meta">
                                    <span className="preview-habit-routine">🌅 Rutinitas Pagi</span>
                                    <span>· Setiap Hari</span>
                                  </div>
                                </div>
                              </div>
                              <span className="preview-habit-streak" title="18 Hari Berturut-turut">
                                🔥 18 hari
                              </span>
                            </div>
                          )}

                          {(habitRoutineFilter === "all" || habitRoutineFilter === "morning") && (
                            <div className="preview-habit-item">
                              <div className="preview-habit-left">
                                <button
                                  type="button"
                                  className={`preview-habit-check-btn ${habitCheckedMap.h2 ? "checked" : ""}`}
                                  onClick={() =>
                                    setHabitCheckedMap((prev) => ({ ...prev, h2: !prev.h2 }))
                                  }
                                  title="Check-in kebiasaan"
                                >
                                  {habitCheckedMap.h2 ? "✓" : ""}
                                </button>
                                <div className="preview-habit-info">
                                  <span className="preview-habit-name">📖 Membaca Buku Non-Fiksi 15 Menit</span>
                                  <div className="preview-habit-meta">
                                    <span className="preview-habit-routine">🌅 Rutinitas Pagi</span>
                                    <span>· Belajar</span>
                                  </div>
                                </div>
                              </div>
                              <span className="preview-habit-streak" title="14 Hari Berturut-turut">
                                🔥 14 hari
                              </span>
                            </div>
                          )}

                          {(habitRoutineFilter === "all" || habitRoutineFilter === "afternoon") && (
                            <div className="preview-habit-item">
                              <div className="preview-habit-left">
                                <button
                                  type="button"
                                  className={`preview-habit-check-btn ${habitCheckedMap.h3 ? "checked" : ""}`}
                                  onClick={() =>
                                    setHabitCheckedMap((prev) => ({ ...prev, h3: !prev.h3 }))
                                  }
                                  title="Check-in kebiasaan"
                                >
                                  {habitCheckedMap.h3 ? "✓" : ""}
                                </button>
                                <div className="preview-habit-info">
                                  <span className="preview-habit-name">🍅 Fokus 2 Sesi Pomodoro Deep Work</span>
                                  <div className="preview-habit-meta">
                                    <span className="preview-habit-routine" style={{ color: "#d97706" }}>☀️ Rutinitas Siang</span>
                                    <span>· 1 dari 2 target</span>
                                  </div>
                                </div>
                              </div>
                              <span className="preview-habit-streak" title="9 Hari Berturut-turut">
                                🔥 9 hari
                              </span>
                            </div>
                          )}

                          {(habitRoutineFilter === "all" || habitRoutineFilter === "evening") && (
                            <div className="preview-habit-item">
                              <div className="preview-habit-left">
                                <button
                                  type="button"
                                  className={`preview-habit-check-btn ${habitCheckedMap.h4 ? "checked" : ""}`}
                                  onClick={() =>
                                    setHabitCheckedMap((prev) => ({ ...prev, h4: !prev.h4 }))
                                  }
                                  title="Check-in kebiasaan"
                                >
                                  {habitCheckedMap.h4 ? "✓" : ""}
                                </button>
                                <div className="preview-habit-info">
                                  <span className="preview-habit-name">🌙 Refleksi Harian &amp; Rencana Esok</span>
                                  <div className="preview-habit-meta">
                                    <span className="preview-habit-routine" style={{ color: "#7c3aed" }}>🌙 Rutinitas Malam</span>
                                    <span>· Mindset</span>
                                  </div>
                                </div>
                              </div>
                              <span className="preview-habit-streak" title="21 Hari Berturut-turut">
                                🔥 21 hari
                              </span>
                            </div>
                          )}
                        </div>

                        {/* GitHub-style Consistency Map Mini Heatmap */}
                        <div className="preview-habits-heatmap-section">
                          <div className="preview-heatmap-header">
                            <span className="preview-heatmap-title">
                              <span>🗺️</span> Peta Konsistensi (GitHub Heatmap)
                            </span>
                            <span className="preview-heatmap-stat">
                              94% Konsisten Bulan Ini
                            </span>
                          </div>

                          <div className="preview-heatmap-grid-wrap" aria-label="Visual Heatmap Konsistensi">
                            {[
                              [1, 2, 2, 3, 4, 3, 2],
                              [2, 3, 4, 4, 3, 2, 1],
                              [3, 4, 4, 4, 4, 3, 2],
                              [1, 2, 3, 4, 3, 2, 3],
                              [2, 3, 3, 4, 4, 4, 3],
                              [4, 4, 3, 4, 4, 3, 2],
                              [3, 2, 4, 4, 4, 4, 3],
                              [2, 3, 4, 3, 4, 4, 4],
                              [4, 4, 4, 4, 3, 4, 3],
                              [3, 3, 4, 4, 4, 4, 4],
                              [4, 4, 4, 4, 4, 3, 4],
                              [4, 4, 4, 4, 3, 4, 4],
                            ].map((week, wIdx) => (
                              <div key={wIdx} className="preview-heatmap-col">
                                {week.map((level, dIdx) => (
                                  <span
                                    key={dIdx}
                                    className={`preview-heatmap-cell lvl-${level}`}
                                    title={`Minggu ${wIdx + 1}, Hari ${dIdx + 1}: ${level * 2} Check-in`}
                                  />
                                ))}
                              </div>
                            ))}
                          </div>

                          <div className="preview-heatmap-footer">
                            <span>🔥 Rekor: 21 Hari Disiplin Tanpa Putus</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                              <span>Sedikit</span>
                              <span className="preview-heatmap-cell lvl-0" />
                              <span className="preview-heatmap-cell lvl-1" />
                              <span className="preview-heatmap-cell lvl-2" />
                              <span className="preview-heatmap-cell lvl-3" />
                              <span className="preview-heatmap-cell lvl-4" />
                              <span>Banyak</span>
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
                    <td><strong>Pelacak Kebiasaan &amp; Peta Konsistensi</strong></td>
                    <td className="highlight">✓ Heatmap, Streak &amp; Laporan</td>
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
