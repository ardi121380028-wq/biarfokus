"use client";

import { useState } from "react";
import Link from "next/link";

export default function KetentuanPage() {
  const [activeTab, setActiveTab] = useState<"tos" | "privacy">("tos");

  return (
    <main className="inner-page legal-page-container">
      {/* Hero Header */}
      <section className="legal-hero">
        <div className="legal-badge-pill">
          <span>📜 Ketentuan &amp; Privasi Legal</span>
        </div>
        <h1>Ketentuan Layanan &amp; Kebijakan Privasi</h1>
        <p>
          Transparansi, keamanan, dan privasi adalah komitmen utama BiarFokus. Baca ketentuan pemakaian dan komitmen perlindungan data pengguna kami di bawah ini.
        </p>
      </section>

      {/* Main Content Card */}
      <section className="legal-card">
        {/* Tab Switcher */}
        <div className="legal-tabs-row" role="tablist" aria-label="Pilih dokumen legal">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "tos"}
            className={`legal-tab-btn ${activeTab === "tos" ? "active" : ""}`}
            onClick={() => setActiveTab("tos")}
          >
            📜 Ketentuan Layanan (TOS)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "privacy"}
            className={`legal-tab-btn ${activeTab === "privacy" ? "active" : ""}`}
            onClick={() => setActiveTab("privacy")}
          >
            🔒 Kebijakan Privasi (Privacy Policy)
          </button>
        </div>

        {/* Tab 1: Terms of Service */}
        {activeTab === "tos" ? (
          <div className="legal-content-body">
            <div className="legal-section-block">
              <h3>1. Penerimaan Ketentuan</h3>
              <p>
                Dengan mengakses dan menggunakan aplikasi <strong>BiarFokus</strong> (baik melalui situs web, mobile PWA, maupun API terkait), kamu menyatakan telah membaca, memahami, dan menyetujui untuk terikat oleh Ketentuan Layanan ini. Jika kamu tidak menyetujui salah satu poin di sini, mohon untuk tidak menggunakan layanan kami.
              </p>
            </div>

            <div className="legal-section-block">
              <h3>2. Penggunaan Akun &amp; Keamanan Kredensial</h3>
              <p>
                Kamu bertanggung jawab penuh untuk menjaga kerahasiaan dan keamanan kredensial akunmu (baik login via Google OAuth maupun email/password). Kamu setuju untuk segera memberitahu tim BiarFokus jika menemukan indikasi pelanggaran keamanan atau penggunaan akun tanpa izin. BiarFokus tidak bertanggung jawab atas kerugian akibat kelalaian pengguna dalam menjaga kata sandi.
              </p>
            </div>

            <div className="legal-section-block">
              <h3>3. Langganan &amp; Pembayaran (BiarFokus Pro)</h3>
              <p>
                Fitur berbayar (BiarFokus Pro) ditagih di awal periode langganan (bulanan atau tahunan) melalui gerbang pembayaran resmi berlisensi (seperti Mayar.id atau Stripe). Pembayaran diproses dengan enkripsi standar industri. Kamu dapat membatalkan perpanjangan otomatis langganan kapan saja melalui menu Profil Pengaturan tanpa biaya pembatalan.
              </p>
            </div>

            <div className="legal-section-block">
              <h3>4. Batasan &amp; Larangan Penggunaan</h3>
              <p>
                Dalam menggunakan BiarFokus, pengguna dilarang keras untuk:
              </p>
              <ul>
                <li>Menyimpan konten yang melanggar hukum Republik Indonesia, membahayakan orang lain, atau memuat ujaran kebencian.</li>
                <li>Melakukan reverse engineering, dekompilasi, atau scraping massal tanpa izin tertulis resmi.</li>
                <li>Melakukan serangan penolakan layanan (DDoS), injeksi kode jahat, eksploitasi API, atau upaya intrusi ke server database.</li>
                <li>Menjual kembali akses akun atau memfasilitasi pihak ketiga tanpa otorisasi resmi.</li>
              </ul>
            </div>

            <div className="legal-section-block">
              <h3>5. Ketersediaan Layanan &amp; Batasan Tanggung Jawab</h3>
              <p>
                BiarFokus berkomitmen menjaga ketersediaan sistem setinggi mungkin dengan arsitektur cloud modern. Namun, layanan disediakan &ldquo;sebagaimana adanya&rdquo; (*as-is*) tanpa jaminan mutlak tanpa gangguan. BiarFokus tidak bertanggung jawab atas kegagalan sinkronisasi yang disebabkan oleh gangguan jaringan internet di sisi pengguna, pemadaman pihak ketiga (*third-party outage*), atau kondisi kahar (*force majeure*).
              </p>
            </div>

            <div className="legal-section-block">
              <h3>6. Perubahan Ketentuan</h3>
              <p>
                Kami dapat memperbarui Ketentuan Layanan ini dari waktu ke waktu untuk menyesuaikan perkembangan fitur dan regulasi hukum. Perubahan material akan diumumkan melalui aplikasi atau notifikasi email sebelum tanggal berlakunya.
              </p>
            </div>
          </div>
        ) : (
          /* Tab 2: Privacy Policy */
          <div className="legal-content-body">
            <div className="legal-section-block">
              <h3>1. Komitmen Privasi Kami</h3>
              <p>
                Di BiarFokus, privasi dan ketenangan produktivitasmu adalah hal suci. <strong>Kami TIDAK AKAN PERNAH menjual, menyewakan, membagikan, atau memperdagangkan data pribadimu kepada pihak ketiga, broker data, maupun pengiklan mana pun.</strong>
              </p>
            </div>

            <div className="legal-section-block">
              <h3>2. Data yang Kami Kumpulkan &amp; Tujuannya</h3>
              <ul>
                <li>
                  <strong>Informasi Identitas Akun:</strong> Alamat email, nama tampilan, dan avatar yang kamu izinkan saat masuk via Google atau pendaftaran manual. Digunakan hanya untuk otentikasi sesi kerjamu.
                </li>
                <li>
                  <strong>Data Produktivitas:</strong> Catatan Keep, tugas harian (tasks), papan kanban, acara kalender time-blocking, serta riwayat fokus pomodoro yang kamu buat.
                </li>
                <li>
                  <strong>Data Teknis Minimal:</strong> Waktu login, user-agent browser, dan IP hash anonim yang diperlukan untuk mencegah serangan brute-force dan rate-limiting keamanan server.
                </li>
              </ul>
            </div>

            <div className="legal-section-block">
              <h3>3. Isolasi Data dengan Row-Level Security (RLS)</h3>
              <p>
                Data produktivitasmu disimpan di database PostgreSQL dengan proteksi <strong>Row-Level Security (RLS)</strong> di tingkat mesin basis data. Setiap baris data terkunci rapat secara kriptografis dan hanya dapat diakses oleh token pengguna yang bersangkutan. Semua komunikasi data dienkripsi menggunakan protokol HTTPS / TLS 1.3 standar bank.
              </p>
            </div>

            <div className="legal-section-block">
              <h3>4. Hak Pengguna &amp; Penghapusan Permanen (Right to be Forgotten)</h3>
              <p>
                Kamu memiliki kendali 100% atas datamu:
              </p>
              <ul>
                <li>Kamu berhak mengekspor catatan dan riwayat fokusmu ke format PDF atau CSV kapan saja.</li>
                <li>Kamu berhak menghapus akunmu secara mandiri melalui menu Akun &gt; Hapus Akun. Saat proses hapus dikonfirmasi, seluruh data tugas, catatan, papan proyek, dan profil akan dihapus permanen secara tuntas dari server kami.</li>
              </ul>
            </div>

            <div className="legal-section-block">
              <h3>5. Hubungi Tim Perlindungan Data</h3>
              <p>
                Jika kamu memiliki pertanyaan, klarifikasi, atau masukan terkait kebijakan privasi ini, silakan hubungi tim kami via Instagram resmi <strong>@biarfokus.id</strong> atau email ke <strong>support@biarfokus.site</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Timestamp & Back Link */}
        <div className="legal-timestamp">
          <span>Terakhir diperbarui: 24 Oktober 2026 · Berlaku untuk seluruh pengguna BiarFokus</span>
          <Link href="/" style={{ color: "var(--ink)", fontWeight: 700, textDecoration: "none" }}>
            ← Kembali ke Timer Utama
          </Link>
        </div>
      </section>
    </main>
  );
}
