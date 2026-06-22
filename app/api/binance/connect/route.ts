import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { encrypt } from "@/lib/crypto";
import { getBalances } from "@/lib/binance";

export async function POST(req: NextRequest) {
  try {
    const { email, apiKey, apiSecret, testnet } = await req.json();
    if (!email || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Email, clé API et secret requis." }, { status: 400 });
    }
    const isTestnet = testnet !== false;

    // Valider les clés en interrogeant le vrai compte Binance
    let result;
    try {
      result = await getBalances(apiKey, apiSecret, isTestnet);
    } catch (e) {
      return NextResponse.json({ error: "Clés invalides ou refusées par Binance : " + (e instanceof Error ? e.message : "") }, { status: 400 });
    }

    // Chiffrer et enregistrer
    await supabaseAdmin.from("profiles").update({
      binance_key: encrypt(apiKey),
      binance_secret: encrypt(apiSecret),
      binance_testnet: isTestnet,
    }).eq("email", email.toLowerCase());

    return NextResponse.json({ ok: true, canTrade: result.canTrade, accountType: result.accountType, balances: result.balances, testnet: isTestnet });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
