"use client";
import { useEffect, useState, useCallback } from "react";
import Tooltip from "./Tooltip";

type Status = {
  connected:boolean; auto:boolean; inPosition:boolean; symbol:string;
  qty:number; price:number; entryUsd:number; currentValue:number; pnlUsd:number; pnlPct:number;
};

export default function BotMonitor({ email }: { email?: string }) {
  const [st, setSt] = useState<Status|null>(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async (mail:string) => {
    try { const r = await fetch(`/api/bot/status?email=${encodeURIComponent(mail)}`); const d = await r.json(); if (!d.error) setSt(d); } catch {}
  }, []);

  // Rafraîchissement temps réel toutes les 4 s
  useEffect(()=>{
    if (!email) return;
    load(email);
    const id = setInterval(()=>load(email), 4000);
    return ()=>clearInterval(id);
  }, [email, load]);

  async function stopAuto(manual=false) {
    if (!email) return;
    setBusy("stop");
    await fetch("/api/bot/config", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email, bot_auto:false }) });
    setBusy(""); setMsg(manual ? "✋ Vous avez repris la main — le bot est en pause, à vous de jouer." : "🛑 Automatisme arrêté.");
    load(email); setTimeout(()=>setMsg(""), 5000);
  }
  async function sellNow() {
    if (!email) return;
    if (!confirm("Vendre toute la position maintenant au prix du marché ?")) return;
    setBusy("sell");
    const r = await fetch("/api/bot/close", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email }) });
    const d = await r.json();
    setBusy("");
    setMsg(d.ok ? `💰 Position vendue. Résultat ~${d.pnl>=0?"+":""}${(d.pnl||0).toFixed(2)} USDT` : ("⚠️ "+(d.error||"Échec")));
    load(email); setTimeout(()=>setMsg(""), 6000);
  }

  const card: React.CSSProperties = { background:"linear-gradient(135deg,rgba(6,13,46,0.8),rgba(10,26,92,0.3))", border:"1px solid rgba(10,26,92,0.6)", borderRadius:14, padding:"22px 24px", maxWidth:560 };
  const up = (st?.pnlPct ?? 0) >= 0;
  const pnlColor = up ? "var(--green)" : "var(--red)";
  const btn = (bg:string, brd:string): React.CSSProperties => ({ flex:1, minWidth:130, padding:"12px 14px", borderRadius:10, background:bg, border:`1px solid ${brd}`, color:"white", fontSize:".74rem", fontWeight:700, cursor:"pointer" });

  return (
    <div style={card}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontSize:".9rem", fontWeight:700, color:"white" }}>📊 Suivi temps réel</div>
        <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:".62rem", color: st?.auto?"var(--green)":"var(--muted)", fontWeight:600 }}>
          <span style={{ width:7, height:7, borderRadius:"50%", background:st?.auto?"var(--green)":"var(--muted)", animation:st?.auto?"pulse-red 1.5s infinite":"none" }}/>
          {st?.auto ? "Bot actif" : "Bot en pause"}
        </span>
      </div>

      {msg && <div style={{ background:"rgba(74,144,217,0.1)", border:"1px solid rgba(74,144,217,0.3)", borderRadius:8, padding:"9px 13px", fontSize:".7rem", color:"var(--text)", marginBottom:14 }}>{msg}</div>}

      {!st?.connected && <div style={{ fontSize:".74rem", color:"#fbbf24" }}>⚠️ Connectez Binance pour suivre votre bot.</div>}

      {st?.connected && !st.inPosition && (
        <div style={{ textAlign:"center", padding:"18px 0" }}>
          <div style={{ fontSize:"1.6rem", marginBottom:6 }}>⏳</div>
          <div style={{ fontSize:".8rem", color:"var(--text)", fontWeight:600 }}>Aucune position ouverte</div>
          <div style={{ fontSize:".66rem", color:"var(--muted)", marginTop:4 }}>Le bot attend un signal d&apos;achat. Dès qu&apos;il achète, votre P&amp;L s&apos;affichera ici en direct.</div>
        </div>
      )}

      {st?.connected && st.inPosition && (
        <>
          {/* P&L principal */}
          <div style={{ textAlign:"center", marginBottom:18 }}>
            <div style={{ fontSize:".62rem", color:"var(--muted2)", textTransform:"uppercase", letterSpacing:".08em" }}>Gain / Perte depuis l&apos;achat</div>
            <div style={{ fontSize:"2.2rem", fontWeight:900, color:pnlColor, fontFamily:"var(--font-orbitron,monospace)", margin:"4px 0" }}>{up?"+":""}{st.pnlPct.toFixed(2)}%</div>
            <div style={{ fontSize:"1rem", fontWeight:700, color:pnlColor }}>{up?"+":""}{st.pnlUsd.toFixed(2)} USDT</div>
          </div>

          {/* Détails position */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
            {[
              ["Crypto", st.symbol.replace(/USDT$/,"")],
              ["Quantité", st.qty.toLocaleString("fr-FR",{maximumFractionDigits:6})],
              ["Investi", `${st.entryUsd.toFixed(2)} USDT`],
              ["Valeur actuelle", `${st.currentValue.toFixed(2)} USDT`],
              ["Prix actuel", `$${st.price.toLocaleString("fr-FR",{maximumFractionDigits:2})}`],
              ["Prix d'achat", `$${st.qty>0?(st.entryUsd/st.qty).toLocaleString("fr-FR",{maximumFractionDigits:2}):"—"}`],
            ].map(([k,v])=>(
              <div key={k} style={{ background:"rgba(4,7,26,0.5)", borderRadius:8, padding:"9px 12px" }}>
                <div style={{ fontSize:".58rem", color:"var(--muted)" }}>{k}</div>
                <div style={{ fontSize:".82rem", color:"white", fontWeight:600 }}>{v}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Boutons de contrôle */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:6 }}>
        <Tooltip text="Arrête immédiatement le trading automatique. Le bot ne prendra plus aucune position.">
          <button onClick={()=>stopAuto(false)} disabled={busy==="stop"||!st?.auto} style={btn("var(--red)","var(--red)")}>🛑 STOP automatisme</button>
        </Tooltip>
        <Tooltip text="Désactive le bot et vous repassez en manuel : c'est vous qui décidez et tradez (via le Swap ou votre exchange).">
          <button onClick={()=>stopAuto(true)} disabled={busy==="stop"} style={btn("rgba(74,111,165,0.25)","rgba(74,111,165,0.4)")}>✋ Prendre la main</button>
        </Tooltip>
        {st?.inPosition && (
          <Tooltip text="Vend toute la position immédiatement au prix du marché et encaisse le résultat.">
            <button onClick={sellNow} disabled={busy==="sell"} style={btn("var(--green)","var(--green)")}>{busy==="sell"?"Vente…":"💰 Vendre maintenant"}</button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
