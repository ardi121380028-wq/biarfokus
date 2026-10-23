"use client";

import { useState } from "react";
import type { UserSubscription } from "@/types/domain";
import {
  createBillingPortalSession,
  FREE_ACTIVE_TASK_LIMIT,
  startProCheckoutSession,
} from "@/features/billing/billing-service";

type PricingViewProps = {
  userId: string | null;
  subscription: UserSubscription;
  isPro: boolean;
  activeTaskCount: number;
  onRequireSignIn: () => void;
  onGoTimer: () => void;
};

function formatStatusLabel(subscription: UserSubscription, isPro: boolean) {
  if (isPro && subscription.status === "trialing") return "Masa Percobaan Pro";
  if (isPro) return "Aktif";
  if (subscription.status === "past_due") return "Menunggu Pembayaran";
  if (subscription.status === "canceled") return "Berakhir / Dibatalkan";
  return "Paket Dasar (Free)";
}

export function PricingView({
  userId,
  subscription,
  isPro,
  activeTaskCount,
  onRequireSignIn,
  onGoTimer,
}: PricingViewProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [loadingAction, setLoadingAction] = useState<
    "checkout" | "portal" | null
  >(null);
  const [billingError, setBillingError] = useState<string | null>(null);

  async function handleUpgrade() {
    if (!userId) {
      onRequireSignIn();
      return;
    }
    if (loadingAction) return;
    setLoadingAction("checkout");
    setBillingError(null);
    try {
      const checkoutUrl = await startProCheckoutSession();
      window.location.assign(checkoutUrl);
    } catch (error) {
      setBillingError(
        error instanceof Error
          ? error.message
          : "Gagal memulai sesi checkout pembayaran.",
      );
      setLoadingAction(null);
    }
  }

  async function handleManageBilling() {
    if (loadingAction) return;
    setLoadingAction("portal");
    setBillingError(null);
    try {
      const portalUrl = await createBillingPortalSession();
      window.location.assign(portalUrl);
    } catch (error) {
      setBillingError(
        error instanceof Error
          ? error.message
          : "Gagal membuka portal pengaturan langganan.",
      );
      setLoadingAction(null);
    }
  }

  return (
    <div className="inner-page pricing-inner-page">
      <div className="pricing-header-center">
        <p className="eyebrow">Investasi Untuk Produktivitas Terbaikmu</p>
        <h1 className="pricing-headline">Pilih Ruang Fokus Tanpa Batas</h1>
        <p className="pricing-lead-text">
          Tingkatkan konsentrasi, selesaikan tugas lebih cepat, dan sinkronkan alur kerja di semua perangkat.
        </p>

        {/* Billing cycle switch */}
        <div className="pricing-cycle-switch" role="group" aria-label="Siklus Tagihan">
          <button
            type="button"
            className={`cycle-btn ${billingCycle === "monthly" ? "active" : ""}`}
            onClick={() => setBillingCycle("monthly")}
          >
            Bulanan
          </button>
          <button
            type="button"
            className={`cycle-btn ${billingCycle === "yearly" ? "active" : ""}`}
            onClick={() => setBillingCycle("yearly")}
          >
            Tahunan <span className="discount-badge">Hemat 42% 🔥</span>
          </button>
        </div>
      </div>

      {userId && (
        <div className="billing-status-bar" aria-label="Status langganan">
          <div>
            <strong>
              Paket Kamu Saat Ini: {isPro ? "BiarFokus Pro 🚀" : "BiarFokus Starter (Free)"} (
              {formatStatusLabel(subscription, isPro)})
            </strong>
            <span>
              Kuota task aktif:{" "}
              {isPro
                ? `${activeTaskCount} task (Tanpa Batas / Unlimited)`
                : `${activeTaskCount}/${FREE_ACTIVE_TASK_LIMIT} task aktif`}
            </span>
          </div>
          {subscription.stripe_customer_id && (
            <button
              type="button"
              className="secondary-button admin-action-button"
              onClick={() => void handleManageBilling()}
              disabled={loadingAction !== null}
            >
              {loadingAction === "portal"
                ? "Membuka portal..."
                : "Kelola Langganan"}
            </button>
          )}
        </div>
      )}

      {billingError && (
        <p className="task-error" role="alert">
          {billingError}
        </p>
      )}

      {/* Pricing Cards Grid */}
      <div className="pricing-cards-container">
        {/* Free Plan */}
        <div className="pricing-plan-card">
          <div className="plan-badge-space" />
          <div className="plan-header">
            <span className="plan-name">Starter (Gratis)</span>
            <div className="plan-price">
              <strong>Rp 0</strong>
              <small>/ selamanya</small>
            </div>
            <p className="plan-desc">
              Cocok untuk pemula yang ingin mulai membangun kebiasaan fokus harian.
            </p>
          </div>

          <div className="plan-features">
            <span className="features-title">Fitur yang kamu dapatkan:</span>
            <ul>
              <li><span className="check-icon">✓</span> Pomodoro Timer (Fokus, Short & Long Break)</li>
              <li><span className="check-icon">✓</span> Maksimal {FREE_ACTIVE_TASK_LIMIT} task aktif bersamaan</li>
              <li><span className="check-icon">✓</span> 1 Papan Kanban Project</li>
              <li><span className="check-icon">✓</span> Catatan cepat & Keep todo</li>
              <li><span className="check-icon">✓</span> Kalender time-blocking harian</li>
              <li><span className="check-icon">✓</span> Suara alarm standar</li>
              <li><span className="check-icon">✓</span> Riwayat statistik 7 hari terakhir</li>
            </ul>
          </div>

          <button
            type="button"
            className="plan-cta-btn free-cta"
            onClick={onGoTimer}
          >
            {userId && !isPro ? "Paket Aktif Kamu" : "Mulai Gratis Sekarang"}
          </button>
        </div>

        {/* Pro Plan */}
        <div className="pricing-plan-card featured-pro-card">
          <div className="plan-popular-pill">Paling Populer & Diminati ⭐</div>
          <div className="plan-header">
            <span className="plan-name">BiarFokus Pro</span>
            <div className="plan-price">
              {billingCycle === "yearly" ? (
                <>
                  <strong>Rp 16.500</strong>
                  <small>/ bulan (Ditagih Rp 199.000 / tahun)</small>
                </>
              ) : (
                <>
                  <strong>Rp 29.000</strong>
                  <small>/ bulan</small>
                </>
              )}
            </div>
            <p className="plan-desc">
              Bebaskan batas. Kuota tugas tak terbatas, kolaborasi tim, dan analisis mendalam.
            </p>
          </div>

          <div className="plan-features">
            <span className="features-title">Semua fitur Gratis, ditambah:</span>
            <ul>
              <li><span className="check-icon pro-check">✓</span> <strong>Task & Checklist Tanpa Batas (Unlimited)</strong></li>
              <li><span className="check-icon pro-check">✓</span> <strong>Kanban Boards Tanpa Batas</strong></li>
              <li><span className="check-icon pro-check">✓</span> <strong>Undang Teman & Kolaborasi Tim Realtime</strong></li>
              <li><span className="check-icon pro-check">✓</span> <strong>Analisis Produktivitas & Statistik Seumur Hidup</strong></li>
              <li><span className="check-icon pro-check">✓</span> <strong>Audio Ambience Fokus (White Noise, Rain, Lofi)</strong></li>
              <li><span className="check-icon pro-check">✓</span> <strong>Koleksi Tema Warna & Suara Alarm Eksklusif</strong></li>
              <li><span className="check-icon pro-check">✓</span> <strong>Sinkronisasi Prioritas Super Cepat & Cloud Backup</strong></li>
              <li><span className="check-icon pro-check">✓</span> <strong>Dukungan Pelanggan Prioritas VIP</strong></li>
            </ul>
          </div>

          {isPro ? (
            <button
              type="button"
              className="primary-button plan-cta-btn"
              onClick={() =>
                subscription.stripe_customer_id
                  ? void handleManageBilling()
                  : onGoTimer()
              }
              disabled={loadingAction !== null}
            >
              {subscription.stripe_customer_id
                ? "Kelola di Portal Langganan"
                : "Paket Pro Sudah Aktif ✓"}
            </button>
          ) : (
            <button
              type="button"
              className="primary-button plan-cta-btn pro-cta"
              onClick={() => void handleUpgrade()}
              disabled={loadingAction !== null}
            >
              {loadingAction === "checkout"
                ? "Menyiapkan Pembayaran..."
                : billingCycle === "yearly"
                  ? "Upgrade ke Pro (Hemat 42%)"
                  : "Upgrade ke Pro Sekarang"}
            </button>
          )}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="pricing-comparison-section">
        <h2>Perbandingan Fitur Detail</h2>
        <div className="table-responsive">
          <table className="pricing-comparison-table">
            <thead>
              <tr>
                <th scope="col" style={{ width: "45%" }}>Fitur</th>
                <th scope="col" style={{ width: "25%" }}>Paket Gratis</th>
                <th scope="col" style={{ width: "30%" }}>BiarFokus Pro</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Kapasitas Task Aktif</td>
                <td>Hingga 5 Task</td>
                <td><strong className="text-pro">Tanpa Batas (Unlimited)</strong></td>
              </tr>
              <tr>
                <td>Papan Proyek Kanban</td>
                <td>1 Board</td>
                <td><strong className="text-pro">Tanpa Batas + Multi Board</strong></td>
              </tr>
              <tr>
                <td>Kolaborasi & Invite Tim</td>
                <td>Terbatas</td>
                <td><strong className="text-pro">Penuh (Member & Role)</strong></td>
              </tr>
              <tr>
                <td>Riwayat Statistik & Laporan</td>
                <td>7 Hari Terakhir</td>
                <td><strong className="text-pro">Semua Riwayat (Seumur Hidup)</strong></td>
              </tr>
              <tr>
                <td>Suara Ambience Fokus (Rain, Lofi, Noise)</td>
                <td>Standar</td>
                <td><strong className="text-pro">Semua Ambience Eksklusif</strong></td>
              </tr>
              <tr>
                <td>Pilihan Tema & Palet Warna</td>
                <td>Preset Dasar</td>
                <td><strong className="text-pro">Semua Palet + Kustom</strong></td>
              </tr>
              <tr>
                <td>Sinkronisasi Multi-Device (Desktop & HP)</td>
                <td>Aktif</td>
                <td><strong className="text-pro">Aktif + Prioritas Bandwidth</strong></td>
              </tr>
              <tr>
                <td>Dukungan Pelanggan</td>
                <td>Komunitas</td>
                <td><strong className="text-pro">Prioritas VIP 24 Jam</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Security & Guarantee Trust Seal */}
      <div className="pricing-trust-bar">
        <div className="trust-item">
          <span>🔒</span>
          <div>
            <strong>Pembayaran Aman & Terenkripsi</strong>
            <small>Mendukung QRIS, e-Wallet, & Virtual Account</small>
          </div>
        </div>
        <div className="trust-item">
          <span>🔄</span>
          <div>
            <strong>Batalkan Kapan Saja</strong>
            <small>Tanpa komitmen atau denda pembatalan</small>
          </div>
        </div>
        <div className="trust-item">
          <span>⚡</span>
          <div>
            <strong>Aktivasi Instan</strong>
            <small>Fitur Pro langsung aktif setelah transaksi berhasil</small>
          </div>
        </div>
      </div>
    </div>
  );
}
