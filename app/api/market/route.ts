import { NextRequest, NextResponse } from "next/server";

// Récupère les vraies données de marché depuis CoinGecko (gratuit, pas de clé)
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") || "crypto"; // crypto | meme
  const page = req.nextUrl.searchParams.get("page") || "1";
  const category = type === "meme" ? "&category=meme-token" : "";
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=${page}${category}&price_change_percentage=1h,24h,7d&sparkline=true`;

  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      next: { revalidate: 60 }, // cache 60s
    });
    if (!res.ok) {
      return NextResponse.json({ error: `CoinGecko ${res.status}`, coins: [] }, { status: 200 });
    }
    const data = await res.json();
    const coins = (data || []).map((c: Record<string, unknown>) => ({
      id: c.id, symbol: (c.symbol as string)?.toUpperCase(), name: c.name, image: c.image,
      price: c.current_price, mc: c.market_cap, rank: c.market_cap_rank, vol: c.total_volume,
      ch1h: (c.price_change_percentage_1h_in_currency as number) ?? null,
      ch24h: (c.price_change_percentage_24h_in_currency as number) ?? c.price_change_percentage_24h ?? null,
      ch7d: (c.price_change_percentage_7d_in_currency as number) ?? null,
      ath: c.ath, supply: c.circulating_supply,
      spark: (c.sparkline_in_7d as { price: number[] })?.price?.filter((_, i) => i % 6 === 0) || [],
    }));
    return NextResponse.json({ coins });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur", coins: [] }, { status: 200 });
  }
}
