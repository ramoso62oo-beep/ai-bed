"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import TokenTable from "../components/TokenTable";
import CandleChart from "../components/CandleChart";
import Tooltip from "../components/Tooltip";
import WhaleFeed from "../components/WhaleFeed";
import NewsFeed from "../components/NewsFeed";
import Tilt3D from "../components/Tilt3D";

const POSITIONS = [
  { sym:"BTCUSDT",    side:"LONG",  mode:"PATIENT",   entry:64125, current:64310, pnl:+0.29, sl:63612, tp:65279 },
  { sym:"TNSRUSDT",   side:"LONG",  mode:"ACTIF",     entry:.0436, current:.0441, pnl:+1.15, sl:.0432, tp:.0444 },
  { sym:"RESOLVUSDT", side:"SHORT", mode:"AGRESSIF",  entry:.0249, current:.0244, pnl:-2.01, sl:.0252, tp:.0238 },
  { sym:"STRAXUSDT",  side:"LONG",  mode:"ACTIF",     entry:.01084,current:.01091,pnl:+0.65, sl:.01075,tp:.01103 },
];
const AVATARS = ["🐂","🦅","🐉","🦁","🐺","🦊","🤖","👾","🎯","💀","🌙","⚡","🔥","💎","🚀","🌊","🎭","🏆","👑","⚔️"];

const MODE_COLOR: Record<string, string> = { PATIENT:"#4a90d9", ACTIF:"#27ae60", AGRESSIF:"#c0392b" };
const MODE_TIP: Record<string, string> = {
  PATIENT: "Mode prudent : peu de trades, faible risque, vise une croissance lente et régulière (15–40%/an).",
  ACTIF: "Mode équilibré : swing trading, risque modéré, plus de positions (40–120%/an).",
  AGRESSIF: "Mode offensif : scalping rapide, risque élevé, gains et pertes potentiellement importants (100–500%/an).",
};

export default function DashboardPage() {
  const [botOn, setBotOn] = useState(true);
  const [mode, setMode] = useState("ACTIF");
  const [balance, setBalance] = useState(9808.43);
  const [posList, setPosList] = useState(POSITIONS);
  const [navOpen, setNavOpen] = useState(false);
  const [avatar, setAvatar] = useState(0);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [user, setUser] = useState<{email?:string;role?:string;plan?:string}>({});
  const { data: session } = useSession();

  useEffect(() => {
    // Priorité à la session Google si présente, sinon localStorage
    if (session?.user?.email) {
      const u = session.user as { email?:string; role?:string; plan?:string };
      setUser({ email:u.email, role:u.role, plan:u.plan });
    } else {
      try { setUser(JSON.parse(localStorage.getItem("aibed_user")||"{}")); } catch {}
    }
  }, [session]);

  // Mise à jour du solde en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setBalance(b => parseFloat((b+(Math.random()-.49)*2).toFixed(2)));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const isFounder = user.role === "founder";
  const sb: React.CSSProperties = { display:"flex", alignItems:"center", gap:10, padding:"9px 14px", fontSize:".7rem", color:"var(--muted)", cursor:"pointer", borderLeft:"2px solid transparent", textDecoration:"none", transition:"all .2s" };
  const kpi = (label: string, val: string, sub: string, color: string) => (
    <Tilt3D style={{ background:"rgba(6,13,46,0.6)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:10, padding:"11px 13px" }}>
      <div style={{ fontSize:".56rem", color:"var(--muted)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:"1.05rem", fontWeight:700, color, fontVariantNumeric:"tabular-nums" }}>{val}</div>
      <div style={{ fontSize:".56rem", color:"var(--muted)", marginTop:2 }}>{sub}</div>
    </Tilt3D>
  );

  return (
    <div className="dash-root" style={{ display:"grid", gridTemplateColumns:"210px 1fr", height:"100vh", background:"var(--navy)", overflow:"hidden" }}>

      {/* Fond cliquable mobile */}
      <div className={`dash-backdrop ${navOpen?"open":""}`} onClick={()=>setNavOpen(false)} />

      {/* SIDEBAR */}
      <aside className={`dash-aside ${navOpen?"open":""}`} style={{ background:"rgba(6,13,46,0.95)", backdropFilter:"blur(20px)", borderRight:"1px solid rgba(10,26,92,0.6)", display:"flex", flexDirection:"column", paddingTop:56, overflow:"hidden" }}>
        {/* Bouton fermer (mobile) */}
        <button className="burger" onClick={()=>setNavOpen(false)} style={{ position:"absolute", top:10, right:10, background:"rgba(192,57,43,0.15)", border:"1px solid rgba(192,57,43,0.3)", color:"var(--red)", borderRadius:7, width:30, height:30, fontSize:"1rem", cursor:"pointer", alignItems:"center", justifyContent:"center" }}>✕</button>
        {/* Bot */}
        <div style={{ padding:"16px 14px", borderBottom:"1px solid rgba(10,26,92,0.6)", textAlign:"center" }}>
          <div className="float-3d" onClick={() => setShowAvatarPicker(!showAvatarPicker)} style={{ width:56, height:56, borderRadius:"50%", background:"rgba(10,26,92,0.4)", border:"2px solid var(--red)", margin:"0 auto 7px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.6rem", cursor:"pointer", boxShadow:"0 0 16px var(--red-glow)" }}>
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
          <Tooltip text={botOn ? "Le bot est ACTIF : il analyse le marché et ouvre/ferme des positions automatiquement. Cliquez pour le mettre en pause." : "Le bot est EN PAUSE : il ne prend aucune nouvelle position. Cliquez pour le réactiver."}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:9, cursor:"pointer" }}>
              <div onClick={()=>setBotOn(!botOn)} style={{ width:34, height:17, borderRadius:9, background:botOn?"rgba(39,174,96,0.3)":"rgba(192,57,43,0.2)", border:`1px solid ${botOn?"rgba(39,174,96,0.4)":"rgba(192,57,43,0.3)"}`, position:"relative", cursor:"pointer", transition:"all .2s" }}>
                <div style={{ width:11, height:11, borderRadius:"50%", background:botOn?"var(--green)":"var(--red)", position:"absolute", top:2, left:botOn?20:2, transition:"left .2s" }}/>
              </div>
              <span style={{ fontSize:".58rem", color:botOn?"var(--green)":"var(--red)", fontWeight:700 }}>{botOn?"Actif":"Pause"}</span>
            </div>
          </Tooltip>
          {isFounder && <div style={{ display:"inline-block", marginTop:8, fontSize:".52rem", background:"rgba(192,57,43,0.1)", border:"1px solid rgba(192,57,43,0.3)", borderRadius:20, padding:"3px 10px", color:"var(--red)", fontWeight:700, letterSpacing:".08em" }}>👑 FONDATEUR</div>}
        </div>

        {/* Nav */}
        <div style={{ padding:"6px 0", flex:1 }}>
          {[["📊","Dashboard","/dashboard",true],["🤖","Mes bots","/mes-bots",false],["🌍","Marché","/marche",false],["🔌","Connexions","/connexions",false],["📈","Positions","/positions",false],["🐋","Whale Tracker","/whale-tracker",false],["⚡","Signaux IA","/signaux",false]].map(([ic,lb,href,act])=>(
            <Link key={String(lb)} href={String(href)} style={{ ...sb, textDecoration:"none", color:act?"white":"var(--muted)", borderLeftColor:act?"var(--red)":"transparent", background:act?"rgba(192,57,43,0.06)":"transparent" }}>
              <span>{ic}</span><span>{lb}</span>
            </Link>
          ))}
          <div style={{ padding:"6px 14px 4px", fontSize:".5rem", color:"#1a3a6e", textTransform:"uppercase", letterSpacing:".18em", marginTop:8 }}>Compte</div>
          {[["💼","Portefeuille","/portefeuille"],["📰","Actualités","/actualites"],["⚙️","Paramètres","/settings"]].map(([ic,lb,href])=>(
            <Link key={String(lb)} href={String(href)} style={{ ...sb, textDecoration:"none" }}><span>{ic}</span><span>{lb}</span></Link>
          ))}
          <Link href="/" style={{ ...sb, marginTop:4, textDecoration:"none" }}><span>🚪</span><span>Déconnexion</span></Link>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflowY:"auto" }}>

        {/* Topbar */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"0 18px", height:56, borderBottom:"1px solid rgba(10,26,92,0.6)", background:"rgba(4,7,26,0.8)", flexShrink:0, zIndex:10 }}>
          <button className="burger" onClick={()=>setNavOpen(true)} style={{ background:"rgba(192,57,43,0.12)", border:"1px solid rgba(192,57,43,0.3)", color:"var(--red)", borderRadius:7, width:32, height:32, fontSize:"1.1rem", cursor:"pointer", alignItems:"center", justifyContent:"center", flexShrink:0 }}>☰</button>
          <span style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:".75rem", fontWeight:700, color:"white", letterSpacing:".12em" }}>Dashboard</span>
          <div style={{ display:"flex", gap:6, marginLeft:12 }}>
            {(["PATIENT","ACTIF","AGRESSIF"] as const).map(m=>(
              <Tooltip key={m} text={MODE_TIP[m]}>
                <button onClick={()=>setMode(m)} style={{ fontSize:".58rem", fontWeight:700, padding:"4px 11px", borderRadius:20, cursor:"pointer", border:`1px solid ${MODE_COLOR[m]}`, color:mode===m?"white":MODE_COLOR[m], background:mode===m?MODE_COLOR[m]:"transparent", letterSpacing:".08em", transition:"all .2s" }}>{m}</button>
              </Tooltip>
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
        <div className="dash-kpis" style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, padding:"10px 16px", flexShrink:0 }}>
          {kpi("Portefeuille", `${balance.toLocaleString("fr-FR",{maximumFractionDigits:2})} $`, `+${(balance-9808).toFixed(2)}$ vs départ`, "white")}
          {kpi("PnL Aujourd'hui", "+4.23%", "+412 USDT", "var(--green)")}
          {kpi("Positions actives", "4 / 10", "3 en profit", "var(--blue)")}
          {kpi("Signaux Whale", "2", "Alerte PEPE & BTC", "#fbbf24")}
          {kpi("Bot statut", botOn?"EN LIGNE":"EN PAUSE", "Depuis 4h32", botOn?"var(--green)":"var(--red)")}
        </div>

        {/* Grid */}
        <div className="dash-grid" style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:8, padding:"0 16px 10px", height:440, flexShrink:0, minHeight:0 }}>

          <div className="dash-col" style={{ display:"flex", flexDirection:"column", gap:8, minHeight:0, overflow:"hidden" }}>
            {/* Chart */}
            <CandleChart pair="BTC/USDT" />

            {/* Positions */}
            <div className="panel-pos" style={{ background:"rgba(6,13,46,0.55)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:10, flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 13px", borderBottom:"1px solid rgba(10,26,92,0.6)", flexShrink:0 }}>
                <span style={{ fontSize:".66rem", fontWeight:700, color:"white", textTransform:"uppercase", letterSpacing:".08em" }}>📋 Positions ouvertes</span>
                <Tooltip text="Réinitialise la liste des positions ouvertes par le bot.">
                  <button onClick={()=>setPosList(POSITIONS)} style={{ fontSize:".6rem", background:"rgba(192,57,43,0.1)", border:"1px solid rgba(192,57,43,0.3)", color:"var(--red)", padding:"4px 10px", borderRadius:5, cursor:"pointer" }}>↻ Rafraîchir</button>
                </Tooltip>
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
                    {posList.length === 0 && (
                      <tr><td colSpan={7} style={{ padding:"14px 10px", color:"var(--muted)", fontSize:".62rem" }}>Aucune position ouverte.</td></tr>
                    )}
                    {posList.map(p=>(
                      <tr key={p.sym} style={{ borderBottom:"1px solid rgba(10,26,92,0.3)" }}>
                        <td style={{ padding:"8px 10px", fontWeight:700, color:"white" }}>{p.sym}</td>
                        <td style={{ padding:"8px 10px" }}><span style={{ fontSize:".52rem", padding:"2px 6px", borderRadius:3, fontWeight:700, letterSpacing:".08em", background:`${MODE_COLOR[p.mode]}18`, color:MODE_COLOR[p.mode] }}>{p.mode}</span></td>
                        <td style={{ padding:"8px 10px", color:"var(--muted2)" }}>{p.entry}</td>
                        <td style={{ padding:"8px 10px", color:"var(--muted2)" }}>{p.current}</td>
                        <td style={{ padding:"8px 10px", color:p.pnl>=0?"var(--green)":"var(--red)", fontWeight:700 }}>{p.pnl>=0?"+":""}{p.pnl}%</td>
                        <td style={{ padding:"8px 10px", color:"var(--muted)", fontSize:".6rem" }}>{p.sl} / {p.tp}</td>
                        <td style={{ padding:"8px 10px" }}><button onClick={()=>setPosList(l=>l.filter(x=>x.sym!==p.sym))} style={{ background:"rgba(192,57,43,0.08)", border:"1px solid rgba(192,57,43,0.25)", borderRadius:4, color:"var(--red)", fontSize:".56rem", padding:"3px 7px", cursor:"pointer" }}>Fermer</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="dash-col" style={{ display:"flex", flexDirection:"column", gap:8, minHeight:0, overflow:"hidden" }}>
            {/* Whale */}
            <div className="panel-3d" style={{ background:"rgba(6,13,46,0.55)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:10, overflow:"hidden" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 12px", borderBottom:"1px solid rgba(10,26,92,0.6)" }}>
                <span style={{ fontSize:".64rem", fontWeight:700, color:"white", textTransform:"uppercase", letterSpacing:".08em" }}>🐋 Whale Tracker</span>
                <span style={{ fontSize:".55rem", color:"var(--green)", display:"flex", alignItems:"center", gap:4 }}><span style={{ width:5, height:5, borderRadius:"50%", background:"var(--green)", display:"inline-block" }}/>Live</span>
              </div>
              <WhaleFeed compact />
            </div>

            {/* News */}
            <div className="panel-3d panel-news" style={{ background:"rgba(6,13,46,0.55)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:10, overflow:"hidden", flex:1, display:"flex", flexDirection:"column" }}>
              <div style={{ padding:"9px 12px", borderBottom:"1px solid rgba(10,26,92,0.6)", flexShrink:0 }}>
                <span style={{ fontSize:".64rem", fontWeight:700, color:"white", textTransform:"uppercase", letterSpacing:".08em" }}>📰 Actualités IA</span>
              </div>
              <div style={{ overflow:"auto", flex:1 }}>
                <NewsFeed compact />
              </div>
            </div>
          </div>
        </div>

        {/* Marché — Table de tokens style BullX */}
        <div style={{ padding:"4px 16px 24px" }}>
          <div style={{ fontSize:".7rem", fontWeight:700, color:"white", textTransform:"uppercase", letterSpacing:".08em", margin:"6px 2px 10px" }}>🪙 Marché — Découverte de tokens</div>
          <TokenTable />
        </div>
      </div>
    </div>
  );
}
