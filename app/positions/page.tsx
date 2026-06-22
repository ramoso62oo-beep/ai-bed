"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

const POSITIONS = [
  { sym:"BTCUSDT", side:"LONG", mode:"PATIENT", entry:64125, current:64310, pnl:+0.29 },
  { sym:"TNSRUSDT", side:"LONG", mode:"ACTIF", entry:.0436, current:.0441, pnl:+1.15 },
  { sym:"RESOLVUSDT", side:"SHORT", mode:"AGRESSIF", entry:.0249, current:.0244, pnl:-2.01 },
  { sym:"STRAXUSDT", side:"LONG", mode:"ACTIF", entry:.01084, current:.01091, pnl:+0.65 },
];
const MODE_COLOR: Record<string,string> = { PATIENT:"#4a90d9", ACTIF:"#27ae60", AGRESSIF:"#c0392b" };

export default function PositionsPage() {
  const [user, setUser] = useState<{role?:string}>({});
  useEffect(()=>{ try{ setUser(JSON.parse(localStorage.getItem("aibed_user")||"{}")); }catch{} },[]);
  const card: React.CSSProperties = { background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"8px 0", overflow:"hidden" };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"210px 1fr", height:"100vh", background:"var(--navy)", overflow:"hidden" }}>
      <div className="cyber-grid" />
      <Sidebar founder={user.role==="founder"} />
      <div style={{ overflowY:"auto", padding:"78px 28px 40px", position:"relative", zIndex:1 }}>
        <h1 style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1.3rem", fontWeight:900, color:"white", marginBottom:22 }}>📈 Positions ouvertes</h1>
        <div style={card}>
          <div style={{ display:"grid", gridTemplateColumns:"1.4fr .8fr 1fr 1fr 1fr .8fr .8fr", padding:"12px 20px", fontSize:".6rem", color:"var(--muted)", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid rgba(10,26,92,0.5)" }}>
            <span>Paire</span><span>Sens</span><span>Mode</span><span>Entrée</span><span>Actuel</span><span>PnL</span><span></span>
          </div>
          {POSITIONS.map((p,i)=>(
            <div key={i} style={{ display:"grid", gridTemplateColumns:"1.4fr .8fr 1fr 1fr 1fr .8fr .8fr", padding:"13px 20px", fontSize:".74rem", alignItems:"center", borderBottom:i<POSITIONS.length-1?"1px solid rgba(10,26,92,0.3)":"none" }}>
              <span style={{ color:"white", fontWeight:600 }}>{p.sym}</span>
              <span style={{ color:p.side==="LONG"?"var(--green)":"var(--red)", fontWeight:700, fontSize:".64rem" }}>{p.side}</span>
              <span style={{ color:MODE_COLOR[p.mode], fontSize:".62rem", fontWeight:600 }}>{p.mode}</span>
              <span style={{ color:"var(--muted2)" }}>{p.entry}</span>
              <span style={{ color:"white" }}>{p.current}</span>
              <span style={{ color:p.pnl>0?"var(--green)":"var(--red)", fontWeight:700 }}>{p.pnl>0?"+":""}{p.pnl}%</span>
              <button style={{ padding:"5px 10px", borderRadius:6, background:"rgba(192,57,43,0.1)", border:"1px solid rgba(192,57,43,0.3)", color:"var(--red)", fontSize:".62rem", cursor:"pointer" }}>Fermer</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
