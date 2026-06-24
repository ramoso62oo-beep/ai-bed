import { NextResponse } from "next/server";

// Vraies actualités crypto via CryptoCompare (gratuit, sans clé).
export async function GET() {
  try {
    const res = await fetch("https://min-api.cryptocompare.com/data/v2/news/?lang=EN", { next: { revalidate: 120 } });
    if (!res.ok) return NextResponse.json({ news: [], error: `news ${res.status}` });
    const d = await res.json();
    const news = (d.Data || []).slice(0, 30).map((n: Record<string, unknown>) => ({
      id: n.id, title: n.title, url: n.url, source: n.source_info && (n.source_info as { name?:string }).name || n.source,
      ts: (n.published_on as number) * 1000,
      tags: String(n.categories || "").split("|").filter(Boolean).slice(0, 2),
    }));
    return NextResponse.json({ news });
  } catch (err) {
    return NextResponse.json({ news: [], error: err instanceof Error ? err.message : "Erreur" });
  }
}
