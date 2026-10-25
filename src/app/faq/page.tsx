"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type FaqItem = {
  question: string;
  answer: string;
  category: "umum" | "sinkronisasi" | "pro" | "teknis";
};

const FAQ_LIST: FaqItem[] = [
  {
    category: "umum",
    question: "Apa itu BiarFokus dan bagaimana cara kerjanya?",
    answer:
      "BiarFokus adalah ekosistem produktivitas all-in-one yang menggabungkan teknik Pomodoro Timer (25 menit fokus, 5 menit istirahat), Catatan Cepat (Keep), Kalender Time-blocking, dan Papan Kanban Project. Semua alat ini dirancang dalam satu tampilan minimalis dan bebas distraksi agar kamu dapat menyelesaikan tugas tanpa terpecah fokus.",
  },
  {
    category: "sinkronisasi",
    question: "Apakah data saya tersinkron otomatis antar HP dan Laptop?",
    answer:
      "Ya, 100%! Begitu kamu masuk (login) dengan akun Google atau email yang sama, seluruh task, catatan, acara kalender, dan kartu Kanban langsung tersinkronisasi secara real-time di semua perangkat (Desktop, Laptop, Tablet, maupun aplikasi PWA di ponsel kamu).",
  },
  {
    category: "pro",
    question: "Apa perbedaan antara Paket Gratis (Free) dan BiarFokus Pro?",
    answer:
      "Paket Gratis memberikan akses penuh ke Timer Pomodoro, Kalender, Catatan, 1 Kanban Board utama, dan hingga 5 task aktif sekaligus. Paket Pro (Rp 29.000/bln) membuka kuota task tanpa batas, unlimited Kanban boards & kolaborasi tim, statistik produktivitas lengkap seumur hidup, audio suasana fokus premium (White noise, Rain, Forest), serta tema warna eksklusif.",
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
