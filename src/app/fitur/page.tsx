"use client";

import Link from "next/link";
import { useState } from "react";

type FeatureCategory =
  | "all"
  | "pomodoro"
  | "kalender"
  | "kanban"
  | "catatan"
  | "kebiasaan"
  | "statistik"
  | "pro"
  | "guide";

export default function FiturPage() {
  const [activeTab, setActiveTab] = useState<FeatureCategory>("all");

  return (
    <main className="inner-page fitur-page-container">
      {/* Hero Header */}
      <section className="fitur-hero-section">
        <div className="fitur-badge-pill">
          <span>✨ Eksplorasi Fitur &amp; Panduan</span>
        </div>
        <h1 className="fitur-hero-title">
          Kuasai Waktumu, Tuntaskan Setiap Pekerjaan
        </h1>
        <p className="fitur-hero-subtitle">
          BiarFokus menyatukan Focus Timer Pomodoro, Time-Blocking Kalender, Project Kanban, dan Catatan Quick Keep dalam satu ekosistem produktivitas yang harmonis dan bebas distraksi.
        </p>

        {/* Quick Filter Tabs */}
        <div className="fitur-filter-nav" role="tablist" aria-label="Kategori Fitur">
          <button
            type="button"
            className={`fitur-filter-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            Semua Fitur
          </button>
          <button
            type="button"
            className={`fitur-filter-btn ${activeTab === "pomodoro" ? "active" : ""}`}
            onClick={() => setActiveTab("pomodoro")}
          >
            🍅 Pomodoro Focus
          </button>
          <button
            type="button"
            className={`fitur-filter-btn ${activeTab === "kalender" ? "active" : ""}`}
            onClick={() => setActiveTab("kalender")}
          >
            📅 Kalender
          </button>
          <button
            type="button"
            className={`fitur-filter-btn ${activeTab === "kanban" ? "active" : ""}`}
            onClick={() => setActiveTab("kanban")}
          >
            📋 Kanban &amp; Frog
          </button>
          <button
            type="button"
            className={`fitur-filter-btn ${activeTab === "catatan" ? "active" : ""}`}
            onClick={() => setActiveTab("catatan")}
          >
            📝 Catatan Keep
          </button>
          <button
            type="button"
            className={`fitur-filter-btn ${activeTab === "kebiasaan" ? "active" : ""}`}
            onClick={() => setActiveTab("kebiasaan")}
          >
            ⚡ Pelacak Kebiasaan
          </button>
          <button
            type="button"
            className={`fitur-filter-btn ${activeTab === "statistik" ? "active" : ""}`}
            onClick={() => setActiveTab("statistik")}
          >
            📊 Statistik
          </button>
          <button
            type="button"
            className={`fitur-filter-btn ${activeTab === "pro" ? "active" : ""}`}
            onClick={() => setActiveTab("pro")}
          >
            👑 BiarFokus Pro
          </button>
          <button
            type="button"
            className={`fitur-filter-btn ${activeTab === "guide" ? "active" : ""}`}
            onClick={() => setActiveTab("guide")}
          >
            📖 Panduan Alur Kerja
          </button>
        </div>
      </section>

      {/* CATEGORY 1: POMODORO TIMER */}
      {(activeTab === "all" || activeTab === "pomodoro") && (
        <section className="fitur-category-card" id="pomodoro">
          <div className="fitur-category-head">
            <div className="fitur-category-icon-box pomo-accent">
              <span>⏱️</span>
            </div>
            <div>
              <span className="fitur-category-kicker">FOCUS ENGINE</span>
              <h2>Pomodoro Focus Timer &amp; Audio Zen</h2>
              <p>Bangun fokus mendalam (Deep Work) tanpa kelelahan mental melalui ritme kerja dan istirahat yang terukur.</p>
            </div>
          </div>

          <div className="fitur-grid-3">
            <div className="fitur-item-box">
              <span className="fitur-item-icon">⚙️</span>
              <h3>Custom Durasi Fleksibel</h3>
              <p>Atur durasi fokus bebas (1–180 menit), istirahat pendek (1–60 menit), dan istirahat panjang sesuai ritme biologis kerja kamu.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">⚡</span>
              <h3>Preset Cepat 1-Klik</h3>
              <p>Pilihan instan: <strong>Klasik (25/5/15)</strong> untuk ritme standar, <strong>Deep Work (50/10/30)</strong> untuk fokus berat, dan <strong>Sprint (15/3/10)</strong> untuk tugas kilat.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">🔔</span>
              <h3>Pilihan Nada Alarm Alami</h3>
              <p>Lonceng Resonan gema jernih, Digital Beep modern, Melodi Marimba ceria, dan Tibetan Singing Bowl untuk transisi pikiran yang tenang.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">🎯</span>
              <h3>Target Harian &amp; Siklus Panjang</h3>
              <p>Tentukan target harian (misal 6–8 sesi pomodoro) dan atur interval istirahat panjang otomatis setiap beberapa sesi fokus.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">🔊</span>
              <h3>Detak Jam (Clock Ticking)</h3>
              <p>Efek suara detak jam lembut di latar belakang yang membantu mengunci konsentrasi saat mengerjakan tugas sulit.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">🔁</span>
              <h3>Mulai Otomatis Sesi</h3>
              <p>Pilihan auto-start istirahat atau fokus agar sesi berikutnya langsung bergulir tanpa harus menekan tombol manual.</p>
            </div>
          </div>

          <div className="fitur-guide-box">
            <h4>💡 Cara Menggunakan Pomodoro Timer:</h4>
            <ol>
              <li>Pilih tugas yang ingin kamu selesaikan hari ini di Kanban atau daftar tugas.</li>
              <li>Pilih durasi fokus (misalnya 25 menit) lalu klik <strong>Mulai</strong>.</li>
              <li>Fokus penuh pada tugas tersebut hingga alarm berbunyi. Jika ada distraksi muncul, catat di Catatan Cepat.</li>
              <li>Saat istirahat tiba, renggangkan badan, minum air, dan hindari membuka media sosial.</li>
            </ol>
          </div>

          <div className="fitur-category-cta">
            <Link href="/" className="fitur-action-btn pomo">
              ⏱️ Buka Timer Pomodoro Sekarang →
            </Link>
          </div>
        </section>
      )}

      {/* CATEGORY 2: KALENDER & TIME BLOCKING */}
      {(activeTab === "all" || activeTab === "kalender") && (
        <section className="fitur-category-card" id="kalender">
          <div className="fitur-category-head">
            <div className="fitur-category-icon-box cal-accent">
              <span>📅</span>
            </div>
            <div>
              <span className="fitur-category-kicker">TIME MANAGEMENT</span>
              <h2>Kalender &amp; Time Blocking</h2>
              <p>Visualisasikan jadwal harian dan mingguan agar setiap jam memiliki tujuan yang jelas.</p>
            </div>
          </div>

          <div className="fitur-grid-3">
            <div className="fitur-item-box">
              <span className="fitur-item-icon">📆</span>
              <h3>Tampilan Multifaset Fleksibel</h3>
              <p>Beralih mudah antara tampilan <strong>Hari (Day)</strong>, <strong>Minggu (Week)</strong>, <strong>Bulan (Month)</strong>, dan <strong>Tahun (Year)</strong>.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">➕</span>
              <h3>Buat Jadwal Cepat</h3>
              <p>Klik tombol <strong>+ Buat Jadwal</strong> atau langsung klik pada slot jam di kalender untuk menjadwalkan agenda seketika.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">🔗</span>
              <h3>Sinkronisasi Otomatis Kanban</h3>
              <p>Semua kartu proyek di Kanban yang memiliki tanggal tenggat otomatis tampil di grid waktu kalender kamu.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">🔁</span>
              <h3>Jadwal Berulang (Recurring)</h3>
              <p>Dukungan penuh pengulangan harian, mingguan, bulanan untuk rapat berkala, olahraga, atau sesi belajar rutin.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">🎨</span>
              <h3>Label Warna &amp; Kategori</h3>
              <p>Kelompokkan jadwal berdasarkan warna tema dan kategori Acara atau Tugas agar kalender rapi dan mudah dibaca.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">🔍</span>
              <h3>Pencarian Cepat Jadwal</h3>
              <p>Cari jadwal lama atau masa depan dalam hitungan milidetik melalui bilah pencarian cerdas di topbar kalender.</p>
            </div>
          </div>

          <div className="fitur-guide-box">
            <h4>💡 Cara Menggunakan Kalender Time-Blocking:</h4>
            <ol>
              <li>Buka kalender pada mode <strong>Hari</strong> di pagi hari untuk melihat ketersediaan waktu.</li>
              <li>Blok jam produktif kamu untuk tugas penting (misal: 09:00 - 11:00 Selesaikan Laporan Proyek).</li>
              <li>Tandai jadwal istirahat dan makan siang agar tidak terjadi burnout.</li>
            </ol>
          </div>

          <div className="fitur-category-cta">
            <Link href="/kalender" className="fitur-action-btn cal">
              📅 Buka Kalender Time-Blocking →
            </Link>
          </div>
        </section>
      )}

      {/* CATEGORY 3: PROJECT KANBAN */}
      {(activeTab === "all" || activeTab === "kanban") && (
        <section className="fitur-category-card" id="kanban">
          <div className="fitur-category-head">
            <div className="fitur-category-icon-box kanban-accent">
              <span>📋</span>
            </div>
            <div>
              <span className="fitur-category-kicker">PROJECT &amp; TEAM TRACKING</span>
              <h2>Project Kanban &amp; Kolaborasi Tim</h2>
              <p>Khusus untuk mengelola proyek besar bertahap, roadmap multi-fase, dan pelacakan alur kerja bersama tim atau klien.</p>
            </div>
          </div>

          <div className="fitur-grid-3">
            <div className="fitur-item-box">
              <span className="fitur-item-icon">🗂️</span>
              <h3>Multi Papan Proyek</h3>
              <p>Kelola berbagai proyek secara terpisah (misal: Kantor, Proyek Klien, Roadmap Produk) dengan tombol ganti papan instan.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">🐸</span>
              <h3>Integrasi Eat Your Frog</h3>
              <p>Tandai kartu tugas utama yang menjadi fokus hari ini agar langsung terhubung ke dashboard fokus harian.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">☑️</span>
              <h3>Checklist Subtugas &amp; Progress Bar</h3>
              <p>Pecah kartu menjadi butir-butir checklist kecil dengan persentase progres visual yang otomatis meningkat.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">👥</span>
              <h3>Anggota Tim &amp; PIC</h3>
              <p>Tugaskan kartu ke rekan kerja dengan avatar visual dan mention <code>@nama</code> di kolom komentar.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">🏷️</span>
              <h3>Prioritas &amp; Label Warna</h3>
              <p>Tandai kartu dengan label High, Medium, Low Priority serta warna khusus untuk identifikasi sekilas.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">📱</span>
              <h3>Pindah Cepat Kolom di Mobile</h3>
              <p>Tombol satu sentuhan ⇄ mempermudah pemindahan kartu di layar HP tanpa perlu repot drag-and-drop.</p>
            </div>
          </div>

          <div className="fitur-guide-box">
            <h4>💡 Cara Menggunakan Kanban:</h4>
            <ol>
              <li>Buat papan khusus untuk proyek besar atau kolaborasi tim kamu.</li>
              <li>Tambahkan kartu di kolom <strong>To Do</strong> untuk butir-butir milestone proyek.</li>
              <li>Pindahkan kartu ke <strong>In Progress</strong> saat sedang dikerjakan.</li>
              <li>Setelah semua checklist tuntas, seret ke <strong>Done</strong> untuk merekam pencapaian.</li>
            </ol>
          </div>

          <div className="fitur-category-cta">
            <Link href="/kanban" className="fitur-action-btn kanban">
              📋 Buka Papan Kanban Proyek →
            </Link>
          </div>
        </section>
      )}

      {/* CATEGORY 4: CATATAN QUICK KEEP */}
      {(activeTab === "all" || activeTab === "catatan") && (
        <section className="fitur-category-card" id="catatan">
          <div className="fitur-category-head">
            <div className="fitur-category-icon-box notes-accent">
              <span>📝</span>
            </div>
            <div>
              <span className="fitur-category-kicker">KNOWLEDGE &amp; IDEAS</span>
              <h2>Catatan Fokus &amp; Quick Notes (Keep)</h2>
              <p>Tangkap ide pertama kali, butir tugas harian, dan coretan penting tanpa kehilangan momentum fokus kamu.</p>
            </div>
          </div>

          <div className="fitur-grid-3">
            <div className="fitur-item-box">
              <span className="fitur-item-icon">🔮</span>
              <h3>Floating Action Orb (FAB)</h3>
              <p>Tombol mengambang 3D yang selalu siap di pojok kanan bawah untuk membuka catatan cepat dari halaman mana pun.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">✍️</span>
              <h3>Live Markdown &amp; WYSIWYG</h3>
              <p>Ketik <code>#</code> untuk heading, <code>-</code> untuk list, atau <code>[]</code> untuk checklist interaktif secara langsung.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">📌</span>
              <h3>Sematkan Catatan (Pin)</h3>
              <p>Sematkan catatan prioritas di urutan paling atas agar informasi krusial selalu terlihat pertama kali.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">🎨</span>
              <h3>Warna &amp; Tema Kartu</h3>
              <p>Beri warna pastel menarik pada setiap kartu catatan untuk kategorisasi visual yang estetik dan rapi.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">📄</span>
              <h3>Ekspor Dokumen PDF &amp; Markdown</h3>
              <p>Unduh catatan kamu langsung dalam format dokumen PDF resmi atau salin format Markdown dengan satu klik.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">☁️</span>
              <h3>Simpan Otomatis (Auto-Save)</h3>
              <p>Setiap ketikan tersimpan otomatis ke cloud Supabase dan cache lokal browser tanpa perlu tombol simpan.</p>
            </div>
          </div>

          <div className="fitur-category-cta">
            <Link href="/catatan" className="fitur-action-btn notes">
              📝 Buka Catatan Quick Keep →
            </Link>
          </div>
        </section>
      )}

      {/* CATEGORY: PELACAK KEBIASAAN (ATOMIC HABITS) */}
      {(activeTab === "all" || activeTab === "kebiasaan") && (
        <section className="fitur-category-card" id="kebiasaan">
          <div className="fitur-category-head">
            <div className="fitur-category-icon-box" style={{ background: "color-mix(in srgb, #6366f1 14%, var(--paper))", color: "#6366f1" }}>
              <span>⚡</span>
            </div>
            <div>
              <span className="fitur-category-kicker">ATOMIC HABITS SYSTEM</span>
              <h2>Pelacak Kebiasaan Pribadi</h2>
              <p>Bangun rutinitas pribadi (morning routine, membaca buku, olahraga, journaling) dengan prinsip identitas dan pantang bolong dua kali dari James Clear.</p>
            </div>
          </div>

          <div className="fitur-grid-3">
            <div className="fitur-item-box">
              <span className="fitur-item-icon">🎯</span>
              <h3>Identity-Based Habits</h3>
              <p>Fokus pada siapa yang kamu bangun (&ldquo;Saya adalah seorang...&rdquo;) daripada sekadar target hasil sesaat.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">🔗</span>
              <h3>Habit Stacking &amp; 2-Minute Rule</h3>
              <p>Tautkan kebiasaan baru ke rutinitas lama (&ldquo;Setelah X, saya akan Y&rdquo;) dan mulai dengan versi mini tanpa rasa malas.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">🔥</span>
              <h3>Pantang Bolong Dua Kali &amp; Heatmap</h3>
              <p>Peringatan aktif saat streak terancam patah dan visualisasi konsistensi 90 hari ala GitHub Contribution Graph.</p>
            </div>
          </div>

          <div className="fitur-category-cta">
            <Link href="/kebiasaan" className="fitur-action-btn habits">
              ⚡ Buka Pelacak Kebiasaan Sekarang →
            </Link>
          </div>
        </section>
      )}

      {/* CATEGORY 5: STATISTIK & ANALITIK */}
      {(activeTab === "all" || activeTab === "statistik") && (
        <section className="fitur-category-card" id="statistik">
          <div className="fitur-category-head">
            <div className="fitur-category-icon-box stats-accent">
              <span>📊</span>
            </div>
            <div>
              <span className="fitur-category-kicker">PRODUCTIVITY INSIGHTS</span>
              <h2>Statistik &amp; Analitik Fokus</h2>
              <p>Pantau perkembangan jam kerja, konsistensi hari berturut-turut, dan tingkat penyelesaian tugas kamu.</p>
            </div>
          </div>

          <div className="fitur-grid-3">
            <div className="fitur-item-box">
              <span className="fitur-item-icon">🔥</span>
              <h3>Focus Streak Harian</h3>
              <p>Lacak rekor hari berturut-turut kamu berhasil menyelesaikan sesi fokus untuk membangun disiplin jangka panjang.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">⏳</span>
              <h3>Total Jam Deep Work</h3>
              <p>Akumulasi total menit dan jam fokus hari ini, pekan ini, dan bulan ini yang dihitung dengan presisi.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">📈</span>
              <h3>Tingkat Keberhasilan Sesi</h3>
              <p>Evaluasi rasio sesi fokus yang berhasil dituntaskan tanpa dihentikan di tengah jalan.</p>
            </div>
          </div>

          <div className="fitur-category-cta">
            <Link href="/statistik" className="fitur-action-btn stats">
              📊 Buka Statistik &amp; Evaluasi →
            </Link>
          </div>
        </section>
      )}

      {/* CATEGORY 6: PRO BENEFITS */}
      {(activeTab === "all" || activeTab === "pro") && (
        <section className="fitur-category-card pro-card" id="pro">
          <div className="fitur-category-head">
            <div className="fitur-category-icon-box pro-accent">
              <span>👑</span>
            </div>
            <div>
              <span className="fitur-category-kicker">PREMIUM ADVANTAGE</span>
              <h2>BiarFokus Pro</h2>
              <p>Buka potensi produktivitas penuh tanpa batasan untuk kamu yang serius menggapai target besar.</p>
            </div>
          </div>

          <div className="fitur-grid-3">
            <div className="fitur-item-box">
              <span className="fitur-item-icon">♾️</span>
              <h3>Papan Proyek Tanpa Batas</h3>
              <p>Buat papan Kanban sebanyak yang kamu butuhkan untuk seluruh bisnis, klien, dan proyek pribadi.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">☁️</span>
              <h3>Sinkronisasi Cloud Prioritas</h3>
              <p>Sinkronisasi data real-time berkecepatan tinggi antar desktop, tablet, dan smartphone kamu.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">✨</span>
              <h3>Badge Eksklusif Pro</h3>
              <p>Badge Pro berkilau di samping avatar dan menu profil sebagai tanda keanggotaan premium kamu.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">🗂️</span>
              <h3>Arsip Catatan &amp; Riwayat Sepuasnya</h3>
              <p>Simpan ribuan catatan dan riwayat sesi fokus tanpa khawatir batasan kuota penyimpanan lokal.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">🎧</span>
              <h3>Akses Penuh Audio Zen</h3>
              <p>Akses semua varian nada alarm menenangkan dan suara latar pengiring konsentrasi.</p>
            </div>
            <div className="fitur-item-box">
              <span className="fitur-item-icon">💳</span>
              <h3>Manajemen Langganan Profesional</h3>
              <p>Kelola tagihan, lihat invoice lunas, dan unduh bukti pembayaran langsung dari portal langganan.</p>
            </div>
          </div>

          <div style={{ marginTop: 24, textAlign: "center" }}>
            <Link href="/upgrade" className="fitur-upgrade-cta-btn">
              👑 Upgrade ke BiarFokus Pro Sekarang
            </Link>
          </div>
        </section>
      )}

      {/* CATEGORY 7: PANDUAN WORKFLOW ALUR KERJA REAL */}
      {(activeTab === "all" || activeTab === "guide") && (
        <section className="fitur-category-card" id="guide">
          <div className="fitur-category-head">
            <div className="fitur-category-icon-box guide-accent">
              <span>📖</span>
            </div>
            <div>
              <span className="fitur-category-kicker">PANDUAN ALUR KERJA REKOMENDASI</span>
              <h2>Alur Kerja Harian Produktif BiarFokus</h2>
              <p>Bagaimana menyatukan Catatan, Eat That Frog, Kalender, Pomodoro, Kebiasaan Pribadi, dan Kanban dalam satu ritme yang harmonis.</p>
            </div>
          </div>

          <div className="fitur-steps-container">
            <div className="fitur-step-item">
              <div className="fitur-step-badge">1</div>
              <div className="fitur-step-text">
                <h3>Tulis Note atau Task Pertama Kali di Catatan (Quick Keep)</h3>
                <p>Mulai hari dengan mencatat ide, butir tugas cepat, atau ringkasan pekerjaan di <strong>Catatan (Keep)</strong>. Tangkap semua pemikiran spontan dengan bebas distraksi tanpa harus memikirkan struktur kompleks.</p>
              </div>
            </div>

            <div className="fitur-step-item">
              <div className="fitur-step-badge">2</div>
              <div className="fitur-step-text">
                <h3>Pilih &amp; Tetapkan Tugas Terberat Sebagai &ldquo;Eat That Frog&rdquo;</h3>
                <p>Tinjau catatan dan tugas harianmu, lalu pilih 1 tugas yang paling menantang namun paling berdampak. Tandai sebagai <strong>🐸 Eat That Frog</strong> agar kamu mengeksekusinya lebih awal saat energi mental masih optimal.</p>
              </div>
            </div>

            <div className="fitur-step-item">
              <div className="fitur-step-badge">3</div>
              <div className="fitur-step-text">
                <h3>Time-Blocking di Kalender</h3>
                <p>Jadwalkan blok waktu khusus (misal 09:00 - 10:30) di <strong>Kalender</strong> khusus untuk tugas katak tersebut. Time-blocking membatasi distraksi dan memastikan ada waktu nyata yang dialokasikan di jadwal kerjamu.</p>
              </div>
            </div>

            <div className="fitur-step-item">
              <div className="fitur-step-badge">4</div>
              <div className="fitur-step-text">
                <h3>Eksekusi dengan Pomodoro Focus Timer &amp; Audio Zen</h3>
                <p>Nyalakan <strong>Timer Pomodoro</strong> (25 atau 50 menit) diiringi audio zen. Masuk ke mode Deep Work dan tuntaskan blok waktu tersebut tanpa membuka tab atau pesan lain.</p>
              </div>
            </div>

            <div className="fitur-step-item">
              <div className="fitur-step-badge">5</div>
              <div className="fitur-step-text">
                <h3>Pelacak Kebiasaan: Khusus Rutinitas Pribadi</h3>
                <p>Gunakan <strong>Pelacak Kebiasaan</strong> untuk komitmen pribadi harian (morning routine, membaca 10 halaman, olahraga, atau journaling) berbasis metodologi <em>Atomic Habits</em> dan visualisasi 90 hari.</p>
              </div>
            </div>

            <div className="fitur-step-item">
              <div className="fitur-step-badge">6</div>
              <div className="fitur-step-text">
                <h3>Kanban: Khusus Proyek Besar &amp; Kolaborasi Satu Tim</h3>
                <p>Gunakan papan <strong>Kanban Proyek</strong> ketika menangani proyek besar bertahap, roadmap multi-fase, atau pekerjaan yang membutuhkan tracking progres bersama rekan tim dan klien.</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
