"use client";
import { useEffect, useState } from "react";

type News = { id:string|number; title:string; url:string; source:string; ts:number; tags:string[] };
function ago(ts:number){ const s=Math.floor((Date.now()-ts)/1000); if(s<60)return `${s}s`; const m=Math.floor(s/60); if(m<60)return `${m}min`; const h=Math.floor(m/60); if(h<24)return `${h}h`; return `${Math.floor(h/24)}j`; }

export default function NewsFeed({ max=14, compact=false }: { max?:number; compact?:boolean }) {
  const [items, setItems] = useState<News[]>([]);
  const [, force] = useState(0);

  useEffect(() => {
    const load = () => fetch("/api/news").then(r=>r.json()).then(d=>{ if(d.news?.length) setItems(d.news); }).catch(()=>{});
    load();
    const refresh = setInterval(load, 120000);
    const tick = setInterval(()=>force(x=>x+1), 30000);
    return () => { clearInterval(refresh); clearInterval(tick); };
  }, []);

  const list = items.slice(0, compact ? 7 : max);

  if (compact) {
    return (
      <div style={{ padding:"10px 12px", display:"flex", flexDirection:"column", gap:6 }}>
        {list.length===0 && <div style={{ fontSize:".64rem", color:"var(--muted)" }}>Chargement des actualités…</div>}
        {list.map(n=>(
          <a key={n.id} href={n.url} target="_blank" rel="noreferrer" style={{ padding:"7px 9px", background:"rgba(4,7,26,0.4)", borderRadius:6, border:"1px solid rgba(10,26,92,0.6)", textDecoration:"none", display:"block" }}>
            <div style={{ fontSize:".64rem", color:"var(--text)", fontWeight:500, lineHeight:1.4, marginBottom:3, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as const }}>{n.title}</div>
            <div style={{ display:"flex", gap:8, fontSize:".56rem" }}><span style={{ color:"var(--red)" }}>{n.source}</span><span style={{ color:"var(--muted)" }}>il y a {ago(n.ts)}</span></div>
          </a>
        ))}
      </div>
    );
  }

  return (
    <div style={{ background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"6px 0" }}>
      {list.length===0 && <div style={{ padding:"20px", textAlign:"center", color:"var(--muted)", fontSize:".76rem" }}>Chargement des actualités réelles…</div>}
      {list.map(n=>(
        <a key={n.id} href={n.url} target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", gap:14, padding:"15px 20px", borderBottom:"1px solid rgba(10,26,92,0.3)", textDecoration:"none" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:".82rem", color:"white", marginBottom:5, lineHeight:1.4 }}>{n.title}</div>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <span style={{ fontSize:".58rem", color:"var(--red)", fontWeight:700 }}>{n.source}</span>
              {n.tags.map(t=><span key={t} style={{ fontSize:".55rem", color:"var(--muted2)" }}>#{t}</span>)}
              <span style={{ fontSize:".58rem", color:"var(--muted)" }}>il y a {ago(n.ts)}</span>
            </div>
          </div>
          <span style={{ color:"var(--blue)", fontSize:".7rem" }}>↗</span>
        </a>
      ))}
    </div>
  );
}
