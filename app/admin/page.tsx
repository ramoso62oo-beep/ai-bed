"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";

type User = {
  id:string; memberId:string; email:string; full_name?:string; pseudo?:string; phone?:string;
  role:string; plan:string; subscription_status:string; created_at:string; isPaid:boolean;
};
const PLANS = [["none","Sans abo"],["starter","Starter"],["pro","Pro"],["elite","Elite"]];
const PLAN_COLOR: Record<string,string> = { none:"#4a6080", starter:"#4a90d9", pro:"#c0392b", elite:"#fbbf24" };

export default function AdminPage(){
  const [user,setUser]=useState<{email?:string;role?:string}>({});
  const [users,setUsers]=useState<User[]>([]);
  const [stats,setStats]=useState({total:0,paid:0,free:0});
  const [q,setQ]=useState("");
  const [loading,setLoading]=useState(true);
  const [denied,setDenied]=useState(false);
  const [msg,setMsg]=useState("");
  const [view,setView]=useState<"users"|"messages"|"suggestions">("users");
  const [messages,setMessages]=useState<{id:string;email:string;name:string;message:string;created_at:string}[]>([]);
  const [suggestions,setSuggestions]=useState<{id:string;email:string;title:string;detail:string;votes:number;status:string;created_at:string}[]>([]);

  const load=useCallback(async(email:string)=>{
    const r=await fetch(`/api/admin/users?requester=${encodeURIComponent(email)}`);
    if(r.status===403){ setDenied(true); setLoading(false); return; }
    const d=await r.json();
    setUsers(d.users||[]); setStats(d.stats||{total:0,paid:0,free:0}); setLoading(false);
    // Inbox (messages + suggestions)
    fetch(`/api/admin/inbox?requester=${encodeURIComponent(email)}`).then(r=>r.json()).then(x=>{ setMessages(x.messages||[]); setSuggestions(x.suggestions||[]); }).catch(()=>{});
  },[]);

  useEffect(()=>{
    let u:{email?:string;role?:string}={};
    try{ u=JSON.parse(localStorage.getItem("aibed_user")||"{}"); }catch{}
    setUser(u);
    if(u.role!=="founder"){ setDenied(true); setLoading(false); return; }
    if(u.email) load(u.email);
  },[load]);

  async function setSuggStatus(id:string, status:string){
    if(!user.email) return;
    await fetch("/api/admin/inbox",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ requester:user.email, suggestionId:id, status }) });
    setSuggestions(s=>s.map(x=>x.id===id?{...x,status}:x));
  }

  async function setPlan(targetEmail:string, plan:string){
    if(!user.email) return;
    setMsg("");
    const r=await fetch("/api/admin/set-plan",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ requester:user.email, targetEmail, plan }) });
    const d=await r.json();
    if(d.ok){ setUsers(us=>us.map(x=>x.email===targetEmail?{...x,plan,subscription_status:plan==="none"?"inactive":"active",isPaid:plan!=="none"}:x)); setMsg(`✓ Plan de ${targetEmail} → ${plan==="none"?"Sans abonnement":plan}`); setTimeout(()=>setMsg(""),4000); }
    else setMsg("⚠️ "+(d.error||"Échec"));
  }

  const filteredUsers=users.filter(u=> !q || (u.email||"").toLowerCase().includes(q.toLowerCase()) || (u.full_name||"").toLowerCase().includes(q.toLowerCase()) || (u.memberId||"").toLowerCase().includes(q.toLowerCase()));
  const card:React.CSSProperties={ background:"rgba(6,13,46,0.6)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12 };

  if(denied) return (
    <div style={{ display:"flex", height:"100vh", alignItems:"center", justifyContent:"center", background:"var(--navy)", flexDirection:"column", gap:12 }}>
      <div style={{ fontSize:"2rem" }}>🔒</div>
      <div style={{ color:"white", fontWeight:700 }}>Accès réservé au fondateur</div>
      <Link href="/dashboard" style={{ color:"var(--red)", fontSize:".8rem" }}>← Retour au dashboard</Link>
    </div>
  );

  return (
    <div className="dash-root" style={{ display:"grid", gridTemplateColumns:"210px 1fr", height:"100vh", background:"var(--navy)", overflow:"hidden" }}>
      <div className="cyber-grid" />
      <Sidebar founder={true} />
      <div style={{ overflowY:"auto", padding:"78px 28px 40px", position:"relative", zIndex:1 }}>
        <h1 style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1.3rem", fontWeight:900, color:"white", marginBottom:6 }}>👑 Gestionnaire</h1>
        <p style={{ fontSize:".72rem", color:"var(--muted)", marginBottom:18 }}>Gérez tous les comptes : informations, abonnements, et offrez un plan d&apos;un clic.</p>

        {/* Onglets */}
        <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
          {([["users",`👤 Comptes (${stats.total})`],["messages",`💬 Messages (${messages.length})`],["suggestions",`💡 Suggestions (${suggestions.length})`]] as const).map(([id,lb])=>(
            <button key={id} onClick={()=>setView(id)} style={{ padding:"9px 16px", borderRadius:9, fontSize:".74rem", fontWeight:700, cursor:"pointer", border:`1px solid ${view===id?"#fbbf24":"rgba(74,111,165,0.3)"}`, background:view===id?"rgba(251,191,36,0.1)":"transparent", color:view===id?"#fbbf24":"var(--muted2)" }}>{lb}</button>
          ))}
        </div>

        {loading && <div style={{ color:"var(--muted)", fontSize:".8rem" }}>Chargement…</div>}

        {/* ===== MESSAGES ===== */}
        {view==="messages" && (
          <div style={{ ...card, overflow:"hidden" }}>
            {messages.length===0 && <div style={{ padding:"20px", color:"var(--muted)", fontSize:".76rem" }}>Aucun message reçu.</div>}
            {messages.map(m=>(
              <div key={m.id} style={{ padding:"14px 18px", borderBottom:"1px solid rgba(10,26,92,0.3)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6, flexWrap:"wrap", gap:8 }}>
                  <span style={{ fontSize:".72rem", color:"white", fontWeight:700 }}>{m.email||"anonyme"}</span>
                  <span style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <span style={{ fontSize:".6rem", color:"var(--muted)" }}>{new Date(m.created_at).toLocaleString("fr-FR")}</span>
                    {m.email && <a href={`mailto:${m.email}`} style={{ fontSize:".62rem", color:"var(--blue)", textDecoration:"none" }}>✉️ Répondre</a>}
                  </span>
                </div>
                <div style={{ fontSize:".78rem", color:"var(--text)", lineHeight:1.5 }}>{m.message}</div>
              </div>
            ))}
          </div>
        )}

        {/* ===== SUGGESTIONS ===== */}
        {view==="suggestions" && (
          <div style={{ ...card, overflow:"hidden" }}>
            {suggestions.length===0 && <div style={{ padding:"20px", color:"var(--muted)", fontSize:".76rem" }}>Aucune suggestion.</div>}
            {suggestions.map(s=>(
              <div key={s.id} style={{ padding:"14px 18px", borderBottom:"1px solid rgba(10,26,92,0.3)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5, gap:10, flexWrap:"wrap" }}>
                  <span style={{ fontSize:".8rem", color:"white", fontWeight:700 }}>⬆ {s.votes} · {s.title}</span>
                  <span style={{ fontSize:".58rem", color:"var(--muted)" }}>{s.email||"anonyme"}</span>
                </div>
                {s.detail && <div style={{ fontSize:".7rem", color:"var(--muted2)", marginBottom:8 }}>{s.detail}</div>}
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {["nouveau","en cours","fait","refusé"].map(st=>(
                    <button key={st} onClick={()=>setSuggStatus(s.id,st)} style={{ padding:"3px 9px", borderRadius:6, fontSize:".58rem", fontWeight:700, cursor:"pointer", border:`1px solid ${s.status===st?"var(--red)":"rgba(74,111,165,0.3)"}`, background:s.status===st?"rgba(192,57,43,0.15)":"transparent", color:s.status===st?"var(--red)":"var(--muted2)" }}>{st}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== COMPTES ===== */}
        {view==="users" && <>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔎 Rechercher (email, nom, ID…)" style={{ width:"100%", maxWidth:400, background:"rgba(4,7,26,0.6)", border:"1px solid rgba(74,111,165,0.3)", borderRadius:9, padding:"9px 14px", color:"white", fontSize:".76rem", outline:"none", marginBottom:14, display:"block" }} />
        {msg && <div style={{ fontSize:".7rem", color:msg.startsWith("✓")?"var(--green)":"var(--red)", marginBottom:12 }}>{msg}</div>}
        <div style={{ ...card, overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1.6fr 1.4fr 1fr 1.8fr", padding:"11px 16px", fontSize:".58rem", color:"var(--muted)", textTransform:"uppercase", letterSpacing:".05em", borderBottom:"1px solid rgba(10,26,92,0.5)" }}>
            <span>Identifiant</span><span>Email</span><span>Nom</span><span>Abonnement</span><span>Actions</span>
          </div>
          <div style={{ maxHeight:"calc(100vh - 360px)", overflowY:"auto" }}>
            {!loading && filteredUsers.length===0 && <div style={{ padding:"20px", color:"var(--muted)", fontSize:".76rem" }}>Aucun compte.</div>}
            {filteredUsers.map(u=>(
              <div key={u.id} style={{ display:"grid", gridTemplateColumns:"1.2fr 1.6fr 1.4fr 1fr 1.8fr", padding:"12px 16px", fontSize:".72rem", alignItems:"center", borderBottom:"1px solid rgba(10,26,92,0.25)" }}>
                <span style={{ color:"var(--blue)", fontWeight:700, fontFamily:"monospace", fontSize:".64rem" }}>{u.role==="founder"?"👑 FONDATEUR":u.memberId}</span>
                <span style={{ color:"white", overflow:"hidden", textOverflow:"ellipsis" }}>{u.email}</span>
                <span style={{ color:"var(--muted2)" }}>{u.full_name||u.pseudo||"—"}</span>
                <span>
                  <span style={{ fontSize:".58rem", padding:"2px 8px", borderRadius:6, fontWeight:700, background:`${PLAN_COLOR[u.plan]||"#4a6080"}22`, color:PLAN_COLOR[u.plan]||"#4a6080" }}>
                    {u.role==="founder"?"ELITE 👑":u.isPaid?u.plan.toUpperCase():"Sans abonnement"}
                  </span>
                </span>
                <span style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {u.role!=="founder" && PLANS.map(([id,lb])=>(
                    <button key={id} onClick={()=>setPlan(u.email,id)} disabled={u.plan===id} title={`Mettre en ${lb}`} style={{ padding:"3px 7px", borderRadius:5, fontSize:".56rem", fontWeight:700, cursor:u.plan===id?"default":"pointer", border:`1px solid ${PLAN_COLOR[id]}55`, background:u.plan===id?`${PLAN_COLOR[id]}33`:"transparent", color:PLAN_COLOR[id], opacity:u.plan===id?1:0.8 }}>{lb}</button>
                  ))}
                  <a href={`mailto:${u.email}`} title="Envoyer un email" style={{ padding:"3px 7px", borderRadius:5, fontSize:".56rem", fontWeight:700, border:"1px solid rgba(74,111,165,0.4)", color:"var(--text)", textDecoration:"none" }}>✉️</a>
                </span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize:".58rem", color:"var(--muted)", marginTop:10 }}>💡 « Sans abo » retire l&apos;accès payant. Un plan offert active immédiatement les bots pour l&apos;utilisateur.</div>
        </>}
      </div>
    </div>
  );
}
