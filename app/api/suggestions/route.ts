import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data } = await supabaseAdmin
    .from("suggestions")
    .select("id, title, detail, votes, status, created_at")
    .order("votes", { ascending: false })
    .limit(50);
  return NextResponse.json({ suggestions: data || [] });
}

export async function POST(req: NextRequest) {
  try {
    const { email, title, detail } = await req.json();
    if (!title || title.trim().length < 3) return NextResponse.json({ error: "Titre trop court." }, { status: 400 });
    const { error } = await supabaseAdmin.from("suggestions").insert({ email: (email||"").toLowerCase(), title, detail });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

// Voter pour une suggestion
export async function PATCH(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id requis." }, { status: 400 });
    const { data: cur } = await supabaseAdmin.from("suggestions").select("votes").eq("id", id).single();
    await supabaseAdmin.from("suggestions").update({ votes: (cur?.votes || 0) + 1 }).eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
