import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";

const baseURL =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
const secret =
  process.env.BETTER_AUTH_SECRET ??
  process.env.NEXT_PUBLIC_BETTER_AUTH_SECRET ??
  "autohaus-development-secret";

if (!process.env.BETTER_AUTH_SECRET) {
  console.warn(
    "BETTER_AUTH_SECRET is not set. Using a fallback secret for build/deploy only. Set BETTER_AUTH_SECRET in production.",
  );
}

/**
 * Better Auth — server instance.
 * Email/password auth backed by Prisma (PostgreSQL / Neon).
 * `role` is an additional user field (not client-settable) used by the RBAC layer.
 */
export const auth = betterAuth({
  appName: "AutoHaus Admin",
  secret,
  baseURL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh once per day
    cookieCache: { enabled: true, maxAge: 5 * 60 }, // 5-min signed cache to cut DB reads
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "read_only",
        input: false, // never set by the client; only by admins server-side
      },
    },
  },

  advanced: {
    cookiePrefix: "autohaus",
  },

  // nextCookies() must be the LAST plugin — it flushes Set-Cookie from server actions.
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
