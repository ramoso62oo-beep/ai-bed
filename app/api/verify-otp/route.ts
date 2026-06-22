import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: "Email et code requis." }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase();

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("otp_code, otp_expires_at, role, plan")
      .eq("email", lowerEmail)
      .single();

    if (!profile?.otp_code) {
      return NextResponse.json({ error: "Aucun code en attente. Renvoyez un code." }, { status: 400 });
    }

    if (profile.otp_expires_at && new Date(profile.otp_expires_at) < new Date()) {
      return NextResponse.json({ error: "Code expiré. Renvoyez un code." }, { status: 400 });
    }

    if (profile.otp_code !== code) {
      return NextResponse.json({ error: "Code incorrect." }, { status: 400 });
    }

    // Code valide → on l'efface
    await supabaseAdmin
      .from("profiles")
      .update({ otp_code: null, otp_expires_at: null })
      .eq("email", lowerEmail);

    return NextResponse.json({ ok: true, role: profile.role, plan: profile.plan });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
