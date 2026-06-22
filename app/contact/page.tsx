"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";

type Sugg = { id:string; title:string; detail:string; votes:number; status:string };

export default function ContactPage(){
  const [user,setUser]=useState<{email?:string;role?:string}>({});
  const [msg,setMsg]=useState("");
  const [msgOk,setMsgOk]=useState(false);
  const [sTitle,setSTitle]=useState(""); const [sDetail,setSDetail]=useState("");
  const [suggestions,setSuggestions]=useState<Sugg[]>([]);
  const [voted,setVoted]=useState<string[]>([]);
  const [busy,setBusy]=useState(false);

  useEffect(()=>{ try{ setUser(JSON.parse(localStorage.getItem("aibed_user")||"{}")); }catch{}
    try{ setVoted(JSON.parse(localStorage.getItem("aibed_voted")||"[]")); }catch{} },[]);

  const loadSugg=useCallback(async()=>{ const r=await fetch("/api/suggestions"); const d=await r.json(); setSuggestions(d.suggestions||[]); },[]);
  useEffect(()=>{ loadSugg(); },[loadSugg]);

  async function sendMessage(){
    if(msg.trim().length<3) return;
    setBusy(true);
    await fetch("/api/contact",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email:user.email, name:user.email, message:msg }) });
    setBusy(false); setMsg(""); setMsgOk(true); setTimeout(()=>setMsgOk(false),3000);
  }
  async function sendSugg(){
    if(sTitle.trim().length<3) return;
    setBusy(true);
    await fetch("/api/suggestions",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email:user.email, title:sTitle, detail:sDetail }) });
    setBusy(false); setSTitle(""); setSDetail(""); loadSugg();
  }
  async function vote(id:string){
    if(voted.includes(id)) return;
    const nv=[...voted,id]; setVoted(nv); localStorage.setItem("aibed_voted",JSON.stringify(nv));
    setSuggestions(s=>s.map(x=>x.id===id?{...x,votes:x.votes+1}:x).sort((a,b)=>b.votes-a.votes));
    await fetch("/api/suggestions",{ method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ id }) });
  }

  const card:React.CSSProperties={ background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"22px 24px" };
  const inp:React.CSSProperties={ width:"100%", background:"rgba(4,7,26,0.6)", border:"1px solid rgba(74,111,165,0.3)", borderRadius:8, padding:"11px 14px", color:"white", fontSize:".78rem", outline:"none", marginTop:6, fontFamily:"inherit" };
  const btn:React.CSSProperties={ marginTop:14, padding:"11px 20px", borderRadius:8, background:"var(--red)", color:"white", border:"none", fontSize:".76rem", fontWeight:700, cursor:"pointer", boxShadow:"0 0 16px var(--red-glow)" };

  return (
    <div className="dash-root" style={{ display:"grid", gridTemplateColumns:"210px 1fr", height:"100vh", background:"var(--navy)", overflow:"hidden" }}>
      <div className="cyber-grid" />
      <Sidebar founder={user.role==="founder"} />
      <div style={{ overflowY:"auto", padding:"78px 28px 50px", position:"relative", zIndex:1, maxWidth:760 }}>
        <h1 style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1.3rem", fontWeight:900, color:"white", marginBottom:6 }}>💬 Contact & Suggestions</h1>
        <p style={{ fontSize:".72rem", color:"var(--muted)", marginBottom:22 }}>Un souci, une idée ? Écrivez-nous directement ou proposez une fonctionnalité — les plus votées seront ajoutées en priorité.</p>

        {/* Contact */}
        <div style={{ ...card, marginBottom:20 }}>
          <div style={{ fontSize:".8rem", fontWeight:700, color:"white", marginBottom:4 }}>📩 Nous envoyer un message privé</div>
          <div style={{ fontSize:".66rem", color:"var(--muted)", marginBottom:8 }}>Votre message arrive directement au fondateur.</div>
          <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={4} placeholder="Votre message, votre question, un bug rencontré…" style={{ ...inp, resize:"vertical" }} />
          {msgOk && <div style={{ fontSize:".68rem", color:"var(--green)", marginTop:8 }}>✓ Message envoyé, merci !</div>}
          <button onClick={sendMessage} disabled={busy} style={btn}>Envoyer le message</button>
        </div>

        {/* Suggest */}
        <div style={{ ...card, marginBottom:20 }}>
          <div style={{ fontSize:".8rem", fontWeight:700, color:"white", marginBottom:4 }}>💡 Proposer une fonctionnalité</div>
          <div style={{ fontSize:".66rem", color:"var(--muted)", marginBottom:8 }}>Votre idée sera étudiée et pourra être ajoutée dans une prochaine mise à jour.</div>
          <input value={sTitle} onChange={e=>setSTitle(e.target.value)} placeholder="Titre de l'idée (ex: alertes de prix par SMS)" style={inp} />
          <textarea value={sDetail} onChange={e=>setSDetail(e.target.value)} rows={3} placeholder="Détails (optionnel)" style={{ ...inp, resize:"vertical" }} />
          <button onClick={sendSugg} disabled={busy} style={btn}>Proposer</button>
        </div>

        {/* Suggestions list */}
        <div style={{ ...card, padding:"8px 0" }}>
          <div style={{ fontSize:".7rem", fontWeight:700, color:"white", textTransform:"uppercase", letterSpacing:".08em", padding:"14px 22px 8px" }}>🗳️ Idées de la communauté</div>
          {suggestions.length===0 && <div style={{ padding:"14px 22px", fontSize:".72rem", color:"var(--muted)" }}>Aucune suggestion pour l&apos;instant. Soyez le premier !</div>}
          {suggestions.map(s=>(
            <div key={s.id} style={{ display:"flex", gap:14, alignItems:"center", padding:"12px 22px", borderTop:"1px solid rgba(10,26,92,0.3)" }}>
              <button onClick={()=>vote(s.id)} disabled={voted.includes(s.id)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:1, background:voted.includes(s.id)?"rgba(39,174,96,0.12)":"rgba(192,57,43,0.1)", border:`1px solid ${voted.includes(s.id)?"rgba(39,174,96,0.3)":"rgba(192,57,43,0.3)"}`, borderRadius:8, padding:"6px 10px", cursor:voted.includes(s.id)?"default":"pointer", color:voted.includes(s.id)?"var(--green)":"var(--red)", minWidth:44 }}>
                <span style={{ fontSize:".7rem" }}>▲</span><span style={{ fontSize:".72rem", fontWeight:700 }}>{s.votes}</span>
              </button>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:".78rem", color:"white", fontWeight:600 }}>{s.title}</div>
                {s.detail && <div style={{ fontSize:".66rem", color:"var(--muted)", marginTop:2 }}>{s.detail}</div>}
              </div>
              <span style={{ fontSize:".56rem", color:"var(--muted2)", textTransform:"uppercase", letterSpacing:".06em" }}>{s.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
