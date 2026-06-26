"use client";
import { useState, useRef } from "react";

export default function Tooltip({ text, children, pos = "top" }: { text: string; children: React.ReactNode; pos?: "top" | "bottom" }) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLSpanElement>(null);

  function enter() {
    const el = ref.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setCoords({ x: r.left + r.width / 2, y: pos === "bottom" ? r.bottom : r.top });
    }
    setShow(true);
  }

  const bottom = pos === "bottom";

  return (
    <span ref={ref} onMouseEnter={enter} onMouseLeave={() => setShow(false)} style={{ display:"inline-flex", position:"relative" }}>
      {children}
      {show && (
        <span style={{
          position:"fixed", left:coords.x, top: bottom ? coords.y + 8 : coords.y - 8,
          transform: bottom ? "translate(-50%, 0)" : "translate(-50%,-100%)",
          background:"rgba(4,7,26,0.97)", border:"1px solid rgba(74,111,165,0.4)", borderRadius:8,
          padding:"8px 11px", fontSize:".64rem", color:"var(--text)", lineHeight:1.45, width:"max-content",
          maxWidth:220, zIndex:9999, boxShadow:"0 6px 24px rgba(0,0,0,0.5)", pointerEvents:"none", fontWeight:400,
          textTransform:"none", letterSpacing:"normal", textAlign:"left",
        }}>
          {text}
          <span style={{ position:"absolute", left:"50%", [bottom ? "top" : "bottom"]: -5, transform:"translateX(-50%)", width:9, height:9,
            background:"rgba(4,7,26,0.97)",
            [bottom ? "borderLeft" : "borderRight"]: "1px solid rgba(74,111,165,0.4)",
            [bottom ? "borderTop" : "borderBottom"]: "1px solid rgba(74,111,165,0.4)",
            rotate:"45deg" }}/>
        </span>
      )}
    </span>
  );
}
