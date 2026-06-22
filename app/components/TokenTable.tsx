"use client";
import { useEffect, useRef, useState } from "react";

type Token = {
  icon: string; sym: string; name: string; age: string;
  price: number; mc: string; vol: string; liq: string; holders: number;
  ch1h: number; ch24h: number;
  lpBurned: boolean; mintRenounced: boolean; risk: "low" | "med" | "high";
  spark: number[];
};

const BASE: Token[] = [
  { icon:"🐂", sym:"AIBED", name:"AI-BED Token", age:"2j", price:0.0842, mc:"8.4M", vol:"1.2M", liq:"420K", holders:3120, ch1h:+2.1, ch24h:+18.4, lpBurned:true, mintRenounced:true, risk:"low", spark:[5,6,5.5,7,8,7.5,9,11] },
  { icon:"🐸", sym:"PEPE2", name:"Pepe 2.0", age:"4h", price:0.0000132, mc:"2.1M", vol:"890K", liq:"180K", holders:1842, ch1h:+12.4, ch24h:+64.2, lpBurned:true, mintRenounced:true, risk:"low", spark:[3,4,3.5,5,6,8,7,10] },
  { icon:"🚀", sym:"MOON", name:"MoonShot", age:"38min", price:0.00214, mc:"640K", vol:"410K", liq:"92K", holders:512, ch1h:+45.1, ch24h:+45.1, lpBurned:false, mintRenounced:true, risk:"med", spark:[2,3,2,4,3,6,5,9] },
  { icon:"💎", sym:"GEM", name:"DiamondHands", age:"1j", price:1.284, mc:"12.8M", vol:"3.1M", liq:"1.1M", holders:8210, ch1h:-1.2, ch24h:+8.9, lpBurned:true, mintRenounced:true, risk:"low", spark:[8,7,9,8,10,9,11,10] },
  { icon:"🔥", sym:"BURN", name:"BurnFi", age:"12min", price:0.0000841, mc:"210K", vol:"320K", liq:"38K", holders:198, ch1h:-22.4, ch24h:-22.4, lpBurned:false, mintRenounced:false, risk:"high", spark:[10,9,8,7,5,6,4,3] },
  { icon:"⚡", sym:"VOLT", name:"VoltChain", age:"6h", price:0.0421, mc:"4.2M", vol:"1.8M", liq:"560K", holders:2940, ch1h:+5.6, ch24h:+31.2, lpBurned:true, mintRenounced:true, risk:"low", spark:[4,5,4.5,6,7,6.5,8,9] },
  { icon:"🌊", sym:"WAVE", name:"WaveProtocol", age:"3j", price:0.612, mc:"18.4M", vol:"2.4M", liq:"2.1M", holders:11200, ch1h:+0.8, ch24h:-3.2, lpBurned:true, mintRenounced:true, risk:"low", spark:[9,10,9,8,9,8,7,8] },
  { icon:"🎯", sym:"SNIPE", name:"SniperBot", age:"22min", price:0.00521, mc:"520K", vol:"680K", liq:"71K", holders:421, ch1h:+88.2, ch24h:+88.2, lpBurned:false, mintRenounced:true, risk:"med", spark:[2,2,3,4,5,7,9,12] },
];

const TABS = ["🔥 Trending","🆕 Nouveaux","📈 Gainers"];
const RISK = { low:{c:"#27ae60",l:"Sûr"}, med:{c:"#fbbf24",l:"Moyen"}, high:{c:"#c0392b",l:"Risqué"} };

function Spark({ data, up }: { data:number[]; up:boolean }) {
  const w=58, h=20, max=Math.max(...data), min=Math.min(...data), range=max-min||1;
  const pts = data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/range)*h}`).join(" ");
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={up?"#27ae60":"#c0392b"} strokeWidth="1.5"/></svg>;
}

export default function TokenTable() {
  const [tab, setTab] = useState(0);
  const [tokens, setTokens] = useState(BASE);
  const [trade, setTrade] = useState<Token|null>(null);
  const [assigned, setAssigned] = useState<string[]>([]);
  const flash = useRef<Record<string,string>>({});

  // Mise à jour des prix en temps réel
  useEffect(() => {
    const id = setInterval(() => {
      setTokens(prev => prev.map(t => {
        const delta = (Math.random()-0.48) * t.price * 0.015;
        const np = Math.max(t.price + delta, t.price*0.5);
        flash.current[t.sym] = delta>=0 ? "#27ae60" : "#c0392b";
        return { ...t, price:np, ch1h:+(t.ch1h + (Math.random()-0.5)*0.4).toFixed(1) };
      }));
    }, 1500);
    return () => clearInterval(id);
  }, []);

  let view = [...tokens];
  if (tab===1) view.sort((a,b)=>parseAge(a.age)-parseAge(b.age));
  if (tab===2) view.sort((a,b)=>b.ch24h-a.ch24h);

  const fmt = (p:number) => p<0.001 ? p.toExponential(2) : p.toLocaleString("fr-FR",{maximumFractionDigits:4});

  return (
    <div style={{ background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, overflow:"hidden" }}>
      {/* Header + tabs */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 18px", borderBottom:"1px solid rgba(10,26,92,0.5)" }}>
        <div style={{ display:"flex", gap:6 }}>
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)} style={{ padding:"6px 13px", borderRadius:7, fontSize:".68rem", fontWeight:700, cursor:"pointer", border:"none",
              background:tab===i?"rgba(192,57,43,0.15)":"transparent", color:tab===i?"var(--red)":"var(--muted2)" }}>{t}</button>
          ))}
        </div>
        <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:".6rem", color:"var(--muted)" }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--green)", animation:"pulse-red 1.5s infinite" }}/> Temps réel
        </span>
      </div>

      {/* Column headers */}
      <div style={{ display:"grid", gridTemplateColumns:"1.8fr 1fr .9fr .9fr .8fr .7fr 1.1fr .7fr .7fr", padding:"9px 18px", fontSize:".56rem", color:"var(--muted)", textTransform:"uppercase", letterSpacing:".05em", borderBottom:"1px solid rgba(10,26,92,0.4)" }}>
        <span>Token</span><span>Prix</span><span>MCap</span><span>Volume</span><span>Liq.</span><span>Holders</span><span>1h / 24h</span><span>Sécurité</span><span></span>
      </div>

      {/* Rows */}
      {view.map((t)=>{
        const fc = flash.current[t.sym];
        return (
          <div key={t.sym} style={{ display:"grid", gridTemplateColumns:"1.8fr 1fr .9fr .9fr .8fr .7fr 1.1fr .7fr .7fr", padding:"11px 18px", fontSize:".72rem", alignItems:"center", borderBottom:"1px solid rgba(10,26,92,0.22)" }}>
            {/* Token */}
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <span style={{ fontSize:"1.1rem" }}>{t.icon}</span>
              <div><div style={{ color:"white", fontWeight:600, lineHeight:1.1 }}>{t.sym}</div>
                <div style={{ fontSize:".56rem", color:"var(--muted)" }}>{t.name} · {t.age}</div></div>
            </div>
            <span style={{ color:fc||"white", fontWeight:600, transition:"color .3s" }}>${fmt(t.price)}</span>
            <span style={{ color:"var(--muted2)" }}>${t.mc}</span>
            <span style={{ color:"var(--muted2)" }}>${t.vol}</span>
            <span style={{ color:"var(--muted2)" }}>${t.liq}</span>
            <span style={{ color:"var(--muted2)" }}>{t.holders.toLocaleString("fr-FR")}</span>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Spark data={t.spark} up={t.ch24h>=0}/>
              <span style={{ color:t.ch24h>=0?"var(--green)":"var(--red)", fontWeight:700, fontSize:".66rem" }}>{t.ch24h>=0?"+":""}{t.ch24h}%</span>
            </div>
            {/* Security */}
            <div style={{ display:"flex", gap:4 }}>
              <span title={t.lpBurned?"LP brûlée":"LP non brûlée"} style={{ fontSize:".7rem" }}>{t.lpBurned?"🔒":"⚠️"}</span>
              <span title={t.mintRenounced?"Mint abandonné":"Mint actif"} style={{ fontSize:".7rem" }}>{t.mintRenounced?"✅":"❌"}</span>
              <span style={{ fontSize:".52rem", padding:"1px 5px", borderRadius:5, background:`${RISK[t.risk].c}22`, color:RISK[t.risk].c, fontWeight:700, alignSelf:"center" }}>{RISK[t.risk].l}</span>
            </div>
            <button onClick={()=>setTrade(t)} style={{ padding:"5px 12px", borderRadius:6, background:assigned.includes(t.sym)?"rgba(39,174,96,0.2)":"var(--red)", border:"none", color:assigned.includes(t.sym)?"var(--green)":"white", fontSize:".62rem", fontWeight:700, cursor:"pointer", boxShadow:assigned.includes(t.sym)?"none":"0 0 10px var(--red-glow)" }}>{assigned.includes(t.sym)?"✓ Bot":"Trader"}</button>
          </div>
        );
      })}

      {trade && (
        <div onClick={()=>setTrade(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"rgba(6,13,46,0.98)", border:"1px solid rgba(74,111,165,0.3)", borderRadius:14, padding:24, width:"100%", maxWidth:360 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <span style={{ fontSize:"1.5rem" }}>{trade.icon}</span>
              <div><div style={{ fontSize:".95rem", fontWeight:700, color:"white" }}>{trade.sym}</div><div style={{ fontSize:".62rem", color:"var(--muted)" }}>{trade.name}</div></div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16, fontSize:".68rem" }}>
              <div style={{ background:"rgba(4,7,26,0.5)", borderRadius:7, padding:"8px 10px" }}><div style={{ color:"var(--muted)" }}>Prix</div><div style={{ color:"white", fontWeight:600 }}>${trade.price<0.001?trade.price.toExponential(2):trade.price}</div></div>
              <div style={{ background:"rgba(4,7,26,0.5)", borderRadius:7, padding:"8px 10px" }}><div style={{ color:"var(--muted)" }}>24h</div><div style={{ color:trade.ch24h>=0?"var(--green)":"var(--red)", fontWeight:600 }}>{trade.ch24h>=0?"+":""}{trade.ch24h}%</div></div>
              <div style={{ background:"rgba(4,7,26,0.5)", borderRadius:7, padding:"8px 10px" }}><div style={{ color:"var(--muted)" }}>MCap</div><div style={{ color:"white" }}>${trade.mc}</div></div>
              <div style={{ background:"rgba(4,7,26,0.5)", borderRadius:7, padding:"8px 10px" }}><div style={{ color:"var(--muted)" }}>Sécurité</div><div style={{ color:RISK[trade.risk].c, fontWeight:600 }}>{RISK[trade.risk].l}</div></div>
            </div>
            <button onClick={()=>{ setAssigned(a=>a.includes(trade.sym)?a:[...a,trade.sym]); setTrade(null); }} style={{ width:"100%", padding:12, borderRadius:8, background:"var(--red)", border:"none", color:"white", fontSize:".78rem", fontWeight:700, cursor:"pointer", boxShadow:"0 0 16px var(--red-glow)" }}>
              🤖 Confier ce token à mon bot
            </button>
            <button onClick={()=>setTrade(null)} style={{ width:"100%", marginTop:9, padding:10, borderRadius:8, background:"transparent", border:"1px solid rgba(74,111,165,0.3)", color:"var(--muted2)", fontSize:".72rem", cursor:"pointer" }}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}

function parseAge(a:string){ if(a.includes("min"))return parseInt(a); if(a.includes("h"))return parseInt(a)*60; if(a.includes("j"))return parseInt(a)*1440; return 9999; }
