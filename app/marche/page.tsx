"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Sidebar from "../components/Sidebar";
import AssignBotModal, { type TradeToken } from "../components/AssignBotModal";

type Coin = {
  id:string; symbol:string; name:string; image:string; price:number; mc:number; rank:number; vol:number;
  ch1h:number|null; ch24h:number|null; ch7d:number|null; ath:number; supply:number; spark:number[];
};

function fmt(n:number){ if(n==null) return "—"; if(n>=1e9)return (n/1e9).toFixed(2)+"Md"; if(n>=1e6)return (n/1e6).toFixed(1)+"M"; if(n>=1e3)return (n/1e3).toFixed(1)+"k"; return n.toLocaleString("fr-FR",{maximumFractionDigits:n<1?6:2}); }
function fmtP(n:number){ if(n==null) return "—"; return n>=1?n.toLocaleString("fr-FR",{maximumFractionDigits:2}):n.toLocaleString("fr-FR",{maximumFractionDigits:8}); }

function Spark({ data }:{ data:number[] }){
  if(!data||data.length<2) return null;
  const w=70,h=22,max=Math.max(...data),min=Math.min(...data),r=max-min||1;
  const up=data[data.length-1]>=data[0];
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/r)*h}`).join(" ");
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={up?"#27ae60":"#c0392b"} strokeWidth="1.5"/></svg>;
}

export default function MarchePage(){
  const [user,setUser]=useState<{role?:string;plan?:string}>({});
  const [tab,setTab]=useState<"crypto"|"meme">("crypto");
  const [coins,setCoins]=useState<Coin[]>([]);
  const [loading,setLoading]=useState(true);
  const [q,setQ]=useState("");
  const [sel,setSel]=useState<Coin|null>(null);
  const [assignToken,setAssignToken]=useState<TradeToken|null>(null);
  const [assigned,setAssigned]=useState<Record<string,{bot?:string;mode?:string}>>({});

  useEffect(()=>{ try{ setUser(JSON.parse(localStorage.getItem("aibed_user")||"{}")); }catch{}
    try{ setAssigned(JSON.parse(localStorage.getItem("aibed_assigned")||"{}")); }catch{} },[]);

  const [searchResults,setSearchResults]=useState<Coin[]>([]);
  const [searching,setSearching]=useState(false);

  // Recherche mondiale (toute la base CoinGecko) avec debounce
  useEffect(()=>{
    const term=q.trim();
    if(term.length<2){ setSearchResults([]); return; }
    setSearching(true);
    const id=setTimeout(()=>{
      fetch(`/api/search?q=${encodeURIComponent(term)}`).then(r=>r.json()).then(d=>{ setSearchResults(d.coins||[]); setSearching(false); }).catch(()=>setSearching(false));
    },350);
    return ()=>clearTimeout(id);
  },[q]);

  const fetchCoins=useCallback(async(t:string)=>{
    setLoading(true);
    try{ const r=await fetch(`/api/market?type=${t}`); const d=await r.json(); setCoins(d.coins||[]); }catch{ setCoins([]); }
    setLoading(false);
  },[]);
  useEffect(()=>{ fetchCoins(tab); },[tab,fetchCoins]);

  function refreshAssigned(){ try{ setAssigned(JSON.parse(localStorage.getItem("aibed_assigned")||"{}")); }catch{} }

  // Si recherche active (≥2 car.) → résultats mondiaux ; sinon la liste de l'onglet
  const view = q.trim().length>=2 ? searchResults : coins;
  const card:React.CSSProperties={ background:"rgba(6,13,46,0.6)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12 };
  const chColor=(n:number|null)=> n==null?"var(--muted)":n>=0?"var(--green)":"var(--red)";

  return (
    <div className="dash-root" style={{ display:"grid", gridTemplateColumns:"210px 1fr", height:"100vh", background:"var(--navy)", overflow:"hidden" }}>
      <div className="cyber-grid" />
      <Sidebar founder={user.role==="founder"} />
      <div style={{ overflowY:"auto", padding:"78px 28px 40px", position:"relative", zIndex:1 }}>
        <h1 style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1.3rem", fontWeight:900, color:"white", marginBottom:6 }}>🌍 Marché mondial</h1>
        <p style={{ fontSize:".72rem", color:"var(--muted)", marginBottom:18 }}>Toutes les cryptos et memecoins du monde, en temps réel. Cliquez sur une pièce pour ses infos, la trader ou la confier à un bot.</p>

        {/* Tabs + search */}
        <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
          {([["crypto","🪙 Cryptos"],["meme","🐸 Memecoins"]] as const).map(([id,lb])=>(
            <button key={id} onClick={()=>setTab(id)} style={{ padding:"9px 18px", borderRadius:9, fontSize:".76rem", fontWeight:700, cursor:"pointer", border:`1px solid ${tab===id?"var(--red)":"rgba(74,111,165,0.3)"}`, background:tab===id?"rgba(192,57,43,0.12)":"transparent", color:tab===id?"white":"var(--muted2)" }}>{lb}</button>
          ))}
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔎 Rechercher n'importe quelle crypto / memecoin du monde…" style={{ flex:1, minWidth:200, background:"rgba(4,7,26,0.6)", border:"1px solid rgba(74,111,165,0.3)", borderRadius:9, padding:"9px 14px", color:"white", fontSize:".76rem", outline:"none" }} />
        </div>

        {/* List (scrollable) */}
        <div style={{ ...card, overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:"40px 1.6fr 1fr .7fr .7fr .9fr 1fr .8fr", padding:"10px 16px", fontSize:".58rem", color:"var(--muted)", textTransform:"uppercase", letterSpacing:".05em", borderBottom:"1px solid rgba(10,26,92,0.5)" }}>
            <span>#</span><span>Nom</span><span>Prix</span><span>1h</span><span>24h</span><span>7j</span><span>Market Cap</span><span></span>
          </div>
          <div style={{ maxHeight:"calc(100vh - 290px)", overflowY:"auto" }}>
            {(loading||searching) && <div style={{ padding:"30px", textAlign:"center", color:"var(--muted)", fontSize:".8rem" }}>{searching?"Recherche…":"Chargement des données réelles…"}</div>}
            {!loading && !searching && view.length===0 && <div style={{ padding:"30px", textAlign:"center", color:"var(--muted)", fontSize:".8rem" }}>{q.trim().length>=2?`Aucune crypto trouvée pour « ${q} ».`:"Aucun résultat. Réessayez dans 1 min."}</div>}
            {!loading && view.map(c=>(
              <div key={c.id} onClick={()=>setSel(c)} className="token-row" style={{ display:"grid", gridTemplateColumns:"40px 1.6fr 1fr .7fr .7fr .9fr 1fr .8fr", padding:"10px 16px", fontSize:".74rem", alignItems:"center", borderBottom:"1px solid rgba(10,26,92,0.25)", cursor:"pointer" }}>
                <span style={{ color:"var(--muted)", fontSize:".64rem" }}>{c.rank||"—"}</span>
                <span style={{ display:"flex", alignItems:"center", gap:9 }}>
                  {c.image && <Image src={c.image} alt="" width={22} height={22} style={{ borderRadius:"50%" }} unoptimized />}
                  <span><span style={{ color:"white", fontWeight:600 }}>{c.symbol}</span> <span style={{ color:"var(--muted)", fontSize:".62rem" }}>{c.name.length>16?c.name.slice(0,16)+"…":c.name}</span>{assigned[c.id] && <span style={{ marginLeft:6, fontSize:".5rem", padding:"1px 5px", borderRadius:4, background:"rgba(39,174,96,0.15)", color:"var(--green)" }}>🤖 {assigned[c.id].bot}</span>}</span>
                </span>
                <span style={{ color:"white" }}>${fmtP(c.price)}</span>
                <span style={{ color:chColor(c.ch1h), fontSize:".66rem" }}>{c.ch1h!=null?(c.ch1h>=0?"+":"")+c.ch1h.toFixed(1)+"%":"—"}</span>
                <span style={{ color:chColor(c.ch24h), fontWeight:700, fontSize:".68rem" }}>{c.ch24h!=null?(c.ch24h>=0?"+":"")+c.ch24h.toFixed(1)+"%":"—"}</span>
                <span style={{ display:"flex", alignItems:"center", gap:6 }}><Spark data={c.spark}/></span>
                <span style={{ color:"var(--muted2)" }}>${fmt(c.mc)}</span>
                <button onClick={e=>{e.stopPropagation();setSel(c);}} style={{ padding:"5px 10px", borderRadius:6, background:"var(--red)", border:"none", color:"white", fontSize:".62rem", fontWeight:700, cursor:"pointer" }}>Trader</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {sel && (
        <div onClick={()=>setSel(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"rgba(6,13,46,0.98)", border:"1px solid rgba(74,111,165,0.3)", borderRadius:14, padding:24, width:"100%", maxWidth:420, maxHeight:"86vh", overflowY:"auto" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
              {sel.image && <Image src={sel.image} alt="" width={40} height={40} style={{ borderRadius:"50%" }} unoptimized />}
              <div><div style={{ fontSize:"1rem", fontWeight:700, color:"white" }}>{sel.name}</div><div style={{ fontSize:".66rem", color:"var(--muted)" }}>{sel.symbol} · Rang #{sel.rank||"—"}</div></div>
            </div>
            <div style={{ fontSize:"1.6rem", fontWeight:900, color:"white", fontFamily:"var(--font-orbitron,monospace)", marginBottom:4 }}>${fmtP(sel.price)}</div>
            <div style={{ display:"flex", gap:12, marginBottom:16, fontSize:".7rem" }}>
              <span style={{ color:chColor(sel.ch1h) }}>1h {sel.ch1h!=null?sel.ch1h.toFixed(1)+"%":"—"}</span>
              <span style={{ color:chColor(sel.ch24h) }}>24h {sel.ch24h!=null?sel.ch24h.toFixed(1)+"%":"—"}</span>
              <span style={{ color:chColor(sel.ch7d) }}>7j {sel.ch7d!=null?sel.ch7d.toFixed(1)+"%":"—"}</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:18, fontSize:".68rem" }}>
              {[["Market Cap",`$${fmt(sel.mc)}`],["Volume 24h",`$${fmt(sel.vol)}`],["ATH",`$${fmtP(sel.ath)}`],["Offre",`${fmt(sel.supply)} ${sel.symbol}`]].map(([k,v])=>(
                <div key={k} style={{ background:"rgba(4,7,26,0.5)", borderRadius:7, padding:"8px 10px" }}><div style={{ color:"var(--muted)" }}>{k}</div><div style={{ color:"white", fontWeight:600 }}>{v}</div></div>
              ))}
            </div>
            <button onClick={()=>{ setAssignToken(sel); setSel(null); }} style={{ width:"100%", padding:13, borderRadius:10, background:"var(--red)", border:"none", color:"white", fontSize:".8rem", fontWeight:700, cursor:"pointer", boxShadow:"0 0 16px var(--red-glow)", marginBottom:10 }}>🤖 Confier {sel.symbol} à un bot</button>
            <button onClick={()=>setSel(null)} style={{ width:"100%", padding:10, borderRadius:8, background:"transparent", border:"1px solid rgba(74,111,165,0.3)", color:"var(--muted2)", fontSize:".72rem", cursor:"pointer" }}>Fermer</button>
          </div>
        </div>
      )}

      {assignToken && <AssignBotModal token={assignToken} onClose={()=>{ setAssignToken(null); refreshAssigned(); }} />}
    </div>
  );
}
