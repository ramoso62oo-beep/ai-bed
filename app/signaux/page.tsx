"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

const SIGNALS = [
  { sym:"BTC", action:"ACHAT", conf:92, reason:"RSI survendu + rebond support 64k + volume", mode:"PATIENT", time:"3 min" },
  { sym:"PEPE", action:"ACHAT", conf:87, reason:"Breakout résistance + whale accumulation", mode:"AGRESSIF", time:"11 min" },
  { sym:"ETH", action:"ATTENTE", conf:64, reason:"Consolidation, attente de confirmation", mode:"ACTIF", time:"19 min" },
  { sym:"SOL", action:"ACHAT", conf:79, reason:"Tendance haussière + flux CEX→DEX positif", mode:"ACTIF", time:"27 min" },
  { sym:"RESOLV", action:"VENTE", conf:71, reason:"Divergence baissière RSI + perte de momentum", mode:"AGRESSIF", time:"44 min" },
];
const ACT_COLOR: Record<string,string> = { ACHAT:"#27ae60", VENTE:"#c0392b", ATTENTE:"#fbbf24" };

export default function SignauxPage() {
  const [user, setUser] = useState<{role?:string}>({});
  useEffect(()=>{ try{ setUser(JSON.parse(localStorage.getItem("aibed_user")||"{}")); }catch{} },[]);
  const card: React.CSSProperties = { background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"16px 20px" };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"210px 1fr", height:"100vh", background:"var(--navy)", overflow:"hidden" }}>
      <div className="cyber-grid" />
      <Sidebar founder={user.role==="founder"} />
      <div style={{ overflowY:"auto", padding:"78px 28px 40px", position:"relative", zIndex:1 }}>
        <h1 style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1.3rem", fontWeight:900, color:"white", marginBottom:6 }}>⚡ Signaux IA</h1>
        <p style={{ fontSize:".72rem", color:"var(--muted)", marginBottom:22 }}>Recommandations générées par l&apos;intelligence artificielle en analysant le marché en continu.</p>
        <div style={{ display:"grid", gap:14 }}>
          {SIGNALS.map((s,i)=>(
            <div key={i} style={{ ...card, display:"flex", alignItems:"center", gap:18 }}>
              <div style={{ minWidth:70 }}>
                <div style={{ fontSize:".9rem", fontWeight:700, color:"white" }}>{s.sym}</div>
                <span style={{ fontSize:".62rem", fontWeight:700, color:ACT_COLOR[s.action] }}>{s.action}</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:".74rem", color:"var(--text)" }}>{s.reason}</div>
                <div style={{ fontSize:".6rem", color:"var(--muted)", marginTop:3 }}>Mode {s.mode} • il y a {s.time}</div>
              </div>
              <div style={{ textAlign:"center", minWidth:70 }}>
                <div style={{ fontSize:"1.1rem", fontWeight:900, color:s.conf>80?"var(--green)":s.conf>65?"#fbbf24":"var(--muted2)", fontFamily:"var(--font-orbitron,monospace)" }}>{s.conf}%</div>
                <div style={{ fontSize:".55rem", color:"var(--muted)", textTransform:"uppercase", letterSpacing:".06em" }}>Confiance</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
