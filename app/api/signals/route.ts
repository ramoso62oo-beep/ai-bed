import { NextResponse } from "next/server";
import { getOHLCV, getPrice } from "@/lib/binance";
import { computeSignal } from "@/lib/strategy";

// Vrais signaux IA : applique la stratégie multi-indicateurs sur les grandes paires (données Binance réelles).
const PAIRS = ["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT","DOGEUSDT","ADAUSDT","AVAXUSDT","LINKUSDT","DOTUSDT"];

export const dynamic = "force-dynamic";

export async function GET() {
  const out = await Promise.all(PAIRS.map(async (symbol) => {
    try {
      const ohlcv = await getOHLCV(symbol, "15m", 100, false);
      const r = computeSignal(ohlcv, "actif");
      let price = ohlcv.closes[ohlcv.closes.length-1];
      try { price = await getPrice(symbol, false); } catch {}
      return { symbol: symbol.replace(/USDT$/,""), signal: r.signal, confidence: r.confidence, reason: r.reason, rsi: Math.round(r.rsi), price };
    } catch { return null; }
  }));
  const signals = out.filter(Boolean).sort((a, b) => (b!.confidence) - (a!.confidence));
  return NextResponse.json({ signals });
}
