import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email, address } = await req.json();
    if (!email || !address) return NextResponse.json({ error: "Email et adresse requis." }, { status: 400 });
    await supabaseAdmin.from("profiles").update({ wallet_address: address }).eq("email", email.toLowerCase());
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
