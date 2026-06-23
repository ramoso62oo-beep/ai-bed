"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export type Access = { ready:boolean; loggedIn:boolean; plan:string; role:string; paid:boolean; founder:boolean };
const PAID = ["starter","pro","elite"];

// Hook : lit le niveau d'accès de l'utilisateur + gère l'expiration de la démo (7 jours)
export function useAccess(): Access {
  const [a, setA] = useState<Access>({ ready:false, loggedIn:false, plan:"none", role:"", paid:false, founder:false });
  useEffect(() => {
    let u: { email?:string; loggedIn?:boolean; plan?:string; role?:string } = {};
    try { u = JSON.parse(localStorage.getItem("aibed_user")||"{}"); } catch {}
    const founder = u.role === "founder";
    const paid = founder || PAID.includes(u.plan||"");

    // Démo auto à la création + reset après 7 jours (sauf abonnés)
    if (u.email) {
      let start = localStorage.getItem("aibed_demo_start");
      if (!start) { start = String(Date.now()); localStorage.setItem("aibed_demo_start", start); }
      const days = (Date.now() - Number(start)) / 86400000;
      if (days > 7 && !paid) {
        // Réinitialise les données de démo
        ["aibed_bots","aibed_assigned"].forEach(k=>localStorage.removeItem(k));
        localStorage.setItem("aibed_demo_start", String(Date.now()));
        localStorage.setItem("aibed_demo_reset", "1");
      }
    }
    setA({ ready:true, loggedIn: !!(u.loggedIn||u.email), plan:u.plan||"none", role:u.role||"", paid, founder });

    // Rafraîchit le VRAI plan depuis la base (corrige tout localStorage périmé)
    if (u.email && !founder) {
      fetch(`/api/profile?email=${encodeURIComponent(u.email)}`).then(r=>r.json()).then(d=>{
        const p = d.profile || {};
        const realPaid = p.subscription_status === "active" && PAID.includes(p.plan);
        const realPlan = realPaid ? p.plan : "none";
        try {
          const stored = JSON.parse(localStorage.getItem("aibed_user")||"{}");
          if (stored.plan !== realPlan) { stored.plan = realPlan; localStorage.setItem("aibed_user", JSON.stringify(stored)); }
        } catch {}
        setA(prev => ({ ...prev, plan: realPlan, paid: realPaid }));
      }).catch(()=>{});
    }
  }, []);
  return a;
}

// Bandeau visiteur (non connecté)
export function VisitorBanner({ access }: { access: Access }) {
  if (!access.ready || access.loggedIn) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14, flexWrap:"wrap", padding:"10px 16px", background:"linear-gradient(90deg,rgba(192,57,43,0.18),rgba(74,144,217,0.12))", borderBottom:"1px solid rgba(192,57,43,0.3)", fontSize:".72rem", color:"var(--text)" }}>
      👀 <span>Vous explorez en <strong>mode visiteur</strong> — consultez librement. Pour trader et utiliser les bots, créez un compte (gratuit).</span>
      <Link href="/register" style={{ padding:"6px 14px", borderRadius:7, background:"var(--red)", color:"white", textDecoration:"none", fontWeight:700, fontSize:".68rem" }}>Créer un compte</Link>
    </div>
  );
}

// Bandeau de fin de démo
export function DemoResetBanner() {
  const [show, setShow] = useState(false);
  useEffect(()=>{ if (localStorage.getItem("aibed_demo_reset")==="1") setShow(true); },[]);
  if (!show) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, flexWrap:"wrap", padding:"10px 16px", background:"rgba(251,191,36,0.12)", borderBottom:"1px solid rgba(251,191,36,0.3)", fontSize:".72rem", color:"#fbbf24" }}>
      ⏳ <span>Votre semaine d&apos;essai démo est terminée et a été réinitialisée. Passez à un abonnement pour débloquer les fonctions réelles, ou continuez en démo.</span>
      <Link href="/register?plan=starter" style={{ padding:"6px 14px", borderRadius:7, background:"#fbbf24", color:"#04071a", textDecoration:"none", fontWeight:700, fontSize:".68rem" }}>S&apos;abonner</Link>
      <button onClick={()=>{localStorage.removeItem("aibed_demo_reset");setShow(false);}} style={{ background:"none", border:"none", color:"var(--muted2)", cursor:"pointer", fontSize:".9rem" }}>✕</button>
    </div>
  );
}

// Voile de verrouillage : enfants floutés + appel à l'action si accès insuffisant
export function PlanGate({ access, need, children, label }: { access:Access; need:"account"|"subscription"; children:React.ReactNode; label?:string }) {
  const ok = need === "account" ? access.loggedIn : access.paid;
  if (!access.ready || ok) return <>{children}</>;
  const isAccount = need === "account";
  return (
    <div style={{ position:"relative" }}>
      <div style={{ filter:"blur(4px)", pointerEvents:"none", userSelect:"none", opacity:0.5 }}>{children}</div>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, padding:20, textAlign:"center", background:"rgba(4,7,26,0.55)", borderRadius:12 }}>
        <div style={{ fontSize:"1.6rem" }}>{isAccount?"🔒":"⭐"}</div>
        <div style={{ fontSize:".8rem", fontWeight:700, color:"white" }}>{label || (isAccount ? "Créez un compte pour y accéder" : "Réservé aux abonnés")}</div>
        <div style={{ fontSize:".66rem", color:"var(--muted2)", maxWidth:300, lineHeight:1.5 }}>
          {isAccount ? "Inscrivez-vous gratuitement pour interagir avec la plateforme." : "Cette fonctionnalité (bots & automatisation) nécessite un abonnement à partir de 9,90 €/mois. Vous pouvez changer ou annuler à tout moment."}
        </div>
        <Link href={isAccount?"/register":"/register?plan=starter"} style={{ padding:"9px 18px", borderRadius:8, background:"var(--red)", color:"white", textDecoration:"none", fontWeight:700, fontSize:".74rem", boxShadow:"0 0 16px var(--red-glow)" }}>
          {isAccount ? "Créer un compte gratuit" : "Voir les abonnements"}
        </Link>
      </div>
    </div>
  );
}
