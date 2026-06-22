import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICES: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
  elite: process.env.STRIPE_PRICE_ELITE,
};

const FOUNDER_EMAIL = "ramos.o62oo@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const { plan, email } = await req.json();

    // Le compte fondateur a un accès Elite gratuit — pas de paiement
    if (email && email.toLowerCase() === FOUNDER_EMAIL) {
      return NextResponse.json({ founder: true });
    }

    const price = PRICES[plan];
    if (!price) {
      return NextResponse.json({ error: "Plan inconnu." }, { status: 400 });
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.get("host")}`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      customer_email: email || undefined,
      success_url: `${base}/dashboard?payment=success`,
      cancel_url: `${base}/?payment=cancel`,
      allow_promotion_codes: true,
      metadata: { plan, email: email || "" },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
