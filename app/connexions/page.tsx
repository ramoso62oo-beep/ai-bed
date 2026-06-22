"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Tooltip from "../components/Tooltip";
import ConnectExchange from "../components/ConnectExchange";
import ConnectWallet from "../components/ConnectWallet";
import { useAccess } from "../components/Access";
import Link from "next/link";

const MODES = [
  { id:"manuel", icon:"✋", title:"Manuel", desc:"Vous passez vos ordres vous-même. Le bot vous donne les infos, vous décidez et exécutez.", color:"#4a90d9" },
  { id:"signaux", icon:"📡", title:"Signaux (semi-auto)", desc:"Le bot analyse et vous envoie des signaux d'achat/vente. Vous validez d'un clic.", color:"#fbbf24" },
  { id:"auto", icon:"🤖", title:"Automatique", desc:"Le bot trade tout seul 24/7 selon votre stratégie et votre niveau de risque.", color:"#27ae60" },
];

const EXCHANGES = [
  { id:"binance", name:"Binance", emoji:"🟡", ready:true },
  { id:"bybit", name:"Bybit", emoji:"🟠", ready:true },
  { id:"okx", name:"OKX", emoji:"⚫", ready:true },
  { id:"kucoin", name:"KuCoin", emoji:"🟢", ready:true },
  { id:"kraken", name:"Kraken", emoji:"🟣", ready:true },
  { id:"coinbase", name:"Coinbase", emoji:"🔵", ready:false },
];

export default function ConnexionsPage() {
  const access = useAccess();
  const [user, setUser] = useState<{email?:string;role?:string}>({});
  const [mode, setMode] = useState("signaux");
  const [way, setWay] = useState<"cex"|"wallet">("cex");
  const [exchange, setExchange] = useState("binance");

  useEffect(()=>{
    try{ setUser(JSON.parse(localStorage.getItem("aibed_user")||"{}")); }catch{}
    setMode(localStorage.getItem("aibed_mode")||"signaux");
    setWay((localStorage.getItem("aibed_way") as "cex"|"wallet")||"cex");
    setExchange(localStorage.getItem("aibed_exchange")||"binance");
  },[]);

  function pickMode(m:string){ setMode(m); localStorage.setItem("aibed_mode", m); }
  function pickWay(w:"cex"|"wallet"){ setWay(w); localStorage.setItem("aibed_way", w); }
  function pickExchange(e:string){ setExchange(e); localStorage.setItem("aibed_exchange", e); }

  const card: React.CSSProperties = { background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"20px 22px" };
  const sectionTitle: React.CSSProperties = { fontSize:".8rem", fontWeight:700, color:"white", textTransform:"uppercase", letterSpacing:".08em", margin:"28px 0 14px" };

  return (
    <div className="dash-root" style={{ display:"grid", gridTemplateColumns:"210px 1fr", height:"100vh", background:"var(--navy)", overflow:"hidden" }}>
      <div className="cyber-grid" />
      <Sidebar founder={user.role==="founder"} />
      <div style={{ overflowY:"auto", padding:"78px 28px 60px", position:"relative", zIndex:1 }}>
        <h1 style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1.3rem", fontWeight:900, color:"white", marginBottom:6 }}>🔌 Connexions & Méthodes</h1>
        <p style={{ fontSize:".72rem", color:"var(--muted)", marginBottom:8, maxWidth:640 }}>Choisissez comment vous voulez trader : votre plateforme d&apos;échange, votre wallet, en manuel ou en automatique. Vous gardez le contrôle total de vos fonds.</p>

        {/* 1. MODE */}
        <div style={sectionTitle}>1 · Mode de fonctionnement</div>
        <div className="dash-kpis" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
          {MODES.map(m=>(
            <div key={m.id} className="lift-3d" onClick={()=>pickMode(m.id)} style={{ ...card, cursor:"pointer", border:`1px solid ${mode===m.id?m.color:"rgba(10,26,92,0.6)"}`, background: mode===m.id?`${m.color}14`:"rgba(6,13,46,0.6)" }}>
              <div style={{ fontSize:"1.6rem", marginBottom:8 }}>{m.icon}</div>
              <div style={{ fontSize:".85rem", fontWeight:700, color:mode===m.id?m.color:"white", marginBottom:6 }}>{m.title}{mode===m.id?" ✓":""}</div>
              <div style={{ fontSize:".68rem", color:"var(--muted)", lineHeight:1.5 }}>{m.desc}</div>
            </div>
          ))}
        </div>

        {(mode==="auto"||mode==="signaux") && access.ready && !access.paid && (
          <div style={{ marginTop:12, padding:"11px 16px", borderRadius:10, background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.3)", fontSize:".7rem", color:"#fbbf24", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            ⭐ <span>Le mode {mode==="auto"?"Automatique":"Signaux"} (bots) nécessite un abonnement. En gratuit, vous gardez le mode Manuel et le trading de base.</span>
            <Link href="/register?plan=starter" style={{ padding:"5px 12px", borderRadius:7, background:"#fbbf24", color:"#04071a", textDecoration:"none", fontWeight:700, fontSize:".66rem" }}>S&apos;abonner</Link>
          </div>
        )}

        {/* 2. VOIE */}
        <div style={sectionTitle}>2 · Où trader ?</div>
        <div style={{ display:"flex", gap:12, marginBottom:6, flexWrap:"wrap" }}>
          <Tooltip text="Le bot trade sur votre compte d'échange (Binance, Bybit…) via vos clés API. Idéal pour l'automatique.">
            <button onClick={()=>pickWay("cex")} style={{ padding:"12px 22px", borderRadius:10, cursor:"pointer", fontSize:".78rem", fontWeight:700, border:`1px solid ${way==="cex"?"var(--red)":"rgba(74,111,165,0.3)"}`, background:way==="cex"?"rgba(192,57,43,0.12)":"transparent", color:way==="cex"?"white":"var(--muted2)" }}>🏦 Plateforme d&apos;échange</button>
          </Tooltip>
          <Tooltip text="Trade on-chain directement depuis votre wallet (MetaMask). 100% non-custodial, vous signez chaque opération.">
            <button onClick={()=>pickWay("wallet")} style={{ padding:"12px 22px", borderRadius:10, cursor:"pointer", fontSize:".78rem", fontWeight:700, border:`1px solid ${way==="wallet"?"var(--red)":"rgba(74,111,165,0.3)"}`, background:way==="wallet"?"rgba(192,57,43,0.12)":"transparent", color:way==="wallet"?"white":"var(--muted2)" }}>⛓️ Mon wallet (DEX)</button>
          </Tooltip>
        </div>

        {/* 3a. CEX */}
        {way==="cex" && <>
          <div style={sectionTitle}>3 · Choisissez votre plateforme</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:12, marginBottom:18, maxWidth:680 }}>
            {EXCHANGES.map(ex=>(
              <div key={ex.id} onClick={()=>pickExchange(ex.id)} style={{ ...card, padding:"16px", cursor:"pointer", textAlign:"center", position:"relative", border:`1px solid ${exchange===ex.id?"var(--red)":"rgba(10,26,92,0.6)"}`, background:exchange===ex.id?"rgba(192,57,43,0.08)":"rgba(6,13,46,0.6)" }}>
                <div style={{ fontSize:"1.6rem", marginBottom:6 }}>{ex.emoji}</div>
                <div style={{ fontSize:".78rem", fontWeight:700, color:"white" }}>{ex.name}</div>
                <div style={{ fontSize:".56rem", marginTop:4, color: ex.ready?"var(--green)":"var(--muted)" }}>{ex.ready?"● Disponible":"Bientôt"}</div>
              </div>
            ))}
          </div>
          {EXCHANGES.find(e=>e.id===exchange)?.ready
            ? <div style={{ maxWidth:520 }}><ConnectExchange email={user.email} exchange={exchange} /></div>
            : <div style={{ ...card, maxWidth:520 }}>
                <div style={{ fontSize:".8rem", fontWeight:700, color:"white", marginBottom:6 }}>{EXCHANGES.find(e=>e.id===exchange)?.name} — bientôt</div>
                <div style={{ fontSize:".7rem", color:"var(--muted)", lineHeight:1.5 }}>Cette plateforme sera bientôt connectable. Votre choix est enregistré. En attendant, Binance, Bybit, OKX, KuCoin et Kraken sont disponibles.</div>
              </div>
          }
        </>}

        {/* 3b. WALLET */}
        {way==="wallet" && <>
          <div style={sectionTitle}>3 · Connectez votre wallet</div>
          <div style={{ maxWidth:520 }}><ConnectWallet email={user.email} /></div>
        </>}
      </div>
    </div>
  );
}
