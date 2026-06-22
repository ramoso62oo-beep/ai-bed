import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "signature invalide";
    return NextResponse.json({ error: `Webhook: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      // Paiement réussi → activer l'abonnement
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = (session.customer_email || session.metadata?.email || "").toLowerCase();
        const plan = session.metadata?.plan || "starter";
        if (email) {
          await supabaseAdmin.from("profiles").upsert({
            email,
            plan,
            stripe_customer_id: typeof session.customer === "string" ? session.customer : undefined,
            stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : undefined,
            subscription_status: "active",
          }, { onConflict: "email" });
        }
        break;
      }

      // Abonnement annulé / expiré → désactiver
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await supabaseAdmin
          .from("profiles")
          .update({ subscription_status: "canceled", plan: "none" })
          .eq("stripe_subscription_id", sub.id);
        break;
      }

      // Mise à jour d'abonnement (pause, impayé, etc.)
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await supabaseAdmin
          .from("profiles")
          .update({ subscription_status: sub.status })
          .eq("stripe_subscription_id", sub.id);
        break;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "erreur";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
