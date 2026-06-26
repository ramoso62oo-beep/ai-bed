"use client";
import { useEffect, useRef, useState } from "react";

type Toast = { id:number; type:"buy"|"sell"; text:string; detail:string };
type Log = { signal:string; action:string; detail:string; created_at:string };

function beep(up:boolean){
  try {
    const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new Ctx();
    const notes = up ? [660, 880] : [440, 330];
    notes.forEach((f,i)=>{
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.type="sine"; o.frequency.value=f;
      const t = ctx.currentTime + i*0.16;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t+0.02); g.gain.exponentialRampToValueAtTime(0.0001, t+0.18);
      o.start(t); o.stop(t+0.2);
    });
  } catch {}
}

export default function BotNotifier({ email }: { email?: string }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastSeen = useRef<number>(0);
  const idRef = useRef(0);
  const enabled = useRef(true);

  useEffect(()=>{
    try{ lastSeen.current = Number(localStorage.getItem("aibed_lastlog")||"0"); }catch{}
    try{ enabled.current = localStorage.getItem("aibed_notif")!=="off"; }catch{}
    if (typeof Notification!=="undefined" && Notification.permission==="default") { Notification.requestPermission().catch(()=>{}); }
  },[]);

  useEffect(()=>{
    if (!email) return;
    const check = async () => {
      if (!enabled.current) return;
      try {
        const d = await fetch(`/api/bot/config?email=${encodeURIComponent(email)}`).then(r=>r.json());
        const logs: Log[] = d.logs || [];
        // Nouvelles actions d'achat/vente non encore notifiées
        const fresh = logs
          .filter(l => /ACHAT|VENTE|STOP-LOSS|TAKE-PROFIT/i.test(l.action))
          .map(l => ({ ...l, ts: new Date(l.created_at).getTime() }))
          .filter(l => l.ts > lastSeen.current)
          .sort((a,b)=>a.ts-b.ts);
        if (fresh.length) {
          for (const l of fresh) {
            const isBuy = /ACHAT/i.test(l.action);
            const type = isBuy ? "buy" : "sell";
            const text = l.action;
            const id = ++idRef.current;
            setToasts(t => [...t, { id, type, text, detail: l.detail }]);
            beep(isBuy);
            if (typeof Notification!=="undefined" && Notification.permission==="granted") {
              try { new Notification(isBuy?"🟢 Achat du bot":"🔴 Vente du bot", { body: l.action }); } catch {}
            }
            setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)), 9000);
          }
          lastSeen.current = fresh[fresh.length-1].ts;
          try{ localStorage.setItem("aibed_lastlog", String(lastSeen.current)); }catch{}
        }
      } catch {}
    };
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  },[email]);

  if (!toasts.length) return null;
  return (
    <div style={{ position:"fixed", right:18, bottom:18, zIndex:9998, display:"flex", flexDirection:"column", gap:10, maxWidth:320 }}>
      {toasts.map(t=>(
        <div key={t.id} style={{ background:"rgba(6,13,46,0.98)", border:`1px solid ${t.type==="buy"?"rgba(39,174,96,0.5)":"rgba(192,57,43,0.5)"}`, borderRadius:12, padding:"12px 14px", boxShadow:"0 8px 30px rgba(0,0,0,0.5)", animation:"fadeUp .35s" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <span style={{ fontSize:"1.1rem" }}>{t.type==="buy"?"🟢":"🔴"}</span>
            <span style={{ fontSize:".78rem", fontWeight:700, color:"white" }}>{t.text}</span>
          </div>
          <div style={{ fontSize:".62rem", color:"var(--muted)", lineHeight:1.4 }}>{t.detail}</div>
        </div>
      ))}
    </div>
  );
}
