import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") || "").toLowerCase();
  if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });
  const { data } = await supabaseAdmin.from("profiles")
    .select("bot_auto, bot_symbol, bot_mode, bot_amount, binance_testnet, binance_key")
    .eq("email", email).single();
  const { data: logs } = await supabaseAdmin.from("bot_log")
    .select("symbol, signal, action, detail, created_at")
    .eq("email", email).order("created_at", { ascending: false }).limit(15);
  return NextResponse.json({
    config: { ...(data || {}), connected: !!data?.binance_key },
    logs: logs || [],
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email, bot_auto, bot_symbol, bot_mode, bot_amount } = await req.json();
    if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });
    const update: Record<string, unknown> = {};
    if (bot_auto !== undefined) update.bot_auto = bot_auto;
    if (bot_symbol) update.bot_symbol = bot_symbol.toUpperCase();
    if (bot_mode) update.bot_mode = bot_mode;
    if (bot_amount !== undefined) update.bot_amount = Number(bot_amount);
    await supabaseAdmin.from("profiles").update(update).eq("email", email.toLowerCase());
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
