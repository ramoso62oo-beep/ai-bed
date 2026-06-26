"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import Tooltip from "../components/Tooltip";

type Status = {
  connected:boolean; auto:boolean; inPosition:boolean; symbol:string; mode:string; testnet:boolean;
  qty:number; price:number; entryPrice:number; entryUsd:number; currentValue:number; pnlUsd:number; pnlPct:number; sl:number; tp:number;
};
const MODE_COLOR: Record<string,string> = { patient:"#4a90d9", actif:"#27ae60", agressif:"#c0392b" };

export default function PositionsPage() {
  const [user, setUser] = useState<{email?:string;role?:string}>({});
  const [st, setSt] = useState<Status|null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(()=>{ try{ setUser(JSON.parse(localStorage.getItem("aibed_user")||"{}")); }catch{} },[]);

  const load = useCallback(async (email:string)=>{
    try { const d = await fetch(`/api/bot/status?email=${encodeURIComponent(email)}`).then(r=>r.json()); if(!d.error) setSt(d); } catch {}
    setLoading(false);
  },[]);
  useEffect(()=>{
    if(!user.email) return;
    load(user.email);
    const id = setInterval(()=>load(user.email!), 6000);
    return ()=>clearInterval(id);
  },[user.email,load]);

  async function sellNow(){
    if(!user.email) return;
    if(!confirm("Vendre toute la position maintenant au prix du marché ?")) return;
    setBusy(true);
    const r = await fetch("/api/bot/close",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email:user.email }) });
    const d = await r.json(); setBusy(false);
    setMsg(d.ok ? `💰 Position vendue · résultat ~${d.pnl>=0?"+":""}${(d.pnl||0).toFixed(2)} USDT` : ("⚠️ "+(d.error||"Échec")));
    load(user.email); setTimeout(()=>setMsg(""),6000);
  }

  const card:React.CSSProperties={ background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12 };
  const up = (st?.pnlPct ?? 0) >= 0;
  const fmt=(n:number,d=2)=>n.toLocaleString("fr-FR",{maximumFractionDigits:d});
  // Progression entre stop-loss et take-profit
  const range = st && st.tp>st.sl ? st.tp - st.sl : 0;
  const posInRange = st && range>0 ? Math.min(100,Math.max(0,((st.price - st.sl)/range)*100)) : 50;

  return (
    <div className="dash-root" style={{ display:"grid", gridTemplateColumns:"210px 1fr", height:"100vh", background:"var(--navy)", overflow:"hidden" }}>
      <div className="cyber-grid" />
      <Sidebar founder={user.role==="founder"} />
      <div style={{ overflowY:"auto", padding:"78px 28px 40px", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
          <h1 style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1.3rem", fontWeight:900, color:"white" }}>📈 Mes positions</h1>
          {st?.connected && <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:".62rem", color:"var(--green)", fontWeight:600 }}><span style={{ width:7, height:7, borderRadius:"50%", background:"var(--green)", animation:"pulse-red 1.5s infinite" }}/> Temps réel{st.testnet?" · testnet":""}</span>}
        </div>
        <p style={{ fontSize:".72rem", color:"var(--muted)", marginBottom:22 }}>Suivi en direct de votre position réelle ouverte par le bot, avec tous les détails.</p>

        {msg && <div style={{ ...card, padding:"11px 16px", marginBottom:16, fontSize:".74rem", color:"var(--text)" }}>{msg}</div>}

        {loading && <div style={{ color:"var(--muted)", fontSize:".8rem" }}>Chargement…</div>}

        {!loading && !st?.connected && (
          <div style={{ ...card, padding:"30px", textAlign:"center", maxWidth:480 }}>
            <div style={{ fontSize:"1.8rem", marginBottom:8 }}>🔌</div>
            <div style={{ fontSize:".84rem", color:"white", fontWeight:700, marginBottom:6 }}>Compte non connecté</div>
            <div style={{ fontSize:".7rem", color:"var(--muted)", marginBottom:14 }}>Connectez votre plateforme dans Mes bots pour suivre vos positions réelles.</div>
            <Link href="/mes-bots" style={{ display:"inline-block", padding:"9px 18px", borderRadius:8, background:"var(--red)", color:"white", textDecoration:"none", fontWeight:700, fontSize:".74rem" }}>Connecter →</Link>
          </div>
        )}

        {!loading && st?.connected && !st.inPosition && (
          <div style={{ ...card, padding:"30px", textAlign:"center", maxWidth:480 }}>
            <div style={{ fontSize:"1.8rem", marginBottom:8 }}>⏳</div>
            <div style={{ fontSize:".84rem", color:"white", fontWeight:700, marginBottom:6 }}>Aucune position ouverte</div>
            <div style={{ fontSize:".7rem", color:"var(--muted)" }}>{st.auto ? "Le bot est actif et attend un signal d'achat. Votre position apparaîtra ici dès qu'il achètera." : "Activez le trading automatique dans Mes bots pour que le bot ouvre des positions."}</div>
          </div>
        )}

        {!loading && st?.connected && st.inPosition && (
          <div style={{ display:"grid", gap:16, maxWidth:640 }}>
            {/* Carte principale */}
            <div style={{ ...card, padding:"22px 24px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:10 }}>
                <div>
                  <div style={{ fontSize:"1.1rem", fontWeight:800, color:"white" }}>{st.symbol.replace(/USDT$/,"")}<span style={{ fontSize:".7rem", color:"var(--muted)" }}>/USDT</span> <span style={{ fontSize:".58rem", padding:"2px 7px", borderRadius:4, background:"rgba(39,174,96,0.15)", color:"var(--green)", fontWeight:700 }}>LONG</span></div>
                  <div style={{ fontSize:".62rem", marginTop:4 }}><span style={{ padding:"2px 7px", borderRadius:4, background:`${MODE_COLOR[st.mode]}18`, color:MODE_COLOR[st.mode], fontWeight:700, textTransform:"uppercase" }}>{st.mode}</span> <span style={{ color:"var(--muted)" }}>· bot automatique</span></div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:"1.8rem", fontWeight:900, color:up?"var(--green)":"var(--red)", fontFamily:"var(--font-orbitron,monospace)" }}>{up?"+":""}{fmt(st.pnlPct)}%</div>
                  <div style={{ fontSize:".82rem", fontWeight:700, color:up?"var(--green)":"var(--red)" }}>{up?"+":""}{fmt(st.pnlUsd)} USDT</div>
                </div>
              </div>

              {/* Détails */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                {[
                  ["Quantité", `${fmt(st.qty,6)} ${st.symbol.replace(/USDT$/,"")}`],
                  ["Prix d'achat", `$${fmt(st.entryPrice)}`],
                  ["Prix actuel", `$${fmt(st.price)}`],
                  ["Investi", `${fmt(st.entryUsd)} USDT`],
                  ["Valeur actuelle", `${fmt(st.currentValue)} USDT`],
                  ["Variation prix", `${st.entryPrice>0?((st.price-st.entryPrice)/st.entryPrice*100>=0?"+":"")+fmt((st.price-st.entryPrice)/st.entryPrice*100):"—"}%`],
                ].map(([k,v])=>(
                  <div key={k} style={{ background:"rgba(4,7,26,0.5)", borderRadius:8, padding:"9px 11px" }}>
                    <div style={{ fontSize:".56rem", color:"var(--muted)" }}>{k}</div>
                    <div style={{ fontSize:".8rem", color:"white", fontWeight:600 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stop-loss / Take-profit */}
            <div style={{ ...card, padding:"18px 22px" }}>
              <div style={{ fontSize:".7rem", fontWeight:700, color:"white", textTransform:"uppercase", letterSpacing:".06em", marginBottom:14 }}>🛡️ Gestion du risque</div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:".66rem", marginBottom:6 }}>
                <span style={{ color:"var(--red)" }}>🛑 Stop ${st.sl>0?fmt(st.sl):"—"}</span>
                <span style={{ color:"var(--muted2)" }}>Prix ${fmt(st.price)}</span>
                <span style={{ color:"var(--green)" }}>🎯 Objectif ${st.tp>0?fmt(st.tp):"—"}</span>
              </div>
              {/* Barre de progression */}
              <div style={{ height:8, borderRadius:4, background:"linear-gradient(90deg,rgba(192,57,43,0.4),rgba(251,191,36,0.3),rgba(39,174,96,0.4))", position:"relative" }}>
                <div style={{ position:"absolute", left:`${posInRange}%`, top:-3, width:3, height:14, background:"white", borderRadius:2, transform:"translateX(-50%)" }}/>
              </div>
              <div style={{ fontSize:".58rem", color:"var(--muted)", marginTop:8 }}>Le stop-loss remonte automatiquement (trailing stop) quand le prix monte, pour sécuriser vos gains.</div>
            </div>

            {/* Actions */}
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              <Tooltip text="Vend toute la position immédiatement au prix du marché et encaisse le résultat.">
                <button onClick={sellNow} disabled={busy} style={{ flex:1, minWidth:160, padding:13, borderRadius:10, background:"var(--green)", border:"none", color:"white", fontSize:".78rem", fontWeight:700, cursor:"pointer" }}>{busy?"Vente…":"💰 Vendre maintenant"}</button>
              </Tooltip>
              <Link href="/mes-bots" style={{ flex:1, minWidth:160, padding:13, borderRadius:10, background:"transparent", border:"1px solid rgba(74,111,165,0.3)", color:"var(--text)", fontSize:".78rem", fontWeight:700, cursor:"pointer", textAlign:"center", textDecoration:"none" }}>⚙️ Gérer le bot</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
