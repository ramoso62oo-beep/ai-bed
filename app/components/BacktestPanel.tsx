"use client";
import { useState } from "react";

type Result = { symbol:string; mode:string; trades:number; wins:number; winRate:number; totalReturn:number; maxDrawdown:number; buyHold:number; error?:string };
const SYMBOLS = ["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT","DOGEUSDT"];
const MODES = [["patient","Patient"],["actif","Actif"],["agressif","Agressif"]];
const INTERVALS = [["15m","15 min"],["1h","1 heure"],["4h","4 heures"]];

export default function BacktestPanel() {
  const [symbol,setSymbol]=useState("BTCUSDT");
  const [mode,setMode]=useState("actif");
  const [interval,setInterval]=useState("15m");
  const [res,setRes]=useState<Result|null>(null);
  const [busy,setBusy]=useState(false);

  async function run(){
    setBusy(true); setRes(null);
    try{ const d=await fetch(`/api/backtest?symbol=${symbol}&mode=${mode}&interval=${interval}`).then(r=>r.json()); setRes(d); }catch{ setRes({error:"Échec"} as Result); }
    setBusy(false);
  }

  const card:React.CSSProperties={ background:"rgba(6,13,46,0.6)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"20px 22px", maxWidth:560 };
  const sel:React.CSSProperties={ background:"rgba(4,7,26,0.6)", border:"1px solid rgba(74,111,165,0.3)", borderRadius:8, padding:"9px 12px", color:"white", fontSize:".76rem", outline:"none", width:"100%" };

  return (
    <div style={card}>
      <div style={{ fontSize:".9rem", fontWeight:700, color:"white", marginBottom:4 }}>🔬 Backtest de la stratégie</div>
      <div style={{ fontSize:".66rem", color:"var(--muted)", marginBottom:14 }}>Testez la stratégie sur l&apos;historique réel du marché avant d&apos;engager du vrai argent. Capital simulé : 1000 USDT.</div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14 }}>
        <select value={symbol} onChange={e=>setSymbol(e.target.value)} style={sel}>{SYMBOLS.map(s=><option key={s} value={s}>{s}</option>)}</select>
        <select value={mode} onChange={e=>setMode(e.target.value)} style={sel}>{MODES.map(([id,l])=><option key={id} value={id}>{l}</option>)}</select>
        <select value={interval} onChange={e=>setInterval(e.target.value)} style={sel}>{INTERVALS.map(([id,l])=><option key={id} value={id}>{l}</option>)}</select>
      </div>

      <button onClick={run} disabled={busy} style={{ width:"100%", padding:11, borderRadius:8, background:"var(--blue)", color:"white", border:"none", fontSize:".78rem", fontWeight:700, cursor:"pointer", marginBottom:14 }}>
        {busy?"Analyse de l'historique…":"Lancer le backtest"}
      </button>

      {res?.error && <div style={{ fontSize:".7rem", color:"var(--red)" }}>⚠️ {res.error}</div>}
      {res && !res.error && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            ["Rendement stratégie", `${res.totalReturn>=0?"+":""}${res.totalReturn.toFixed(1)}%`, res.totalReturn>=0?"var(--green)":"var(--red)"],
            ["Buy & Hold (comparaison)", `${res.buyHold>=0?"+":""}${res.buyHold.toFixed(1)}%`, "var(--muted2)"],
            ["Trades", `${res.trades}`, "white"],
            ["Taux de réussite", `${res.winRate.toFixed(0)}%`, res.winRate>=50?"var(--green)":"#fbbf24"],
            ["Perte max (drawdown)", `-${res.maxDrawdown.toFixed(1)}%`, "var(--red)"],
            ["Verdict", res.totalReturn>res.buyHold?"Bat le marché ✓":"À optimiser", res.totalReturn>res.buyHold?"var(--green)":"#fbbf24"],
          ].map(([k,v,c])=>(
            <div key={k as string} style={{ background:"rgba(4,7,26,0.5)", borderRadius:8, padding:"10px 12px" }}>
              <div style={{ fontSize:".58rem", color:"var(--muted)" }}>{k}</div>
              <div style={{ fontSize:".95rem", fontWeight:700, color:c as string }}>{v}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize:".56rem", color:"var(--muted)", marginTop:10 }}>ℹ️ Le backtest est indicatif (frais et slippage non inclus). Les performances passées ne garantissent pas les résultats futurs.</div>
    </div>
  );
}
