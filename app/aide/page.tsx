"use client";
import Link from "next/link";
import { useState } from "react";

const STEPS: { icon:string; title:string; body:React.ReactNode }[] = [
  { icon:"📝", title:"1. Créer un compte", body:<>Cliquez sur <b>S&apos;inscrire</b>, entrez votre email et un mot de passe (ou utilisez <b>Google</b>). Un compte gratuit donne accès à la consultation, au marché, et au trading de base. Pour les <b>bots et l&apos;automatisation</b>, il faut un abonnement.</> },
  { icon:"💳", title:"2. Choisir un abonnement", body:<>3 formules : <b>Starter (9,90€)</b> · <b>Pro (29,90€)</b> · <b>Elite (79,90€)</b>. Vous pouvez <b>changer ou annuler à tout moment</b> depuis Paramètres → Mon abonnement. Sans abonnement, vous restez en accès gratuit (sans bots).</> },
  { icon:"🎭", title:"3. Démo ou Réel ?", body:<>Le bouton <b>DÉMO / RÉEL</b> (en haut à gauche du dashboard) bascule tout le site. En <b>Démo</b>, l&apos;argent est fictif — parfait pour s&apos;entraîner sans risque. En <b>Réel</b>, vous tradez avec votre vrai compte connecté.</> },
  { icon:"🔌", title:"4. Connecter votre plateforme", body:<>Allez dans <b>Connexions</b> ou <b>Mes bots</b>. Connectez votre compte d&apos;échange (<b>Binance</b>, Bybit, OKX…) via vos <b>clés API</b>, OU votre <b>wallet</b> (MetaMask). Astuce sécurité : créez la clé API avec le <b>trading activé</b> mais les <b>retraits désactivés</b>. Commencez en <b>testnet</b> (argent fictif).</> },
  { icon:"🤖", title:"5. Créer un bot", body:<>Dans <b>Mes bots</b>, cliquez <b>Créer un nouveau bot</b>. Donnez-lui un nom, un avatar, et un mode de risque : <b>Patient</b> (prudent), <b>Actif</b> (équilibré) ou <b>Agressif</b> (offensif).</> },
  { icon:"🎯", title:"6. Confier des cryptos à un bot", body:<>Dans <b>Marché</b> ou <b>Marché mondial</b>, cliquez sur le bouton <b>Trader</b> d&apos;une crypto. Choisissez à quel <b>bot</b> (parmi les vôtres) la confier, et le <b>niveau de risque</b>. Le bot s&apos;occupera de cette crypto.</> },
  { icon:"⚡", title:"7. Activer le trading automatique", body:<>Dans <b>Mes bots → Trading automatique</b> (ou la pastille <b>ACTIF/PAUSE</b> du dashboard), activez le bot. Il analysera le marché (RSI + Bollinger) et passera des ordres tout seul, 24/7, selon votre mode de risque.</> },
  { icon:"📊", title:"8. Suivre vos gains", body:<>Le panneau <b>Suivi temps réel</b> (Mes bots) et les <b>KPIs du dashboard</b> affichent votre solde réel, votre position, et votre <b>gain/perte en %</b> et en <b>USDT</b>, mis à jour en direct. Boutons : <b>STOP</b>, <b>Prendre la main</b> (manuel), <b>Vendre maintenant</b>.</> },
  { icon:"💼", title:"9. Votre portefeuille", body:<>La page <b>Portefeuille</b> montre votre wallet connecté (non-custodial : vos fonds restent chez vous). Vous pouvez transférer vos cryptos vers une autre adresse, ou faire un <b>Swap</b> on-chain via la page Swap.</> },
  { icon:"🔒", title:"10. Sécurité & risques", body:<>AI-BED ne détient <b>jamais</b> vos fonds. Vos clés sont chiffrées. ⚠️ Le trading comporte un <b>risque réel de perte</b> — aucune garantie de gain. Entraînez-vous longtemps en <b>testnet/démo</b> avant le vrai argent. Voir les <Link href="/legal" style={{color:"var(--red)"}}>mentions légales</Link>.</> },
];

export default function AidePage() {
  const [open, setOpen] = useState<number|null>(0);
  return (
    <>
      <div className="cyber-grid" />
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, background:"rgba(4,7,26,0.9)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(10,26,92,0.6)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", height:56 }}>
        <Link href="/dashboard" style={{ textDecoration:"none", color:"var(--muted2)", fontSize:".78rem" }}>← Retour</Link>
        <span style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1rem", fontWeight:900, color:"white" }}>AI-<span style={{ color:"var(--red)" }}>BED</span></span>
      </nav>

      <div style={{ maxWidth:720, margin:"0 auto", padding:"86px 20px 60px", position:"relative", zIndex:1 }}>
        <h1 style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1.4rem", fontWeight:900, color:"white", marginBottom:6 }}>❓ Comment utiliser AI-BED</h1>
        <p style={{ fontSize:".76rem", color:"var(--muted)", marginBottom:24 }}>Suivez ces 10 étapes pour démarrer, de la création du compte au trading automatique. Cliquez sur une étape pour la déplier.</p>

        <div style={{ display:"grid", gap:10 }}>
          {STEPS.map((s,i)=>(
            <div key={i} style={{ background:"rgba(6,13,46,0.6)", border:`1px solid ${open===i?"rgba(192,57,43,0.4)":"rgba(10,26,92,0.6)"}`, borderRadius:12, overflow:"hidden" }}>
              <button onClick={()=>setOpen(open===i?null:i)} style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"14px 18px", background:"transparent", border:"none", cursor:"pointer", textAlign:"left" }}>
                <span style={{ fontSize:"1.3rem" }}>{s.icon}</span>
                <span style={{ flex:1, fontSize:".84rem", fontWeight:700, color:"white" }}>{s.title}</span>
                <span style={{ color:"var(--red)", fontSize:"1rem", transform:open===i?"rotate(45deg)":"none", transition:"transform .2s" }}>＋</span>
              </button>
              {open===i && <div style={{ padding:"0 18px 16px 48px", fontSize:".78rem", color:"var(--text)", lineHeight:1.7 }}>{s.body}</div>}
            </div>
          ))}
        </div>

        <div style={{ marginTop:28, padding:"18px 20px", borderRadius:12, background:"rgba(74,144,217,0.06)", border:"1px solid rgba(74,144,217,0.2)", textAlign:"center" }}>
          <div style={{ fontSize:".82rem", color:"white", fontWeight:700, marginBottom:6 }}>Une question ?</div>
          <div style={{ fontSize:".72rem", color:"var(--muted2)", marginBottom:12 }}>Écrivez-nous directement, on vous répond.</div>
          <Link href="/contact" style={{ display:"inline-block", padding:"9px 20px", borderRadius:8, background:"var(--red)", color:"white", textDecoration:"none", fontWeight:700, fontSize:".76rem" }}>💬 Nous contacter</Link>
        </div>
      </div>
    </>
  );
}
