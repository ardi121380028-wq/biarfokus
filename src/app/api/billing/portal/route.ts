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

const ROUTE = "/api/billing/portal";
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
        { error: "Silakan masuk ke akunmu untuk membuka portal penagihan." },
        { status: 401, correlationId },
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      logApiEvent("error", ROUTE, correlationId, "Stripe is not configured: STRIPE_SECRET_KEY is required");
      return apiJson(
        { error: "Portal penagihan belum tersedia saat ini. Silakan coba lagi nanti." },
        { status: 503, correlationId },
      );
    }

    const subscription = await loadUserSubscription(supabase, data.user.id);
    if (!subscription.stripe_customer_id) {
      return apiJson(
        { error: "Akun ini belum memiliki riwayat penagihan Stripe aktif untuk dikelola." },
        { status: 400, correlationId },
      );
    }

    const origin = new URL(request.url).origin;
    const form = new URLSearchParams();
    form.set("customer", subscription.stripe_customer_id);
    form.set("return_url", `${origin}/?billing=portal`);

    const stripeResponse = await fetch(
      "https://api.stripe.com/v1/billing_portal/sessions",
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
        "Stripe rejected the billing portal session request",
        stripePayload.error ?? { message: `HTTP ${stripeResponse.status}` },
      );
      return apiJson(
        { error: "Gagal membuka portal penagihan. Silakan coba lagi." },
        { status: 502, correlationId },
      );
    }

    return apiJson({ url: stripePayload.url }, { correlationId });
  } catch (error) {
    logApiEvent("error", ROUTE, correlationId, "Failed to open billing portal", error);
    return apiJson(
      { error: "Gagal membuka portal penagihan." },
      { status: 500, correlationId },
    );
  }
}
