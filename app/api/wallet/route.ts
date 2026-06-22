import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Prix simulés (servira de référence pour achats/ventes)
const PRICES: Record<string, number> = {
  BTC: 64310, ETH: 3420, SOL: 198, PEPE: 0.0000132, AIBED: 0.0842,
};

async function getState(email: string) {
  const { data: profile } = await supabaseAdmin.from("profiles").select("balance").eq("email", email).single();
  const { data: holdings } = await supabaseAdmin.from("holdings").select("symbol,amount,avg_price").eq("email", email);
  const { data: tx } = await supabaseAdmin.from("wallet_tx").select("type,symbol,amount,usd,address,created_at").eq("email", email).order("created_at", { ascending: false }).limit(20);
  return { balance: Number(profile?.balance || 0), holdings: holdings || [], tx: tx || [], prices: PRICES };
}

// GET ?email=
export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") || "").toLowerCase();
  if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });
  return NextResponse.json(await getState(email));
}

// POST { email, action, ... }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").toLowerCase();
    if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });

    const { data: profile } = await supabaseAdmin.from("profiles").select("balance").eq("email", email).single();
    if (!profile) return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
    let balance = Number(profile.balance || 0);

    if (body.action === "deposit") {
      const usd = Number(body.usd);
      if (!usd || usd <= 0) return NextResponse.json({ error: "Montant invalide." }, { status: 400 });
      balance += usd;
      await supabaseAdmin.from("profiles").update({ balance }).eq("email", email);
      await supabaseAdmin.from("wallet_tx").insert({ email, type: "deposit", usd });
      return NextResponse.json(await getState(email));
    }

    if (body.action === "buy" || body.action === "sell") {
      const symbol = String(body.symbol || "").toUpperCase();
      const price = PRICES[symbol];
      if (!price) return NextResponse.json({ error: "Crypto inconnue." }, { status: 400 });
      const usd = Number(body.usd);
      if (!usd || usd <= 0) return NextResponse.json({ error: "Montant invalide." }, { status: 400 });
      const qty = usd / price;

      const { data: h } = await supabaseAdmin.from("holdings").select("amount,avg_price").eq("email", email).eq("symbol", symbol).single();
      const curAmount = Number(h?.amount || 0);
      const curAvg = Number(h?.avg_price || 0);

      if (body.action === "buy") {
        if (usd > balance) return NextResponse.json({ error: "Solde insuffisant." }, { status: 400 });
        balance -= usd;
        const newAmount = curAmount + qty;
        const newAvg = newAmount > 0 ? (curAmount * curAvg + usd) / newAmount : price;
        await supabaseAdmin.from("holdings").upsert({ email, symbol, amount: newAmount, avg_price: newAvg }, { onConflict: "email,symbol" });
      } else {
        if (qty > curAmount) return NextResponse.json({ error: "Quantité insuffisante." }, { status: 400 });
        balance += usd;
        await supabaseAdmin.from("holdings").update({ amount: curAmount - qty }).eq("email", email).eq("symbol", symbol);
      }
      await supabaseAdmin.from("profiles").update({ balance }).eq("email", email);
      await supabaseAdmin.from("wallet_tx").insert({ email, type: body.action, symbol, amount: qty, usd });
      return NextResponse.json(await getState(email));
    }

    if (body.action === "transfer") {
      const symbol = String(body.symbol || "").toUpperCase();
      const amount = Number(body.amount);
      const address = String(body.address || "").trim();
      if (!address || address.length < 6) return NextResponse.json({ error: "Adresse de destination invalide." }, { status: 400 });
      if (!amount || amount <= 0) return NextResponse.json({ error: "Montant invalide." }, { status: 400 });

      const { data: h } = await supabaseAdmin.from("holdings").select("amount").eq("email", email).eq("symbol", symbol).single();
      const curAmount = Number(h?.amount || 0);
      if (amount > curAmount) return NextResponse.json({ error: "Solde de crypto insuffisant." }, { status: 400 });

      await supabaseAdmin.from("holdings").update({ amount: curAmount - amount }).eq("email", email).eq("symbol", symbol);
      await supabaseAdmin.from("wallet_tx").insert({ email, type: "transfer", symbol, amount, address, usd: amount * (PRICES[symbol] || 0) });
      return NextResponse.json(await getState(email));
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
