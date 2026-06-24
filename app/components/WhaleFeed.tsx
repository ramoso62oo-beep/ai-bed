"use client";
import { useEffect, useState } from "react";

type Mover = { symbol:string; name:string; image:string; ch24h:number; ch1h:number|null; vol:number; price:number };
function fmt(n:number){ if(n>=1e9)return(n/1e9).toFixed(1)+"Md"; if(n>=1e6)return(n/1e6).toFixed(0)+"M"; if(n>=1e3)return(n/1e3).toFixed(0)+"k"; return String(Math.round(n)); }

export default function WhaleFeed({ max=18, compact=false }: { max?:number; compact?:boolean }) {
  const [items, setItems] = useState<Mover[]>([]);

  useEffect(() => {
    const load = () => fetch("/api/market?type=crypto").then(r=>r.json()).then(d=>{
      const coins: Mover[] = (d.coins||[]).filter((c:Mover)=>c.vol>2_000_000 && c.ch24h!=null);
      // Tri par ampleur du mouvement (gros mouvements = activité whale probable)
      coins.sort((a,b)=>Math.abs(b.ch24h)-Math.abs(a.ch24h));
      setItems(coins.slice(0, max));
    }).catch(()=>{});
    load();
    const id = setInterval(load, 45000);
    return () => clearInterval(id);
  }, [max]);

  const list = items.slice(0, compact ? 6 : max);
  const label = (m:Mover) => m.ch24h>=0 ? `Forte hausse · vol ${fmt(m.vol)}$` : `Forte baisse · vol ${fmt(m.vol)}$`;

  if (compact) {
    return (
      <div style={{ padding:"10px 12px", display:"flex", flexDirection:"column", gap:6 }}>
        {list.length===0 && <div style={{ fontSize:".64rem", color:"var(--muted)" }}>Chargement…</div>}
        {list.map(w=>(
          <div key={w.symbol} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 8px", background:"rgba(4,7,26,0.4)", borderRadius:6, border:"1px solid rgba(10,26,92,0.6)" }}>
            <span style={{ fontSize:".85rem" }}>{w.ch24h>=0?"🟢":"🔴"}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:".65rem", fontWeight:700, color:"white" }}>{w.symbol}</div>
              <div style={{ fontSize:".56rem", color:"var(--muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label(w)}</div>
            </div>
            <span style={{ fontSize:".65rem", fontWeight:700, color:w.ch24h>=0?"var(--green)":"var(--red)" }}>{w.ch24h>=0?"+":""}{w.ch24h.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"6px 0" }}>
      {list.length===0 && <div style={{ padding:"20px", textAlign:"center", color:"var(--muted)", fontSize:".76rem" }}>Chargement des mouvements réels…</div>}
      {list.map(w=>(
        <div key={w.symbol} style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 20px", borderBottom:"1px solid rgba(10,26,92,0.3)" }}>
          <span style={{ fontSize:"1.3rem" }}>{w.ch24h>=0?"🟢":"🔴"}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:".8rem", color:"white", fontWeight:600 }}>{w.symbol} <span style={{ color:"var(--muted)", fontWeight:400, fontSize:".64rem" }}>{w.name}</span></div>
            <div style={{ fontSize:".66rem", color:"var(--muted)" }}>{label(w)} · ${w.price<1?w.price.toFixed(6):w.price.toLocaleString("fr-FR",{maximumFractionDigits:2})}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:".8rem", fontWeight:700, color:w.ch24h>=0?"var(--green)":"var(--red)" }}>{w.ch24h>=0?"+":""}{w.ch24h.toFixed(1)}%</div>
            <div style={{ fontSize:".6rem", color:"var(--muted)" }}>24h</div>
          </div>
        </div>
      ))}
    </div>
  );
}
