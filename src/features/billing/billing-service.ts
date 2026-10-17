import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SubscriptionPlan,
  SubscriptionStatus,
  UserSubscription,
} from "@/types/domain";
import { formatApiError } from "../../lib/api/request-guard.ts";

export const FREE_ACTIVE_TASK_LIMIT = 10;

const VALID_STATUSES: SubscriptionStatus[] = [
  "inactive",
  "trialing",
  "active",
  "past_due",
  "canceled",
];

export function createDefaultSubscription(userId = ""): UserSubscription {
  return {
    user_id: userId,
    plan: "free",
    status: "inactive",
    stripe_customer_id: null,
    stripe_subscription_id: null,
    current_period_end: null,
    cancel_at_period_end: false,
  };
}

export function normalizeSubscription(
  raw: unknown,
  fallbackUserId = "",
): UserSubscription {
  if (typeof raw !== "object" || raw === null) {
    return createDefaultSubscription(fallbackUserId);
  }

  const record = raw as Record<string, unknown>;
  const plan: SubscriptionPlan = record.plan === "pro" ? "pro" : "free";
  const status: SubscriptionStatus = VALID_STATUSES.includes(
    record.status as SubscriptionStatus,
  )
    ? (record.status as SubscriptionStatus)
    : "inactive";

  return {
    user_id: typeof record.user_id === "string" ? record.user_id : fallbackUserId,
    plan,
    status,
    stripe_customer_id:
      typeof record.stripe_customer_id === "string"
        ? record.stripe_customer_id
        : null,
    stripe_subscription_id:
      typeof record.stripe_subscription_id === "string"
        ? record.stripe_subscription_id
        : null,
    current_period_end:
      typeof record.current_period_end === "string"
        ? record.current_period_end
        : null,
    cancel_at_period_end: Boolean(record.cancel_at_period_end),
  };
}

export function isProSubscription(
  subscription: Pick<UserSubscription, "plan" | "status" | "current_period_end">,
  now?: Date,
): boolean {
  if (subscription.plan !== "pro") return false;
  if (subscription.status !== "active" && subscription.status !== "trialing") {
    return false;
  }
  if (subscription.current_period_end) {
    const periodEndMs = new Date(subscription.current_period_end).getTime();
    const nowMs = (now ?? new Date()).getTime();
    if (!Number.isNaN(periodEndMs) && periodEndMs <= nowMs) {
      return false;
    }
  }
  return true;
}

export function assertTaskLimitAllowed(
  activeTasksCount: number,
  isPro: boolean,
): void {
  if (!isPro && activeTasksCount >= FREE_ACTIVE_TASK_LIMIT) {
    throw new Error(
      `Batas paket Free tercapai (maksimal ${FREE_ACTIVE_TASK_LIMIT} task aktif). Upgrade ke Pro untuk task tanpa batas.`,
    );
  }
}

export function mapStripeStatusToSubscription(stripeStatus: string): {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
} {
  if (stripeStatus === "active" || stripeStatus === "trialing") {
    return { plan: "pro", status: stripeStatus };
  }
  if (stripeStatus === "past_due") {
    return { plan: "pro", status: "past_due" };
  }
  if (stripeStatus === "canceled" || stripeStatus === "unpaid") {
    return { plan: "free", status: "canceled" };
  }
  return { plan: "free", status: "inactive" };
}

export async function loadUserSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserSubscription> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "user_id, plan, status, stripe_customer_id, stripe_subscription_id, current_period_end, cancel_at_period_end",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return normalizeSubscription(data, userId);
}

export async function startProCheckoutSession(): Promise<string> {
  const response = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { Accept: "application/json" },
  });

  const payload = (await response.json()) as {
    url?: string;
    error?: string;
    correlationId?: string;
  };

  if (!response.ok || !payload.url) {
    throw new Error(formatApiError(payload, "Gagal memulai sesi checkout Stripe."));
  }

  return payload.url;
}

export async function createBillingPortalSession(): Promise<string> {
  const response = await fetch("/api/billing/portal", {
    method: "POST",
    headers: { Accept: "application/json" },
  });

  const payload = (await response.json()) as {
    url?: string;
    error?: string;
    correlationId?: string;
  };

  if (!response.ok || !payload.url) {
    throw new Error(formatApiError(payload, "Gagal membuka portal penagihan."));
  }

  return payload.url;
}
