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
  return "Paket Dasar";
}

export function PricingView({
  userId,
  subscription,
  isPro,
  activeTaskCount,
  onRequireSignIn,
  onGoTimer,
}: PricingViewProps) {
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
          : "Gagal memulai sesi checkout Stripe.",
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
          : "Gagal membuka Stripe Billing Portal.",
      );
      setLoadingAction(null);
    }
  }

  return (
    <div className="inner-page">
      <p className="eyebrow">Biar makin fokus</p>
      <h1>Pilih ruang fokusmu</h1>

      {userId && (
        <div className="billing-status-bar" aria-label="Status langganan">
          <div>
            <strong>
              Paket saat ini: {isPro ? "Pro" : "Free"} (
              {formatStatusLabel(subscription, isPro)})
            </strong>
            <span>
              Kuota task aktif:{" "}
              {isPro
                ? `${activeTaskCount} task (Tanpa batas)`
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

      <div className="pricing-grid">
        <div className="price-card">
          <span>Free</span>
          <strong>
            $0 <small>/ forever</small>
          </strong>
          <p>
            Pomodoro timer, hingga {FREE_ACTIVE_TASK_LIMIT} task aktif, dan
            fokus harian.
          </p>
          <button type="button" onClick={onGoTimer}>
            {userId && !isPro ? "Paket aktif saat ini" : "Mulai gratis"}
          </button>
        </div>

        <div className="price-card featured">
          <b className="popular">MOST POPULAR</b>
          <span>Pro</span>
          <strong>
            $2.99 <small>/ month</small>
          </strong>
          <p>
            Task aktif tanpa batas, statistik produktivitas lengkap, dan
            sinkronisasi lintas perangkat.
          </p>
          {isPro ? (
            <button
              type="button"
              onClick={() =>
                subscription.stripe_customer_id
                  ? void handleManageBilling()
                  : onGoTimer()
              }
              disabled={loadingAction !== null}
            >
              {subscription.stripe_customer_id
                ? "Kelola di Billing Portal"
                : "Paket Pro Aktif"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleUpgrade()}
              disabled={loadingAction !== null}
            >
              {loadingAction === "checkout"
                ? "Menyiapkan Checkout..."
                : "Upgrade ke Pro"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
