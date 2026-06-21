"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const WHALE_ITEMS = [
  { sym: "BTC", val: "+2.3%", price: "$64,194", alert: "🔴 ALERT 500M USDT déplacés" },
  { sym: "ETH", val: "+1.8%", price: "$3,421", alert: "" },
  { sym: "PEPE", val: "+18.4%", price: "$0.0000142", alert: "🟢 Whale achète 2B tokens" },
  { sym: "SOL", val: "-0.9%", price: "$178", alert: "" },
  { sym: "DOGE", val: "+5.2%", price: "$0.142", alert: "🟡 Volume x8 en 1h" },
  { sym: "BNB", val: "+0.4%", price: "$611", alert: "" },
];

const MODES = [
  { id: "patient", emoji: "🧘", label: "Patient", color: "#4a90d9", desc: "Long terme, faible risque. Positions solides sur actifs établis.", risk: "Faible", ret: "+15-40%/an", tf: "Semaines" },
  { id: "actif", emoji: "⚡", label: "Actif", color: "#27ae60", desc: "Swing trading, opportunités sécurisées. Mix de crypto et DeFi.", risk: "Moyen", ret: "+40-120%/an", tf: "Jours" },
  { id: "agressif", emoji: "🔥", label: "Agressif", color: "#c0392b", desc: "Scalping temps réel sur memecoins. Levier x5, entrées ultra-rapides.", risk: "Élevé", ret: "+100-500%/an", tf: "Minutes" },
];

const FEATURES = [
  { icon: "🐋", title: "Whale Tracker", desc: "Suivez les mouvements des grosses baleines en temps réel" },
  { icon: "🤖", title: "Bot IA personnalisé", desc: "20 avatars uniques, configurez votre stratégie en 1 clic" },
  { icon: "📰", title: "Actualités crypto", desc: "Toutes les news en temps réel intégrées au dashboard" },
  { icon: "🔗", title: "Multi-exchange", desc: "Binance, Coinbase, Kraken et plus encore" },
  { icon: "🛡️", title: "Sécurisé MiCA", desc: "Conforme aux normes européennes RGPD et MiCA" },
  { icon: "📱", title: "iOS & Android", desc: "Application mobile native disponible sur les stores" },
];

const PLANS = [
  { name: "STARTER", price: "9,90", color: "#4a90d9", features: ["1 bot actif", "Mode Patient uniquement", "Whale Tracker basique", "Support email"], popular: false },
  { name: "PRO", price: "29,90", color: "#c0392b", features: ["3 bots actifs", "Tous les modes", "Whale Tracker avancé", "Signaux IA prioritaires", "Support 24/7"], popular: true },
  { name: "ELITE", price: "79,90", color: "#fbbf24", features: ["Bots illimités", "Tous les modes + levier", "Whale Tracker live", "API privée", "Gestionnaire dédié", "Accès bêta"], popular: false },
];

const AVATARS = ["🐂","🦅","🐉","🦁","🐺","🦊","🤖","👾","🎯","💀","🌙","⚡","🔥","💎","🚀","🌊","🎭","🏆","👑","⚔️"];

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const pts = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3,
      r: Math.random() * 1.5 + .5, a: Math.random() * .4,
    }));
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(192,57,43,${p.a})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <div className="cyber-grid" />
      <canvas ref={canvasRef} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }} />

      {/* NAVBAR */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:50,
        background:"rgba(4,7,26,0.9)", backdropFilter:"blur(20px)",
        borderBottom: scrolled ? "1px solid rgba(192,57,43,0.3)" : "1px solid rgba(10,26,92,0.6)",
        display:"flex", alignItems:"center", padding:"0 32px", height:60, transition:"border-color .3s",
      }}>
        <Link href="/" style={{ textDecoration:"none" }}>
          <div style={{ fontFamily:"Orbitron,monospace", fontSize:"1.2rem", fontWeight:900, color:"white", letterSpacing:".12em" }}>
            AI-<span style={{ color:"var(--red)" }}>BED</span>
          </div>
          <div style={{ fontSize:".48rem", color:"var(--muted)", letterSpacing:".2em", textTransform:"uppercase" }}>Build Edge Discipline</div>
        </Link>
        <div style={{ display:"flex", gap:24, marginLeft:36, fontSize:".75rem" }}>
          {[["#features","Fonctionnalités"],["#pricing","Tarifs"],["#avatars","Bots"],].map(([h,l])=>(
            <a key={h} href={h} style={{ textDecoration:"none", color:"var(--muted2)", transition:"color .2s" }}
              onMouseEnter={e=>(e.currentTarget.style.color="white")}
              onMouseLeave={e=>(e.currentTarget.style.color="var(--muted2)")}>{l}</a>
          ))}
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:10 }}>
          <Link href="/login" style={{ padding:"8px 18px", borderRadius:6, border:"1px solid var(--border2)", color:"var(--text)", fontSize:".75rem", fontWeight:600, textDecoration:"none" }}>Connexion</Link>
          <Link href="/register" style={{ padding:"8px 18px", borderRadius:6, background:"var(--red)", color:"white", fontSize:".75rem", fontWeight:700, textDecoration:"none", boxShadow:"0 0 16px var(--red-glow)" }}>Commencer</Link>
        </div>
      </nav>

      {/* WHALE TICKER */}
      <div style={{ position:"fixed", top:60, left:0, right:0, zIndex:40, background:"rgba(4,7,26,0.95)", borderBottom:"1px solid var(--border)", height:30, overflow:"hidden", display:"flex", alignItems:"center" }}>
        <div style={{ display:"flex", gap:28, animation:"ticker 25s linear infinite", whiteSpace:"nowrap", paddingLeft:"100%" }}>
          {[...WHALE_ITEMS,...WHALE_ITEMS].map((item,i)=>(
            <span key={i} style={{ fontSize:".62rem", display:"flex", alignItems:"center", gap:6 }}>
              {item.alert && <span style={{ color:"var(--red)" }}>{item.alert}</span>}
              <span style={{ color:"var(--muted2)", fontWeight:700 }}>{item.sym}</span>
              <span style={{ color:item.val.startsWith("+")?"var(--green)":"var(--red)" }}>{item.val}</span>
              <span style={{ color:"var(--muted)" }}>{item.price}</span>
              <span style={{ color:"var(--border2)" }}>•</span>
            </span>
          ))}
        </div>
      </div>

      <main style={{ position:"relative", zIndex:1, paddingTop:90 }}>

        {/* HERO */}
        <section style={{ textAlign:"center", padding:"80px 20px 60px", maxWidth:860, margin:"0 auto" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 16px", border:"1px solid rgba(192,57,43,0.3)", borderRadius:20, marginBottom:28, fontSize:".62rem", color:"var(--muted2)", letterSpacing:".1em" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--red)", display:"inline-block", animation:"pulse-red 2s infinite" }} />
            INTELLIGENCE ARTIFICIELLE • TEMPS RÉEL • SÉCURISÉ
          </div>
          <h1 style={{ fontFamily:"Orbitron,monospace", fontSize:"clamp(2.5rem,8vw,5rem)", fontWeight:900, marginBottom:16, lineHeight:1.05 }}>
            <span style={{ color:"white" }}>AI-</span>
            <span style={{ color:"var(--red)", textShadow:"0 0 40px var(--red-glow)" }}>BED</span>
          </h1>
          <h2 style={{ fontSize:"clamp(1rem,3vw,1.6rem)", color:"var(--muted2)", fontWeight:400, marginBottom:14 }}>Automatisez votre trading</h2>
          <p style={{ fontSize:".85rem", color:"var(--muted)", maxWidth:520, margin:"0 auto 36px", lineHeight:1.8 }}>
            Trois modes de trading adaptés à votre profil. Du long terme serein à l&apos;agressif ultra-rapide.
          </p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <Link href="/register" style={{ padding:"13px 28px", borderRadius:8, background:"var(--red)", color:"white", fontWeight:700, fontSize:".82rem", letterSpacing:".1em", textDecoration:"none", boxShadow:"0 0 20px var(--red-glow)" }}>🚀 Commencer gratuitement</Link>
            <Link href="/dashboard" style={{ padding:"13px 28px", borderRadius:8, border:"1px solid var(--border2)", color:"var(--text)", fontWeight:600, fontSize:".82rem", textDecoration:"none" }}>👁 Voir la démo</Link>
          </div>
        </section>

        {/* MODES */}
        <section style={{ padding:"40px 20px", maxWidth:1100, margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:14 }}>
            {MODES.map(m=>(
              <div key={m.id} className="card" style={{ padding:24, transition:"all .3s" }}
                onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor=m.color; el.style.transform="translateY(-4px)"; }}
                onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor=""; el.style.transform=""; }}>
                <div style={{ fontSize:"1.8rem", marginBottom:10 }}>{m.emoji}</div>
                <div style={{ fontFamily:"Orbitron,monospace", fontSize:".8rem", fontWeight:700, color:m.color, letterSpacing:".1em", marginBottom:8 }}>{m.label}</div>
                <p style={{ fontSize:".72rem", color:"var(--muted)", lineHeight:1.7, marginBottom:14 }}>{m.desc}</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
                  {[["Risque",m.risk],["Rendement",m.ret],["Horizon",m.tf]].map(([k,v])=>(
                    <div key={k} style={{ background:"rgba(4,7,26,0.5)", borderRadius:6, padding:"7px 4px", textAlign:"center" }}>
                      <div style={{ fontSize:".48rem", color:"var(--muted)", textTransform:"uppercase", letterSpacing:".1em", marginBottom:2 }}>{k}</div>
                      <div style={{ fontSize:".62rem", fontWeight:700, color:m.color }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" style={{ padding:"60px 20px", maxWidth:1100, margin:"0 auto" }}>
          <h2 style={{ fontFamily:"Orbitron,monospace", fontSize:"1rem", fontWeight:700, color:"white", textAlign:"center", letterSpacing:".12em", marginBottom:6 }}>Tout ce dont vous avez besoin</h2>
          <p style={{ fontSize:".72rem", color:"var(--muted)", textAlign:"center", marginBottom:32 }}>Une plateforme complète pour trader comme un professionnel</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:10 }}>
            {FEATURES.map(f=>(
              <div key={f.title} className="card" style={{ padding:18, display:"flex", gap:12 }}>
                <span style={{ fontSize:"1.3rem" }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize:".75rem", fontWeight:700, color:"white", marginBottom:3 }}>{f.title}</div>
                  <div style={{ fontSize:".65rem", color:"var(--muted)", lineHeight:1.6 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AVATARS */}
        <section id="avatars" style={{ padding:"60px 20px", maxWidth:800, margin:"0 auto", textAlign:"center" }}>
          <h2 style={{ fontFamily:"Orbitron,monospace", fontSize:"1rem", fontWeight:700, color:"white", letterSpacing:".12em", marginBottom:6 }}>Choisissez votre Bot</h2>
          <p style={{ fontSize:".72rem", color:"var(--muted)", marginBottom:28 }}>20 avatars uniques — chacun avec sa personnalité de trading</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10, justifyContent:"center", marginBottom:16 }}>
            {AVATARS.map((av,i)=>(
              <div key={i} onClick={()=>setSelectedAvatar(i)} style={{
                width:52, height:52, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"1.4rem", cursor:"pointer", transition:"all .2s",
                background: selectedAvatar===i ? "rgba(192,57,43,0.15)" : "rgba(6,13,46,0.6)",
                border: selectedAvatar===i ? "2px solid var(--red)" : "1px solid var(--border)",
                boxShadow: selectedAvatar===i ? "0 0 14px var(--red-glow)" : "none",
                transform: selectedAvatar===i ? "scale(1.15)" : "scale(1)",
              }}>{av}</div>
            ))}
          </div>
          <p style={{ fontSize:".72rem", color:"var(--muted2)" }}>Sélectionné : <strong style={{ color:"var(--red)" }}>{AVATARS[selectedAvatar]} Bot #{selectedAvatar+1}</strong></p>
        </section>

        {/* PRICING */}
        <section id="pricing" style={{ padding:"60px 20px", maxWidth:980, margin:"0 auto" }}>
          <h2 style={{ fontFamily:"Orbitron,monospace", fontSize:"1rem", fontWeight:700, color:"white", textAlign:"center", letterSpacing:".12em", marginBottom:36 }}>Choisissez votre plan</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:14 }}>
            {PLANS.map(p=>(
              <div key={p.name} className="card" style={{ padding:26, textAlign:"center", position:"relative", border:p.popular?`1px solid ${p.color}`:undefined, boxShadow:p.popular?"0 0 30px rgba(192,57,43,0.15)":undefined }}>
                {p.popular && <div style={{ position:"absolute", top:-11, left:"50%", transform:"translateX(-50%)", background:p.color, color:"white", fontSize:".52rem", fontWeight:700, letterSpacing:".15em", padding:"3px 12px", borderRadius:10 }}>POPULAIRE</div>}
                <div style={{ fontFamily:"Orbitron,monospace", fontSize:".75rem", fontWeight:700, color:p.color, letterSpacing:".15em", marginBottom:10 }}>{p.name}</div>
                <div style={{ fontSize:"2rem", fontWeight:900, color:"white", marginBottom:4 }}>{p.price}<span style={{ fontSize:".7rem", color:"var(--muted)", fontWeight:400 }}>€/mois</span></div>
                <div style={{ margin:"18px 0", display:"flex", flexDirection:"column", gap:7 }}>
                  {p.features.map(f=>(
                    <div key={f} style={{ fontSize:".7rem", color:"var(--muted2)", display:"flex", alignItems:"center", gap:7 }}>
                      <span style={{ color:p.color }}>✓</span>{f}
                    </div>
                  ))}
                </div>
                <Link href={`/register?plan=${p.name.toLowerCase()}`} style={{ display:"block", padding:"10px", borderRadius:7, textDecoration:"none", background:p.popular?p.color:"transparent", border:`1px solid ${p.color}`, color:p.popular?"white":p.color, fontSize:".72rem", fontWeight:700, letterSpacing:".08em" }}>
                  Choisir {p.name}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop:"1px solid var(--border)", padding:"28px 20px", textAlign:"center" }}>
          <div style={{ fontFamily:"Orbitron,monospace", fontSize:"1.1rem", fontWeight:900, color:"white", marginBottom:4 }}>AI-<span style={{ color:"var(--red)" }}>BED</span></div>
          <p style={{ fontSize:".62rem", color:"var(--muted)", marginBottom:14 }}>Build Edge Discipline</p>
          <div style={{ display:"flex", gap:10, justifyContent:"center", marginBottom:16 }}>
            {["🇪🇺 MiCA","🔒 RGPD","🏛️ AMF"].map(b=>(
              <span key={b} style={{ fontSize:".58rem", padding:"3px 10px", border:"1px solid var(--border)", borderRadius:20, color:"var(--muted)" }}>{b}</span>
            ))}
          </div>
          <p style={{ fontSize:".6rem", color:"var(--muted)" }}>© 2026 AI-BED — Tous droits réservés</p>
        </footer>
      </main>
    </>
  );
}
