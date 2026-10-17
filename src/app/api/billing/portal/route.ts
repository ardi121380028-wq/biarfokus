import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { loadUserSubscription } from "@/features/billing/billing-service";

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return NextResponse.json(
        { error: "Silakan masuk ke akunmu untuk membuka portal penagihan." },
        { status: 401 },
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Konfigurasi STRIPE_SECRET_KEY belum tersedia di server." },
        { status: 503 },
      );
    }

    const subscription = await loadUserSubscription(supabase, data.user.id);
    if (!subscription.stripe_customer_id) {
      return NextResponse.json(
        {
          error:
            "Akun ini belum memiliki riwayat penagihan Stripe aktif untuk dikelola.",
        },
        { status: 400 },
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
      return NextResponse.json(
        {
          error:
            stripePayload.error?.message ??
            "Gagal membuat sesi Stripe Billing Portal.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: stripePayload.url });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal membuka portal penagihan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
