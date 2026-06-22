import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const FOUNDER_EMAIL = "ramos.o62oo@gmail.com";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  trustHost: true,
  callbacks: {
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
