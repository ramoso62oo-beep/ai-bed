import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { supabaseAdmin } from "@/lib/supabase";

const FOUNDER_EMAIL = "ramos.o62oo@gmail.com";
const PAID = ["starter", "pro", "elite"];

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  trustHost: true,
  callbacks: {
    async signIn({ user }) {
      if (user?.email) {
        const email = user.email.toLowerCase();
        const isFounder = email === FOUNDER_EMAIL;
        try {
          // Le compte existe-t-il déjà ?
          const { data: existing } = await supabaseAdmin.from("profiles").select("email").eq("email", email).single();
          if (!existing) {
            // Nouveau compte → AUCUN plan payant (sauf fondateur)
            await supabaseAdmin.from("profiles").insert({
              email, full_name: user.name || undefined,
              role: isFounder ? "founder" : "user",
              plan: isFounder ? "elite" : "none",
              subscription_status: isFounder ? "active" : "inactive",
            });
          } else if (isFounder) {
            await supabaseAdmin.from("profiles").update({ role: "founder", plan: "elite", subscription_status: "active" }).eq("email", email);
          }
          // Compte existant non-fondateur : on ne touche PAS à son plan (préserve les abonnés payants)
        } catch { /* ne bloque pas la connexion */ }
      }
      return true;
    },
    async session({ session }) {
      const email = session.user?.email?.toLowerCase();
      if (!email) return session;
      if (email === FOUNDER_EMAIL) {
        // @ts-expect-error champs perso
        session.user.role = "founder";
        // @ts-expect-error champs perso
        session.user.plan = "elite";
        return session;
      }
      // Plan RÉEL depuis la base (none tant que pas payé)
      let plan = "none";
      try {
        const { data } = await supabaseAdmin.from("profiles").select("plan, subscription_status").eq("email", email).single();
        if (data && data.subscription_status === "active" && PAID.includes(data.plan)) plan = data.plan;
      } catch {}
      // @ts-expect-error champs perso
      session.user.role = "user";
      // @ts-expect-error champs perso
      session.user.plan = plan;
      return session;
    },
  },
});
