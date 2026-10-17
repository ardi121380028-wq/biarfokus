import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  apiJson,
  createRateLimiter,
  getClientKey,
  logApiEvent,
  rateLimitResponse,
  resolveCorrelationId,
} from "@/lib/api/request-guard";
import { loadUserSubscription } from "@/features/billing/billing-service";

const ROUTE = "/api/billing/checkout";
const limiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

export async function POST(request: Request) {
  const correlationId = resolveCorrelationId(request.headers.get("x-correlation-id"));
  const limit = limiter.check(`${ROUTE}:${getClientKey(request.headers)}`, Date.now());
  if (!limit.allowed) return rateLimitResponse(limit, correlationId);

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return apiJson(
        { error: "Silakan masuk ke akunmu terlebih dahulu untuk upgrade ke Pro." },
        { status: 401, correlationId },
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripePriceId = process.env.STRIPE_PRO_PRICE_ID;

    if (!stripeSecretKey || !stripePriceId) {
      logApiEvent(
        "error",
        ROUTE,
        correlationId,
        "Stripe is not configured: STRIPE_SECRET_KEY and STRIPE_PRO_PRICE_ID are required",
      );
      return apiJson(
        { error: "Pembayaran belum tersedia saat ini. Silakan coba lagi nanti." },
        { status: 503, correlationId },
      );
    }

    const origin = new URL(request.url).origin;
    const currentSub = await loadUserSubscription(supabase, data.user.id);

    const form = new URLSearchParams();
    form.set("mode", "subscription");
    form.set("line_items[0][price]", stripePriceId);
    form.set("line_items[0][quantity]", "1");
    form.set("client_reference_id", data.user.id);
    form.set("metadata[user_id]", data.user.id);
    form.set("success_url", `${origin}/?billing=success`);
    form.set("cancel_url", `${origin}/?billing=canceled`);

    if (currentSub.stripe_customer_id) {
      form.set("customer", currentSub.stripe_customer_id);
    } else if (data.user.email) {
      form.set("customer_email", data.user.email);
    }

    const stripeResponse = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      },
    );

    const stripePayload = (await stripeResponse.json()) as {
      url?: string;
      error?: { message?: string };
    };

    if (!stripeResponse.ok || !stripePayload.url) {
      logApiEvent(
        "error",
        ROUTE,
        correlationId,
        "Stripe rejected the checkout session request",
        stripePayload.error ?? { message: `HTTP ${stripeResponse.status}` },
      );
      return apiJson(
        { error: "Gagal membuat sesi pembayaran. Silakan coba lagi." },
        { status: 502, correlationId },
      );
    }

    return apiJson({ url: stripePayload.url }, { correlationId });
  } catch (error) {
    logApiEvent("error", ROUTE, correlationId, "Failed to start checkout session", error);
    return apiJson(
      { error: "Gagal memulai sesi checkout Stripe." },
      { status: 500, correlationId },
    );
  }
}
