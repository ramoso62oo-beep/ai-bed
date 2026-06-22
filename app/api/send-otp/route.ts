import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const FOUNDER_EMAIL = "ramos.o62oo@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });

    const lowerEmail = email.toLowerCase();

    // Récupérer le profil + numéro de téléphone
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("phone")
      .eq("email", lowerEmail)
      .single();

    if (!profile?.phone) {
      return NextResponse.json({ error: "Aucun numéro associé à ce compte." }, { status: 404 });
    }

    // Générer un code à 6 chiffres, valable 5 minutes
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await supabaseAdmin
      .from("profiles")
      .update({ otp_code: code, otp_expires_at: expires })
      .eq("email", lowerEmail);

    // Envoi du SMS via Twilio
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!sid || !token || !from) {
      // Twilio pas encore configuré → mode démo (le code n'est pas envoyé réellement)
      return NextResponse.json({ ok: true, demo: true });
    }

    const body = new URLSearchParams({
      To: profile.phone,
      From: from,
      Body: `AI-BED — Votre code de connexion est : ${code}`,
    });

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.message || "Échec d'envoi du SMS." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
