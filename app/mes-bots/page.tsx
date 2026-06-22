"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Tooltip from "../components/Tooltip";
import ConnectExchange from "../components/ConnectExchange";
import BotAuto from "../components/BotAuto";
import { useAccess, PlanGate } from "../components/Access";

type Bot = { id:number; avatar:string; name:string; mode:string; pnl:number; on:boolean };
const AVATARS = ["🐂","🦅","🐉","🦁","🐺","🦊","🤖","👾","🎯","💀","🌙","⚡","🔥","💎","🚀","🌊","🎭","🏆","👑","⚔️"];
const MODES = ["PATIENT","ACTIF","AGRESSIF"];
const MODE_COLOR: Record<string,string> = { PATIENT:"#4a90d9", ACTIF:"#27ae60", AGRESSIF:"#c0392b" };
const DEFAULT: Bot[] = [
  { id:1, avatar:"🐂", name:"Bot #1", mode:"ACTIF", pnl:+4.23, on:true },
  { id:2, avatar:"🦅", name:"Bot #2", mode:"PATIENT", pnl:+1.85, on:true },
];

export default function MesBotsPage() {
  const access = useAccess();
  const [user, setUser] = useState<{email?:string;role?:string;plan?:string}>({});
  const [bots, setBots] = useState<Bot[]>([]);
  const [modal, setModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState(6);
  const [newMode, setNewMode] = useState("ACTIF");

  useEffect(()=>{
    try{ setUser(JSON.parse(localStorage.getItem("aibed_user")||"{}")); }catch{}
    try{ const s = localStorage.getItem("aibed_bots"); setBots(s?JSON.parse(s):DEFAULT); }catch{ setBots(DEFAULT); }
  },[]);

  function persist(next:Bot[]){ setBots(next); localStorage.setItem("aibed_bots", JSON.stringify(next)); }
  function toggle(id:number){ persist(bots.map(b=>b.id===id?{...b,on:!b.on}:b)); }
  function remove(id:number){ persist(bots.filter(b=>b.id!==id)); }
  function create(){
    if(!newName.trim()) return;
    const id = Math.max(0,...bots.map(b=>b.id))+1;
    persist([...bots, { id, avatar:AVATARS[newAvatar], name:newName.trim(), mode:newMode, pnl:0, on:true }]);
    setModal(false); setNewName(""); setNewAvatar(6); setNewMode("ACTIF");
  }

  const founder = user.role === "founder";
  const limit = founder || user.plan==="elite" ? Infinity : user.plan==="pro" ? 3 : 1;
  const max = limit===Infinity ? "∞" : String(limit);
  const canAdd = bots.length < limit;
  const card: React.CSSProperties = { background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"20px 22px" };

  return (
    <div className="dash-root" style={{ display:"grid", gridTemplateColumns:"210px 1fr", height:"100vh", background:"var(--navy)", overflow:"hidden" }}>
      <div className="cyber-grid" />
      <Sidebar founder={founder} />
      <div style={{ overflowY:"auto", padding:"78px 28px 40px", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <h1 style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1.3rem", fontWeight:900, color:"white" }}>🤖 Mes bots</h1>
          <span style={{ fontSize:".7rem", color:"var(--muted2)" }}>{bots.length} / {max} bots</span>
        </div>

        {/* Connexion exchange réelle */}
        <div style={{ marginBottom:18, maxWidth:520 }}>
          <ConnectExchange email={user.email} exchange={(typeof window!=="undefined" && localStorage.getItem("aibed_exchange")) || "binance"} />
        </div>
        {/* Trading automatique (abonnés) */}
        <PlanGate access={access} need="subscription" label="Le trading automatique est réservé aux abonnés">
          <div style={{ marginBottom:24 }}>
            <BotAuto email={user.email} />
          </div>
        </PlanGate>
        <PlanGate access={access} need="subscription" label="Les bots automatisés sont réservés aux abonnés">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:16 }}>
          {bots.map(b=>(
            <div key={b.id} className="lift-3d" style={card}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                <div style={{ width:48, height:48, borderRadius:"50%", background:"rgba(10,26,92,0.4)", border:`2px solid ${MODE_COLOR[b.mode]}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.4rem" }}>{b.avatar}</div>
                <div style={{ flex:1 }}><div style={{ fontSize:".85rem", fontWeight:700, color:"white" }}>{b.name}</div><div style={{ fontSize:".62rem", color:MODE_COLOR[b.mode], fontWeight:600 }}>Mode {b.mode}</div></div>
                <Tooltip text="Supprimer ce bot définitivement.">
                  <button onClick={()=>remove(b.id)} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:".9rem" }}>🗑</button>
                </Tooltip>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:".72rem", marginBottom:12 }}>
                <span style={{ color:"var(--muted)" }}>PnL 24h</span>
                <span style={{ color:b.pnl>0?"var(--green)":b.pnl<0?"var(--red)":"var(--muted2)", fontWeight:700 }}>{b.pnl>0?"+":""}{b.pnl}%</span>
              </div>
              <Tooltip text={b.on?"Bot actif : il trade automatiquement. Cliquez pour mettre en pause.":"Bot en pause. Cliquez pour l'activer."}>
                <div onClick={()=>toggle(b.id)} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                  <div style={{ width:34, height:17, borderRadius:9, background:b.on?"rgba(39,174,96,0.3)":"rgba(192,57,43,0.2)", border:`1px solid ${b.on?"rgba(39,174,96,0.4)":"rgba(192,57,43,0.3)"}`, position:"relative", transition:"all .2s" }}>
                    <div style={{ width:11, height:11, borderRadius:"50%", background:b.on?"var(--green)":"var(--red)", position:"absolute", top:2, left:b.on?20:2, transition:"left .2s" }}/>
                  </div>
                  <span style={{ fontSize:".66rem", color:b.on?"var(--green)":"var(--red)", fontWeight:700 }}>{b.on?"En ligne":"En pause"}</span>
                </div>
              </Tooltip>
            </div>
          ))}
          <Tooltip text={canAdd?"Créer un nouveau bot de trading.":`Limite atteinte pour votre plan (${max}). Passez à un plan supérieur pour plus de bots.`}>
            <div onClick={()=>canAdd&&setModal(true)} style={{ ...card, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8, cursor:canAdd?"pointer":"not-allowed", opacity:canAdd?1:0.4, border:"1px dashed rgba(74,111,165,0.3)", minHeight:140, width:"100%" }}>
              <div style={{ fontSize:"1.8rem" }}>＋</div>
              <div style={{ fontSize:".72rem", color:"var(--muted2)" }}>Créer un nouveau bot</div>
            </div>
          </Tooltip>
        </div>
        </PlanGate>
      </div>

      {modal && (
        <div onClick={()=>setModal(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"rgba(6,13,46,0.98)", border:"1px solid rgba(74,111,165,0.3)", borderRadius:14, padding:26, width:"100%", maxWidth:400 }}>
            <div style={{ fontSize:".95rem", fontWeight:700, color:"white", marginBottom:18 }}>🤖 Nouveau bot</div>
            <label style={{ fontSize:".66rem", color:"var(--muted2)" }}>Nom du bot</label>
            <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Mon bot scalping" style={{ width:"100%", background:"rgba(4,7,26,0.6)", border:"1px solid rgba(74,111,165,0.3)", borderRadius:8, padding:"11px 14px", color:"white", fontSize:".82rem", outline:"none", marginTop:6, marginBottom:14 }} />
            <label style={{ fontSize:".66rem", color:"var(--muted2)" }}>Mode de trading</label>
            <div style={{ display:"flex", gap:8, margin:"8px 0 16px" }}>
              {MODES.map(m=>(
                <button key={m} onClick={()=>setNewMode(m)} style={{ flex:1, padding:"9px 0", borderRadius:7, fontSize:".62rem", fontWeight:700, cursor:"pointer", border:`1px solid ${MODE_COLOR[m]}`, background:newMode===m?MODE_COLOR[m]:"transparent", color:newMode===m?"white":MODE_COLOR[m] }}>{m}</button>
              ))}
            </div>
            <label style={{ fontSize:".66rem", color:"var(--muted2)" }}>Avatar</label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(10,1fr)", gap:6, margin:"8px 0 18px" }}>
              {AVATARS.map((a,i)=>(
                <div key={i} onClick={()=>setNewAvatar(i)} style={{ aspectRatio:"1", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", borderRadius:7, cursor:"pointer", border:`1px solid ${newAvatar===i?"var(--red)":"rgba(10,26,92,0.6)"}`, background:newAvatar===i?"rgba(192,57,43,0.12)":"transparent" }}>{a}</div>
              ))}
            </div>
            <button onClick={create} style={{ width:"100%", padding:13, borderRadius:8, background:"var(--red)", color:"white", border:"none", fontSize:".8rem", fontWeight:700, cursor:"pointer", boxShadow:"0 0 20px var(--red-glow)" }}>Créer le bot</button>
            <button onClick={()=>setModal(false)} style={{ width:"100%", marginTop:10, padding:10, borderRadius:8, background:"transparent", border:"1px solid rgba(74,111,165,0.3)", color:"var(--muted2)", fontSize:".72rem", cursor:"pointer" }}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}
