import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { encrypt } from "@/lib/crypto";
import { getExchangeBalances, EXCHANGE_META } from "@/lib/exchanges";

export async function POST(req: NextRequest) {
  try {
    const { email, exchange, apiKey, apiSecret, passphrase, testnet } = await req.json();
    if (!email || !exchange || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
    }
    if (!EXCHANGE_META[exchange]) return NextResponse.json({ error: "Exchange non supporté." }, { status: 400 });
    const isTestnet = EXCHANGE_META[exchange].testnet ? testnet !== false : false;

    let result;
    try {
      result = await getExchangeBalances(exchange, apiKey, apiSecret, passphrase || "", isTestnet);
    } catch (e) {
      return NextResponse.json({ error: "Clés refusées par " + EXCHANGE_META[exchange].name + " : " + (e instanceof Error ? e.message : "") }, { status: 400 });
    }

    await supabaseAdmin.from("profiles").update({
      exchange,
      binance_key: encrypt(apiKey),
      binance_secret: encrypt(apiSecret),
      exchange_passphrase: passphrase ? encrypt(passphrase) : null,
      binance_testnet: isTestnet,
    }).eq("email", email.toLowerCase());

    return NextResponse.json({ ok: true, exchange, canTrade: result.canTrade, balances: result.balances, testnet: isTestnet });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
