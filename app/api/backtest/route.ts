import { NextRequest, NextResponse } from "next/server";
import { computeSignal } from "@/lib/strategy";

export const dynamic = "force-dynamic";

// Backtest : rejoue la stratégie sur l'historique réel Binance et mesure la performance.
export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") || "BTCUSDT").toUpperCase();
  const mode = req.nextUrl.searchParams.get("mode") || "actif";
  const interval = req.nextUrl.searchParams.get("interval") || "15m";
  try {
    const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=1000`);
    const raw = await res.json();
    if (!Array.isArray(raw)) return NextResponse.json({ error: raw?.msg || "données indisponibles" });

    const highs = raw.map((k: unknown[]) => parseFloat(k[2] as string));
    const lows = raw.map((k: unknown[]) => parseFloat(k[3] as string));
    const closes = raw.map((k: unknown[]) => parseFloat(k[4] as string));
    const volumes = raw.map((k: unknown[]) => parseFloat(k[5] as string));
    const n = closes.length;

    let cash = 1000, qty = 0, inPos = false, entry = 0, sl = 0, tp = 0;
    let trades = 0, wins = 0, peak = 1000, maxDD = 0;
    const W = 120; // fenêtre glissante

    for (let i = 40; i < n; i++) {
      const s = Math.max(0, i - W);
      const r = computeSignal({ closes: closes.slice(s, i + 1), highs: highs.slice(s, i + 1), lows: lows.slice(s, i + 1), volumes: volumes.slice(s, i + 1) }, mode);
      const price = closes[i], hi = highs[i], lo = lows[i];

      if (inPos) {
        let exit = 0;
        if (sl > 0 && lo <= sl) exit = sl;
        else if (tp > 0 && hi >= tp) exit = tp;
        else if (r.signal === "SELL") exit = price;
        if (exit > 0) {
          const proceeds = qty * exit; const pnl = proceeds - entry;
          cash += proceeds; trades++; if (pnl > 0) wins++;
          inPos = false; qty = 0;
        }
      } else if (r.signal === "BUY") {
        entry = cash * 0.98; qty = entry / price; cash -= entry; inPos = true; sl = r.sl || 0; tp = r.tp || 0;
      }

      const eq = cash + qty * price;
      if (eq > peak) peak = eq;
      const dd = (peak - eq) / peak;
      if (dd > maxDD) maxDD = dd;
    }

    const finalEq = cash + qty * closes[n - 1];
    const totalReturn = ((finalEq - 1000) / 1000) * 100;
    // Buy & hold pour comparaison
    const bh = ((closes[n - 1] - closes[40]) / closes[40]) * 100;

    return NextResponse.json({
      symbol, mode, interval, bars: n,
      trades, wins, winRate: trades ? (wins / trades) * 100 : 0,
      totalReturn, maxDrawdown: maxDD * 100, buyHold: bh,
      finalEquity: finalEq,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" });
  }
}
