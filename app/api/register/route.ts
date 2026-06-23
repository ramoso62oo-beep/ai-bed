import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const FOUNDER_EMAIL = "ramos.o62oo@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const { email, full_name, phone, plan } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email requis." }, { status: 400 });
    }

    const isFounder = email.toLowerCase() === FOUNDER_EMAIL;

    const { error } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          email: email.toLowerCase(),
          full_name,
          phone,
          role: isFounder ? "founder" : "user",
          plan: isFounder ? "elite" : "none", // aucun plan payant avant paiement
          subscription_status: isFounder ? "active" : "inactive",
        },
        { onConflict: "email" }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, founder: isFounder });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
