import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const FOUNDER_EMAIL = "ramos.o62oo@gmail.com";

export async function GET(req: NextRequest) {
  const requester = (req.nextUrl.searchParams.get("requester") || "").toLowerCase();
  if (requester !== FOUNDER_EMAIL) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name, pseudo, phone, role, plan, subscription_status, created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const PAID = ["starter", "pro", "elite"];
  const users = (data || []).map((u) => ({
    ...u,
    memberId: "AIBED-" + String(u.id).replace(/-/g, "").slice(0, 6).toUpperCase(),
    isPaid: u.role === "founder" || (u.subscription_status === "active" && PAID.includes(u.plan)),
  }));
  const stats = {
    total: users.length,
    paid: users.filter((u) => u.isPaid && u.role !== "founder").length,
    free: users.filter((u) => !u.isPaid).length,
  };
  return NextResponse.json({ users, stats });
}
