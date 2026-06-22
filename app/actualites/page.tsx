"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import NewsFeed from "../components/NewsFeed";

export default function ActualitesPage() {
  const [user, setUser] = useState<{role?:string}>({});
  useEffect(()=>{ try{ setUser(JSON.parse(localStorage.getItem("aibed_user")||"{}")); }catch{} },[]);

  return (
    <div style={{ display:"grid", gridTemplateColumns:"210px 1fr", height:"100vh", background:"var(--navy)", overflow:"hidden" }}>
      <div className="cyber-grid" />
      <Sidebar founder={user.role==="founder"} />
      <div style={{ overflowY:"auto", padding:"78px 28px 40px", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
          <h1 style={{ fontFamily:"var(--font-orbitron,monospace)", fontSize:"1.3rem", fontWeight:900, color:"white" }}>📰 Actualités IA</h1>
          <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:".62rem", color:"var(--green)", fontWeight:600 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"var(--green)", animation:"pulse-red 1.5s infinite" }}/> En direct
          </span>
        </div>
        <p style={{ fontSize:".72rem", color:"var(--muted)", marginBottom:22 }}>Flux d&apos;actualités crypto analysé par l&apos;IA, avec impact estimé sur le marché. Mis à jour en continu.</p>
        <NewsFeed max={20} />
      </div>
    </div>
  );
}
