import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tentang Kami & Karir — BiarFokus",
  description:
    "Pelajari perjalanan visi BiarFokus dalam membangun ekosistem produktivitas yang tenang, serta kultur kerja 100% full-remote tim kami.",
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
            Karena itulah <strong>BiarFokus</strong> dirancang sejak hari pertama sebagai <strong>satu ekosistem terpadu</strong>: menetapkan prioritas tugas terbesar (*Eat That Frog*), mencatat kilasan ide cepat ala Google Keep, memetakan waktu kerja dengan time-blocking kalender, lalu mengeksekusinya tanpa gangguan dengan Timer Pomodoro saintifik dan suara alam penenang.
          </p>
          <p>
            Misi kami sederhana: menghadirkan sebuah ruang kerja digital yang tenang, privat, dan 100% bebas dari distraksi iklan atau algoritma yang memancing kecanduan.
          </p>
        </div>
      </section>

      {/* 4 Core Pillars Grid */}
      <section className="about-pillars-section">
        <div className="about-section-title">
          <h2>4 Pilar Ekosistem BiarFokus</h2>
          <p>Fondasi sains dan kebiasaan terbaik yang kami satukan dalam satu aplikasi</p>
        </div>

        <div className="about-pillars-grid">
          <div className="about-pillar-box">
            <span className="about-pillar-icon" aria-hidden="true">🍅</span>
            <h3>Pomodoro Saintifik</h3>
            <p>
              Ritme fokus 25 menit dan 5 menit jeda berlandaskan sains kognitif ultradian untuk mencegah kelelahan otak (*burnout*).
            </p>
          </div>

          <div className="about-pillar-box">
            <span className="about-pillar-icon" aria-hidden="true">🐸</span>
            <h3>Eat That Frog Prioritas</h3>
            <p>
              Prinsip Brian Tracy untuk menaklukkan tugas terberat dan terpenting di pagi hari sebelum teralihkan oleh tugas-tugas kecil.
            </p>
          </div>

          <div className="about-pillar-box">
            <span className="about-pillar-icon" aria-hidden="true">📝</span>
            <h3>Catatan Cepat Model Keep</h3>
            <p>
              Tangkap inspirasi kilat, checklist to-do, dan referensi tanpa harus meninggalkan layar timer utama.
            </p>
          </div>

          <div className="about-pillar-box">
            <span className="about-pillar-icon" aria-hidden="true">📅</span>
            <h3>Time-Blocking Kalender</h3>
            <p>
              Kendalikan jam kerjamu dengan memetakan sesi fokus langsung ke slot waktu nyata agar hari kerjamu terarah rapi.
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
            Kami percaya hasil karya hebat lahir dari rasa percaya dan kebebasan, bukan dari absensi jam 9 ke 5 di kantor. Tim BiarFokus bekerja secara penuh jarak jauh (*100% full-remote*) dari berbagai sudut kota di Indonesia dan dunia — mengutamakan komunikasi asinkron yang terstruktur dan ruang kerja yang tenang.
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
            <p>Budaya *async-first*. Kami memprioritaskan dokumen tertulis dan kanban daripada rapat panjang yang memecah fokus.</p>
          </div>
          <div className="about-perk-card">
            <span className="about-perk-icon" aria-hidden="true">☕</span>
            <h4>Focus &amp; Workspace Stipend</h4>
            <p>Tunjangan kopi bulanan, buku bacaan, serta dukungan perangkat kerja untuk menunjang produktivitasmu.</p>
          </div>
          <div className="about-perk-card">
            <span className="about-perk-icon" aria-hidden="true">🧘</span>
            <h4>Kesejahteraan &amp; Fleksibilitas</h4>
            <p>Jam kerja berbasis hasil (*output-driven*). Waktu cuti dan istirahat yang dihormati tanpa rasa bersalah.</p>
          </div>
        </div>

        {/* Mock Open Roles */}
        <div className="about-roles-heading">
          <h3>Peluang Karir Terbuka</h3>
          <span className="about-roles-badge">🟢 4 Posisi Terbuka (Full Remote)</span>
        </div>

        <div className="about-roles-list">
          <div className="about-role-item">
            <div className="about-role-info">
              <h4>Senior Frontend Craftsman (Next.js &amp; React)</h4>
              <div className="about-role-tags">
                <span className="about-role-tag remote">🌐 100% Remote</span>
                <span className="about-role-tag">Full-Time</span>
                <span className="about-role-tag">Design Systems · Micro-interactions</span>
              </div>
            </div>
            <a href="mailto:karir@biarfokus.com?subject=Lamaran:%20Senior%20Frontend%20Craftsman" className="about-apply-btn">
              Kirim Lamaran →
            </a>
          </div>

          <div className="about-role-item">
            <div className="about-role-info">
              <h4>Product Designer &amp; UX Specialist</h4>
              <div className="about-role-tags">
                <span className="about-role-tag remote">🌐 100% Remote</span>
                <span className="about-role-tag">Full-Time / Kontrak</span>
                <span className="about-role-tag">Figma · Zen UI · Prototyping</span>
              </div>
            </div>
            <a href="mailto:karir@biarfokus.com?subject=Lamaran:%20Product%20Designer" className="about-apply-btn">
              Kirim Lamaran →
            </a>
          </div>

          <div className="about-role-item">
            <div className="about-role-info">
              <h4>Backend &amp; Cloud Reliability Engineer</h4>
              <div className="about-role-tags">
                <span className="about-role-tag remote">🌐 100% Remote</span>
                <span className="about-role-tag">Full-Time</span>
                <span className="about-role-tag">Supabase · PostgreSQL · API Security</span>
              </div>
            </div>
            <a href="mailto:karir@biarfokus.com?subject=Lamaran:%20Backend%20Engineer" className="about-apply-btn">
              Kirim Lamaran →
            </a>
          </div>

          <div className="about-role-item">
            <div className="about-role-info">
              <h4>Community &amp; Focus Advocate Lead</h4>
              <div className="about-role-tags">
                <span className="about-role-tag remote">🌐 100% Remote</span>
                <span className="about-role-tag">Fleksibel / Part-Time</span>
                <span className="about-role-tag">Edukasi Produktivitas · Social Media</span>
              </div>
            </div>
            <a href="mailto:karir@biarfokus.com?subject=Lamaran:%20Community%20Lead" className="about-apply-btn">
              Kirim Lamaran →
            </a>
          </div>
        </div>

        {/* Footer info for careers */}
        <div className="about-careers-footer">
          <p>
            Tidak menemukan posisi yang pas tetapi merasa memiliki visi yang sama? Kami selalu terbuka menyambut orang-orang berbakat yang peduli pada produktivitas yang sehat.
          </p>
          <a href="mailto:karir@biarfokus.com" className="about-contact-mail">
            ✉️ Hubungi kami di karir@biarfokus.com
          </a>
        </div>
      </section>

      {/* Bottom CTA to App */}
      <section style={{ textAlign: "center", marginTop: "56px" }}>
        <Link href="/" className="landing-cta-primary" style={{ display: "inline-flex", padding: "14px 28px", textDecoration: "none" }}>
          ⏱️ Mulai Sesi Fokus Pertamamu Sekarang
        </Link>
      </section>
    </main>
  );
}
