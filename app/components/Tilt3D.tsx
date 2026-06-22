"use client";
import { useRef } from "react";

// Carte avec inclinaison 3D qui suit la souris + lueur dynamique
export default function Tilt3D({ children, style, intensity=10, glow=true }: {
  children: React.ReactNode; style?: React.CSSProperties; intensity?: number; glow?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function move(e: React.MouseEvent) {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (0.5 - py) * intensity;
    const ry = (px - 0.5) * intensity;
    el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
    if (glow) {
      el.style.boxShadow = `${(px-0.5)*-24}px ${(py-0.5)*-24}px 40px rgba(192,57,43,0.25), 0 10px 30px rgba(0,0,0,0.4)`;
      el.style.borderColor = "rgba(192,57,43,0.4)";
    }
  }
  function leave() {
    const el = ref.current; if (!el) return;
    el.style.transform = "perspective(800px) rotateX(0) rotateY(0) translateZ(0)";
    el.style.boxShadow = "";
    el.style.borderColor = "";
  }

  return (
    <div ref={ref} onMouseMove={move} onMouseLeave={leave}
      style={{ transition:"transform .15s ease-out, box-shadow .2s, border-color .2s", transformStyle:"preserve-3d", willChange:"transform", ...style }}>
      {children}
    </div>
  );
}
