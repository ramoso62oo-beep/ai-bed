"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import TokenTable from "../components/TokenTable";
import ProChart from "../components/ProChart";
import Tooltip from "../components/Tooltip";
import WhaleFeed from "../components/WhaleFeed";
import NewsFeed from "../components/NewsFeed";
import Tilt3D from "../components/Tilt3D";
import { useAccess, VisitorBanner, DemoResetBanner } from "../components/Access";

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
  const [stats, setStats] = useState<{connected:boolean;testnet?:boolean;total?:number;usdt?:number;pnlPct?:number;pnlUsd?:number;inPosition?:boolean;botAuto?:boolean;symbol?:string;qty?:number;price?:number;entryPrice?:number;entryUsd?:number}>({connected:false});
  const [statsTime, setStatsTime] = useState(0);
  const [, forceTick] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const [env, setEnv] = useState<"demo"|"real">("demo");
  const botInteracted = useRef(false);
  const access = useAccess();
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

  // Stats RÉELLES depuis le compte connecté (rafraîchies toutes les 8 s)
  useEffect(() => {
    try { const cached = localStorage.getItem("aibed_stats"); if (cached) setStats(JSON.parse(cached)); } catch {}
    const load = () => {
      const email = currentEmail(); // lu à chaque fois (robuste si l'email arrive plus tard)
      if (!email) return;
      fetch(`/api/dashboard/stats?email=${encodeURIComponent(email)}`).then(r=>r.json()).then(d=>{
        setStats(d); setStatsTime(Date.now());
        if (d.connected) { try { localStorage.setItem("aibed_stats", JSON.stringify(d)); } catch {} }
      }).catch(()=>{});
    };
    load();
    const id = setInterval(load, 8000);
    const tick = setInterval(()=>forceTick(x=>x+1), 1000);
    return () => { clearInterval(id); clearInterval(tick); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.email]);

  // Fallback démo (compte non connecté) — léger mouvement pour l'aperçu
  useEffect(() => {
    if (stats.connected) return;
    const interval = setInterval(() => setBalance(b => parseFloat((b+(Math.random()-.49)*2).toFixed(2))), 2500);
    return () => clearInterval(interval);
  }, [stats.connected]);

  useEffect(() => { setEnv((localStorage.getItem("aibed_env") as "demo"|"real") || "demo"); }, []);
  function toggleEnv() {
    const next = env === "demo" ? "real" : "demo";
    setEnv(next); localStorage.setItem("aibed_env", next);
  }

  // Email fiable (state ou localStorage)
  function currentEmail(): string {
    if (user.email) return user.email;
    try { return JSON.parse(localStorage.getItem("aibed_user")||"{}").email || ""; } catch { return ""; }
  }

  // Charge l'état réel du bot — sauf si l'utilisateur a déjà interagi (évite que
  // une requête lente n'écrase le clic de l'utilisateur).
  useEffect(() => {
    const email = currentEmail();
    if (!email) return;
    fetch(`/api/bot/config?email=${encodeURIComponent(email)}`).then(r=>r.json()).then(d=>{
      if (d.config && !botInteracted.current) setBotOn(!!d.config.bot_auto);
      if (d.config?.bot_mode) setMode(String(d.config.bot_mode).toUpperCase());
    }).catch(()=>{});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.email]);

  async function toggleBot() {
    botInteracted.current = true; // verrou : plus aucun rechargement ne pourra écraser
    const email = currentEmail();
    const next = !botOn;
    setBotOn(next);
    if (!email) { return; }
    try {
      await fetch("/api/bot/config", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email, bot_auto: next }) });
    } catch { setBotOn(!next); } // rollback si échec réseau
  }

  // Change le mode de risque du bot (PATIENT / ACTIF / AGRESSIF)
  // → applique le mode à TOUTES les positions ouvertes + au bot
  async function changeMode(m: string) {
    setMode(m);
    const email = currentEmail();
    if (!email) return;
    fetch("/api/bot/config", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email, bot_mode: m.toLowerCase() }) }).catch(()=>{});
  }

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
          {/* Boutons Actif + Démo/Réel — pastilles symétriques */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:7, marginTop:11 }}>
            <Tooltip text={botOn ? "Le bot est ACTIF : le trading automatique est lancé (il analyse le marché et passe des ordres). Cliquez pour le mettre en pause." : "Le bot est EN PAUSE : aucun trade automatique. Cliquez pour lancer le trading automatique."}>
              <div onClick={toggleBot} style={{ width:138, boxSizing:"border-box", display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"5px 10px", borderRadius:20, cursor:"pointer", border:`1px solid ${botOn?"rgba(39,174,96,0.5)":"rgba(192,57,43,0.4)"}`, background:botOn?"rgba(39,174,96,0.12)":"rgba(192,57,43,0.1)" }}>
                <div style={{ width:30, height:15, borderRadius:8, background:botOn?"rgba(39,174,96,0.3)":"rgba(192,57,43,0.2)", position:"relative", flexShrink:0 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:botOn?"var(--green)":"var(--red)", position:"absolute", top:2, left:botOn?18:2, transition:"left .2s" }}/>
                </div>
                <span style={{ fontSize:".56rem", fontWeight:700, color:botOn?"var(--green)":"var(--red)", letterSpacing:".06em" }}>{botOn?"ACTIF":"PAUSE"}</span>
              </div>
            </Tooltip>
            <Tooltip text={env==="demo" ? "Mode DÉMO : argent fictif, idéal pour tester les bots sans risque. Cliquez pour passer en RÉEL." : "Mode RÉEL : trades sur votre compte/wallet connecté avec de l'argent réel. Cliquez pour revenir en DÉMO."}>
              <div onClick={toggleEnv} style={{ width:138, boxSizing:"border-box", display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"5px 10px", borderRadius:20, cursor:"pointer", border:`1px solid ${env==="demo"?"rgba(251,191,36,0.5)":"rgba(39,174,96,0.5)"}`, background:env==="demo"?"rgba(251,191,36,0.1)":"rgba(39,174,96,0.12)" }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:env==="demo"?"#fbbf24":"var(--green)", flexShrink:0 }}/>
                <span style={{ fontSize:".56rem", fontWeight:700, color:env==="demo"?"#fbbf24":"var(--green)", letterSpacing:".06em" }}>{env==="demo"?"DÉMO":"RÉEL"}</span>
                <span style={{ fontSize:".5rem", color:"var(--muted)" }}>↔</span>
              </div>
            </Tooltip>
            {isFounder && <div style={{ fontSize:".52rem", background:"rgba(192,57,43,0.1)", border:"1px solid rgba(192,57,43,0.3)", borderRadius:20, padding:"3px 10px", color:"var(--red)", fontWeight:700, letterSpacing:".08em" }}>👑 FONDATEUR</div>}
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding:"6px 0", flex:1 }}>
          {[["📊","Dashboard","/dashboard",true],["🤖","Mes bots","/mes-bots",false],["🌍","Marché","/marche",false],["🔄","Swap","/swap",false],["🔌","Connexions","/connexions",false],["📈","Positions","/positions",false],["🐋","Whale Tracker","/whale-tracker",false],["⚡","Signaux IA","/signaux",false]].map(([ic,lb,href,act])=>(
            <Link key={String(lb)} href={String(href)} style={{ ...sb, textDecoration:"none", color:act?"white":"var(--muted)", borderLeftColor:act?"var(--red)":"transparent", background:act?"rgba(192,57,43,0.06)":"transparent" }}>
              <span>{ic}</span><span>{lb}</span>
            </Link>
          ))}
          <div style={{ padding:"6px 14px 4px", fontSize:".5rem", color:"#1a3a6e", textTransform:"uppercase", letterSpacing:".18em", marginTop:8 }}>Compte</div>
          {[["💼","Portefeuille","/portefeuille"],["📰","Actualités","/actualites"],["🎙️","Experts","/experts"],["💬","Contact","/contact"],["❓","Aide","/aide"],["⚙️","Paramètres","/settings"]].map(([ic,lb,href])=>(
            <Link key={String(lb)} href={String(href)} style={{ ...sb, textDecoration:"none" }}><span>{ic}</span><span>{lb}</span></Link>
          ))}
          {isFounder && <Link href="/admin" style={{ ...sb, textDecoration:"none", color:"#fbbf24" }}><span>👑</span><span>Gestionnaire</span></Link>}
          <Link href="/" style={{ ...sb, marginTop:4, textDecoration:"none" }}><span>🚪</span><span>Déconnexion</span></Link>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflowY:"auto" }}>
        <VisitorBanner access={access} />
        <DemoResetBanner />

        {/* Topbar */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"0 18px", height:56, borderBottom:"1px solid rgba(10,26,92,0.6)", background:"rgba(4,7,26,0.8)", flexShrink:0, zIndex:10 }}>
          <button className="burger" onClick={()=>setNavOpen(true)} style={{ background:"rgba(192,57,43,0.12)", border:"1px solid rgba(192,57,43,0.3)", color:"var(--red)", borderRadius:7, width:32, height:32, fontSize:"1.1rem", cursor:"pointer", alignItems:"center", justifyContent:"center", flexShrink:0 }}>☰</button>
          <span style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:".75rem", fontWeight:700, color:"white", letterSpacing:".12em" }}>Dashboard</span>
          <div style={{ display:"flex", gap:6, marginLeft:12 }}>
            {(["PATIENT","ACTIF","AGRESSIF"] as const).map(m=>(
              <Tooltip key={m} text={MODE_TIP[m]}>
                <button onClick={()=>changeMode(m)} style={{ fontSize:".58rem", fontWeight:700, padding:"4px 11px", borderRadius:20, cursor:"pointer", border:`1px solid ${MODE_COLOR[m]}`, color:mode===m?"white":MODE_COLOR[m], background:mode===m?MODE_COLOR[m]:"transparent", letterSpacing:".08em", transition:"all .2s" }}>{m}</button>
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

        {stats.connected && statsTime>0 && (
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 18px 0", fontSize:".58rem", color:"var(--green)" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--green)", animation:"pulse-red 1.5s infinite" }}/>
            Données réelles · mis à jour il y a {Math.max(0,Math.round((Date.now()-statsTime)/1000))}s
          </div>
        )}
        {/* KPIs */}
        <div className="dash-kpis" style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, padding:"10px 16px", flexShrink:0 }}>
          {stats.connected ? <>
            {kpi("Portefeuille"+(stats.testnet?" (testnet)":""), `${(stats.total||0).toLocaleString("fr-FR",{maximumFractionDigits:2})} $`, `${(stats.usdt||0).toLocaleString("fr-FR",{maximumFractionDigits:2})} USDT dispo`, "white")}
            {kpi("PnL position", `${(stats.pnlPct||0)>=0?"+":""}${(stats.pnlPct||0).toFixed(2)}%`, `${(stats.pnlUsd||0)>=0?"+":""}${(stats.pnlUsd||0).toFixed(2)} USDT`, (stats.pnlPct||0)>=0?"var(--green)":"var(--red)")}
            {kpi("Position ouverte", stats.inPosition?"1":"0", stats.inPosition?(stats.symbol||""):"En attente", "var(--blue)")}
            {kpi("Source", "RÉEL", "Compte connecté", "var(--green)")}
            {kpi("Bot statut", stats.botAuto?"EN LIGNE":"EN PAUSE", "Trading auto", stats.botAuto?"var(--green)":"var(--red)")}
          </> : <>
            {kpi("Portefeuille (démo)", `${balance.toLocaleString("fr-FR",{maximumFractionDigits:2})} $`, "Connectez Binance pour le réel", "white")}
            {kpi("PnL (démo)", "+4.23%", "Illustratif", "var(--green)")}
            {kpi("Positions (démo)", "4 / 10", "Illustratif", "var(--blue)")}
            {kpi("Source", "DÉMO", "Données d'exemple", "#fbbf24")}
            {kpi("Bot statut", botOn?"EN LIGNE":"EN PAUSE", "Trading auto", botOn?"var(--green)":"var(--red)")}
          </>}
        </div>

        {/* Grid */}
        <div className="dash-grid" style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:8, padding:"0 16px 10px", height:720, flexShrink:0, minHeight:0 }}>

          <div className="dash-col" style={{ display:"flex", flexDirection:"column", gap:8, minHeight:0, overflow:"hidden" }}>
            {/* Chart */}
            <ProChart pair="BTC/USDT" />

            {/* Positions */}
            <div className="panel-pos" style={{ background:"rgba(6,13,46,0.55)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:10, flex:1, minHeight:300, overflow:"hidden", display:"flex", flexDirection:"column" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 13px", borderBottom:"1px solid rgba(10,26,92,0.6)", flexShrink:0 }}>
                <span style={{ fontSize:".66rem", fontWeight:700, color:"white", textTransform:"uppercase", letterSpacing:".08em" }}>📋 Position ouverte</span>
                <Link href="/positions" style={{ fontSize:".58rem", color:"var(--blue)", textDecoration:"none" }}>Détails →</Link>
              </div>
              <div style={{ overflow:"auto", flex:1 }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:".64rem" }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid rgba(10,26,92,0.4)" }}>
                      {["Paire","Mode","Entrée","Actuel","PnL %","PnL USDT","SL / TP"].map(h=>(
                        <th key={h} style={{ padding:"6px 10px", color:"#1a3a6e", fontSize:".54rem", textTransform:"uppercase", letterSpacing:".1em", textAlign:"left", fontWeight:600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.connected && stats.inPosition ? (
                      <tr style={{ borderBottom:"1px solid rgba(39,174,96,0.3)", background:"rgba(39,174,96,0.06)" }}>
                        <td style={{ padding:"8px 10px", fontWeight:700, color:"white" }}>{(stats.symbol||"").replace(/USDT$/,"")} <span style={{ fontSize:".48rem", color:"var(--green)" }}>● RÉEL</span></td>
                        <td style={{ padding:"8px 10px" }}><span style={{ fontSize:".52rem", padding:"2px 6px", borderRadius:3, fontWeight:700, background:`${MODE_COLOR[mode]}18`, color:MODE_COLOR[mode] }}>{mode}</span></td>
                        <td style={{ padding:"8px 10px", color:"var(--muted2)" }}>${(stats.entryPrice||0).toLocaleString("fr-FR",{maximumFractionDigits:2})}</td>
                        <td style={{ padding:"8px 10px", color:"white" }}>${(stats.price||0).toLocaleString("fr-FR",{maximumFractionDigits:2})}</td>
                        <td style={{ padding:"8px 10px", color:(stats.pnlPct||0)>=0?"var(--green)":"var(--red)", fontWeight:700 }}>{(stats.pnlPct||0)>=0?"+":""}{(stats.pnlPct||0).toFixed(2)}%</td>
                        <td style={{ padding:"8px 10px", color:(stats.pnlUsd||0)>=0?"var(--green)":"var(--red)", fontSize:".6rem", fontWeight:700 }}>{(stats.pnlUsd||0)>=0?"+":""}{(stats.pnlUsd||0).toFixed(2)}</td>
                        <td style={{ padding:"8px 10px" }}><Link href="/positions" style={{ fontSize:".5rem", color:"var(--blue)", textDecoration:"none" }}>voir →</Link></td>
                      </tr>
                    ) : (
                      <tr><td colSpan={7} style={{ padding:"16px 10px", color:"var(--muted)", fontSize:".62rem" }}>
                        {stats.connected ? "Aucune position ouverte — le bot attend un signal d'achat." : "Connectez votre compte (Mes bots) pour suivre vos positions réelles."}
                      </td></tr>
                    )}
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
            <div className="panel-3d panel-news" style={{ background:"rgba(6,13,46,0.55)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:10, overflow:"hidden", flex:1, minHeight:240, display:"flex", flexDirection:"column" }}>
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
