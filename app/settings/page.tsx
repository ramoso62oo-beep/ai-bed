"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

const LANGS = [["fr","🇫🇷 Français"],["en","🇬🇧 English"],["es","🇪🇸 Español"],["ar","🇸🇦 العربية"]];
const AVATARS = ["🐂","🦅","🐉","🦁","🐺","🦊","🤖","👾","🎯","💀","🌙","⚡","🔥","💎","🚀","🌊","🎭","🏆","👑","⚔️"];

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{email?:string;role?:string;plan?:string}>({});
  const [lang, setLang] = useState("fr");
  const [avatar, setAvatar] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem("aibed_user")||"{}")); } catch {}
    setLang(localStorage.getItem("aibed_lang")||"fr");
    setAvatar(Number(localStorage.getItem("aibed_avatar")||0));
  }, []);

  function save() {
    localStorage.setItem("aibed_lang", lang);
    localStorage.setItem("aibed_avatar", String(avatar));
    setSaved(true);
    setTimeout(()=>setSaved(false), 2000);
  }

  function logout() {
    localStorage.removeItem("aibed_user");
    signOut({ callbackUrl: "/" }).catch(()=>router.push("/"));
  }

  const isFounder = user.role === "founder";
  const card: React.CSSProperties = { background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"22px 24px", marginBottom:18 };
  const h: React.CSSProperties = { fontSize:".72rem", fontWeight:700, color:"white", textTransform:"uppercase", letterSpacing:".08em", marginBottom:16 };
  const row: React.CSSProperties = { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid rgba(10,26,92,0.4)", fontSize:".78rem" };

  return (
    <>
      <div className="cyber-grid" />
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, background:"rgba(4,7,26,0.9)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(10,26,92,0.6)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", height:56 }}>
        <Link href="/dashboard" style={{ textDecoration:"none", color:"var(--muted2)", fontSize:".78rem" }}>← Retour au dashboard</Link>
        <span style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1rem", fontWeight:900, color:"white" }}>AI-<span style={{ color:"var(--red)" }}>BED</span></span>
      </nav>

      <div style={{ maxWidth:640, margin:"0 auto", padding:"90px 20px 60px", position:"relative", zIndex:1 }}>
        <h1 style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1.3rem", fontWeight:900, color:"white", marginBottom:24 }}>⚙️ Paramètres</h1>

        {/* Compte */}
        <div style={card}>
          <div style={h}>Mon compte</div>
          <div style={row}><span style={{ color:"var(--muted2)" }}>Email</span><span style={{ color:"white" }}>{user.email||"—"}</span></div>
          <div style={row}><span style={{ color:"var(--muted2)" }}>Plan</span><span style={{ color:"var(--red)", fontWeight:700, textTransform:"uppercase" }}>{user.plan||"—"}</span></div>
          <div style={{ ...row, borderBottom:"none" }}><span style={{ color:"var(--muted2)" }}>Statut</span>
            <span style={{ color: isFounder?"#fbbf24":"var(--green)", fontWeight:700 }}>{isFounder?"👑 FONDATEUR":"Membre actif"}</span>
          </div>
        </div>

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

        {/* Avatar du bot */}
        <div style={card}>
          <div style={h}>🤖 Avatar de mon bot</div>
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
