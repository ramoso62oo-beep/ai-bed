import { NextRequest, NextResponse } from "next/server";

// Vraies bougies intraday depuis Binance (réel, depuis nos serveurs Europe).
// Intervalles: 1s, 1m, 5m, 15m, 1h, 4h, 1d.
export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") || "BTCUSDT").toUpperCase();
  const interval = req.nextUrl.searchParams.get("interval") || "1m";
  const limit = req.nextUrl.searchParams.get("limit") || "120";
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      { next: { revalidate: 3 } }
    );
    if (!res.ok) return NextResponse.json({ candles: [], error: `Binance ${res.status}` });
    const raw = await res.json();
    if (!Array.isArray(raw)) return NextResponse.json({ candles: [], error: raw?.msg || "indisponible" });
    const candles = raw.map((k: unknown[]) => ({
      t: Math.floor((k[0] as number) / 1000),
      o: parseFloat(k[1] as string), h: parseFloat(k[2] as string),
      l: parseFloat(k[3] as string), c: parseFloat(k[4] as string),
      v: parseFloat(k[5] as string),
    }));
    const price = candles.length ? candles[candles.length - 1].c : 0;
    return NextResponse.json({ candles, price });
  } catch (err) {
    return NextResponse.json({ candles: [], error: err instanceof Error ? err.message : "Erreur" });
  }
}
