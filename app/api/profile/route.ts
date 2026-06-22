import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") || "").toLowerCase();
  if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });
  const { data } = await supabaseAdmin.from("profiles").select("pseudo, photo, plan, role, subscription_status").eq("email", email).single();
  return NextResponse.json({ profile: data || {} });
}

export async function POST(req: NextRequest) {
  try {
    const { email, pseudo, photo } = await req.json();
    if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });
    const update: Record<string, string> = {};
    if (pseudo !== undefined) update.pseudo = pseudo;
    if (photo !== undefined) update.photo = photo;
    await supabaseAdmin.from("profiles").update(update).eq("email", email.toLowerCase());
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
