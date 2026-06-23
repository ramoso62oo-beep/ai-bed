"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { signIn } from "next-auth/react";

const FOUNDER_EMAIL = "ramos.o62oo@gmail.com";
const PLANS = [
  { id:"starter", label:"STARTER", price:"9,90", color:"#4a90d9" },
  { id:"pro",     label:"PRO ⭐",  price:"29,90", color:"#c0392b" },
  { id:"elite",   label:"ELITE",   price:"79,90", color:"#fbbf24" },
];
const DIAL = ["+33 🇫🇷","+1 🇺🇸","+44 🇬🇧","+49 🇩🇪","+34 🇪🇸","+32 🇧🇪","+41 🇨🇭","+212 🇲🇦","+213 🇩🇿","+216 🇹🇳"];

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [plan, setPlan] = useState(params.get("plan") || "pro");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dial, setDial] = useState("+33 🇫🇷");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isFounder = email.toLowerCase() === FOUNDER_EMAIL;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pass !== pass2) { setError("Les mots de passe ne correspondent pas."); return; }
    if (pass.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    setError(""); setLoading(true);

    localStorage.setItem("aibed_user", JSON.stringify({
      email, phone: dial.split(" ")[0] + phone, fname, lname,
      role: isFounder ? "founder" : "user",
      plan: isFounder ? "elite" : "none", loggedIn: false, // plan accordé après paiement uniquement
    }));

    // Enregistrer le compte dans la base de données Supabase
    try {
      await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email, full_name: `${fname} ${lname}`.trim(),
          phone: dial.split(" ")[0] + phone, plan,
        }),
      });
    } catch { /* on continue même si l'enregistrement échoue */ }

    // Fondateur → accès gratuit, on passe directement à la connexion 2FA
    if (isFounder) {
      router.push("/login");
      return;
    }

    // Sinon → redirection vers le paiement Stripe
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.founder) {
        router.push("/login");
      } else {
        setError(data.error || "Erreur lors du paiement.");
        setLoading(false);
      }
    } catch {
      setError("Impossible de contacter le serveur de paiement.");
      setLoading(false);
    }
  }

  const inp: React.CSSProperties = { width:"100%", background:"rgba(4,7,26,0.6)", border:"1px solid rgba(74,111,165,0.3)", borderRadius:8, padding:"11px 14px", color:"white", fontSize:".78rem", outline:"none", fontFamily:"Inter,sans-serif" };
  const lbl: React.CSSProperties = { display:"block", fontSize:".66rem", color:"var(--muted2)", marginBottom:5, letterSpacing:".06em" };

  return (
    <>
      <div className="cyber-grid" />
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, background:"rgba(4,7,26,0.9)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(10,26,92,0.6)", display:"flex", alignItems:"center", padding:"0 28px", height:56 }}>
        <Link href="/" style={{ textDecoration:"none" }}>
          <span style={{ fontFamily:"Orbitron,monospace", fontSize:"1.1rem", fontWeight:900, color:"white" }}>AI-<span style={{ color:"var(--red)" }}>BED</span></span>
        </Link>
      </nav>

      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"80px 20px 40px", position:"relative", zIndex:1 }}>
        <div style={{ background:"rgba(6,13,46,0.75)", backdropFilter:"blur(24px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:16, padding:"32px 28px", width:"100%", maxWidth:460 }}>

          <div style={{ fontFamily:"Orbitron,monospace", fontSize:"1.4rem", fontWeight:900, color:"white", textAlign:"center", marginBottom:20 }}>
            AI-<span style={{ color:"var(--red)" }}>BED</span>
          </div>
          <div style={{ fontFamily:"Orbitron,monospace", fontSize:".85rem", fontWeight:700, color:"white", letterSpacing:".1em", textAlign:"center", marginBottom:4 }}>Créer votre compte</div>
          <div style={{ fontSize:".68rem", color:"var(--muted)", textAlign:"center", marginBottom:22 }}>Rejoignez des milliers de traders automatisés</div>

          {/* Google */}
          <button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} style={{ width:"100%", padding:11, borderRadius:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(74,111,165,0.3)", color:"var(--text)", fontSize:".76rem", fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:14 }}>
            <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            S&apos;inscrire avec Google
          </button>

          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, fontSize:".6rem", color:"var(--muted)" }}>
            <div style={{ flex:1, height:1, background:"rgba(10,26,92,0.6)" }}/><span>ou remplir le formulaire</span><div style={{ flex:1, height:1, background:"rgba(10,26,92,0.6)" }}/>
          </div>

          {/* Plan selector */}
          <div style={{ fontSize:".65rem", color:"var(--muted2)", marginBottom:7, letterSpacing:".06em" }}>Votre plan</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7, marginBottom:16 }}>
            {PLANS.map(p => (
              <div key={p.id} onClick={() => setPlan(p.id)} style={{ border:`1px solid ${plan===p.id ? p.color : "rgba(10,26,92,0.6)"}`, borderRadius:8, padding:"9px 6px", textAlign:"center", cursor:"pointer", background: plan===p.id ? `rgba(${p.color === "#c0392b" ? "192,57,43" : p.color === "#4a90d9" ? "74,144,217" : "251,191,36"},0.08)` : "transparent", transition:"all .2s" }}>
                <div style={{ fontSize:".62rem", fontWeight:700, color:plan===p.id ? p.color : "var(--text)", letterSpacing:".08em" }}>{p.label}</div>
                <div style={{ fontSize:".6rem", color:p.color, marginTop:2 }}>{p.price}€/mois</div>
              </div>
            ))}
          </div>

          {error && <div style={{ background:"rgba(192,57,43,0.1)", border:"1px solid rgba(192,57,43,0.3)", borderRadius:6, padding:"7px 12px", fontSize:".66rem", color:"var(--red)", marginBottom:12, textAlign:"center" }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
              <div><label style={lbl}>Prénom</label><input style={inp} value={fname} onChange={e=>setFname(e.target.value)} placeholder="Jean" required /></div>
              <div><label style={lbl}>Nom</label><input style={inp} value={lname} onChange={e=>setLname(e.target.value)} placeholder="Dupont" required /></div>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Email</label>
              <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="trader@exemple.com" required />
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Numéro de téléphone <span style={{ color:"var(--red)" }}>*</span></label>
              <div style={{ display:"flex", gap:7 }}>
                <select value={dial} onChange={e=>setDial(e.target.value)} style={{ ...inp, width:110, flexShrink:0, padding:"11px 8px" }}>
                  {DIAL.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
                <input style={inp} type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="06 12 34 56 78" required />
              </div>
              <div style={{ fontSize:".58rem", color:"var(--muted)", marginTop:4 }}>🔒 Utilisé uniquement pour la vérification 2FA</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
              <div><label style={lbl}>Mot de passe</label><input style={inp} type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" minLength={8} required /></div>
              <div><label style={lbl}>Confirmer</label><input style={inp} type="password" value={pass2} onChange={e=>setPass2(e.target.value)} placeholder="••••••••" required /></div>
            </div>
            <button type="submit" disabled={loading} style={{ width:"100%", padding:13, borderRadius:8, background:"var(--red)", color:"white", border:"none", fontSize:".8rem", fontWeight:700, letterSpacing:".1em", cursor:"pointer", boxShadow:"0 0 20px var(--red-glow)" }}>
              {loading ? "⏳ Redirection vers le paiement..." : isFounder ? "Créer mon compte →" : `Payer ${PLANS.find(p=>p.id===plan)?.price}€/mois et continuer →`}
            </button>
          </form>

          <div style={{ fontSize:".58rem", color:"var(--muted)", textAlign:"center", marginTop:12, lineHeight:1.6 }}>
            En vous inscrivant, vous acceptez nos <Link href="/legal" style={{ color:"var(--red)", textDecoration:"none" }}>CGU</Link> et notre <Link href="/legal" style={{ color:"var(--red)", textDecoration:"none" }}>Politique de confidentialité</Link>. ⚠️ Le trading comporte des risques de perte. Paiement sécurisé par Stripe.
          </div>
          <div style={{ textAlign:"center", marginTop:14, fontSize:".68rem", color:"var(--muted)" }}>
            Déjà un compte ? <Link href="/login" style={{ color:"var(--red)", textDecoration:"none", fontWeight:600 }}>Se connecter</Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
