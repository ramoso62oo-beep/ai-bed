"use client";
import { useEffect, useState, useCallback } from "react";
import Tooltip from "./Tooltip";

// Réseaux connus (chainId hex → infos)
const CHAINS: Record<string, { name:string; sym:string }> = {
  "0x1":  { name:"Ethereum", sym:"ETH" },
  "0x38": { name:"BNB Chain", sym:"BNB" },
  "0x89": { name:"Polygon", sym:"MATIC" },
  "0xa4b1": { name:"Arbitrum", sym:"ETH" },
  "0xa": { name:"Optimism", sym:"ETH" },
  "0x2105": { name:"Base", sym:"ETH" },
};

type Eth = {
  request: (a:{method:string; params?:unknown[]})=>Promise<unknown>;
  on?: (e:string, cb:(...a:unknown[])=>void)=>void;
  removeListener?: (e:string, cb:(...a:unknown[])=>void)=>void;
  isMetaMask?: boolean;
};
function getEth(): Eth | undefined {
  return (typeof window !== "undefined" ? (window as unknown as { ethereum?: Eth }).ethereum : undefined);
}

export default function ConnectWallet({ email }: { email?: string }) {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [chain, setChain] = useState<{name:string;sym:string}|null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  // transfert
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");

  const refresh = useCallback(async (addr: string) => {
    const eth = getEth(); if (!eth) return;
    try {
      const cid = await eth.request({ method:"eth_chainId" }) as string;
      setChain(CHAINS[cid] || { name:`Réseau ${cid}`, sym:"ETH" });
      const wei = await eth.request({ method:"eth_getBalance", params:[addr,"latest"] }) as string;
      setBalance((parseInt(wei,16)/1e18).toFixed(5));
    } catch {}
  }, []);

  // Reconnexion automatique si déjà autorisé
  useEffect(() => {
    const eth = getEth(); if (!eth) return;
    eth.request({ method:"eth_accounts" }).then((accs)=>{
      const a = (accs as string[])[0];
      if (a) { setAddress(a); refresh(a); }
    }).catch(()=>{});
    const onAcc = (...a:unknown[]) => { const acc=(a[0] as string[])[0]||""; setAddress(acc); if(acc)refresh(acc); };
    const onChain = () => { if(address) refresh(address); };
    eth.on?.("accountsChanged", onAcc);
    eth.on?.("chainChanged", onChain);
    return () => { eth.removeListener?.("accountsChanged", onAcc); eth.removeListener?.("chainChanged", onChain); };
  }, [refresh, address]);

  async function connect() {
    const eth = getEth();
    if (!eth) { setErr("Aucun wallet détecté. Installez MetaMask (metamask.io) ou ouvrez le site dans le navigateur de votre wallet."); return; }
    setErr(""); setBusy(true);
    try {
      const accs = await eth.request({ method:"eth_requestAccounts" }) as string[];
      const a = accs[0];
      setAddress(a);
      await refresh(a);
      // Mémoriser l'adresse dans le profil
      if (email) {
        fetch("/api/wallet-address", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email, address:a }) }).catch(()=>{});
      }
    } catch {
      setErr("Connexion refusée.");
    }
    setBusy(false);
  }

  async function send() {
    const eth = getEth(); if (!eth || !address) return;
    setErr(""); setTxHash("");
    if (!to || to.length < 10) { setErr("Adresse destinataire invalide."); return; }
    const val = parseFloat(amount);
    if (!val || val <= 0) { setErr("Montant invalide."); return; }
    setBusy(true);
    try {
      const wei = "0x" + Math.floor(val * 1e18).toString(16);
      const hash = await eth.request({ method:"eth_sendTransaction", params:[{ from:address, to, value:wei }] }) as string;
      setTxHash(hash);
      setTo(""); setAmount("");
      setTimeout(()=>refresh(address), 3000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Transaction annulée.");
    }
    setBusy(false);
  }

  const card: React.CSSProperties = { background:"rgba(6,13,46,0.6)", backdropFilter:"blur(20px)", border:"1px solid rgba(10,26,92,0.6)", borderRadius:12, padding:"22px 24px" };
  const inp: React.CSSProperties = { width:"100%", background:"rgba(4,7,26,0.6)", border:"1px solid rgba(74,111,165,0.3)", borderRadius:8, padding:"11px 14px", color:"white", fontSize:".82rem", outline:"none", marginTop:6 };

  if (!address) {
    return (
      <div style={{ ...card, textAlign:"center" }}>
        <div style={{ fontSize:"2.4rem", marginBottom:10 }}>👛</div>
        <div style={{ fontSize:".9rem", fontWeight:700, color:"white", marginBottom:6 }}>Connectez votre wallet</div>
        <div style={{ fontSize:".7rem", color:"var(--muted)", marginBottom:18, lineHeight:1.5 }}>
          AI-BED ne détient jamais vos fonds. Connectez votre propre wallet (MetaMask, etc.) pour garder le contrôle total de vos cryptos.
        </div>
        {err && <div style={{ background:"rgba(192,57,43,0.1)", border:"1px solid rgba(192,57,43,0.3)", borderRadius:6, padding:"8px 12px", fontSize:".68rem", color:"var(--red)", marginBottom:14 }}>{err}</div>}
        <button onClick={connect} disabled={busy} style={{ padding:"13px 28px", borderRadius:8, background:"var(--red)", color:"white", border:"none", fontSize:".82rem", fontWeight:700, cursor:"pointer", boxShadow:"0 0 20px var(--red-glow)" }}>
          {busy ? "Connexion…" : "🦊 Connecter mon wallet"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display:"grid", gap:16 }}>
      <div style={card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
          <div>
            <div style={{ fontSize:".62rem", color:"var(--muted2)", textTransform:"uppercase", letterSpacing:".08em" }}>Wallet connecté</div>
            <div style={{ fontSize:".9rem", color:"white", fontWeight:600, marginTop:4, fontFamily:"monospace" }}>{address.slice(0,8)}…{address.slice(-6)}</div>
          </div>
          <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:".64rem", color:"var(--green)", fontWeight:600 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"var(--green)" }}/> {chain?.name}
          </span>
        </div>
        <div style={{ fontSize:".62rem", color:"var(--muted2)", textTransform:"uppercase", letterSpacing:".08em" }}>Solde</div>
        <div style={{ fontSize:"1.7rem", fontWeight:900, color:"white", fontFamily:"var(--font-orbitron,monospace)", margin:"4px 0" }}>{balance} {chain?.sym}</div>
      </div>

      {/* Transfert réel */}
      <div style={card}>
        <Tooltip text="Envoie de la crypto depuis VOTRE wallet vers n'importe quelle adresse. La transaction est signée par vous dans MetaMask — AI-BED n'y touche jamais.">
          <div style={{ fontSize:".7rem", fontWeight:700, color:"white", textTransform:"uppercase", letterSpacing:".08em", marginBottom:14, cursor:"help" }}>➡ Transférer vers un autre wallet ⓘ</div>
        </Tooltip>
        {err && <div style={{ background:"rgba(192,57,43,0.1)", border:"1px solid rgba(192,57,43,0.3)", borderRadius:6, padding:"8px 12px", fontSize:".66rem", color:"var(--red)", marginBottom:12 }}>{err}</div>}
        {txHash && <div style={{ background:"rgba(39,174,96,0.1)", border:"1px solid rgba(39,174,96,0.3)", borderRadius:6, padding:"8px 12px", fontSize:".64rem", color:"var(--green)", marginBottom:12, wordBreak:"break-all" }}>✓ Transaction envoyée : {txHash.slice(0,20)}…</div>}
        <label style={{ fontSize:".64rem", color:"var(--muted2)" }}>Adresse destinataire</label>
        <input style={inp} value={to} onChange={e=>setTo(e.target.value)} placeholder="0x..." />
        <label style={{ fontSize:".64rem", color:"var(--muted2)", display:"block", marginTop:12 }}>Montant ({chain?.sym})</label>
        <input style={inp} type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.01" />
        <button onClick={send} disabled={busy} style={{ width:"100%", marginTop:16, padding:13, borderRadius:8, background:"var(--red)", color:"white", border:"none", fontSize:".8rem", fontWeight:700, cursor:"pointer", boxShadow:"0 0 20px var(--red-glow)" }}>
          {busy ? "En cours…" : "Envoyer"}
        </button>
      </div>
    </div>
  );
}
