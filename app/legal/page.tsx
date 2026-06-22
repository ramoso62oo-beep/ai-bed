"use client";
import Link from "next/link";
import { useState } from "react";

const TABS = [
  { id:"mentions", label:"Mentions légales" },
  { id:"cgu", label:"CGU / CGV" },
  { id:"risques", label:"Avertissement risques" },
  { id:"rgpd", label:"Confidentialité (RGPD)" },
];

export default function LegalPage() {
  const [tab, setTab] = useState("mentions");
  const h2: React.CSSProperties = { fontSize:".95rem", fontWeight:700, color:"white", margin:"22px 0 8px" };
  const p: React.CSSProperties = { fontSize:".8rem", color:"var(--text)", lineHeight:1.7, marginBottom:10 };
  const muted: React.CSSProperties = { fontSize:".72rem", color:"var(--muted2)", lineHeight:1.6 };

  return (
    <>
      <div className="cyber-grid" />
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, background:"rgba(4,7,26,0.9)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(10,26,92,0.6)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", height:56 }}>
        <Link href="/" style={{ textDecoration:"none", color:"var(--muted2)", fontSize:".78rem" }}>← Accueil</Link>
        <span style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1rem", fontWeight:900, color:"white" }}>AI-<span style={{ color:"var(--red)" }}>BED</span></span>
      </nav>

      <div style={{ maxWidth:780, margin:"0 auto", padding:"86px 20px 60px", position:"relative", zIndex:1 }}>
        <h1 style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1.3rem", fontWeight:900, color:"white", marginBottom:16 }}>📜 Informations légales</h1>

        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:24 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"8px 14px", borderRadius:8, fontSize:".72rem", fontWeight:700, cursor:"pointer", border:`1px solid ${tab===t.id?"var(--red)":"rgba(74,111,165,0.3)"}`, background:tab===t.id?"rgba(192,57,43,0.12)":"transparent", color:tab===t.id?"white":"var(--muted2)" }}>{t.label}</button>
          ))}
        </div>

        <div style={{ background:"rgba(6,13,46,0.6)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"24px 28px" }}>

          {tab==="mentions" && <div>
            <h2 style={h2}>Éditeur du site</h2>
            <p style={p}>Le site <strong>AI-BED</strong> (ci-après « la Plateforme ») est édité par son fondateur. Pour toute question, contactez-nous via la page <Link href="/contact" style={{color:"var(--red)"}}>Contact</Link>.</p>
            <p style={muted}>⚠️ À compléter : raison sociale, statut juridique (auto-entrepreneur, SAS…), numéro SIRET, adresse du siège, directeur de la publication.</p>
            <h2 style={h2}>Hébergement</h2>
            <p style={p}>Le site est hébergé par <strong>Vercel Inc.</strong>, 340 S Lemon Ave #4133, Walnut, CA 91789, USA. Base de données : <strong>Supabase</strong>. Paiements : <strong>Stripe</strong>.</p>
            <h2 style={h2}>Propriété intellectuelle</h2>
            <p style={p}>L&apos;ensemble des contenus de la Plateforme (textes, logos, interface, code) est protégé. Toute reproduction sans autorisation est interdite.</p>
          </div>}

          {tab==="cgu" && <div>
            <h2 style={h2}>1. Objet</h2>
            <p style={p}>AI-BED est une plateforme SaaS fournissant des outils d&apos;analyse et d&apos;automatisation de trading de crypto-actifs. La Plateforme est <strong>non-custodial</strong> : elle ne détient jamais les fonds des utilisateurs, qui restent sur leur propre compte d&apos;échange ou wallet.</p>
            <h2 style={h2}>2. Compte & accès</h2>
            <p style={p}>L&apos;accès aux fonctionnalités d&apos;interaction nécessite la création d&apos;un compte. Un compte gratuit donne accès au trading de base ; les bots et l&apos;automatisation nécessitent un abonnement payant.</p>
            <h2 style={h2}>3. Abonnements & paiement</h2>
            <p style={p}>Trois formules mensuelles sont proposées : Starter (9,90 €), Pro (29,90 €), Elite (79,90 €). Le paiement est géré de façon sécurisée par Stripe. L&apos;abonnement est reconduit automatiquement chaque mois.</p>
            <h2 style={h2}>4. Résiliation & modification</h2>
            <p style={p}>L&apos;utilisateur peut <strong>changer de formule ou résilier son abonnement à tout moment</strong>, sans frais, depuis ses Paramètres (portail Stripe). La résiliation prend effet à la fin de la période en cours. Aucun remboursement au prorata n&apos;est dû sauf disposition légale contraire (droit de rétractation de 14 jours pour les consommateurs, sauf renoncement exprès au démarrage immédiat du service).</p>
            <h2 style={h2}>5. Responsabilité</h2>
            <p style={p}>AI-BED fournit des outils, et non un conseil en investissement personnalisé. L&apos;utilisateur reste seul responsable de ses décisions de trading et de la configuration de ses bots. Voir l&apos;onglet « Avertissement risques ».</p>
          </div>}

          {tab==="risques" && <div>
            <div style={{ background:"rgba(192,57,43,0.1)", border:"1px solid rgba(192,57,43,0.35)", borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
              <div style={{ fontSize:".85rem", fontWeight:700, color:"var(--red)", marginBottom:6 }}>⚠️ Le trading de crypto-actifs comporte un risque élevé de perte</div>
              <div style={{ fontSize:".76rem", color:"var(--text)", lineHeight:1.6 }}>Vous pouvez perdre tout ou partie de votre capital. N&apos;investissez que ce que vous pouvez vous permettre de perdre.</div>
            </div>
            <h2 style={h2}>Aucune garantie de gain</h2>
            <p style={p}>Les performances passées ne préjugent pas des performances futures. AI-BED ne garantit aucun rendement. Les chiffres de rendement éventuellement affichés sont illustratifs et ne constituent pas une promesse.</p>
            <h2 style={h2}>Pas de conseil en investissement</h2>
            <p style={p}>AI-BED ne fournit pas de conseil financier, fiscal ou juridique personnalisé. Les bots exécutent des stratégies automatisées selon vos réglages ; les décisions et leurs conséquences vous incombent.</p>
            <h2 style={h2}>Cadre réglementaire (MiCA)</h2>
            <p style={p}>Les crypto-actifs sont encadrés en Europe par le règlement MiCA. Selon votre juridiction, certaines activités peuvent être réglementées. Informez-vous sur vos obligations fiscales et déclaratives.</p>
            <h2 style={h2}>Mode démo</h2>
            <p style={p}>Le mode démo utilise de l&apos;argent fictif à des fins de test uniquement. Les résultats en démo ne reflètent pas le trading réel.</p>
          </div>}

          {tab==="rgpd" && <div>
            <h2 style={h2}>Données collectées</h2>
            <p style={p}>Nous collectons : email, nom/prénom, numéro de téléphone (vérification 2FA), pseudo et photo (optionnels), et données techniques de connexion. Les clés API d&apos;échange sont <strong>chiffrées</strong> (AES-256). Nous ne stockons jamais vos mots de passe d&apos;échange ni vos clés privées de wallet.</p>
            <h2 style={h2}>Finalités & base légale</h2>
            <p style={p}>Ces données servent à fournir le service (exécution du contrat), assurer la sécurité (2FA) et gérer la facturation. Les paiements sont traités par Stripe ; nous ne stockons pas vos numéros de carte.</p>
            <h2 style={h2}>Conservation</h2>
            <p style={p}>Vos données sont conservées le temps de votre inscription, puis supprimées ou anonymisées dans un délai raisonnable après la clôture du compte.</p>
            <h2 style={h2}>Vos droits</h2>
            <p style={p}>Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de portabilité et d&apos;opposition. Pour les exercer, contactez-nous via la page <Link href="/contact" style={{color:"var(--red)"}}>Contact</Link>.</p>
            <h2 style={h2}>Cookies</h2>
            <p style={p}>La Plateforme utilise un stockage local (localStorage) et des cookies techniques nécessaires au fonctionnement (session, préférences). Aucun cookie publicitaire tiers n&apos;est utilisé sans consentement.</p>
          </div>}

          <p style={{ ...muted, marginTop:24, paddingTop:16, borderTop:"1px solid rgba(10,26,92,0.4)" }}>
            📌 Ce document est un modèle de bonne foi destiné à protéger les utilisateurs et l&apos;éditeur. Il est <strong>recommandé de le faire valider par un juriste</strong> avant tout lancement commercial à grande échelle. Dernière mise à jour : 2026.
          </p>
        </div>

        <div style={{ textAlign:"center", marginTop:20 }}>
          <Link href="/" style={{ fontSize:".74rem", color:"var(--muted)", textDecoration:"none" }}>← Retour à l&apos;accueil</Link>
        </div>
      </div>
    </>
  );
}
