"use client";

import { useState } from "react";
import Link from "next/link";

type HubTab = "pomodoro" | "calendar" | "kanban" | "notes";

export function LandingSection() {
  const [activeTab, setActiveTab] = useState<HubTab>("pomodoro");

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
          {/* Hero Header */}
          <div className="landing-hero">
            <span className="landing-eyebrow-badge">
              ✨ Ekosistem Produktivitas All-in-One
            </span>
            <h2>
              Bukan Sekadar Timer Biasa.
              <span className="landing-hero-highlight">
                Satu Ruang Kerja untuk Seluruh Harimu.
              </span>
            </h2>
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
                {/* TAB 1: POMODORO */}
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
                      <div style={{ textAlign: "center", padding: "12px 0" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>
                          Pratinjau Mode Fokus
                        </span>
                        <div style={{ font: "bold 56px Georgia, serif", color: "var(--ink)", margin: "4px 0 10px" }}>
                          25:00
                        </div>
                        <button
                          type="button"
                          className="start-button"
                          style={{ width: "auto", padding: "8px 24px", fontSize: "13px", margin: "0 auto", display: "inline-block" }}
                          onClick={scrollToTop}
                        >
                          START FOCUS
                        </button>
                      </div>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap", marginTop: "6px" }}>
                        <span style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "999px", background: "var(--paper)", border: "1px solid color-mix(in srgb, var(--ink) 12%, transparent)", color: "var(--ink)" }}>
                          🌧️ Hujan
                        </span>
                        <span style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "999px", background: "var(--paper)", border: "1px solid color-mix(in srgb, var(--ink) 12%, transparent)", color: "var(--ink)" }}>
                          🌲 Hutan
                        </span>
                        <span style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "999px", background: "var(--paper)", border: "1px solid color-mix(in srgb, var(--ink) 12%, transparent)", color: "var(--ink)" }}>
                          🌊 Ombak
                        </span>
                        <span style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "999px", background: "var(--paper)", border: "1px solid color-mix(in srgb, var(--ink) 12%, transparent)", color: "var(--ink)" }}>
                          ☕ Kafe
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* TAB 2: CALENDAR */}
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
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ background: "color-mix(in srgb, var(--blue) 12%, var(--paper))", borderLeft: "4px solid var(--blue)", borderRadius: "8px", padding: "10px 12px" }}>
                          <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--blue)" }}>08:30 - 10:30 · DEEP WORK</div>
                          <strong style={{ fontSize: "13px", color: "var(--ink)", display: "block" }}>Selesaikan Fitur SaaS &amp; Refactor</strong>
                          <small style={{ color: "var(--muted)", fontSize: "11px" }}>4 Sesi Pomodoro terjadwal</small>
                        </div>
                        <div style={{ background: "color-mix(in srgb, var(--yellow) 16%, var(--paper))", borderLeft: "4px solid #ca8a04", borderRadius: "8px", padding: "10px 12px" }}>
                          <div style={{ fontSize: "11px", fontWeight: "700", color: "#854d0e" }}>11:00 - 12:00 · REVIEW</div>
                          <strong style={{ fontSize: "13px", color: "var(--ink)", display: "block" }}>Evaluasi Metrik &amp; Kanban Tim</strong>
                          <small style={{ color: "var(--muted)", fontSize: "11px" }}>2 Sesi Pomodoro</small>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* TAB 3: KANBAN */}
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
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div style={{ background: "var(--paper)", borderRadius: "10px", padding: "10px", border: "1px solid color-mix(in srgb, var(--ink) 8%, transparent)" }}>
                          <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--muted)", marginBottom: "6px" }}>TO-DO</div>
                          <div style={{ padding: "8px", background: "color-mix(in srgb, #22c55e 12%, var(--paper))", borderLeft: "3px solid #22c55e", borderRadius: "6px", fontSize: "12px", fontWeight: "600", color: "var(--ink)" }}>
                            🐸 Audit Skema DB
                          </div>
                        </div>
                        <div style={{ background: "var(--paper)", borderRadius: "10px", padding: "10px", border: "1px solid color-mix(in srgb, var(--ink) 8%, transparent)" }}>
                          <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--muted)", marginBottom: "6px" }}>IN PROGRESS</div>
                          <div style={{ padding: "8px", background: "color-mix(in srgb, var(--blue) 10%, var(--paper))", borderLeft: "3px solid var(--blue)", borderRadius: "6px", fontSize: "12px", fontWeight: "600", color: "var(--ink)" }}>
                            ⚡ Polish Landing Page
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* TAB 4: NOTES */}
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
                      <div style={{ background: "#fef08a", border: "1px solid #fde047", borderRadius: "12px", padding: "14px", color: "#111" }}>
                        <strong style={{ fontSize: "13px", display: "block", marginBottom: "6px" }}>📌 Catatan Cepat Rapat</strong>
                        <div style={{ fontSize: "12px", lineHeight: "1.5" }}>
                          <div>☑️ Pasang HTTP security headers</div>
                          <div>☑️ Living design system hub</div>
                          <div>⬜ Siapkan launch ke 100k pengguna</div>
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
