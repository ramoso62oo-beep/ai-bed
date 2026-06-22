import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { decrypt } from "@/lib/crypto";
import { getExchangeBalances } from "@/lib/exchanges";

export async function GET(req: NextRequest) {
  try {
    const email = (req.nextUrl.searchParams.get("email") || "").toLowerCase();
    if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });

    const { data: p } = await supabaseAdmin
      .from("profiles")
      .select("exchange, binance_key, binance_secret, exchange_passphrase, binance_testnet")
      .eq("email", email)
      .single();

    if (!p?.binance_key || !p?.binance_secret) return NextResponse.json({ connected: false });

    const exchange = p.exchange || "binance";
    try {
      const result = await getExchangeBalances(
        exchange, decrypt(p.binance_key), decrypt(p.binance_secret),
        p.exchange_passphrase ? decrypt(p.exchange_passphrase) : "", p.binance_testnet
      );
      return NextResponse.json({ connected: true, exchange, testnet: p.binance_testnet, canTrade: result.canTrade, balances: result.balances });
    } catch (e) {
      return NextResponse.json({ connected: true, exchange, error: "Connexion échouée : " + (e instanceof Error ? e.message : "") });
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const email = (req.nextUrl.searchParams.get("email") || "").toLowerCase();
    if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });
    await supabaseAdmin.from("profiles").update({ binance_key: null, binance_secret: null, exchange_passphrase: null }).eq("email", email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
