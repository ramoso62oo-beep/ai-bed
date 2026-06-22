"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

const WHALES = [
  { icon:"🐋", sym:"BTC", desc:"500M USDT sortis de Binance", val:"-1.2%", pos:false, time:"2 min" },
  { icon:"🟢", sym:"PEPE", desc:"Whale achète 2B tokens (~18M$)", val:"+18%", pos:true, time:"9 min" },
  { icon:"🔴", sym:"ETH", desc:"120M déplacés vers cold wallet", val:"-0.8%", pos:false, time:"15 min" },
  { icon:"🟢", sym:"SOL", desc:"Achat massif CEX → DEX", val:"+3.4%", pos:true, time:"23 min" },
  { icon:"🐋", sym:"ARB", desc:"Déblocage de 92M tokens", val:"-4.1%", pos:false, time:"38 min" },
  { icon:"🟢", sym:"LINK", desc:"Accumulation institutionnelle détectée", val:"+6.2%", pos:true, time:"51 min" },
];

export default function WhaleTrackerPage() {
  const [user, setUser] = useState<{role?:string}>({});
  useEffect(()=>{ try{ setUser(JSON.parse(localStorage.getItem("aibed_user")||"{}")); }catch{} },[]);
  const card: React.CSSProperties = { background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"6px 0" };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"210px 1fr", height:"100vh", background:"var(--navy)", overflow:"hidden" }}>
      <div className="cyber-grid" />
      <Sidebar founder={user.role==="founder"} />
      <div style={{ overflowY:"auto", padding:"78px 28px 40px", position:"relative", zIndex:1 }}>
        <h1 style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1.3rem", fontWeight:900, color:"white", marginBottom:6 }}>🐋 Whale Tracker</h1>
        <p style={{ fontSize:".72rem", color:"var(--muted)", marginBottom:22 }}>Mouvements de fonds importants détectés en temps réel sur la blockchain.</p>
        <div style={card}>
          {WHALES.map((w,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 20px", borderBottom:i<WHALES.length-1?"1px solid rgba(10,26,92,0.3)":"none" }}>
              <span style={{ fontSize:"1.3rem" }}>{w.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:".8rem", color:"white", fontWeight:600 }}>{w.sym}</div>
                <div style={{ fontSize:".66rem", color:"var(--muted)" }}>{w.desc}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:".8rem", fontWeight:700, color:w.pos?"var(--green)":"var(--red)" }}>{w.val}</div>
                <div style={{ fontSize:".6rem", color:"var(--muted)" }}>il y a {w.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
