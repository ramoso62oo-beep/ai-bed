"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Tooltip from "../components/Tooltip";

type Token = { sym:string; name:string; addr:string; cg:string };
const TOKENS: Token[] = [
  { sym:"ETH",  name:"Ethereum",   addr:"ETH", cg:"ETH" },
  { sym:"USDC", name:"USD Coin",   addr:"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", cg:"USDC" },
  { sym:"USDT", name:"Tether",     addr:"0xdAC17F958D2ee523a2206206994597C13D831ec7", cg:"USDT" },
  { sym:"DAI",  name:"Dai",        addr:"0x6B175474E89094C44Da98b954EedeAC495271d0F", cg:"DAI" },
  { sym:"WBTC", name:"Wrapped BTC",addr:"0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", cg:"WBTC" },
  { sym:"LINK", name:"Chainlink",  addr:"0x514910771AF9Ca656af840dff83E8264EcF986CA", cg:"LINK" },
  { sym:"UNI",  name:"Uniswap",    addr:"0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", cg:"UNI" },
];

export default function SwapPage(){
  const [user,setUser]=useState<{role?:string}>({});
  const [from,setFrom]=useState("ETH");
  const [to,setTo]=useState("USDC");
  const [amount,setAmount]=useState("");
  const [prices,setPrices]=useState<Record<string,number>>({});
  const [addr,setAddr]=useState("");

  useEffect(()=>{ try{ setUser(JSON.parse(localStorage.getItem("aibed_user")||"{}")); }catch{} },[]);

  // Prix réels (CoinGecko via notre API)
  useEffect(()=>{
    fetch("/api/market?type=crypto").then(r=>r.json()).then(d=>{
      const m:Record<string,number>={}; (d.coins||[]).forEach((c:{symbol:string;price:number})=>{ m[c.symbol]=c.price; });
      m["USDC"]=1; m["USDT"]=1; m["DAI"]=1; if(!m["WBTC"]&&m["BTC"]) m["WBTC"]=m["BTC"]; if(!m["ETH"]&&m["WETH"]) m["ETH"]=m["WETH"];
      setPrices(m);
    }).catch(()=>{});
  },[]);

  const connect=useCallback(async()=>{
    const eth=(window as unknown as { ethereum?: { request:(a:{method:string})=>Promise<string[]> } }).ethereum;
    if(!eth){ alert("Installez MetaMask pour swapper."); return; }
    try{ const a=await eth.request({method:"eth_requestAccounts"}); setAddr(a[0]); }catch{}
  },[]);
  useEffect(()=>{ const eth=(window as unknown as { ethereum?: { request:(a:{method:string})=>Promise<string[]> } }).ethereum; if(eth) eth.request({method:"eth_accounts"}).then(a=>{ if(a[0])setAddr(a[0]); }).catch(()=>{}); },[]);

  const fromTok=TOKENS.find(t=>t.sym===from)!, toTok=TOKENS.find(t=>t.sym===to)!;
  const pf=prices[fromTok.cg]||0, pt=prices[toTok.cg]||0;
  const est = amount && pf && pt ? (Number(amount)*pf/pt) : 0;

  function swap(){
    const inC = fromTok.addr, outC = toTok.addr;
    const url = `https://app.uniswap.org/#/swap?inputCurrency=${inC}&outputCurrency=${outC}${amount?`&exactAmount=${amount}&exactField=input`:""}`;
    window.open(url, "_blank");
  }
  function flip(){ setFrom(to); setTo(from); }

  const card:React.CSSProperties={ background:"rgba(6,13,46,0.6)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:14, padding:"22px 24px" };
  const sel:React.CSSProperties={ background:"rgba(4,7,26,0.7)", border:"1px solid rgba(74,111,165,0.3)", color:"white", fontSize:".82rem", fontWeight:700, padding:"10px 12px", borderRadius:8, outline:"none", cursor:"pointer" };
  const tokenBox:React.CSSProperties={ background:"rgba(4,7,26,0.5)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:10 };

  return (
    <div className="dash-root" style={{ display:"grid", gridTemplateColumns:"210px 1fr", height:"100vh", background:"var(--navy)", overflow:"hidden" }}>
      <div className="cyber-grid" />
      <Sidebar founder={user.role==="founder"} />
      <div style={{ overflowY:"auto", padding:"78px 28px 40px", position:"relative", zIndex:1 }}>
        <h1 style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1.3rem", fontWeight:900, color:"white", marginBottom:6 }}>🔄 Swap DEX</h1>
        <p style={{ fontSize:".72rem", color:"var(--muted)", marginBottom:22, maxWidth:560 }}>Échangez vos cryptos directement depuis votre wallet, on-chain. 100% non-custodial : la transaction est exécutée et signée par <strong>vous</strong> via Uniswap, le plus grand DEX. AI-BED ne touche jamais vos fonds.</p>

        <div style={{ ...card, maxWidth:440 }}>
          {/* Wallet */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <span style={{ fontSize:".68rem", color:"var(--muted2)" }}>{addr ? `🟢 ${addr.slice(0,6)}…${addr.slice(-4)}` : "Wallet non connecté"}</span>
            {!addr && <button onClick={connect} style={{ padding:"6px 12px", borderRadius:7, background:"var(--red)", color:"white", border:"none", fontSize:".68rem", fontWeight:700, cursor:"pointer" }}>🦊 Connecter</button>}
          </div>

          {/* From */}
          <div style={{ fontSize:".62rem", color:"var(--muted2)", marginBottom:6 }}>Vous payez</div>
          <div style={tokenBox}>
            <input value={amount} onChange={e=>setAmount(e.target.value)} type="number" placeholder="0.0" style={{ background:"none", border:"none", color:"white", fontSize:"1.3rem", fontWeight:700, outline:"none", width:"60%" }} />
            <select value={from} onChange={e=>setFrom(e.target.value)} style={sel}>{TOKENS.map(t=><option key={t.sym} value={t.sym}>{t.sym}</option>)}</select>
          </div>
          <div style={{ fontSize:".58rem", color:"var(--muted)", margin:"4px 2px 0" }}>{pf?`≈ $${(Number(amount||0)*pf).toLocaleString("fr-FR",{maximumFractionDigits:2})}`:""}</div>

          {/* Flip */}
          <div style={{ textAlign:"center", margin:"8px 0" }}>
            <button onClick={flip} style={{ width:34, height:34, borderRadius:"50%", background:"rgba(192,57,43,0.15)", border:"1px solid rgba(192,57,43,0.3)", color:"var(--red)", cursor:"pointer", fontSize:"1rem" }}>↓</button>
          </div>

          {/* To */}
          <div style={{ fontSize:".62rem", color:"var(--muted2)", marginBottom:6 }}>Vous recevez (estimé)</div>
          <div style={tokenBox}>
            <span style={{ fontSize:"1.3rem", fontWeight:700, color:est?"white":"var(--muted)", width:"60%", overflow:"hidden" }}>{est?est.toLocaleString("fr-FR",{maximumFractionDigits:6}):"0.0"}</span>
            <select value={to} onChange={e=>setTo(e.target.value)} style={sel}>{TOKENS.map(t=><option key={t.sym} value={t.sym}>{t.sym}</option>)}</select>
          </div>
          <div style={{ fontSize:".58rem", color:"var(--muted)", margin:"4px 2px 14px" }}>
            {pf&&pt?`1 ${from} ≈ ${(pf/pt).toLocaleString("fr-FR",{maximumFractionDigits:6})} ${to}`:""}
          </div>

          <Tooltip text="Ouvre Uniswap avec vos cryptos pré-remplies. Vous validez et signez le swap dans votre wallet. C'est une vraie transaction on-chain.">
            <button onClick={swap} disabled={from===to} style={{ width:"100%", padding:14, borderRadius:10, background:from===to?"rgba(74,111,165,0.3)":"var(--red)", color:"white", border:"none", fontSize:".84rem", fontWeight:700, cursor:from===to?"not-allowed":"pointer", boxShadow:from===to?"none":"0 0 20px var(--red-glow)" }}>
              {from===to ? "Choisissez 2 cryptos différentes" : `Swapper ${from} → ${to} sur Uniswap ↗`}
            </button>
          </Tooltip>
          <div style={{ fontSize:".56rem", color:"var(--muted)", marginTop:10, lineHeight:1.5 }}>
            ⚡ Estimation au prix du marché (hors frais de réseau et slippage). Le montant exact est confirmé sur Uniswap avant signature. Réseau : Ethereum.
          </div>
        </div>
      </div>
    </div>
  );
}
