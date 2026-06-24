"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

type Sig = { symbol:string; signal:string; confidence:number; reason:string; rsi:number; price:number };
const ACT_COLOR: Record<string,string> = { BUY:"#27ae60", SELL:"#c0392b", HOLD:"#fbbf24" };
const ACT_LABEL: Record<string,string> = { BUY:"ACHAT", SELL:"VENTE", HOLD:"ATTENTE" };

export default function SignauxPage() {
  const [user, setUser] = useState<{role?:string}>({});
  const [signals, setSignals] = useState<Sig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ try{ setUser(JSON.parse(localStorage.getItem("aibed_user")||"{}")); }catch{} },[]);
  useEffect(()=>{
    const load = () => fetch("/api/signals").then(r=>r.json()).then(d=>{ setSignals(d.signals||[]); setLoading(false); }).catch(()=>setLoading(false));
    load(); const id = setInterval(load, 60000); return ()=>clearInterval(id);
  },[]);

  const card: React.CSSProperties = { background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"16px 20px" };

  return (
    <div className="dash-root" style={{ display:"grid", gridTemplateColumns:"210px 1fr", height:"100vh", background:"var(--navy)", overflow:"hidden" }}>
      <div className="cyber-grid" />
      <Sidebar founder={user.role==="founder"} />
      <div style={{ overflowY:"auto", padding:"78px 28px 40px", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
          <h1 style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1.3rem", fontWeight:900, color:"white" }}>⚡ Signaux IA</h1>
          <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:".62rem", color:"var(--green)", fontWeight:600 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"var(--green)", animation:"pulse-red 1.5s infinite" }}/> En direct
          </span>
        </div>
        <p style={{ fontSize:".72rem", color:"var(--muted)", marginBottom:22 }}>Signaux générés en temps réel par notre stratégie multi-indicateurs (EMA + RSI + MACD + Bollinger + ATR + volume) sur les vraies données du marché.</p>

        {loading && <div style={{ color:"var(--muted)", fontSize:".8rem" }}>Analyse du marché en cours…</div>}
        <div style={{ display:"grid", gap:14 }}>
          {signals.map(s=>(
            <div key={s.symbol} style={{ ...card, display:"flex", alignItems:"center", gap:18, flexWrap:"wrap" }}>
              <div style={{ minWidth:84 }}>
                <div style={{ fontSize:".9rem", fontWeight:700, color:"white" }}>{s.symbol}</div>
                <span style={{ fontSize:".62rem", fontWeight:700, color:ACT_COLOR[s.signal] }}>{ACT_LABEL[s.signal]}</span>
              </div>
              <div style={{ minWidth:90 }}>
                <div style={{ fontSize:".72rem", color:"white", fontWeight:600 }}>${s.price.toLocaleString("fr-FR",{maximumFractionDigits:s.price<1?6:2})}</div>
                <div style={{ fontSize:".58rem", color:"var(--muted)" }}>RSI {s.rsi}</div>
              </div>
              <div style={{ flex:1, minWidth:160 }}>
                <div style={{ fontSize:".72rem", color:"var(--text)" }}>{s.reason}</div>
              </div>
              <div style={{ textAlign:"center", minWidth:70 }}>
                <div style={{ fontSize:"1.1rem", fontWeight:900, color:s.confidence>=60?ACT_COLOR[s.signal]:"var(--muted2)", fontFamily:"var(--font-orbitron,monospace)" }}>{s.confidence}%</div>
                <div style={{ fontSize:".55rem", color:"var(--muted)", textTransform:"uppercase", letterSpacing:".06em" }}>Confiance</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
