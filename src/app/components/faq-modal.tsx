"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";

type FaqModalProps = {
  onClose: () => void;
};

type FaqItem = {
  question: string;
  answer: string;
};

const FAQ_LIST: FaqItem[] = [
  {
    question: "Apa itu BiarFokus dan bagaimana cara kerjanya?",
    answer:
      "BiarFokus adalah ekosistem produktivitas all-in-one yang menggabungkan teknik Pomodoro Timer (25 menit fokus, 5 menit istirahat), Catatan Cepat (Keep), Kalender Time-blocking, dan Papan Kanban Project. Semua alat ini dirancang dalam satu tampilan minimalis dan bebas distraksi agar kamu dapat menyelesaikan tugas tanpa terpecah fokus.",
  },
  {
    question: "Apakah data saya tersinkron otomatis antar HP dan Laptop?",
    answer:
      "Ya, 100%! Begitu kamu masuk (login) dengan akun Google atau email yang sama, seluruh task, catatan, acara kalender, dan kartu Kanban langsung tersinkronisasi secara real-time di semua perangkat (Desktop, Laptop, Tablet, maupun aplikasi PWA di ponsel kamu).",
  },
  {
    question: "Apa perbedaan antara Paket Gratis (Free) dan BiarFokus Pro?",
    answer:
      "Paket Gratis memberikan akses penuh ke Timer Pomodoro, Kalender, Catatan, 1 Kanban Board utama, dan hingga 5 task aktif sekaligus. Paket Pro (Rp 29.000/bln) membuka kuota task tanpa batas, unlimited Kanban boards & kolaborasi tim, statistik produktivitas lengkap seumur hidup, audio suasana fokus premium (White noise, Rain, Forest), serta tema warna eksklusif.",
  },
  {
    question: "Metode pembayaran apa saja yang didukung untuk upgrade ke Pro?",
    answer:
      "Kami mendukung pembayaran lokal instan melalui QRIS (GoPay, OVO, Dana, ShopeePay, LinkAja, BCA/Mandiri Mobile), Virtual Account bank nasional (BCA, Mandiri, BNI, BRI), serta kartu debit/kredit berlogo Visa dan Mastercard.",
  },
  {
    question: "Apakah saya bisa membatalkan langganan kapan saja?",
    answer:
      "Tentu saja. Tidak ada ikatan kontrak jangka panjang. Kamu bisa membatalkan langganan kapan saja dengan 1 klik melalui menu Akun. Akunmu akan tetap berstatus Pro sampai akhir masa periode tagihan berjalan dan tidak akan ditagih di bulan berikutnya.",
  },
  {
    question: "Apakah aplikasi ini bisa diinstall di HP seperti aplikasi asli?",
    answer:
      "Bisa! BiarFokus dibangun dengan teknologi Progressive Web App (PWA). Cukup buka website di browser HP (Chrome atau Safari), lalu pilih menu 'Tambahkan ke Layar Utama' (Add to Home Screen). BiarFokus akan terinstall dengan ikon aplikasi di beranda HP-mu dan bisa dibuka secara instan.",
  },
  {
    question: "Seberapa aman data pribadi dan catatan saya?",
    answer:
      "Keamanan datamu terjamin. Kami menerapkan enkripsi SSL/TLS saat pengiriman data dan Row-Level Security (RLS) pada basis data PostgreSQL kami. Hanya akunmu yang memiliki kunci akses untuk membaca dan mengubah data tugas maupun catatan pribadimu.",
  },
];

export function FaqModal({ onClose }: FaqModalProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const modalRef = useRef<HTMLDivElement>(null);
  useEscapeKey(onClose);
  useOutsideClick(modalRef, onClose);

  function toggleItem(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        ref={modalRef}
        className="info-modal-card faq-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="faq-modal-title"
      >
        <div className="info-modal-top-bar">
          <div className="info-brand-header">
            <div className="info-brand-mark">
              <Image
                src="/biarfokus-icon.png"
                alt="Logo BiarFokus"
                width={42}
                height={42}
                priority
              />
            </div>
            <div>
              <h2 id="faq-modal-title" className="info-modal-title">
                Pusat Bantuan & FAQ
              </h2>
              <span className="info-modal-subtitle">
                Pertanyaan yang sering diajukan seputar BiarFokus
              </span>
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Tutup FAQ"
          >
            ×
          </button>
        </div>

        <div className="info-modal-content faq-scroll-content">
          <div className="faq-accordion-list">
            {FAQ_LIST.map((item, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
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
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="faq-answer-panel">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="info-modal-footer">
          <span className="faq-contact-hint">
            Masih butuh bantuan? Hubungi kami di Instagram{" "}
            <strong>@biarfokus.id</strong>
          </span>
          <button type="button" className="primary-button" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
