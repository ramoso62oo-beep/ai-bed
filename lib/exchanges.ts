import crypto from "crypto";

export type Balance = { asset: string; free: number; locked: number };
export type ExchangeResult = { balances: Balance[]; canTrade: boolean };

export const EXCHANGE_META: Record<string, { name: string; testnet: boolean; passphrase: boolean }> = {
  binance: { name: "Binance", testnet: true,  passphrase: false },
  bybit:   { name: "Bybit",   testnet: true,  passphrase: false },
  okx:     { name: "OKX",     testnet: true,  passphrase: true  },
  kucoin:  { name: "KuCoin",  testnet: false, passphrase: true  },
  kraken:  { name: "Kraken",  testnet: false, passphrase: false },
};

const hmac = (algo: string, key: string | Buffer, data: string, enc: crypto.BinaryToTextEncoding = "hex") =>
  crypto.createHmac(algo, key).update(data).digest(enc);

// ---------- BINANCE ----------
async function binance(apiKey: string, secret: string, testnet: boolean): Promise<ExchangeResult> {
  const base = testnet ? "https://testnet.binance.vision" : "https://api.binance.com";
  const query = `timestamp=${Date.now()}&recvWindow=10000`;
  const sig = hmac("sha256", secret, query);
  const res = await fetch(`${base}/api/v3/account?${query}&signature=${sig}`, { headers: { "X-MBX-APIKEY": apiKey } });
  const d = await res.json();
  if (!res.ok) throw new Error(d.msg || `Binance ${res.status}`);
  const balances = (d.balances || []).map((b: { asset:string; free:string; locked:string }) => ({ asset: b.asset, free: +b.free, locked: +b.locked })).filter((b: Balance) => b.free > 0 || b.locked > 0);
  return { balances, canTrade: !!d.canTrade };
}

// ---------- BYBIT (v5) ----------
async function bybit(apiKey: string, secret: string, testnet: boolean): Promise<ExchangeResult> {
  const base = testnet ? "https://api-testnet.bybit.com" : "https://api.bybit.com";
  const ts = Date.now().toString();
  const recv = "10000";
  const query = "accountType=UNIFIED";
  const sig = hmac("sha256", secret, ts + apiKey + recv + query);
  const res = await fetch(`${base}/v5/account/wallet-balance?${query}`, {
    headers: { "X-BAPI-API-KEY": apiKey, "X-BAPI-TIMESTAMP": ts, "X-BAPI-RECV-WINDOW": recv, "X-BAPI-SIGN": sig },
  });
  const d = await res.json();
  if (d.retCode !== 0) throw new Error(d.retMsg || `Bybit erreur`);
  const coins = d.result?.list?.[0]?.coin || [];
  const balances = coins.map((c: { coin:string; walletBalance:string; locked:string }) => ({ asset: c.coin, free: +c.walletBalance - (+c.locked||0), locked: +c.locked||0 })).filter((b: Balance) => b.free > 0 || b.locked > 0);
  return { balances, canTrade: true };
}

// ---------- OKX (v5) ----------
async function okx(apiKey: string, secret: string, passphrase: string, testnet: boolean): Promise<ExchangeResult> {
  const base = "https://www.okx.com";
  const ts = new Date().toISOString();
  const path = "/api/v5/account/balance";
  const sign = hmac("sha256", secret, ts + "GET" + path, "base64");
  const headers: Record<string,string> = {
    "OK-ACCESS-KEY": apiKey, "OK-ACCESS-SIGN": sign, "OK-ACCESS-TIMESTAMP": ts, "OK-ACCESS-PASSPHRASE": passphrase,
  };
  if (testnet) headers["x-simulated-trading"] = "1";
  const res = await fetch(`${base}${path}`, { headers });
  const d = await res.json();
  if (d.code !== "0") throw new Error(d.msg || `OKX erreur`);
  const details = d.data?.[0]?.details || [];
  const balances = details.map((b: { ccy:string; availBal:string; frozenBal:string }) => ({ asset: b.ccy, free: +b.availBal, locked: +(b.frozenBal||0) })).filter((b: Balance) => b.free > 0 || b.locked > 0);
  return { balances, canTrade: true };
}

// ---------- KUCOIN ----------
async function kucoin(apiKey: string, secret: string, passphrase: string): Promise<ExchangeResult> {
  const base = "https://api.kucoin.com";
  const ts = Date.now().toString();
  const endpoint = "/api/v1/accounts";
  const sign = hmac("sha256", secret, ts + "GET" + endpoint, "base64");
  const passSign = hmac("sha256", secret, passphrase, "base64");
  const res = await fetch(`${base}${endpoint}`, {
    headers: {
      "KC-API-KEY": apiKey, "KC-API-SIGN": sign, "KC-API-TIMESTAMP": ts,
      "KC-API-PASSPHRASE": passSign, "KC-API-KEY-VERSION": "2",
    },
  });
  const d = await res.json();
  if (d.code !== "200000") throw new Error(d.msg || `KuCoin erreur`);
  const agg: Record<string, Balance> = {};
  for (const a of (d.data || [])) {
    const cur = a.currency;
    agg[cur] = agg[cur] || { asset: cur, free: 0, locked: 0 };
    agg[cur].free += +a.available; agg[cur].locked += +a.holds;
  }
  const balances = Object.values(agg).filter(b => b.free > 0 || b.locked > 0);
  return { balances, canTrade: true };
}

// ---------- KRAKEN ----------
async function kraken(apiKey: string, secret: string): Promise<ExchangeResult> {
  const base = "https://api.kraken.com";
  const path = "/0/private/Balance";
  const nonce = (Date.now() * 1000).toString();
  const postData = `nonce=${nonce}`;
  const sha256 = crypto.createHash("sha256").update(nonce + postData).digest();
  const sign = crypto.createHmac("sha512", Buffer.from(secret, "base64")).update(Buffer.concat([Buffer.from(path), sha256])).digest("base64");
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "API-Key": apiKey, "API-Sign": sign, "Content-Type": "application/x-www-form-urlencoded" },
    body: postData,
  });
  const d = await res.json();
  if (d.error && d.error.length) throw new Error(d.error.join(", "));
  const balances = Object.entries(d.result || {}).map(([asset, amt]) => ({ asset, free: +(amt as string), locked: 0 })).filter(b => b.free > 0);
  return { balances, canTrade: true };
}

export async function getExchangeBalances(
  exchange: string, apiKey: string, secret: string, passphrase: string, testnet: boolean
): Promise<ExchangeResult> {
  switch (exchange) {
    case "binance": return binance(apiKey, secret, testnet);
    case "bybit":   return bybit(apiKey, secret, testnet);
    case "okx":     return okx(apiKey, secret, passphrase, testnet);
    case "kucoin":  return kucoin(apiKey, secret, passphrase);
    case "kraken":  return kraken(apiKey, secret);
    default: throw new Error("Exchange non supporté");
  }
}
