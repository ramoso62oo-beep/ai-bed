"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import AssignBotModal from "./AssignBotModal";

type Token = {
  id:string; symbol:string; name:string; image:string; price:number; mc:number; rank:number; vol:number;
  ch1h:number|null; ch24h:number|null; ch7d:number|null; spark:number[];
};
const TABS: [string,"crypto"|"meme",string][] = [
  ["🔥 Trending","crypto","rank"],
  ["📈 Gainers","crypto","gainers"],
  ["🐸 Memecoins","meme","rank"],
];
function fmt(n:number){ if(n==null)return"—"; if(n>=1e9)return(n/1e9).toFixed(2)+"Md"; if(n>=1e6)return(n/1e6).toFixed(1)+"M"; if(n>=1e3)return(n/1e3).toFixed(1)+"k"; return n.toLocaleString("fr-FR",{maximumFractionDigits:n<1?6:2}); }
function fmtP(n:number){ if(n==null)return"—"; return n>=1?n.toLocaleString("fr-FR",{maximumFractionDigits:2}):n.toLocaleString("fr-FR",{maximumFractionDigits:8}); }
function risk(rank:number){ if(!rank||rank>300)return{c:"#c0392b",l:"Risqué"}; if(rank>80)return{c:"#fbbf24",l:"Moyen"}; return{c:"#27ae60",l:"Sûr"}; }

function Spark({ data, up }: { data:number[]; up:boolean }) {
  if(!data||data.length<2) return null;
  const w=58,h=20,max=Math.max(...data),min=Math.min(...data),range=max-min||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/range)*h}`).join(" ");
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={up?"#27ae60":"#c0392b"} strokeWidth="1.5"/></svg>;
}

export default function TokenTable() {
  const [tab, setTab] = useState(0);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [trade, setTrade] = useState<Token|null>(null);
  const [assigned, setAssigned] = useState<Record<string,{bot?:string;mode?:string}>>({});

  useEffect(()=>{ try{ setAssigned(JSON.parse(localStorage.getItem("aibed_assigned")||"{}")); }catch{} },[]);

  const load = useCallback(async (t:number)=>{
    setLoading(true);
    const [, type, sort] = TABS[t];
    try {
      const d = await fetch(`/api/market?type=${type}`).then(r=>r.json());
      let coins: Token[] = d.coins || [];
      if (sort==="gainers") coins = [...coins].sort((a,b)=>(b.ch24h||-999)-(a.ch24h||-999));
      setTokens(coins.slice(0,40));
    } catch { setTokens([]); }
    setLoading(false);
  },[]);
  useEffect(()=>{ load(tab); const id=setInterval(()=>load(tab), 60000); return ()=>clearInterval(id); },[tab,load]);

  const chColor=(n:number|null)=> n==null?"var(--muted)":n>=0?"var(--green)":"var(--red)";
  function refreshAssigned(){ try{ setAssigned(JSON.parse(localStorage.getItem("aibed_assigned")||"{}")); }catch{} }

  return (
    <div style={{ background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 18px", borderBottom:"1px solid rgba(10,26,92,0.5)", flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", gap:6 }}>
          {TABS.map((t,i)=>(<button key={i} onClick={()=>setTab(i)} style={{ padding:"6px 13px", borderRadius:7, fontSize:".68rem", fontWeight:700, cursor:"pointer", border:"none", background:tab===i?"rgba(192,57,43,0.15)":"transparent", color:tab===i?"var(--red)":"var(--muted2)" }}>{t[0]}</button>))}
        </div>
        <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:".6rem", color:"var(--green)" }}><span style={{ width:6, height:6, borderRadius:"50%", background:"var(--green)", animation:"pulse-red 1.5s infinite" }}/>Données réelles</span>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.8fr 1fr .7fr .8fr 1.1fr 1fr .7fr .7fr", padding:"9px 18px", fontSize:".56rem", color:"var(--muted)", textTransform:"uppercase", letterSpacing:".05em", borderBottom:"1px solid rgba(10,26,92,0.4)" }}>
        <span>Token</span><span>Prix</span><span>1h</span><span>24h</span><span>7j</span><span>MCap</span><span>Sécurité</span><span></span>
      </div>

      {loading && <div style={{ padding:"24px", textAlign:"center", color:"var(--muted)", fontSize:".76rem" }}>Chargement des données réelles…</div>}
      {!loading && tokens.length===0 && <div style={{ padding:"24px", textAlign:"center", color:"var(--muted)", fontSize:".76rem" }}>Indisponible (limite CoinGecko). Réessayez dans 1 min.</div>}

      <div style={{ maxHeight:430, overflowY:"auto" }}>
        {!loading && tokens.map((t)=>{ const rk=risk(t.rank); return (
          <div key={t.id} className="token-row" onClick={()=>setTrade(t)} style={{ display:"grid", gridTemplateColumns:"1.8fr 1fr .7fr .8fr 1.1fr 1fr .7fr .7fr", padding:"10px 18px", fontSize:".72rem", alignItems:"center", borderBottom:"1px solid rgba(10,26,92,0.22)", cursor:"pointer" }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              {t.image && <Image src={t.image} alt="" width={22} height={22} style={{ borderRadius:"50%" }} unoptimized />}
              <div><div style={{ color:"white", fontWeight:600, lineHeight:1.1 }}>{t.symbol}</div>
                <div style={{ fontSize:".56rem", color:"var(--muted)" }}>{t.name.length>15?t.name.slice(0,15)+"…":t.name}{assigned[t.id]&&<span style={{ marginLeft:5, color:"var(--green)" }}>🤖</span>}</div></div>
            </div>
            <span style={{ color:"white", fontWeight:600 }}>${fmtP(t.price)}</span>
            <span style={{ color:chColor(t.ch1h), fontSize:".64rem" }}>{t.ch1h!=null?(t.ch1h>=0?"+":"")+t.ch1h.toFixed(1)+"%":"—"}</span>
            <span style={{ color:chColor(t.ch24h), fontWeight:700, fontSize:".66rem" }}>{t.ch24h!=null?(t.ch24h>=0?"+":"")+t.ch24h.toFixed(1)+"%":"—"}</span>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}><Spark data={t.spark} up={(t.ch7d||0)>=0}/><span style={{ color:chColor(t.ch7d), fontSize:".6rem" }}>{t.ch7d!=null?(t.ch7d>=0?"+":"")+t.ch7d.toFixed(0)+"%":""}</span></div>
            <span style={{ color:"var(--muted2)" }}>${fmt(t.mc)}</span>
            <span style={{ fontSize:".54rem", padding:"1px 6px", borderRadius:5, background:`${rk.c}22`, color:rk.c, fontWeight:700, justifySelf:"start" }}>{rk.l}</span>
            <button onClick={e=>{e.stopPropagation();setTrade(t);}} style={{ padding:"5px 12px", borderRadius:6, background:assigned[t.id]?"rgba(39,174,96,0.2)":"var(--red)", border:"none", color:assigned[t.id]?"var(--green)":"white", fontSize:".62rem", fontWeight:700, cursor:"pointer" }}>{assigned[t.id]?("✓ "+(assigned[t.id].bot||"Bot")):"Trader"}</button>
          </div>
        );})}
      </div>

      {trade && <AssignBotModal token={{ id:trade.id, symbol:trade.symbol, name:trade.name, image:trade.image, price:trade.price }} onClose={()=>{ setTrade(null); refreshAssigned(); }} />}
    </div>
  );
}
