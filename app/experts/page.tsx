"use client";
import { useEffect, useState, useRef } from "react";
import Sidebar from "../components/Sidebar";

type Expert = { handle:string; name:string; role:string; emoji:string };
const EXPERTS: Expert[] = [
  { handle:"VitalikButerin", name:"Vitalik Buterin", role:"Cofondateur Ethereum", emoji:"⟠" },
  { handle:"cz_binance", name:"CZ", role:"Fondateur Binance", emoji:"🟡" },
  { handle:"saylor", name:"Michael Saylor", role:"MicroStrategy · BTC", emoji:"₿" },
  { handle:"elonmusk", name:"Elon Musk", role:"Tesla · DOGE", emoji:"🚀" },
  { handle:"brian_armstrong", name:"Brian Armstrong", role:"CEO Coinbase", emoji:"🔵" },
  { handle:"RaoulGMI", name:"Raoul Pal", role:"Real Vision · Macro", emoji:"📊" },
  { handle:"100trillionUSD", name:"PlanB", role:"Modèle Stock-to-Flow", emoji:"📈" },
  { handle:"APompliano", name:"Anthony Pompliano", role:"Investisseur crypto", emoji:"💼" },
  { handle:"novogratz", name:"Mike Novogratz", role:"Galaxy Digital", emoji:"🌌" },
  { handle:"CathieDWood", name:"Cathie Wood", role:"ARK Invest", emoji:"🎯" },
];

export default function ExpertsPage(){
  const [user,setUser]=useState<{role?:string}>({});
  const [sel,setSel]=useState<Expert>(EXPERTS[0]);
  const tlRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{ try{ setUser(JSON.parse(localStorage.getItem("aibed_user")||"{}")); }catch{} },[]);

  // Charge le script X (une seule fois)
  useEffect(()=>{
    if (!document.getElementById("twitter-wjs")) {
      const s=document.createElement("script"); s.id="twitter-wjs"; s.src="https://platform.twitter.com/widgets.js"; s.async=true;
      document.body.appendChild(s);
    }
  },[]);

  // Recharge la timeline quand on change d'expert
  useEffect(()=>{
    const el=tlRef.current; if(!el) return;
    el.innerHTML = `<a class="twitter-timeline" data-theme="dark" data-height="560" data-chrome="noheader nofooter transparent" href="https://twitter.com/${sel.handle}">Tweets de @${sel.handle}</a>`;
    const w=(window as unknown as { twttr?: { widgets?: { load?: (e?:HTMLElement)=>void } } }).twttr;
    if (w?.widgets?.load) w.widgets.load(el);
    else { const t=setInterval(()=>{ const ww=(window as unknown as { twttr?: { widgets?: { load?: (e?:HTMLElement)=>void } } }).twttr; if(ww?.widgets?.load){ ww.widgets.load(el!); clearInterval(t);} },400); return ()=>clearInterval(t); }
  },[sel]);

  const card:React.CSSProperties={ background:"rgba(6,13,46,0.6)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12 };

  return (
    <div className="dash-root" style={{ display:"grid", gridTemplateColumns:"210px 1fr", height:"100vh", background:"var(--navy)", overflow:"hidden" }}>
      <div className="cyber-grid" />
      <Sidebar founder={user.role==="founder"} />
      <div style={{ overflowY:"auto", padding:"78px 28px 40px", position:"relative", zIndex:1 }}>
        <h1 style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1.3rem", fontWeight:900, color:"white", marginBottom:6 }}>🎙️ Experts crypto & finance</h1>
        <p style={{ fontSize:".72rem", color:"var(--muted)", marginBottom:20 }}>Les publications X (Twitter) en direct des plus grandes voix de la crypto et de la finance mondiale.</p>

        <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:18, alignItems:"start" }}>
          {/* Liste experts */}
          <div style={{ ...card, padding:"8px 0", maxHeight:"calc(100vh - 200px)", overflowY:"auto" }}>
            {EXPERTS.map(e=>(
              <div key={e.handle} onClick={()=>setSel(e)} style={{ display:"flex", alignItems:"center", gap:11, padding:"11px 16px", cursor:"pointer", borderLeft:`2px solid ${sel.handle===e.handle?"var(--red)":"transparent"}`, background:sel.handle===e.handle?"rgba(192,57,43,0.08)":"transparent" }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:"rgba(10,26,92,0.5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", flexShrink:0 }}>{e.emoji}</div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:".76rem", color:"white", fontWeight:600 }}>{e.name}</div>
                  <div style={{ fontSize:".6rem", color:"var(--muted)" }}>@{e.handle} · {e.role}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div style={{ ...card, padding:"14px", minHeight:560 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ fontSize:".82rem", fontWeight:700, color:"white" }}>{sel.emoji} {sel.name} <span style={{ color:"var(--muted)", fontWeight:400, fontSize:".68rem" }}>@{sel.handle}</span></div>
              <a href={`https://twitter.com/${sel.handle}`} target="_blank" rel="noreferrer" style={{ fontSize:".66rem", color:"var(--blue)", textDecoration:"none" }}>Voir sur X ↗</a>
            </div>
            <div ref={tlRef} style={{ minHeight:520 }}>
              <div style={{ padding:"30px", textAlign:"center", color:"var(--muted)", fontSize:".74rem" }}>Chargement des publications de @{sel.handle}…</div>
            </div>
            <div style={{ fontSize:".58rem", color:"var(--muted)", marginTop:8 }}>💡 Si rien ne s&apos;affiche, X limite parfois l&apos;intégration — cliquez « Voir sur X » pour ouvrir le profil réel.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
