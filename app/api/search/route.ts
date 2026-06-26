import { NextRequest, NextResponse } from "next/server";

// Recherche dans TOUTE la base CoinGecko (cryptos + memecoins).
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 1) return NextResponse.json({ coins: [] });
  try {
    const s = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(q)}`, { next: { revalidate: 120 } });
    if (!s.ok) return NextResponse.json({ coins: [], error: `search ${s.status}` });
    const sd = await s.json();
    const ids = (sd.coins || []).slice(0, 20).map((c: { id: string }) => c.id);
    if (!ids.length) return NextResponse.json({ coins: [] });

    const m = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids.join(",")}&price_change_percentage=1h,24h,7d&sparkline=true`, { next: { revalidate: 60 } });
    const md = await m.json();
    const coins = (md || []).map((c: Record<string, unknown>) => ({
      id: c.id, symbol: (c.symbol as string)?.toUpperCase(), name: c.name, image: c.image,
      price: c.current_price, mc: c.market_cap, rank: c.market_cap_rank, vol: c.total_volume, ath: c.ath, supply: c.circulating_supply,
      ch1h: (c.price_change_percentage_1h_in_currency as number) ?? null,
      ch24h: (c.price_change_percentage_24h_in_currency as number) ?? c.price_change_percentage_24h ?? null,
      ch7d: (c.price_change_percentage_7d_in_currency as number) ?? null,
      spark: (c.sparkline_in_7d as { price: number[] })?.price?.filter((_, i) => i % 6 === 0) || [],
    }));
    return NextResponse.json({ coins });
  } catch (err) {
    return NextResponse.json({ coins: [], error: err instanceof Error ? err.message : "Erreur" });
  }
}
