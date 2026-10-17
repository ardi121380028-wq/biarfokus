import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { mapStripeStatusToSubscription } from "@/features/billing/billing-service";
import { verifyStripeWebhookSignature } from "@/features/billing/stripe-webhook";

function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Konfigurasi SUPABASE_SERVICE_ROLE_KEY diperlukan di server untuk memproses webhook.",
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json(
        { error: "STRIPE_WEBHOOK_SECRET belum dikonfigurasi." },
        { status: 503 },
      );
    }

    const signature = request.headers.get("stripe-signature") ?? "";
    const rawBody = await request.text();

    if (!verifyStripeWebhookSignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json(
        { error: "Signature webhook Stripe tidak valid." },
        { status: 400 },
      );
    }

    const event = JSON.parse(rawBody) as {
      type?: string;
      data?: {
        object?: {
          id?: string;
          customer?: string;
          subscription?: string;
          client_reference_id?: string;
          status?: string;
          current_period_end?: number;
          cancel_at_period_end?: boolean;
          metadata?: { user_id?: string };
        };
      };
    };

    const supabase = getSupabaseServiceClient();
    const obj = event.data?.object ?? {};

    if (event.type === "checkout.session.completed") {
      const userId = obj.client_reference_id ?? obj.metadata?.user_id;
      if (userId) {
        const { error } = await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            plan: "pro",
            status: "active",
            stripe_customer_id:
              typeof obj.customer === "string" ? obj.customer : null,
            stripe_subscription_id:
              typeof obj.subscription === "string" ? obj.subscription : null,
          },
          { onConflict: "user_id" },
        );
        if (error) throw error;
      }
    } else if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const mapped = mapStripeStatusToSubscription(
        event.type === "customer.subscription.deleted"
          ? "canceled"
          : (obj.status ?? "inactive"),
      );
      const periodEndIso =
        typeof obj.current_period_end === "number"
          ? new Date(obj.current_period_end * 1000).toISOString()
          : null;

      if (typeof obj.id === "string") {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            plan: mapped.plan,
            status: mapped.status,
            current_period_end: periodEndIso,
            cancel_at_period_end: Boolean(obj.cancel_at_period_end),
          })
          .eq("stripe_subscription_id", obj.id);
        if (error) throw error;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal memproses webhook Stripe.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
