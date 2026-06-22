"use client";
import { useEffect, useState, useCallback } from "react";
import Tooltip from "./Tooltip";

type Balance = { asset:string; free:number; locked:number };
const META: Record<string,{name:string; emoji:string; testnet:boolean; passphrase:boolean; help:string}> = {
  binance: { name:"Binance", emoji:"🟡", testnet:true,  passphrase:false, help:"testnet.binance.vision → Generate HMAC Key" },
  bybit:   { name:"Bybit",   emoji:"🟠", testnet:true,  passphrase:false, help:"testnet.bybit.com → API Management" },
  okx:     { name:"OKX",     emoji:"⚫", testnet:true,  passphrase:true,  help:"okx.com → API (nécessite une passphrase)" },
  kucoin:  { name:"KuCoin",  emoji:"🟢", testnet:false, passphrase:true,  help:"kucoin.com → API Management (passphrase requise)" },
  kraken:  { name:"Kraken",  emoji:"🟣", testnet:false, passphrase:false, help:"kraken.com → Security → API" },
};

export default function ConnectExchange({ email, exchange }: { email?: string; exchange: string }) {
  const m = META[exchange] || META.binance;
  const [connected, setConnected] = useState(false);
  const [connExchange, setConnExchange] = useState("");
  const [testnet, setTestnet] = useState(true);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [canTrade, setCanTrade] = useState(false);
  const [form, setForm] = useState({ apiKey:"", apiSecret:"", passphrase:"", testnet:true });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async (mail:string) => {
    const res = await fetch(`/api/exchange/account?email=${encodeURIComponent(mail)}`);
    const d = await res.json();
    if (d.connected) {
      setConnected(true); setConnExchange(d.exchange||""); setTestnet(d.testnet); setCanTrade(!!d.canTrade);
      setBalances(d.balances || []); if (d.error) setErr(d.error);
    } else { setConnected(false); }
  }, []);

  useEffect(()=>{ if (email) load(email); }, [email, load]);
  useEffect(()=>{ setForm(f=>({...f, testnet:m.testnet})); setErr(""); }, [exchange, m.testnet]);

  async function connect() {
    if (!email) return;
    setBusy(true); setErr("");
    const res = await fetch("/api/exchange/connect", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ email, exchange, apiKey:form.apiKey.trim(), apiSecret:form.apiSecret.trim(), passphrase:form.passphrase.trim(), testnet:form.testnet }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(d.error || "Échec."); return; }
    setConnected(true); setConnExchange(d.exchange); setTestnet(d.testnet); setCanTrade(!!d.canTrade);
    setBalances(d.balances || []);
    setForm({ apiKey:"", apiSecret:"", passphrase:"", testnet:d.testnet });
  }

  async function disconnect() {
    if (!email) return;
    await fetch(`/api/exchange/account?email=${encodeURIComponent(email)}`, { method:"DELETE" });
    setConnected(false); setBalances([]);
  }

  const card: React.CSSProperties = { background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"20px 22px" };
  const inp: React.CSSProperties = { width:"100%", background:"rgba(4,7,26,0.6)", border:"1px solid rgba(74,111,165,0.3)", borderRadius:8, padding:"11px 14px", color:"white", fontSize:".78rem", outline:"none", marginTop:6 };

  if (connected) {
    const cm = META[connExchange] || m;
    return (
      <div style={card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:"1.3rem" }}>{cm.emoji}</span>
            <div>
              <div style={{ fontSize:".85rem", fontWeight:700, color:"white" }}>{cm.name} connecté</div>
              <div style={{ fontSize:".62rem", color: testnet?"#fbbf24":"var(--green)" }}>{testnet ? "⚠️ TESTNET (fictif)" : "🔴 RÉEL"} · {canTrade?"Trading OK":"Lecture seule"}</div>
            </div>
          </div>
          <button onClick={disconnect} style={{ background:"rgba(192,57,43,0.1)", border:"1px solid rgba(192,57,43,0.3)", color:"var(--red)", fontSize:".62rem", padding:"5px 10px", borderRadius:6, cursor:"pointer" }}>Déconnecter</button>
        </div>
        {err && <div style={{ fontSize:".64rem", color:"var(--red)", marginBottom:10 }}>{err}</div>}
        <div style={{ fontSize:".62rem", color:"var(--muted2)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:8 }}>Solde réel</div>
        {balances.length === 0 && <div style={{ fontSize:".72rem", color:"var(--muted)" }}>Aucun solde détecté.</div>}
        <div style={{ display:"grid", gap:6, maxHeight:220, overflowY:"auto" }}>
          {balances.map(b=>(
            <div key={b.asset} style={{ display:"flex", justifyContent:"space-between", fontSize:".76rem", padding:"6px 0", borderBottom:"1px solid rgba(10,26,92,0.3)" }}>
              <span style={{ color:"white", fontWeight:600 }}>{b.asset}</span>
              <span style={{ color:"var(--muted2)" }}>{(b.free+b.locked).toLocaleString("fr-FR",{maximumFractionDigits:8})}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={card}>
      <div style={{ fontSize:"1.6rem", marginBottom:8 }}>{m.emoji}</div>
      <div style={{ fontSize:".9rem", fontWeight:700, color:"white", marginBottom:6 }}>Connecter {m.name}</div>
      <div style={{ fontSize:".68rem", color:"var(--muted)", marginBottom:14, lineHeight:1.5 }}>
        Le bot tradera sur <strong>VOTRE</strong> compte {m.name}. Vos clés sont chiffrées ; AI-BED ne peut jamais retirer vos fonds.
      </div>
      {err && <div style={{ background:"rgba(192,57,43,0.1)", border:"1px solid rgba(192,57,43,0.3)", borderRadius:6, padding:"8px 12px", fontSize:".66rem", color:"var(--red)", marginBottom:12 }}>{err}</div>}
      <label style={{ fontSize:".64rem", color:"var(--muted2)" }}>Clé API</label>
      <input style={inp} value={form.apiKey} onChange={e=>setForm(f=>({...f,apiKey:e.target.value}))} placeholder={`API Key ${m.name}`} />
      <label style={{ fontSize:".64rem", color:"var(--muted2)", display:"block", marginTop:12 }}>Clé secrète</label>
      <input style={inp} type="password" value={form.apiSecret} onChange={e=>setForm(f=>({...f,apiSecret:e.target.value}))} placeholder={`Secret ${m.name}`} />
      {m.passphrase && <>
        <label style={{ fontSize:".64rem", color:"var(--muted2)", display:"block", marginTop:12 }}>Passphrase</label>
        <input style={inp} type="password" value={form.passphrase} onChange={e=>setForm(f=>({...f,passphrase:e.target.value}))} placeholder="Passphrase de l'API" />
      </>}
      {m.testnet && (
        <Tooltip text="Le testnet utilise de l'argent fictif pour tester sans risque.">
          <label style={{ display:"flex", alignItems:"center", gap:8, marginTop:14, fontSize:".7rem", color:"var(--text)", cursor:"pointer" }}>
            <input type="checkbox" checked={form.testnet} onChange={e=>setForm(f=>({...f,testnet:e.target.checked}))} />
            Mode testnet (fictif) — recommandé pour tester ⓘ
          </label>
        </Tooltip>
      )}
      {!m.testnet && <div style={{ fontSize:".6rem", color:"#fbbf24", marginTop:12 }}>⚠️ {m.name} n&apos;a pas de testnet : connexion en réel uniquement.</div>}
      <button onClick={connect} disabled={busy} style={{ width:"100%", marginTop:16, padding:13, borderRadius:8, background:"#f0b90b", color:"#04071a", border:"none", fontSize:".8rem", fontWeight:700, cursor:"pointer" }}>
        {busy ? "Vérification…" : `Connecter ${m.name}`}
      </button>
      <div style={{ fontSize:".58rem", color:"var(--muted)", marginTop:10, lineHeight:1.5 }}>
        🔒 Créez la clé avec <strong>Trading activé</strong> mais <strong>Retraits DÉSACTIVÉS</strong>. Où trouver vos clés : {m.help}
      </div>
    </div>
  );
}
