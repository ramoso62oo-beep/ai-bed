"use client";
import { useEffect, useRef, useState } from "react";

type Whale = { id:number; icon:string; sym:string; desc:string; val:string; pos:boolean; ts:number };

const SYMBOLS = ["BTC","ETH","SOL","PEPE","ARB","LINK","DOGE","SHIB","AVAX","OP","BNB","XRP","ADA","WIF","BONK","RNDR"];
const ACTIONS = [
  (s:string,a:string)=>`${a} de ${rand(50,900)}M USDT sur Binance`,
  (s:string)=>`Whale achète ${rand(1,9)}B tokens ${s}`,
  (s:string)=>`${rand(20,300)}M déplacés vers cold wallet`,
  (s:string)=>`Achat massif CEX → DEX`,
  (s:string)=>`Déblocage de ${rand(10,120)}M tokens`,
  (s:string)=>`Accumulation institutionnelle détectée`,
  (s:string)=>`Transfert de ${rand(5,80)}M vers exchange`,
  (s:string)=>`Retrait de ${rand(10,200)}M depuis Coinbase`,
];
function rand(a:number,b:number){ return Math.floor(a+Math.random()*(b-a)); }
function pick<T>(arr:T[]){ return arr[Math.floor(Math.random()*arr.length)]; }

function gen(id:number): Whale {
  const sym = pick(SYMBOLS);
  const pos = Math.random() > 0.45;
  const a = pos ? "Entrée" : "Sortie";
  return { id, icon: pos?"🟢":"🔴", sym, desc: pick(ACTIONS)(sym,a), val: `${pos?"+":"-"}${(Math.random()*20).toFixed(1)}%`, pos, ts: Date.now() };
}

function ago(ts:number){ const s=Math.floor((Date.now()-ts)/1000); if(s<60)return `${s}s`; const m=Math.floor(s/60); if(m<60)return `${m}min`; return `${Math.floor(m/60)}h`; }

export default function WhaleFeed({ max=18, compact=false }: { max?:number; compact?:boolean }) {
  const idRef = useRef(0);
  const [items, setItems] = useState<Whale[]>([]);
  const [, force] = useState(0);

  useEffect(() => {
    // Seed initial
    const seed = Array.from({length: Math.min(max,10)}, () => { const w = gen(idRef.current++); w.ts = Date.now() - rand(5, 1800)*1000; return w; });
    setItems(seed.sort((a,b)=>b.ts-a.ts));
    // Nouvelle baleine toutes les 4–8s
    const add = setInterval(() => {
      setItems(prev => [gen(idRef.current++), ...prev].slice(0, max));
    }, rand(4000,8000));
    // Rafraîchir les horodatages
    const refresh = setInterval(() => force(x=>x+1), 1000);
    return () => { clearInterval(add); clearInterval(refresh); };
  }, [max]);

  if (compact) {
    return (
      <div style={{ padding:"10px 12px", display:"flex", flexDirection:"column", gap:6 }}>
        {items.slice(0,6).map(w=>(
          <div key={w.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 8px", background:"rgba(4,7,26,0.4)", borderRadius:6, border:"1px solid rgba(10,26,92,0.6)", animation:"fadeUp .4s" }}>
            <span style={{ fontSize:".85rem" }}>{w.icon}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:".65rem", fontWeight:700, color:"white" }}>{w.sym} <span style={{ color:"var(--muted)", fontWeight:400 }}>· {ago(w.ts)}</span></div>
              <div style={{ fontSize:".58rem", color:"var(--muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{w.desc}</div>
            </div>
            <span style={{ fontSize:".65rem", fontWeight:700, color:w.pos?"var(--green)":"var(--red)" }}>{w.val}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"6px 0" }}>
      {items.map((w,i)=>(
        <div key={w.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 20px", borderBottom:i<items.length-1?"1px solid rgba(10,26,92,0.3)":"none", animation:i===0?"fadeUp .4s":"none" }}>
          <span style={{ fontSize:"1.3rem" }}>{w.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:".8rem", color:"white", fontWeight:600 }}>{w.sym}</div>
            <div style={{ fontSize:".66rem", color:"var(--muted)" }}>{w.desc}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:".8rem", fontWeight:700, color:w.pos?"var(--green)":"var(--red)" }}>{w.val}</div>
            <div style={{ fontSize:".6rem", color:"var(--muted)" }}>il y a {ago(w.ts)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
