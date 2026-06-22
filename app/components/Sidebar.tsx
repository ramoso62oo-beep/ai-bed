"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  ["📊","Dashboard","/dashboard"],
  ["🤖","Mes bots","/mes-bots"],
  ["📈","Positions","/positions"],
  ["🐋","Whale Tracker","/whale-tracker"],
  ["⚡","Signaux IA","/signaux"],
];
const ACCOUNT = [
  ["💼","Portefeuille","/portefeuille"],
  ["📰","Actualités","/actualites"],
  ["⚙️","Paramètres","/settings"],
];

export default function Sidebar({ founder }: { founder?: boolean }) {
  const path = usePathname();
  const sb: React.CSSProperties = { display:"flex", alignItems:"center", gap:11, padding:"10px 16px", fontSize:".74rem", borderLeft:"2px solid transparent", cursor:"pointer", textDecoration:"none" };

  const item = (ic:string, lb:string, href:string) => {
    const act = path === href;
    return (
      <Link key={href} href={href} style={{ ...sb, color:act?"white":"var(--muted)", borderLeftColor:act?"var(--red)":"transparent", background:act?"rgba(192,57,43,0.06)":"transparent" }}>
        <span>{ic}</span><span>{lb}</span>
      </Link>
    );
  };

  return (
    <aside style={{ background:"rgba(6,13,46,0.95)", backdropFilter:"blur(20px)", borderRight:"1px solid rgba(10,26,92,0.6)", display:"flex", flexDirection:"column", paddingTop:56, overflow:"hidden" }}>
      <div style={{ padding:"16px 14px", borderBottom:"1px solid rgba(10,26,92,0.6)", textAlign:"center" }}>
        <Link href="/dashboard" style={{ textDecoration:"none", display:"block" }}>
          <span style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1.05rem", fontWeight:900, color:"white" }}>AI-<span style={{ color:"var(--red)" }}>BED</span></span>
        </Link>
        {founder && <div style={{ display:"inline-block", marginTop:9, fontSize:".5rem", background:"rgba(192,57,43,0.1)", border:"1px solid rgba(192,57,43,0.3)", borderRadius:20, padding:"3px 10px", color:"var(--red)", fontWeight:700, letterSpacing:".08em" }}>👑 FONDATEUR</div>}
      </div>
      <div style={{ padding:"6px 0", flex:1 }}>
        {NAV.map(([ic,lb,href])=>item(ic,lb,href))}
        <div style={{ padding:"6px 14px 4px", fontSize:".5rem", color:"#1a3a6e", textTransform:"uppercase", letterSpacing:".18em", marginTop:8 }}>Compte</div>
        {ACCOUNT.map(([ic,lb,href])=>item(ic,lb,href))}
        <Link href="/" style={{ ...sb, marginTop:4, color:"var(--muted)" }}><span>🚪</span><span>Déconnexion</span></Link>
      </div>
    </aside>
  );
}
