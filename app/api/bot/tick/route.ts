import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { decrypt } from "@/lib/crypto";
import { getCloses, getFreeBalance, placeMarketOrder } from "@/lib/binance";
import { computeSignal } from "@/lib/strategy";

// Déclenché par un cron externe (cron-job.org / GitHub Actions).
// Sécurisé par un token. Exécute une itération de stratégie pour chaque utilisateur
// en mode auto, et passe un vrai ordre si un signal apparaît.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("key");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Utilisateurs avec auto activé + clés Binance présentes
  const { data: users } = await supabaseAdmin
    .from("profiles")
    .select("email, binance_key, binance_secret, binance_testnet, exchange, bot_symbol, bot_mode, bot_amount")
    .eq("bot_auto", true)
    .not("binance_key", "is", null);

  const results: Array<Record<string, unknown>> = [];

  for (const u of users || []) {
    const email = u.email as string;
    const symbol = (u.bot_symbol as string) || "BTCUSDT";
    const mode = (u.bot_mode as string) || "actif";
    const amount = Number(u.bot_amount) || 15;
    const testnet = u.binance_testnet;
    // Pour l'instant le moteur ne gère que Binance (spot). Les autres exchanges suivront.
    if ((u.exchange || "binance") !== "binance") { results.push({ email, skipped: "exchange non supporté pour l'auto" }); continue; }

    try {
      const apiKey = decrypt(u.binance_key as string);
      const secret = decrypt(u.binance_secret as string);

      const closes = await getCloses(symbol, "15m", 100, testnet);
      const { signal, reason } = computeSignal(closes, mode);

      const base = symbol.replace(/USDT$/, "");
      const baseFree = await getFreeBalance(apiKey, secret, testnet, base);
      const price = closes[closes.length - 1];
      const baseValue = baseFree * price;

      let action = "Aucune", detail = reason;

      if (signal === "BUY" && baseValue < amount * 0.5) {
        // On n'est pas en position → on achète
        try {
          await placeMarketOrder(apiKey, secret, testnet, symbol, "BUY", { quoteOrderQty: amount });
          action = `ACHAT ${amount} USDT de ${base}`;
        } catch (e) { action = "Échec achat"; detail = e instanceof Error ? e.message : ""; }
      } else if (signal === "SELL" && baseValue >= amount * 0.5) {
        // On est en position → on vend tout
        try {
          const qty = Math.floor(baseFree * 1e5) / 1e5; // arrondi prudent
          await placeMarketOrder(apiKey, secret, testnet, symbol, "SELL", { quantity: qty });
          action = `VENTE ${qty} ${base}`;
        } catch (e) { action = "Échec vente"; detail = e instanceof Error ? e.message : ""; }
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
