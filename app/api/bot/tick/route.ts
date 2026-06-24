import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { decrypt } from "@/lib/crypto";
import { getOHLCV, placeMarketOrder } from "@/lib/binance";
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
    .select("email, binance_key, binance_secret, binance_testnet, exchange, bot_symbol, bot_mode, bot_amount, bot_in_position, bot_qty, bot_sl, bot_tp")
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
    const sl = Number(u.bot_sl) || 0;
    const tp = Number(u.bot_tp) || 0;

    if ((u.exchange || "binance") !== "binance") { results.push({ email, skipped: "exchange non géré par l'auto" }); continue; }

    try {
      const apiKey = decrypt(u.binance_key as string);
      const secret = decrypt(u.binance_secret as string);

      const ohlcv = await getOHLCV(symbol, "15m", 100, testnet);
      const result = computeSignal(ohlcv, mode);
      const signal = result.signal;
      const closes = ohlcv.closes;
      const price = closes[closes.length - 1];
      const base = symbol.replace(/USDT$/, "");

      let action = "Aucune", detail = result.reason, finalSignal: string = signal;

      const qtyR = Math.floor(heldQty * 1e5) / 1e5;
      const sellAll = async (label: string) => {
        await placeMarketOrder(apiKey, secret, testnet, symbol, "SELL", { quantity: qtyR });
        await supabaseAdmin.from("profiles").update({ bot_in_position: false, bot_qty: 0, bot_entry_usd: 0, bot_sl: 0, bot_tp: 0 }).eq("email", email);
        action = `${label} ${qtyR} ${base}`;
      };

      // 1) RISK MANAGEMENT prioritaire : stop-loss / take-profit
      if (inPosition && heldQty > 0 && sl > 0 && price <= sl) {
        try { await sellAll("🛑 STOP-LOSS"); finalSignal = "STOP"; detail = `Prix ${price} ≤ stop-loss ${sl.toFixed(2)}`; }
        catch (e) { action = "Échec stop-loss"; detail = e instanceof Error ? e.message : ""; }
      } else if (inPosition && heldQty > 0 && tp > 0 && price >= tp) {
        try { await sellAll("🎯 TAKE-PROFIT"); finalSignal = "TP"; detail = `Prix ${price} ≥ take-profit ${tp.toFixed(2)}`; }
        catch (e) { action = "Échec take-profit"; detail = e instanceof Error ? e.message : ""; }
      }
      // 2) Signal d'achat (hors position)
      else if (signal === "BUY" && !inPosition) {
        try {
          const order = await placeMarketOrder(apiKey, secret, testnet, symbol, "BUY", { quoteOrderQty: amount });
          const qty = parseFloat((order as { executedQty?: string }).executedQty || "0");
          const spent = parseFloat((order as { cummulativeQuoteQty?: string }).cummulativeQuoteQty || String(amount));
          await supabaseAdmin.from("profiles").update({ bot_in_position: true, bot_qty: qty, bot_entry_usd: spent, bot_sl: result.sl || 0, bot_tp: result.tp || 0 }).eq("email", email);
          action = `✅ ACHAT ${qty} ${base} (${spent.toFixed(2)} USDT) · SL ${(result.sl||0).toFixed(2)} / TP ${(result.tp||0).toFixed(2)}`;
        } catch (e) { action = "Échec achat"; detail = e instanceof Error ? e.message : ""; }
      }
      // 3) Signal de vente (en position)
      else if (signal === "SELL" && inPosition && heldQty > 0) {
        try { await sellAll("💰 VENTE"); }
        catch (e) { action = "Échec vente"; detail = e instanceof Error ? e.message : ""; }
      } else {
        detail = `${result.reason} · ${inPosition ? "en position" : "hors position"}`;
      }

      await supabaseAdmin.from("bot_log").insert({ email, symbol, signal: finalSignal, action, detail });
      results.push({ email, symbol, signal: finalSignal, action });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "erreur";
      await supabaseAdmin.from("bot_log").insert({ email, symbol, signal: "ERREUR", action: "Erreur", detail: msg });
      results.push({ email, error: msg });
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
