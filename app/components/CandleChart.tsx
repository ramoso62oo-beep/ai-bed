"use client";
import { useEffect, useRef, useState, useCallback } from "react";

type Candle = { o:number; h:number; l:number; c:number };
// label, intervalle Binance, jours CoinGecko (fallback), période de poll (ms)
const TF: [string,string,string,number][] = [
  ["1s","1s","1",2000],["1m","1m","1",4000],["5m","5m","1",6000],["15m","15m","1",8000],
  ["1h","1h","7",12000],["4h","4h","30",15000],["1j","1d","90",20000],
];
const STYLES = [["candles","🕯️"],["line","📈"],["area","📊"]] as const;
function fmtPrice(p:number){ return p>=100?p.toFixed(0):p>=1?p.toFixed(2):p>=0.001?p.toFixed(4):p.toExponential(2); }

export default function CandleChart({ pair="BTC" }: { pair?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sym, setSym] = useState(pair.replace("/USDT",""));
  const [tf, setTf] = useState("1m");
  const [style, setStyle] = useState<"candles"|"line"|"area">("candles");
  const [coins, setCoins] = useState<{symbol:string; id:string}[]>([]);
  const candlesRef = useRef<Candle[]>([]);
  const [stats, setStats] = useState({ last:0, high:0, low:0, ch:0 });
  const [loading, setLoading] = useState(true);
  const [src, setSrc] = useState("");

  useEffect(() => {
    fetch("/api/market?type=crypto").then(r=>r.json()).then(d=>{
      const list = (d.coins||[]).filter((c:{symbol:string;id:string})=>c.symbol&&c.id).map((c:{symbol:string;id:string})=>({symbol:c.symbol,id:c.id}));
      if (list.length) setCoins(list);
    }).catch(()=>{});
  }, []);

  const idForSym = useCallback((s:string)=>coins.find(c=>c.symbol===s)?.id || (s==="BTC"?"bitcoin":s==="ETH"?"ethereum":""), [coins]);

  const loadData = useCallback(async () => {
    const conf = TF.find(t=>t[0]===tf) || TF[1];
    const interval = conf[1], days = conf[2];
    let candles: Candle[] = [];
    let source = "";
    // 1) Binance (réel, intraday)
    try {
      const d = await fetch(`/api/klines?symbol=${sym}USDT&interval=${interval}&limit=120`).then(r=>r.json());
      if (d.candles?.length) { candles = d.candles; source = "Binance"; }
    } catch {}
    // 2) Fallback CoinGecko si pas de paire Binance
    if (!candles.length) {
      const id = idForSym(sym);
      if (id) {
        try {
          const d = await fetch(`/api/ohlc?id=${id}&days=${days}`).then(r=>r.json());
          if (d.candles?.length) {
            candles = d.candles.map((k:{o:number;h:number;l:number;c:number})=>({o:k.o,h:k.h,l:k.l,c:k.c}));
            if (d.price && candles.length){ const last={...candles[candles.length-1]}; last.c=d.price; last.h=Math.max(last.h,d.price); last.l=Math.min(last.l,d.price); candles=[...candles.slice(0,-1),last]; }
            source = "CoinGecko";
          }
        } catch {}
      }
    }
    if (candles.length) {
      candlesRef.current = candles;
      const hi=Math.max(...candles.map(c=>c.h)), lo=Math.min(...candles.map(c=>c.l));
      const open0=candles[0].o, last=candles[candles.length-1].c;
      setStats({ last, high:hi, low:lo, ch: open0?((last-open0)/open0)*100:0 });
      setSrc(source);
    }
    setLoading(false);
  }, [sym, tf, idForSym]);

  useEffect(() => {
    setLoading(true); loadData();
    const period = (TF.find(t=>t[0]===tf)||TF[1])[3];
    const id = setInterval(loadData, period);
    return ()=>clearInterval(id);
  }, [loadData, tf]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let raf = 0;
    function resize(){ const r=canvas!.getBoundingClientRect(); canvas!.width=r.width*devicePixelRatio; canvas!.height=r.height*devicePixelRatio; ctx!.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
    resize(); const ro=new ResizeObserver(resize); ro.observe(canvas);
    function draw(){
      const candles=candlesRef.current; const r=canvas!.getBoundingClientRect(), W=r.width, H=r.height;
      const padR=58, padT=8, padB=10, cw=W-padR, ch=H-padT-padB;
      ctx!.clearRect(0,0,W,H);
      if(!candles.length){ raf=requestAnimationFrame(draw); return; }
      const hi=Math.max(...candles.map(c=>c.h)), lo=Math.min(...candles.map(c=>c.l)), range=hi-lo||1;
      const y=(p:number)=>padT+(1-(p-lo)/range)*ch;
      ctx!.font="9px monospace"; ctx!.textBaseline="middle"; ctx!.textAlign="left";
      for(let i=0;i<=4;i++){ const yy=padT+(ch/4)*i, price=hi-(range/4)*i;
        ctx!.strokeStyle="rgba(10,26,92,0.4)"; ctx!.lineWidth=1; ctx!.beginPath(); ctx!.moveTo(0,yy); ctx!.lineTo(cw,yy); ctx!.stroke();
        ctx!.fillStyle="#4a6080"; ctx!.fillText(fmtPrice(price),cw+6,yy); }
      const n=candles.length, slot=cw/n, bodyW=Math.max(slot*0.6,1.2);
      if(style==="candles"){
        candles.forEach((c,i)=>{ const cx=slot*i+slot/2, up=c.c>=c.o, col=up?"#27ae60":"#c0392b";
          ctx!.strokeStyle=col; ctx!.lineWidth=1; ctx!.beginPath(); ctx!.moveTo(cx,y(c.h)); ctx!.lineTo(cx,y(c.l)); ctx!.stroke();
          const yo=y(c.o), yc=y(c.c); ctx!.fillStyle=col; ctx!.fillRect(cx-bodyW/2,Math.min(yo,yc),bodyW,Math.max(Math.abs(yc-yo),1)); });
      } else {
        const up=candles[candles.length-1].c>=candles[0].o; const col=up?"#27ae60":"#c0392b";
        ctx!.beginPath(); candles.forEach((c,i)=>{ const cx=slot*i+slot/2,yy=y(c.c); i===0?ctx!.moveTo(cx,yy):ctx!.lineTo(cx,yy); });
        if(style==="area"){ const lx=slot*(n-1)+slot/2; ctx!.lineTo(lx,H-padB); ctx!.lineTo(slot/2,H-padB); ctx!.closePath();
          const g=ctx!.createLinearGradient(0,padT,0,H-padB); g.addColorStop(0,up?"rgba(39,174,96,0.3)":"rgba(192,57,43,0.3)"); g.addColorStop(1,"rgba(0,0,0,0)"); ctx!.fillStyle=g; ctx!.fill();
          ctx!.beginPath(); candles.forEach((c,i)=>{ const cx=slot*i+slot/2,yy=y(c.c); i===0?ctx!.moveTo(cx,yy):ctx!.lineTo(cx,yy); }); }
        ctx!.strokeStyle=col; ctx!.lineWidth=1.8; ctx!.stroke();
      }
      const lastC=candles[candles.length-1].c, ly=y(lastC);
      ctx!.strokeStyle="rgba(74,144,217,0.6)"; ctx!.setLineDash([3,3]); ctx!.lineWidth=1; ctx!.beginPath(); ctx!.moveTo(0,ly); ctx!.lineTo(cw,ly); ctx!.stroke(); ctx!.setLineDash([]);
      ctx!.fillStyle="#4a90d9"; ctx!.fillRect(cw,ly-8,padR,16); ctx!.fillStyle="white"; ctx!.font="bold 9px monospace"; ctx!.fillText(fmtPrice(lastC),cw+5,ly);
      raf=requestAnimationFrame(draw);
    }
    draw();
    return ()=>{ cancelAnimationFrame(raf); ro.disconnect(); };
  }, [style]);

  const symbols = coins.length ? coins.map(c=>c.symbol) : ["BTC","ETH","SOL","BNB","XRP","DOGE"];

  return (
    <div className="panel-3d" style={{ background:"rgba(6,13,46,0.55)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:10, overflow:"hidden", flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 13px", borderBottom:"1px solid rgba(10,26,92,0.6)", flexWrap:"wrap", gap:6 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <select value={sym} onChange={e=>setSym(e.target.value)} style={{ background:"rgba(4,7,26,0.85)", border:"1px solid rgba(192,57,43,0.35)", color:"white", fontSize:".68rem", fontWeight:700, padding:"4px 8px", borderRadius:6, outline:"none", cursor:"pointer", fontFamily:"var(--font-orbitron,monospace)", maxWidth:120 }}>
            {symbols.map(s=><option key={s} value={s}>{s}/USDT</option>)}
          </select>
          {stats.last>0 && <span style={{ fontSize:".6rem", color:stats.ch>=0?"var(--green)":"var(--red)", fontWeight:700 }}>{stats.ch>=0?"+":""}{stats.ch.toFixed(2)}%</span>}
          {src && <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:".52rem", color:"var(--green)" }}><span style={{ width:5, height:5, borderRadius:"50%", background:"var(--green)", animation:"pulse-red 1.5s infinite" }}/>{src}</span>}
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ display:"flex", gap:2 }}>{STYLES.map(([id,ic])=>(<button key={id} onClick={()=>setStyle(id)} style={{ padding:"3px 6px", borderRadius:5, fontSize:".7rem", cursor:"pointer", border:"none", background:style===id?"rgba(74,144,217,0.2)":"transparent", opacity:style===id?1:0.5 }}>{ic}</button>))}</div>
          <div style={{ display:"flex", gap:2 }}>{TF.map(([lb])=>(<button key={lb} onClick={()=>setTf(lb)} style={{ padding:"3px 7px", borderRadius:5, fontSize:".56rem", fontWeight:700, cursor:"pointer", border:"none", background:tf===lb?"rgba(192,57,43,0.2)":"transparent", color:tf===lb?"var(--red)":"var(--muted)" }}>{lb}</button>))}</div>
        </div>
      </div>
      {stats.last>0 && (
        <div style={{ display:"flex", gap:16, padding:"5px 13px", borderBottom:"1px solid rgba(10,26,92,0.4)", fontSize:".56rem", color:"var(--muted2)", flexWrap:"wrap" }}>
          <span>Prix <b style={{ color:"white" }}>${fmtPrice(stats.last)}</b></span>
          <span>Haut <b style={{ color:"var(--green)" }}>${fmtPrice(stats.high)}</b></span>
          <span>Bas <b style={{ color:"var(--red)" }}>${fmtPrice(stats.low)}</b></span>
        </div>
      )}
      <div style={{ position:"relative" }}>
        {loading && <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:".7rem", color:"var(--muted)" }}>Chargement…</div>}
        <canvas ref={canvasRef} style={{ width:"100%", height:200, display:"block" }} />
      </div>
    </div>
  );
}
