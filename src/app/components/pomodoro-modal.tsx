"use client";

import { useRef } from "react";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";

type PomodoroModalProps = {
  onClose: () => void;
};

export function PomodoroModal({ onClose }: PomodoroModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useEscapeKey(onClose);
  useOutsideClick(modalRef, onClose);

  return (
    <div className="modal-backdrop pomodoro-modal-backdrop" role="presentation">
      <div
        ref={modalRef}
        className="info-modal-card pomodoro-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pomodoro-modal-title"
      >
        <div className="info-modal-top-bar">
          <div className="info-brand-header">
            <div className="info-brand-icon-badge">🍅</div>
            <div>
              <h2 id="pomodoro-modal-title" className="info-modal-title">
                Apa Itu Teknik Pomodoro?
              </h2>
              <span className="info-modal-subtitle">
                Metode Manajemen Waktu Terbaik untuk Melipatgandakan Fokus Tanpa Burnout
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
          <div className="info-intro-box">
            <p>
              Teknik Pomodoro diciptakan oleh <strong>Francesco Cirillo</strong> pada akhir tahun 1980-an
              saat ia masih seorang mahasiswa di Italia. Terinspirasi oleh timer dapur berbentuk tomat
              (<em>pomodoro</em> dalam bahasa Italia), metode ini membagi waktu kerja ke dalam blok-blok
              waktu terfokus yang diselingi istirahat singkat secara teratur.
            </p>
          </div>

          <div className="info-steps-section">
            <h3 className="info-section-heading">4 Langkah Inti Teknik Pomodoro:</h3>
            <div className="info-steps-list">
              <div className="info-step-row">
                <span className="info-step-num">1</span>
                <div>
                  <strong>Pilih 1 Tugas (Eat Your Frog)</strong>
                  <p>Tentukan satu tugas spesifik yang paling penting untuk diselesaikan. Hindari multitasking!</p>
                </div>
              </div>

              <div className="info-step-row">
                <span className="info-step-num">2</span>
                <div>
                  <strong>Fokus 25 Menit Penuh (1 Sesi Pomodoro)</strong>
                  <p>Nyalakan timer BiarFokus. Curahkan 100% konsentrasimu tanpa membuka media sosial, tab lain, atau obrolan.</p>
                </div>
              </div>

              <div className="info-step-row">
                <span className="info-step-num">3</span>
                <div>
                  <strong>Istirahat Singkat 5 Menit (Short Break)</strong>
                  <p>Saat alarm berbunyi, berhenti seketika. Minum air, regangkan otot tubuh, atau jalan sejenak untuk mengistirahatkan mata.</p>
                </div>
              </div>

              <div className="info-step-row">
                <span className="info-step-num">4</span>
                <div>
                  <strong>Istirahat Panjang 15–30 Menit (Setiap 4 Sesi)</strong>
                  <p>Setelah menuntaskan 4 sesi Pomodoro (1 siklus), ambil istirahat lebih lama untuk memulihkan energi otak sebelum memulai siklus baru.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="info-benefits-section">
            <h3 className="info-section-heading">Mengapa Teknik Ini Sangat Efektif Secara Ilmiah?</h3>
            <div className="info-benefits-grid">
              <div className="info-benefit-item">
                <span className="info-benefit-bullet">⚡</span>
                <div>
                  <strong>Melawan Hukum Parkinson</strong>
                  <p>Pekerjaan akan mengembang sesuai durasi waktu yang kamu sediakan. Batasan 25 menit memaksa otak bekerja cepat dan efisien.</p>
                </div>
              </div>

              <div className="info-benefit-item">
                <span className="info-benefit-bullet">🧠</span>
                <div>
                  <strong>Mencegah Kelelahan Mental (*Cognitive Fatigue*)</strong>
                  <p>Jeda berkala 5 menit mencegah kelelahan otak, sehingga daya ingat dan ketajaman berpikirmu tetap prima hingga sore hari.</p>
                </div>
              </div>

              <div className="info-benefit-item">
                <span className="info-benefit-bullet">🌊</span>
                <div>
                  <strong>Memicu State of Flow dengan Cepat</strong>
                  <p>Mengetahui bahwa kamu hanya perlu fokus selama 25 menit secara drastis menurunkan hambatan psikologis untuk mulai bekerja (*resistance to start*).</p>
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
            Mulai Sesi Fokus Pertama 🍅
          </button>
        </div>
      </div>
    </div>
  );
}
