"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

const NEWS = [
  { title:"La SEC approuve 3 nouveaux ETF Bitcoin spot", tag:"BTC", time:"12 min", impact:"haussier" },
  { title:"Binance annonce le listing de 5 nouveaux memecoins", tag:"ALTCOINS", time:"28 min", impact:"haussier" },
  { title:"Elon Musk tweete sur DOGE — pump de 8% en cours", tag:"DOGE", time:"45 min", impact:"haussier" },
  { title:"MiCA : nouvelles règles européennes entrent en vigueur", tag:"RÉGULATION", time:"1h", impact:"neutre" },
  { title:"Solana dépasse 200$ — ATH historique approche", tag:"SOL", time:"2h", impact:"haussier" },
  { title:"La Fed maintient ses taux — marchés crypto en hausse", tag:"MACRO", time:"3h", impact:"haussier" },
  { title:"Piratage d'un pont cross-chain : 40M$ dérobés", tag:"SÉCURITÉ", time:"5h", impact:"baissier" },
];
const IMPACT: Record<string,string> = { haussier:"var(--green)", baissier:"var(--red)", neutre:"var(--muted2)" };

export default function ActualitesPage() {
  const [user, setUser] = useState<{role?:string}>({});
  useEffect(()=>{ try{ setUser(JSON.parse(localStorage.getItem("aibed_user")||"{}")); }catch{} },[]);
  const card: React.CSSProperties = { background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"6px 0" };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"210px 1fr", height:"100vh", background:"var(--navy)", overflow:"hidden" }}>
      <div className="cyber-grid" />
      <Sidebar founder={user.role==="founder"} />
      <div style={{ overflowY:"auto", padding:"78px 28px 40px", position:"relative", zIndex:1 }}>
        <h1 style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1.3rem", fontWeight:900, color:"white", marginBottom:6 }}>📰 Actualités IA</h1>
        <p style={{ fontSize:".72rem", color:"var(--muted)", marginBottom:22 }}>Flux d&apos;actualités crypto analysé par l&apos;IA, avec impact estimé sur le marché.</p>
        <div style={card}>
          {NEWS.map((n,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"15px 20px", borderBottom:i<NEWS.length-1?"1px solid rgba(10,26,92,0.3)":"none" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:".82rem", color:"white", marginBottom:5 }}>{n.title}</div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:".58rem", color:"var(--red)", fontWeight:700, letterSpacing:".06em" }}>{n.tag}</span>
                  <span style={{ fontSize:".58rem", color:"var(--muted)" }}>il y a {n.time}</span>
                  <span style={{ fontSize:".58rem", color:IMPACT[n.impact], fontWeight:600 }}>● {n.impact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
