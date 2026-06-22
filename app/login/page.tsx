"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const FOUNDER_EMAIL = "ramos.o62oo@gmail.com";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [otp, setOtp] = useState(["","","","","",""]);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isFounder = email.toLowerCase() === FOUNDER_EMAIL;
  const otpRefs = useRef<(HTMLInputElement|null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible d'envoyer le code.");
        setLoading(false);
        return;
      }
      setLoading(false);
      setStep("otp");
      setTimer(59);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("Erreur de connexion au serveur.");
      setLoading(false);
    }
  }

  async function resendOtp() {
    setTimer(59);
    await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  }

  function handleOtpChange(i: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val;
    setOtp(next);
    if (val && i < 5) otpRefs.current[i+1]?.focus();
    if (next.join("").length === 6) verifyOtp(next.join(""));
  }

  function handleOtpKey(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i-1]?.focus();
  }

  async function verifyOtp(code?: string) {
    const c = code || otp.join("");
    if (c.length < 6) { setError("Entrez les 6 chiffres."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: c }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Code incorrect.");
        setOtp(["","","","","",""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
        setLoading(false);
        return;
      }
      localStorage.setItem("aibed_user", JSON.stringify({
        email, role: data.role || (isFounder ? "founder" : "user"),
        plan: data.plan || (isFounder ? "elite" : "starter"), loggedIn: true,
      }));
      router.push("/dashboard");
    } catch {
      setError("Erreur de connexion au serveur.");
      setLoading(false);
    }
  }

  const s: Record<string, React.CSSProperties> = {
    wrap: { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"80px 20px 40px", position:"relative", zIndex:1 },
    card: { background:"rgba(6,13,46,0.75)", backdropFilter:"blur(24px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:16, padding:"36px 32px", width:"100%", maxWidth:420 },
    logo: { fontFamily:"Orbitron,monospace", fontSize:"1.5rem", fontWeight:900, color:"white", textAlign:"center", display:"block", marginBottom:24 },
    title: { fontFamily:"Orbitron,monospace", fontSize:".9rem", fontWeight:700, color:"white", letterSpacing:".1em", textAlign:"center", marginBottom:4 },
    sub: { fontSize:".7rem", color:"var(--muted)", textAlign:"center", marginBottom:24 },
    label: { display:"block", fontSize:".68rem", color:"var(--muted2)", marginBottom:5, letterSpacing:".06em" },
    input: { width:"100%", background:"rgba(4,7,26,0.6)", border:"1px solid rgba(74,111,165,0.3)", borderRadius:8, padding:"12px 14px", color:"white", fontSize:".82rem", outline:"none", fontFamily:"Inter,sans-serif" },
    btn: { width:"100%", padding:13, borderRadius:8, background:"var(--red)", color:"white", border:"none", fontSize:".82rem", fontWeight:700, letterSpacing:".1em", cursor:"pointer", boxShadow:"0 0 20px var(--red-glow)", marginTop:8, display:"flex", alignItems:"center", justifyContent:"center", gap:8 },
    social: { width:"100%", padding:11, borderRadius:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(74,111,165,0.3)", color:"var(--text)", fontSize:".78rem", fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:10 },
    divider: { display:"flex", alignItems:"center", gap:10, margin:"16px 0", fontSize:".62rem", color:"var(--muted)" },
    hr: { flex:1, height:1, background:"rgba(10,26,92,0.6)" },
    otp: { width:44, height:52, background:"rgba(4,7,26,0.7)", border:"1px solid rgba(74,111,165,0.3)", borderRadius:8, color:"white", fontSize:"1.3rem", fontWeight:700, textAlign:"center" as const, outline:"none", fontFamily:"Orbitron,monospace" },
    info: { background:"rgba(74,144,217,0.06)", border:"1px solid rgba(74,144,217,0.2)", borderRadius:8, padding:"11px 14px", fontSize:".67rem", color:"var(--muted2)", textAlign:"center" as const, marginBottom:16, lineHeight:1.6 },
    founder: { background:"linear-gradient(135deg,rgba(192,57,43,0.2),rgba(192,57,43,0.05))", border:"1px solid rgba(192,57,43,0.4)", borderRadius:8, padding:"10px 14px", textAlign:"center" as const, marginBottom:16, fontSize:".68rem", color:"var(--red)", fontWeight:700, letterSpacing:".1em" },
    err: { background:"rgba(192,57,43,0.1)", border:"1px solid rgba(192,57,43,0.3)", borderRadius:6, padding:"8px 12px", fontSize:".68rem", color:"var(--red)", marginBottom:12, textAlign:"center" as const },
    switch: { textAlign:"center" as const, marginTop:18, fontSize:".7rem", color:"var(--muted)" },
  };

  return (
    <>
      <div className="cyber-grid" />
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, background:"rgba(4,7,26,0.9)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(10,26,92,0.6)", display:"flex", alignItems:"center", padding:"0 28px", height:56 }}>
        <Link href="/" style={{ textDecoration:"none" }}>
          <span style={{ fontFamily:"Orbitron,monospace", fontSize:"1.1rem", fontWeight:900, color:"white", letterSpacing:".12em" }}>AI-<span style={{ color:"var(--red)" }}>BED</span></span>
        </Link>
      </nav>

      <div style={s.wrap}>
        <div style={s.card}>
          <span style={s.logo}>AI-<span style={{ color:"var(--red)" }}>BED</span></span>

          {/* STEP 1 — Credentials */}
          {step === "credentials" && <>
            <div style={s.title}>Connexion</div>
            <div style={s.sub}>Content de vous revoir, Trader</div>

            {/* Google */}
            <button style={s.social} onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continuer avec Google
            </button>
            <button style={s.social} onClick={() => router.push("/dashboard")}>
              <svg width="18" height="18" viewBox="0 0 814 1000" fill="white"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-127.4C46 790.8 0 694.6 0 602.5 0 384.2 141.3 269.3 280.3 269.3c74.6 0 136.6 48.8 182.6 48.8 44.5 0 114.6-51.6 200.5-51.6zm-159.7-127.4c33.3-40.9 58.5-96.6 58.5-152.3 0-7.7-.6-15.5-2-22.5-55.5 2-121 37-161.5 84.5-33.3 37.9-63.4 94.5-63.4 151.2 0 8.3.9 16.7 2.5 23.2 4.2.7 8.5 1 12.7 1 50.8 0 112.8-33.7 153.2-85.1z"/></svg>
              Continuer avec Apple
            </button>

            <div style={s.divider}><div style={s.hr}/><span>ou</span><div style={s.hr}/></div>

            {error && <div style={s.err}>{error}</div>}
            <form onSubmit={handleCredentials}>
              <div style={{ marginBottom:14 }}>
                <label style={s.label}>Adresse email</label>
                <input style={s.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="trader@exemple.com" required />
              </div>
              <div style={{ marginBottom:6 }}>
                <label style={s.label}>Mot de passe</label>
                <input style={s.input} type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" required />
              </div>
              <div style={{ textAlign:"right", marginBottom:14 }}>
                <a href="#" style={{ fontSize:".62rem", color:"var(--muted)", textDecoration:"none" }}>Mot de passe oublié ?</a>
              </div>
              <button type="submit" style={s.btn} disabled={loading}>
                {loading ? "⏳ Vérification..." : "Continuer →"}
              </button>
            </form>
            <div style={s.switch}>Pas de compte ? <Link href="/register" style={{ color:"var(--red)", textDecoration:"none", fontWeight:600 }}>S&apos;inscrire</Link></div>
          </>}

          {/* STEP 2 — OTP */}
          {step === "otp" && <>
            <button onClick={() => setStep("credentials")} style={{ background:"none", border:"none", color:"var(--muted)", fontSize:".68rem", cursor:"pointer", display:"flex", alignItems:"center", gap:4, marginBottom:16 }}>
              ← Retour
            </button>
            <div style={s.title}>Vérification 2FA</div>
            <div style={s.sub}>Code envoyé par SMS</div>

            <div style={s.info}>
              Code à 6 chiffres envoyé au numéro associé à<br/>
              <strong style={{ color:"var(--blue)" }}>{email}</strong>
            </div>

            {error && <div style={s.err}>{error}</div>}

            <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:20 }}>
              {otp.map((v, i) => (
                <input key={i} ref={el => { otpRefs.current[i] = el; }} style={s.otp}
                  type="text" inputMode="numeric" maxLength={1} value={v}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKey(i, e)} />
              ))}
            </div>

            <button style={s.btn} onClick={() => verifyOtp()} disabled={loading}>
              {loading ? "⏳ Connexion..." : "✓ Vérifier et se connecter"}
            </button>

            <div style={{ textAlign:"center", marginTop:12, fontSize:".62rem", color:"var(--muted)" }}>
              Pas reçu ?{" "}
              {timer > 0
                ? <span>Renvoyer dans {timer}s</span>
                : <a href="#" onClick={e=>{e.preventDefault();resendOtp();}} style={{ color:"var(--red)", textDecoration:"none" }}>Renvoyer le code</a>
              }
            </div>
          </>}
        </div>
      </div>
    </>
  );
}
