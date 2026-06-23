// Stratégie de trading : RSI + Bandes de Bollinger
// Renvoie un signal "BUY" | "SELL" | "HOLD" à partir des prix de clôture.

export type Signal = "BUY" | "SELL" | "HOLD";

function rsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  const avgGain = gains / period, avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function bollinger(closes: number[], period = 20, mult = 2) {
  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / slice.length;
  const sd = Math.sqrt(variance);
  return { upper: mean + mult * sd, lower: mean - mult * sd, mean };
}

// Sensibilité selon le mode de risque
const PARAMS: Record<string, { rsiBuy: number; rsiSell: number }> = {
  patient:  { rsiBuy: 30, rsiSell: 70 },
  actif:    { rsiBuy: 35, rsiSell: 65 },
  agressif: { rsiBuy: 42, rsiSell: 58 },
};

export function computeSignal(closes: number[], mode = "actif"): { signal: Signal; rsi: number; reason: string } {
  if (closes.length < 21) return { signal: "HOLD", rsi: 50, reason: "Pas assez de données" };
  const p = PARAMS[mode] || PARAMS.actif;
  const r = rsi(closes);
  const bb = bollinger(closes);
  const price = closes[closes.length - 1];
  // Patient = prudent (exige RSI + confirmation bande). Actif/Agressif = plus réactifs (RSI seul).
  const strict = mode === "patient";

  // Achat : survente
  if (r <= p.rsiBuy && (!strict || price <= bb.lower * 1.005)) {
    return { signal: "BUY", rsi: r, reason: `RSI ${r.toFixed(0)} (survente)${strict ? " + sous bande basse" : ""}` };
  }
  // Vente : surachat
  if (r >= p.rsiSell && (!strict || price >= bb.upper * 0.995)) {
    return { signal: "SELL", rsi: r, reason: `RSI ${r.toFixed(0)} (surachat)${strict ? " + au-dessus bande haute" : ""}` };
  }
  return { signal: "HOLD", rsi: r, reason: `RSI ${r.toFixed(0)} — neutre` };
}
