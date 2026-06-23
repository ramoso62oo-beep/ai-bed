import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { decrypt } from "@/lib/crypto";
import { placeMarketOrder, getPrice } from "@/lib/binance";

// Vend immédiatement la position en cours (clôture manuelle).
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });

    const { data: p } = await supabaseAdmin
      .from("profiles")
      .select("binance_key, binance_secret, binance_testnet, bot_symbol, bot_in_position, bot_qty, bot_entry_usd")
      .eq("email", email.toLowerCase()).single();

    if (!p?.binance_key) return NextResponse.json({ error: "Binance non connecté." }, { status: 400 });
    if (!p.bot_in_position || !(Number(p.bot_qty) > 0)) return NextResponse.json({ error: "Aucune position ouverte." }, { status: 400 });

    const symbol = p.bot_symbol || "BTCUSDT";
    const qty = Math.floor(Number(p.bot_qty) * 1e5) / 1e5;
    const apiKey = decrypt(p.binance_key);
    const secret = decrypt(p.binance_secret);

    try {
      await placeMarketOrder(apiKey, secret, p.binance_testnet, symbol, "SELL", { quantity: qty });
    } catch (e) {
      return NextResponse.json({ error: "Échec de la vente : " + (e instanceof Error ? e.message : "") }, { status: 500 });
    }

    let pnl = 0;
    try { const price = await getPrice(symbol, p.binance_testnet); pnl = qty * price - (Number(p.bot_entry_usd) || 0); } catch {}

    await supabaseAdmin.from("profiles").update({ bot_in_position: false, bot_qty: 0, bot_entry_usd: 0 }).eq("email", email.toLowerCase());
    await supabaseAdmin.from("bot_log").insert({ email: email.toLowerCase(), symbol, signal: "MANUEL", action: `💰 VENTE MANUELLE ${qty} ${symbol.replace(/USDT$/,"")}`, detail: `Clôturé par l'utilisateur (P&L ~${pnl.toFixed(2)} USDT)` });

    return NextResponse.json({ ok: true, pnl });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
