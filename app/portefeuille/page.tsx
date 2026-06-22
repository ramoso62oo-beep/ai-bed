"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

const TX = [
  { date:"21 juin 2026", desc:"Profit position BTCUSDT", amount:+185.40, type:"in" },
  { date:"20 juin 2026", desc:"Profit position SOLUSDT", amount:+92.10, type:"in" },
  { date:"19 juin 2026", desc:"Perte position RESOLVUSDT", amount:-48.30, type:"out" },
  { date:"18 juin 2026", desc:"Dépôt initial", amount:+9500.00, type:"in" },
  { date:"18 juin 2026", desc:"Abonnement Pro", amount:-29.90, type:"out" },
];

export default function PortefeuillePage() {
  const [user, setUser] = useState<{email?:string;role?:string;plan?:string}>({});
  useEffect(()=>{ try{ setUser(JSON.parse(localStorage.getItem("aibed_user")||"{}")); }catch{} },[]);
  const founder = user.role === "founder";

  const card: React.CSSProperties = { background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"20px 22px" };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"210px 1fr", height:"100vh", background:"var(--navy)", overflow:"hidden" }}>
      <div className="cyber-grid" />
      <Sidebar founder={founder} />
      <div style={{ overflowY:"auto", padding:"78px 28px 40px", position:"relative", zIndex:1 }}>
        <h1 style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1.3rem", fontWeight:900, color:"white", marginBottom:22 }}>💼 Portefeuille</h1>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:20 }}>
          <div style={{ ...card, gridColumn:"span 1" }}>
            <div style={{ fontSize:".62rem", color:"var(--muted2)", textTransform:"uppercase", letterSpacing:".08em" }}>Solde total</div>
            <div style={{ fontSize:"1.8rem", fontWeight:900, color:"white", margin:"6px 0", fontFamily:"var(--font-orbitron,monospace)" }}>9 811,18 $</div>
            <div style={{ fontSize:".66rem", color:"var(--green)" }}>+3,18% depuis le départ</div>
          </div>
          <div style={card}>
            <div style={{ fontSize:".62rem", color:"var(--muted2)", textTransform:"uppercase", letterSpacing:".08em" }}>Disponible</div>
            <div style={{ fontSize:"1.4rem", fontWeight:700, color:"var(--blue)", margin:"6px 0" }}>4 250,00 $</div>
            <div style={{ fontSize:".66rem", color:"var(--muted)" }}>Prêt à investir</div>
          </div>
          <div style={card}>
            <div style={{ fontSize:".62rem", color:"var(--muted2)", textTransform:"uppercase", letterSpacing:".08em" }}>Investi</div>
            <div style={{ fontSize:"1.4rem", fontWeight:700, color:"#fbbf24", margin:"6px 0" }}>5 561,18 $</div>
            <div style={{ fontSize:".66rem", color:"var(--muted)" }}>4 positions ouvertes</div>
          </div>
        </div>

        <div style={{ display:"flex", gap:12, marginBottom:24 }}>
          <button style={{ padding:"12px 24px", borderRadius:8, background:"var(--red)", color:"white", border:"none", fontSize:".78rem", fontWeight:700, cursor:"pointer", boxShadow:"0 0 20px var(--red-glow)" }}>+ Déposer des fonds</button>
          <button style={{ padding:"12px 24px", borderRadius:8, background:"transparent", color:"var(--text)", border:"1px solid rgba(74,111,165,0.3)", fontSize:".78rem", fontWeight:600, cursor:"pointer" }}>↗ Retirer</button>
        </div>

        {/* Abonnement */}
        <div style={{ ...card, marginBottom:20 }}>
          <div style={{ fontSize:".72rem", fontWeight:700, color:"white", textTransform:"uppercase", letterSpacing:".08em", marginBottom:14 }}>Mon abonnement</div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:"1rem", fontWeight:700, color:"var(--red)", textTransform:"uppercase" }}>{founder ? "ELITE 👑" : (user.plan||"—")}</div>
              <div style={{ fontSize:".66rem", color:"var(--muted)", marginTop:3 }}>{founder ? "Accès fondateur gratuit à vie" : "Renouvellement automatique mensuel"}</div>
            </div>
            {!founder && <button style={{ padding:"9px 18px", borderRadius:7, background:"transparent", border:"1px solid rgba(74,111,165,0.3)", color:"var(--text)", fontSize:".72rem", cursor:"pointer" }}>Gérer</button>}
          </div>
        </div>

        {/* Transactions */}
        <div style={card}>
          <div style={{ fontSize:".72rem", fontWeight:700, color:"white", textTransform:"uppercase", letterSpacing:".08em", marginBottom:8 }}>Historique des transactions</div>
          {TX.map((t,i)=>(
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom:i<TX.length-1?"1px solid rgba(10,26,92,0.4)":"none" }}>
              <div><div style={{ fontSize:".76rem", color:"white" }}>{t.desc}</div><div style={{ fontSize:".62rem", color:"var(--muted)", marginTop:2 }}>{t.date}</div></div>
              <div style={{ fontSize:".82rem", fontWeight:700, color:t.type==="in"?"var(--green)":"var(--red)" }}>{t.amount>0?"+":""}{t.amount.toFixed(2)} $</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
