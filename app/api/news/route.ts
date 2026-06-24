import { NextResponse } from "next/server";

// Vraies actualités crypto via flux RSS gratuits (sans clé).
const FEEDS = [
  { url: "https://cointelegraph.com/rss", source: "Cointelegraph" },
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml", source: "CoinDesk" },
];

function strip(s: string) {
  return s.replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
}
function tag(block: string, name: string) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? strip(m[1]) : "";
}

export async function GET() {
  const out: { id:string; title:string; url:string; source:string; ts:number; tags:string[] }[] = [];
  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, { next: { revalidate: 300 }, headers: { "User-Agent": "Mozilla/5.0" } });
      if (!res.ok) continue;
      const xml = await res.text();
      const items = xml.match(/<item[\s\S]*?<\/item>/g) || [];
      for (const it of items.slice(0, 15)) {
        const title = tag(it, "title");
        const link = tag(it, "link") || (it.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] || "").trim();
        const pub = tag(it, "pubDate");
        const cat = (it.match(/<category[^>]*>([\s\S]*?)<\/category>/i)?.[1] || "");
        if (!title) continue;
        out.push({ id: link || title, title, url: link, source: feed.source, ts: pub ? new Date(pub).getTime() : Date.now(), tags: cat ? [strip(cat)] : [] });
      }
    } catch {}
  }
  out.sort((a, b) => b.ts - a.ts);
  return NextResponse.json({ news: out.slice(0, 30) });
}
