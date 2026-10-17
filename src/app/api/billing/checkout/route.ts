import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { loadUserSubscription } from "@/features/billing/billing-service";

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return NextResponse.json(
        { error: "Silakan masuk ke akunmu terlebih dahulu untuk upgrade ke Pro." },
        { status: 401 },
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripePriceId = process.env.STRIPE_PRO_PRICE_ID;

    if (!stripeSecretKey || !stripePriceId) {
      return NextResponse.json(
        {
          error:
            "Konfigurasi Stripe belum lengkap di server (STRIPE_SECRET_KEY dan STRIPE_PRO_PRICE_ID).",
        },
        { status: 503 },
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
      return NextResponse.json(
        {
          error:
            stripePayload.error?.message ??
            "Gagal membuat sesi Stripe Checkout.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: stripePayload.url });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal memulai sesi checkout Stripe.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
