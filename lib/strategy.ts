// Stratégie multi-indicateurs à CONFLUENCE (style bots de dernière génération).
// Combine : tendance (EMA), momentum (RSI), MACD, volatilité (Bollinger + ATR), volume.
// Chaque signal d'achat/vente marque des points ; on agit si le score dépasse le seuil du mode.

export type Signal = "BUY" | "SELL" | "HOLD";
export type OHLCV = { closes: number[]; highs: number[]; lows: number[]; volumes: number[] };

function ema(vals: number[], p: number): number[] {
  const k = 2 / (p + 1); let e = vals[0]; const out = [e];
  for (let i = 1; i < vals.length; i++) { e = vals[i] * k + e * (1 - k); out.push(e); }
  return out;
}
function rsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let g = 0, l = 0;
  for (let i = closes.length - period; i < closes.length; i++) { const d = closes[i] - closes[i - 1]; if (d >= 0) g += d; else l -= d; }
  const ag = g / period, al = l / period;
  if (al === 0) return 100;
  return 100 - 100 / (1 + ag / al);
}
function bollinger(closes: number[], period = 20, mult = 2) {
  const s = closes.slice(-period);
  const m = s.reduce((a, b) => a + b, 0) / s.length;
  const sd = Math.sqrt(s.reduce((a, b) => a + (b - m) ** 2, 0) / s.length);
  return { upper: m + mult * sd, lower: m - mult * sd, mean: m };
}
function macd(closes: number[]) {
  const f = ema(closes, 12), sl = ema(closes, 26);
  const line = closes.map((_, i) => f[i] - sl[i]);
  const sig = ema(line, 9);
  const n = closes.length - 1;
  return { line: line[n], signal: sig[n], prevLine: line[n - 1], prevSignal: sig[n - 1] };
}
function atr(highs: number[], lows: number[], closes: number[], period = 14): number {
  const trs: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    trs.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
  }
  const s = trs.slice(-period);
  return s.reduce((a, b) => a + b, 0) / (s.length || 1);
}

// Seuil de confluence requis selon le mode (sur 5 signaux possibles)
const THRESHOLD: Record<string, number> = { patient: 4, actif: 3, agressif: 2 };

export function computeSignal(data: OHLCV, mode = "actif"): { signal: Signal; rsi: number; reason: string; sl?: number; tp?: number; confidence: number } {
  const { closes, highs, lows, volumes } = data;
  if (closes.length < 30) return { signal: "HOLD", rsi: 50, reason: "Pas assez de données", confidence: 0 };

  const price = closes[closes.length - 1];
  const r = rsi(closes);
  const bb = bollinger(closes);
  const m = macd(closes);
  const emaFast = ema(closes, 9), emaSlow = ema(closes, 21);
  const trendUp = emaFast[emaFast.length - 1] > emaSlow[emaSlow.length - 1];
  const a = atr(highs, lows, closes);
  const avgVol = volumes.slice(-20).reduce((x, y) => x + y, 0) / Math.min(20, volumes.length);
  const volHigh = volumes[volumes.length - 1] > avgVol * 1.1;

  // --- Score d'ACHAT ---
  let buy = 0; const bReasons: string[] = [];
  if (r <= 38) { buy++; bReasons.push("RSI bas"); }
  if (price <= bb.lower * 1.01) { buy++; bReasons.push("bande basse"); }
  if (m.line > m.signal && m.prevLine <= m.prevSignal) { buy++; bReasons.push("MACD croise ↑"); }
  if (trendUp) { buy++; bReasons.push("tendance ↑"); }
  if (volHigh) { buy++; bReasons.push("volume fort"); }

  // --- Score de VENTE ---
  let sell = 0; const sReasons: string[] = [];
  if (r >= 62) { sell++; sReasons.push("RSI haut"); }
  if (price >= bb.upper * 0.99) { sell++; sReasons.push("bande haute"); }
  if (m.line < m.signal && m.prevLine >= m.prevSignal) { sell++; sReasons.push("MACD croise ↓"); }
  if (!trendUp) { sell++; sReasons.push("tendance ↓"); }
  if (volHigh) { sell++; sReasons.push("volume fort"); }

  const th = THRESHOLD[mode] || 3;

  if (buy >= th && buy >= sell) {
    return { signal: "BUY", rsi: r, reason: `Achat ${buy}/5 (${bReasons.join(", ")})`, sl: price - a * 1.5, tp: price + a * 2.5, confidence: Math.round((buy / 5) * 100) };
  }
  if (sell >= th && sell > buy) {
    return { signal: "SELL", rsi: r, reason: `Vente ${sell}/5 (${sReasons.join(", ")})`, confidence: Math.round((sell / 5) * 100) };
  }
  return { signal: "HOLD", rsi: r, reason: `Neutre (achat ${buy}/5, vente ${sell}/5, RSI ${r.toFixed(0)})`, confidence: Math.round((Math.max(buy, sell) / 5) * 100) };
}
