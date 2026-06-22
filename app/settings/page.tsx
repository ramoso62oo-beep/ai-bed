"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

const LANGS = [["fr","🇫🇷 Français"],["en","🇬🇧 English"],["es","🇪🇸 Español"],["ar","🇸🇦 العربية"]];
const AVATARS = ["🐂","🦅","🐉","🦁","🐺","🦊","🤖","👾","🎯","💀","🌙","⚡","🔥","💎","🚀","🌊","🎭","🏆","👑","⚔️"];
const PLANS = [
  { id:"starter", label:"Starter", price:"9,90 €", feats:"1 bot · trading de base" },
  { id:"pro", label:"Pro", price:"29,90 €", feats:"3 bots · automatisation" },
  { id:"elite", label:"Elite", price:"79,90 €", feats:"Bots illimités · tout inclus" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{email?:string;role?:string;plan?:string}>({});
  const [lang, setLang] = useState("fr");
  const [avatar, setAvatar] = useState(0);
  const [pseudo, setPseudo] = useState("");
  const [photo, setPhoto] = useState("");
  const [saved, setSaved] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalErr, setPortalErr] = useState("");

  useEffect(() => {
    let u: {email?:string;role?:string;plan?:string} = {};
    try { u = JSON.parse(localStorage.getItem("aibed_user")||"{}"); } catch {}
    setUser(u);
    setLang(localStorage.getItem("aibed_lang")||"fr");
    setAvatar(Number(localStorage.getItem("aibed_avatar")||0));
    setPseudo(localStorage.getItem("aibed_pseudo")||"");
    setPhoto(localStorage.getItem("aibed_photo")||"");
    if (u.email) fetch(`/api/profile?email=${encodeURIComponent(u.email)}`).then(r=>r.json()).then(d=>{
      if (d.profile?.pseudo) setPseudo(d.profile.pseudo);
      if (d.profile?.photo) setPhoto(d.profile.photo);
    }).catch(()=>{});
  }, []);

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 600*1024) { alert("Image trop lourde (max 600 Ko)."); return; }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(f);
  }

  async function save() {
    localStorage.setItem("aibed_lang", lang);
    localStorage.setItem("aibed_avatar", String(avatar));
    localStorage.setItem("aibed_pseudo", pseudo);
    localStorage.setItem("aibed_photo", photo);
    if (user.email) {
      await fetch("/api/profile", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email:user.email, pseudo, photo }) }).catch(()=>{});
    }
    setSaved(true); setTimeout(()=>setSaved(false), 2000);
  }

  async function manageSubscription() {
    if (!user.email) return;
    setPortalBusy(true); setPortalErr("");
    const res = await fetch("/api/portal", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email:user.email }) });
    const d = await res.json();
    setPortalBusy(false);
    if (d.url) window.location.href = d.url;
    else setPortalErr(d.error || "Impossible d'ouvrir le portail.");
  }

  function logout() {
    localStorage.removeItem("aibed_user");
    signOut({ callbackUrl: "/" }).catch(()=>router.push("/"));
  }

  const isFounder = user.role === "founder";
  const card: React.CSSProperties = { background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"22px 24px", marginBottom:18 };
  const h: React.CSSProperties = { fontSize:".72rem", fontWeight:700, color:"white", textTransform:"uppercase", letterSpacing:".08em", marginBottom:16 };
  const row: React.CSSProperties = { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid rgba(10,26,92,0.4)", fontSize:".78rem" };
  const inp: React.CSSProperties = { width:"100%", background:"rgba(4,7,26,0.6)", border:"1px solid rgba(74,111,165,0.3)", borderRadius:8, padding:"11px 14px", color:"white", fontSize:".82rem", outline:"none" };

  return (
    <>
      <div className="cyber-grid" />
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, background:"rgba(4,7,26,0.9)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(10,26,92,0.6)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", height:56 }}>
        <Link href="/dashboard" style={{ textDecoration:"none", color:"var(--muted2)", fontSize:".78rem" }}>← Retour au dashboard</Link>
        <span style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1rem", fontWeight:900, color:"white" }}>AI-<span style={{ color:"var(--red)" }}>BED</span></span>
      </nav>

      <div style={{ maxWidth:640, margin:"0 auto", padding:"90px 20px 60px", position:"relative", zIndex:1 }}>
        <h1 style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1.3rem", fontWeight:900, color:"white", marginBottom:24 }}>⚙️ Paramètres</h1>

        {/* Profil */}
        <div style={card}>
          <div style={h}>👤 Mon profil</div>
          <div style={{ display:"flex", gap:18, alignItems:"center", marginBottom:16 }}>
            <div style={{ width:64, height:64, borderRadius:"50%", border:"2px solid var(--red)", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.8rem", background:"rgba(10,26,92,0.4)", flexShrink:0 }}>
              {photo ? <img src={photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : AVATARS[avatar]}
            </div>
            <div style={{ flex:1 }}>
              <label style={{ display:"inline-block", padding:"8px 14px", borderRadius:7, background:"rgba(74,111,165,0.15)", border:"1px solid rgba(74,111,165,0.3)", color:"var(--text)", fontSize:".7rem", cursor:"pointer" }}>
                📷 Choisir une photo<input type="file" accept="image/*" onChange={onPhoto} style={{ display:"none" }} />
              </label>
              {photo && <button onClick={()=>setPhoto("")} style={{ marginLeft:8, padding:"8px 12px", borderRadius:7, background:"transparent", border:"1px solid rgba(192,57,43,0.3)", color:"var(--red)", fontSize:".68rem", cursor:"pointer" }}>Retirer</button>}
              <div style={{ fontSize:".58rem", color:"var(--muted)", marginTop:6 }}>Sinon, votre avatar emoji est utilisé. Max 600 Ko.</div>
            </div>
          </div>
          <label style={{ fontSize:".66rem", color:"var(--muted2)" }}>Pseudo</label>
          <input style={{ ...inp, marginTop:6 }} value={pseudo} onChange={e=>setPseudo(e.target.value)} placeholder="Votre pseudo" />
        </div>

        {/* Compte */}
        <div style={card}>
          <div style={h}>Mon compte</div>
          <div style={row}><span style={{ color:"var(--muted2)" }}>Email</span><span style={{ color:"white" }}>{user.email||"—"}</span></div>
          <div style={row}><span style={{ color:"var(--muted2)" }}>Plan</span><span style={{ color:"var(--red)", fontWeight:700, textTransform:"uppercase" }}>{user.plan||"—"}</span></div>
          <div style={{ ...row, borderBottom:"none" }}><span style={{ color:"var(--muted2)" }}>Statut</span>
            <span style={{ color: isFounder?"#fbbf24":"var(--green)", fontWeight:700 }}>{isFounder?"👑 FONDATEUR":"Membre actif"}</span>
          </div>
        </div>

        {/* Abonnement */}
        {!isFounder && (
          <div style={card}>
            <div style={h}>💳 Mon abonnement</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14 }}>
              {PLANS.map(p=>(
                <div key={p.id} style={{ padding:"12px 10px", borderRadius:9, textAlign:"center", border:`1px solid ${user.plan===p.id?"var(--red)":"rgba(10,26,92,0.6)"}`, background:user.plan===p.id?"rgba(192,57,43,0.08)":"transparent" }}>
                  <div style={{ fontSize:".72rem", fontWeight:700, color:user.plan===p.id?"var(--red)":"white" }}>{p.label}{user.plan===p.id?" ✓":""}</div>
                  <div style={{ fontSize:".72rem", color:"var(--blue)", margin:"3px 0" }}>{p.price}</div>
                  <div style={{ fontSize:".54rem", color:"var(--muted)", lineHeight:1.3 }}>{p.feats}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:".66rem", color:"var(--muted2)", lineHeight:1.6, marginBottom:14, background:"rgba(74,144,217,0.06)", border:"1px solid rgba(74,144,217,0.2)", borderRadius:8, padding:"10px 13px" }}>
              ℹ️ Vous pouvez <strong>changer de formule</strong> (passer à un plan supérieur ou inférieur) ou <strong>annuler votre abonnement à tout moment</strong>, sans frais. Tout se gère en un clic via le portail sécurisé Stripe — la modification prend effet immédiatement et la facturation est ajustée automatiquement.
            </div>
            {portalErr && <div style={{ fontSize:".66rem", color:"var(--red)", marginBottom:10 }}>{portalErr}</div>}
            <button onClick={manageSubscription} disabled={portalBusy} style={{ width:"100%", padding:12, borderRadius:8, background:"var(--blue)", color:"white", border:"none", fontSize:".78rem", fontWeight:700, cursor:"pointer" }}>
              {portalBusy ? "Ouverture…" : "Gérer / changer / annuler mon abonnement"}
            </button>
          </div>
        )}

        {/* Langue */}
        <div style={card}>
          <div style={h}>🌍 Langue</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {LANGS.map(([code,label]) => (
              <div key={code} onClick={()=>setLang(code)} style={{ padding:"11px 14px", borderRadius:8, cursor:"pointer", fontSize:".8rem", textAlign:"center",
                border:`1px solid ${lang===code?"var(--red)":"rgba(10,26,92,0.6)"}`, background:lang===code?"rgba(192,57,43,0.08)":"transparent", color:lang===code?"white":"var(--muted2)" }}>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Avatar */}
        <div style={card}>
          <div style={h}>🤖 Avatar du bot</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(10,1fr)", gap:8 }}>
            {AVATARS.map((a,i) => (
              <div key={i} onClick={()=>setAvatar(i)} style={{ aspectRatio:"1", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem", borderRadius:8, cursor:"pointer",
                border:`1px solid ${avatar===i?"var(--red)":"rgba(10,26,92,0.6)"}`, background:avatar===i?"rgba(192,57,43,0.12)":"rgba(4,7,26,0.4)" }}>
                {a}
              </div>
            ))}
          </div>
        </div>

        <button onClick={save} style={{ width:"100%", padding:13, borderRadius:8, background:"var(--red)", color:"white", border:"none", fontSize:".82rem", fontWeight:700, letterSpacing:".08em", cursor:"pointer", boxShadow:"0 0 20px var(--red-glow)", marginBottom:12 }}>
          {saved ? "✓ Enregistré" : "Enregistrer les modifications"}
        </button>
        <button onClick={logout} style={{ width:"100%", padding:13, borderRadius:8, background:"transparent", color:"var(--muted2)", border:"1px solid rgba(10,26,92,0.6)", fontSize:".78rem", fontWeight:600, cursor:"pointer" }}>
          🚪 Se déconnecter
        </button>
      </div>
    </>
  );
}
