import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { decrypt } from "@/lib/crypto";
import { getBalances } from "@/lib/binance";

export async function GET(req: NextRequest) {
  try {
    const email = (req.nextUrl.searchParams.get("email") || "").toLowerCase();
    if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });

    const { data: p } = await supabaseAdmin
      .from("profiles")
      .select("binance_key, binance_secret, binance_testnet")
      .eq("email", email)
      .single();

    if (!p?.binance_key || !p?.binance_secret) {
      return NextResponse.json({ connected: false });
    }

    try {
      const result = await getBalances(decrypt(p.binance_key), decrypt(p.binance_secret), p.binance_testnet);
      return NextResponse.json({ connected: true, testnet: p.binance_testnet, canTrade: result.canTrade, balances: result.balances });
    } catch (e) {
      return NextResponse.json({ connected: true, error: "Connexion Binance échouée : " + (e instanceof Error ? e.message : "") });
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}

// Déconnecter (supprimer les clés)
export async function DELETE(req: NextRequest) {
  try {
    const email = (req.nextUrl.searchParams.get("email") || "").toLowerCase();
    if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });
    await supabaseAdmin.from("profiles").update({ binance_key: null, binance_secret: null }).eq("email", email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
