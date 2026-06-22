"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ConnectWallet from "../components/ConnectWallet";
import Tooltip from "../components/Tooltip";

export default function PortefeuillePage() {
  const [user, setUser] = useState<{email?:string;role?:string;plan?:string}>({});
  useEffect(()=>{ try{ setUser(JSON.parse(localStorage.getItem("aibed_user")||"{}")); }catch{} },[]);
  const founder = user.role === "founder";
  const card: React.CSSProperties = { background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"20px 22px" };

  return (
    <div className="dash-root" style={{ display:"grid", gridTemplateColumns:"210px 1fr", height:"100vh", background:"var(--navy)", overflow:"hidden" }}>
      <div className="cyber-grid" />
      <Sidebar founder={founder} />
      <div style={{ overflowY:"auto", padding:"78px 28px 40px", position:"relative", zIndex:1 }}>
        <h1 style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1.3rem", fontWeight:900, color:"white", marginBottom:6 }}>💼 Portefeuille</h1>
        <p style={{ fontSize:".72rem", color:"var(--muted)", marginBottom:22 }}>Connectez votre propre wallet crypto. Vous gardez le contrôle total de vos fonds — AI-BED ne les détient jamais.</p>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, alignItems:"start" }}>
          <ConnectWallet email={user.email} />

          <div style={{ display:"grid", gap:16 }}>
            {/* Abonnement */}
            <div style={card}>
              <div style={{ fontSize:".7rem", fontWeight:700, color:"white", textTransform:"uppercase", letterSpacing:".08em", marginBottom:12 }}>Mon abonnement</div>
              <div style={{ fontSize:"1rem", fontWeight:700, color:"var(--red)", textTransform:"uppercase" }}>{founder ? "ELITE 👑" : (user.plan||"—")}</div>
              <div style={{ fontSize:".66rem", color:"var(--muted)", marginTop:3 }}>{founder ? "Accès fondateur gratuit à vie" : "Renouvellement automatique mensuel"}</div>
            </div>

            {/* Sécurité / info */}
            <div style={card}>
              <Tooltip text="Non-custodial = vos cryptos restent dans VOTRE wallet. Vous seul pouvez les déplacer. C'est le standard des plateformes DeFi.">
                <div style={{ fontSize:".7rem", fontWeight:700, color:"white", textTransform:"uppercase", letterSpacing:".08em", marginBottom:12, cursor:"help" }}>🔒 Sécurité ⓘ</div>
              </Tooltip>
              <ul style={{ fontSize:".7rem", color:"var(--muted2)", lineHeight:1.9, paddingLeft:18, margin:0 }}>
                <li>Vos fonds restent dans votre wallet</li>
                <li>AI-BED ne peut jamais y toucher</li>
                <li>Chaque transfert est signé par vous</li>
                <li>Compatible MetaMask & wallets EVM</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
