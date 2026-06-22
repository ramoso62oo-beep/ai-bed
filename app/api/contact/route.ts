import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email, name, message } = await req.json();
    if (!message || message.trim().length < 3) return NextResponse.json({ error: "Message trop court." }, { status: 400 });
    const { error } = await supabaseAdmin.from("messages").insert({ email: (email||"").toLowerCase(), name, message });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
