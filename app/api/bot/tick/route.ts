import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { decrypt } from "@/lib/crypto";
import { getCloses, placeMarketOrder } from "@/lib/binance";
import { computeSignal } from "@/lib/strategy";

// Déclenché par un cron externe. Sécurisé par token.
// Exécute une itération de stratégie par utilisateur en mode auto.
// Le bot suit SA propre position (bot_in_position / bot_qty) — indépendamment
// des soldes pré-existants du compte.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("key");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: users } = await supabaseAdmin
    .from("profiles")
    .select("email, binance_key, binance_secret, binance_testnet, exchange, bot_symbol, bot_mode, bot_amount, bot_in_position, bot_qty")
    .eq("bot_auto", true)
    .not("binance_key", "is", null);

  const results: Array<Record<string, unknown>> = [];

  for (const u of users || []) {
    const email = u.email as string;
    const symbol = (u.bot_symbol as string) || "BTCUSDT";
    const mode = (u.bot_mode as string) || "actif";
    const amount = Number(u.bot_amount) || 15;
    const testnet = u.binance_testnet;
    const inPosition = !!u.bot_in_position;
    const heldQty = Number(u.bot_qty) || 0;

    if ((u.exchange || "binance") !== "binance") { results.push({ email, skipped: "exchange non géré par l'auto" }); continue; }

    try {
      const apiKey = decrypt(u.binance_key as string);
      const secret = decrypt(u.binance_secret as string);

      const closes = await getCloses(symbol, "15m", 100, testnet);
      const { signal, reason } = computeSignal(closes, mode);
      const base = symbol.replace(/USDT$/, "");

      let action = "Aucune", detail = reason;

      if (signal === "BUY" && !inPosition) {
        try {
          const order = await placeMarketOrder(apiKey, secret, testnet, symbol, "BUY", { quoteOrderQty: amount });
          const qty = parseFloat((order as { executedQty?: string }).executedQty || "0");
          await supabaseAdmin.from("profiles").update({ bot_in_position: true, bot_qty: qty }).eq("email", email);
          action = `✅ ACHAT ${qty} ${base} (${amount} USDT)`;
        } catch (e) { action = "Échec achat"; detail = e instanceof Error ? e.message : ""; }
      } else if (signal === "SELL" && inPosition && heldQty > 0) {
        try {
          const qty = Math.floor(heldQty * 1e5) / 1e5;
          await placeMarketOrder(apiKey, secret, testnet, symbol, "SELL", { quantity: qty });
          await supabaseAdmin.from("profiles").update({ bot_in_position: false, bot_qty: 0 }).eq("email", email);
          action = `💰 VENTE ${qty} ${base}`;
        } catch (e) { action = "Échec vente"; detail = e instanceof Error ? e.message : ""; }
      } else {
        detail = `${reason} · ${inPosition ? "en position" : "hors position"}`;
      }

      await supabaseAdmin.from("bot_log").insert({ email, symbol, signal, action, detail });
      results.push({ email, symbol, signal, action });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "erreur";
      await supabaseAdmin.from("bot_log").insert({ email, symbol, signal: "ERREUR", action: "Erreur", detail: msg });
      results.push({ email, error: msg });
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
