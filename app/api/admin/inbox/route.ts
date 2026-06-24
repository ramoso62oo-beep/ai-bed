import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const FOUNDER_EMAIL = "ramos.o62oo@gmail.com";

export async function GET(req: NextRequest) {
  const requester = (req.nextUrl.searchParams.get("requester") || "").toLowerCase();
  if (requester !== FOUNDER_EMAIL) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const { data: messages } = await supabaseAdmin.from("messages")
    .select("id, email, name, message, created_at").order("created_at", { ascending: false }).limit(100);
  const { data: suggestions } = await supabaseAdmin.from("suggestions")
    .select("id, email, title, detail, votes, status, created_at").order("votes", { ascending: false }).limit(100);

  return NextResponse.json({ messages: messages || [], suggestions: suggestions || [] });
}

// Mettre à jour le statut d'une suggestion (nouveau / en cours / fait / refusé)
export async function POST(req: NextRequest) {
  try {
    const { requester, suggestionId, status } = await req.json();
    if ((requester || "").toLowerCase() !== FOUNDER_EMAIL) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    if (!suggestionId || !status) return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
    await supabaseAdmin.from("suggestions").update({ status }).eq("id", suggestionId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
