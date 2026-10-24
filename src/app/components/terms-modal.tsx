"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";

type TermsModalProps = {
  initialTab?: "tos" | "privacy";
  onClose: () => void;
};

export function TermsModal({ initialTab = "tos", onClose }: TermsModalProps) {
  const [activeTab, setActiveTab] = useState<"tos" | "privacy">(initialTab);
  const modalRef = useRef<HTMLDivElement>(null);
  useEscapeKey(onClose);
  useOutsideClick(modalRef, onClose);

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        ref={modalRef}
        className="info-modal-card terms-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
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
              <h2 id="terms-modal-title" className="info-modal-title">
                {activeTab === "tos" ? "Ketentuan Layanan" : "Kebijakan Privasi"}
              </h2>
              <span className="info-modal-subtitle">
                BiarFokus Workspace &bull; Terakhir Diperbarui: Oktober 2026
              </span>
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Tutup ketentuan"
          >
            ×
          </button>
        </div>

        {/* Tab Selector */}
        <div className="terms-tab-bar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "tos"}
            className={`terms-tab-btn ${activeTab === "tos" ? "active" : ""}`}
            onClick={() => setActiveTab("tos")}
          >
            📜 Ketentuan Layanan (TOS)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "privacy"}
            className={`terms-tab-btn ${activeTab === "privacy" ? "active" : ""}`}
            onClick={() => setActiveTab("privacy")}
          >
            🔒 Kebijakan Privasi (Privacy Policy)
          </button>
        </div>

        <div className="info-modal-content terms-scroll-content">
          {activeTab === "tos" ? (
            <div className="legal-article">
              <section>
                <h3>1. Penerimaan Ketentuan</h3>
                <p>
                  Dengan mengakses dan menggunakan aplikasi <strong>BiarFokus</strong>, kamu menyetujui untuk terikat oleh Ketentuan Layanan ini. Jika kamu tidak menyetujui salah satu poin di sini, mohon untuk tidak menggunakan layanan kami.
                </p>
              </section>

              <section>
                <h3>2. Penggunaan Akun & Keamanan</h3>
                <p>
                  Kamu bertanggung jawab penuh atas keamanan kredensial akunmu (baik login melalui Google OAuth maupun email/password). Kamu setuju untuk tidak membagikan akses akun kepada pihak ketiga yang tidak berwenang dan segera memberitahu kami jika ada indikasi penyalahgunaan akun.
                </p>
              </section>

              <section>
                <h3>3. Langganan & Pembayaran (BiarFokus Pro)</h3>
                <p>
                  Fitur berbayar (BiarFokus Pro) ditagih di awal periode (bulanan atau tahunan) melalui payment gateway resmi yang aman (seperti Mayar.id atau Stripe). Kamu dapat membatalkan perpanjangan otomatis langganan kapan saja melalui menu Akun tanpa penalti.
                </p>
              </section>

              <section>
                <h3>4. Larangan Penggunaan</h3>
                <p>
                  Pengguna dilarang menggunakan BiarFokus untuk:
                </p>
                <ul>
                  <li>Menyimpan konten yang melanggar hukum, berbahaya, atau mengandung materi kebencian.</li>
                  <li>Melakukan serangan penolakan layanan (DDoS), eksploitasi API, scraping tanpa izin, atau upaya pembobolan sistem.</li>
                  <li>Mengganggu integritas infrastruktur database atau privasi pengguna lain.</li>
                </ul>
              </section>

              <section>
                <h3>5. Batasan Tanggung Jawab</h3>
                <p>
                  BiarFokus berupaya memberikan ketersediaan layanan setinggi mungkin (99.9% uptime). Namun, layanan disediakan &ldquo;sebagaimana adanya&rdquo; (*as-is*). Kami tidak bertanggung jawab atas kerugian tidak langsung yang timbul akibat gangguan jaringan internet pengguna atau force majeure.
                </p>
              </section>
            </div>
          ) : (
            <div className="legal-article">
              <section>
                <h3>1. Komitmen Privasi Kami</h3>
                <p>
                  Di BiarFokus, privasi dan keamanan data produktivitasmu adalah prioritas mutlak. <strong>Kami TIDAK AKAN PERNAH menjual, menyewakan, atau memperdagangkan data pribadimu kepada pihak ketiga atau pengiklan mana pun.</strong>
                </p>
              </section>

              <section>
                <h3>2. Data yang Kami Kumpulkan</h3>
                <ul>
                  <li><strong>Informasi Akun:</strong> Alamat email, nama profil, dan foto profil publik yang kamu bagikan saat login via Google atau pendaftaran manual.</li>
                  <li><strong>Data Produktivitas:</strong> Catatan, tugas (tasks), papan kanban, acara kalender, dan durasi sesi Pomodoro yang kamu simpan.</li>
                  <li><strong>Data Teknis Minimal:</strong> Waktu akses dan identitas anonim untuk keperluan pemulihan sesi, keamanan rate-limiting, serta performa aplikasi.</li>
                </ul>
              </section>

              <section>
                <h3>3. Isolasi & Enkripsi Data (Row Level Security)</h3>
                <p>
                  Data produktivitasmu disimpan di database PostgreSQL dengan isolasi ketat menggunakan <strong>Row-Level Security (RLS)</strong>. Artinya, data milikmu dienkripsi saat transit (HTTPS/TLS) dan hanya dapat diakses oleh akunmu sendiri yang telah terotentikasi.
                </p>
              </section>

              <section>
                <h3>4. Hak Pengguna & Penghapusan Akun</h3>
                <p>
                  Kamu memiliki kendali penuh atas datamu. Kamu berhak mengekspor data atau menghapus seluruh akunmu secara permanen kapan saja melalui menu Pengaturan Akun. Setelah akun dihapus, seluruh data tugas, catatan, dan riwayat fokus akan dimusnahkan secara permanen dari server kami.
                </p>
              </section>

              <section>
                <h3>5. Kontak & Pertanyaan</h3>
                <p>
                  Jika kamu memiliki pertanyaan seputar privasi atau ingin mengajukan masukan keamanan, silakan hubungi tim kami melalui Instagram resmi <strong>@biarfokus.id</strong> atau email support.
                </p>
              </section>
            </div>
          )}
        </div>

        <div className="info-modal-footer">
          <button type="button" className="info-modal-confirm-btn" onClick={onClose}>
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
