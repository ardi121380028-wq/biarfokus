import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tentang Kami & Founder — BiarFokus",
  description:
    "Pelajari perjalanan visi BiarFokus dalam membangun ekosistem produktivitas yang tenang, 7 pilar terpadu, kultur 100% remote, dan cerita Founder Ardi Kharisma.",
};

export default function TentangPage() {
  return (
    <main className="inner-page about-page-container">
      {/* Hero Header */}
      <section className="about-hero">
        <div className="about-badge-pill">
          <span>🌱 Perjalanan, Visi &amp; Kultur Kami</span>
        </div>
        <h1>Membangun Ruang Kerja yang Tenang untuk Pikiran yang Jernih</h1>
        <p>
          BiarFokus lahir dari perjuangan nyata melawan distraksi digital berlebih. Kami percaya produktivitas sejati bukan tentang bekerja tergesa-gesa tanpa henti, melainkan bekerja secara tenang, terencana, dan bermakna.
        </p>
      </section>

      {/* Story & Journey Card */}
      <section className="about-story-card">
        <div className="about-quote-box">
          <p>
            &ldquo;Alasan saya membangun <strong>BiarFokus</strong> berawal dari masalah nyata yang saya alami setiap hari: <strong>saya sangat susah untuk fokus, mudah terdistraksi notifikasi, dan tugas-tugas harian tercecer tanpa arah.</strong>&rdquo;
          </p>
        </div>

        <div className="about-paragraphs">
          <p>
            Di luar sana ada ribuan aplikasi produktivitas, namun hampir semuanya berdiri sendiri-sendiri secara terpisah. Timer di satu aplikasi, to-do list di tab lain, catatan ide di aplikasi ketiga, dan jadwal kerja di kalender lain lagi. Akibatnya, alih-alih fokus menyelesaikan karya, waktu dan energi mental kita justru terkuras habis hanya untuk berpindah antar aplikasi (<em>context-switching fatigue</em>).
          </p>
          <p>
            Karena itulah <strong>BiarFokus</strong> dirancang sejak awal sebagai <strong>satu ekosistem terpadu</strong>: menetapkan prioritas tugas harian (<em>Eat That Frog</em>), mencatat kilasan ide cepat model Google Keep, memetakan waktu kerja dengan time-blocking kalender, berkolaborasi dengan Kanban, melacak konsistensi dengan Atomic Habits, hingga bersaing sehat di Papan Peringkat Fokus.
          </p>
          <p>
            Misi kami sederhana: menghadirkan sebuah ruang kerja digital yang tenang, privat, berdaya guna tinggi, dan 100% bebas dari distraksi iklan atau algoritma yang memancing kecanduan.
          </p>
        </div>
      </section>

      {/* 7 Core Pillars Grid */}
      <section className="about-pillars-section">
        <div className="about-section-title">
          <h2>7 Pilar Terpadu Ekosistem BiarFokus</h2>
          <p>Fondasi sains kognitif dan metodologi produktivitas terbaik yang disatukan dalam satu aplikasi</p>
        </div>

        <div className="about-pillars-grid">
          <div className="about-pillar-box">
            <span className="about-pillar-icon" aria-hidden="true">🍅</span>
            <h3>Pomodoro Saintifik &amp; Zen Audio</h3>
            <p>
              Ritme fokus 25 menit dan 5 menit jeda berlandaskan sains kognitif ultradian untuk mencegah kelelahan otak (burnout), ditemani audio penenang alami.
            </p>
          </div>

          <div className="about-pillar-box">
            <span className="about-pillar-icon" aria-hidden="true">🐸</span>
            <h3>Eat That Frog Prioritas</h3>
            <p>
              Prinsip Brian Tracy untuk menaklukkan tugas terberat dan terpenting di pagi hari saat energi mental masih optimal sebelum terdistraksi hal kecil.
            </p>
          </div>

          <div className="about-pillar-box">
            <span className="about-pillar-icon" aria-hidden="true">📝</span>
            <h3>Catatan Cepat Model Keep</h3>
            <p>
              Tangkap inspirasi kilat, checklist to-do interaktif, dan coretan dokumen dengan live markdown tanpa harus meninggalkan layar kerja utama.
            </p>
          </div>

          <div className="about-pillar-box">
            <span className="about-pillar-icon" aria-hidden="true">📅</span>
            <h3>Time-Blocking Kalender</h3>
            <p>
              Kendalikan jam kerjamu dengan memetakan sesi fokus langsung ke slot waktu nyata agar setiap jam memiliki tujuan yang jelas dan terarah rapi.
            </p>
          </div>

          <div className="about-pillar-box">
            <span className="about-pillar-icon" aria-hidden="true">📋</span>
            <h3>Project Kanban Kolaboratif</h3>
            <p>
              Kelola alur kerja proyek besar multi-fase bersama tim atau klien dengan visualisasi kolom, checklist subtugas, dan progress bar otomatis.
            </p>
          </div>

          <div className="about-pillar-box">
            <span className="about-pillar-icon" aria-hidden="true">⚡</span>
            <h3>Pelacak Kebiasaan (Atomic Habits)</h3>
            <p>
              Bangun rutinitas pribadi (morning routine, membaca, olahraga) dengan prinsip identitas, aturan pantang bolong dua kali, dan peta konsistensi 90 hari.
            </p>
          </div>

          <div className="about-pillar-box">
            <span className="about-pillar-icon" aria-hidden="true">🏆</span>
            <h3>Papan Peringkat &amp; Gamifikasi</h3>
            <p>
              Bersaing sehat dalam hening bersama pejuang fokus se-Indonesia. Raih promosi liga Bibit hingga Zen Legend, koleksi 7 lencana, dan masuk Hall of Fame bulanan.
            </p>
          </div>
        </div>
      </section>

      {/* Remote Culture & Careers Section */}
      <section className="about-careers-container">
        <div className="about-culture-intro">
          <div className="about-badge-pill" style={{ marginBottom: "12px" }}>
            <span>🌍 100% Full-Remote Work Culture</span>
          </div>
          <h2>Bekerja dari Mana Saja, Kapan Saja yang Membuatmu Paling Fokus</h2>
          <p>
            Kami percaya hasil karya hebat lahir dari rasa percaya dan kebebasan, bukan dari absensi jam 9 ke 5 di kantor. Tim BiarFokus bekerja secara penuh jarak jauh (<em>100% full-remote</em>) dari berbagai sudut kota di Indonesia dan dunia — mengutamakan komunikasi asinkron yang terstruktur dan ruang kerja yang tenang.
          </p>
        </div>

        {/* Remote Perks */}
        <div className="about-perks-grid">
          <div className="about-perk-card">
            <span className="about-perk-icon" aria-hidden="true">🏖️</span>
            <h4>Work From Anywhere</h4>
            <p>Bekerja dari rumah, kafe favorit, co-working space, atau tepi pantai. Kamu yang tentukan zonamu.</p>
          </div>
          <div className="about-perk-card">
            <span className="about-perk-icon" aria-hidden="true">🔇</span>
            <h4>Zero Useless Meetings</h4>
            <p>Budaya <em>async-first</em>. Kami memprioritaskan dokumen tertulis dan kanban daripada rapat panjang yang memecah fokus.</p>
          </div>
          <div className="about-perk-card">
            <span className="about-perk-icon" aria-hidden="true">☕</span>
            <h4>Focus &amp; Workspace Stipend</h4>
            <p>Tunjangan kopi bulanan, buku bacaan, serta dukungan perangkat kerja untuk menunjang produktivitasmu.</p>
          </div>
          <div className="about-perk-card">
            <span className="about-perk-icon" aria-hidden="true">🧘</span>
            <h4>Kesejahteraan &amp; Fleksibilitas</h4>
            <p>Jam kerja berbasis hasil (<em>output-driven</em>). Waktu cuti dan istirahat yang dihormati tanpa rasa bersalah.</p>
          </div>
        </div>

        {/* Careers Section - Sedang Tidak Tersedia */}
        <div className="about-roles-heading">
          <h3>Peluang Karir</h3>
          <span className="about-roles-badge not-available">🔴 Sedang Tidak Tersedia</span>
        </div>

        <div className="about-no-roles-card">
          <span className="about-no-roles-icon" aria-hidden="true">🌱</span>
          <h4>Saat ini belum ada posisi baru yang dibuka</h4>
          <p>
            Tim kerja kami saat ini sudah terisi penuh untuk fase pengembangan produk. Walaupun begitu, kami selalu senang terhubung dengan kreator dan pegiat produktivitas yang sevisi. Ikuti pembaruan terbaru atau hubungi kami melalui media sosial resmi.
          </p>
          <div className="about-no-roles-actions">
            <a
              href="https://www.instagram.com/biarfokus.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="about-apply-btn"
            >
              📸 Ikuti @biarfokus.id di Instagram →
            </a>
          </div>
        </div>
      </section>

      {/* FOUNDER PROFILE SECTION (DIPALING BAWAH TENTANG KAMI) */}
      <section className="about-founder-container" id="founder">
        <div className="about-founder-header">
          <div className="about-founder-badge-pill">
            <span>👑 Pendiri &amp; Kreator BiarFokus</span>
          </div>
          <div className="about-founder-origin-tag">
            <span>🇮🇩 Karya Anak Bangsa untuk Dunia</span>
          </div>
        </div>

        <div className="about-founder-body">
          <div className="about-founder-avatar-wrap">
            <div className="about-founder-avatar-frame">
              <span className="about-founder-avatar-crown" aria-hidden="true">👑</span>
              <div className="about-founder-avatar-fallback">
                <span>AK</span>
                <span className="about-founder-avatar-sub">Founder</span>
              </div>
            </div>
            <span className="about-founder-role-tag">
              ✨ Founder &amp; Lead Creator
            </span>
          </div>

          <div className="about-founder-info">
            <div className="about-founder-name-row">
              <h2 className="about-founder-name">Ardi Kharisma</h2>
              <span className="about-founder-title">Founder of BiarFokus</span>
            </div>

            <p className="about-founder-quote">
              &ldquo;Halo! Saya <strong>Ardi Kharisma</strong>, pendiri di balik BiarFokus. Saya membangun platform ini dari pengalaman pribadi: frustrasi karena sulit menjaga fokus di tengah gempuran notifikasi tak ada habisnya, serta lelah harus berpindah-pindah antar puluhan aplikasi kerja yang terpisah.
            </p>
            <p className="about-founder-quote" style={{ marginTop: -4 }}>
              Visi saya sederhana: <strong>memberikan ruang kerja digital yang tenang, bersih dari manipulasi iklan, ramah privasi, dan menyatukan seluruh kebutuhan produktivitas dalam satu aliran kerja yang harmonis</strong>. Semoga BiarFokus bisa menjadi sahabat setiamu dalam mewujudkan karya-karya terbaik!&rdquo;
            </p>

            <div className="about-founder-highlights">
              <div className="about-founder-highlight-item">
                <span>🧠</span>
                <div>
                  <strong>Berangkat dari Masalah Nyata</strong>
                  <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>Solutif &amp; berpusat pada pejuang fokus</div>
                </div>
              </div>
              <div className="about-founder-highlight-item">
                <span>🛡️</span>
                <div>
                  <strong>100% Privacy-First &amp; Bebas Iklan</strong>
                  <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>Tanpa distraksi banner iklan atau algoritma adiktif</div>
                </div>
              </div>
              <div className="about-founder-highlight-item">
                <span>🚀</span>
                <div>
                  <strong>Inovasi Berkelanjutan</strong>
                  <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>Terus berevolusi menyempurnakan fitur terbaik</div>
                </div>
              </div>
            </div>

            <div className="about-founder-socials">
              <a
                href="https://www.instagram.com/biarfokus.id/"
                target="_blank"
                rel="noopener noreferrer"
                className="about-founder-connect-btn"
              >
                📸 Terhubung via Instagram @biarfokus.id →
              </a>
              <Link
                href="/fitur"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--ink)",
                  textDecoration: "underline",
                  marginLeft: 8,
                }}
              >
                Pelajari Fitur &amp; Panduan Lengkap →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA to App */}
      <section style={{ textAlign: "center", marginTop: "56px" }}>
        <Link
          href="/"
          className="landing-cta-primary"
          style={{ display: "inline-flex", padding: "14px 28px", textDecoration: "none" }}
        >
          ⏱️ Mulai Sesi Fokus Pertamamu Sekarang
        </Link>
      </section>
    </main>
  );
}
