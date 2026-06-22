import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { supabaseAdmin } from "@/lib/supabase";

const FOUNDER_EMAIL = "ramos.o62oo@gmail.com";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  trustHost: true,
  callbacks: {
    async signIn({ user }) {
      // Enregistrer / mettre à jour le compte Google dans Supabase
      if (user?.email) {
        const isFounder = user.email.toLowerCase() === FOUNDER_EMAIL;
        try {
          await supabaseAdmin.from("profiles").upsert({
            email: user.email.toLowerCase(),
            full_name: user.name || undefined,
            role: isFounder ? "founder" : "user",
            plan: isFounder ? "elite" : "none",
            subscription_status: isFounder ? "active" : "inactive",
          }, { onConflict: "email" });
        } catch { /* ne bloque pas la connexion */ }
      }
      return true;
    },
    async session({ session }) {
      if (session.user?.email?.toLowerCase() === FOUNDER_EMAIL) {
        // @ts-expect-error - champs personnalisés
        session.user.role = "founder";
        // @ts-expect-error - champs personnalisés
        session.user.plan = "elite";
      } else {
        // @ts-expect-error - champs personnalisés
        session.user.role = "user";
        // @ts-expect-error - champs personnalisés
        session.user.plan = "starter";
      }
      return session;
    },
  },
});
