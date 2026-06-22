"use client";
import { useEffect, useRef, useState } from "react";

type Candle = { o:number; h:number; l:number; c:number; v:number };
const TIMEFRAMES = ["1s","1m","5m","15m","1h","1j"];
const PAIRS: Record<string, number> = {
  "BTC/USDT": 64310, "ETH/USDT": 3420, "SOL/USDT": 198,
  "BNB/USDT": 592, "XRP/USDT": 0.62, "DOGE/USDT": 0.164, "PEPE/USDT": 0.0000132,
};

function genCandles(n:number, start:number, vol:number): Candle[] {
  const out: Candle[] = [];
  let price = start;
  for (let i=0;i<n;i++){
    const o = price;
    const move = (Math.random()-0.5) * vol;
    const c = Math.max(o + move, o*0.85);
    const h = Math.max(o,c) + Math.random()*vol*0.5;
    const l = Math.min(o,c) - Math.random()*vol*0.5;
    out.push({ o, h, l, c, v: Math.random()*100+20 });
    price = c;
  }
  return out;
}
function fmtPrice(p:number){ return p>=100 ? p.toFixed(0) : p>=1 ? p.toFixed(2) : p>=0.001 ? p.toFixed(4) : p.toExponential(2); }

export default function CandleChart({ pair="BTC/USDT" }: { pair?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sym, setSym] = useState(pair);
  const [tf, setTf] = useState("1m");
  const candlesRef = useRef<Candle[]>([]);

  // (Re)génère les bougies quand la crypto ou le timeframe change
  useEffect(() => {
    const base = PAIRS[sym] ?? 100;
    const factor = tf==="1s"?0.0006 : tf==="1m"?0.003 : tf==="5m"?0.006 : tf==="15m"?0.01 : tf==="1h"?0.018 : 0.03;
    candlesRef.current = genCandles(60, base, base*factor);
  }, [tf, sym]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let raf = 0;

    function resize() {
      const r = canvas!.getBoundingClientRect();
      canvas!.width = r.width * devicePixelRatio;
      canvas!.height = r.height * devicePixelRatio;
      ctx!.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
    }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);

    // Pour le 1s, la dernière bougie bouge plus vite
    const speed = tf==="1s" ? 3 : 8;
    let tick = 0;
    function draw() {
      const candles = candlesRef.current;
      if (!candles.length) { raf = requestAnimationFrame(draw); return; }
      const r = canvas!.getBoundingClientRect();
      const W = r.width, H = r.height;
      const padR = 60, padB = 34, padT = 8;
      const cw = W - padR;
      const ch = H - padB - padT;

      tick++;
      if (tick % speed === 0) {
        const base = PAIRS[sym] ?? 100;
        const last = candles[candles.length-1];
        last.c = Math.max(last.c + (Math.random()-0.5)*base*0.0025, last.l*0.999);
        last.h = Math.max(last.h, last.c);
        last.l = Math.min(last.l, last.c);
      }

      const hi = Math.max(...candles.map(c=>c.h));
      const lo = Math.min(...candles.map(c=>c.l));
      const range = hi-lo || 1;
      const maxV = Math.max(...candles.map(c=>c.v));
      const y = (p:number)=> padT + (1-(p-lo)/range)*ch;

      ctx!.clearRect(0,0,W,H);
      ctx!.font = "9px monospace"; ctx!.textBaseline = "middle"; ctx!.textAlign = "left";
      for (let i=0;i<=4;i++){
        const yy = padT + (ch/4)*i;
        const price = hi - (range/4)*i;
        ctx!.strokeStyle = "rgba(10,26,92,0.4)"; ctx!.lineWidth=1;
        ctx!.beginPath(); ctx!.moveTo(0,yy); ctx!.lineTo(cw,yy); ctx!.stroke();
        ctx!.fillStyle = "#4a6080";
        ctx!.fillText(fmtPrice(price), cw+6, yy);
      }

      const n = candles.length;
      const slot = cw / n;
      const bodyW = Math.max(slot*0.6, 2);
      candles.forEach((c,i)=>{
        const cx = slot*i + slot/2;
        const up = c.c >= c.o;
        const col = up ? "#27ae60" : "#c0392b";
        const vh = (c.v/maxV) * (padB-8);
        ctx!.fillStyle = up ? "rgba(39,174,96,0.25)" : "rgba(192,57,43,0.25)";
        ctx!.fillRect(cx-bodyW/2, H-padB+8+(padB-8-vh), bodyW, vh);
        ctx!.strokeStyle = col; ctx!.lineWidth = 1;
        ctx!.beginPath(); ctx!.moveTo(cx, y(c.h)); ctx!.lineTo(cx, y(c.l)); ctx!.stroke();
        const yo = y(c.o), yc = y(c.c);
        ctx!.fillStyle = col;
        ctx!.fillRect(cx-bodyW/2, Math.min(yo,yc), bodyW, Math.max(Math.abs(yc-yo),1));
      });

      const lastC = candles[candles.length-1].c;
      const ly = y(lastC);
      ctx!.strokeStyle = "rgba(74,144,217,0.6)"; ctx!.setLineDash([3,3]); ctx!.lineWidth=1;
      ctx!.beginPath(); ctx!.moveTo(0,ly); ctx!.lineTo(cw,ly); ctx!.stroke(); ctx!.setLineDash([]);
      ctx!.fillStyle = "#4a90d9"; ctx!.fillRect(cw, ly-8, padR, 16);
      ctx!.fillStyle = "white"; ctx!.font = "bold 9px monospace";
      ctx!.fillText(fmtPrice(lastC), cw+5, ly);

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [tf, sym]);

  return (
    <div className="panel-3d" style={{ background:"rgba(6,13,46,0.55)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:10, overflow:"hidden", flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 13px", borderBottom:"1px solid rgba(10,26,92,0.6)", flexWrap:"wrap", gap:6 }}>
        <select value={sym} onChange={e=>setSym(e.target.value)}
          style={{ background:"rgba(4,7,26,0.85)", border:"1px solid rgba(192,57,43,0.35)", color:"white", fontSize:".68rem", fontWeight:700, padding:"4px 8px", borderRadius:6, outline:"none", cursor:"pointer", fontFamily:"var(--font-orbitron,monospace)" }}>
          {Object.keys(PAIRS).map(p=><option key={p} value={p}>📊 {p}</option>)}
        </select>
        <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
          {TIMEFRAMES.map(t=>(
            <button key={t} onClick={()=>setTf(t)} style={{ padding:"3px 8px", borderRadius:5, fontSize:".58rem", fontWeight:700, cursor:"pointer", border:"none",
              background:tf===t?"rgba(192,57,43,0.2)":"transparent", color:tf===t?"var(--red)":"var(--muted)" }}>{t}</button>
          ))}
        </div>
      </div>
      <canvas ref={canvasRef} style={{ width:"100%", height:210, display:"block" }} />
    </div>
  );
}
