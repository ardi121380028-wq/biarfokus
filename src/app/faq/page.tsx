"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type FaqItem = {
  question: string;
  answer: string;
  category: "umum" | "sinkronisasi" | "pro" | "teknis" | "komunitas";
};

const FAQ_LIST: FaqItem[] = [
  {
    category: "umum",
    question: "Apa itu BiarFokus dan bagaimana cara kerjanya?",
    answer:
      "BiarFokus adalah ekosistem produktivitas all-in-one yang menyatukan teknik Pomodoro Timer saintifik, Catatan Cepat (Keep) dengan live markdown, Kalender Time-blocking, Project Kanban, Pelacak Kebiasaan Atomic Habits, dan Papan Peringkat Fokus. Semua alat ini dirancang dalam satu ruang kerja yang tenang, cepat, dan 100% bebas distraksi iklan agar kamu dapat menuntaskan karya terbaikmu.",
  },
  {
    category: "komunitas",
    question: "Bagaimana cara kerja Papan Peringkat Fokus (Leaderboard) dan kapan di-reset?",
    answer:
      "Papan Peringkat Fokus mengakumulasi total menit fokus nyata dari setiap sesi Pomodoro yang kamu selesaikan hingga alarm berbunyi (sesi yang dibatalkan di tengah jalan tidak dihitung). Peringkat mingguan diperbarui secara real-time dan di-reset otomatis setiap hari Senin pukul 00:00 WIB. Kamu juga dapat memfilter klasemen berdasarkan Hari Ini, Bulan Ini, dan Sepanjang Masa (All-Time).",
  },
  {
    category: "komunitas",
    question: "Apakah saya bisa menyembunyikan profil dari Papan Peringkat jika ingin fokus privat?",
    answer:
      "Tentu saja! Privasi adalah prioritas utama kami. Jika kamu lebih nyaman fokus secara pribadi tanpa berkompetisi di klasemen publik, kamu bisa mematikan opsi 'Tampilkan di Papan Peringkat' kapan saja melalui menu Pengaturan Akun. Namamu tidak akan muncul di tabel leaderboard publik.",
  },
  {
    category: "komunitas",
    question: "Apa saja 4 Kasta Liga di Papan Peringkat Fokus?",
    answer:
      "Papan Peringkat BiarFokus memiliki 4 tingkat liga eksklusif: Bibit Fokus (0–3 jam), Pejuang Konsisten (3–10 jam), Master Deep Work (10–20 jam), dan kasta tertinggi Zen Legend (20+ jam). Promosi tingkat liga terjadi secara otomatis begitu total jam fokusmu pada periode berjalan melampaui batas minimum kasta tersebut.",
  },
  {
    category: "komunitas",
    question: "Bagaimana cara membuka Lencana (Badges) & Pencapaian Keaktifan?",
    answer:
      "BiarFokus memiliki 7 Lencana Keaktifan Gamifikasi: (1) 🚀 Fokus Perdana untuk sesi pomodoro pertama, (2) ⚡ Konsistensi 3 Hari untuk streak 3 hari beruntun, (3) 🏆 Juara 7 Hari untuk streak sepekan penuh, (4) 🎯 Fokus Mantap untuk akumulasi 5 jam kerja, (5) 💎 Master Produktif untuk 25 jam fokus nyata, (6) 👑 Century Club untuk 100 sesi pomodoro tuntas, dan (7) 🌌 Sesi Deep Work untuk sesi maraton 45+ menit. Begitu syarat terpenuhi, lencana otomatis aktif dan menghiasi profil serta posisimu di leaderboard!",
  },
  {
    category: "komunitas",
    question: "Apa itu Arsip Pemenang Bulanan (Hall of Fame)?",
    answer:
      "Arsip Pemenang Bulanan adalah galeri penghormatan permanen bagi podium 3 besar pejuang fokus di setiap penutupan bulan kalender (November, Oktober, September, dll.). Fitur ini mengabadikan dedikasi dan konsistensi luar biasa para juara komunitas BiarFokus.",
  },
  {
    category: "umum",
    question: "Siapa pendiri (Founder) di balik platform BiarFokus?",
    answer:
      "BiarFokus didirikan dan dikembangkan oleh Ardi Kharisma. Berawal dari keresahan pribadi karena sulit fokus di era banjir notifikasi dan lelahnya berpindah antar puluhan aplikasi terpisah, Ardi membangun BiarFokus sebagai ruang kerja digital yang tenang, privat, bebas iklan, dan menyatukan seluruh alur produktivitas untuk masyarakat Indonesia dan dunia.",
  },
  {
    category: "umum",
    question: "Apa perbedaan Pelacak Kebiasaan (Habits) dengan Project Kanban?",
    answer:
      "Pelacak Kebiasaan berakar pada filosofi Atomic Habits dari James Clear untuk membangun rutinitas berulang harian (morning routine, membaca buku, olahraga, minum 2L air) dengan visualisasi streak dan heatmap 90 hari. Sementara itu, Project Kanban difokuskan untuk alur kerja proyek bertahap (To Do, In Progress, Done) dengan pembagian tugas, checklist, dan kolaborasi tim.",
  },
  {
    category: "sinkronisasi",
    question: "Apakah data saya tersinkron otomatis antar HP dan Laptop?",
    answer:
      "Ya, 100%! Begitu kamu masuk (login) dengan akun Google atau email yang sama, seluruh task, catatan, acara kalender, papan kanban, kebiasaan, dan riwayat fokus langsung tersinkronisasi secara real-time di semua perangkat (Desktop, Laptop, Tablet, maupun aplikasi PWA di ponsel kamu).",
  },
  {
    category: "pro",
    question: "Apa perbedaan antara Paket Gratis (Free) dan BiarFokus Pro?",
    answer:
      "Paket Gratis memberikan akses penuh ke Timer Pomodoro, Kalender, Catatan, 1 Kanban Board utama, dan hingga 5 task aktif sekaligus. Paket Pro (Rp 29.000/bln) membuka kuota task tanpa batas, unlimited Kanban boards & kolaborasi tim, statistik produktivitas lengkap seumur hidup, audio suasana fokus premium (White noise, Rain, Forest), serta badge Pro eksklusif.",
  },
  {
    category: "pro",
    question: "Metode pembayaran apa saja yang didukung untuk upgrade ke Pro?",
    answer:
      "Kami mendukung pembayaran lokal instan melalui QRIS (GoPay, OVO, Dana, ShopeePay, LinkAja, BCA/Mandiri Mobile), Virtual Account bank nasional (BCA, Mandiri, BNI, BRI), serta kartu debit/kredit berlogo Visa dan Mastercard.",
  },
  {
    category: "pro",
    question: "Apakah saya bisa membatalkan langganan kapan saja?",
    answer:
      "Tentu saja. Tidak ada ikatan kontrak jangka panjang. Kamu bisa membatalkan langganan kapan saja dengan 1 klik melalui menu Akun. Akunmu akan tetap berstatus Pro sampai akhir masa periode tagihan berjalan dan tidak akan ditagih di bulan berikutnya.",
  },
  {
    category: "teknis",
    question: "Apakah aplikasi ini bisa diinstall di HP seperti aplikasi asli?",
    answer:
      "Bisa! BiarFokus dibangun dengan teknologi Progressive Web App (PWA). Cukup buka website di browser HP (Chrome atau Safari), lalu pilih menu 'Tambahkan ke Layar Utama' (Add to Home Screen). BiarFokus akan terinstall dengan ikon aplikasi di beranda HP-mu dan bisa dibuka secara instan tanpa perlu download berat dari App Store.",
  },
  {
    category: "teknis",
    question: "Seberapa aman data pribadi dan catatan saya?",
    answer:
      "Keamanan datamu terjamin. Kami menerapkan enkripsi SSL/TLS saat pengiriman data dan Row-Level Security (RLS) pada basis data PostgreSQL kami. Hanya akunmu yang memiliki kunci akses untuk membaca dan mengubah data tugas maupun catatan pribadimu.",
  },
  {
    category: "umum",
    question: "Apa itu metode 'Eat That Frog' pada daftar tugas?",
    answer:
      "Metode 'Eat That Frog' berlandaskan buku legendaris Brian Tracy: selesaikan tugas terberat dan terpentingmu terlebih dahulu di pagi hari sebelum tugas-tugas kecil lainnya. Di BiarFokus, tugas pertama dalam daftarmu otomatis ditandai sebagai 'Frog Task' dengan lencana katak hijau untuk memicu momentum produktif terbaik.",
  },
  {
    category: "teknis",
    question: "Apakah suara alam (Ambient Sounds) bisa diputar saat offline?",
    answer:
      "Setelah dimuat pertama kali di browser, audio latar BiarFokus disimpan dalam cache lokal PWA perangkatmu sehingga kamu tetap dapat mendengarkan deru hujan atau suasana hutan yang tenang meskipun sedang berada di tempat tanpa sinyal internet.",
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const filteredFaq = useMemo(() => {
    return FAQ_LIST.filter((item) => {
      const matchCat = filterCategory === "all" || item.category === filterCategory;
      const qLower = search.toLowerCase();
      const matchSearch =
        !qLower ||
        item.question.toLowerCase().includes(qLower) ||
        item.answer.toLowerCase().includes(qLower);
      return matchCat && matchSearch;
    });
  }, [search, filterCategory]);

  function toggleItem(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <main className="inner-page faq-page-container">
      {/* Hero Header */}
      <section className="legal-hero">
        <div className="legal-badge-pill">
          <span>💡 Pusat Bantuan &amp; Tanya Jawab</span>
        </div>
        <h1>Pertanyaan yang Sering Diajukan (FAQ)</h1>
        <p>
          Temukan jawaban cepat seputar penggunaan timer, sinkronisasi data antar perangkat, paket Pro, dan keamanan di BiarFokus.
        </p>
      </section>

      {/* Main Content Card */}
      <section className="legal-card" style={{ maxWidth: 860, margin: "0 auto", width: "100%" }}>
        {/* Search & Category Filter */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 14,
                fontSize: 16,
                pointerEvents: "none",
                opacity: 0.6,
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Cari pertanyaan atau topik..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px 12px 42px",
                borderRadius: 14,
                border: "1px solid color-mix(in srgb, var(--ink) 14%, transparent)",
                background: "var(--paper)",
                color: "var(--ink)",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{
                  position: "absolute",
                  right: 12,
                  border: "none",
                  background: "transparent",
                  color: "var(--muted)",
                  fontSize: 14,
                  cursor: "pointer",
                }}
                aria-label="Hapus pencarian"
              >
                ✕
              </button>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 4,
              scrollbarWidth: "none",
            }}
          >
            {[
              { id: "all", label: "Semua Topik" },
              { id: "umum", label: "Umum & Timer" },
              { id: "komunitas", label: "🏆 Papan Peringkat & Lencana" },
              { id: "sinkronisasi", label: "Sinkronisasi" },
              { id: "pro", label: "Langganan Pro" },
              { id: "teknis", label: "PWA & Keamanan" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilterCategory(cat.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  border: "1px solid",
                  borderColor:
                    filterCategory === cat.id
                      ? "var(--ink)"
                      : "color-mix(in srgb, var(--ink) 14%, transparent)",
                  background: filterCategory === cat.id ? "var(--ink)" : "transparent",
                  color: filterCategory === cat.id ? "var(--paper)" : "var(--ink)",
                  transition: "all 0.15s ease",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="faq-accordion-list">
          {filteredFaq.length > 0 ? (
            filteredFaq.map((item, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={item.question}
                  className={`faq-accordion-item ${isOpen ? "is-open" : ""}`}
                >
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => toggleItem(idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{item.question}</span>
                    <span className="faq-arrow-icon" aria-hidden="true">
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="faq-answer-panel">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--muted)" }}>
              <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>🔍</span>
              <p style={{ margin: 0, fontWeight: 600 }}>Tidak ada pertanyaan yang sesuai dengan kata kunci &ldquo;{search}&rdquo;</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilterCategory("all");
                }}
                style={{
                  marginTop: 12,
                  padding: "6px 16px",
                  borderRadius: 999,
                  border: "1px solid color-mix(in srgb, var(--ink) 14%, transparent)",
                  background: "transparent",
                  color: "var(--ink)",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>

        {/* Contact Support Banner */}
        <div
          style={{
            marginTop: 32,
            padding: "20px 24px",
            borderRadius: 16,
            background: "color-mix(in srgb, var(--ink) 4%, transparent)",
            border: "1px solid color-mix(in srgb, var(--ink) 8%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
              Punya pertanyaan lain yang belum terjawab?
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
              Kirimkan masukan atau kendala langsung ke tim BiarFokus via Instagram kami.
            </p>
          </div>
          <a
            href="https://www.instagram.com/biarfokus.id/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 9999,
              background: "var(--ink)",
              color: "var(--paper)",
              fontWeight: 600,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Hubungi @biarfokus.id →
          </a>
        </div>

        {/* Back Link */}
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Link
            href="/"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--muted)",
              textDecoration: "none",
            }}
          >
            ← Kembali ke Timer &amp; Ruang Kerja
          </Link>
        </div>
      </section>
    </main>
  );
}
