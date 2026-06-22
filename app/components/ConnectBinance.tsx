"use client";
import { useEffect, useState, useCallback } from "react";
import Tooltip from "./Tooltip";

type Balance = { asset:string; free:number; locked:number };

export default function ConnectBinance({ email }: { email?: string }) {
  const [connected, setConnected] = useState(false);
  const [testnet, setTestnet] = useState(true);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [canTrade, setCanTrade] = useState(false);
  const [form, setForm] = useState({ apiKey:"", apiSecret:"", testnet:true });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async (mail:string) => {
    const res = await fetch(`/api/binance/account?email=${encodeURIComponent(mail)}`);
    const d = await res.json();
    if (d.connected) {
      setConnected(true); setTestnet(d.testnet); setCanTrade(!!d.canTrade);
      setBalances(d.balances || []);
      if (d.error) setErr(d.error);
    }
  }, []);

  useEffect(()=>{ if (email) load(email); }, [email, load]);

  async function connect() {
    if (!email) return;
    setBusy(true); setErr("");
    const res = await fetch("/api/binance/connect", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ email, apiKey:form.apiKey.trim(), apiSecret:form.apiSecret.trim(), testnet:form.testnet }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(d.error || "Échec de connexion."); return; }
    setConnected(true); setTestnet(d.testnet); setCanTrade(!!d.canTrade);
    setBalances(d.balances || []); setShowForm(false);
    setForm({ apiKey:"", apiSecret:"", testnet:d.testnet });
  }

  async function disconnect() {
    if (!email) return;
    await fetch(`/api/binance/account?email=${encodeURIComponent(email)}`, { method:"DELETE" });
    setConnected(false); setBalances([]); setCanTrade(false);
  }

  const card: React.CSSProperties = { background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"20px 22px" };
  const inp: React.CSSProperties = { width:"100%", background:"rgba(4,7,26,0.6)", border:"1px solid rgba(74,111,165,0.3)", borderRadius:8, padding:"11px 14px", color:"white", fontSize:".78rem", outline:"none", marginTop:6 };

  if (connected && !showForm) {
    return (
      <div style={card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:"1.3rem" }}>🟡</span>
            <div>
              <div style={{ fontSize:".85rem", fontWeight:700, color:"white" }}>Binance connecté</div>
              <div style={{ fontSize:".62rem", color: testnet?"#fbbf24":"var(--green)" }}>{testnet ? "⚠️ TESTNET (argent fictif)" : "🔴 RÉEL (argent réel)"} · {canTrade?"Trading autorisé":"Lecture seule"}</div>
            </div>
          </div>
          <button onClick={disconnect} style={{ background:"rgba(192,57,43,0.1)", border:"1px solid rgba(192,57,43,0.3)", color:"var(--red)", fontSize:".62rem", padding:"5px 10px", borderRadius:6, cursor:"pointer" }}>Déconnecter</button>
        </div>
        {err && <div style={{ fontSize:".64rem", color:"var(--red)", marginBottom:10 }}>{err}</div>}
        <div style={{ fontSize:".62rem", color:"var(--muted2)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:8 }}>Solde réel du compte</div>
        {balances.length === 0 && <div style={{ fontSize:".72rem", color:"var(--muted)" }}>Aucun solde. (Sur le testnet, récupérez des fonds fictifs depuis le faucet Binance testnet.)</div>}
        <div style={{ display:"grid", gap:6 }}>
          {balances.slice(0,8).map(b=>(
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
      <div style={{ fontSize:"1.6rem", marginBottom:8 }}>🟡</div>
      <div style={{ fontSize:".9rem", fontWeight:700, color:"white", marginBottom:6 }}>Connecter votre compte Binance</div>
      <div style={{ fontSize:".68rem", color:"var(--muted)", marginBottom:16, lineHeight:1.5 }}>
        Le bot tradera sur <strong>VOTRE</strong> compte Binance. Vos clés sont chiffrées et AI-BED ne peut jamais retirer vos fonds. Commencez en <strong>testnet</strong> (argent fictif) pour tester sans risque.
      </div>
      {err && <div style={{ background:"rgba(192,57,43,0.1)", border:"1px solid rgba(192,57,43,0.3)", borderRadius:6, padding:"8px 12px", fontSize:".66rem", color:"var(--red)", marginBottom:12 }}>{err}</div>}

      <label style={{ fontSize:".64rem", color:"var(--muted2)" }}>Clé API</label>
      <input style={inp} value={form.apiKey} onChange={e=>setForm(f=>({...f,apiKey:e.target.value}))} placeholder="Votre API Key Binance" />
      <label style={{ fontSize:".64rem", color:"var(--muted2)", display:"block", marginTop:12 }}>Clé secrète</label>
      <input style={inp} type="password" value={form.apiSecret} onChange={e=>setForm(f=>({...f,apiSecret:e.target.value}))} placeholder="Votre Secret Key Binance" />

      <Tooltip text="Le testnet utilise de l'argent fictif pour tester sans risque. Décochez seulement quand vous êtes prêt à trader pour de vrai.">
        <label style={{ display:"flex", alignItems:"center", gap:8, marginTop:14, fontSize:".7rem", color:"var(--text)", cursor:"pointer" }}>
          <input type="checkbox" checked={form.testnet} onChange={e=>setForm(f=>({...f,testnet:e.target.checked}))} />
          Mode testnet (argent fictif) — recommandé pour commencer ⓘ
        </label>
      </Tooltip>

      <button onClick={connect} disabled={busy} style={{ width:"100%", marginTop:16, padding:13, borderRadius:8, background:"#f0b90b", color:"#04071a", border:"none", fontSize:".8rem", fontWeight:700, cursor:"pointer" }}>
        {busy ? "Vérification…" : "Connecter Binance"}
      </button>
      <div style={{ fontSize:".58rem", color:"var(--muted)", marginTop:10, lineHeight:1.5 }}>
        🔒 Conseil sécurité : sur Binance, créez une clé API avec <strong>« Activer le Spot Trading »</strong> mais <strong>« Retraits » DÉSACTIVÉS</strong>. Ainsi, même en cas de fuite, personne ne peut sortir vos fonds.
      </div>
    </div>
  );
}
