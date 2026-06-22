"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

const BOTS = [
  { avatar:"🐂", name:"Bot #1", mode:"ACTIF", pnl:+4.23, on:true, color:"#27ae60" },
  { avatar:"🦅", name:"Bot #2", mode:"PATIENT", pnl:+1.85, on:true, color:"#4a90d9" },
  { avatar:"🐉", name:"Bot #3", mode:"AGRESSIF", pnl:-2.10, on:false, color:"#c0392b" },
];

export default function MesBotsPage() {
  const [user, setUser] = useState<{role?:string;plan?:string}>({});
  useEffect(()=>{ try{ setUser(JSON.parse(localStorage.getItem("aibed_user")||"{}")); }catch{} },[]);
  const founder = user.role === "founder";
  const max = founder ? "∞" : user.plan==="elite" ? "∞" : user.plan==="pro" ? "3" : "1";
  const card: React.CSSProperties = { background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"20px 22px" };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"210px 1fr", height:"100vh", background:"var(--navy)", overflow:"hidden" }}>
      <div className="cyber-grid" />
      <Sidebar founder={founder} />
      <div style={{ overflowY:"auto", padding:"78px 28px 40px", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
          <h1 style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1.3rem", fontWeight:900, color:"white" }}>🤖 Mes bots</h1>
          <span style={{ fontSize:".7rem", color:"var(--muted2)" }}>{BOTS.length} / {max} bots actifs</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:16 }}>
          {BOTS.map((b,i)=>(
            <div key={i} style={card}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                <div style={{ width:48, height:48, borderRadius:"50%", background:"rgba(10,26,92,0.4)", border:`2px solid ${b.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.4rem" }}>{b.avatar}</div>
                <div><div style={{ fontSize:".85rem", fontWeight:700, color:"white" }}>{b.name}</div><div style={{ fontSize:".62rem", color:b.color, fontWeight:600 }}>Mode {b.mode}</div></div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:".72rem", marginBottom:10 }}>
                <span style={{ color:"var(--muted)" }}>PnL 24h</span>
                <span style={{ color:b.pnl>0?"var(--green)":"var(--red)", fontWeight:700 }}>{b.pnl>0?"+":""}{b.pnl}%</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:b.on?"var(--green)":"var(--red)" }}/>
                <span style={{ fontSize:".66rem", color:b.on?"var(--green)":"var(--red)", fontWeight:600 }}>{b.on?"En ligne":"En pause"}</span>
              </div>
            </div>
          ))}
          <div style={{ ...card, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8, cursor:"pointer", border:"1px dashed rgba(74,111,165,0.3)", minHeight:140 }}>
            <div style={{ fontSize:"1.8rem" }}>＋</div>
            <div style={{ fontSize:".72rem", color:"var(--muted2)" }}>Créer un nouveau bot</div>
          </div>
        </div>
      </div>
    </div>
  );
}
