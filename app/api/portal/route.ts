import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://ai-bed.vercel.app";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });

    const { data: p } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("email", email.toLowerCase())
      .single();

    if (!p?.stripe_customer_id) {
      return NextResponse.json({ error: "Aucun abonnement actif. Souscrivez d'abord une formule." }, { status: 400 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: p.stripe_customer_id,
      return_url: `${BASE}/settings`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
