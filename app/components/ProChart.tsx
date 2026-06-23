"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { createChart, CandlestickSeries, HistogramSeries, ColorType, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";

type K = { t:number; o:number; h:number; l:number; c:number; v:number };
const TF: [string,string,number][] = [
  ["1s","1s",2000],["1m","1m",4000],["5m","5m",6000],["15m","15m",8000],["1h","1h",12000],["4h","4h",15000],["1j","1d",20000],
];

export default function ProChart({ pair="BTC" }: { pair?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi|null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick">|null>(null);
  const volRef = useRef<ISeriesApi<"Histogram">|null>(null);
  const initedRef = useRef(false);

  const [sym, setSym] = useState(pair.replace("/USDT",""));
  const [tf, setTf] = useState("1m");
  const [coins, setCoins] = useState<string[]>([]);
  const [info, setInfo] = useState({ price:0, ch:0, high:0, low:0, src:"" });

  useEffect(() => {
    fetch("/api/market?type=crypto").then(r=>r.json()).then(d=>{
      const list = (d.coins||[]).map((c:{symbol:string})=>c.symbol).filter(Boolean);
      if (list.length) setCoins(list);
    }).catch(()=>{});
  }, []);

  // Création du graphique (une fois)
  useEffect(() => {
    const el = containerRef.current; if (!el || initedRef.current) return;
    initedRef.current = true;
    const chart = createChart(el, {
      width: el.clientWidth, height: el.clientHeight || 360,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#7a95b5", fontSize: 11 },
      grid: { vertLines: { color: "rgba(10,26,92,0.35)" }, horzLines: { color: "rgba(10,26,92,0.35)" } },
      rightPriceScale: { borderColor: "rgba(10,26,92,0.6)" },
      timeScale: { borderColor: "rgba(10,26,92,0.6)", timeVisible: true, secondsVisible: true },
      crosshair: { mode: 1 },
      autoSize: false,
    });
    chartRef.current = chart;
    candleRef.current = chart.addSeries(CandlestickSeries, {
      upColor: "#27ae60", downColor: "#c0392b", borderVisible: false,
      wickUpColor: "#27ae60", wickDownColor: "#c0392b",
    });
    volRef.current = chart.addSeries(HistogramSeries, { priceScaleId: "", priceFormat: { type: "volume" } });
    volRef.current.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    const ro = new ResizeObserver(() => { if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight }); });
    ro.observe(el);
    return () => { ro.disconnect(); chart.remove(); chartRef.current=null; candleRef.current=null; volRef.current=null; initedRef.current=false; };
  }, []);

  const dataRef = useRef<K[]>([]);
  const loadingMore = useRef(false);

  const fetchKlines = useCallback(async (endTime?:number) => {
    const interval = (TF.find(t=>t[0]===tf)||TF[1])[1];
    try {
      const d = await fetch(`/api/klines?symbol=${sym}USDT&interval=${interval}&limit=1000${endTime?`&endTime=${endTime}`:""}`).then(r=>r.json());
      return (d.candles || []) as K[];
    } catch { return []; }
  }, [sym, tf]);

  const draw = useCallback((candles:K[]) => {
    if (!candleRef.current) return;
    candleRef.current.setData(candles.map(k=>({ time: k.t as UTCTimestamp, open:k.o, high:k.h, low:k.l, close:k.c })));
    volRef.current?.setData(candles.map(k=>({ time: k.t as UTCTimestamp, value:k.v, color: k.c>=k.o ? "rgba(39,174,96,0.4)" : "rgba(192,57,43,0.4)" })));
  }, []);

  // Chargement initial + temps réel + historique au scroll
  useEffect(() => {
    let active = true;
    dataRef.current = [];
    (async () => {
      const candles = await fetchKlines();
      if (!active || !candleRef.current || !candles.length) return;
      dataRef.current = candles;
      draw(candles);
      chartRef.current?.timeScale().fitContent();
      const last=candles[candles.length-1], open0=candles[0].o;
      setInfo({ price:last.c, ch: open0?((last.c-open0)/open0)*100:0, high:Math.max(...candles.map(c=>c.h)), low:Math.min(...candles.map(c=>c.l)), src:"Binance" });
    })();

    // Charge l'historique quand on scrolle vers la gauche (passé)
    const onRange = async (range: { from:number }|null) => {
      if (!range || loadingMore.current || range.from > 8 || dataRef.current.length < 50) return;
      loadingMore.current = true;
      const oldest = dataRef.current[0];
      const older = await fetchKlines(oldest.t*1000 - 1);
      if (older.length) {
        const merged = [...older.filter(k=>k.t < oldest.t), ...dataRef.current];
        dataRef.current = merged;
        draw(merged);
      }
      loadingMore.current = false;
    };
    const ts = chartRef.current?.timeScale();
    ts?.subscribeVisibleLogicalRangeChange(onRange);

    // Mise à jour temps réel (dernière bougie, sans casser le zoom)
    const period = (TF.find(t=>t[0]===tf)||TF[1])[2];
    const id = setInterval(async () => {
      const candles = await fetchKlines();
      if (!candleRef.current || !candles.length) return;
      const last = candles[candles.length-1];
      candleRef.current.update({ time: last.t as UTCTimestamp, open:last.o, high:last.h, low:last.l, close:last.c });
      volRef.current?.update({ time: last.t as UTCTimestamp, value:last.v, color: last.c>=last.o ? "rgba(39,174,96,0.4)" : "rgba(192,57,43,0.4)" });
      if (dataRef.current.length) dataRef.current[dataRef.current.length-1] = last;
      setInfo(prev=>({ ...prev, price:last.c }));
    }, period);

    return () => { active=false; clearInterval(id); ts?.unsubscribeVisibleLogicalRangeChange(onRange); };
  }, [fetchKlines, tf, draw]);

  const symbols = coins.length ? coins : ["BTC","ETH","SOL","BNB","XRP","DOGE"];

  return (
    <div className="panel-3d" style={{ background:"rgba(6,13,46,0.55)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:10, overflow:"hidden", flexShrink:0, display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 13px", borderBottom:"1px solid rgba(10,26,92,0.6)", flexWrap:"wrap", gap:6 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <select value={sym} onChange={e=>setSym(e.target.value)} style={{ background:"rgba(4,7,26,0.85)", border:"1px solid rgba(192,57,43,0.35)", color:"white", fontSize:".68rem", fontWeight:700, padding:"4px 8px", borderRadius:6, outline:"none", cursor:"pointer", fontFamily:"var(--font-orbitron,monospace)", maxWidth:120 }}>
            {symbols.map(s=><option key={s} value={s}>{s}/USDT</option>)}
          </select>
          {info.price>0 && <span style={{ fontSize:".74rem", color:"white", fontWeight:700 }}>${info.price.toLocaleString("fr-FR",{maximumFractionDigits:info.price<1?6:2})}</span>}
          {info.price>0 && <span style={{ fontSize:".62rem", color:info.ch>=0?"var(--green)":"var(--red)", fontWeight:700 }}>{info.ch>=0?"+":""}{info.ch.toFixed(2)}%</span>}
          {info.src && <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:".52rem", color:"var(--green)" }}><span style={{ width:5, height:5, borderRadius:"50%", background:"var(--green)", animation:"pulse-red 1.5s infinite" }}/>{info.src}</span>}
        </div>
        <div style={{ display:"flex", gap:2, flexWrap:"wrap" }}>
          {TF.map(([lb])=>(<button key={lb} onClick={()=>setTf(lb)} style={{ padding:"3px 8px", borderRadius:5, fontSize:".58rem", fontWeight:700, cursor:"pointer", border:"none", background:tf===lb?"rgba(192,57,43,0.2)":"transparent", color:tf===lb?"var(--red)":"var(--muted)" }}>{lb}</button>))}
        </div>
      </div>
      <div ref={containerRef} style={{ width:"100%", height:340, flex:1 }} />
      <div style={{ fontSize:".5rem", color:"var(--muted)", padding:"3px 13px", borderTop:"1px solid rgba(10,26,92,0.4)" }}>🖱️ Glissez pour vous déplacer · molette pour zoomer · double-clic pour réinitialiser</div>
    </div>
  );
}
