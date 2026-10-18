"use client";

import { useRef } from "react";
import Image from "next/image";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";

type AboutModalProps = {
  onClose: () => void;
};

export function AboutModal({ onClose }: AboutModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useEscapeKey(onClose);
  useOutsideClick(modalRef, onClose);

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        ref={modalRef}
        className="info-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-modal-title"
      >
        <div className="info-modal-top-bar">
          <div className="info-brand-header">
            <div className="info-brand-mark">
              <Image
                src="/biarfokus-icon.png"
                alt="Logo BiarFokus"
                width={46}
                height={46}
                priority
              />
            </div>
            <div>
              <h2 id="about-modal-title" className="info-modal-title">
                Tentang BiarFokus
              </h2>
              <span className="info-modal-subtitle">
                Ekosistem Fokus, Catatan, & Time-Blocking Terpadu
              </span>
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <div className="info-modal-content">
          <div className="info-story-box">
            <span className="info-story-tag">Cerita & Alasan Dibuat</span>
            <p className="info-story-quote">
              &ldquo;Alasan saya membuat <strong>BiarFokus</strong> berawal dari masalah nyata
              yang selama ini saya alami: <strong>saya sangat susah untuk fokus, mudah terdistraksi,
              dan pekerjaan sering tercecer tanpa arah.</strong>&rdquo;
            </p>
            <p className="info-story-paragraph">
              Di luar sana ada banyak aplikasi produktivitas, tetapi semuanya serba terpisah — timer
              di satu aplikasi, to-do list di tab lain, catatan ide di tempat berbeda, dan jadwal kalender
              di aplikasi lain lagi. Akibatnya, alih-alih fokus bekerja, waktu dan energi mental justru habis
              untuk berpindah-pindah antar aplikasi.
            </p>
            <p className="info-story-paragraph">
              Karena itulah <strong>BiarFokus</strong> dibangun sebagai satu platform yang
              <strong> terintegrasi secara utuh</strong>. Dari mulai menetapkan prioritas tugas terbesar
              (<em>Eat Your Frog</em>), mencatat ide cepat ala Google Keep, mengatur jadwal waktu dengan
              time-blocking kalender, hingga mengeksekusinya menggunakan timer Pomodoro bebas distraksi.
            </p>
          </div>

          <div className="info-pillars-section">
            <h3 className="info-section-heading">4 Pilar Terintegrasi BiarFokus:</h3>
            <div className="info-pillars-grid">
              <div className="info-pillar-card">
                <span className="info-pillar-icon">🍅</span>
                <div>
                  <strong>Pomodoro Timer Akurat</strong>
                  <p>Ritme 25 menit fokus mendalam & 5 menit jeda istirahat dengan audio ambient penenang.</p>
                </div>
              </div>

              <div className="info-pillar-card">
                <span className="info-pillar-icon">🐸</span>
                <div>
                  <strong>Eat Your Frog Prioritas</strong>
                  <p>Selesaikan tugas terberat dan terpenting lebih dulu sebelum terdistraksi hal kecil.</p>
                </div>
              </div>

              <div className="info-pillar-card">
                <span className="info-pillar-icon">📝</span>
                <div>
                  <strong>Catatan & Todo Terhubung</strong>
                  <p>Catat checklist ide instan ala Google Keep yang otomatis sinkron dengan kalender.</p>
                </div>
              </div>

              <div className="info-pillar-card">
                <span className="info-pillar-icon">📅</span>
                <div>
                  <strong>Time-Blocking Kalender</strong>
                  <p>Kunci waktu nyata di kalender Google-style dengan drag & drop dan handle durasi.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="info-modal-footer">
          <button
            type="button"
            className="info-action-btn"
            onClick={onClose}
          >
            Mulai Fokus Sekarang 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
