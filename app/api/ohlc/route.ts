import { NextRequest, NextResponse } from "next/server";

// Vraies bougies OHLC + prix live depuis CoinGecko (gratuit, sans clé).
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") || "bitcoin";
  const days = req.nextUrl.searchParams.get("days") || "1";
  try {
    const [ohlcRes, priceRes] = await Promise.all([
      fetch(`https://api.coingecko.com/api/v3/coins/${id}/ohlc?vs_currency=usd&days=${days}`, { next: { revalidate: 45 } }),
      fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`, { next: { revalidate: 15 } }),
    ]);
    if (!ohlcRes.ok) return NextResponse.json({ candles: [], price: 0, error: `CoinGecko ${ohlcRes.status}` });
    const raw = await ohlcRes.json();
    const price = (await priceRes.json())?.[id]?.usd || 0;
    const candles = (raw || []).map((k: number[]) => ({ t: k[0], o: k[1], h: k[2], l: k[3], c: k[4] }));
    return NextResponse.json({ candles, price });
  } catch (err) {
    return NextResponse.json({ candles: [], price: 0, error: err instanceof Error ? err.message : "Erreur" });
  }
}
