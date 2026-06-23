import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const FOUNDER_EMAIL = "ramos.o62oo@gmail.com";
const VALID = ["none", "starter", "pro", "elite"];

// Le fondateur change/offre un plan à un utilisateur.
export async function POST(req: NextRequest) {
  try {
    const { requester, targetEmail, plan } = await req.json();
    if ((requester || "").toLowerCase() !== FOUNDER_EMAIL) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }
    if (!targetEmail || !VALID.includes(plan)) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }
    if (targetEmail.toLowerCase() === FOUNDER_EMAIL) {
      return NextResponse.json({ error: "Le compte fondateur ne peut pas être modifié." }, { status: 400 });
    }
    await supabaseAdmin.from("profiles").update({
      plan,
      subscription_status: plan === "none" ? "inactive" : "active",
    }).eq("email", targetEmail.toLowerCase());
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
