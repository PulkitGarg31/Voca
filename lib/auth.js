import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import connectDB from "./mongodb";
import User from "@/models/User";
import { rateLimit } from "./rateLimit";

// Google sign-in is enabled only when its credentials are configured.
const providers = [];
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions = {
  providers: [
    ...providers,
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        // Reject non-string credentials before they reach the query (avoids
        // NoSQL operator injection / type-confusion).
        if (typeof email !== "string" || typeof password !== "string") return null;
        if (!email || !password) return null;

        // Throttle password guessing per email (IP-independent).
        const normalized = email.toLowerCase().trim();
        if (!rateLimit(`login:${normalized}`, { limit: 10, windowMs: 60_000 }).ok) return null;

        await connectDB();
        const user = await User.findOne({ email: normalized }).select("+password");
        if (!user || !user.password) return null;

        const isMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isMatch) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    // Only allow Google sign-in for verified emails (prevents account hijack via
    // an IdP asserting an unverified address that matches an existing account).
    async signIn({ account, profile }) {
      if (account?.provider === "google") return profile?.email_verified === true;
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      // Google sign-in: find or create the matching DB user, use its _id.
      if (account?.provider === "google" && user?.email) {
        await connectDB();
        const email = user.email.toLowerCase().trim();
        let dbUser = await User.findOne({ email });
        if (!dbUser) {
          dbUser = await User.create({ name: user.name || "User", email, image: user.image || null });
        }
        token.id = dbUser._id.toString();
        token.name = dbUser.name;
      } else if (user) {
        token.id = user.id; // credentials
      }
      // Reflect profile updates (e.g. name change) without re-login.
      if (trigger === "update" && session?.name) token.name = session.name;
      return token;
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id;
      if (token?.name) session.user.name = token.name;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
