"use client";

import Link from "next/link";

export function LandingSection() {
  function scrollToTop() {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <section className="landing-section-wrapper" aria-label="Eksplorasi Ekosistem BiarFokus">
      {/* Subtle Scroll Bridge Indicator */}
      <div className="landing-scroll-bridge">
        <div className="landing-bridge-pill">
          ✨ Ekosistem Produktivitas All-in-One
        </div>
        <div className="landing-bridge-arrow">↓</div>
      </div>

      {/* Hero Header */}
      <div className="landing-hero">
        <h2>
          Bukan Sekadar Timer Biasa.{" "}
          <span className="gradient-text">Satu Ruang Kerja untuk Seluruh Harimu.</span>
        </h2>
        <p>
          BiarFokus menyatukan <strong>Focus Pomodoro</strong>, <strong>Time-Blocking Kalender</strong>,{" "}
          <strong>Kanban Kolaboratif</strong>, dan <strong>Catatan Cepat Keep</strong> ke dalam satu aplikasi yang tenang, cepat, dan 100% bebas distraksi iklan.
        </p>
        <div className="landing-hero-actions">
          <button type="button" className="landing-cta-primary" onClick={scrollToTop}>
            🚀 Mulai Fokus Sekarang (Gratis)
          </button>
          <Link href="/fitur" className="landing-cta-secondary">
            📖 Pelajari Panduan Alur Kerja →
          </Link>
        </div>
      </div>

      {/* Modern Bento Grid (Notion / Linear Style) */}
      <div className="landing-bento-grid">
        {/* Bento 1: Pomodoro & Zen Audio (Col-8) */}
        <div className="landing-bento-card col-8">
          <div>
            <span className="landing-bento-badge pink">⏱️ Focus Engine</span>
            <h3>Teknik Pomodoro Saintifik &amp; Suara Alam Penenang</h3>
            <p>
              Kerja 25 menit dengan intensitas tinggi, diselingi 5 menit istirahat teratur. Terbukti secara neurologis menjaga energi mental dan mencegah kejenuhan (burnout). Dilengkapi suara latar binaural untuk memblokir kebisingan ruangan.
            </p>
          </div>
          <div className="landing-bento-preview">
            <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--muted)" }}>
              🎧 Pilihan Suara Alam Terintegrasi:
            </span>
            <div className="landing-sound-pills">
              <span className="landing-sound-pill">🌧️ Hujan Deras</span>
              <span className="landing-sound-pill">🌲 Hutan Hening</span>
              <span className="landing-sound-pill">🌊 Ombak Laut</span>
              <span className="landing-sound-pill">☕ Suasana Kafe</span>
              <span className="landing-sound-pill">📻 White Noise</span>
              <span className="landing-sound-pill">🧘 Mode Zen (Full Screen)</span>
            </div>
          </div>
        </div>

        {/* Bento 2: Time-Blocking Calendar (Col-4) */}
        <div className="landing-bento-card col-4">
          <div>
            <span className="landing-bento-badge yellow">📅 Time-Blocking</span>
            <h3>Kalender Blok Waktu</h3>
            <p>
              Kuasai harimu sebelum hari menguasaimu. Jadwalkan blok waktu spesifik untuk tugas-tugas penting dengan sinkronisasi ke timer.
            </p>
          </div>
          <div className="landing-bento-preview">
            <div style={{ background: "var(--paper)", border: "1px solid color-mix(in srgb, var(--ink) 10%, transparent)", borderRadius: "10px", padding: "10px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#854d0e", marginBottom: "4px" }}>
                09:00 - 10:30 · Deep Work
              </div>
              <strong style={{ fontSize: "12.5px", color: "var(--ink)", display: "block" }}>
                Selesaikan Arsitektur SaaS
              </strong>
              <small style={{ color: "var(--muted)", fontSize: "11px" }}>3 Sesi Pomodoro terjadwal</small>
            </div>
          </div>
        </div>

        {/* Bento 3: Frog & Kanban Board (Col-4) */}
        <div className="landing-bento-card col-4">
          <div>
            <span className="landing-bento-badge green">🐸 Eat That Frog</span>
            <h3>Prioritas Frog &amp; Kanban</h3>
            <p>
              Tuntaskan tugas terberat di pagi hari. Visualisasikan pekerjaan tim dalam papan kartu drag-and-drop kolaboratif.
            </p>
          </div>
          <div className="landing-bento-preview">
            <div className="landing-mini-kanban">
              <div className="landing-mini-col">
                <div className="landing-mini-col-header">TO-DO</div>
                <div className="landing-mini-item frog">🐸 Audit Skema</div>
              </div>
              <div className="landing-mini-col">
                <div className="landing-mini-col-header">PROGRES</div>
                <div className="landing-mini-item">Landing Page</div>
              </div>
              <div className="landing-mini-col">
                <div className="landing-mini-col-header">SELESAI</div>
                <div className="landing-mini-item" style={{ borderLeftColor: "#16a34a" }}>✓ Setup Auth</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bento 4: Google Keep-Style Notes (Col-8) */}
        <div className="landing-bento-card col-8">
          <div>
            <span className="landing-bento-badge blue">📝 Google Keep Style</span>
            <h3>Catatan Cepat &amp; Checklist Terintegrasi</h3>
            <p>
              Jangan biarkan ide cemerlang menguap saat kamu sedang fokus. Tangkap catatan rapat, to-do checklist, dan referensi penting dengan kode warna pastel tepat di samping timermu.
            </p>
          </div>
          <div className="landing-bento-preview">
            <div className="landing-mini-notes">
              <div className="landing-mini-note-card" style={{ background: "#fef08a", border: "1px solid #fde047" }}>
                <strong>📌 Checklist Launching</strong>
                <ul style={{ margin: "6px 0 0 16px", padding: 0, fontSize: "11.5px" }}>
                  <li>☑️ Setup security headers HTTP</li>
                  <li>☑️ Testing unit test 99/99 lolos</li>
                  <li>⬜ Supavisor connection pooler</li>
                </ul>
              </div>
              <div className="landing-mini-note-card" style={{ background: "#bfdbfe", border: "1px solid #93c5fd" }}>
                <strong>💡 Ide Fitur Mendatang</strong>
                <p style={{ margin: "4px 0 0", fontSize: "11.5px" }}>
                  Integrasi Google Calendar dua arah dan export laporan produktivitas PDF untuk tim.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Impact Stats Banner */}
      <div className="landing-stats-grid">
        <div className="landing-stat-card">
          <div className="landing-stat-number">25.000+</div>
          <div className="landing-stat-label">Sesi Fokus Diselesaikan</div>
        </div>
        <div className="landing-stat-card">
          <div className="landing-stat-number">100%</div>
          <div className="landing-stat-label">Bebas Iklan &amp; Banner Pelacak</div>
        </div>
        <div className="landing-stat-card">
          <div className="landing-stat-number">4 in 1</div>
          <div className="landing-stat-label">Ekosistem Alat Produktivitas</div>
        </div>
        <div className="landing-stat-card">
          <div className="landing-stat-number">0 Detik</div>
          <div className="landing-stat-label">Waktu Setup (Instan Digunakan)</div>
        </div>
      </div>

      {/* Feature Comparison Table: BiarFokus vs Ordinary Apps */}
      <div className="landing-compare-section">
        <div className="landing-compare-header">
          <h3>Kenapa Pengguna Memilih BiarFokus?</h3>
          <p>
            Bandingkan keunggulan BiarFokus dengan aplikasi stopwatch sederhana atau website timer konvensional.
          </p>
        </div>

        <div className="landing-compare-table-wrapper">
          <table className="landing-compare-table">
            <thead>
              <tr>
                <th>Fitur &amp; Kemampuan</th>
                <th className="highlight">BiarFokus</th>
                <th>Stopwatch Biasa</th>
                <th>Web Pomodoro Iklanan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Fokus Pomodoro Berstandar Saintifik</strong></td>
                <td className="highlight">✅ Ya (Siklus 4 Sesi)</td>
                <td>❌ Tidak (Hanya Stopwatch)</td>
                <td>✅ Ya</td>
              </tr>
              <tr>
                <td><strong>100% Bebas Iklan Banner &amp; Pop-up</strong></td>
                <td className="highlight">✅ Bersih Tanpa Iklan</td>
                <td>✅ Tanpa Iklan</td>
                <td>❌ Penuh Iklan Mengganggu</td>
              </tr>
              <tr>
                <td><strong>Time-Blocking Kalender Terintegrasi</strong></td>
                <td className="highlight">✅ Ada</td>
                <td>❌ Tidak Ada</td>
                <td>❌ Tidak Ada</td>
              </tr>
              <tr>
                <td><strong>Project Kanban Kolaboratif (Tim)</strong></td>
                <td className="highlight">✅ Ada (Undang Teman)</td>
                <td>❌ Tidak Ada</td>
                <td>❌ Tidak Ada</td>
              </tr>
              <tr>
                <td><strong>Catatan Pastel Model Google Keep</strong></td>
                <td className="highlight">✅ Ada (Warna &amp; Checklist)</td>
                <td>❌ Tidak Ada</td>
                <td>❌ Tidak Ada</td>
              </tr>
              <tr>
                <td><strong>Audio Alam Penenang (Ambient Soundscapes)</strong></td>
                <td className="highlight">✅ Gratis &amp; Langsung Tersedia</td>
                <td>❌ Tidak Ada</td>
                <td>🔒 Wajib Bayar Mahal</td>
              </tr>
              <tr>
                <td><strong>Dukungan Instalasi Mobile PWA</strong></td>
                <td className="highlight">✅ iOS &amp; Android Ready</td>
                <td>❌ Hanya Web</td>
                <td>❌ Hanya Web</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Big Notion-Style Call To Action Card */}
      <div className="landing-cta-banner">
        <span className="landing-bridge-pill">🚀 Siap Memulai?</span>
        <h2>Tingkatkan Produktivitasmu Hari Ini Tanpa Burnout</h2>
        <p>
          Mulai sesi fokus pertamamu sekarang juga. Tanpa perlu download software yang rumit, langsung berjalan mulus di browsermu.
        </p>
        <div className="landing-hero-actions">
          <button type="button" className="landing-cta-primary" onClick={scrollToTop}>
            ⏱️ Mulai Sesi Fokus Sekarang
          </button>
          <Link href="/upgrade" className="landing-cta-secondary">
            👑 Lihat Keuntungan Akun Pro →
          </Link>
        </div>
      </div>
    </section>
  );
}
