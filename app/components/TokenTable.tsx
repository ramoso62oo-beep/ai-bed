"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import AssignBotModal from "./AssignBotModal";

type Token = {
  id:string; symbol:string; name:string; image:string; price:number; mc:number; rank:number; vol:number;
  ch1h:number|null; ch24h:number|null; ch7d:number|null; spark:number[];
};
type Tab = { label:string; src:"market"|"fav"|"holding"; type?:"crypto"|"meme"; sort?:"rank"|"gainers"|"volume" };
const TABS: Tab[] = [
  { label:"🔥 Hot",          src:"market", type:"crypto", sort:"rank" },
  { label:"📈 Top Gainers",  src:"market", type:"crypto", sort:"gainers" },
  { label:"💵 Volume 24h",   src:"market", type:"crypto", sort:"volume" },
  { label:"🐸 Memecoins",    src:"market", type:"meme",   sort:"rank" },
  { label:"⭐ Favoris",      src:"fav" },
  { label:"💼 Holding",      src:"holding" },
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
  const [assigned, setAssigned] = useState<Record<string,{bot?:string;symbol?:string;name?:string;image?:string;price?:number}>>({});
  const [favs, setFavs] = useState<Token[]>([]);
  const [q, setQ] = useState("");
  const [searchResults, setSearchResults] = useState<Token[]>([]);
  const [searching, setSearching] = useState(false);

  const reloadLocal = useCallback(()=>{
    try{ setAssigned(JSON.parse(localStorage.getItem("aibed_assigned")||"{}")); }catch{}
    try{ setFavs(JSON.parse(localStorage.getItem("aibed_favorites")||"[]")); }catch{}
  },[]);
  useEffect(()=>{ reloadLocal(); },[reloadLocal]);

  // Recherche mondiale (debounce)
  useEffect(()=>{
    const term=q.trim();
    if(term.length<2){ setSearchResults([]); return; }
    setSearching(true);
    const id=setTimeout(()=>{ fetch(`/api/search?q=${encodeURIComponent(term)}`).then(r=>r.json()).then(d=>{ setSearchResults(d.coins||[]); setSearching(false); }).catch(()=>setSearching(false)); },350);
    return ()=>clearTimeout(id);
  },[q]);

  const load = useCallback(async (t:number)=>{
    const T = TABS[t];
    if (T.src === "fav") { try{ setTokens(JSON.parse(localStorage.getItem("aibed_favorites")||"[]")); }catch{ setTokens([]); } setLoading(false); return; }
    if (T.src === "holding") {
      try{ const a=JSON.parse(localStorage.getItem("aibed_assigned")||"{}") as Record<string,Record<string,unknown>>; setTokens(Object.entries(a).map(([id,v])=>({ id, symbol:String(v.symbol||""), name:String(v.name||""), image:String(v.image||""), price:Number(v.price)||0, mc:0, rank:0, vol:0, ch1h:null, ch24h:null, ch7d:null, spark:[] }))); }catch{ setTokens([]); }
      setLoading(false); return;
    }
    setLoading(true);
    try {
      const d = await fetch(`/api/market?type=${T.type}`).then(r=>r.json());
      let coins: Token[] = d.coins || [];
      if (T.sort==="gainers") coins = [...coins].sort((a,b)=>(b.ch24h||-999)-(a.ch24h||-999));
      else if (T.sort==="volume") coins = [...coins].sort((a,b)=>(b.vol||0)-(a.vol||0));
      setTokens(coins.slice(0,40));
    } catch { setTokens([]); }
    setLoading(false);
  },[]);
  useEffect(()=>{ load(tab); const id=setInterval(()=>load(tab), 60000); return ()=>clearInterval(id); },[tab,load]);

  const chColor=(n:number|null)=> n==null?"var(--muted)":n>=0?"var(--green)":"var(--red)";
  const isFav=(id:string)=>favs.some(f=>f.id===id);
  function toggleFav(t:Token){
    const next = isFav(t.id) ? favs.filter(f=>f.id!==t.id) : [...favs, t];
    setFavs(next); localStorage.setItem("aibed_favorites", JSON.stringify(next));
    if (TABS[tab].src==="fav") setTokens(next);
  }

  const view = q.trim().length>=2 ? searchResults : tokens;
  const showSpark = TABS[tab].src==="market" || q.trim().length>=2;

  return (
    <div style={{ background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, overflow:"hidden" }}>
      {/* Onglets + recherche */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 18px", borderBottom:"1px solid rgba(10,26,92,0.5)", flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {TABS.map((t,i)=>(<button key={i} onClick={()=>setTab(i)} style={{ padding:"6px 11px", borderRadius:7, fontSize:".66rem", fontWeight:700, cursor:"pointer", border:"none", background:tab===i?"rgba(192,57,43,0.15)":"transparent", color:tab===i?"var(--red)":"var(--muted2)" }}>{t.label}</button>))}
        </div>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔎 Rechercher une crypto / memecoin…" style={{ minWidth:200, flex:"1 1 200px", maxWidth:300, background:"rgba(4,7,26,0.6)", border:"1px solid rgba(74,111,165,0.3)", borderRadius:8, padding:"7px 12px", color:"white", fontSize:".72rem", outline:"none" }} />
      </div>

      {/* En-têtes */}
      <div style={{ display:"grid", gridTemplateColumns:"24px 1.7fr 1fr .7fr .8fr 1.1fr 1fr .7fr", padding:"9px 16px", fontSize:".56rem", color:"var(--muted)", textTransform:"uppercase", letterSpacing:".05em", borderBottom:"1px solid rgba(10,26,92,0.4)" }}>
        <span></span><span>Token</span><span>Prix</span><span>1h</span><span>24h</span><span>7j</span><span>MCap</span><span></span>
      </div>

      {(loading||searching) && <div style={{ padding:"24px", textAlign:"center", color:"var(--muted)", fontSize:".76rem" }}>{searching?"Recherche…":"Chargement…"}</div>}
      {!loading && !searching && view.length===0 && <div style={{ padding:"24px", textAlign:"center", color:"var(--muted)", fontSize:".76rem" }}>
        {q.trim().length>=2 ? `Aucun résultat pour « ${q} ».` : TABS[tab].src==="fav" ? "Aucun favori. Cliquez l'étoile ⭐ sur une crypto pour l'ajouter." : TABS[tab].src==="holding" ? "Aucune crypto confiée à un bot. Cliquez « Trader » pour en confier une." : "Indisponible — réessayez dans 1 min."}
      </div>}

      <div style={{ maxHeight:430, overflowY:"auto" }}>
        {!loading && !searching && view.map((t)=>{ const rk=risk(t.rank); return (
          <div key={t.id} className="token-row" onClick={()=>setTrade(t)} style={{ display:"grid", gridTemplateColumns:"24px 1.7fr 1fr .7fr .8fr 1.1fr 1fr .7fr", padding:"10px 16px", fontSize:".72rem", alignItems:"center", borderBottom:"1px solid rgba(10,26,92,0.22)", cursor:"pointer" }}>
            <span onClick={e=>{e.stopPropagation();toggleFav(t);}} title="Favori" style={{ cursor:"pointer", fontSize:".85rem", color:isFav(t.id)?"#fbbf24":"var(--muted)" }}>{isFav(t.id)?"★":"☆"}</span>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              {t.image && <Image src={t.image} alt="" width={22} height={22} style={{ borderRadius:"50%" }} unoptimized />}
              <div><div style={{ color:"white", fontWeight:600, lineHeight:1.1 }}>{t.symbol}</div>
                <div style={{ fontSize:".56rem", color:"var(--muted)" }}>{(t.name||"").length>15?t.name.slice(0,15)+"…":t.name}{assigned[t.id]&&<span style={{ marginLeft:5, color:"var(--green)" }}>🤖</span>}</div></div>
            </div>
            <span style={{ color:"white", fontWeight:600 }}>${fmtP(t.price)}</span>
            <span style={{ color:chColor(t.ch1h), fontSize:".64rem" }}>{t.ch1h!=null?(t.ch1h>=0?"+":"")+t.ch1h.toFixed(1)+"%":"—"}</span>
            <span style={{ color:chColor(t.ch24h), fontWeight:700, fontSize:".66rem" }}>{t.ch24h!=null?(t.ch24h>=0?"+":"")+t.ch24h.toFixed(1)+"%":"—"}</span>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>{showSpark&&<Spark data={t.spark} up={(t.ch7d||0)>=0}/>}<span style={{ color:chColor(t.ch7d), fontSize:".6rem" }}>{t.ch7d!=null?(t.ch7d>=0?"+":"")+t.ch7d.toFixed(0)+"%":""}</span></div>
            <span style={{ color:"var(--muted2)" }}>{t.mc?"$"+fmt(t.mc):"—"} {t.rank?<span style={{ fontSize:".52rem", padding:"1px 5px", borderRadius:5, background:`${rk.c}22`, color:rk.c, fontWeight:700, marginLeft:4 }}>{rk.l}</span>:null}</span>
            <button onClick={e=>{e.stopPropagation();setTrade(t);}} style={{ padding:"5px 11px", borderRadius:6, background:assigned[t.id]?"rgba(39,174,96,0.2)":"var(--red)", border:"none", color:assigned[t.id]?"var(--green)":"white", fontSize:".62rem", fontWeight:700, cursor:"pointer" }}>{assigned[t.id]?"✓ Bot":"Trader"}</button>
          </div>
        );})}
      </div>

      {trade && <AssignBotModal token={{ id:trade.id, symbol:trade.symbol, name:trade.name, image:trade.image, price:trade.price }} onClose={()=>{ setTrade(null); reloadLocal(); if(TABS[tab].src==="holding")load(tab); }} />}
    </div>
  );
}
