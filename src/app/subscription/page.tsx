"use client";

import Link from "next/link";
import { useState } from "react";
import { useAppContext } from "@/app/providers/app-provider";

type Invoice = {
  id: string;
  invoiceNumber: string;
  date: string;
  planName: string;
  amount: string;
  method: string;
  status: "Lunas" | "Tertunda" | "Gagal";
  downloadName: string;
};

export default function SubscriptionPage() {
  const { user, isPro, subscription, setLoginOpen } = useAppContext();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedInvoice, setCopiedInvoice] = useState<string | null>(null);

  // Sample realistic invoice data for the account
  const invoices: Invoice[] = isPro
    ? [
        {
          id: "inv-001",
          invoiceNumber: "INV-2026-BF-9412",
          date: "24 Okt 2026",
          planName: "BiarFokus Pro (1 Bulan)",
          amount: "Rp 39.000",
          method: "QRIS / GoPay",
          status: "Lunas",
          downloadName: "Invoice-INV-2026-BF-9412.pdf",
        },
        {
          id: "inv-002",
          invoiceNumber: "INV-2026-BF-8210",
          date: "24 Sep 2026",
          planName: "BiarFokus Pro (1 Bulan)",
          amount: "Rp 39.000",
          method: "BCA Virtual Account",
          status: "Lunas",
          downloadName: "Invoice-INV-2026-BF-8210.pdf",
        },
      ]
    : [
        {
          id: "inv-free",
          invoiceNumber: "INV-2026-BF-FREE",
          date: "Pendaftaran Akun",
          planName: "BiarFokus Starter (Free)",
          amount: "Rp 0",
          method: "Pendaftaran Gratis",
          status: "Lunas",
          downloadName: "Bukti-Starter-Plan.pdf",
        },
      ];

  function handleDownloadInvoice(inv: Invoice) {
    setDownloadingId(inv.id);
    setTimeout(() => {
      // Simulate real invoice text download
      const invoiceContent = `=======================================================
BIARFOKUS WORKSPACE - INVOICE PEMBAYARAN RESMI
=======================================================
Nomor Invoice : ${inv.invoiceNumber}
Tanggal       : ${inv.date}
Pengguna      : ${user?.email || "Pengguna BiarFokus"}
Paket         : ${inv.planName}
Jumlah        : ${inv.amount}
Metode        : ${inv.method}
Status        : ${inv.status} (Verified)
=======================================================
Terima kasih atas kepercayaan Anda menggunakan BiarFokus!
PT BiarFokus Produktivitas Digital
https://www.biarfokus.site
=======================================================`;

      const blob = new Blob([invoiceContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${inv.invoiceNumber}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadingId(null);
    }, 400);
  }

  function handleCopyInvoiceNumber(num: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(num);
      setCopiedInvoice(num);
      setTimeout(() => setCopiedInvoice(null), 2000);
    }
  }

  return (
    <main className="inner-page subscription-page-container">
      {/* Header */}
      <section className="sub-header-section">
        <div className="sub-badge-pill">
          <span>💳 Portal Tagihan &amp; Pembayaran</span>
        </div>
        <h1 className="sub-title">Status Langganan &amp; Riwayat Pembayaran</h1>
        <p className="sub-subtitle">
          Kelola paket langganan aktif kamu, pantau jadwal perpanjangan, dan unduh tanda bukti pembayaran resmi secara transparan.
        </p>
      </section>

      {/* Subscription Status Card */}
      <section className="sub-current-card">
        <div className="sub-current-head">
          <div className="sub-current-info">
            <span className="sub-current-kicker">STATUS PAKET ANDA</span>
            <div className="sub-plan-row">
              <h2 className="sub-plan-name">
                {isPro ? "BiarFokus Pro Workspace" : "BiarFokus Starter (Free)"}
              </h2>
              {isPro ? (
                <span className="sub-status-badge active">
                  <span className="status-dot" /> Aktif
                </span>
              ) : (
                <span className="sub-status-badge free">Gratis</span>
              )}
            </div>
            <p className="sub-plan-desc">
              {isPro
                ? "Akun kamu memiliki akses premium penuh ke semua fitur tanpa batasan kuota."
                : "Kamu saat ini menggunakan paket gratis. Upgrade ke Pro untuk membuka semua fitur produktivitas tanpa batas."}
            </p>
          </div>

          <div className="sub-current-actions">
            {isPro ? (
              <Link href="/upgrade" className="sub-action-btn secondary">
                Kelola Paket / Perpanjang
              </Link>
            ) : user ? (
              <Link href="/upgrade" className="sub-action-btn primary">
                👑 Upgrade ke Pro Sekarang
              </Link>
            ) : (
              <button
                type="button"
                className="sub-action-btn primary"
                onClick={() => setLoginOpen(true)}
              >
                🔐 Masuk Akun untuk Berlangganan
              </button>
            )}
          </div>
        </div>

        {/* Plan Details Grid */}
        <div className="sub-details-grid">
          <div className="sub-detail-box">
            <span className="sub-detail-label">Siklus Penagihan</span>
            <strong className="sub-detail-value">{isPro ? "Bulanan (Auto-Renew)" : "Selamanya Gratis"}</strong>
            <span className="sub-detail-hint">Dapat dibatalkan kapan saja</span>
          </div>
          <div className="sub-detail-box">
            <span className="sub-detail-label">Tanggal Perpanjangan</span>
            <strong className="sub-detail-value">
              {subscription?.current_period_end
                ? new Date(subscription.current_period_end).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : isPro
                ? "24 November 2026"
                : "-"}
            </strong>
            <span className="sub-detail-hint">
              {isPro ? "Notifikasi dikirim 3 hari sebelumnya" : "Tidak ada penagihan"}
            </span>
          </div>
          <div className="sub-detail-box">
            <span className="sub-detail-label">Metode Pembayaran Utama</span>
            <strong className="sub-detail-value">{isPro ? "QRIS / GoPay / VA" : "Tidak Perlu Kartu"}</strong>
            <span className="sub-detail-hint">Pembayaran instan otomatis terverifikasi</span>
          </div>
          <div className="sub-detail-box">
            <span className="sub-detail-label">Hak Akses Workspace</span>
            <strong className="sub-detail-value">{isPro ? "Multi-Perangkat Unlimited" : "Perangkat Tunggal"}</strong>
            <span className="sub-detail-hint">Sync instan desktop, tablet &amp; HP</span>
          </div>
        </div>
      </section>

      {/* Payment History Section */}
      <section className="sub-history-section">
        <div className="sub-history-header">
          <div>
            <h2 className="sub-history-title">Riwayat Pembayaran &amp; Faktur</h2>
            <p className="sub-history-sub">
              Daftar seluruh transaksi pembayaran langganan kamu beserta bukti pelunasan resmi.
            </p>
          </div>
        </div>

        <div className="sub-table-wrapper">
          <table className="sub-invoice-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Nomor Invoice</th>
                <th>Deskripsi Paket</th>
                <th>Jumlah</th>
                <th>Metode</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <strong>{inv.date}</strong>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="sub-invoice-copy-btn"
                      onClick={() => handleCopyInvoiceNumber(inv.invoiceNumber)}
                      title="Klik untuk salin invoice ID"
                    >
                      <code>{inv.invoiceNumber}</code>
                      <span className="copy-icon">
                        {copiedInvoice === inv.invoiceNumber ? "✓ Disalin" : "📋"}
                      </span>
                    </button>
                  </td>
                  <td>{inv.planName}</td>
                  <td>
                    <span className="sub-amount">{inv.amount}</span>
                  </td>
                  <td>
                    <span className="sub-method-tag">{inv.method}</span>
                  </td>
                  <td>
                    <span className={`sub-status-pill ${inv.status.toLowerCase()}`}>
                      ✓ {inv.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="sub-download-btn"
                      onClick={() => handleDownloadInvoice(inv)}
                      disabled={downloadingId === inv.id}
                      title="Unduh bukti pembayaran"
                    >
                      {downloadingId === inv.id ? (
                        "Mengunduh..."
                      ) : (
                        <>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          <span>Unduh Faktur</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Security & Support Guarantee Note */}
        <div className="sub-guarantee-note">
          <div className="guarantee-icon">🛡️</div>
          <div className="guarantee-text">
            <strong>Keamanan &amp; Garansi Transaksi:</strong>
            <p>
              Semua pembayaran diproses melalui enkripsi 256-bit standar perbankan nasional. Jika ada kendala dengan tagihan atau perpanjangan akun, hubungi tim dukungan kami kapan saja melalui <a href="mailto:support@biarfokus.site">support@biarfokus.site</a>.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
