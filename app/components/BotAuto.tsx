"use client";
import { useEffect, useState, useCallback } from "react";

type Log = { symbol:string; signal:string; action:string; detail:string; created_at:string };
const SYMBOLS = ["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT","DOGEUSDT","ADAUSDT"];
const MODES = [["patient","Patient"],["actif","Actif"],["agressif","Agressif"]];

export default function BotAuto({ email }: { email?: string }) {
  const [cfg, setCfg] = useState({ bot_auto:false, bot_symbol:"BTCUSDT", bot_mode:"actif", bot_amount:15, connected:false, binance_testnet:true });
  const [logs, setLogs] = useState<Log[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (mail:string) => {
    const r = await fetch(`/api/bot/config?email=${encodeURIComponent(mail)}`);
    const d = await r.json();
    if (d.config) setCfg(c => ({ ...c, ...d.config }));
    setLogs(d.logs || []); setLoading(false);
  }, []);
  useEffect(()=>{ if (email) load(email); }, [email, load]);

  async function save(next?: Partial<typeof cfg>) {
    const merged = { ...cfg, ...next };
    setCfg(merged);
    await fetch("/api/bot/config", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email, ...merged }) });
    setSaved(true); setTimeout(()=>setSaved(false), 1500);
  }

  const card: React.CSSProperties = { background:"rgba(6,13,46,0.6)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"20px 22px" };
  const inp: React.CSSProperties = { background:"rgba(4,7,26,0.6)", border:"1px solid rgba(74,111,165,0.3)", borderRadius:8, padding:"9px 12px", color:"white", fontSize:".78rem", outline:"none" };

  if (loading) return <div style={card}>Chargement…</div>;

  return (
    <div style={{ ...card, maxWidth:560 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <div style={{ fontSize:".9rem", fontWeight:700, color:"white" }}>🤖 Trading automatique</div>
        {/* Toggle ON/OFF */}
        <div onClick={()=>cfg.connected && save({ bot_auto:!cfg.bot_auto })} style={{ display:"flex", alignItems:"center", gap:8, cursor:cfg.connected?"pointer":"not-allowed", opacity:cfg.connected?1:0.5 }}>
          <span style={{ fontSize:".66rem", fontWeight:700, color:cfg.bot_auto?"var(--green)":"var(--muted)" }}>{cfg.bot_auto?"ACTIVÉ":"DÉSACTIVÉ"}</span>
          <div style={{ width:38, height:20, borderRadius:10, background:cfg.bot_auto?"rgba(39,174,96,0.3)":"rgba(192,57,43,0.2)", border:`1px solid ${cfg.bot_auto?"rgba(39,174,96,0.5)":"rgba(192,57,43,0.3)"}`, position:"relative" }}>
            <div style={{ width:14, height:14, borderRadius:"50%", background:cfg.bot_auto?"var(--green)":"var(--red)", position:"absolute", top:2, left:cfg.bot_auto?20:2, transition:"left .2s" }}/>
          </div>
        </div>
      </div>

      {!cfg.connected && <div style={{ fontSize:".7rem", color:"#fbbf24", marginBottom:12 }}>⚠️ Connectez d&apos;abord votre compte Binance (ci-dessus) pour activer l&apos;automatique.</div>}
      {cfg.connected && <div style={{ fontSize:".66rem", color: cfg.binance_testnet?"#fbbf24":"var(--green)", marginBottom:12 }}>{cfg.binance_testnet?"⚠️ Mode TESTNET (argent fictif) — parfait pour valider.":"🔴 Mode RÉEL — argent réel."}</div>}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
        <div>
          <label style={{ fontSize:".62rem", color:"var(--muted2)", display:"block", marginBottom:5 }}>Paire</label>
          <select value={cfg.bot_symbol} onChange={e=>save({ bot_symbol:e.target.value })} style={{ ...inp, width:"100%" }}>
            {SYMBOLS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:".62rem", color:"var(--muted2)", display:"block", marginBottom:5 }}>Mode de risque</label>
          <select value={cfg.bot_mode} onChange={e=>save({ bot_mode:e.target.value })} style={{ ...inp, width:"100%" }}>
            {MODES.map(([id,lb])=><option key={id} value={id}>{lb}</option>)}
          </select>
        </div>
        <div style={{ gridColumn:"span 2" }}>
          <label style={{ fontSize:".62rem", color:"var(--muted2)", display:"block", marginBottom:5 }}>Montant par trade (USDT)</label>
          <input type="number" value={cfg.bot_amount} onChange={e=>setCfg(c=>({...c,bot_amount:Number(e.target.value)}))} onBlur={()=>save()} style={{ ...inp, width:"100%" }} />
        </div>
      </div>
      {saved && <div style={{ fontSize:".64rem", color:"var(--green)", marginBottom:10 }}>✓ Enregistré</div>}

      <div style={{ fontSize:".58rem", color:"var(--muted)", lineHeight:1.5, marginBottom:14 }}>
        Stratégie : RSI + Bandes de Bollinger sur bougies 15 min. Le bot achète en survente et vend en surachat, automatiquement. ⚠️ Le trading comporte un risque de perte.
      </div>

      {/* Journal */}
      <div style={{ fontSize:".66rem", fontWeight:700, color:"white", marginBottom:8 }}>📋 Journal du bot</div>
      {logs.length===0 && <div style={{ fontSize:".68rem", color:"var(--muted)" }}>Aucune action encore. Le bot agira au prochain signal.</div>}
      <div style={{ display:"grid", gap:5, maxHeight:200, overflowY:"auto" }}>
        {logs.map((l,i)=>(
          <div key={i} style={{ display:"flex", justifyContent:"space-between", gap:8, fontSize:".62rem", padding:"6px 8px", background:"rgba(4,7,26,0.4)", borderRadius:6 }}>
            <span style={{ color: l.signal==="BUY"?"var(--green)":l.signal==="SELL"?"var(--red)":"var(--muted2)", fontWeight:700, minWidth:46 }}>{l.signal}</span>
            <span style={{ flex:1, color:"var(--text)" }}>{l.action} <span style={{ color:"var(--muted)" }}>· {l.detail}</span></span>
            <span style={{ color:"var(--muted)", whiteSpace:"nowrap" }}>{new Date(l.created_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
