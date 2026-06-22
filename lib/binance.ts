import crypto from "crypto";

export function binanceBase(testnet: boolean) {
  return testnet ? "https://testnet.binance.vision" : "https://api.binance.com";
}

function sign(query: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(query).digest("hex");
}

// Appel signé à l'API Binance (compte, ordres, etc.)
export async function binanceSigned(
  apiKey: string, secret: string, testnet: boolean,
  method: "GET" | "POST" | "DELETE", path: string,
  params: Record<string, string | number> = {}
) {
  const query = new URLSearchParams({ ...params, timestamp: String(Date.now()), recvWindow: "10000" } as Record<string,string>).toString();
  const signature = sign(query, secret);
  const url = `${binanceBase(testnet)}${path}?${query}&signature=${signature}`;
  const res = await fetch(url, { method, headers: { "X-MBX-APIKEY": apiKey } });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || `Erreur Binance (${res.status})`);
  }
  return data;
}

// Récupère les soldes non nuls du compte
export async function getBalances(apiKey: string, secret: string, testnet: boolean) {
  const acc = await binanceSigned(apiKey, secret, testnet, "GET", "/api/v3/account");
  const balances = (acc.balances || [])
    .map((b: { asset:string; free:string; locked:string }) => ({ asset: b.asset, free: parseFloat(b.free), locked: parseFloat(b.locked) }))
    .filter((b: { free:number; locked:number }) => b.free > 0 || b.locked > 0);
  return { balances, canTrade: acc.canTrade, accountType: acc.accountType };
}

// Prix actuel d'une paire (public, pas de signature)
export async function getPrice(symbol: string, testnet: boolean) {
  const res = await fetch(`${binanceBase(testnet)}/api/v3/ticker/price?symbol=${symbol}`);
  const d = await res.json();
  return parseFloat(d.price);
}

// Bougies (klines) — public. Renvoie les prix de clôture.
export async function getCloses(symbol: string, interval: string, limit: number, testnet: boolean): Promise<number[]> {
  const res = await fetch(`${binanceBase(testnet)}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
  const d = await res.json();
  if (!Array.isArray(d)) throw new Error(d.msg || "klines indisponibles");
  return d.map((k: unknown[]) => parseFloat(k[4] as string));
}

// Solde libre d'un actif
export async function getFreeBalance(apiKey: string, secret: string, testnet: boolean, asset: string): Promise<number> {
  const acc = await binanceSigned(apiKey, secret, testnet, "GET", "/api/v3/account");
  const b = (acc.balances || []).find((x: { asset: string }) => x.asset === asset);
  return b ? parseFloat(b.free) : 0;
}

// Ordre au marché. side BUY → dépense quoteOrderQty (USDT). side SELL → vend quantity (base).
export async function placeMarketOrder(
  apiKey: string, secret: string, testnet: boolean,
  symbol: string, side: "BUY" | "SELL", opts: { quoteOrderQty?: number; quantity?: number }
) {
  const params: Record<string, string | number> = { symbol, side, type: "MARKET" };
  if (side === "BUY" && opts.quoteOrderQty) params.quoteOrderQty = opts.quoteOrderQty;
  if (side === "SELL" && opts.quantity) params.quantity = opts.quantity;
  return binanceSigned(apiKey, secret, testnet, "POST", "/api/v3/order", params);
}
