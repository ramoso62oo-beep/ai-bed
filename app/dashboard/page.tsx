"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const POSITIONS = [
  { sym:"BTCUSDT",    side:"LONG",  mode:"PATIENT",   entry:64125, current:64310, pnl:+0.29, sl:63612, tp:65279 },
  { sym:"TNSRUSDT",   side:"LONG",  mode:"ACTIF",     entry:.0436, current:.0441, pnl:+1.15, sl:.0432, tp:.0444 },
  { sym:"RESOLVUSDT", side:"SHORT", mode:"AGRESSIF",  entry:.0249, current:.0244, pnl:-2.01, sl:.0252, tp:.0238 },
  { sym:"STRAXUSDT",  side:"LONG",  mode:"ACTIF",     entry:.01084,current:.01091,pnl:+0.65, sl:.01075,tp:.01103 },
];
const WHALES = [
  { icon:"🐋", sym:"BTC", desc:"500M USDT sortis de Binance", val:"-1.2%", pos:false },
  { icon:"🟢", sym:"PEPE", desc:"Whale achète 2B tokens", val:"+18%", pos:true },
  { icon:"🔴", sym:"ETH", desc:"120M déplacés vers cold wallet", val:"-0.8%", pos:false },
  { icon:"🟢", sym:"SOL", desc:"Achat massif CEX → DEX", val:"+3.4%", pos:true },
];
const NEWS = [
  { title:"La SEC approuve 3 nouveaux ETF Bitcoin spot", tag:"BTC", time:"12 min" },
  { title:"Binance annonce le listing de 5 nouveaux memecoins", tag:"ALTCOINS", time:"28 min" },
  { title:"Elon Musk tweete sur DOGE — pump de 8% en cours", tag:"DOGE", time:"45 min" },
  { title:"MiCA : nouvelles règles européennes entrent en vigueur", tag:"RÉGULATION", time:"1h" },
  { title:"Solana dépasse 200$ — ATH historique approche", tag:"SOL", time:"2h" },
];
const AVATARS = ["🐂","🦅","🐉","🦁","🐺","🦊","🤖","👾","🎯","💀","🌙","⚡","🔥","💎","🚀","🌊","🎭","🏆","👑","⚔️"];

const MODE_COLOR: Record<string, string> = { PATIENT:"#4a90d9", ACTIF:"#27ae60", AGRESSIF:"#c0392b" };

export default function DashboardPage() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const [botOn, setBotOn] = useState(true);
  const [mode, setMode] = useState("ACTIF");
  const [balance, setBalance] = useState(9808.43);
  const [avatar, setAvatar] = useState(0);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [user, setUser] = useState<{email?:string;role?:string;plan?:string}>({});

  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem("aibed_user")||"{}")); } catch {}
  }, []);

  // Price chart
  useEffect(() => {
    const canvas = chartRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let prices: number[] = [];
    const base = 64194;
    for (let i=0;i<120;i++) prices.push(base + (Math.random()-.48)*800);
    let raf: number;
    const draw = () => {
      const W = canvas.width = canvas.offsetWidth;
      const H = canvas.height = canvas.offsetHeight;
      ctx.clearRect(0,0,W,H);
      const mn=Math.min(...prices)-50, mx=Math.max(...prices)+50, range=mx-mn;
      const pad={l:42,r:8,t:8,b:18};
      const W2=W-pad.l-pad.r, H2=H-pad.t-pad.b;
      // Grid
      for(let i=0;i<=4;i++){
        const y=pad.t+(H2/4)*i;
        ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);
        ctx.strokeStyle="rgba(10,26,92,0.4)";ctx.lineWidth=1;ctx.stroke();
        ctx.fillStyle="rgba(74,111,165,0.6)";ctx.font="9px Inter";
        ctx.fillText((mx-(range/4)*i).toFixed(0),2,y+3);
      }
      // Line
      ctx.beginPath();
      prices.forEach((p,i)=>{
        const x=pad.l+(i/(prices.length-1))*W2;
        const y=pad.t+(1-(p-mn)/range)*H2;
        i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      });
      ctx.strokeStyle="#c0392b";ctx.lineWidth=1.5;ctx.shadowBlur=6;ctx.shadowColor="#c0392b";ctx.stroke();ctx.shadowBlur=0;
      // Fill
      const lx=pad.l+W2, ly=pad.t+(1-(prices[prices.length-1]-mn)/range)*H2;
      ctx.lineTo(lx,H-pad.b);ctx.lineTo(pad.l,H-pad.b);ctx.closePath();
      const g=ctx.createLinearGradient(0,pad.t,0,H-pad.b);
      g.addColorStop(0,"rgba(192,57,43,0.2)");g.addColorStop(1,"rgba(192,57,43,0)");
      ctx.fillStyle=g;ctx.fill();
      // Dot
      ctx.beginPath();ctx.arc(lx,ly,3,0,Math.PI*2);
      ctx.fillStyle="#c0392b";ctx.shadowBlur=10;ctx.shadowColor="#c0392b";ctx.fill();ctx.shadowBlur=0;
    };
    const loop = () => { draw(); raf=requestAnimationFrame(loop); };
    loop();
    const interval = setInterval(() => {
      prices.push(prices[prices.length-1]+(Math.random()-.48)*120);
      if(prices.length>120)prices.shift();
      setBalance(b => parseFloat((b+(Math.random()-.49)*2).toFixed(2)));
    },2000);
    return () => { cancelAnimationFrame(raf); clearInterval(interval); };
  },[]);

  const isFounder = user.role === "founder";
  const sb: React.CSSProperties = { display:"flex", alignItems:"center", gap:10, padding:"9px 14px", fontSize:".7rem", color:"var(--muted)", cursor:"pointer", borderLeft:"2px solid transparent", textDecoration:"none", transition:"all .2s" };
  const kpi = (label: string, val: string, sub: string, color: string) => (
    <div style={{ background:"rgba(6,13,46,0.6)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:10, padding:"11px 13px" }}>
      <div style={{ fontSize:".56rem", color:"var(--muted)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:"1.05rem", fontWeight:700, color, fontVariantNumeric:"tabular-nums" }}>{val}</div>
      <div style={{ fontSize:".56rem", color:"var(--muted)", marginTop:2 }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ display:"grid", gridTemplateColumns:"210px 1fr", height:"100vh", background:"var(--navy)", overflow:"hidden" }}>

      {/* SIDEBAR */}
      <aside style={{ background:"rgba(6,13,46,0.95)", backdropFilter:"blur(20px)", borderRight:"1px solid rgba(10,26,92,0.6)", display:"flex", flexDirection:"column", paddingTop:56, overflow:"hidden" }}>
        {/* Bot */}
        <div style={{ padding:"16px 14px", borderBottom:"1px solid rgba(10,26,92,0.6)", textAlign:"center" }}>
          <div onClick={() => setShowAvatarPicker(!showAvatarPicker)} style={{ width:56, height:56, borderRadius:"50%", background:"rgba(10,26,92,0.4)", border:"2px solid var(--red)", margin:"0 auto 7px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.6rem", cursor:"pointer", boxShadow:"0 0 16px var(--red-glow)", transition:"transform .2s" }}
            onMouseEnter={e=>(e.currentTarget.style.transform="scale(1.08)")} onMouseLeave={e=>(e.currentTarget.style.transform="")}>
            {AVATARS[avatar]}
          </div>
          {showAvatarPicker && (
            <div style={{ position:"absolute", left:14, zIndex:100, background:"rgba(6,13,46,0.98)", border:"1px solid rgba(10,26,92,0.8)", borderRadius:10, padding:10, display:"flex", flexWrap:"wrap", gap:5, width:178 }}>
              {AVATARS.map((a,i)=>(
                <div key={i} onClick={()=>{setAvatar(i);setShowAvatarPicker(false);}} style={{ width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem", cursor:"pointer", border:avatar===i?"1px solid var(--red)":"1px solid transparent", background:avatar===i?"rgba(192,57,43,0.1)":"transparent" }}>{a}</div>
              ))}
            </div>
          )}
          <div style={{ fontSize:".65rem", fontWeight:700, color:"var(--red)", letterSpacing:".1em" }}>BOT #{avatar+1}</div>
          <div style={{ fontSize:".55rem", color:"var(--muted)", marginTop:2 }}>Mode {mode} • {botOn?"En ligne":"En pause"}</div>
          {/* Toggle */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:9 }}>
            <div onClick={()=>setBotOn(!botOn)} style={{ width:34, height:17, borderRadius:9, background:botOn?"rgba(39,174,96,0.3)":"rgba(192,57,43,0.2)", border:`1px solid ${botOn?"rgba(39,174,96,0.4)":"rgba(192,57,43,0.3)"}`, position:"relative", cursor:"pointer", transition:"all .2s" }}>
              <div style={{ width:11, height:11, borderRadius:"50%", background:botOn?"var(--green)":"var(--red)", position:"absolute", top:2, left:botOn?20:2, transition:"left .2s" }}/>
            </div>
            <span style={{ fontSize:".58rem", color:botOn?"var(--green)":"var(--red)", fontWeight:700 }}>{botOn?"Actif":"Pause"}</span>
          </div>
          {isFounder && <div style={{ marginTop:7, fontSize:".52rem", background:"rgba(192,57,43,0.1)", border:"1px solid rgba(192,57,43,0.3)", borderRadius:10, padding:"2px 8px", color:"var(--red)", fontWeight:700, letterSpacing:".08em" }}>👑 FONDATEUR</div>}
        </div>

        {/* Nav */}
        <div style={{ padding:"6px 0", flex:1 }}>
          {[["📊","Dashboard",true],["🤖","Mes bots",false],["📈","Positions",false],["🐋","Whale Tracker",false],["⚡","Signaux IA",false]].map(([ic,lb,act])=>(
            <div key={String(lb)} style={{ ...sb, color:act?"white":"var(--muted)", borderLeftColor:act?"var(--red)":"transparent", background:act?"rgba(192,57,43,0.06)":"transparent" }}>
              <span>{ic}</span><span>{lb}</span>
            </div>
          ))}
          <div style={{ padding:"6px 14px 4px", fontSize:".5rem", color:"#1a3a6e", textTransform:"uppercase", letterSpacing:".18em", marginTop:8 }}>Compte</div>
          {[["💼","Portefeuille"],["📰","Actualités"],["⚙️","Paramètres"]].map(([ic,lb])=>(
            <div key={String(lb)} style={sb}><span>{ic}</span><span>{lb}</span></div>
          ))}
          <Link href="/" style={{ ...sb, marginTop:4 }}><span>🚪</span><span>Déconnexion</span></Link>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" }}>

        {/* Topbar */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"0 18px", height:56, borderBottom:"1px solid rgba(10,26,92,0.6)", background:"rgba(4,7,26,0.8)", flexShrink:0, zIndex:10 }}>
          <span style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:".75rem", fontWeight:700, color:"white", letterSpacing:".12em" }}>Dashboard</span>
          <div style={{ display:"flex", gap:6, marginLeft:12 }}>
            {["PATIENT","ACTIF","AGRESSIF"].map(m=>(
              <button key={m} onClick={()=>setMode(m)} style={{ fontSize:".58rem", fontWeight:700, padding:"4px 11px", borderRadius:20, cursor:"pointer", border:`1px solid ${MODE_COLOR[m]}`, color:mode===m?"white":MODE_COLOR[m], background:mode===m?MODE_COLOR[m]:"transparent", letterSpacing:".08em", transition:"all .2s" }}>{m}</button>
            ))}
          </div>
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:".68rem", color:"var(--muted)" }}>{user.email || "trader@ai-bed.com"}</span>
            <div style={{ width:30, height:30, borderRadius:"50%", background:"var(--red)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".7rem", fontWeight:700, color:"white" }}>
              {(user.email||"T")[0].toUpperCase()}
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, padding:"10px 16px", flexShrink:0 }}>
          {kpi("Portefeuille", `${balance.toLocaleString("fr-FR",{maximumFractionDigits:2})} $`, `+${(balance-9808).toFixed(2)}$ vs départ`, "white")}
          {kpi("PnL Aujourd'hui", "+4.23%", "+412 USDT", "var(--green)")}
          {kpi("Positions actives", "4 / 10", "3 en profit", "var(--blue)")}
          {kpi("Signaux Whale", "2", "Alerte PEPE & BTC", "#fbbf24")}
          {kpi("Bot statut", botOn?"EN LIGNE":"EN PAUSE", "Depuis 4h32", botOn?"var(--green)":"var(--red)")}
        </div>

        {/* Grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:8, padding:"0 16px 10px", flex:1, overflow:"hidden", minHeight:0 }}>

          <div style={{ display:"flex", flexDirection:"column", gap:8, minHeight:0, overflow:"hidden" }}>
            {/* Chart */}
            <div style={{ background:"rgba(6,13,46,0.55)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:10, overflow:"hidden", flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 13px", borderBottom:"1px solid rgba(10,26,92,0.6)" }}>
                <span style={{ fontSize:".66rem", fontWeight:700, color:"white", textTransform:"uppercase", letterSpacing:".08em" }}>📈 BTC/USDT — Temps réel</span>
                <select style={{ background:"rgba(4,7,26,0.8)", border:"1px solid rgba(10,26,92,0.6)", color:"var(--muted)", fontSize:".6rem", padding:"3px 7px", borderRadius:4, outline:"none" }}>
                  <option>1m</option><option>5m</option><option>15m</option><option>1h</option><option>1j</option>
                </select>
              </div>
              <canvas ref={chartRef} style={{ width:"100%", height:140, display:"block" }} />
            </div>

            {/* Positions */}
            <div style={{ background:"rgba(6,13,46,0.55)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:10, flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 13px", borderBottom:"1px solid rgba(10,26,92,0.6)", flexShrink:0 }}>
                <span style={{ fontSize:".66rem", fontWeight:700, color:"white", textTransform:"uppercase", letterSpacing:".08em" }}>📋 Positions ouvertes</span>
                <button style={{ fontSize:".6rem", background:"rgba(192,57,43,0.1)", border:"1px solid rgba(192,57,43,0.3)", color:"var(--red)", padding:"4px 10px", borderRadius:5, cursor:"pointer" }}>+ Nouvelle</button>
              </div>
              <div style={{ overflow:"auto", flex:1 }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:".64rem" }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid rgba(10,26,92,0.4)" }}>
                      {["Paire","Mode","Entrée","Actuel","PnL","SL / TP",""].map(h=>(
                        <th key={h} style={{ padding:"6px 10px", color:"#1a3a6e", fontSize:".54rem", textTransform:"uppercase", letterSpacing:".1em", textAlign:"left", fontWeight:600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {POSITIONS.map(p=>(
                      <tr key={p.sym} style={{ borderBottom:"1px solid rgba(10,26,92,0.3)" }}>
                        <td style={{ padding:"8px 10px", fontWeight:700, color:"white" }}>{p.sym}</td>
                        <td style={{ padding:"8px 10px" }}><span style={{ fontSize:".52rem", padding:"2px 6px", borderRadius:3, fontWeight:700, letterSpacing:".08em", background:`${MODE_COLOR[p.mode]}18`, color:MODE_COLOR[p.mode] }}>{p.mode}</span></td>
                        <td style={{ padding:"8px 10px", color:"var(--muted2)" }}>{p.entry}</td>
                        <td style={{ padding:"8px 10px", color:"var(--muted2)" }}>{p.current}</td>
                        <td style={{ padding:"8px 10px", color:p.pnl>=0?"var(--green)":"var(--red)", fontWeight:700 }}>{p.pnl>=0?"+":""}{p.pnl}%</td>
                        <td style={{ padding:"8px 10px", color:"var(--muted)", fontSize:".6rem" }}>{p.sl} / {p.tp}</td>
                        <td style={{ padding:"8px 10px" }}><button style={{ background:"rgba(192,57,43,0.08)", border:"1px solid rgba(192,57,43,0.25)", borderRadius:4, color:"var(--red)", fontSize:".56rem", padding:"3px 7px", cursor:"pointer" }}>Fermer</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display:"flex", flexDirection:"column", gap:8, minHeight:0, overflow:"hidden" }}>
            {/* Whale */}
            <div style={{ background:"rgba(6,13,46,0.55)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:10, overflow:"hidden" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 12px", borderBottom:"1px solid rgba(10,26,92,0.6)" }}>
                <span style={{ fontSize:".64rem", fontWeight:700, color:"white", textTransform:"uppercase", letterSpacing:".08em" }}>🐋 Whale Tracker</span>
                <span style={{ fontSize:".55rem", color:"var(--green)", display:"flex", alignItems:"center", gap:4 }}><span style={{ width:5, height:5, borderRadius:"50%", background:"var(--green)", display:"inline-block" }}/>Live</span>
              </div>
              <div style={{ padding:"10px 12px", display:"flex", flexDirection:"column", gap:6 }}>
                {WHALES.map((w,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 8px", background:"rgba(4,7,26,0.4)", borderRadius:6, border:"1px solid rgba(10,26,92,0.6)" }}>
                    <span style={{ fontSize:".85rem" }}>{w.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:".65rem", fontWeight:700, color:"white" }}>{w.sym}</div>
                      <div style={{ fontSize:".58rem", color:"var(--muted)" }}>{w.desc}</div>
                    </div>
                    <span style={{ fontSize:".65rem", fontWeight:700, color:w.pos?"var(--green)":"var(--red)" }}>{w.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* News */}
            <div style={{ background:"rgba(6,13,46,0.55)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:10, overflow:"hidden", flex:1, display:"flex", flexDirection:"column" }}>
              <div style={{ padding:"9px 12px", borderBottom:"1px solid rgba(10,26,92,0.6)", flexShrink:0 }}>
                <span style={{ fontSize:".64rem", fontWeight:700, color:"white", textTransform:"uppercase", letterSpacing:".08em" }}>📰 Actualités IA</span>
              </div>
              <div style={{ padding:"10px 12px", display:"flex", flexDirection:"column", gap:6, overflow:"auto", flex:1 }}>
                {NEWS.map((n,i)=>(
                  <div key={i} style={{ padding:"7px 9px", background:"rgba(4,7,26,0.4)", borderRadius:6, border:"1px solid rgba(10,26,92,0.6)", cursor:"pointer" }}>
                    <div style={{ fontSize:".64rem", color:"var(--text)", fontWeight:500, lineHeight:1.4, marginBottom:3 }}>{n.title}</div>
                    <div style={{ display:"flex", gap:8, fontSize:".56rem" }}>
                      <span style={{ color:"var(--red)" }}>{n.tag}</span>
                      <span style={{ color:"var(--muted)" }}>il y a {n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
