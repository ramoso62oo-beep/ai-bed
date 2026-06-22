"use client";
import { useEffect, useRef, useState } from "react";

type Candle = { o:number; h:number; l:number; c:number; v:number };
const TIMEFRAMES = ["1m","5m","15m","1h","1j"];

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

export default function CandleChart({ pair="BTC/USDT" }: { pair?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tf, setTf] = useState("15m");
  const candlesRef = useRef<Candle[]>([]);

  // (Re)génère les bougies quand le timeframe change
  useEffect(() => {
    const vol = tf==="1m"?180 : tf==="5m"?320 : tf==="15m"?520 : tf==="1h"?900 : 1600;
    candlesRef.current = genCandles(60, 64000, vol);
  }, [tf]);

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

    let tick = 0;
    function draw() {
      const candles = candlesRef.current;
      if (!candles.length) { raf = requestAnimationFrame(draw); return; }
      const r = canvas!.getBoundingClientRect();
      const W = r.width, H = r.height;
      const padR = 56, padB = 34, padT = 8;
      const cw = W - padR;
      const ch = H - padB - padT;

      // Animer la dernière bougie
      tick++;
      if (tick % 8 === 0) {
        const last = candles[candles.length-1];
        last.c = Math.max(last.c + (Math.random()-0.5)*120, last.l);
        last.h = Math.max(last.h, last.c);
        last.l = Math.min(last.l, last.c);
      }

      const hi = Math.max(...candles.map(c=>c.h));
      const lo = Math.min(...candles.map(c=>c.l));
      const range = hi-lo || 1;
      const maxV = Math.max(...candles.map(c=>c.v));
      const y = (p:number)=> padT + (1-(p-lo)/range)*ch;

      ctx!.clearRect(0,0,W,H);

      // Grille + axe prix
      ctx!.font = "9px monospace"; ctx!.textBaseline = "middle";
      for (let i=0;i<=4;i++){
        const yy = padT + (ch/4)*i;
        const price = hi - (range/4)*i;
        ctx!.strokeStyle = "rgba(10,26,92,0.4)"; ctx!.lineWidth=1;
        ctx!.beginPath(); ctx!.moveTo(0,yy); ctx!.lineTo(cw,yy); ctx!.stroke();
        ctx!.fillStyle = "#4a6080";
        ctx!.fillText(price.toFixed(0), cw+6, yy);
      }

      const n = candles.length;
      const slot = cw / n;
      const bodyW = Math.max(slot*0.6, 2);

      candles.forEach((c,i)=>{
        const cx = slot*i + slot/2;
        const up = c.c >= c.o;
        const col = up ? "#27ae60" : "#c0392b";

        // Volume (bas)
        const vh = (c.v/maxV) * (padB-8);
        ctx!.fillStyle = up ? "rgba(39,174,96,0.25)" : "rgba(192,57,43,0.25)";
        ctx!.fillRect(cx-bodyW/2, H-padB+8+(padB-8-vh), bodyW, vh);

        // Mèche
        ctx!.strokeStyle = col; ctx!.lineWidth = 1;
        ctx!.beginPath(); ctx!.moveTo(cx, y(c.h)); ctx!.lineTo(cx, y(c.l)); ctx!.stroke();

        // Corps
        const yo = y(c.o), yc = y(c.c);
        ctx!.fillStyle = col;
        ctx!.fillRect(cx-bodyW/2, Math.min(yo,yc), bodyW, Math.max(Math.abs(yc-yo),1));
      });

      // Ligne de prix actuel
      const lastC = candles[candles.length-1].c;
      const ly = y(lastC);
      ctx!.strokeStyle = "rgba(74,144,217,0.6)"; ctx!.setLineDash([3,3]); ctx!.lineWidth=1;
      ctx!.beginPath(); ctx!.moveTo(0,ly); ctx!.lineTo(cw,ly); ctx!.stroke(); ctx!.setLineDash([]);
      ctx!.fillStyle = "#4a90d9"; ctx!.fillRect(cw, ly-8, padR, 16);
      ctx!.fillStyle = "white"; ctx!.font = "bold 9px monospace"; ctx!.textAlign="left";
      ctx!.fillText(lastC.toFixed(0), cw+6, ly);

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [tf]);

  return (
    <div style={{ background:"rgba(6,13,46,0.55)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:10, overflow:"hidden", flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 13px", borderBottom:"1px solid rgba(10,26,92,0.6)" }}>
        <span style={{ fontSize:".66rem", fontWeight:700, color:"white", textTransform:"uppercase", letterSpacing:".08em" }}>📊 {pair} — Bougies</span>
        <div style={{ display:"flex", gap:4 }}>
          {TIMEFRAMES.map(t=>(
            <button key={t} onClick={()=>setTf(t)} style={{ padding:"3px 9px", borderRadius:5, fontSize:".58rem", fontWeight:700, cursor:"pointer", border:"none",
              background:tf===t?"rgba(192,57,43,0.18)":"transparent", color:tf===t?"var(--red)":"var(--muted)" }}>{t}</button>
          ))}
        </div>
      </div>
      <canvas ref={canvasRef} style={{ width:"100%", height:200, display:"block" }} />
    </div>
  );
}
