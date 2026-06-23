"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export type TradeToken = { id:string; symbol:string; name:string; image?:string; price?:number };
type Bot = { id:number; avatar:string; name:string; mode:string; on:boolean };
const MODE_LIST: [string,string][] = [["Patient","#4a90d9"],["Actif","#27ae60"],["Agressif","#c0392b"]];

export default function AssignBotModal({ token, onClose, onAssigned }: { token: TradeToken; onClose: ()=>void; onAssigned?: (txt:string)=>void }) {
  const [bots, setBots] = useState<Bot[]>([]);
  const [botId, setBotId] = useState<number|null>(null);
  const [mode, setMode] = useState("Actif");
  const [done, setDone] = useState("");

  useEffect(()=>{
    try { const b: Bot[] = JSON.parse(localStorage.getItem("aibed_bots")||"[]"); setBots(b);
      if (b.length){ setBotId(b[0].id); setMode((b[0].mode||"ACTIF").charAt(0)+ (b[0].mode||"ACTIF").slice(1).toLowerCase()); }
    } catch {}
  },[]);

  function confirm(){
    if (botId===null) return;
    const bot = bots.find(b=>b.id===botId);
    try {
      const a = JSON.parse(localStorage.getItem("aibed_assigned")||"{}");
      a[token.id] = { bot: bot?.name || "Bot", botId, mode };
      localStorage.setItem("aibed_assigned", JSON.stringify(a));
    } catch {}
    setDone(`${token.symbol} confié à ${bot?.name} en mode ${mode}`);
    onAssigned?.(`${token.symbol} → ${bot?.name} (${mode})`);
    setTimeout(onClose, 1100);
  }

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"rgba(6,13,46,0.98)", border:"1px solid rgba(74,111,165,0.3)", borderRadius:14, padding:24, width:"100%", maxWidth:380, maxHeight:"86vh", overflowY:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          {token.image && <Image src={token.image} alt="" width={36} height={36} style={{ borderRadius:"50%" }} unoptimized />}
          <div><div style={{ fontSize:"1rem", fontWeight:700, color:"white" }}>{token.symbol}</div><div style={{ fontSize:".64rem", color:"var(--muted)" }}>{token.name}{token.price?` · $${token.price<1?token.price.toFixed(6):token.price.toLocaleString("fr-FR",{maximumFractionDigits:2})}`:""}</div></div>
        </div>

        {done ? (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <div style={{ fontSize:"1.8rem", marginBottom:8 }}>✅</div>
            <div style={{ fontSize:".82rem", color:"var(--green)", fontWeight:700 }}>{done}</div>
          </div>
        ) : bots.length===0 ? (
          <div style={{ textAlign:"center", padding:"14px 0" }}>
            <div style={{ fontSize:"1.6rem", marginBottom:8 }}>🤖</div>
            <div style={{ fontSize:".8rem", color:"white", fontWeight:600, marginBottom:6 }}>Vous n&apos;avez pas encore de bot</div>
            <div style={{ fontSize:".68rem", color:"var(--muted)", marginBottom:14 }}>Créez d&apos;abord un bot pour pouvoir lui confier des cryptos.</div>
            <Link href="/mes-bots" style={{ display:"inline-block", padding:"9px 18px", borderRadius:8, background:"var(--red)", color:"white", textDecoration:"none", fontWeight:700, fontSize:".74rem" }}>Créer un bot →</Link>
          </div>
        ) : (
          <>
            <div style={{ fontSize:".66rem", color:"var(--muted2)", marginBottom:8, fontWeight:600 }}>1 · Choisissez le bot</div>
            <div style={{ display:"grid", gap:7, marginBottom:16 }}>
              {bots.map(b=>(
                <div key={b.id} onClick={()=>setBotId(b.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:9, cursor:"pointer", border:`1px solid ${botId===b.id?"var(--red)":"rgba(10,26,92,0.6)"}`, background:botId===b.id?"rgba(192,57,43,0.08)":"transparent" }}>
                  <div style={{ width:34, height:34, borderRadius:"50%", background:"rgba(10,26,92,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem" }}>{b.avatar}</div>
                  <div style={{ flex:1 }}><div style={{ fontSize:".78rem", color:"white", fontWeight:600 }}>{b.name}</div><div style={{ fontSize:".58rem", color:"var(--muted)" }}>Mode {b.mode} · {b.on?"en ligne":"en pause"}</div></div>
                  {botId===b.id && <span style={{ color:"var(--red)", fontSize:".9rem" }}>✓</span>}
                </div>
              ))}
            </div>

            <div style={{ fontSize:".66rem", color:"var(--muted2)", marginBottom:8, fontWeight:600 }}>2 · Niveau de risque pour ce trade</div>
            <div style={{ display:"flex", gap:7, marginBottom:18 }}>
              {MODE_LIST.map(([lb,c])=>(
                <button key={lb} onClick={()=>setMode(lb)} style={{ flex:1, padding:"9px 0", borderRadius:8, cursor:"pointer", fontSize:".68rem", fontWeight:700, border:`1px solid ${c}`, background:mode===lb?c:"transparent", color:mode===lb?"white":c }}>{lb}</button>
              ))}
            </div>

            <button onClick={confirm} style={{ width:"100%", padding:12, borderRadius:10, background:"var(--red)", border:"none", color:"white", fontSize:".8rem", fontWeight:700, cursor:"pointer", boxShadow:"0 0 16px var(--red-glow)" }}>
              🤖 Confier {token.symbol} à ce bot
            </button>
          </>
        )}
        {!done && <button onClick={onClose} style={{ width:"100%", marginTop:9, padding:9, borderRadius:8, background:"transparent", border:"1px solid rgba(74,111,165,0.3)", color:"var(--muted2)", fontSize:".72rem", cursor:"pointer" }}>Annuler</button>}
      </div>
    </div>
  );
}
