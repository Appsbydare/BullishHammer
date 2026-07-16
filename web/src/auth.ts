import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Password",
      credentials: {
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.password) return null;
        
        // Securely compare provided password to the environment variable
        if (credentials.password === process.env.ADMIN_PASSWORD?.trim()) {
          // Return a mock user object (since we are only doing password auth)
          return { id: "admin", name: "Bullish Hammer Admin", email: "admin@bullishhammer.com" };
        }
        return null; // Login failed
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60,
  },
  pages: {
    signIn: "/admin",
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
});
