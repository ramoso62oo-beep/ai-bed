"use client";
import { useEffect, useRef, useState } from "react";

type Candle = { o:number; h:number; l:number; c:number; v:number };
const TIMEFRAMES = ["1s","1m","5m","15m","1h","4h","1j"];
const STYLES = [["candles","🕯️"],["line","📈"],["area","📊"]] as const;
const FALLBACK: Record<string, number> = { "BTC":64310,"ETH":3420,"SOL":198,"BNB":592,"XRP":0.62,"DOGE":0.164,"PEPE":0.0000132 };

function genCandles(n:number, start:number, vol:number): Candle[] {
  const out: Candle[] = []; let price = start;
  for (let i=0;i<n;i++){
    const o=price, move=(Math.random()-0.5)*vol, c=Math.max(o+move,o*0.85);
    const h=Math.max(o,c)+Math.random()*vol*0.5, l=Math.min(o,c)-Math.random()*vol*0.5;
    out.push({o,h,l,c,v:Math.random()*100+20}); price=c;
  }
  return out;
}
function fmtPrice(p:number){ return p>=100?p.toFixed(0):p>=1?p.toFixed(2):p>=0.001?p.toFixed(4):p.toExponential(2); }

export default function CandleChart({ pair="BTC" }: { pair?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sym, setSym] = useState(pair.replace("/USDT",""));
  const [tf, setTf] = useState("1m");
  const [style, setStyle] = useState<"candles"|"line"|"area">("candles");
  const [coins, setCoins] = useState<{symbol:string; price:number}[]>([]);
  const pricesRef = useRef<Record<string,number>>(FALLBACK);
  const candlesRef = useRef<Candle[]>([]);
  const [stats, setStats] = useState({ last:0, high:0, low:0, ch:0 });

  // Charge la liste réelle des cryptos (CoinGecko via notre API)
  useEffect(() => {
    fetch("/api/market?type=crypto").then(r=>r.json()).then(d=>{
      const list = (d.coins||[]).filter((c: {symbol:string;price:number})=>c.symbol && c.price).map((c: {symbol:string;price:number})=>({ symbol:c.symbol, price:c.price }));
      if (list.length) {
        setCoins(list);
        const map: Record<string,number> = {};
        list.forEach((c: {symbol:string;price:number})=>{ map[c.symbol]=c.price; });
        pricesRef.current = { ...FALLBACK, ...map };
      }
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    const base = pricesRef.current[sym] ?? 100;
    const factor = tf==="1s"?0.0006:tf==="1m"?0.003:tf==="5m"?0.006:tf==="15m"?0.01:tf==="1h"?0.018:tf==="4h"?0.025:0.035;
    candlesRef.current = genCandles(60, base, base*factor);
  }, [tf, sym, coins]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let raf = 0;
    function resize(){ const r=canvas!.getBoundingClientRect(); canvas!.width=r.width*devicePixelRatio; canvas!.height=r.height*devicePixelRatio; ctx!.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
    resize(); const ro=new ResizeObserver(resize); ro.observe(canvas);
    const speed = tf==="1s"?3:8; let tick=0;

    function draw(){
      const candles=candlesRef.current; if(!candles.length){ raf=requestAnimationFrame(draw); return; }
      const r=canvas!.getBoundingClientRect(), W=r.width, H=r.height;
      const padR=60, padB=30, padT=8, cw=W-padR, ch=H-padB-padT;
      tick++;
      if(tick%speed===0){ const base=pricesRef.current[sym]??100; const last=candles[candles.length-1];
        last.c=Math.max(last.c+(Math.random()-0.5)*base*0.0025,last.l*0.999); last.h=Math.max(last.h,last.c); last.l=Math.min(last.l,last.c); }
      const hi=Math.max(...candles.map(c=>c.h)), lo=Math.min(...candles.map(c=>c.l)), range=hi-lo||1;
      const maxV=Math.max(...candles.map(c=>c.v));
      const y=(p:number)=>padT+(1-(p-lo)/range)*ch;
      ctx!.clearRect(0,0,W,H);
      ctx!.font="9px monospace"; ctx!.textBaseline="middle"; ctx!.textAlign="left";
      for(let i=0;i<=4;i++){ const yy=padT+(ch/4)*i, price=hi-(range/4)*i;
        ctx!.strokeStyle="rgba(10,26,92,0.4)"; ctx!.lineWidth=1; ctx!.beginPath(); ctx!.moveTo(0,yy); ctx!.lineTo(cw,yy); ctx!.stroke();
        ctx!.fillStyle="#4a6080"; ctx!.fillText(fmtPrice(price),cw+6,yy); }
      const n=candles.length, slot=cw/n, bodyW=Math.max(slot*0.6,2);
      // Volume
      candles.forEach((c,i)=>{ const cx=slot*i+slot/2, up=c.c>=c.o, vh=(c.v/maxV)*(padB-6);
        ctx!.fillStyle=up?"rgba(39,174,96,0.22)":"rgba(192,57,43,0.22)"; ctx!.fillRect(cx-bodyW/2,H-padB+6+(padB-6-vh),bodyW,vh); });

      if(style==="candles"){
        candles.forEach((c,i)=>{ const cx=slot*i+slot/2, up=c.c>=c.o, col=up?"#27ae60":"#c0392b";
          ctx!.strokeStyle=col; ctx!.lineWidth=1; ctx!.beginPath(); ctx!.moveTo(cx,y(c.h)); ctx!.lineTo(cx,y(c.l)); ctx!.stroke();
          const yo=y(c.o), yc=y(c.c); ctx!.fillStyle=col; ctx!.fillRect(cx-bodyW/2,Math.min(yo,yc),bodyW,Math.max(Math.abs(yc-yo),1)); });
      } else {
        // Ligne / Zone
        ctx!.beginPath();
        candles.forEach((c,i)=>{ const cx=slot*i+slot/2, yy=y(c.c); i===0?ctx!.moveTo(cx,yy):ctx!.lineTo(cx,yy); });
        const up=candles[candles.length-1].c>=candles[0].c; const col=up?"#27ae60":"#c0392b";
        if(style==="area"){ const lx=slot*(n-1)+slot/2; ctx!.lineTo(lx,H-padB); ctx!.lineTo(slot/2,H-padB); ctx!.closePath();
          const g=ctx!.createLinearGradient(0,padT,0,H-padB); g.addColorStop(0,up?"rgba(39,174,96,0.3)":"rgba(192,57,43,0.3)"); g.addColorStop(1,"rgba(0,0,0,0)"); ctx!.fillStyle=g; ctx!.fill();
          ctx!.beginPath(); candles.forEach((c,i)=>{ const cx=slot*i+slot/2,yy=y(c.c); i===0?ctx!.moveTo(cx,yy):ctx!.lineTo(cx,yy); }); }
        ctx!.strokeStyle=col; ctx!.lineWidth=1.8; ctx!.stroke();
      }

      const lastC=candles[candles.length-1].c, ly=y(lastC);
      ctx!.strokeStyle="rgba(74,144,217,0.6)"; ctx!.setLineDash([3,3]); ctx!.lineWidth=1; ctx!.beginPath(); ctx!.moveTo(0,ly); ctx!.lineTo(cw,ly); ctx!.stroke(); ctx!.setLineDash([]);
      ctx!.fillStyle="#4a90d9"; ctx!.fillRect(cw,ly-8,padR,16); ctx!.fillStyle="white"; ctx!.font="bold 9px monospace"; ctx!.fillText(fmtPrice(lastC),cw+5,ly);

      if(tick%15===0) setStats({ last:lastC, high:hi, low:lo, ch:((lastC-candles[0].o)/candles[0].o)*100 });
      raf=requestAnimationFrame(draw);
    }
    draw();
    return ()=>{ cancelAnimationFrame(raf); ro.disconnect(); };
  }, [tf, sym, style]);

  const symbols = coins.length ? coins.map(c=>c.symbol) : Object.keys(FALLBACK);

  return (
    <div className="panel-3d" style={{ background:"rgba(6,13,46,0.55)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:10, overflow:"hidden", flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 13px", borderBottom:"1px solid rgba(10,26,92,0.6)", flexWrap:"wrap", gap:6 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <select value={sym} onChange={e=>setSym(e.target.value)} style={{ background:"rgba(4,7,26,0.85)", border:"1px solid rgba(192,57,43,0.35)", color:"white", fontSize:".68rem", fontWeight:700, padding:"4px 8px", borderRadius:6, outline:"none", cursor:"pointer", fontFamily:"var(--font-orbitron,monospace)", maxWidth:130 }}>
            {symbols.map(s=><option key={s} value={s}>{s}/USDT</option>)}
          </select>
          {stats.last>0 && <span style={{ fontSize:".6rem", color:stats.ch>=0?"var(--green)":"var(--red)", fontWeight:700 }}>{stats.ch>=0?"+":""}{stats.ch.toFixed(2)}%</span>}
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ display:"flex", gap:2 }}>
            {STYLES.map(([id,ic])=>(
              <button key={id} onClick={()=>setStyle(id)} title={id} style={{ padding:"3px 6px", borderRadius:5, fontSize:".7rem", cursor:"pointer", border:"none", background:style===id?"rgba(74,144,217,0.2)":"transparent", opacity:style===id?1:0.5 }}>{ic}</button>
            ))}
          </div>
          <div style={{ display:"flex", gap:2 }}>
            {TIMEFRAMES.map(t=>(
              <button key={t} onClick={()=>setTf(t)} style={{ padding:"3px 7px", borderRadius:5, fontSize:".56rem", fontWeight:700, cursor:"pointer", border:"none", background:tf===t?"rgba(192,57,43,0.2)":"transparent", color:tf===t?"var(--red)":"var(--muted)" }}>{t}</button>
            ))}
          </div>
        </div>
      </div>
      {/* Facteurs */}
      {stats.last>0 && (
        <div style={{ display:"flex", gap:16, padding:"5px 13px", borderBottom:"1px solid rgba(10,26,92,0.4)", fontSize:".56rem", color:"var(--muted2)", flexWrap:"wrap" }}>
          <span>Dernier <b style={{ color:"white" }}>${fmtPrice(stats.last)}</b></span>
          <span>Haut <b style={{ color:"var(--green)" }}>${fmtPrice(stats.high)}</b></span>
          <span>Bas <b style={{ color:"var(--red)" }}>${fmtPrice(stats.low)}</b></span>
        </div>
      )}
      <canvas ref={canvasRef} style={{ width:"100%", height:200, display:"block" }} />
    </div>
  );
}
