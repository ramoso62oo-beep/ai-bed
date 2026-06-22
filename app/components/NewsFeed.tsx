"use client";
import { useEffect, useRef, useState } from "react";

type News = { id:number; title:string; tag:string; impact:string; ts:number };

const POOL: [string,string,string][] = [
  ["La SEC approuve 3 nouveaux ETF Bitcoin spot","BTC","haussier"],
  ["Binance annonce le listing de 5 nouveaux memecoins","ALTCOINS","haussier"],
  ["Elon Musk tweete sur DOGE — pump en cours","DOGE","haussier"],
  ["MiCA : nouvelles règles européennes en vigueur","RÉGULATION","neutre"],
  ["Solana dépasse 200$ — ATH historique approche","SOL","haussier"],
  ["La Fed maintient ses taux — marchés en hausse","MACRO","haussier"],
  ["Piratage d'un pont cross-chain : 40M$ dérobés","SÉCURITÉ","baissier"],
  ["Ethereum : la mise à jour Pectra est déployée","ETH","haussier"],
  ["BlackRock augmente ses positions en BTC","BTC","haussier"],
  ["Coinbase lance le staking pour 5 nouveaux tokens","CEX","haussier"],
  ["Tether émet 1Md USDT supplémentaires","STABLE","neutre"],
  ["Un whale liquide 12M$ de positions ETH","ETH","baissier"],
  ["Le Salvador achète 200 BTC de plus","BTC","haussier"],
  ["Arbitrum annonce un airdrop pour les holders","ARB","haussier"],
  ["Chute de 8% du marché après données d'inflation US","MACRO","baissier"],
  ["PEPE entre dans le top 20 des cryptos","PEPE","haussier"],
  ["Ripple gagne son procès contre la SEC","XRP","haussier"],
  ["Nouvelle faille détectée sur un protocole DeFi","SÉCURITÉ","baissier"],
];
const IMPACT: Record<string,string> = { haussier:"var(--green)", baissier:"var(--red)", neutre:"var(--muted2)" };
function pick(){ return POOL[Math.floor(Math.random()*POOL.length)]; }
function ago(ts:number){ const s=Math.floor((Date.now()-ts)/1000); if(s<60)return `${s}s`; const m=Math.floor(s/60); if(m<60)return `${m}min`; return `${Math.floor(m/60)}h`; }

export default function NewsFeed({ max=14, compact=false }: { max?:number; compact?:boolean }) {
  const idRef = useRef(0);
  const [items, setItems] = useState<News[]>([]);
  const [, force] = useState(0);

  useEffect(() => {
    const seed = Array.from({length: Math.min(max,8)}, () => { const [title,tag,impact]=pick(); return { id:idRef.current++, title, tag, impact, ts: Date.now()-Math.floor(Math.random()*3600)*1000 }; });
    setItems(seed.sort((a,b)=>b.ts-a.ts));
    const add = setInterval(() => {
      const [title,tag,impact]=pick();
      setItems(prev => [{ id:idRef.current++, title, tag, impact, ts:Date.now() }, ...prev].slice(0,max));
    }, 7000);
    const refresh = setInterval(() => force(x=>x+1), 1000);
    return () => { clearInterval(add); clearInterval(refresh); };
  }, [max]);

  if (compact) {
    return (
      <div style={{ padding:"10px 12px", display:"flex", flexDirection:"column", gap:6 }}>
        {items.slice(0,7).map((n,i)=>(
          <div key={n.id} style={{ padding:"7px 9px", background:"rgba(4,7,26,0.4)", borderRadius:6, border:"1px solid rgba(10,26,92,0.6)", cursor:"pointer", animation:i===0?"fadeUp .4s":"none" }}>
            <div style={{ fontSize:".64rem", color:"var(--text)", fontWeight:500, lineHeight:1.4, marginBottom:3 }}>{n.title}</div>
            <div style={{ display:"flex", gap:8, fontSize:".56rem", alignItems:"center" }}>
              <span style={{ color:"var(--red)" }}>{n.tag}</span>
              <span style={{ color:"var(--muted)" }}>il y a {ago(n.ts)}</span>
              <span style={{ color:IMPACT[n.impact], fontWeight:600 }}>● {n.impact}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"6px 0" }}>
      {items.map((n,i)=>(
        <div key={n.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"15px 20px", borderBottom:i<items.length-1?"1px solid rgba(10,26,92,0.3)":"none", animation:i===0?"fadeUp .4s":"none" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:".82rem", color:"white", marginBottom:5 }}>{n.title}</div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:".58rem", color:"var(--red)", fontWeight:700, letterSpacing:".06em" }}>{n.tag}</span>
              <span style={{ fontSize:".58rem", color:"var(--muted)" }}>il y a {ago(n.ts)}</span>
              <span style={{ fontSize:".58rem", color:IMPACT[n.impact], fontWeight:600 }}>● {n.impact}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
