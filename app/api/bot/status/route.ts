import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getPrice } from "@/lib/binance";

// Statut temps réel du bot : position, valeur, P&L %/USDT.
export async function GET(req: NextRequest) {
  try {
    const email = (req.nextUrl.searchParams.get("email") || "").toLowerCase();
    if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });

    const { data: p } = await supabaseAdmin
      .from("profiles")
      .select("bot_auto, bot_symbol, bot_in_position, bot_qty, bot_entry_usd, bot_amount, binance_testnet, binance_key")
      .eq("email", email).single();

    if (!p) return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });

    const symbol = p.bot_symbol || "BTCUSDT";
    const inPos = !!p.bot_in_position;
    const qty = Number(p.bot_qty) || 0;
    const entryUsd = Number(p.bot_entry_usd) || Number(p.bot_amount) || 0;

    let price = 0, currentValue = 0, pnlUsd = 0, pnlPct = 0;
    if (inPos && qty > 0) {
      try {
        price = await getPrice(symbol, p.binance_testnet);
        currentValue = qty * price;
        pnlUsd = currentValue - entryUsd;
        pnlPct = entryUsd > 0 ? (pnlUsd / entryUsd) * 100 : 0;
      } catch {}
    }

    return NextResponse.json({
      connected: !!p.binance_key,
      auto: !!p.bot_auto,
      inPosition: inPos,
      symbol,
      qty,
      price,
      entryUsd,
      currentValue,
      pnlUsd,
      pnlPct,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
