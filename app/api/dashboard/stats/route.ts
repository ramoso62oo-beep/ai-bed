import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { decrypt } from "@/lib/crypto";
import { getFreeBalance, getPrice } from "@/lib/binance";

// Statistiques RÉELLES du tableau de bord à partir du compte connecté.
export async function GET(req: NextRequest) {
  try {
    const email = (req.nextUrl.searchParams.get("email") || "").toLowerCase();
    if (!email) return NextResponse.json({ connected: false });

    const { data: p } = await supabaseAdmin
      .from("profiles")
      .select("binance_key, binance_secret, binance_testnet, exchange, bot_symbol, bot_in_position, bot_qty, bot_entry_usd, bot_auto")
      .eq("email", email).single();

    if (!p?.binance_key || (p.exchange && p.exchange !== "binance")) {
      return NextResponse.json({ connected: false });
    }

    const apiKey = decrypt(p.binance_key);
    const secret = decrypt(p.binance_secret);
    const testnet = p.binance_testnet;

    let usdt = 0;
    try { usdt = await getFreeBalance(apiKey, secret, testnet, "USDT"); } catch {}

    let positionValue = 0, pnlUsd = 0, pnlPct = 0, price = 0, entryPrice = 0;
    const qty = Number(p.bot_qty) || 0;
    const inPosition = !!p.bot_in_position && qty > 0;
    if (inPosition) {
      try {
        price = await getPrice(p.bot_symbol || "BTCUSDT", testnet);
        positionValue = qty * price;
        const entry = Number(p.bot_entry_usd) || 0;
        entryPrice = qty > 0 ? entry / qty : 0;
        pnlUsd = positionValue - entry;
        pnlPct = entry > 0 ? (pnlUsd / entry) * 100 : 0;
      } catch {}
    }

    return NextResponse.json({
      connected: true,
      testnet,
      usdt,
      positionValue,
      total: usdt + positionValue,
      pnlUsd,
      pnlPct,
      inPosition,
      qty,
      price,
      entryPrice,
      entryUsd: Number(p.bot_entry_usd) || 0,
      botAuto: !!p.bot_auto,
      symbol: p.bot_symbol || "BTCUSDT",
    });
  } catch (err) {
    return NextResponse.json({ connected: false, error: err instanceof Error ? err.message : "Erreur" });
  }
}
